import { Client } from "discord.js";

export default {
  name: 'imgInputForm',
  /**
    * @param {Client} client
    */
  execute: async (interaction, client) => {   
    const regex = /`([^`]+)`/; 
   const matches = interaction.message.embeds[0].footer.text.match(regex); 
   const total = parseInt(matches[1].split('/')[1]) - 1; 
   const images = client.keyv.get(interaction.message.id); 
   let val = interaction.fields.getTextInputValue('input'); 
    let valueee = Number(val);
    if (isNaN(valueee) || valueee >= total) { 
      return interaction.reply({ 
        content: "Not a valid number!", 
        ephemeral: true 
      });
    } 
  let current = parseInt(matches[1].split('/')[0]) - 1;
  let next = valueee;
  let image= images[next];
  let msg = interaction.message;
    const embed = {
     title: interaction.message.embeds[0].title,
     description: `**[${image.title}](${image.originalUrl})**`,
     image: {
          url: image.url,
          height: image.height,
          width: image.width
        },
      color: getColor(image),
      footer: {
        text: msg.footer.replace('`'+(current+1), '`'+(next+1))
      }
     };
    await interaction.deferUpdate();
      await interaction.message.edit(
      {
          content: '',
          embeds: [embed],
          components: msg.components 
          }); 
  }
};
function getColor(image) {
    const r = image.averageColorObject.r;
    const g = image.averageColorObject.g;
    const b = image.averageColorObject.b;
    const color = (r << 16) | (g << 8) | b;  
    return color;  
}