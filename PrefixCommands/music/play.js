import { Client, Message } from "discord.js";

export default {
  name: "play",
  description: "plays from YouTube or SoundCloud.",
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
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      let er = await message.channel.send({
        content: '',
        embeds: [{
          title: 'Join a VC to use that command',
          color: client.color
        }]
       });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    let source = args[0].includes("soundcloud.com/")
      ? "soundcloud"
      : args[0].includes("youtube.com") || args[0].includes("youtu.be") 
        ? "youtube"
        : "ytsearch";
    
    const res = await client.poru.resolve({ query: args.join(' ').trim(), source: source, requester: message.member });
    if (res.loadType === "error") {
        return message.reply(":x: Failed to load track.");
    } else if (res.loadType === "empty") {
        return message.reply(":x: No source found!");
    }
    const player = client.poru.createConnection({
      guildId: message.guild.id,
      voiceChannel: message.member.voice.channelId,
      textChannel: message.channel.id,
      deaf: true,
    });
   // console.log(client.poru.players);
    if (res.loadType === "playlist") {
      for (const track of res.tracks) {
        track.info.requester = message.member;
        player.queue.add(track);
      }

      await message.channel.send({
        content: '',
        embeds: [{
          title: 'Added to queue',
          description: `${res.playlistInfo.name} has been loaded with ${res.tracks.length}`,
          thumbnail: {
            url: res.playlistInfo.artworkUrl
          },
          color: client.color
        }]
       });
    } else {
      const track = res.tracks[0];
      track.info.requester = message.user;
      player.queue.add(track);
     // console.log(track.info);
      await message.channel.send({
        content: '',
        embeds: [{
          title: 'Queued Track',
          description: track.info.title,
          footer: {
            text: track.info.author
          },
          thumbnail: {
            url: track.info.artworkUrl
          },
          color: client.color
        }]
       });
    }

    if (!player.isPlaying && !player.isPaused && player.isConnected) player.play();
    if (player.isPaused) {
      message.channel.send('**The player is paused.\nPlease resume it using the `p!resume` command to start playing tracks.**');
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
