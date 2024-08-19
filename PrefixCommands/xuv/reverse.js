import { Client, Message } from "discord.js";
import { GOOGLE_IMG_INVERSE_ENGINE_URL } from "google-img-scrap";
import { getCaptionInput } from "../../Helpers/helpersImage.js";
export default {
  name: "reverse",
  description: "Search image from Google.",
  aliases: ["rev", "lens"],
  usage: "",
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
    const mseg = await message.reply({
      content: "",
      embeds: [
        {
          description: "Searching <a:Searching:1142532717406322809>",
          color: client.color,
        },
      ],
    });
    let images;
    try {
      images = await GOOGLE_IMG_INVERSE_ENGINE_URL(
        await getCaptionInput(message),
        { limit: 5 },
      );
    } catch (e) {
      return mseg.edit({
        content: "",
        embeds: [
          {
            description: "❎ | Couldn't find any image ",
            color: client.color,
          },
        ],
      });
    }
    client.keyv.set(mseg.id, images.result, 30);
    let img = images.result[0];
    const msg = {
      failIfNotExists: true,
      content: ``,
      tts: false,
      components: [
        {
          type: 1,
          components: [
            {
              style: 2,
              custom_id: "img_left",
              disabled: false,
              emoji: {
                id: null,
                name: "◀️",
              },
              type: 2,
            },
            {
              style: 2,
              custom_id: "img_right",
              disabled: false,
              emoji: {
                id: null,
                name: "▶️",
              },
              type: 2,
            },
            {
              style: 1,
              custom_id: "img_random",
              disabled: false,
              emoji: {
                id: null,
                name: "🔀",
              },
              type: 2,
            },
            {
              style: 1,
              custom_id: "img_input",
              disabled: false,
              emoji: {
                id: null,
                name: "🔢",
              },
              type: 2,
            },
            {
              style: 4,
              custom_id: "delete-btn",
              disabled: false,
              emoji: {
                id: null,
                name: "🗑",
              },
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: "rich",
          description: `**[${img.title}](${img.originalUrl})**`,
          title: ` Detected: ${images.search}`,
          color: client.color,
          image: {
            url: img.url,
            height: img.height,
            width: img.width,
          },
          author: {
            name: "Google Reverse Image Search",
            icon_url:
              "https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-1024.png",
          },
          footer: {
            text: `viewing page- \`1/${images.result.length}\``,
          },
        },
      ],
    };
    let sent = await mseg.edit(msg);
    await client.sleep(30200);
    if (!client.keyv.has(mseg.id)) {
      try {
        await mseg.edit({
          content: "",
          embeds: msg.embeds,
          components: [],
        });
      } catch (e) {
        console.log(e.message);
      }
    }
  },
};
