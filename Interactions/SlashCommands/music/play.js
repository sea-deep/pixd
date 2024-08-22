import {
    ChatInputCommandInteraction,
    AttachmentBuilder,
    Client,
  } from "discord.js";
  

export default {
  data: {
    name: "play",
    description: "0. Play music from Youtube Soundcloud,etc.",
    options: [
      {
        type: 3,
        name: "query",
        description: "Search query or song URL",
        required: true,
      },
    ],
  },
  
  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    await interaction.reply('<:sent:1276093659820855396>');
    let query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      let er = await interaction.channel.send({
        content: '',
        embeds: [{
          title: 'Join a VC to use that command',
          color: client.color
        }]
       });
      await client.sleep(5000);
      return deleteMessage(er);
    }

    let source = query.includes("soundcloud.com/")
      ? "soundcloud"
      : query.includes("youtube.com") || query.includes("youtu.be") 
        ? "youtube"
        : "ytmsearch";

    const res = await client.poru.resolve({ query: query.trim(), source: source, requester: interaction.member });

    if (res.loadType === "error") {
        return interaction.channel.send(":x: Failed to load track.");
    } else if (res.loadType === "empty") {
        return interaction.channel.send(":x: No source found!");
    }
    const player = client.poru.createConnection({
      guildId: interaction.guild.id,
      voiceChannel: interaction.member.voice.channelId,
      textChannel: interaction.channel.id,
      deaf: true,
    });
   // console.log(client.poru.players);
    if (res.loadType === "playlist") {
      for (const track of res.tracks) {
        track.info.requester = message.member;
        player.queue.add(track);
      }

      await interaction.channel.send({
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
      track.info.requester = interaction.user;
      player.queue.add(track);
     // console.log(track.info);
      await interaction.channel.send({
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
    
  },
};




async function deleteMessage(msg) {
    try {
      return msg.delete();
    } catch (e) {
      return;
    }
  }
  