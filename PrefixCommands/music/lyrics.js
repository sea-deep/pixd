import { Client, Message } from "discord.js";

export default {
  name: "lyrics",
  description: "Get Lyrics of any song",
  aliases: ["bol"],
  usage: "lyrics",
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
    let title;
    if (args.length > 0) {
      title = args.join(" ");
    }

    if (!message.member.voice.channel && !title) {
      return message.react("<:error:1090721649621479506>");
    }
 
    if(message.member.voice.channel) {
      let player = client.poru.players.get(message.guild.id);
      if(player && player.isPlaying && player.isConnected) {
        if (!title) { 
          title = `${player.currentTrack.info.title} ${player.currentTrack.info.author}`;
        }
      }
    }
    if (!title) {
      return message.react("<:error:1090721649621479506>");
    } 

    let res = await fetch('https://api.popcat.xyz/lyrics?song='+ encodeURIComponent(title));
    
    let data = await res.json();
  //  console.log(data)
    if (data.error) {
      return message.reply({
        content: "",
        embeds: [
          {
            title: "Couldn’t find any lyrics for this song.",
            description: '`' + data.error + '`',
            color: 0xe08e67,
          },
        ],
      });
    }
    title = `${data.title} ${data.artist}`;

    await message.reply({
      content: "",
      embeds: [
        {
          title: `Lyrics`,
          description: `${title}`,
          color: 0xe08e67,
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: "Click Here",
              custom_id: "getLyricss",
              disabled: false,
            },
          ],
        },
      ],
    });
  },
};
