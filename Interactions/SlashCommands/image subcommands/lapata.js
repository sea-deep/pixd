import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";

export default {
  subCommand: 'img lapata',
  async execute(interaction) {
    let overlays = await getOverlays(interaction);
        const s = [
      { w: 359, h: 437, x: 145, y: 334 },
      { w: 195, h: 289, x: 938, y: 398 },
      { w: 117, h: 245, x: 1371, y: 451 },
      { w: 77, h: 206, x: 1634, y: 474 },
      { w: 59, h: 175, x: 1805, y: 477 },
    ];

    for (let i = 0; i < overlays.length; i++) {
      overlays[i] = await sharp(overlays[i]).resize(s[i].w, s[i].h, { fit: "fill"}).toBuffer();
    }

    let lapata = await sharp({
      create: {
        height: 1322,
        width: 1928,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: overlays[0], top: s[0].y, left: s[0].x },
        { input: overlays[1], top: s[1].y, left: s[1].x },
        { input: overlays[2], top: s[2].y, left: s[2].x },
        { input: overlays[3], top: s[3].y, left: s[3].x },
        { input: overlays[4], top: s[4].y, left: s[4].x },
        { input: "./Assets/lapata.png", top: 0, left: 0 },
      ])
      .png()
      .toBuffer();

    let file = new AttachmentBuilder(lapata, { name: "lapata.png" });
    return interaction.followUp({
      content: "",
      files: [file],
    });
  }
};

async function getOverlays(interaction) {
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