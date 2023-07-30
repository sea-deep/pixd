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
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }
  serverQueue.loop = !serverQueue.loop; //loop the queue
  serverQueue.keep = !serverQueue.keep; //and keep the current song
  if (serverQueue.loop) {
    console.log(`Looping the queue.`);
    return message.react('<:loop:1090721294779162756>');
  } else {
    console.log('Disabled the loop.');
    return message.react('<:unloop:1090721386848333934>');
  }
  
  }
};
