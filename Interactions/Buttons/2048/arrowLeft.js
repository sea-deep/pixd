import {
  move,
  message2048,
  parseDesc,
  calculateScore,
} from "../../../Helpers/helpers2048.js";

export default {
  name: "2048left",
  execute: async (interaction) => {
    await client.interactionDefer(nteraction);
    const description = interaction.message.embeds[0].description;
    let newDescription = move(description, "left");

    let msg = message2048({
      description: newDescription,
      score: calculateScore(parseDesc(newDescription)),
    });
    return interaction.message.edit(msg);
  },
};
