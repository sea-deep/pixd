import { Client, Message } from "discord.js";

export default {
  name: "stop",
  description: "Clears the queue and leaves the VC",
  aliases: ["leave", "kick", "leave"],
  usage: "stop",
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
   await player.destroy();
   return message.channel.send({
    content: '',
    embeds: [{
      title: 'Leaving VC and clearing the queue',
      color: client.color
    }]
   });
  } else {
    return message.channel.send(":x: No Player to stop.");
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

