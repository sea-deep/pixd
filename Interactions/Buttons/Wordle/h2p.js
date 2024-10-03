import emojis from "../../../Assets/emojis.js"

export default {
  name: "htpWordle",
  execute: async (interaction, client) => {
    const desc = [
      `• After each guess, the color of the tiles will change to show how close your guess was to the word.\n`,
      `**Tile color meanings:**\n`,
      `${emojis.green.w} ${emojis.gray.e} ${emojis.gray.a} ${emojis.gray.r} ${emojis.gray.y}`,
      `The letter **W** is present in this word and is in the correct spot.\n`,
      `${emojis.gray.p} ${emojis.gray.i} ${emojis.yellow.v} ${emojis.gray.o} ${emojis.gray.t}`,
      `The letter **V** is in the word but in wrong spot.\n`,
      `${emojis.green.v} ${emojis.green.a} ${emojis.gray.l} ${emojis.green.u} ${emojis.green.e}`,
      `The letter **L** is not in the word in any spot`,
    ].join(`\n`);
    await interaction.reply({
      ephemeral: true,
      content: `**HOW TO PLAY**`,
      tts: false,
      embeds: [
        {
          type: "rich",
          title: `Guess the WORDLE in 6 tries.`,
          description: desc,
          color: 0xe08e67,
          footer: {
            text: `Play now p!wordle`,
          },
        },
      ],
    });
  },
};
