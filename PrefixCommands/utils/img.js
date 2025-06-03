import { Client, Message } from "discord.js";
import { GOOGLE_IMG_SCRAP } from "google-img-scrap";


let retryCount = new Map();
export default {
  name: "img",
  description: "Search image from Google.",
  aliases: ["image", "mg"],
  usage: "img thug",
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
    const query = args.join(" ");
    const mseg = await
      message.reply({
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
      images = await GOOGLE_IMG_SCRAP({
        search: query,
        limit: 101,
        safeSearch: false,
      });
      console.log(JSON.stringify(images, null, 2));
      if (!images.result || images.result.length == 0)
        return mseg.edit({
          content: "",
          embeds: [
            {
              description: "**❌ No image found for that query.**",
              color: client.color,
            },
          ],
        });
    } catch (e) {
      if (await retryCount.get(mseg.id) >= 3) {
        retryCount.delete(mseg.id);
        return mseg.edit({
          content: "",
          embeds: [
            {
              description: `An error occurred...: ${e.message}`,
              color: client.color,
            },
          ],
        });
      }

      retryCount.has(mseg.id)
        ? retryCount.set(mseg.id, retryCount.get(mseg.id) + 1)
        : retryCount.set(mseg.id, 1);

      await mseg.edit({
        content: "",
        embeds: [
          {
            description: `An error occurred...: ${e.message}\n\nRETRYING IN 3 SECONDS`,
            color: client.color,
          },
        ],
      });
      await client.sleep(3000);
      try {
        await mseg.delete();
      } catch (e) { }
      return this.execute(message, args, client);
    }

    await client.keyv.set(mseg.id, images.result, 30);
    let img = images.result[0];
    console.log(`${process.env.LINK}/igproxy?url=${encodeURIComponent(img.url)}`)
   
    const msg = {
      failIfNotExists: false,
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
          description: `**[${img.title}](${img.originalUrl.replace(`\\u003d`, "=")})**`,
          title: `🔍 ${query}`,
          color: client.color,
          image: {
            proxy_url: `${process.env.LINK}/igproxy?url=${encodeURIComponent(img.url)}`,
            height: img.height,
            width: img.width,
          },
          author: {
            name: "Google Image Search",
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
    await client.sleep(30100);
    if (!client.keyv.has(mseg.id)) {
      try {
        await mseg.edit({
          content: "",
          components: [],
        });
      } catch (e) {
        console.log("Error while removing the components in img command");
      }
    }
  },
};
