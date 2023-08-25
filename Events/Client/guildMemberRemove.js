import { Client, GuildMember } from "discord.js";

export default {
  event: "guildMemberRemove",
  /**
    * @param {Client} client
    * @param {GuildMember} member
    */
  execute: async (member, client) => {
    switch (member.guild.id) { 
       case '804902112700923954': 
         await sendOkbb(member, client); 
         break; 
       case '1062998378293776384': 
         await sendPajeet(member, client);
         break;
       case '883291433925242950' :
         await  sendSs(member, client);
         break;
       default: 
         break;
    }
    async function sendSs(member, client) {
    let channelId = "883299030359228457";
    let channel = client.channels.cache.get(channelId); 
   channel.send(`**${member.user.tag}** Left.`); 
 }
}
    async function sendOkbb(member, client) {
        let channel = client.channels.cache.get('1128609011852390400'); 
   channel.send(`ayyo saar **${member.user.tag}** gayaa`); 
 }
 async function sendPajeet(member) { 
   let channel = client.channels.cache.get('1065736446981451776'); 
   channel.send(`**${member.user.tag}** sirs went on a phoren trip`);
    }
  }
};
