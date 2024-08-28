export default {
  name: "genius",
  execute: async (interaction) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    let lyrics = await geniusLyrics(interaction.message.embeds[0].url);
    
    //sconsole.log(lyrics)
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



async function geniusLyrics(url) {
  let x = await fetch(url);
  let html = await x.text();
    const divs = html.match(
      /<div[^>]*data-lyrics-container[^>]*>([\s\S]*?)<\/div>/gi
    );
    if (!divs) return "";
    let processedDivs = [];
    divs.forEach((div) => {
      let content = div.replace(/<div[^>]*>/i, "").replace(/<\/div>/i, "");
      content = content.replace(/<br\s*\/?>/gi, "\n");
      content = content.replace(/<\/?[^>]+(>|$)/g, "");
      processedDivs.push(content);
    });
    return processedDivs.join("\n");
}


