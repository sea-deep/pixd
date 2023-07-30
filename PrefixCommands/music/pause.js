import { Client, Message } from "discord.js";

export default {
  name: "pause",
  description: "Pause the playing music",
  aliases: [""],
  usage: "pause",
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
    let serverQueue = client.queue.get(message.guild.id);
  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }
  console.log(`Song paused.`);
  serverQueue.player.pause();
  return message.react('<:pause:1090718191824683038>');

  }
};
