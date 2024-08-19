export default {
  name: "guessWordle",
  execute: async (interaction) => {
    if (interaction.message.mentions.users.first().id !== interaction.user.id) {
      return interaction.reply({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: "❌ *This is not your game.*",
            color: 0xe08e67,
          },
        ],
      });
    }
    await interaction.showModal({
      custom_id: `guessedWordle`,
      title: `Enter your guess`,
      components: [
        {
          type: 1, // Component row
          components: [
            {
              type: 4, // Text input component, only valid in modals
              custom_id: "answer",
              label: `Enter a valid word:`,
              style: 1, // 1 for line, 2 for paragraph
              min_length: 5,
              max_length: 5,
              placeholder: "adieu",
              required: true,
            },
          ],
        },
      ],
    });
  },
};
