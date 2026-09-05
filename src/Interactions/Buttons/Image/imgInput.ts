import Component from "../../../structures/Component.js";
import { isComponentOwner } from "../../../helpers/componentOwnership.js";
export default new Component({
  customId: "img_input",
  type: "button",
  execute: async (interaction, client) => {
    if (isComponentOwner(interaction)) {
      return interaction.showModal({
        custom_id: `imgInputForm`,
        title: `Jump to a page.`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: "input",
                label: `What page would you like to go?`,
                style: 1,
                min_length: 1,
                max_length: 3,
                placeholder: "84",
                required: true,
              },
            ],
          },
        ],
      });
    } else {
      await interaction.deferReply({
        ephemeral: true,
      });
      return interaction.followUp({
        content: "❌ *This is not your message.*",
        ephemeral: true,
      });
    }
  },
});
