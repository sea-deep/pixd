import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { escapeImageText } from "../../helpers/helpersImage.js";
import { extractFrames, inspectImage, renderAnimatedGif } from "../../helpers/gifHelper.js";
import { translate } from "google-translate-api-x";

export default new HybridCommand({
  name: "allustuff",
  slashRoute: "img allustuff",
  options: imageOptions("allustuff"),
  description: "Create allu stuff image or animated GIF",
  aliases: ["stuff"],
  usage: "allustuff <image: emoji, url, attachment, sticker>&<caption:text>",
  guildOnly: false,
  permissions: {
    bot: [],
    user: [],
  },
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const image = await contextImage(ctx, true);

    const urlPattern = /https?:\/\/[^\s]+/gi;
    const text = input.content
      .split(" ")
      .slice(1)
      .join(" ")
      .replace(urlPattern, "")
      .trim();

    let finalText = text;
    if (text && !text.includes("-x")) {
      const res = await translate(text, { to: "te" }).catch(() => null);
      if (res?.text) finalText = res.text;
    }

    const response = await fetch(image);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const data = Buffer.from(await response.arrayBuffer());

    const imageInfo = await inspectImage(data);
    const textSvg = escapeImageText(finalText.replaceAll("-x", ""));

    if (imageInfo.isAnimated) {
      const extracted = await extractFrames(data, 20);
      const targetWidth = 540;
      const bannerHeight = Math.round(408 * (targetWidth / 1080)); // ~204
      const alluBanner = await sharp("./Assets/allustuff.jpg")
        .resize(targetWidth, bannerHeight, { fit: "fill" })
        .png()
        .toBuffer();

      const textOverlay = {
        input: {
          text: {
            text: textSvg,
            font: "Noto Serif Telugu",
            fontfile: "./Assets/nst.ttf",
            width: Math.round(650 * (targetWidth / 1080)),
            height: Math.round(370 * (targetWidth / 1080)),
            align: "center" as const,
            justify: false,
          },
        },
        top: 0,
        left: Math.round(30 * (targetWidth / 1080)),
        blend: "difference" as const,
      };

      // Scale first frame to find target frame height
      const firstResized = await sharp(extracted.frames[0]).resize(targetWidth).toBuffer();
      const firstMeta = await sharp(firstResized).metadata();
      const frameHeight = firstMeta.height ?? 300;
      const totalHeight = frameHeight + bannerHeight;
      textOverlay.top = frameHeight + Math.round(15 * (targetWidth / 1080));

      const rawFrames: Buffer[] = [];
      for (const frame of extracted.frames) {
        const resizedFrame = await sharp(frame)
          .resize(targetWidth, frameHeight, { fit: "fill" })
          .toBuffer();

        const raw = await sharp(resizedFrame)
          .extend({
            bottom: bannerHeight,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
          })
          .composite([
            { input: alluBanner, gravity: "south" },
            textOverlay,
          ])
          .raw()
          .toBuffer();
        rawFrames.push(raw);
      }

      const gifBuffer = await renderAnimatedGif(rawFrames, targetWidth, totalHeight, extracted.delay);
      const file = new AttachmentBuilder(gifBuffer, { name: "stuff.gif" });
      return ctx.reply({
        content: "-# Add '-x' in your message to disable translation!",
        files: [file],
      });
    }

    const img = await sharp(data).resize(1080).toBuffer();
    const md = await sharp(img).metadata();
    const height = (md.height ?? 600) + 408;

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
              text: textSvg,
              font: "Noto Serif Telugu",
              fontfile: "./Assets/nst.ttf",
              width: 650,
              height: 370,
              align: "center" as const,
              justify: false,
            },
          },
          top: (md.height ?? 600) + 30,
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
