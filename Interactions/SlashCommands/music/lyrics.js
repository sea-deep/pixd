import { Client, ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "lyrics",
    description: "Get Lyrics of any song",
    options: [
      {
        type: 3,
        name: "title",
        description: "The title of the song",
        required: false,
      },
    ],
  },

  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    await interaction.reply('<:sent:1276093659820855396>');
    let title = interaction.options.getString('title');

    if (!interaction.member.voice.channel && !title) {
      return interaction.channel.send({
        content: "<:error:1090721649621479506>",
      });
    }

    if (interaction.member.voice.channel) {
      let player = client.poru.players.get(interaction.guild.id);
      if (player && player.isPlaying && player.isConnected) {
        if (!title) {
          title = `${player.currentTrack.info.author} ${player.currentTrack.info.title}`;
        }
      }
    }

    if (!title) {
      return interaction.channel.send({
        content: "<:error:1090721649621479506>",
      });
    }

    let res = await fetch('https://api.popcat.xyz/lyrics?song=' + encodeURIComponent(title));
    let data = await res.json();

    if (data.error) {
      return interaction.channel.send({
        content: "",
        embeds: [
          {
            title: "Couldn’t find any lyrics for this song.",
            description: '`' + data.error + '`',
            color: 0xe08e67,
          },
        ],
      });
    }

    title = `${data.artist} ${data.title}`;

    await interaction.channel.send({
      content: "",
      embeds: [
        {
          title: `Lyrics`,
          description: `${title}`,
          color: 0xe08e67,
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: "Click Here",
              custom_id: "getLyricss",
              disabled: false,
            },
          ],
        },
      ],
    });
  },
};
