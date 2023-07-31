import { Client } from 'discord.js';

export default {
  name: 'imgInputForm',

  /**
    * @param {Client} client
    */
  async execute(interaction, client) {
   const regex = /`([^`]+)`/;
const matches = interaction.message.content.match(regex);
  const total = parseInt(matches[1].split('/')[1]) - 1;
  const images = client.keyv.get(interaction.message.id);
 //console.log(images)
  let val = interaction.fields.getTextInputValue('input');
   let valueee = Number(val)
 //   console.log(val, valueee)
   if (isNaN(valueee) || valueee >= total) {
     return interaction.reply({
       content: "Not a valid number!",
       ephemeral: true
     })
   }
    const current = parseInt(matches[1].split('/')[0]) - 1;
    let next = valueee;
  let image= images[next];
  let msg = interaction.message;
  let content = msg.content.split('\n');
    content[1] = content[1].replace('`'+(current+1), '`'+(next+1));
   
 const embed = {
     title: image.origin.title,
     description: `via **[${image.origin.website.name}](https://${image.origin.website.domain})**`,
     image: {
          url: image.url,
          height: image.height,
          width: image.width
        },
             color: 0x666,
     url: image.origin.website.url
     };
        await interaction.deferUpdate();
      await interaction.message.edit(
      {
          
          content: content.join('\n'),
          embeds: [embed],
          components: msg.components 
          }); 
    
  }
}
