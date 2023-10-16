import { Client } from 'discord.js';
import axios from "axios";
export default {
  name: 'getWordDef',
  /**
  * @param {Client} client
  */
  execute: async (interaction, client) => {
  let word = client.keyv.get(interaction.message.id);
    let key = process.env.DICTIONARY_API_KEY;
   let resp = await axios( 
`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${key}`);

   let shortdef = resp.data[0].shortdef ? '- **' + resp.data[0].shortdef.join('**\n- **') + '**' : '`couldn’t find lmao`'; 
   return interaction.reply( 
     `The definitions for \`${word}\` are:\n${shortdef}` 
   );
  }
}
