import { Client } from "discord.js"; 
  
export default { 
  name: 'imgInputForm', 
  /** 
    * @param {Client} client 
    */ 
  execute: async (interaction, client) => {
       await interaction.deferUpdate(); 
      const regex = /`([^`]+)`/;  
      const matches = interaction.message.embeds[0].footer.text.match(regex);  
      const total = parseInt(matches[1].split('/')[1]) - 1;  
      const images = await client.keyv.get(interaction.message.id);  
      const val = interaction.fields.getTextInputValue('input');  
      const valueee = Number(val); 
      
      if (isNaN(valueee) || valueee >= total || valueee < 0) {  
        return interaction.followUp({  
          content: "",  
          ephemeral: true,
          embeds: [{
            description: 'Not a valid number!',
            color: client.color
          }]
        }); 
      }  

      const current = parseInt(matches[1].split('/')[0]) - 1; 
      const next = valueee - 1; 
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
        components: msg.components  
      });
       await client.keyv.setTTL(interaction.message.id, 30); 
       await client.sleep(30500); 
       if(!client.keyv.has(interaction.message.id)) {
        try{
          await interaction.message.edit({   
          content: '',   
          components: [],
          });
        }  catch (e) {
          console.log("Error while removing components in image command:", e.message);
        }
      }
  } 
}; 


