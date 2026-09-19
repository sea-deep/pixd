import Component from "../../../structures/Component.js";
import { fetchLyrics } from "../../../services/music/LyricsService.js";

export default new Component({
  customId: "getLyricss",
  type: "button",
  execute: async (interaction) => {
    await interaction.deferReply({ flags: 64 });
    try {
      const title = interaction.message.embeds[0]?.description;
      if (!title) return interaction.editReply("No song title is available.");

      const result = await fetchLyrics(title);
      if (!result || !result.lyrics) return interaction.editReply("No lyrics found.");

      const chunks = result.lyrics.match(/[\s\S]{1,3900}/g) ?? [];
      for (const [index, chunk] of chunks.slice(0, 10).entries()) {
        const payload = {
          embeds: [{
            title: index === 0 ? (result.geniusUrl ? `🎶 [${result.title}](${result.geniusUrl})` : `🎶 ${result.title}`) : undefined,
            author: index === 0 && result.artist ? { name: result.artist } : undefined,
            description: chunk,
            thumbnail: index === 0 && result.thumbnail ? { url: result.thumbnail } : undefined,
            color: 0xe08e67,
          }],
        };
        if (index === 0) await interaction.editReply(payload);
        else await interaction.followUp({ ...payload, flags: 64 });
      }
    } catch {
      return interaction.editReply("Lyrics are temporarily unavailable. Please try again later.");
    }
  },
});
