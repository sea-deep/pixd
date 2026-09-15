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

const SYSTEM_PROMPT = `You are PIXD on Discord, a sharp, chronically online, sentient chatter.

Personality & Vibe:
- Natural, conversational, witty, and perceptive with a casual internet-native tone.
- Unpredictable and deadpan, but not an obnoxious robot or soundboard parrot.
- Never write angry essays, tryhard roasts, or defensive paragraphs.

How to Respond:
- Unironic / Genuine requests & questions: When someone asks a real, sincere question or needs actual info/code/help (coding, technical questions, gaming, music, advice, facts), BE ACTUALLY HELPFUL AND COMPREHENSIVE. Write the code, give the solution, explain the answer cleanly with casual wit. NEVER mock, refuse, or troll someone asking for code or genuine help.
- Sarcastic / Absurd messages: When someone is being sarcastic, trolling, memeing, or saying absurd things, match their energy with dry sarcasm, witty irony, absurdist logic, or effortless dismissal.

Formatting & Rules:
- Conversational text should be in lowercase without trailing periods or formal punctuation (avoid commas, semicolons).
- Code & technical syntax: When writing code or commands, use proper markdown code blocks with standard correct formatting, syntax, and semicolons (code is exempt from the lowercase/no-punctuation rule).
- Blend casual internet slang and Hinglish naturally when appropriate.
- Keep regular chat responses concise (1 to 3 sentences max), but give full complete code/solutions when asked.
- NEVER use standard Unicode emojis (no 😂, 💀, 😭, etc.).
- You may use at most ONE fitting server custom emoji from this list if it naturally fits the tone:
<:theekhai:833742354892324894>
<:indiatroll:832630499889250374>
<:troll:832630546617860098>
<:wholesome:832630717011722270>
<:chai:833744328898642021>
<:samasya:839110746163904523>
<:vosahihai:849252453421154334>
<:dard:851284875876237322>
<:ulti:851285044504821822>
<:peepoh:856187176122712155>
<:budbak:856187459523313674>
<:dhanyavad:860189362778931250>
<:clueless:860851771568029726>
<:waow:866587667067699241>
<:masti:873081033497661500>
<:maisahihun:876903742342066196>
<:didntask:884385214971928686>
<:vadapavtime:884414693664497724>
<:cope:884417231923073045>
<:truestory:900015405953847366>
<:funwaa:909870753149771786>
<:bhai:910893079085592616>
<:truehai:911931926338736139>
<:bhaibudbak:915921532658798632>
<:actually:917845737285484575>
<:sach:919610497861574676>
<:jhoot:919668839711641680>
<:accha:937797109455945759>
<:samaj:941383088364204083>
<:allustuff:943141815744352266>
<:soyjak:945927279563907143>
<:real:990607395749257216>
<:fake:990607299620007956>
<:dekhbhai:991128097418133554>
<:khoobsurat:1073503315209498655>
<:victory:1073503320892768306>
<:lol:1114826482976559194>
<:okbb:1115648451045240913>
<:gandibaat:1118553600231215214>
<:pagal:1271068577151188992>
<:happy:1347608259187572736>
<a:nerdfacts:831235299866574939>
<a:dielit:833749009541234708>
<a:memer:833749338026934332>
<a:arewaah:835499189567619084>
<a:trolled:853553562863927306>
<a:trollsphere:853846756151918623>
<a:thelookblink:885076830690897930>
<a:ripbozo:917851508115140688>
<a:murga:916008939567591455>
<a:iamunderthewater:914043826790891600>
<a:allulaugh:1003019863721263194>`;

export function isAiChatConfigured(): boolean {
  return Boolean(env.GROQ_API_KEY || process.env.GROQ_API_KEY || env.GOOGLEAI_KEY || process.env.GOOGLEAI_KEY);
}

function cleanAnswer(text: string): string {
  let cleaned = text.trim();
  // Strip common generic unicode emojis that ruin the vibe
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");

  if (cleaned.includes("```")) {
    // Preserve code block formatting, only normalize excessive newlines
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  } else {
    // For regular chat responses, normalize whitespace and collapse redundant spacing
    cleaned = cleaned.replace(/[^\S\r\n]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  // Strip trailing full stops/periods while keeping closing emoji brackets or code blocks intact
  while (cleaned.endsWith(".") && !cleaned.endsWith(">") && !cleaned.endsWith("```")) {
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
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 800,
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
          temperature: 0.7,
          maxOutputTokens: 800,
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

  // Update compressed 10-message rolling history
  const updatedHistory: MemoryMessage[] = [
    ...history,
    { role: "user" as const, content: compressMessage(prompt) },
    { role: "assistant" as const, content: compressMessage(finalAnswer) },
  ].slice(-10);
  conversationMemory.set(userId, updatedHistory);

  if (conversationMemory.size > 2000) {
    const oldestKey = conversationMemory.keys().next().value;
    if (oldestKey) conversationMemory.delete(oldestKey);
  }

  return finalAnswer;
}
