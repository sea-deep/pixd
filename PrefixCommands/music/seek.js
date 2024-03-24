import { Client, Message } from "discord.js";

export default {
  name: "seek",
  description: "Seek to a desired timestamp",
  aliases: [""],
  usage: "seek 06:09",
  guildOnly: true,
  args: true,
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
          content: ``,
          embeds: [
            {
              author: {
                name: `❌ Please join a  voice channel first.`,
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
          content: ``,
          embeds: [
            {
              author: {
                name: `❌ No song to seek.`,
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
  }
  if (serverQueue.songs[0].source != `yt`) {
               let er = await message.reply({
          content: ``,
          embeds: [
            {
              author: {
                name: `❌ Cannot seek into this track`
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
  }
  let timeToSeek = parse(args[0]);
  let seekTime = parse(timeToSeek);
  let maxDuration = serverQueue.songs[0].duration;
  let maxTime = parse(maxDuration);
  if (timeToSeek > maxDuration || timeToSeek < 0) {
    console.log(`Seek failed, requested ${timeToSeek}, max is ${maxDuration}`);
         let er = await message.reply({
          content: ``,
          embeds: [
            {
              author: {
                name: `❌ Seek failed, requested ${timeToSeek}, max is ${maxDuration}`,
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
  }
  let currentSong = serverQueue.songs[0];
  currentSong.seek = timeToSeek;
  currentSong.seekTime = seekTime;
  serverQueue.songs.unshift(currentSong);
  serverQueue.player.stop();
  return message.react(`<:seek:1090718780545581116>`);
  }
};
/**
 * Given a number, parses it into the form of mm:ss
 * @param {number} input number to parse.
 * @returns {object} object containing the parsed data.
 */
function parse(input) {
  if (typeof input == "string" && input.indexOf(":") != -1) {
    let time = input.split(":");
    if (isNaN(time[0]) || isNaN(time[1]) || time[0] < 0 || time[1] < 0) {
    } else {
      let minutes = Number(time[0] * 60);
      let seconds = Number(time[1]);
      let timeToSeek = minutes + seconds;
      return timeToSeek;
    }
  } else if (typeof input == "number") {
    let minutes = Math.floor(input / 60);
    let seconds = input % 60 < 10 ? "0" + (input % 60) : input % 60;
    return { minutes: minutes, seconds: seconds };
  } else {
    return 0;
  }
}


async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
