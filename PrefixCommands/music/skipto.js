import { Client, Message } from "discord.js";

export default {
  name: "skipto",
  description: "Used to skip to a song",
  aliases: [""],
  usage: "skipto <song name>|<number in queue>",
  guildOnly: true,
  args: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
    * @param {Message} message
    */
  execute: async (message, args, client) => {
  let serverQueue = client.queue.get(message.guild.id);
  let pos = parseInt(args[0]);
  let song;
  if (!message.member.voice.channel) {
    let er = await message.reply({
        content: '',
        embeds: [
          {
            author: {
              name: '❌ Please join a  voice channel first',
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
              name: '❌ No track to jump to',
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
  }
  if (isNaN(pos)) {
    //skip by keyword
    let query = message.content
      .substring(message.content.indexOf(' '), message.content.length)
      .trim();
    if (args[0] == 'last' || args[0] == 'end') {
      //check certain keywords first
      pos = serverQueue.songs.length - 1;
    } else {
      //otherwise find a match
      const regex = new RegExp(query, 'i'); //case insensitive regex
      pos = serverQueue.songs.findIndex(function (s) {
        //find position of a song title matching keyword
        return regex.test(s.title);
      });
    }
    if (pos < 0) {
      let er = await message.reply({
        content: '',
        embeds: [
          {
            author: {
              name: '❌ Failed to skip to the given track',
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }
  } else if (pos < 0 || pos > serverQueue.songs.length - 1) {
    let er = await message.reply({
        content: '',
        embeds: [
          {
            author: {
              name: '❌ Failed to skip to the given track',
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
  }
  if (pos == 0) {
    let er = await message.reply({
        content: '',
        embeds: [
          {
            author: {
              name: '❌ Failed to skip to the given track',
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
  }
  song = serverQueue.songs.splice(pos, 1); //remove the song (splice returns array)
  serverQueue.songs.splice(1, 0, song[0]); //make it the next song
  serverQueue.player.stop(); //skip current playing song
  }
};


async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
