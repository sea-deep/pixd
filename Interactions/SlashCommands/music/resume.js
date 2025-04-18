import { Client, ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "resume",
    description: "0. Resume the paused music",
  },

  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      let er = await interaction.reply({
        content: '',
        embeds: [{
          title: 'Join a VC to use that command',
          color: client.color
        }],
        ephemeral: true,
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    const player = client.poru.players.get(interaction.guild.id);
    if (!player || !player.isConnected || !player.isPaused) {
      let er = await interaction.reply({
        content: "",
        embeds: [
          {
            title: 'No song to resume...',
            color: client.color,
          },
        ],
        ephemeral: true,
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    await player.pause(false);
    return interaction.reply({
      content: "<:pause:1090718191824683038>",
      ephemeral: true,
    });
  },
};

async function deleteMessage(interaction) {
  try {
    return interaction.deleteReply();
  } catch (e) {
    return;
  }
}
