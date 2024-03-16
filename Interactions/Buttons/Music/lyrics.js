import { getLyrics, searchSong  } from "../../../Helpers/helpersMusic.js";

export default {
  name: "getLyrics",
  deferReply: true,
  execute: async (interaction) => {
    let title = interaction.message.embeds[0].title.split(" - ")[1];
    
    const call = await searchSong(title);
    const lyrics = await getLyrics(call.songs[0].url);
 //  console.log(lyrics)
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

