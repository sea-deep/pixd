import { ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "donate",
    description: "Pls donate me money Im poor",
  },
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    await interaction.reply({
      content: "",
      files: [new AttachmentBuilder("./Assets/donate.mp4", "donate.mp4")],
      embeds: [
        {
          description: "UPI ID :\n```\ndeepak411@fam```",
        },
      ],
    });
  },
};
