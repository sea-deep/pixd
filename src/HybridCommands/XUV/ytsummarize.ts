import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { summarizeYouTubeVideo } from "../../services/YouTubeSummaryService.js";

export default new HybridCommand({
  name: "ytsummarize",
  slashRoute: "xuv ytsummarise",
  description: "Summarize a YouTube video from its captions.",
  aliases: ["ytsum", "ytsystum"],
  usage: "<youtube-url> [language-code]",
  guildOnly: true,
  options: [
    { type: ApplicationCommandOptionType.String, name: "yt-url", description: "A YouTube video URL", required: true },
    { type: ApplicationCommandOptionType.String, name: "lang-code", description: "Subtitle language code (defaults to en)" },
  ],
  execute: async (ctx, client) => {
    try {
      const language = (ctx.options.getString("lang-code") ?? "en").replace(/^-\s*/, "") || "en";
      const result = await summarizeYouTubeVideo(
        ctx.options.getString("yt-url", true)!,
        language,
      );
      return ctx.reply({ embeds: [{
        title: `Summary for: ${result.title}`,
        description: result.summary.slice(0, 4096),
        color: client.color,
        thumbnail: { url: result.thumbnail },
      }] });
    } catch (error) {
      return ctx.reply(`❌ ${error instanceof Error ? error.message : "Could not summarize this video."}`);
    }
  },
});
