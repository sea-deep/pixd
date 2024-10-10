import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
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
    let overlays = [];
    if (message.mentions.users.size > 1) {
      overlays = await Promise.all(
        message.mentions.parsedUsers.map((user) =>
          fetch(
            user.displayAvatarURL({
              extension: "png",
              size: 256,
              forceStatic: true,
            })
          )
            .then((res) => res.arrayBuffer())
            .catch((e) => {
              console.log(e);
              return null;
            })
        )
      );
    
      let neededDuplicates = 5 - overlays.length;
      while (neededDuplicates > 0) {
        const duplicatedElements = overlays.slice(0, neededDuplicates);
        overlays.push(...duplicatedElements);
        neededDuplicates = 5 - overlays.length;
      }
    } else {
      let url = await getInputImage(message);
      const res = await fetch(url);
      const overlay = await res.arrayBuffer();
      overlays = [overlay, overlay, overlay, overlay, overlay];
    }
    
    const s = [
      { w: 359, h: 437, x: 145, y: 334 },
      { w: 195, h: 289, x: 938, y: 398 },
      { w: 117, h: 245, x: 1371, y: 451 },
      { w: 77, h: 206, x: 1634, y: 474 },
      { w: 59, h: 175, x: 1805, y: 477 },
    ];

    for (let i = 0; i < overlays.length; i++) {
      overlays[i] = await sharp(overlays[i])
        .resize(s[i].w, s[i].h, { fit: "fill" })
        .toBuffer();
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
    return message.reply({
      content: "",
      files: [file],
    });
  },
};
