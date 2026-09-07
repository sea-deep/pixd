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
    { type: 11, name: "image", description: "Avatar image attachment" },
    { type: 3, name: "image-url", description: "Direct image URL for avatar" },
    { type: 6, name: "user", description: "Copy avatar from a user" },
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
