import { Client, Message } from "discord.js";
import {GOOGLE_IMG_SCRAP} from "google-img-scrap";
export default {
  name: "img",
  description: "Search image from Google.",
  aliases: ["image", "mg"],
  usage: "img thug",
  guildOnly: true,
  args: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
    * @param {Message} message
    * @param {Client} client
    */
  execute: async (message, args, client) => {
   const query = args.join(' ');
   const mseg = await message.reply('Searching <a:Searching:1142532717406322809>');
   const images = await GOOGLE_IMG_SCRAP({
    search: query,
    limit: 100,
    safeSearch: false
});
  await client.keyv.set(mseg.id, images.result, 30);
   let img = images.result[0]; 
   const msg = {
     failIfNotExists: true,
     content: ``, 
     tts: false, 
     components: [ 
       { 
         type: 1, 
         components: [ 
           { 
             style: 2, 
             custom_id: 'img_left', 
             disabled: false, 
             emoji: { 
               id: null, 
               name: '◀️' 
             }, 
             type: 2 
           }, 
           { 
             style: 2, 
             custom_id: 'img_right', 
             disabled: false, 
             emoji: { 
               id: null, 
               name: '▶️' 
             }, 
             type: 2 
           }, 
           { 
             style: 1, 
             custom_id: 'img_random', 
             disabled: false, 
             emoji: { 
               id: null, 
               name: '🔀' 
             }, 
             type: 2 
           }, 
           { 
             style: 1, 
             custom_id: 'img_input', 
             disabled: false, 
             emoji: { 
               id: null, 
               name: '🔢' 
             }, 
             type: 2 
           }, 
           { 
             style: 4, 
             custom_id: 'delete-btn', 
             disabled: false, 
             emoji: { 
               id: null, 
               name: '🗑' 
             }, 
             type: 2 
           } 
         ] 
       } 
     ], 
     embeds: [ 
       { 
         type: 'rich', 
         description: `**[${img.title}](${img.originalUrl})**`, 
         title: `🔍 ${query}`, 
         color: 0xf0f0f0, 
         image: { 
           url: img.url, 
           height: img.height, 
           width: img.width 
         }, 
         author: { 
           name: 'Google Image Search', 
           icon_url: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-1024.png' 
         },
        footer: {
        text: `viewing page- \`1/${images.result.length}\``,
       }
       } 
     ] 
   }; 
    let sent = await mseg.edit(msg);
    await client.sleep(30200); 
    if(!client.keyv.has(mseg.id)) { 
      try {
       await mseg.edit({   
       content: '',   
       embeds: msg.embeds,
       components: []
       });
      } catch (e) {console.log(e.message);}
     }
  }
};


