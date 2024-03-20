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
    if (res.list.length == 0) {
      return message.reply({
        failIfNotExists: true,
        content: "",
        tts: false,
        embeds: [
          {
            type: "rich",
            title: "Not found",
            description: "Couldn't find a definition for this word.",
            color: client.color,
            author: {
              name: "urbandictionary",
              url: "https://urbandictionary.com/",
              icon_url:
                "https://images.crunchbase.com/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/u8zidc2jnlhz3n1dcbrr",
            },
          },
        ],
      });
    } else {
      
      let def = res.list[0];
      let msg = await message.reply({
        failIfNotExists: true,
        content: "",
        tts: false,
        components: [
          {
            type: 1,
            components: [
              {
                style: 1,
                custom_id: `ud_left`,
                disabled: false,
                emoji: {
                  id: null,
                  name: `◀`,
                },
                type: 2,
              },
              {
                style: 2,
                label: `1/${res.list.length}`,
                custom_id: `nulll`,
                disabled: true,
                type: 2,
              },
              {
                style: 1,
                custom_id: `ud_right`,
                disabled: false,
                emoji: {
                  id: null,
                  name: `▶`,
                },
                type: 2,
              },
              {
                style: 5,
                label: `Get the “${def.word}” mug.`,
                url: `https://urbandictionary.store/products/mug?defid=${def.defid}`,
                disabled: false,
                emoji: {
                  id: null,
                  name: `🍵`,
                },
                type: 2,
              },
            ],
          },
        ],
        embeds: [
          {
            type: "rich",
            title: def.word,
            description: def.definition.replaceAll(/\[(.*?)\]/g, (match, word) => `[${word}](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)})`),
            color: client.color,
            fields: [
              {
                name: "Example:",
                value: def.example.replaceAll(/\[(.*?)\]/g, (match, word) => `[${word}](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)})`),
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
            url: def.permalink,
          },
        ],
      });
    await client.keyv.set(`ud${msg.id}`, args.join(" "), 30*60*1000);
    }
  },
};
