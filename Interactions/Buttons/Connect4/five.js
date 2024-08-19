import { c4Button } from "../../../Helpers/helpersConnect4.js";

export default {
  name: "fiveC4",
  execute: async (interaction) => {
    await interaction.deferUpdate();
    return c4Button(interaction, 4);
  },
};
