import HybridCommand from "../../structures/HybridCommand.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { Client, Message } from "discord.js";
import { getInputImage } from "../../helpers/helpersImage.js";

export default new HybridCommand({
  name: "setav",
  ownerOnly: true,
  description: "Run setAvatar.",
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
    {
      //  console.log(getInputImage(message))
      await client.user!.setAvatar(
        await contextImage(ctx, false, { dynamic: true }),
      );
      return ctx.reply("Done.");
    }
  },
});
