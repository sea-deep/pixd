import azlyrics from "azlyrics-lyric-scraper";

export default {
  name: "getLyrics",
  execute: async (interaction) => {
    let title = interaction.message.embeds[0].title.split(" - ")[1];

    await interaction.deferReply({
      ephemeral: true,
    });
    const call = await azlyrics.searchSong(title);
    const lyrics = await getLyrics(call.songs[0].url);
   console.log(lyrics)
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


async function getLyrics(url) {
  console.log(url)
   const r = await fetch(url);

    if (!r.ok) {
      throw new Error(`Failed to fetch lyrics. Status: ${r.status}`);
    }
    const htmlText = await r.text();
    const indexOfComment = htmlText.indexOf(
      "Usage of azlyrics.com content by any third-party lyrics provider is prohibited by our licensing agreement. Sorry about that."
    );
    const startIndex = htmlText.lastIndexOf("<div", indexOfComment);
    const endIndex = htmlText.indexOf("</div>", indexOfComment) + 6;
    const lyrics = htmlText
    .substring(startIndex, endIndex)
    .replace(/<!--[^>]*-->/g, "")
    .replace(/<br>/g, "")
    .replace(/<\/?div[^>]*>/g, "")
    .replace(/<\/?i[^>]*>/g, "")
    .trim();

    return lyrics;
}