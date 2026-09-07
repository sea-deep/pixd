import { ApplicationCommandOptionType } from "discord.js";
import Groq from "groq-sdk";
import HybridCommand from "../../structures/HybridCommand.js";
import { env } from "../../utilities/env.js";
import Logger from "../../helpers/Logger.js";

type MemoryMessage = { role: "user" | "assistant"; content: string };
const conversationMemory = new Map<string, MemoryMessage[]>();

const GROQ_FALLBACK_MODELS = [
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];

const SYSTEM_PROMPT = `You are PixD on Discord.
Style & Personality:
- Passive, deadpan, unbothered, nonchalant okbhaibudbak / okbuddyretard humor.
- Never act like a cheerful assistant. Never use corporate disclaimers like "As an AI language model" or "Hope this helps!".
- Low-effort, dry, informal energy. Speak like an unbothered server regular who has seen too much internet brainrot.
- Don't force cringe or try too hard to be funny. Keep it short (usually 1-2 sentences).
- Sparingly drop one of these server emojis when it naturally fits the irony:
  <:bhaibudbak:915921532658798632>
  <:okbb:1115648451045240913>
  <:vosahihai:849252453421154334>
  <:theekhai:833742354892324894>
  <:chai:833744328898642021>
  <:dard:851284875876237322>
  <:real:990607395749257216>
  <:truehai:911931926338736139>
  <:didntask:884385214971928686>`;

export default new HybridCommand({
  name: "gpt",
  slashRoute: "xuv gpt",
  description: "Chat with PixD's concise AI assistant.",
  aliases: ["xd"],
  usage: "<message>",
  cooldown: 5_000,
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "message",
    description: "Your message",
    required: true,
  }],
  execute: async (ctx, client) => {
    const prompt = ctx.options.getString("message", true)!.trim();
    const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) return ctx.reply("❌ `GROQ_API_KEY` is not configured.");

    const history = conversationMemory.get(ctx.user.id) ?? [];
    const groq = new Groq({ apiKey });

    let answer: string | undefined = undefined;
    let lastError: unknown = null;

    for (const model of GROQ_FALLBACK_MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 512,
        });
        const content = completion.choices[0]?.message?.content?.trim();
        if (content) {
          answer = content;
          break;
        }
      } catch (error) {
        lastError = error;
        Logger.warn(`Groq model "${model}" failed, attempting next fallback model...`, error);
      }
    }

    if (!answer) {
      return ctx.reply({ embeds: [{
        title: "An error occurred",
        color: client.color,
        description: lastError instanceof Error ? lastError.message : "All AI model fallbacks failed. Try again later.",
      }] });
    }

    const updatedHistory: MemoryMessage[] = [
      ...history,
      { role: "user", content: prompt },
      { role: "assistant", content: answer },
    ];
    conversationMemory.set(ctx.user.id, updatedHistory.slice(-6));

    return ctx.reply({ embeds: [{
      color: client.color,
      description: answer.length > 4096 ? `${answer.slice(0, 4093)}...` : answer,
    }] });
  },
});
