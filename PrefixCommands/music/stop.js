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
      let er = await message.reply({
        content: "",
        embeds: [
          {
            author: {
              name: "❌ Please join a  voice channel first.",
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }
    if (!serverQueue) {
      let er = await message.reply({
        content: "",
        embeds: [
          {
            author: {
              name: "❌ No song to stop...",
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }
    message.react("<:stop:1090718630628573245>");
    serverQueue.connection.destroy();
    client.queue.delete(message.guild.id);
  },
};
async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
