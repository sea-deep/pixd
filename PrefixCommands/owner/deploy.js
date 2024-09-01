import { Client, Message } from "discord.js";

export default {
  name: "deploy",
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
      await fetch(process.env.DEPLOY_HOOK);
      await message.reply("Deploy started!");
      await client.sleep(60 * 1000);
      return client.destroy();
    }
  },
};
