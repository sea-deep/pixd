import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import { getCaptionInput } from "../../Helpers/helpersImage.js";

export default {
  name: "rvcj",
  description: "Create RVCJ styled image",
  aliases: ["cid"],
  usage: "rvcj <image: emoji, url, attachment, sticker>&<caption:text>",
  guildOnly: false,
  args: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   */
  execute: async (message) => {
    const image = await getCaptionInput(message);

    const reg = /https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i;
    const text = message.content
      .split(" ")
      .splice(1)
      .join(" ")
      .replace(reg, "")
      .trim();

    const response = await fetch(image);
    const data = await response.arrayBuffer();

    let input = await sharp(Buffer.from(data)).resize(1080).png().toBuffer();
    let md = await sharp(input).metadata();
    if (md.height > md.width) {
      input = await sharp(input)
        .resize({
          width: 1080,
          height: 1080,
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toBuffer();
      md = await sharp(input).metadata();
    }

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    words.forEach(word => {
        if ((currentLine + word).length <= 24) {
            currentLine += (currentLine.length ? ' ' : '') + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    });
    if (currentLine) {
        lines.push(currentLine);
    }

    let textBoards = [];
    let textHeight = 0;

    for (const line of lines) {
        let textBoard = await sharp({
            text: {
                text: line.toUpperCase(),
                width: 960,
                dpi: 400,
                align: 'center',
                font: "Baloo 2 ExtraBold",
                fontfile: "./Assets/baloo.ttf",
            },
        }).png().toBuffer();

        
        let textBoardMeta = await sharp(textBoard).metadata();

        let leftPosition = Math.floor((1080 - textBoardMeta.width) / 2);

        textBoards.push({
            input: textBoard,
            blend: 'difference',
            top: textHeight,
            left: leftPosition
        });
        textHeight += 60;
    }

    const overlay = await sharp({
      create: {
        width: 1080,
        height: textHeight,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        channels: 4,
      },
    })
      .composite(textBoards)
      .png()
      .toBuffer();

    const finalHeight = 48 + 145 + 30 + textHeight + md.height;

    const finalImage = await sharp({
      create: {
        width: 1080,
        height: finalHeight,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        channels: 4,
      },
    })
      .composite([
        { input: "./Assets/rvcjheader.png", top: 0, left: 0 },
        { input: overlay, top: 145, left: 0 },
        { input: input, top: 145 + textHeight + 30, left: 0 },
        { input: "./Assets/rvcjfooter.png", top: finalHeight - 48, left: 0 },
      ])
      .png()
      .toBuffer();

    const file = new AttachmentBuilder(finalImage, {
      name: "rvcj.png",
    });
    message.reply({
      content: "men are simple 🙂",
      files: [file],
    });
  },
};