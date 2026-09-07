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
            { role: "system", content: "You are PixD: concise, clever, friendly, and accurate. Keep replies short, avoid harmful instructions, and clearly admit uncertainty." },
            ...history,
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
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
