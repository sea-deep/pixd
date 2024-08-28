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
 //   console.log(title)
    if (!title) {
      return message.react("<:error:1090721649621479506>");
    } 

    let res = await searchGenius(title);
  
  //  console.log(data)
    if (!res) {
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
 

    await message.reply({
      content: "",
      embeds: [
        {
          title: `Lyrics`,
          description: `${res.title}`,
          color: 0xe08e67,
          url: res.url
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
              custom_id: "genius",
              disabled: false,
            },
          ],
        },
      ],
    });
  },
};


async function searchGenius(q) {
  let url = "https://api.genius.com/search?q=" + encodeURIComponent(q);
  let x = await fetch(url, {
    headers: {
      Authorization: "Bearer " + process.env.GENIUS_ACCESS_TOKEN,
    },
  });
  let y = await x.json();
  if (y.meta.status !== 200 || y.response.hits.length === 0) return null;
  let songs = y.response.hits.filter((hit) => hit.type === "song");
  //console.log(songs[0].result.url);
  let out = null;
  if (songs.length !== 0) {
    out = {
      url: songs[0].result.url,
      title: songs[0].result.full_title,
    };
  }
  return out;
}