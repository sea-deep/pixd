import { Client } from "discord.js";

export default {
  name: 'img_left',
  /**
    * @param {Client} client
    */
  execute: async (interaction, client) => {   
  if (interaction.member.id !== interaction.message.mentions.users.first().id) return;
    const images = client.keyv.get(interaction.message.id);
    
   const regex = /`([^`]+)`/;
const matches = interaction.message.embeds[0].footer.text.match(regex);
  const current = parseInt(matches[1].split('/')[0]) - 1;
  let next = current==0 ? images.length - 1 : current - 1;
  let image= images[next];
  let msg = interaction.message;
    const embed = {
     title: message.embeds[0].title,
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