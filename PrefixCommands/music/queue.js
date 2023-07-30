import { Client, Message } from "discord.js";
export default {
  name: "queue",
  description: "Shows the queue.",
  aliases: ["np" ,"q"],
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
  let pos = 999;
  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
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
            '```' +
            `No song currently playing\n----------------------------\n` +
            '```',
          color: 0x462,
        },
      ],
    }); //.then(msg => setTimeout(() => msg.delete(), 15*1000));
  }

  if (args.length == 1) {
    pos = parseInt(args[0]);
    if (pos < 0 || isNaN(pos)) {
      return;
    } else {
      pos = args[0];
    }
  }
  let nowPlaying = serverQueue.songs[0];
  let msg = `Now playing: ${nowPlaying.title}\n----------------------------\n`;
  let msg1 = ``;
  let text;
  let length = Math.min(serverQueue.songs.length, ++pos); //queue includes current playing song, so we want to show current playing + the number of songs to be shown
  //let duration = nowPlaying.duration;
  for (var i = 1; i < length; i++) {
    if (serverQueue.songs[i].seek > 0) {
      text = `${i}. ${serverQueue.songs[i].title} starting at ${serverQueue.songs[i].seekTime.minutes}:${serverQueue.songs[i].seekTime.seconds}\n`;
      //duration = nowPlaying.duration - nowPlaying.seek;
    } else {
      text = `${i}. ${serverQueue.songs[i].title}\n`;
    }
    if (text.length + msg.length < 2000) {
      msg += text;
    } else {
      msg1 += text;
    }
  }
  message.channel
    .send({
      content: '**Queue**',
      tts: false,
      embeds: [
        {
          type: 'rich',
          title: '',
          description: `\`\`\`\n${msg}\`\`\``,
          color: 0x462,
        },
      ],
    })
    .then((msg) => setTimeout(() => msg.delete(), 60 * 1000));
  if (msg1 != ``) {
    message.channel
      .send('```' + msg1 + '```')
      .then((msg) => setTimeout(() => msg.delete(), 60 * 1000));
  }
  }
};
