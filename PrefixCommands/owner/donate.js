import { AttachmentBuilder, Message } from "discord.js";

export default {
  name: "donate",
  description: "daan",
  aliases: [""],
  usage: "",
  guildOnly: false,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    await message.reply({
      content: "",
      files: [new AttachmentBuilder("./Assets/donate.mp4", "donate.mp4")],
    });
  },
};
