import { getLyrics } from "fetch-lyrics";

export default {
  name: "lyrics",
  execute: async (interaction) => {
    let title = interaction.message.embeds[0].title.split(" - ")[1];

    await interaction.deferReply({
      ephemeral: true,
    });
    const call = await getLyrics(title);
    const lyrics = call.lyrics;
    const chunks = lyrics.match(/[\s\S]{1,3900}/g);

    chunks.forEach(async (chunk) => {
      await interaction.followUp({
        content: "",
        embeds: [
          {
            description: chunk,
            color: 0x2f3136,
          },
        ],
        ephemeral: true,
      });
    });
  },
};