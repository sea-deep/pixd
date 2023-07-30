import { AttachmentBuilder, Message } from "discord.js";
import GIFEncoder from 'gif-encoder-2';
import path from 'path';
import { getInputImage } from "../../Helpers/helpersImage.js";
export default {
  name: "goodness",
  description: "oh my goodness gracious",
  aliases: ["gracious"],
  usage: "goodness",
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
   av.resize(160,157) 
   const encoder = new GIFEncoder(260, 296); 
   encoder.setDelay(50); 
   encoder.start(); 
   for (let i = 0; i < 34; i++) { 
     const frame = i < 10 ? `0${i}` : `${i}`; 
     const file = path.resolve(`./Assets/goodness/frame_${frame}_delay-0.05s.gif`); 
  
     let banner = await Jimp.read(file); 
     banner.composite(av, 101, 139); 
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
