import { ApplicationCommandOptionType, AttachmentBuilder } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";

export default new HybridCommand({
  name: "genesis",
  slashRoute: "xuv genesis",
  description: "Generate an AI image.",
  aliases: ["gen"],
  usage: "<prompt>",
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "prompt",
    description: "The image prompt",
    required: true,
  }],
  execute: async (ctx) => {
    const prompt = ctx.options.getString("prompt", true)!.trim();
    try {
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
      const response = await fetch(imageUrl, { signal: AbortSignal.timeout(90_000) });
      if (!response.ok) throw new Error(`Image provider returned HTTP ${response.status}.`);

      const image = Buffer.from(await response.arrayBuffer());
      if (image.length === 0) throw new Error("Image provider returned an empty file.");
      const filename = `${prompt.replace(/[^a-z0-9]+/gi, "_").slice(0, 80) || "genesis"}.jpg`;
      return ctx.reply({
        embeds: [{ description: `>>> Genesisation done!\nHere is your **${prompt.slice(0, 300)}**`, image: { url: `attachment://${filename}` } }],
        components: [{ type: 1, components: [{ type: 2, style: 4, label: "DELETE", custom_id: `delete-btn:${ctx.user.id}`, emoji: { name: "🗑️" } }] }],
        files: [new AttachmentBuilder(image, { name: filename })],
      });
    } catch (error) {
      return ctx.reply({ embeds: [{
        title: "Genesis failed",
        description: error instanceof Error ? error.message : "Unknown image-generation error.",
      }] });
    }
  },
});
