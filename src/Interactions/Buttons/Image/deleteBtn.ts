import Component from "../../../structures/Component.js";
import { isComponentOwner } from "../../../helpers/componentOwnership.js";
export default new Component({
  customId: "delete-btn",
  type: "button",

  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);
    if (
      interaction.memberPermissions?.has("ManageMessages") || isComponentOwner(interaction)
    ) {
      return interaction.message.delete();
    } else {
      return interaction.followUp({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: "**You cannot delete this message.**",
            color: client.color,
          },
        ],
      });
    }
  },
});
