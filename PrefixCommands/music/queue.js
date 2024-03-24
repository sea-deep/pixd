import { Client, Message } from "discord.js";
export default {
  name: "queue",
  description: "Shows the queue.",
  aliases: ["np", "q"],
  usage: "queue",
  guildOnly: false,
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
      return message.channel.send({
        content: 'Queue',
        tts: false,
        embeds: [
          {
            type: 'rich',
            title: '',
            description:
              `No song currently playing\n----------------------------\n`,
            color: client.color,
          },
        ],
      });
    }

    const nowPlaying = serverQueue.songs[0];
    let msg = `**Now playing:**\n${nowPlaying.title}\n**Playing Next:**\n`;
    
    for (let i = 1; i < Math.min(serverQueue.songs.length, 11); i++) {
      const song = serverQueue.songs[i];
      msg += `${i}. ${song.title}\n`;
    }

    message.channel.send({
      content: '',
      tts: false,
      embeds: [
        {
          type: 'rich',
          title: 'Music Queue',
          description: `${msg}`,
          color: client.color,
          footer: {
            text: `Total songs in queue: ${serverQueue.songs.length-1}`
          }
        },
      ],
    });
  },
};

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
