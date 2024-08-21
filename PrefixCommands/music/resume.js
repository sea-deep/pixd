import { Client, Message } from "discord.js";

export default {
  name: "resume",
  description: "Resume the paused music",
  aliases: [""],
  usage: "resume",
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
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      let er = await message.channel.send({
        content: '',
        embeds: [{
          title: 'Join a VC to use that command',
          color: client.color
        }]
       });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    const player = client.poru.players.get(message.guild.id);
     if (!player || !player.isConnected || !player.isPaused) {
      let er = await message.reply({
        content: "",
        embeds: [
          {
           title: 'No song to resume...',
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    await player.pause(false);
    return message.react("<:pause:1090718191824683038>");
  },
};

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
