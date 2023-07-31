import { Client, Message } from "discord.js";
import google from "googlethis";
export default {
  name: "img",
  description: "Search image from Google.",
  aliases: ["image [query]"],
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
   const images = await google.image(query, { safe: false }); 
   let img = images[0]; 
   const msg = {
     failIfNotExists: true,
     content: `\🔍**${query}**\nViewing page- \`1/${images.length}\``, 
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
         title: img.origin.title, 
         description: `via **[${img.origin.website.name}](https://${img.origin.website.domain})**`, 
               color: 0x7292fa, 
         image: { 
           url: img.url, 
           height: img.height, 
           width: img.width 
         }, 
         author: { 
           name: 'Google Image Search', 
           icon_url: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-1024.png' 
         }, 
         url: img.origin.website.url 
       } 
     ] 
   }; 
   let mseg = await message.reply(msg); 
   client.keyv.set(mseg.id, images);
  }
};
