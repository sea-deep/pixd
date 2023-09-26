import { Client } from "discord.js"; 
  
export default { 
  name: 'imgInputForm', 
  /** 
    * @param {Client} client 
    */ 
  execute: async (interaction, client) => {    
    try {
      const regex = /`([^`]+)`/;  
      const matches = interaction.message.embeds[0].footer.text.match(regex);  
      const total = parseInt(matches[1].split('/')[1]) - 1;  
      const images = await client.keyv.get(interaction.message.id);  
      const val = interaction.fields.getTextInputValue('input');  
      const valueee = Number(val); 
      
      if (isNaN(valueee) || valueee >= total || valueee < 0) {  
        return interaction.reply({  
          content: "Not a valid number!",  
          ephemeral: true  
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
        color: getColor(image), 
        footer: { 
          text: msg.embeds[0].footer.text.replace('`' + (current + 1), '`' + (next + 1)) 
        } 
      }; 
      
      await interaction.deferUpdate({ ephemeral: true  
        }); 
      await interaction.message.edit({ 
        content: '', 
        embeds: [embed], 
        components: msg.components  
      });
       await client.keyv.setTTL(interaction.message.id, 30); 
        await client.sleep(30500); 
        if(!client.keyv.has(interaction.message.id)) { 
          await interaction.message.edit({   
          content: '',   
          embeds: [embed] 
          }); 
        }
    } catch (error) {
      console.error("An error occurred:", error);     
    }
  } 
}; 

function getColor(image) { 
  const r = image.averageColorObject.r; 
  const g = image.averageColorObject.g; 
  const b = image.averageColorObject.b; 
  const color = (r << 16) | (g << 8) | b;   
  return color;   
}
