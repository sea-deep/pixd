import { Client, Message } from "discord.js";
import { client } from "../../index.js";

client.poru.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  return channel.send(`Now playing \`${track.info.title}\``);
});


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
      let er = await message.channel.send(embedder('', 'Please join a voice channel..'));
      await client.sleep(5000);
      return deleteMessage(er);
    }

    let source = args[0].includes("https://soundcloud.com/")
      ? "scsearch"
      : args[0].includes("youtube.com")
        ? "ytsearch"
        : "ytmsearch";

    const res = await client.poru.resolve({ query: args.join(' ').trim(), source: source, requester: message.member });

    if (res.loadType === "error") {
        return message.reply(embedder(":x: Failed to load track."));
    } else if (res.loadType === "empty") {
        return message.reply(embedder(":x: No source found!"));
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
        track.info.requester = message.user;
        player.queue.add(track);
      }

      message.reply(embedder('', 'Added to queue'
        `${res.playlistInfo.name} has been loaded with ${res.tracks.length}`
      ));
    } else {
      const track = res.tracks[0];
      track.info.requester = message.user;
      player.queue.add(track);
      message.reply(embedder(``, 'Queued Track', track.info.title));
    }

    if (!player.isPlaying && player.isConnected) player.play();
    
  },
};

async function deleteMessage(msg) {
  try {
    return await msg.delete();
  } catch (e) {
    console.error("Error while deleting message:", e.message);
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
