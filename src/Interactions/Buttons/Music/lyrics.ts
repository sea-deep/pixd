import { ButtonInteraction, Client } from "discord.js";
import Component from "../../../structures/Component.js";
import {
  chunkLyrics,
  fetchLyrics,
  formatLyrics,
  getCachedLyrics,
} from "../../../services/music/LyricsService.js";

export default new Component({
  customId: "lyrics-view",
  type: "button",
  execute: async (interaction: ButtonInteraction, client: Client, ...params: string[]) => {
    // Acknowledge ephemerally so only the user who clicked sees the full lyrics
    await interaction.deferReply({ flags: 64 });

    try {
      const cacheId = params[0];
      let result = cacheId ? getCachedLyrics(cacheId) : null;

      if (!result) {
        // Fallback if cache expired or missing: re-parse title & artist from message embed
        const embed = interaction.message.embeds[0];
        const rawTitle = embed?.title?.replace(/^🎶\s*/, "") || "";
        const title = rawTitle.replace(/^\[(.*)\]\(.*\)$/, "$1").trim();
        const artist = embed?.author?.name?.trim();

        if (title) {
          result = await fetchLyrics(title, artist);
        }
      }

      if (!result || !result.lyrics) {
        return interaction.editReply("❌ Lyrics could not be retrieved for this track.");
      }

      const formatted = formatLyrics(result.lyrics);
      const chunks = chunkLyrics(formatted);
      const firstChunk = chunks.shift() || "";

      const primaryEmbed = {
        title: result.geniusUrl ? `🎶 [${result.title}](${result.geniusUrl})` : `🎶 ${result.title}`,
        author: result.artist ? { name: result.artist } : undefined,
        description: firstChunk,
        thumbnail: result.thumbnail ? { url: result.thumbnail } : undefined,
        color: (client as any)?.color || 0xe08e67,
      };

      await interaction.editReply({ embeds: [primaryEmbed] });

      // If lyrics span multiple chunks, send remaining chunks ephemerally
      for (const chunk of chunks) {
        await interaction.followUp({
          embeds: [{ description: chunk, color: (client as any)?.color || 0xe08e67 }],
          flags: 64,
        });
      }
    } catch {
      return interaction.editReply("❌ Lyrics are temporarily unavailable. Please try again later.");
    }
  },
});
