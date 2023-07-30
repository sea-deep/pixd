import { Client, Message } from "discord.js";

export default {
  name: "clear",
  description: "Clears the queue",
  aliases: ["clr"],
  usage: "clear",
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

  let currentSong = serverQueue.songs[0];
  serverQueue.songs = [currentSong];
  serverQueue.loop = false;
  serverQueue.keep = false;
  return message.react('<:clear:1090718705060684008>');
  }
};
