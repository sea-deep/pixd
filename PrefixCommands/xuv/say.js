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
   try{
    let m = await message.channel.send(`teri maa randi`);
    await client.sleep(5000);
    await m.delete();
   } catch(e) { console.log("Say Command Error handled");}
  }
};