import {Client, Message } from "discord.js";

export default {
  name: "say",
  description: "Say something w Bot",
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
    await message.channel.send(args.join(' '));
    await message.delete();

  }
};