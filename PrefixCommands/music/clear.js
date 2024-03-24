import { Client, Message } from "discord.js";

export default {
  name: "clear",
  description: "Clears the queue",
  aliases: ["clr"],
  usage: "clear",
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
                name: '❌ No song is present in the queue.',
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
  }

  let currentSong = serverQueue.songs[0];
  serverQueue.songs = [currentSong];
  serverQueue.loop = false;
  serverQueue.keep = false;
  return message.react('<:clear:1090718705060684008>');
  }
};

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
