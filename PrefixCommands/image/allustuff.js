import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import { getCaptionInput } from "../../Helpers/helpersImage.js";
import translate from "google-translate-api-x";
export default {
  name: "allustuff",
  description: "Create allu stuff image",
  aliases: ["stuff"],
  usage: "allustuff <image: emoji, url, attachment, sticker>&<caption:text>",
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
    const res = await translate(text, { to: "te" });
    const translatedText = res.text;

    const img = await sharp(data).resize(1080).toBuffer();
    const md = await sharp(img).metadata();
    const height = md.height + 408;

    const editedImageBuffer = await sharp(img)
      .resize(1080, height, {
        kernel: sharp.kernel.nearest,
        fit: "contain",
        position: "top",
      })
      .composite([
        { input: "./Assets/allustuff.jpg", gravity: "south" },
        {
          input: {
            text: {
              text: translatedText,
              font: "Noto Serif Telugu",
              fontfile: "./Assets/nst.ttf",
              width: 650,
              height: 370,
            },
          },
          top: md.height + 20,
          left: 14,
          blend: "difference",
        },
      ])
      .png()
      .toBuffer();

    const file = new AttachmentBuilder(editedImageBuffer, {
      name: "stuff.png",
    });
    message.reply({
      content: "",
      files: [file],
    });
  },
};
