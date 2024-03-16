export default {
  name: 'guessWordle',
  execute: async (interaction) => {
      if (interaction.message.mentions.users.first().id === interaction.user.id) { 
     await interaction.showModal({ 
       custom_id: `guessedWordle`,
       title: `Enter your guess`, 
       components: [ 
         { 
           type: 1, // Component row 
           components: [ 
             { 
               type: 4, // Text input component, only valid in modals 
               custom_id: 'answer', 
               label: `Enter a valid word:`, 
               style: 1, // 1 for line, 2 for paragraph 
               min_length: 5, 
               max_length: 5, 
               placeholder: 'adieu', 
               required: true, 
             }, 
           ], 
         }, 
       ], 
     }); 
   } else {
     await interaction.reply({ 
       content: '❌ *This is not your game.*', 
       ephemeral: true, 
     }); 
   }
  }
};
