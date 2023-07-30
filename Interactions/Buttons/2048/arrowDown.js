import { move, message2048, parseDesc, calculateScore } from "../../../Helpers/helpers2048.js";

export default {
  name: '2048down',
  execute: async (interaction) => {
      const description = interaction.message.embeds[0].description; 
   let newDescription = move(description, 'down'); 
  
   let msg = message2048({ 
     description: newDescription, 
     score: calculateScore(parseDesc(newDescription)), 
   }); 
   await interaction.deferUpdate();
   return interaction.message.edit(msg);
  }
}
