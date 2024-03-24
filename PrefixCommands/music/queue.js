import { Client, Message } from "discord.js";

export default {
  name: "queue",
  description: "Shows the queue.",
  aliases: ["np", "q", "nowplaying"],
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

    const nowPlaying = (serverQueue && serverQueue.songs.length !== 0) ? serverQueue.songs[0] : '*No song is currently being played*';
    const playingNext = (serverQueue && serverQueue.songs.length > 1) ? serverQueue.songs[1] : '*No song is in queue.*';
    let msg = `**Now playing:**\n${nowPlaying.title}\n**Playing Next:**\n1. ${playingNext.title}`;
    
    let m = {
      content: '',
      tts: false,
      components: [],
      embeds: [
        {
          type: 'rich',
          title: 'Music Queue',
          description: `${msg}`,
          color: client.color,
          footer: {
            text: `total songs in queue: ${serverQueue.songs.length - 1}`
          }
        },
      ],
    };
    if (serverQueue && serverQueue.songs.length > 2) {
      m.components.push({
        type: 1,
        components: [
          {
            style: 1,
            label: `See remaining queue`,
            custom_id: `showQueue`,
            disabled: false,
            emoji: {
              id: null,
              name: `📜`
            },
            type: 2
          }
        ]
      });
    }
    return message.channel.send(m);
  },
};