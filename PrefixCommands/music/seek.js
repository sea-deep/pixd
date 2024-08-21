import { Client, Message } from "discord.js";

export default {
  name: "seek",
  description: "Seek to a desired timestamp",
  aliases: [""],
  usage: "seek 06:09",
  guildOnly: true,
  args: true,
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
     if (!player || !player.isPlaying) {
      let er = await message.reply({
        content: "",
        embeds: [
          {
           title: 'No song to loop...',
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }
    
    let time = parse(args[0]);
    if (time > player.currentTrack.info.length || time < 0) {
      let er = await message.reply({
      content: "",
      embeds: [
        {
         title: 'Cannot loop to that duration. sowwy :3',
          color: client.color,
        },
      ],
    });
    await client.sleep(5000);
    return deleteMessage(er);
    }
    await player.seekTo(time);
    return message.react(`<:seek:1090718780545581116>`);
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
