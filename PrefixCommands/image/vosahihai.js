import { AttachmentBuilder, Message } from "discord.js";
import Jimp from "jimp";
import { getInputImage } from "../../Helpers/helpersImage.js";
export default {
  name: "vosahihai",
  description: "He's right you know?",
  aliases: ["maisahihu"],
  usage: "vosahihai",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
    * @param {Message} message
    */
  execute: async (message) => {
   const position = {x: 245, y: 0}; 
   let bg = await Jimp.read( 
     'https://cdn.discordapp.com/attachments/1088008848469655562/1104863177897934908/PicsArt_05-08-01.41.32.jpg' 
   ); 
   let avatar = await Jimp.read(await getInputImage(message)); 
   avatar.resize(354, 433); 
   bg.composite(avatar, position.x, position.y); 
   let buffer = await bg.getBufferAsync(Jimp.MIME_PNG); 
   let file = new AttachmentBuilder(buffer, {name: 'maisahitha.png'}); 
   let text = [ 
     'vo kuch thug hai', 
     'vo to koi thug nahi hai', 
     'vo sahi hai', 
     'vo galat hai', 
     'vo real hai', 
     'vo fake hai', 
     'vo <:genesis:1013083814270074890> hai', 
   ]; 
   return message.reply({ 
     comtent: text[Math.round(Math.random() * text.length)], 
     files: [file], 
   });
  }
};
