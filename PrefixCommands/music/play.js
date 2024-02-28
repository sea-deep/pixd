#!/usr/bin/env node

import "dotenv/config";
import { Client, Message } from "discord.js";
import { startVoiceConnection } from "../../Utilities/voiceConnectionHandler.js";
import { play, parse } from "../../Helpers/helpersMusic.js";
import playDL from "play-dl";

playDL
  .getFreeClientID()
  .then((clientID) => {
    playDL.setToken({
      youtube: {
        cookie: process.env.YT_COOKIES,
      },
      soundcloud: {
        client_id: clientID,
      },
    });
  })
  .catch((err) => {
    console.error("Failed to get client ID:", err);
  });

export default {
  name: "play",
  description: "Plays from YouTube or SoundCloud.",
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
        let searchSource = {
          youtube: "video",
        };
        let query = message.content
          .substring(message.content.indexOf(" "), message.content.length)
          .trim();
        if (args[0].trim() == "-sc" || args[0].trim() == "-soundcloud") {
          searchSource = {
            soundcloud: "tracks",
          };
          query = message.content
            .substring(
              message.content.indexOf(" ", message.content.indexOf(" ") + 1),
              message.content.length,
            )
            .trim();
        }

        const searchMsg = await message.react("<:search:1090725319884951623>");
        let search;
        try {
          search = await playDL.search(query, {
            limit: 1,
            source: searchSource,
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
          if ("soundcloud" in searchSource) {
            song.title = search[0].name;
            song.source = "so";
          }
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

            message.channel.send({
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
        } else if (source === "so") {
          return message.react("<:error:1090721649621479506>");
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
          if (songs.length > 1) {
          } else {
            if (song.seek > 0) {
              return message.react("<:seek:1090718780545581116>");
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
                      name: `${song.title} - ${song.durationTime.minutes}:${song.durationTime.seconds}`,
                      icon_url: `https://media.discordapp.net/attachments/1011986872500764672/1090737187869438033/icons8-cd.gif`,
                    },
                  },
                ],
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error.message);
      return message.react("<:error:1090721649621479506>");
    }
  },
};
