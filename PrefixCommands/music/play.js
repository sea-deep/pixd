import "dotenv/config";
import { Client, Message } from "discord.js";
import { startVoiceConnection } from "../../Utilities/voiceConnectionHandler.js";
import { play, parse } from "../../Helpers/helpersMusic.js";
import playDL from "play-dl";

await playDL.setToken({
  youtube: {
    cookie: process.env.YT_COOKIES,
  },
  spotify: {
    client_id: process.env.SPOT_ID,
    client_secret: process.env.SPOT_SECRET,
    refresh_token: process.env.SPOT_TOKEN,
    market: 'US'
  }
});

export default {
  name: "play",
  description: "Plays from YouTube or Spotify.",
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
  execute: async (message, args, client) => {
    try {
      let serverQueue = client.queue.get(message.guild.id);
      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel) {
        return message
          .react("<:error:1090721649621479506>")
          .catch((error) =>
            console.error("Failed to add reactions:", error.message),
          );
      }

      let song = {};
      let songs = [];

      let check;

      try {
        check = await playDL.validate(args[0].trim());
      } catch (error) {
        console.error("Error validating play-dl:", error.message);
        return message.react("<:error:1090721649621479506>");
      }

      if (!check) {
        return message.react("<:error:1090721649621479506>");
      } else if (check === "search") {
        let query = args.join(" ");

        const searchMsg = await message.react("<:search:1090725319884951623>");
        let search;
        try {
          search = await playDL.search(query, {
            limit: 1,
            source: {
              youtube: "video",
            },
          });
        } catch (e) {
          console.log("Error while searching song", e.message);
          return message.react("<:error:1090721649621479506>");
        }

        await searchMsg
          .remove()
          .catch((error) =>
            console.error("Failed to remove reactions:", error),
          );

        if (search.length == 0) {
          return message.react("<:error:1090721649621479506>");
        } else {
          song = {
            title: search[0].title,
            url: search[0].url,
            duration: search[0].durationInSec,
            durationTime: parse(search[0].durationInSec),
            source: "yt",
          };
          songs.push(song);
        }
      } else {
        let source = check.split("_")[0];
        let type = check.split("_")[1];

        if (source === "yt") {
          if (type === "video") {
            let video;
            try {
              video = await playDL.video_info(args[0]);
            } catch (e) {
              console.log("error while getting video info", e.message);
              return message.react("<:error:1090721649621479506>");
            }
            song = {
              title: video.video_details.title,
              url: video.video_details.url,
              duration: video.video_details.durationInSec,
              durationTime: parse(video.video_details.durationInSec),
              source: "yt",
            };
            songs.push(song);
          } else if (type === "playlist") {
            let playlist;
            try {
              playlist = await playDL.playlist_info(args[0], {
                incomplete: true,
              });
            } catch (e) {
              console.log("error while getting video info", e.message);
              return message.react("<:error:1090721649621479506>");
            }
            const videos = await playlist.all_videos();

            videos.forEach(function (video) {
              song = {
                title: video.title,
                url: video.url,
                duration: video.durationInSec,
                durationTime: parse(video.durationInSec),
                source: "yt",
              };
              songs.push(song);
            });
          }
        } else if (source === "sp") {
          if (type === "track") {
            let track;
            try {
              track = await playDL.spotify(args[0]);
            } catch (e) {
              console.log("error while getting video info", e.message);
              return message.react("<:error:1090721649621479506>");
            }
            // Making title better
            let title = `${track.name} - ${track.artists
              .map((a) => a.name)
              .join(", ")}`;
            song = {
              title: title,
              url: track.url,
              duration: track.durationInSec,
              durationTime: parse(track.durationInSec),
              source: "sp",
            };
            songs.push(song);
          } else if (type === "album" || type === "playlist") {
            let playlist;
            try {
              playlist = await playDL.spotify(args[0]);
            } catch (e) {
              console.log(
                "error while getting spotufy playlist info",
                e.message,
              );
              return message.react("<:error:1090721649621479506>");
            }
            const tracks = await playlist.fetched_tracks.get("1");

            tracks.forEach(function (track) {
              let title = `${track.name} - ${track.artists
                .map((a) => a.name)
                .join(", ")}`;
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

        client.queue.set(message.guild.id, queueConstructor);

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
        if (serverQueue?.songs.length == 0) {
          serverQueue.songs = serverQueue.songs.concat(songs);
          play(message.guild, serverQueue.songs[0], client, message);
        } else {
          serverQueue.songs = serverQueue.songs.concat(songs);

          if (songs.length == 1) {
            return message.channel.send({
              content: "**Added to queue**",
              tts: false,
              embeds: [
                {
                  type: "rich",
                  title: "",
                  description: "",
                  color: 0x462,
                  author: {
                    name: `${song.title} - ${song.durationTime.minutes}:${song.durationTime.seconds}`,
                    icon_url: `https://media.discordapp.net/attachments/1011986872500764672/1090737187869438033/icons8-cd.gif`,
                  },
                },
              ],
            });
          } else {
            return message.channel.send({
              content: "**Added to queue**",
              tts: false,
              embeds: [
                {
                  type: "rich",
                  title: "",
                  description: "",
                  color: 0x462,
                  author: {
                    name: `Added ${songs.length} songs to the queue`,
                    icon_url: `https://media.discordapp.net/attachments/1011986872500764672/1090737187869438033/icons8-cd.gif`,
                  },
                },
              ],
            });
          }
        }
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error.message);
      return message.react("<:error:1090721649621479506>");
    }
  },
};
