import {
  getVoiceConnection,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import playDL from "play-dl";
import { Client, Message } from "discord.js";
import { searchVideo } from "./helpersYt.js";

const handleError = async (message, errorMsg, errDetail, client) => {
  console.error(errDetail);
  let er = await message.channel.send({
    content: "",
    embeds: [
      {
        author: {
          name: errorMsg,
        },
        description: errDetail.message,
        color: client.color,
      },
    ],
  });
  await client.sleep(5000);
  return deleteMessage(er);
};

/**
 * @param {Client} client
 * @param {Message} message
 */
export async function play(guild, song, client, message) {
  const serverQueue = client.queue.get(guild.id);

  if (!song) {
    serverQueue.timeoutID = setTimeout(
      () => {
        if (getVoiceConnection(guild.id) !== undefined) {
          destroy(guild, client);
          serverQueue.timeoutID = undefined;
        } else {
          console.log("Bot was disconnected during the timeout.");
        }
      },
      2 * 60 * 1000,
    ); // 2 min idle
    serverQueue.loop = false;
    return;
  }

  clearTimeout(serverQueue.timeoutID);
  serverQueue.timeoutID = undefined;

  let stream;
  try {
    if (song.source === "yt") {
      stream = await playDL.stream(song.url, {
        seek: song?.seek > 0 ? song.seek : 0,
      });
    } else if (song.source === "sp") {
      let search = await searchVideo(song.title);
      stream = await playDL.stream(search.url);
    } else if (song.source === "sc") {
      stream = await playDL.stream(song.url);
    }
  } catch (error) {
    return handleError(
      message,
      `❌ An unexpected error occurred while getting the stream for ${song.title}.`,
      error,
      client,
    );
  }

  let resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });
  serverQueue.connection.subscribe(serverQueue.player);
  serverQueue.player.play(resource);

  const errorListener = (error) => {
    console.error(
      `Error: ${error.message} with resource ${error.resource.title}`,
    );
  };
  serverQueue.player.on("error", errorListener);
  serverQueue.player.once(AudioPlayerStatus.Idle, () => {
    serverQueue.player.removeListener("error", errorListener);
    if (serverQueue.loop && serverQueue.keep) {
      serverQueue.songs.push(serverQueue.songs.shift());
    } else {
      serverQueue.songs.shift();
      if (serverQueue.loop === true) {
        serverQueue.keep = true;
      }
    }
    play(guild, serverQueue.songs[0], client, message);
  });

  serverQueue.textChannel.send({
    content: "**Now Playing**",
    tts: false,
    embeds: [
      {
        type: "rich",
        title: "",
        description: "",
        color: 0xe08e67,
        author: {
          name: `${song.title} - ${song.durationTime.minutes}:${song.durationTime.seconds}`,
          icon_url: `https://cdn.discordapp.com/emojis/763415718271385610.gif`,
        },
      },
    ],
  });
}

/**
 * @param {Client} client
 */
export function destroy(guild, client) {
  try {
    getVoiceConnection(guild.id).destroy();
    client.queue.delete(guild.id);
  } catch (error) {
    console.error(`Error while destroying connection: ${error.message}`);
  }
}

/**
 * Given a number, parses it into the form of mm:ss
 * @param {number} input number to parse.
 * @returns {object} object containing the parsed data.
 */
export function parse(input) {
  if (typeof input === "string" && input.indexOf(":") !== -1) {
    const time = input.split(":");
    if (!isNaN(time[0]) && !isNaN(time[1]) && time[0] >= 0 && time[1] >= 0) {
      const minutes = Number(time[0] * 60);
      const seconds = Number(time[1]);
      return minutes + seconds;
    }
  } else if (typeof input === "number") {
    const minutes = Math.floor(input / 60);
    const seconds = input % 60 < 10 ? "0" + (input % 60) : input % 60;
    return { minutes, seconds };
  } else {
    return 0;
  }
}

export async function soundCloudUrl(url) {
  if (!url.includes("on.soundcloud")) return url;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const originalTrackUrlRegex =
      /<meta\s+property=["']og:url["']\s+content=["'](https:\/\/soundcloud\.com\/[^"']+)["']>/;
    const match = html.match(originalTrackUrlRegex);

    if (match && match[1]) {
      return match[1];
    } else {
      throw new Error("Original track URL not found");
    }
  } catch (error) {
    console.error("Error extracting track URL:", error);
    return null;
  }
}

async function deleteMessage(msg) {
  try {
    return await msg.delete();
  } catch (e) {
    console.error("Error while deleting message:", e.message);
  }
}
