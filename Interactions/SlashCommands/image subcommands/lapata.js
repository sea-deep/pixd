import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";

export default {
  subCommand: 'img lapata',
  async execute(interaction) {
    let overlays = [];
    
  }
};

async function getOverlaysAsync(interaction) {
  let overlays = [];
  const options = interaction.options._hoistedOptions;
  
  if (options && options.length !== 0) {
    for (let i = 0; i < options.length; i++) {
      switch (options[i].name) {
        case 'image-url':
          const imageUrl = await options[i].value.match(/(https?:\/\/\S+\.(?:png|mp4|jpg|gif|jpeg)(?:\?[^\s]+)?)/i);
          if (imageUrl) {
            const response = await fetch(imageUrl[0]);
            const buffer = await response.arrayBuffer();
            overlays.push(buffer);
          }
          break;
        case 'image-file':
          overlays.push(options[i].attachment.url);
          break;
        default:
          overlays.push(await options[i].user.displayAvatarURL({
            format: 'png',
            size: 128,
          }));
      }
    }
    const neededDuplicates = 5 - overlays.length;
    if (neededDuplicates > 0) {
      const duplicatedElements = overlays.slice(0, neededDuplicates);
      overlays.push(...duplicatedElements);
    }
  } else { 
    let url = await interaction.user.displayAvatarURL({
       format: 'png',
       size: 128,
    });
     overlays = [url, url, url, url, url];
  }
  
  // Convert URLs to buffers
  overlays = await Promise.all(overlays.map(async (overlay) => {
    if (typeof overlay === 'string') {
      const response = await fetch(overlay);
      return await response.arrayBuffer();
    }
    return overlay;
  }));
  
  return overlays;
}