import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import sharp, { type OverlayOptions } from "sharp";
import { ensureSupportedImageBuffer, extractFrames, inspectImage, renderAnimatedGif } from "../../helpers/gifHelper.js";
import { translate } from "google-translate-api-x";
import { renderTextWithEmojis, protectCustomEmojis } from "../../helpers/textEmojiRenderer.js";

export default new HybridCommand({
  name: "allustuff",
  slashRoute: "img allustuff",
  options: imageOptions("allustuff"),
  description: "Create allu stuff image or animated GIF with transparent custom emoji support",
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

    let rawCaption = text.replaceAll("-x", "").trim();
    let finalText = rawCaption;
    if (rawCaption && !text.includes("-x")) {
      const { protectedText, restore } = protectCustomEmojis(rawCaption);
      const res = await translate(protectedText, { to: "te" }).catch(() => null);
      if (res?.text) finalText = restore(res.text);
    }

    const response = await fetch(image);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    let data: Buffer = Buffer.from(await response.arrayBuffer());
    data = await ensureSupportedImageBuffer(data);

    const imageInfo = await inspectImage(data);

    // Render text with custom and unicode emojis
    const textOverlay = await renderTextWithEmojis(finalText || "...", {
      font: "Noto Serif Telugu",
      fontfile: "./Assets/nst.ttf",
      textColor: "#000000",
      bgColor: "transparent",
      maxWidth: 650,
      maxHeight: 370,
      lineHeight: 60,
      emojiSize: 48,
      spaceWidth: 14,
      maxUnitsPerLine: 24,
      align: "center",
    });

    if (imageInfo.isAnimated) {
      const totalDuration = imageInfo.delay.reduce((a, b) => a + b, 0);
      const durationSec = totalDuration > 0 ? totalDuration / 1000 : 2;
      const targetFrames = Math.round(durationSec * 15);
      const maxFrames = Math.min(imageInfo.pages, Math.max(30, Math.min(60, targetFrames)));
      const extracted = await extractFrames(data, maxFrames);
      const targetWidth = 540;
      const scale = targetWidth / 1080;
      const bannerHeight = Math.round(408 * scale); // ~204
      const alluBanner = await sharp("./Assets/allustuff.jpg")
        .resize(targetWidth, bannerHeight, { fit: "fill" })
        .png()
        .toBuffer();

      let scaledOverlayBuf: Buffer | null = null;
      let scaledOverlayWidth = 0;
      let scaledOverlayHeight = 0;
      if (textOverlay) {
        scaledOverlayWidth = Math.max(1, Math.round(textOverlay.width * scale));
        scaledOverlayHeight = Math.max(1, Math.round(textOverlay.height * scale));
        scaledOverlayBuf = await sharp(textOverlay.buffer)
          .resize(scaledOverlayWidth, scaledOverlayHeight, { fit: "fill" })
          .png()
          .toBuffer();
      }

      // Scale first frame to find target frame height
      const firstResized = await sharp(extracted.frames[0]).resize(targetWidth).toBuffer();
      const firstMeta = await sharp(firstResized).metadata();
      const frameHeight = firstMeta.height ?? 300;
      const totalHeight = frameHeight + bannerHeight;

      const rawFrames: Buffer[] = await Promise.all(
        extracted.frames.map(async (frame) => {
          const resizedFrame = await sharp(frame)
            .resize(targetWidth, frameHeight, { fit: "fill" })
            .toBuffer();

          const composites: OverlayOptions[] = [
            { input: alluBanner, gravity: "south" },
          ];

          if (scaledOverlayBuf) {
            const bannerTop = frameHeight;
            const leftOffset = Math.round(30 * scale) + Math.max(0, Math.floor((Math.round(650 * scale) - scaledOverlayWidth) / 2));
            const topOffset = bannerTop + Math.round(15 * scale) + Math.max(0, Math.floor((Math.round(370 * scale) - scaledOverlayHeight) / 2));
            composites.push({
              input: scaledOverlayBuf,
              top: topOffset,
              left: leftOffset,
            });
          }

          return sharp(resizedFrame)
            .extend({
              bottom: bannerHeight,
              background: { r: 0, g: 0, b: 0, alpha: 1 },
            })
            .composite(composites)
            .raw()
            .toBuffer();
        })
      );

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

    const composites: OverlayOptions[] = [
      { input: "./Assets/allustuff.jpg", gravity: "south" },
    ];

    if (textOverlay) {
      composites.push({
        input: textOverlay.buffer,
        top: (md.height ?? 600) + 30 + Math.max(0, Math.floor((370 - textOverlay.height) / 2)),
        left: 30 + Math.max(0, Math.floor((650 - textOverlay.width) / 2)),
      });
    }

    const editedImageBuffer = await sharp(img)
      .resize(1080, height, {
        kernel: sharp.kernel.nearest,
        fit: "contain" as const,
        position: "top",
      })
      .composite(composites)
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
