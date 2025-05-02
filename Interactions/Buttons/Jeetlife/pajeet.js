import { ButtonInteraction } from "discord.js";
import User from "../../../Utilities/jeetModel.js";
export default {
    name: "pajeeta",
    /**
     * 
     * @param {ButtonInteraction} interaction 
     */
    execute: async (interaction) => {
        await interaction.reply({
            content: `**You are now a Pajeet**`,
            ephemeral: true,
        });
        await interaction.message.edit({
            components: [],
        });
         await User.updateOne({ userID: interaction.user.id }, { $inc: { gender: "Male"} });
       
    }
}