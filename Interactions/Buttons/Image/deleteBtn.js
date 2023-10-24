import { Client } from "discord.js";

export default {
  name: 'delete-btn',
  /**
  * @param { Client } client
  */
  execute: async (interaction, client) => {
    const perms = interaction.member.permissions.toArray();
    const requiredPerms = [
      'Administrator',
      'ManageMessages'
      ];
    if (perms.includes(requiredPerms) || interaction.member.id === interaction.message.mentions?.users.first().id || interaction.member.user.username === "sea.deep" || interaction.member.id === interaction.message.interaction?.user.id) {
      await client.keyv.delete(interaction.message.id);
      return interaction.message.delete();
    } else return;
  }
};