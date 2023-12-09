import { Client } from 'discord.js';

export default {
  name: 'hangAtoY',
  /**
    * @param {Client} client
    */
  execute: async (interaction, client) => {
   let input= interaction.values[0].split('_')[1];
   let answer = client.keyv.get(`hangman${interaction.message.id}`);
   let current = interaction.message.embeds[0].fields[0].value.slice(1,-1).toLowerCase();
  
  let res = hangman(answer, current, input);
  const hangmanSteps = [
  "```\n+---+\n|   \n|\n|\n|\n|\n=========\n```",
  "```\n+---+\n|   |\n|\n|\n|\n|\n=========\n```",
  "```\n+---+\n|   |\n|   O\n|\n|\n|\n=========\n```",
  "```\n+---+\n|   |\n|   O\n|   |\n|\n|\n=========\n```",
  "```\n+---+\n|   |\n|   O\n|  /|\n|\n|\n=========\n```",
  "```\n+---+\n|   |\n|   O\n|  /|\\\n|\n|\n=========\n```",
  "```\n+---+\n|   |\n|   O\n|  /|\\\n|  /\n|\n=========\n```",
  "```\n+---+\n|   |\n|   O\n|  /|\\\n|  / \\\n|\n=========\n```"
];
  
  if (!res) {
let I = indexOf(interaction.message.embeds[0].description);
   let nextMan = hangmanSteps[I+1];
   if (I+1 == 7) {
     return interaction.message.edit({
       content: interaction.message.content+ "\nGame Over.",
       embeds: [{
         title: interaction.message.embeds[0].title,
         description: nextMan,
         footer: interaction.message.embeds[0].footer,
         fields: [{ 
           name: `The word was: ${answer.toUpperCase()}`,
           value: interaction.message.embeds[0].fields[0].value
         }]
       }],
       components: []
     });
   }
   return interaction.message.edit({
       content: interaction.message.content,
       embeds: [{
         title: interaction.message.embeds[0].title,
         description: nextMan,
         footer: interaction.message.embeds[0].footer,
         fields: [{ 
           name: interaction.message.embeds[0].fields[0].name,
           value: interaction.message.embeds[0].fields[0].value
         }]
       }],
     });
} else {
  if (res == answer) {
    return interaction.message.edit({
       content: interaction.message.content+ "\nYou Win.",
       embeds: [{
         title: interaction.message.embeds[0].title,
         description: interaction.message.embeds[0].description,
         footer: interaction.message.embeds[0].footer,
         fields: [{ 
           name: interaction.message.embeds[0].fields[0].name,
           value: `\`${res.toUpperCase()}\``
         }]
       }],
       components: []
     });
  }
  
  return interaction.message.edit({
       content: interaction.message.content,
       embeds: [{
         title: interaction.message.embeds[0].title,
         description: interaction.message.embeds[0].description,
         footer: interaction.message.embeds[0].footer,
         fields: [{ 
           name: interaction.message.embeds[0].fields[0].name,
           value: `\`${res}\``
         }]
       }],
  
     });
}
   

  }
};


function hangman(answer, current, input) {
  return answer.split('').map((char, index) => (char === input ? input : current[index])).join('') === current ? false : current.split('').map((char, index) => (answer[index] === input ? input : char)).join('');
}