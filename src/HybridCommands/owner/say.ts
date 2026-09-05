import HybridCommand from "../../structures/HybridCommand.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { Client, Message } from "discord.js";

export default new HybridCommand({
  name: "say",
  ownerOnly: true,
  description: "Say something w Bot",
  aliases: [""],
  usage: "",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  options: [
    { type: 3, name: "arguments", description: "Command text and arguments, in prefix order" },
    { type: 6, name: "user", description: "Target user" },
    { type: 6, name: "user2", description: "Second target" },
    { type: 6, name: "user3", description: "Third target" },
    { type: 11, name: "image", description: "Input image or attachment" },
  ],
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const args = input.args;
    const content = args.join(" ").trim();
    if (!content) return ctx.reply("Usage: say <text>");
    return ctx.reply({ content, allowedMentions: { parse: [] } });
  },
});
