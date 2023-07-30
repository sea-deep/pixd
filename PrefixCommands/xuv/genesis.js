import { AttachmentBuilder, Message } from "discord.js";
import nodeCraiyon from 'craiyon'; 
const craiyon = new nodeCraiyon.Client();
export default {
  name: "genesis",
  description: "Generate ai images",
  aliases: ["imagine"],
  usage: "genesis [prompt]",
  guildOnly: false,
  args: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
    * @param {Message} message
    */
  execute: async (message, args) => {
       const prompt = args.join(' ');
    if (!prompt) { 
       message.reply('❌ **Please give something to genesis*'); 
    } 
    let mes = await message.reply({ 
          content: `>>> OK genesissing: **${prompt}** <a:loading:1049025849439043635>\nMight take a minute or two.`, 
      tts: false, 
      components: [ 
        { 
          type: 1, 
          components: [ 
            { 
              type: 2, 
              style: 4, 
              label: 'STOP', 
              custom_id: 'delete_btn', 
              disabled: false, 
              emoji: { 
                id: null, 
                name: '🛑', 
                } 
            }, 
          ], 
        }, 
      ], 
    }); 
   let response; 
   try { 
   response = await craiyon.generate({ 
   prompt: prompt, 
 }); 
   } catch (e) { 
 return mes.edit({ 
         content: `>>> ayyo saar genesis failed :fail:`, 
         embed: {type: 'rich', description: `${e.message}`}, 
         tts: false    
 }); 
 }
   const attachments = []; 
 response._images.forEach((base64Image, index) => { 
   const base64Data = base64Image.base64.replace(/^data:image\/\w+;base64,/, ''); 
   const imageBuffer = Buffer.from(base64Data, 'base64'); 
   const fileName = `${prompt}_${index}.jpg`;  
   let attachment= new AttachmentBuilder(imageBuffer, {name: fileName}); 
 attachments.push(attachment); 
   }); 
  
 let editMessageResponse = await mes.edit({ 
   content: `>>> Genesisation Done! \nHere is your **${prompt}**`, 
   components: [ 
         { 
           type: 1, 
           components: [ 
             { 
               type: 2, 
               style: 4, 
               label: 'DELETE', 
               custom_id: 'delete_btn', 
               disabled: false, 
               emoji: { 
                 id: null, 
                 name: '🗑️', 
                 } 
             }, 
           ], 
         }, 
       ], 
   files: attachments 
 }); 
 return editMessageResponse;
  }
};
