import { Client, Message } from "discord.js";
import { startVoiceConnection } from "../../Utilities/voiceConnectionHandler.js";
import { play, parse, soundCloudUrl } from "../../Helpers/helpersMusic.js";
import playDL from "play-dl";


export default {
  name: 'play',
  description: 'Plays from YouTube or Spotify or SoundCloud.',
  aliases: ['p'],
  usage: 'play <link>|<search query>',
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

      let song = {};
      let songs = [];

      let check;

      try {
        check = await playDL.validate(await soundCloudUrl(args[0].trim()));
      } catch (error) {
        let er = await message.reply({
          content: '',
          embeds: [
            {
              author: {
                name: '❌ An unexpected error occurred while validating your query.',
              },
              description: error.message,
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
      }

      if (!check) {
        let er = await message.reply({
          content: '',
          embeds: [
            {
              author: {
                name: "❌ Couldn't find a valid url or search query in your message",
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
      } else if (check === 'search') {
        let query = args.join(' ');
        const searchMsg = await message.react('<:search:1090725319884951623>');
        let search;
        try {
          search = await playDL.search(query, {
            limit: 1,
            source: {
              youtube: 'video',
            },
          });
        } catch (e) {
          console.log('Error while searching song', e.message);
          let er = await message.reply({
            content: '',
            embeds: [
              {
                author: {
                  name: '❌ An unexpected error occurred while searching the track.',
                },
                description: e.message,
                color: client.color,
              },
            ],
          });
          await client.sleep(5000);
          try {
            searchMsg.remove();
          } catch (e) {
            return;
          }
          return deleteMessage(er);
        }

        try {
          await searchMsg.remove();
        } catch (er) {
          return;
        }

        if (search.length == 0) {
          let er = await message.reply({
            content: '',
            embeds: [
              {
                author: {
                  name: '❌ No track found for that search query.',
                },
                color: client.color,
              },
            ],
          });
          await client.sleep(5000);
          return deleteMessage(er);
        } else {
          song = {
            title: search[0].title,
            url: search[0].url,
            duration: search[0].durationInSec,
            durationTime: parse(search[0].durationInSec),
            source: 'yt',
          };
          songs.push(song);
        }
      } else {
        let source = check.split('_')[0];
        let type = check.split('_')[1];
        if (source === 'yt') {
          if (type === 'video') {
            let video;
            try {
              video = await playDL.video_basic_info(args.join(' '));
            } catch (e) {
              let er = await message.reply({
                content: '',
                embeds: [
                  {
                    author: {
                      name: '❌ An unexpected error occurred while getting the track info.',
                    },
                    description: e.message,
                    color: client.color,
                  },
                ],
              });
              await client.sleep(5000);
              return deleteMessage(er);
            }
            song = {
              title: video.video_details.title,
              url: video.video_details.url,
              duration: video.video_details.durationInSec,
              durationTime: parse(video.video_details.durationInSec),
              source: 'yt',
            };
            songs.push(song);
          } else if (type === 'playlist') {
            let playlist;
            try {
              playlist = await playDL.playlist_info(args[0], {
                incomplete: true,
              });
            } catch (e) {
              console.log('error while getting video info', e.message);
              let er = await message.reply({
                content: '',
                embeds: [
                  {
                    author: {
                      name: '❌ An unexpected error occurred while getting the track info.',
                    },
                    description: e.message,
                    color: client.color,
                  },
                ],
              });
              await client.sleep(5000);
              return deleteMessage(er);
            }
            const videos = await playlist.all_videos();

            videos.forEach(function (video) {
              song = {
                title: video.title,
                url: video.url,
                duration: video.durationInSec,
                durationTime: parse(video.durationInSec),
                source: 'yt',
              };
              songs.push(song);
            });
          }
        } else if (source === 'sp') {
          if (playDL.is_expired()) {
            await playDL.refreshToken();
          }
          if (type === 'track') {
            let track;
            try {
              track = await playDL.spotify(args[0].trim());
            } catch (e) {
              console.log('error while getting video info', e.message);
              let er = await message.reply({
                content: '',
                embeds: [
                  {
                    author: {
                      name: '❌ An unexpected error occurred while getting the track info.',
                    },
                    description: e.message,
                    color: client.color,
                  },
                ],
              });
              await client.sleep(5000);
              return deleteMessage(er);
            }

            let title = `${track.name} - ${track.artists
              .map((a) => a.name)
              .join(', ')}`;
            song = {
              title: title,
              url: track.url,
              duration: track.durationInSec,
              durationTime: parse(track.durationInSec),
              source: 'sp',
            };
            songs.push(song);
          } else if (type === 'album' || type === 'playlist') {
            let playlist;
            try {
              playlist = await playDL.spotify(args[0].trim());
            } catch (e) {
              console.log(
                'error while getting spotify playlist info',
                e.message
              );
              let er = await message.reply({
                content: '',
                embeds: [
                  {
                    author: {
                      name: '❌ An unexpected error occurred while getting the track info.',
                    },
                    description: e.message,
                    color: client.color,
                  },
                ],
              });
              await client.sleep(5000);
              return deleteMessage(er);
            }
            const tracks = await playlist.fetched_tracks.get('1');

            tracks.forEach(function (track) {
              let title = `${track.name} - ${track.artists
                .map((a) => a.name)
                .join(', ')}`;
              song = {
                title: title,
                url: track.url,
                duration: track.durationInSec,
                durationTime: parse(track.durationInSec),
                source: 'sp',
              };
              songs.push(song);
            });
          }
        } else if (source === 'so') {
          const so = await playDL.soundcloud(
            await soundCloudUrl(args[0].trim())
          );
          if (type === 'track') {
            song = {
              title: so.name,
              url: so.url,
              duration: so.durationInSec,
              durationTime: parse(so.durationInSec),
              source: 'sc',
            };
            songs.push(song);
          } else if (type === 'playlist') {
            const tracks = await so.all_tracks();
            tracks.forEach(function (track) {
              song = {
                title: track.name,
                url: track.url,
                duration: track.durationInSec,
                durationTime: parse(track.durationInSec),
                source: 'sc',
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

        await client.queue.set(message.guild.id, queueConstructor);

        await startVoiceConnection(
          {
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
          },
          client,
          message,
          queueConstructor
        );
      } else {
        if (serverQueue?.songs.length == 0) {
          serverQueue.songs = serverQueue.songs.concat(songs);
          play(message.guild, serverQueue.songs[0], client, message);
        } else {
          serverQueue.songs = serverQueue.songs.concat(songs);

          if (songs.length == 1) {
            return message.channel.send({
              content: '**Added to queue**',
              tts: false,
              embeds: [
                {
                  type: 'rich',
                  title: '',
                  description: '',
                  color: client.color,
                  author: {
                    name: `${song.title} - ${song.durationTime.minutes}:${song.durationTime.seconds}`,
                    icon_url: `https://cdn.discordapp.com/emojis/763415718271385610.gif`,
                  },
                },
              ],
            });
          } else {
            return message.channel.send({
              content: '**Added to queue**',
              tts: false,
              embeds: [
                {
                  type: 'rich',
                  title: '',
                  description: '',
                  color: 0xe08e67,
                  author: {
                    name: `Added ${songs.length} songs to the queue`,
                    icon_url: `https://cdn.discordapp.com/emojis/763415718271385610.gif`,
                  },
                },
              ],
            });
          }
        }
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error.message);
      let er = await message.reply({
        content: '',
        embeds: [
          {
            author: {
              name: '❌ An unexpected error occurred.',
            },
            description: error.message,
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }
  },
};

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
