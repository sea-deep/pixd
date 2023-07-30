import { Message } from "discord.js";
import { message2048, parseDesc, calculateScore, makeDesc, spawnRandom } from "../../Helpers/helpers2048.js";
export default {
  name: "2048",
  description: "Play 2048 on Discord",
  aliases: [""],
  usage: "2048",
  guildOnly: false,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
    * @param {Message} message
    */
  execute: async (message) => {
    const emoji = '<:0_:1133755630633635952>'; 
 const board = [ 
   `${emoji}${emoji}${emoji}${emoji}`, 
   `${emoji}${emoji}${emoji}${emoji}`, 
   `${emoji}${emoji}${emoji}${emoji}`, 
   `${emoji}${emoji}${emoji}${emoji}`, 
 ].join('\n'); 
  
   let newBoard = spawnRandom(parseDesc(board), 2); 
   let description = makeDesc(newBoard); 
  
   let msg = message2048({ 
     description: description, 
     score: calculateScore(newBoard), 
   }); 
   await message.reply(msg);
  }
};
