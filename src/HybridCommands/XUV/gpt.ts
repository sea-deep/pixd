import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { generateAiChatResponse, isAiChatConfigured } from "../../services/AiChatService.js";

export default new HybridCommand({
  name: "gpt",
  slashRoute: "xuv gpt",
  description: "Chat with PIXD's deadpan AI assistant.",
  aliases: ["xd"],
  usage: "<message>",
  cooldown: 5_000,
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "message",
    description: "Your message",
    required: true,
  }],
  execute: async (ctx) => {
    const prompt = ctx.options.getString("message", true)!.trim();
    if (!isAiChatConfigured()) {
      return ctx.reply("❌ AI chat is not configured.");
    }

    try {
      const answer = await generateAiChatResponse(ctx.user.id, prompt);
      return ctx.reply(answer);
    } catch (err: any) {
      return ctx.reply(err instanceof Error ? err.message : "something went wrong try again");
    }
  },
});
