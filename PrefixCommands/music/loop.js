import { Client, Message } from "discord.js";

export default {
  name: "loop",
  description: "Toggle looping the server queue",
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
  let serverQueue = client.queue.get(message.guild.id);
  if (!message.member.voice.channel) {
    let er = await message.reply({
          content: '',
          embeds: [
            {
              author: {
                name: '❌ Please join a  voice channel first.',
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
           let er = await message.reply({
          content: '',
          embeds: [
            {
              author: {
                name: '❌ No song to loop.',
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
  }
  serverQueue.loop = !serverQueue.loop; //loop the queue
  serverQueue.keep = !serverQueue.keep; //and keep the current song
  if (serverQueue.loop) {
    return message.react('<:loop:1090721294779162756>');
  } else {
    return message.react('<:unloop:1090721386848333934>');
  }
  
  }
};
