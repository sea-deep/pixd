import { Client } from "discord.js";  
  
 export default {  
   name: 'img_right',  
   /**  
     * @param {Client} client  
     */  
   execute: async (interaction, client) => { 
    if (interaction.member.id !== interaction.message.mentions.users.first().id) return; 
   await interaction.deferUpdate(); 
       const images = await client.keyv.get(interaction.message.id);  
  
       if (!images || images.length === 0) {
         await interaction.message.edit({
           components: []
         });
         return interaction.followUp({
           content: '',
           ephemeral:true,
           embeds: [{
             description: "No images found.",
             color: client.color
           }]
         }); 
       } 
  
       const regex = /`([^`]+)`/;  
       const matches = interaction.message.embeds[0].footer.text.match(regex);  
       const current = parseInt(matches[1].split('/')[0]) - 1; 
       const next = current === images.length - 1 ? 0 :  current + 1;
       const image = images[next];
       const msg = interaction.message;
       
       const embed = {  
         title: msg.embeds[0].title,  
         description: `**[${image.title}](${image.originalUrl})**`,  
         image: {  
           url: image.url,  
           height: image.height,  
           width: image.width  
         },  
         color: client.color,  
         footer: {  
           text: msg.embeds[0].footer.text.replace('`' + (current + 1), '`' + (next + 1))  
         }  
       };  
  
       
     await interaction.message.edit({  
         content: '',  
         embeds: [embed],
       });
       await client.keyv.setTTL(interaction.message.id, 30);
       await client.sleep(30500);
       if(!client.keyv.has(interaction.message.id)) {
         try {
          await interaction.message.edit({
          components: []
          });
         } catch(e) {
           console.log("Error while removing components in image command:", e.message);
         }
       }
   }  
 };  
  