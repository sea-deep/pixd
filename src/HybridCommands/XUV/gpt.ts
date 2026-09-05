import { ApplicationCommandOptionType } from "discord.js";
import Groq from "groq-sdk";
import HybridCommand from "../../structures/HybridCommand.js";

type MemoryMessage = { role: "user" | "assistant"; content: string };
const conversationMemory = new Map<string, MemoryMessage[]>();

export default new HybridCommand({
  name: "gpt",
  slashRoute: "xuv gpt",
  description: "Chat with PixD's concise AI assistant.",
  aliases: ["xd"],
  usage: "<message>",
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "message",
    description: "Your message",
    required: true,
  }],
  execute: async (ctx, client) => {
    const prompt = ctx.options.getString("message", true)!.trim();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return ctx.reply("❌ `GROQ_API_KEY` is not configured.");

    const history = conversationMemory.get(ctx.user.id) ?? [];
    try {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are PixD: concise, clever, friendly, and accurate. Keep replies short, avoid harmful instructions, and clearly admit uncertainty." },
          ...history,
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 512,
      });
      const answer = completion.choices[0]?.message?.content?.trim();
      if (!answer) return ctx.reply("I couldn't get a reply from the model. Try again later.");

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
    } catch (error) {
      return ctx.reply({ embeds: [{
        title: "An error occurred",
        color: client.color,
        description: error instanceof Error ? error.message : "Unknown AI service error.",
      }] });
    }
  },
});
