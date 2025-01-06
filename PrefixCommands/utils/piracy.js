import {Client, Message } from "discord.js";

export default {
  name: "piracy",
  description: "Search and download anything you want! Videos, audios, ebooks, etc.",
  aliases: ["pirate"],
  usage: "p!pirate <query> <type> <sort>",
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
     await message.reply({
      content: "This command is disabled for now. Please use the slash command /piracy instead."
  });
}
};