import {Client, Message} from 'discord.js';

export default {
  name: 'skip',
  description: 'Skips the current track.',
  aliases: ['next'],
  usage: 'skip <number(optional)>',
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

    if (!serverQueue || serverQueue.songs.length === 0) {
      let er = await message.reply({
        content: '',
        embeds: [
          {
            author: {
              name: '❌ No song to skip.',
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    if (args.length === 0) {
      serverQueue.player.stop();
      return message.react('<:skip:1090718541143097464>');
    }

    let pos = parseInt(args[0]);
    if (isNaN(pos)) {
      let query = message.content
        .substring(message.content.indexOf(' '), message.content.length)
        .trim();
      if (args[0] === 'last' || args[0] === 'end') {
        pos = serverQueue.songs.length - 1;
      } else {
        const regex = new RegExp(query, 'i');
        pos = serverQueue.songs.findIndex((s) => regex.test(s.title));
      }

      if (pos < 0) {
        let er = await message.reply({
          content: '',
          embeds: [
            {
              author: {
                name: '❌ Failed to skip the given track.',
              },
              color: client.color,
            },
          ],
        });
        await client.sleep(5000);
        return deleteMessage(er);
      }
    } else if (pos > serverQueue.songs.length - 1 || pos < 0) {
      let er = await message.reply({
        content: '',
        embeds: [
          {
            author: {
              name: '❌ Failed to skip the given track',
            },
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    if (pos === 0) {
      serverQueue.player.stop();
      return message.react('<:skip:1090718541143097464>');
    }

    message.react('<:skip:1090718541143097464>');
    serverQueue.songs.splice(pos, 1);
    serverQueue.keep = false;
  },
};

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
