import { Client, Message } from "discord.js";
export default {
  name: "queue",
  description: "Shows the queue.",
  aliases: ["np", "q"],
  usage: "queue",
  guildOnly: false,
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
      return message.channel.send({
        content: 'Queue',
        tts: false,
        embeds: [
          {
            type: 'rich',
            title: '',
            description:
              `No song currently playing\n----------------------------\n`,
            color: 0x462,
          },
        ],
      });
    }

    const nowPlaying = serverQueue.songs[0];
    let msg = `Now playing: ${nowPlaying.title}\n----------------------------\n`;
    
    for (let i = 1; i < Math.min(serverQueue.songs.length, 11); i++) {
      const song = serverQueue.songs[i];
      msg += `${i}. ${song.title}\n`;
    }

    message.channel.send({
      content: '**Queue**',
      tts: false,
      embeds: [
        {
          type: 'rich',
          title: '',
          description: `${msg}`,
          color: 0x462,
        },
      ],
    });
  },
};