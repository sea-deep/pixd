import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { getCaptionInputInt } from "../../../Helpers/helpersImage.js";
import translate from "google-translate-api-x";

export default {
  subCommand: 'img allustuff',
  async execute(interaction) {
    await interaction.deferReply();
    const image = await getCaptionInput(message);
    const text = await interaction.options._hoistedOptions[0].value;
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
    interaction.followUp({
      content: "",
      files: [file],
    });
  }
};