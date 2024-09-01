import { Client, Message } from "discord.js";
import { getInputImage } from "../../Helpers/helpersImage.js";

export default {
  name: "setav",
  description: "",
  aliases: [""],
  usage: "",
  guildOnly: true,
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
    if (message.author.id == "1258396025354453054") {
      //  console.log(getInputImage(message))
      await client.user.setAvatar(
        await getInputImage(message, { dynamic: true }),
      );
      return message.reply("Done.");
    }
  },
};
