import {Client, Message } from "discord.js";
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
    if (message.author.id == "908287391217905684") {
    await client.user.setAvatar(getInputImage(message));
    return message.reply("Done.");
    } 
  }
};