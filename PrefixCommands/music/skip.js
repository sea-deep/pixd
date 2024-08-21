import { Client, Message } from "discord.js";

export default {
  name: "skip",
  description: "Skips the current track.",
  aliases: ["next"],
  usage: "skip <number(optional)>",
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
   if (player && player.isPlaying && player.isConnected) {
     await message.channel.send({
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
    return message.channel.send(":x: No Track to skip.");
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

