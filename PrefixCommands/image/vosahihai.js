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
   let base = new Jimp(1080, 855, 0x00000000); 
   
   let hand = await Jimp.read( 
     'https://iili.io/JMFqZle.png' 
   );
     hand.resize(550, 720); 
   let head = await Jimp.read(await getInputImage(message)); 
    
   head.resize(720, 800).rotate(15); 
   base.composite(head, 200, 0).composite(hand, 5, 150);
   
   let buffer = await base.getBufferAsync(Jimp.MIME_PNG); 
   let file = new AttachmentBuilder(buffer, {name: 'maisahitha.png'}); 
   let text = [ 
     'vo kuch thug hai', 
     'vo to koi thug nahi hai', 
     'vo sahi hai', 
     'vo galat hai', 
     'vo real hai', 
     'vo sach hai',
     'vo fake hai', 
     'vo <:genesis:992613277995642961> hai', 
   ]; 
   return message.reply({ 
     content: text[Math.round(Math.random() * text.length)], 
     files: [file], 
   });
  }
};
