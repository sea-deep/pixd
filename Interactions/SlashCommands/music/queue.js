import { Client, ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "queue",
    description: "0. Shows the queue.",
  },

  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    let player = client.poru.players.get(interaction.guild.id);

    const nowPlaying =
      player && player.isPlaying && player.isConnected
        ? `${player.currentTrack.info.author} - ${player.currentTrack.info.title}`
        : "*No song is currently being played*";
       
    const playingNext =
      player && player.isPlaying && player.isConnected && player.queue.length > 0
        ? `${player.queue[0].info.author} - ${player.queue[0].info.title}`
        : "*No song is in queue.*";
    let msg = `**Now playing:**\n${nowPlaying}\n**Playing Next:**\n1. ${playingNext}`;

    let m = {
      content: "",
      tts: false,
      components: [],
      embeds: [
        {
          type: "rich",
          title: "Music Queue",
          description: `${msg}`,
          color: client.color,
          footer: {
            text: `total songs in queue: ${player && player.isPlaying && player.isConnected ? player.queue.length : "0"}`,
          },
        },
      ],
    };
    if (player && player.isPlaying && player.isConnected && player.queue.length > 1) {
      m.components.push({
        type: 1,
        components: [
          {
            style: 4,
            label: `See remaining queue`,
            custom_id: `showQueue_`,
            disabled: false,
            emoji: {
              id: null,
              name: `📜`,
            },
            type: 2,
          },
        ],
      });
    }
    return interaction.reply(m);
  },
};
