import {
  move,
  message2048,
  parseDesc,
  calculateScore,
} from "../../../Helpers/helpers2048.js";

export default {
  name: "2048right",
  execute: async (interaction) => {
    await client.interactionDefer(interaction);
    const description = interaction.message.embeds[0].description;
    let newDescription = move(description, "right");

    let msg = message2048({
      description: newDescription,
      score: calculateScore(parseDesc(newDescription)),
    });
    return interaction.message.edit(msg);
  },
};
