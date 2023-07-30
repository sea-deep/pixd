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
    let serverQueue = client.queue.get(message.guild.id);
      if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue) {
    return message.react('<:error:1090721649621479506>');
  }
  message.react('<:stop:1090718630628573245>');
  serverQueue.connection.destroy();
  client.queue.delete(message.guild.id);
  }
}
;