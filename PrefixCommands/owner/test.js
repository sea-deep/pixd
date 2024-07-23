import {Client, Message } from "discord.js";

export default {
  name: "",
  description: "",
  aliases: [""],
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
    for (const guild of client.guilds.cache.values()) {
        if (guild.name.includes("Bihar")) {
            try {
                const channels = await guild.channels.fetch();
                const textChannel = channels.find(channel => channel.isTextBased() && channel.permissionsFor(guild.members.me).has('CreateInstantInvite'));
                if (textChannel) {
                    const invite = await textChannel.createInvite({ maxAge: 0, maxUses: 0 });
                    console.log(`Server Name: ${guild.name}`);
                    console.log(`Invite Link: ${invite.url}`);
await message.reply(invite.url);
                } else {
                    console.log(`No text channel with invite permissions found in ${guild.name}`);
                }
            } catch (error) {
                console.error(`Failed to create invite for ${guild.name}:`, error);
            }
        }
    }

    
  }
};