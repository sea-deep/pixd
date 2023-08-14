export default {
  name: 'delete-btn',
  execute: async (interaction) => {
    const perms = interaction.member.permissions.toArray();
    const requiredPerms = [
      'Administrator',
      'ManageMessages'
      ];
    if (perms.includes(requiredPerms) || interaction.member.id === interaction.message?.mentions.users.first().id || interaction.member.id === interaction.message.interaction.user.id || interaction.member.username === "sea.deep") {
      return interaction.message.delete();
    } else return;
  }
};