import { Client, Message } from "discord.js";
import { startVoiceConnection } from "../../Utilities/voiceConnectionHandler.js";
import { play, parse, soundCloudUrl } from "../../Helpers/helpersMusic.js";
import {
  getPlaylistTracks,
  searchVideo,
  getVideoInfo,
} from "../../Helpers/helpersYt.js";
import playDL from "play-dl";

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

export default {
  name: "play",
  description: "plays from YouTube or Spotify or SoundCloud.",
  aliases: ["p"],
  usage: "play <link>|<search query>",
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
  async execute(message, args, client) {
    try {
      const serverQueue = client.queue.get(message.guild.id);
      const voiceChannel = message.member.voice.channel;

      if (!voiceChannel) {
        let er = await message.channel.send({
          content: "",
          embeds: [
            {
              author: {
                name: "❌ Please join a voice channel first.",
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
      }

      let song = {};
      let songs = [];
      let check;

      try {
        check = await playDL.validate(await soundCloudUrl(args[0].trim()));
      } catch (err) {
        return handleError(
          message,
          "❌ An unexpected error occurred while validating your query.",
          err,
          client,
        );
      }

      if (!check) {
        let er = await message.channel.send({
          content: "",
          embeds: [
            {
              author: {
                name: "❌ Couldn't find a valid URL or search query in your message",
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
      }

      if (check === "search") {
        const query = args.join(" ");
        const searchMsg = await message.react("<:search:1090725319884951623>");
        let search;
        try {
          search = await searchVideo(query);
        } catch (e) {
          await handleError(
            message,
            "❌ An error occurred while searching the track.",
            e,
            client,
          );
          try {
            await searchMsg.remove();
          } catch (err) {
            console.error("Error while removing reaction:", err.message);
          }
          return;
        }

        try {
          await searchMsg.remove();
        } catch (er) {
          console.error("Error while removing reaction:", er.message);
          return;
        }

        song = {
          title: search.title,
          url: search.url,
          duration: search.duration,
          durationTime: parse(search.duration),
          source: "yt",
        };
        songs.push(song);
      } else {
        const [source, type] = check.split("_");
        try {
          if (source === "yt") {
            if (type === "video") {
              const video = await getVideoInfo(args[0].trim());
              song = {
                title: video.title,
                url: video.url,
                duration: video.duration,
                durationTime: parse(video.duration),
                source: "yt",
              };
              songs.push(song);
            } else if (type === "playlist") {
              const playlist = await getPlaylistTracks(args[0].trim());
              playlist.forEach((video) => {
                song = {
                  title: video.title,
                  url: video.url,
                  duration: video.duration,
                  durationTime: parse(video.duration),
                  source: "yt",
                };
                songs.push(song);
              });
            }
          } else if (source === "sp") {
            if (playDL.is_expired()) {
              await playDL.refreshToken();
            }
            if (type === "track") {
              const track = await playDL.spotify(args[0].trim());
              const title = `${track.name} - ${track.artists.map((a) => a.name).join(", ")}`;
              song = {
                title: title,
                url: track.url,
                duration: track.durationInSec,
                durationTime: parse(track.durationInSec),
                source: "sp",
              };
              songs.push(song);
            } else if (type === "album" || type === "playlist") {
              const playlist = await playDL.spotify(args[0].trim());
              const tracks = await playlist.fetched_tracks.get("1");
              tracks.forEach((track) => {
                const title = `${track.name} - ${track.artists.map((a) => a.name).join(", ")}`;
                song = {
                  title: title,
                  url: track.url,
                  duration: track.durationInSec,
                  durationTime: parse(track.durationInSec),
                  source: "sp",
                };
                songs.push(song);
              });
            }
          } else if (source === "so") {
            const so = await playDL.soundcloud(
              await soundCloudUrl(args[0].trim()),
            );
            if (type === "track") {
              song = {
                title: so.name,
                url: so.url,
                duration: so.durationInSec,
                durationTime: parse(so.durationInSec),
                source: "sc",
              };
              songs.push(song);
            } else if (type === "playlist") {
              const tracks = await so.all_tracks();
              tracks.forEach((track) => {
                song = {
                  title: track.name,
                  url: track.url,
                  duration: track.durationInSec,
                  durationTime: parse(track.durationInSec),
                  source: "sc",
                };
                songs.push(song);
              });
            }
          }
        } catch (e) {
          return handleError(
            message,
            "❌ An unexpected error occurred while getting the track info.",
            e,
            client,
          );
        }
      }

      if (!serverQueue) {
        const queueConstructor = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: songs,
          player: null,
          loop: false,
          keep: false,
          timeoutID: undefined,
        };

        await client.queue.set(message.guild.id, queueConstructor);

        await startVoiceConnection(
          {
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
          },
          client,
          message,
          queueConstructor,
        );
      } else {
        serverQueue.songs = serverQueue.songs.concat(songs);

        if (serverQueue.songs.length === 1) {
          play(message.guild, serverQueue.songs[0], client, message);
        }

        const responseMessage =
          songs.length === 1
            ? `**Added to queue**\n${song.title} - ${song.durationTime.minutes}:${song.durationTime.seconds}`
            : `**Added to queue**\nAdded ${songs.length} songs to the queue`;

        await message.channel.send({
          content: responseMessage,
          tts: false,
          embeds: [
            {
              type: "rich",
              title: "",
              description: "",
              color: songs.length === 1 ? client.color : 0xe08e67,
              author: {
                name: responseMessage,
                icon_url: `https://cdn.discordapp.com/emojis/763415718271385610.gif`,
              },
            },
          ],
        });
      }
    } catch (err) {
      return handleError(
        message,
        "❌ An unexpected error occurred.",
        err,
        client,
      );
    }
  },
};

async function deleteMessage(msg) {
  try {
    return await msg.delete();
  } catch (e) {
    console.error("Error while deleting message:", e.message);
  }
}
