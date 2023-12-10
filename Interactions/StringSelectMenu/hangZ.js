import { Client } from 'discord.js';

export default {
  name: 'hangAtoY',
  /**
    * @param {Client} client
    */
  execute: async (interaction, client) => {
   await interaction.deferUpdate();
   if (interaction.message.mentions.users.first().id != interaction.member.id) return;
   let input= interaction.values[0].split('_')[1];
   let answer = client.keyv.get(`hangman${interaction.message.id}`);
   let current = interaction.message.embeds[0].fields[0].value.split("\n")[1].toLowerCase();

  let res = hangman(answer, current, input);

  const hangmanSteps = [
  "https://iili.io/JTa8KbI.png",
  "https://iili.io/JTa8qxt.png",
  "https://iili.io/JTa8BWX.png",
  "https://iili.io/JTa8Csn.png",
  "https://iili.io/JTa8ofs.png",
  "https://iili.io/JTa8zgf.png",
  "https://iili.io/JTa8TJ4.png",
  "https://iili.io/JTa8u5l.png"
];
  if (!res) {
let I = hangmanSteps.indexOf(interaction.message.embeds[0].image.url);
   let nextMan = hangmanSteps[I+1];
   if (I+1 == 7) {
     return interaction.message.edit({
       content: interaction.message.content+ "\nGame Over.",
       embeds: [{
         title: interaction.message.embeds[0].title,
         image: {url: nextMan, height:681, width:512},
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
         image: {url: nextMan, height:681, width:512},
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
         image: interaction.message.embeds[0].image,
         footer: interaction.message.embeds[0].footer,
         fields: [{ 
           name: interaction.message.embeds[0].fields[0].name,
           value: `\`\`\`\n${res.toUpperCase()}\n\`\`\``
         }]
       }],
       components: []
     });
  }

  return interaction.message.edit({
       content: interaction.message.content,
       embeds: [{
         title: interaction.message.embeds[0].title,
        image: interaction.message.embeds[0].image,
         footer: interaction.message.embeds[0].footer,
         fields: [{ 
           name: interaction.message.embeds[0].fields[0].name,
           value: `\`\`\`\n${res.toUpperCase()}\n\`\`\``
         }]
       }],

     });
}


  }
};


function hangman(answer, current, input) {
  return answer.split('').map((char, index) => (char === input ? input : current[index])).join('') === current ? false : current.split('').map((char, index) => (answer[index] === input ? input : char)).join('');
}