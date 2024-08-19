import { Client, Message } from "discord.js";

export default {
  name: "pause",
  description: "Pause the playing music",
  aliases: [""],
  usage: "pause",
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
    if (!serverQueue || serverQueue.songs.length == 0) {
      let er = await message.reply({
        content: "",
        embeds: [
          {
            author: {
              name: "❌ No song to pause.",
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }
    serverQueue.player.pause();
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
