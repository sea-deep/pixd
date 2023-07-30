import { AttachmentBuilder, Message } from "discord.js";
import Jimp from "jimp";
import { getInputImage } from "../../Helpers/helpersImage.js";
export default {
  name: "lapata",
  description: "Create a pk lapata image...",
  aliases: [""],
  usage: "lapata [mention]|[emote/sticker]|[reply] / p!lapata",
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
   let base = new Jimp(720, 404, 0x00000000); 
   let avatar = await Jimp.read(await getInputImage(message)); 
   avatar.resize(156, 182); 
   let fg = await Jimp.read( 
     'https://cdn.discordapp.com/attachments/916697198761234492/1104896270428020807/PicsArt_05-08-03.41.52.png' 
   ); 
   base.composite(avatar, 32, 119).composite(fg, 0, 0); 
   let buffer = await base.getBufferAsync(Jimp.MIME_PNG); 
   let file = new AttachmentBuilder(buffer, {name: 'lapata.png'}); 
   return message.reply({ 
     comtent: '', 
     files: [file], 
   });
  }
};
