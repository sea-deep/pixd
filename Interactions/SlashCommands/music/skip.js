import { Client, ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "skip",
    description: "Skips the current track.",
  },

  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    await interaction.reply('<:sent:1276093659820855396>');

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      let er = await interaction.channel.send({
        content: '',
        embeds: [{
          title: 'Join a VC to use that command',
          color: client.color
        }]
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    const player = client.poru.players.get(interaction.guild.id);
    if (player && player.isPlaying && player.isConnected) {
      await interaction.channel.send({
        content: '',
        embeds: [{
          title: 'Skipped Track',
          description: player.currentTrack.info.title,
          footer: {
            text: player.currentTrack.info.author
          },
          thumbnail: {
            url: player.currentTrack.info.artworkUrl
          },
          color: client.color
        }]
      });
      return player.skip();
    } else {
      return interaction.channel.send(":x: No Track to skip.");
    }
  },
};

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
