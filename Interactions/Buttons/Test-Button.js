export default {
  name: 'test',
  execute: async (interaction) => {
   await interaction.deferUpdate();

   await interaction.followUp("It's Dangerous to go Alone... 🛡️ Go into `Interactions/Buttons/Test-Button.js` to edit this text.")
  }
}
