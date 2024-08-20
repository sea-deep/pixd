import { Client, Message } from "discord.js";

export default {
  name: "skip",
  description: "Skips the current track.",
  aliases: ["next"],
  usage: "skip <number(optional)>",
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
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      let er = await message.channel.send(embedder('', 'Please join a voice channel..'));
      await client.sleep(5000);
      return deleteMessage(er);
    }

    const player = client.poru.createConnection({
      guildId: message.guild.id,
      voiceChannel: message.member.voice.channelId,
      textChannel: message.channel.id,
      deaf: true,
  });
   let res = await player.skip();
   console.log(res)
  },
};

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}



function embedder(content, title, description) {
  const result = {
    content: content
  };

  if (title || description) {
    result.embeds = [
      {
        title: title || undefined,
        description: description || undefined,
        color: 0xe08e67
      }
    ];
  }

  return result;
}
