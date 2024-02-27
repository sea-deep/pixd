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
      message.reply(`**The Prefix is:** \`${prefix}\``);
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
      return message.reply("❌ **I can't execute that command inside DMs!**"); 
    } 

    if (command?.args && !args.length) { 
      let reply = `❌ **You didn't provide any arguments, ${message.author}!**`; 
      if (command.usage) { 
        reply += `\n**The proper usage would be:** \`${prefix}${command.usage}\``; 
      } 
      return message.channel.send(reply); 
    } 

    try { 
      command.execute(message, args, client); 
    } catch (err) { 
      process.stdout.write(`MessageCreate: ${err}\n`); 
      message.reply("*There was an error trying to execute that command!*"); 
    } 
  },
};