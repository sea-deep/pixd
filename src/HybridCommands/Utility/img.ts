import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { searchImages } from "../../services/ImageSearchService.js";
import { resolveEmbedImageUrl } from "../../helpers/helpersImage.js";
import emote from "../../../Configs/emote.js";

export default new HybridCommand({
  name: "img",
  slashRoute: "imagesearch",
  description: "Search Google images and browse the available results.",
  aliases: ["image", "mg"],
  usage: "<query>",
  guildOnly: true,
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "query",
    description: "What image should I search for?",
    required: true,
  }],
  execute: async (ctx, client) => {
    const query = ctx.options.getString("query", true)!;
    const status = await ctx.reply({
      embeds: [{ description: `Searching ${emote.searching}`, color: client.color }],
    });

    try {
      const images = await searchImages(query, { limit: 250, safeSearch: true });
      if (images.length === 0) {
        return ctx.editReply({
          embeds: [{ description: "**❌ No image found for that query.**", color: client.color }],
        });
      }

      await client.keyv.set(status.id, images, 30);
      const image = images[0];
      return ctx.editReply({
        content: "",
        components: [{
          type: 1,
          components: [
            { style: 2, custom_id: "img_left", emoji: { name: "◀️" }, type: 2 },
            { style: 2, custom_id: "img_right", emoji: { name: "▶️" }, type: 2 },
            { style: 1, custom_id: "img_random", emoji: { name: "🔀" }, type: 2 },
            { style: 1, custom_id: "img_input", emoji: { name: "🔢" }, type: 2 },
            { style: 4, custom_id: `delete-btn:${ctx.user.id}`, emoji: { name: "🗑" }, type: 2 },
          ],
        }],
        embeds: [{
          description: `**[${image.title}](${image.originalUrl})**`,
          title: `🔍 ${query}`,
          color: client.color,
          image: { url: resolveEmbedImageUrl(image), height: image.height, width: image.width },
          author: { name: `Image Search · ${image.source}` },
          footer: { text: `viewing page- \`1/${images.length}\`` },
        }],
      });
    } catch (error) {
      return ctx.editReply({
        embeds: [{
          description: `❌ ${error instanceof Error ? error.message : "Image search failed."}`,
          color: client.color,
        }],
      });
    }
  },
});
