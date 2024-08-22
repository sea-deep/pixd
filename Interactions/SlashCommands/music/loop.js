import { Client, ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "loop",
    description: "Toggle looping the server queue or track",
    options: [
      {
        type: 3,
        name: "mode",
        description: "Loop mode (track or queue)",
        choices: [
          {
            name: "Track",
            value: "TRACK",
          },
          {
            name: "Queue",
            value: "QUEUE",
          },
        ],
        required: false,
      },
    ],
  },

  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    const voiceChannel = interaction.member.voice.channel;
    let player = client.poru.players.get(interaction.guild.id);

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

    if (!player || !player.isPlaying) {
      let er = await interaction.reply({
        content: "",
        embeds: [
          {
            title: 'No song to loop...',
            color: client.color,
          },
        ],
        ephemeral: true,
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }
    
    let mode = interaction.options.getString('mode') || 'TRACK';

    if (player.loop === 'NONE') {
      player.setLoop(mode);
      return interaction.reply({
        content: '<:loop:1090721294779162756>',
        ephemeral: true,
      });
    } else {
      player.setLoop('NONE');
      return interaction.reply({
        content: '<:unloop:1090721386848333934>',
        ephemeral: true,
      });
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
