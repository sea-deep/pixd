export default {
  name: "getLyricss",
  execute: async (interaction) => {
    await interaction.deferReply({
      ephemeral: true,
    });
    let title = interaction.message.embeds[0].title.split(" - ")[1];

    let res = await fetch('https://api.popcat.xyz/lyrics?song='+ encodeURIComponent(title));
    let data = await res.json();
    let lyrics = data.lyrics;
    //  console.log(lyrics)
    const chunks = lyrics.match(/[\s\S]{1,3900}/g);

    chunks.forEach(async (chunk) => {
      await interaction.followUp({
        content: "",
        embeds: [
          {
            description: chunk,
            color: 0xe08e67,
          },
        ],
        ephemeral: true,
      });
    });
  },
};
