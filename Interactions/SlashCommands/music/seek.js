import { Client, ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "seek",
    description: "Seek to a desired timestamp",
    options: [
      {
        type: 3,
        name: "timestamp",
        description: "The timestamp to seek to (e.g., 06:09)",
        required: true,
      },
    ],
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
    if (!player || !player.isPlaying) {
      let er = await interaction.reply({
        content: "",
        embeds: [
          {
            title: 'No song to seek...',
            color: client.color,
          },
        ],
        ephemeral: true,
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }
    
    let time = parse(interaction.options.getString('timestamp'));
    if (time > player.currentTrack.info.length || time < 0) {
      let er = await interaction.reply({
        content: "",
        embeds: [
          {
            title: 'Cannot seek to that duration. sowwy :3',
            color: client.color,
          },
        ],
        ephemeral: true,
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    await player.seekTo(time);
    return interaction.reply({
      content: '<:seek:1090718780545581116>',
      ephemeral: true,
    });
  },
};

function parse(str) {
  let parts = str.split(':').map(Number);  
  switch (parts.length) {
      case 3:
          return ((parts[0] * 60 * 60) + (parts[1] * 60) + parts[2]) * 1000;
      case 2:
          return ((parts[0] * 60) + parts[1]) * 1000;
      case 1:
          return parts[0] * 1000;
      default:
          return 0;  
  }
}

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
