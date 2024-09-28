export default {
  name: "test",
  execute: async (interaction) => {
    await client.interactionDefer(interaction);

    await interaction.followUp(
      "It's Dangerous to go Alone... 🛡️ Go into `Interactions/Buttons/Test-Button.js` to edit this text.",
    );
  },
};
