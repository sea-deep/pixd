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
  let msg = await message.reply("Creating...");
   let base = new Jimp(1928, 1322, 0x00000000); 
    let overlays = [];
    if (message.mentions.users.size > 1) {
        overlays =message.mentions.parsedUsers.map((user) =>
           user.displayAvatarURL({ extension: "png", size: 256, forceStatic:true})
        );

        const neededDuplicates = 5 - overlays.length;
        if (neededDuplicates > 0) {
            const duplicatedElements = overlays.slice(0, neededDuplicates);
            overlays.push(...duplicatedElements);
        }
    } else {
        let overlay = await getInputImage(message);
        overlays = [overlay, overlay, overlay, overlay, overlay];
    }
    const s = [
      {w: 359, h: 437, x: 145, y: 334},
      {w: 195, h: 289, x: 938, y: 398},
      {w: 117, h: 245, x: 1371, y: 451},
      {w: 77, h: 206, x: 1634, y: 474},
      {w: 59, h: 175, x: 1805, y: 477}
    ]
     console.log(overlays)

    overlays.forEach(async (overlay, i) => {
     let image = await Jimp.read(overlay);
      image.resize(s[i].w, s[i].h);
      base.composite(image, s[i].x, s[i].y);
    });
    
   let fg = await Jimp.read('https://iili.io/JM9qUPf.png');    
   base.composite(fg, 0, 0); 

    
   let buffer = await base.getBufferAsync(Jimp.MIME_PNG); 
   let file = new AttachmentBuilder(buffer, {name: 'lapata.png'}); 
    await msg.delete();
   return message.reply({ 
     content: '', 
     files: [file], 
   });
  }
};
