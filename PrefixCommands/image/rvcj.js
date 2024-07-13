import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import { getCaptionInput } from "../../Helpers/helpersImage.js";

export default {
  name: "rvcj",
  description: "Create RVCJ styled image",
  aliases: ["rvcjstyle"],
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

    // Process image with RVCJ style
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

    const textLength = text.length;
    const textHeight = textLength < 11 ? 55 : textLength < 51 ? 116 : textLength < 76 ? 175 : 300;
    const finalHeight = 48 + 182 + textHeight + md.height;

    const textBoard = await sharp({
      text: {
        text: text,
        width: 940,
        height: textHeight,
        font: "Baloo 2 Bold",
        fontfile: "./Assets/baloo.ttf",
      },
    }).png().toBuffer();

    const overlay = await sharp({
      create: {
        width: 1080,
        height: textHeight,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        channels: 4,
      },
    })
      .composite([{ input: textBoard, blend: "difference" }])
      .png()
      .toBuffer();

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
        { input: overlay, top: 182, left: 0 },
        { input: input, top: 182 + textHeight, left: 0 },
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