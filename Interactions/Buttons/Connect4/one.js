import { c4Button } from "../../../Helpers/helpersConnect4.js";

export default {
  name: "oneC4",
  execute: async (interaction) => {
    await client.interactionDefer(interaction);
    return c4Button(interaction, 0);
  },
};
