export default {
  name: "img_input",
  execute: async (interaction) => {
    if (interaction.message.mentions.users.first().id === interaction.user.id) {
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
};
