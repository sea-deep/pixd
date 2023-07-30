import { Client, Message } from "discord.js";

export default {
  name: "resume",
  description: "Resume the paused music",
  aliases: [""],
  usage: "resume",
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
  console.log(`Song resumed.`);
  serverQueue.player.unpause();
  return message.react('<:resume:1090718421425070090>');

  }
};
