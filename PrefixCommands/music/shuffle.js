import { Client, Message } from "discord.js";

export default {
  name: "shuffle",
  description: "Shuffle the running queue.",
  aliases: [""],
  usage: "shuffle",
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
    const serverQueue = client.queue.get(message.guild.id);
      if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }

  for (let i = serverQueue.songs.length - 1; i > 1; --i) {
    const j = 1 + Math.floor(Math.random() * i);
    [serverQueue.songs[i], serverQueue.songs[j]] = [
      serverQueue.songs[j],
      serverQueue.songs[i],
    ];
  }
  message.react('<:shuffle:1090732407931543681>');
  }
};
