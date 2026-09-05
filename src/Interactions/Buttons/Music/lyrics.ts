import Component from "../../../structures/Component.js";
export default new Component({
  customId: "getLyricss", type: "button",
  execute: async (interaction) => {
    await interaction.deferReply({ flags: 64 });
    try {
      const title = interaction.message.embeds[0]?.description;
      if (!title) return interaction.editReply("No song title is available.");
      const response = await fetch(`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(title)}`, { signal: AbortSignal.timeout(15_000) });
      const data = await response.json() as { lyrics?: string };
      if (!response.ok || typeof data.lyrics !== "string" || !data.lyrics.trim()) return interaction.editReply("No lyrics found.");
      const chunks = data.lyrics.match(/[\s\S]{1,3900}/g) ?? [];
      for (const [index, chunk] of chunks.slice(0, 10).entries()) {
        const payload = { embeds: [{ description: chunk, color: 0xe08e67 }] };
        if (index === 0) await interaction.editReply(payload);
        else await interaction.followUp({ ...payload, flags: 64 });
      }
    } catch { return interaction.editReply("Lyrics are temporarily unavailable. Please try again later."); }
  },
});
