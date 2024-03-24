import { Client, Message } from "discord.js";

export default {
  name: "resume",
  description: "Resume the paused music",
  aliases: [""],
  usage: "resume",
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
                name: '❌ No song to resume.',
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
  }
  console.log(`Song resumed.`);
  serverQueue.player.unpause();
  return message.react('<:resume:1090718421425070090>');

  }
};

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}

