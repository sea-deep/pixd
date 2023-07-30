import { AttachmentBuilder, Message } from "discord.js";
import Jimp from "jimp";
import GIFEncoder from 'gif-encoder-2';
import path from 'path';
import { getInputImage } from "../../Helpers/helpersImage.js";
export default {
  name: "nearyou",
  description: "This person lives 0kms near you.",
  aliases: ["nearme"],
  usage: "",
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
    let m = await message.reply('Processing...'); 
     let avatar = await getInputImage(message); 
   let av = await Jimp.read(avatar); 
   av.resize(252,252); 
   const encoder = new GIFEncoder(360, 360); 
   encoder.setDelay(150); 
   encoder.start(); 
   for (let i = 0; i < 60; i++) { 
     const frame = i < 10 ? `0${i}` : `${i}`; 
     const file = path.resolve(`./Assets/nearframes/frame_${frame}_delay-0.17s.gif`); 
  
     let banner = await Jimp.read(file); 
     banner 
       .composite(av, -21, 70); 
  
 encoder.addFrame(banner.bitmap.data); 
   } 
   encoder.finish(); 
   const buffer = encoder.out.getData(); 
   let file = new AttachmentBuilder(buffer, {name: 'godnessgraciousness.gif'}); 
   await message.reply({ 
     content: ``, 
     files: [file], 
   }); 
   await m.delete(); 
 
  }
};
