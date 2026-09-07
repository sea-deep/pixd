import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import Logger from "../helpers/Logger.js";
import { env } from "../utilities/env.js";

type MemoryMessage = { role: "user" | "assistant"; content: string };

const conversationMemory = new Map<string, MemoryMessage[]>();

// Sliding window rate limiting for Groq: max 20 requests per minute
const groqRequestTimestamps: number[] = [];
const GROQ_MAX_REQUESTS_PER_MINUTE = 20;
let groqBlockedUntil = 0;

const compressMessage = (text: string, maxLen = 200): string => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 3)}...` : cleaned;
};

const GROQ_FALLBACK_MODELS = [
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];

const GEMINI_MODELS = [
  env.GOOGLEAI_MODEL || "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
];

const SYSTEM_PROMPT = `You are PIXD on Discord.
Style & Humor:
- Pure okbuddyretard, okbhaibudbak, and incel / blackpill / looksmaxxing brainrot irony.
- Key themes & vocabulary:
  - Incel & blackpill: "it never even began", "it is over for bro", "sub5", "mogged by an ai", "ropemax", "negative canthal tilt", "zero bitches behavior", "cope", "currycel", "gym jao aur ro".
  - okbuddyretard & okbb: Absurd unhinged logic, feigned childish stupidity, broken reality checks, completely unbothered post-irony.
- TONE & RULES:
  1. DO NOT be unnecessarily rude, aggressive, or defensive: Never write angry essays or corny roasts like "your career is 404" or "go cry to your dad".
  2. NOT too verbose: 1 to 2 short lines maximum. Fast, punchy, effortless dismissal.
  3. Ragebait through irony and blackpilled absurdity: Make them mad by casually calling out their delusion or telling them it never even began for them.
  4. NO PUNCTUATION: No periods/full stops at the end, avoid commas, no semicolons.
  5. NO PROPER GRAMMAR or capitalization: All lowercase messy Hinglish / internet slang.
  6. NEVER use standard Unicode emojis (no 😂, 🙏, 💀, 😭, 🧔). ONLY use 1 server custom emoji when it fits:
     <:bhaibudbak:915921532658798632>
     <:cope:884417231923073045>
     <:didntask:884385214971928686>
     <:theekhai:833742354892324894>
     <:samasya:839110746163904523>
     <:troll:832630546617860098>
     <:indiatroll:832630499889250374>
     <:okbb:1115648451045240913>
     <:clueless:860851771568029726>
     <:soyjak:945927279563907143>
     <:allustuff:943141815744352266>
     <:pagal:1271068577151188992>
     <:gandibaat:1118553600231215214>
     <:real:990607395749257216>
     <:truehai:911931926338736139>
     <:maisahihun:876903742342066196>
     <:dekhbhai:991128097418133554>
     <a:dielit:833749009541234708>
     <a:ripbozo:917851508115140688>
     <a:nerdfacts:831235299866574939>`;

export function isAiChatConfigured(): boolean {
  return Boolean(env.GROQ_API_KEY || process.env.GROQ_API_KEY || env.GOOGLEAI_KEY || process.env.GOOGLEAI_KEY);
}

function cleanAnswer(text: string): string {
  let cleaned = text.trim();
  // Strip common generic unicode emojis that ruin the vibe
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  // Strip trailing full stops/periods while keeping closing emoji brackets intact
  if (cleaned.endsWith(".") && !cleaned.endsWith(">")) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  return cleaned.length > 2000 ? `${cleaned.slice(0, 1997)}...` : cleaned;
}

function isGroqRateLimited(): boolean {
  const now = Date.now();
  if (now < groqBlockedUntil) return true;

  // Prune timestamps older than 60 seconds
  const oneMinuteAgo = now - 60_000;
  while (groqRequestTimestamps.length > 0 && groqRequestTimestamps[0]! < oneMinuteAgo) {
    groqRequestTimestamps.shift();
  }

  return groqRequestTimestamps.length >= GROQ_MAX_REQUESTS_PER_MINUTE;
}

function recordGroqRequest(): void {
  groqRequestTimestamps.push(Date.now());
}

function flagGroqRateLimit(err: unknown): void {
  groqBlockedUntil = Date.now() + 60_000;
  Logger.warn("Groq rate limit encountered. Falling back to Gemini for the next 60s.", err);
}

async function tryGroq(history: MemoryMessage[], prompt: string, apiKey: string): Promise<string | undefined> {
  if (isGroqRateLimited()) return undefined;

  const groq = new Groq({ apiKey });

  for (const model of GROQ_FALLBACK_MODELS) {
    try {
      recordGroqRequest();
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        top_p: 0.95,
        max_tokens: 150,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (content) return content;
    } catch (error: any) {
      const isRateLimit =
        error?.status === 429 ||
        error?.statusCode === 429 ||
        /rate[ _]?limit|too many requests|quota|tpm|rpm/i.test(String(error?.message || error));

      if (isRateLimit) {
        flagGroqRateLimit(error);
        return undefined;
      }

      Logger.warn(`Groq model "${model}" failed, attempting next model...`, error);
    }
  }

  return undefined;
}

async function tryGemini(history: MemoryMessage[], prompt: string, apiKey: string): Promise<string | undefined> {
  const ai = new GoogleGenAI({ apiKey });

  const contents = [
    ...history.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    })),
    { role: "user", parts: [{ text: prompt }] },
  ];

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          thinkingConfig: { thinkingBudget: 0 },
          temperature: 0.8,
          maxOutputTokens: 150,
        },
      });

      const text = response.text?.trim();
      if (text) return text;
    } catch (error) {
      Logger.warn(`Gemini model "${model}" failed, attempting next model...`, error);
    }
  }

  return undefined;
}

export async function generateAiChatResponse(userId: string, prompt: string): Promise<string> {
  const groqKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  const geminiKey = env.GOOGLEAI_KEY || process.env.GOOGLEAI_KEY;

  if (!groqKey && !geminiKey) {
    throw new Error("No AI providers are configured (`GROQ_API_KEY` or `GOOGLEAI_KEY`).");
  }

  const history = conversationMemory.get(userId) ?? [];

  let answer: string | undefined;

  // 1. Try Groq first if available and not rate limited
  if (groqKey && !isGroqRateLimited()) {
    answer = await tryGroq(history, prompt, groqKey);
  }

  // 2. Fall back to Gemini if Groq failed or was rate limited
  if (!answer && geminiKey) {
    answer = await tryGemini(history, prompt, geminiKey);
  }

  if (!answer) {
    throw new Error("all ai models failed try again later");
  }

  const finalAnswer = cleanAnswer(answer);

  // Update compressed 5-message rolling history
  const updatedHistory: MemoryMessage[] = [
    ...history,
    { role: "user" as const, content: compressMessage(prompt) },
    { role: "assistant" as const, content: compressMessage(finalAnswer) },
  ].slice(-5);
  conversationMemory.set(userId, updatedHistory);

  if (conversationMemory.size > 2000) {
    const oldestKey = conversationMemory.keys().next().value;
    if (oldestKey) conversationMemory.delete(oldestKey);
  }

  return finalAnswer;
}
