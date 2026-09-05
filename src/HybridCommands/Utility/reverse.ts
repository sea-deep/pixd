import HybridCommand from "../../structures/HybridCommand.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { Client, Message } from "discord.js";
import { GOOGLE_IMG_INVERSE_ENGINE_URL } from "../../services/ImageSearchService.js";
export default new HybridCommand({
  name: "reverse",
  description: "Search image from Google.",
  aliases: ["rev", "lens"],
  usage: "",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  options: [
    { type: 3, name: "arguments", description: "Command text and arguments, in prefix order" },
    { type: 6, name: "user", description: "Target user" },
    { type: 6, name: "user2", description: "Second target" },
    { type: 6, name: "user3", description: "Third target" },
    { type: 11, name: "image", description: "Input image or attachment" },
  ],
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const args = input.args;
    const mseg = await ctx.reply({
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
        await contextImage(ctx, true),
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
    if (!Array.isArray(images?.result) || images.result.length === 0) {
      return mseg.edit({ embeds: [{ description: "No reverse-image results found.", color: client.color }] });
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

                name: "◀️",
              },
              type: 2,
            },
            {
              style: 2,
              custom_id: "img_right",
              disabled: false,
              emoji: {

                name: "▶️",
              },
              type: 2,
            },
            {
              style: 1,
              custom_id: "img_random",
              disabled: false,
              emoji: {

                name: "🔀",
              },
              type: 2,
            },
            {
              style: 1,
              custom_id: "img_input",
              disabled: false,
              emoji: {

                name: "🔢",
              },
              type: 2,
            },
            {
              style: 4,
              custom_id: "delete-btn",
              disabled: false,
              emoji: {

                name: "🗑",
              },
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {

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
        console.log(e instanceof Error ? e.message : String(e));
      }
    }
  },
});
