#!/usr/bin/env node
import "dotenv/config";
import { Client, Message } from "discord.js";
import {
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import playDL from "play-dl";

playDL.getFreeClientID()
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
    console.error('Failed to get client ID:', err);
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


  execute: async (message, args, client) => {
    try {
      let serverQueue = client.queue.get(message.guild.id);
      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel) {
        return message.react("<:error:1090721649621479506>").catch((error) => console.error("Failed to add reactions:", error.message));
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
      let searchSource = { youtube: "video" };
      let query = message.content.substring(message.content.indexOf(" "), message.content.length).trim();
      if (args[0].trim() == "-sc" || args[0].trim() == "-soundcloud") {
        searchSource = { soundcloud: "tracks" };
        query = message.content.substring(
          message.content.indexOf(" ", message.content.indexOf(" ") + 1),
          message.content.length
        ).trim();
      }

      const searchMsg = await message.react("<:search:1090725319884951623>");
    try {
      const search = await playDL.search(query, {
        limit: 1,
        source: searchSource,
      });
    } catch(e) { console.log("Error while searching song", e.message")}

      await message.reactions.cache
        .get("1090725319884951623")
        .remove()
        .catch((error) => console.error("Failed to remove reactions:", error));

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
          const video = await playDL.video_info(args[0]);
          song = {
            title: video.video_details.title,
            url: video.video_details.url,
            duration: video.video_details.durationInSec,
            durationTime: parse(video.video_details.durationInSec),
            source: "yt",
          };
          songs.push(song);
        } else if (type === "playlist") {
          const playlist = await playDL.playlist_info(args[0], {
            incomplete: true,
          });

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

      try {
        let connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
        });

        queueConstructor.connection = connection;
        queueConstructor.player = createAudioPlayer();

        connection.on("stateChange", (oldState, newState) => {
          let oldNetworking = Reflect.get(oldState, "networking");
          let newNetworking = Reflect.get(newState, "networking");

          const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            let newUdp = Reflect.get(newNetworkState, "udp");
            clearInterval(newUdp?.keepAliveInterval);
          };

          oldNetworking?.off("stateChange", networkStateChangeHandler);
          newNetworking?.on("stateChange", networkStateChangeHandler);
        });

        queueConstructor.connection = connection;
        queueConstructor.player = createAudioPlayer();
        connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
          try {
            await Promise.race([
              entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
              entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
          } catch (error) {
            console.log(`Forcibly destroyed the bot.`);
            connection.destroy();
            client.queue.delete(message.guild.id);
          }
        });

        const userCheck = setInterval(() => {
          if (voiceChannel.members.size == 1 && getVoiceConnection(message.guild.id) != undefined) {
            clearInterval(userCheck);
            destroy(message.guild, client);
            console.log(`No active users, bot has disconnected from "${message.guild.name}"`);
          }
        }, 60 * 1000);

        play(message.guild, queueConstructor.songs[0], client);
      } catch (err) {
        console.log(err);
        client.queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      if (serverQueue?.songs.length == 0) {
        serverQueue.songs = serverQueue.songs.concat(songs);
        play(message.guild, serverQueue.songs[0], client);
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



async function play(guild, song, client) {
  const serverQueue = client.queue.get(guild.id);
  if (!song) {
    serverQueue.timeoutID = setTimeout(() => {
      if (getVoiceConnection(guild.id) !== undefined) {
        destroy(guild, client);
        serverQueue.timeoutID = undefined; //after timeout goes off, reset timeout value.
      } else {
        console.log("Bot was disconnected during the timeout.");
      }
    }, 10 * 60 * 1000); //10 min idle

    if (serverQueue.loop === true) {
      serverQueue.loop = false;
    }
    return;
  }

  clearTimeout(serverQueue.timeoutID);
  serverQueue.timeoutID = undefined;

  try {
    let stream;
    if (song.source === "yt" && song.seek > 0) {
      stream = await playDL.stream(song.url, { seek: song.seek });
    } else {
      stream = await playDL.stream(song.url);
    }

    let resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });
    serverQueue.connection.subscribe(serverQueue.player);
    serverQueue.player.play(resource);

    var errorListener = (error) => {
      console.error(`Error: ${error.message} with resource ${error.resource.title}`);
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
      play(guild, serverQueue.songs[0], client);
    });

    if (serverQueue.loop === true) {
      // Handle loop logic here if needed
    } else {
      if (song.seek > 0) {
        // Handle seek logic here if needed
      } else {
        serverQueue.textChannel.send({
          content: "**Now Playing**",
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
  } catch (error) {
    console.error(`Error while playing: ${error.message}`);
  }
}

function destroy(guild, client) {
  try {
    getVoiceConnection(guild.id).destroy();
    client.queue.delete(guild.id);
  } catch (error) {
    console.error(`Error while destroying connection: ${error.message}`);
  }
}


