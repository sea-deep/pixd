import { Client, Message } from "discord.js";

export default {
  name: "shuffle",
  description: "Shuffle the running queue.",
  aliases: [""],
  usage: "shuffle",
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
    const serverQueue = client.queue.get(message.guild.id);
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
              name: "❌ No songs to shuffle.",
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    for (let i = serverQueue.songs.length - 1; i > 1; --i) {
      const j = 1 + Math.floor(Math.random() * i);
      [serverQueue.songs[i], serverQueue.songs[j]] = [
        serverQueue.songs[j],
        serverQueue.songs[i],
      ];
    }
    message.react("<:shuffle:1090732407931543681>");
  },
};

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
