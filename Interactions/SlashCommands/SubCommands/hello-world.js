export default {
  subCommand: 'hello world',
  async execute(interaction) {
    return await interaction.reply("Seriously?");
  }
}
