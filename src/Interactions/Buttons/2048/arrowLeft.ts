import Component from "../../../structures/Component.js";
import {
  move,
  message2048,
  parseDesc,
  calculateScore,
} from "../../../helpers/helpers2048.js";

export default new Component({
  customId: "2048left",
  type: "button",
  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);
    const description = interaction.message.embeds[0].description;
    let newDescription = move(description, "left");

    let msg = message2048({
      description: newDescription,
      score: calculateScore(parseDesc(newDescription)),
    });
    return interaction.message.edit(msg);
  },
});
