import { AttachmentBuilder, Message } from "discord.js";
import Jimp from "jimp";
import { getInputImage } from "../../Helpers/helpersImage.js";
export default {
  name: "rape",
  description: "rape",
  aliases: ["nirbhaya"],
  usage: "rape",
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
  const allCords = [ 
     {x: 0, y: 0}, 
     {x: 366, y: 0}, 
     {x: 0, y: 500}, 
     {x: 366, y: 500}, 
   ]; 
   const position = allCords[Math.floor(Math.random() * 4)]; 
   let bg = await Jimp.read( 
     'https://media.discordapp.net/attachments/1046478392591138868/1083673636096987276/Bg.jpg' 
   ); 
   let avatar = await Jimp.read(await getInputImage(message)); 
   avatar.resize(366, 500); 
   bg.resize(732, 1000).composite(avatar, position.x, position.y); 
   let buffer = await bg.getBufferAsync(Jimp.MIME_PNG); 
   let file = new AttachmentBuilder(buffer, {name: 'nirbhaya.png'}); 
   await message.channel.send({ 
     content: '', 
     files: [file], 
   });
  }
};
