import { Client, Message } from "discord.js"; 
import config from "../../Configs/config.js"; 

const prefix = config.prefix; 

export default { 
  event: "messageCreate", 
  /** 
   * @param {Client} client 
   * @param {Message} message 
   */ 
  execute: async (message, client) => {
    if (config.restricted.includes(message.author.id)) return;
    if (message.content === `<@${client.user.id}>`) {
      message.reply({
       content: '',
       embeds: [{
        description: `**The Prefix is:** \`${prefix}\``,
        color: client.color
      }] 
     });
    } 
    if (message.author.bot) return;

    if (!message.content.toLowerCase().startsWith(prefix)) return; 

    const args = message.content.slice(prefix.length).trim().split(/ +/); 
    const commandName = args.shift().toLowerCase(); 
    const command = 
      client.prefixCommands.get(commandName) || 
      client.prefixCommands.find(cmd => cmd.aliases[0] !== "" && cmd.aliases.includes(commandName)); 

    if (!command) {
      return;
    }

    if (command?.guildOnly && message.channel.type === "dm") { 
      return message.reply({
       content: '',
       embeds: [{
        description: "❌ **I can't execute that command inside DMs!**",
        color: client.color
      }] 
     }); 
    } 

    if (command?.args && !args.length) { 
      let reply = `❌ **You didn't provide any arguments**`; 
      if (command.usage) { 
        reply += `\n**The proper usage would be:** \`${prefix}${command.usage}\``; 
      } 
      return message.reply({
       content: '',
       embeds: [{
        description: reply,
        color: client.color
      }] 
     }); 
    } 

    try { 
      command.execute(message, args, client); 
    } catch (err) { 
      process.stdout.write(`Error in MessageCreate: ${err}\n`); 
      message.reply({
       content: '',
       embeds: [{
        description: "*There was an error trying to execute that command!*",
        color: client.color
      }] 
     }); 
    } 
  },
};