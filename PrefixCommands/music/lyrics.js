import { Client, Message } from "discord.js";
import { getLyrics } from "fetch-lyrics";

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

    let serverQueue = client.queue.get(message.guild.id);
    if (!message.member.voice.channel && !title) {
      return message.react("<:error:1090721649621479506>");
    }
    if ((!serverQueue || serverQueue.songs.length == 0) && !title) {
      return message.react("<:error:1090721649621479506>");
    } else if(!title) {
      title = serverQueue.songs[0].title;
    }
   try {
      console.log(title)
     let call = await getLyrics(title);
      title = call.title;


    } catch (e) {
      console.log(e)
      return message.reply("❌ **No lyrics found for this song!**");
    }

    await message.reply({
      content: "",
      embeds: [
        {
          title: `Lyrics for - ${title}`,

          color: 0x2f3136,
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
              custom_id: "lyrics",
              disabled: false,
            },
          ],
        },
      ],
    });
  },
};
