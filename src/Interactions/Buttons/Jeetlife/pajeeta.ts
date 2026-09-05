import Component from "../../../structures/Component.js";
import { ButtonInteraction} from "discord.js";
import User from "../../../Utilities/jeetModel.js";
import { isComponentOwner } from "../../../helpers/componentOwnership.js";
export default new Component({
  customId: "pajeeta",
  type: "button",
    /**
     * 
     * @param {ButtonInteraction} interaction 
     */
    execute: async (interaction) => {
        if (!isComponentOwner(interaction)) return interaction.reply({ content: "❌ This is not your setup.", ephemeral: true });
        await interaction.reply({
            content: `**You are now a Pajeeta**`,
            ephemeral: true,
        });
        await interaction.message.edit({
            components: [],
        });
         await User.updateOne({ userID: interaction.user.id }, { $set: { gender: "Female"} });
       
    }
});
