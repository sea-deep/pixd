import { Client, Message } from "discord.js";
import urban from "relevant-urban";

export default {
  name: "ud",
  description: "Search urban dictionary",
  aliases: ["urbandictionary"],
  usage: "p!ud hello",
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
  execute: async (message, args, client) => {
    let res = await urban.search(args.join(" "));
    def = res.list[0];
    await message.reply({
      content: "",
      tts: false,
      embeds: [
        {
          type: "rich",
          title: def.word,
          description: def.definition,
          color: 0x6969,
          fields: [
            {
              name: "Example:",
              value: def.example,
            },
          ],
          author: {
            name: def.author,
            url: `https://urbandictionary.com/`,
            icon_url: `https://images.crunchbase.com/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/u8zidc2jnlhz3n1dcbrr`,
          },
          footer: {
            text: `👍:${def.thumbs_up} | 👎:${def.thumbs_down}`,
          },
          url: def.permalimk,
        },
      ],
    });
  },
};
