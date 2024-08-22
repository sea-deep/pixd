import { Client, ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "stop",
    description: "Clears the queue and leaves the VC",
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
        }]
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    const player = client.poru.players.get(interaction.guild.id);
    if (player && player.isPlaying && player.isConnected) {
      await player.destroy();
      return interaction.reply({
        content: '',
        embeds: [{
          title: 'Leaving VC and clearing the queue',
          color: client.color
        }]
      });
    } else {
      return interaction.reply(":x: No Player to stop.");
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
