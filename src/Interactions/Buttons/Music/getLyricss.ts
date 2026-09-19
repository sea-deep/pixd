import { ButtonInteraction, Client } from "discord.js";
import Component from "../../../structures/Component.js";
import {
  chunkLyrics,
  fetchLyrics,
  formatLyrics,
} from "../../../services/music/LyricsService.js";

export default new Component({
  customId: "getLyricss",
  type: "button",
  execute: async (interaction: ButtonInteraction, client: Client) => {
    await interaction.deferReply({ flags: 64 });

    try {
      const embed = interaction.message.embeds[0];
      const title = embed?.description || embed?.title?.replace(/^🎶\s*/, "") || "";
      const artist = embed?.author?.name;

      if (!title) return interaction.editReply("❌ No song title is available.");

      const result = await fetchLyrics(title, artist);
      if (!result || !result.lyrics) return interaction.editReply("❌ No lyrics found.");

      const formatted = formatLyrics(result.lyrics);
      const chunks = chunkLyrics(formatted);
      const firstChunk = chunks.shift() || "";

      await interaction.editReply({
        embeds: [{
          title: `🎶 ${result.title}`,
          url: result.geniusUrl,
          author: result.artist ? { name: result.artist } : undefined,
          description: firstChunk,
          thumbnail: result.thumbnail ? { url: result.thumbnail } : undefined,
          color: (client as any)?.color || 0xe08e67,
        }],
      });

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
