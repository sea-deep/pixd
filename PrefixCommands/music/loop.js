import { Client, Message } from "discord.js";

export default {
  name: "loop",
  description: "Toggle looping the server queue or track",
  aliases: ["repeat"],
  usage: "loop",
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
    let player = client.poru.players.get(message.guild.id);
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
    
   let mode = args.includes('queue') || args.includes('q') ? 'QUEUE' : 'TRACK';

    if (player.loop === 'NONE') {
      player.setLoop(mode);
      return message.react("<:loop:1090721294779162756>");
    } else {
      return message.react("<:unloop:1090721386848333934>");
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
