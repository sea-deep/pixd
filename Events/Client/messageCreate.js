import { Client, Message } from "discord.js"; 
 import config from "../../Configs/config.js"; 
 import { findClosestMatch } from "../../Helpers/stringMatch.js";
 const prefix = config.prefix; 
  import translate from "google-translate-api-x";
 export default { 
   event: "messageCreate", 
   /** 
     * @param {Client} client 
     * @param {Message} message 
     */ 
   execute: async (message, client) => { 
     if (message.content === `<@${client.user.id}>`) { message.reply(`**The Prefix is:** \`${prefix}\``) } 
     if (message.author.bot === true) return; 


if (message.content.startsWith("-boost") { 
let m = await 
message.guild.members.fetch(message.mentions.users.first().id)
await client.emit("guildMemberUpdate", message.member, m) }


if (message.channel.id === "1140305947852550275" || message.channel.id == "1140334592369364992") {
    if (message.content || message.content !== "") {
        const webhook = await message.channel.createWebhook({
            name: message.member.displayName,
            avatar: message.member.displayAvatarURL({
                extension: 'webp',
                forceStatic: true
            }),
            reason: 'allu'
        });
        const res = await translate(message.content, { to: 'te' });
        await message.delete();     
        await webhook.send(res.text);
        await webhook.delete();
    }
}
     if (message.content.toLowerCase().startsWith(prefix) === false) return; 

     const args = message.content.slice(prefix.length).trim().split(/ +/); 
     const commandName = args.shift().toLowerCase(); 
     const command = 
       client.prefixCommands.get(commandName) || 
       client.prefixCommands.find( 
         (cmd) => cmd.aliases[0] !=="" && cmd.aliases.includes(commandName) 
       ); 
if (!command) {
      const closestMatch = findClosestMatch(commandName, Array.from(client.prefixCommands.keys()));
      if (closestMatch) {
        return message.reply(`❓ **Did you mean \`${prefix}${closestMatch}\`?**`);
      } else {
        return;
      } 
}
     if (command.guildOnly && message.channel.type === "dm") { 
       return message.reply("❌ **I can't execute that command inside DMs!**"); 
     } 
  
     if (command.args && !args.length) { 
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