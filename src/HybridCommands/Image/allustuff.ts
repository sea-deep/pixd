import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import { escapeImageText } from "../../helpers/helpersImage.js";
import { translate } from "google-translate-api-x";
export default new HybridCommand({
  name: "allustuff",
  slashRoute: "img allustuff",
  options: imageOptions("allustuff"),
  description: "Create allu stuff image",
  aliases: ["stuff"],
  usage: "allustuff <image: emoji, url, attachment, sticker>&<caption:text>",
  guildOnly: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   */
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const image = await contextImage(ctx, true);

    const reg = /https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i;
    const text = input.content
      .split(" ")
      .splice(1)
      .join(" ")
      .replace(reg, "")
      .trim();

    let finalText = text;

    const response = await fetch(image);
    const data = await response.arrayBuffer();
    if (!text.includes("-x")) {
      const res = await translate(text, { to: "te" });
       finalText = res.text;
    }
    const img = await sharp(data).resize(1080).toBuffer();
    const md = await sharp(img).metadata();
    const height = md.height + 408;

    const editedImageBuffer = await sharp(img)
      .resize(1080, height, {
        kernel: sharp.kernel.nearest,
        fit: "contain" as const,
        position: "top",
      })
      .composite([
        { input: "./Assets/allustuff.jpg", gravity: "south" },
        {
          input: {
            text: {
              text: escapeImageText(finalText.replaceAll("-x", "")),
              font: "Noto Serif Telugu",
              fontfile: "./Assets/nst.ttf",
              width: 650,
              height: 370,
              align: "center" as const,
              justify: false,
            },
          },
          top: md.height + 30,
          left: 30,
          blend: "difference",
        },
      ])
      .png()
      .toBuffer();

    const file = new AttachmentBuilder(editedImageBuffer, {
      name: "stuff.png",
    });
    return ctx.reply({
      content: "-# Add '-x' in your message to disable translation!",
      files: [file],
    });
  },
});
