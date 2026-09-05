import Component from "../../../structures/Component.js";
import { c4Button } from "../../../helpers/helpersConnect4.js";

export default new Component({
  customId: "fourC4",
  type: "button",
  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);
    return c4Button(interaction, 3);
  },
});
