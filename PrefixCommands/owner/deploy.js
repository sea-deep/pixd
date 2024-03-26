import {Client, Message } from "discord.js";

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
    if (message.author.id == "908287391217905684") {
    await fetch(process.env.DEPLOY_HOOK);
    await message.reply('Deploy started!');
    await client.sleep (120*1000)
    return client.destroy();
    } 
  }
};