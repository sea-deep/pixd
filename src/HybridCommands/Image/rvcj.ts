import HybridCommand from "../../structures/HybridCommand.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import sharp, { type OverlayOptions } from "sharp";
import { extractFrames, inspectImage, renderAnimatedGif } from "../../helpers/gifHelper.js";
import { renderTextWithEmojis } from "../../helpers/textEmojiRenderer.js";

export function parseCaptions(rawText: string): { topText: string; bottomText: string; questionText: string } {
  let cleaned = rawText.trim();
  // Strip leading user mention if present at start (e.g. p!rvcj @user & caption)
  cleaned = cleaned.replace(/^<@!?\d+>\s*(&\s*)?/, "");
  // Strip leading "&" or separators that might remain from legacy <image>&<caption> usage
  cleaned = cleaned.replace(/^&+\s*/, "");

  let parts: string[] = [];
  if (cleaned.includes("|")) {
    parts = cleaned.split("|").map((s) => s.trim());
  } else if (cleaned.split(/\s+&\s+/).length >= 3) {
    parts = cleaned.split(/\s+&\s+/).map((s) => s.trim());
  } else {
    parts = [cleaned];
  }

  return {
    topText: parts[0] || "",
    bottomText: parts[1] || "",
    questionText: parts[2] || "",
  };
}

export default new HybridCommand({
  name: "rvcj",
  description: "Create RVCJ styled meme image or animated GIF with up to 3 captions and transparent custom emoji support",
  aliases: ["cid", "caption"],
  usage: "rvcj <image> & <top caption> | <subtitle> | <question>",
  guildOnly: false,
  permissions: {
    bot: [],
    user: [],
  },
  options: [
    { type: 3, name: "caption", description: "Top caption text" },
    { type: 3, name: "subtitle", description: "Bottom subtitle text below image" },
    { type: 3, name: "question", description: "Question/highlight banner text (yellow on black)" },
    { type: 3, name: "arguments", description: "All captions separated by | (e.g. Top | Subtitle | Question)" },
    { type: 11, name: "image", description: "Input image or attachment" },
    { type: 6, name: "user", description: "Target user" },
  ],
  execute: async (ctx, client) => {
    const commandArgs = commandInput(ctx);
    try {
      const image = await contextImage(ctx, true);

      // Extract captions
      let topText = "";
      let bottomText = "";
      let questionText = "";

      if (ctx.isSlash) {
        topText = ctx.options.getString("caption") || "";
        bottomText = ctx.options.getString("subtitle") || "";
        questionText = ctx.options.getString("question") || "";

        const rawArgs = ctx.options.getString("arguments") || "";
        if (rawArgs) {
          const parsed = parseCaptions(rawArgs);
          if (!topText) topText = parsed.topText;
          if (!bottomText) bottomText = parsed.bottomText;
          if (!questionText) questionText = parsed.questionText;
        }
      } else {
        const urlPattern = /https?:\/\/[^\s]+/gi;
        const rawContent = commandArgs.content
          .split(" ")
          .slice(1)
          .join(" ")
          .replace(urlPattern, "")
          .trim();

        const parsed = parseCaptions(rawContent);
        topText = parsed.topText;
        bottomText = parsed.bottomText;
        questionText = parsed.questionText;
      }

      if (!topText && !bottomText && !questionText) {
        return ctx.reply("Provide a caption for the image.");
      }

      const response = await fetch(image);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const data = await response.arrayBuffer();
      const buffer = Buffer.from(data);

      // Check if the buffer is a valid image format
      await sharp(buffer)
        .metadata()
        .catch((err) => {
          throw new Error(`Invalid image format: ${err instanceof Error ? err.message : String(err)}`);
        });

      // Normalize image to 16:9 rectangle if taller than 16:9 (including square or portrait)
      let input = await sharp(buffer).resize(1080).png().toBuffer();
      let md = await sharp(input).metadata();
      if ((md.height ?? 0) > Math.round((md.width ?? 1080) * (9 / 16))) {
        input = await sharp(input)
          .resize({
            width: 1080,
            height: 608,
            fit: "contain" as const,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .png()
          .toBuffer();
        md = await sharp(input).metadata();
      }

      // Render text sections with transparent custom and unicode emojis
      let topSection: { buffer: Buffer; height: number } | null = null;
      if (topText) {
        topSection = await renderTextWithEmojis(topText, {
          font: "Baloo 2 ExtraBold",
          fontfile: "./Assets/baloo.ttf",
          maxWidth: 1080,
          textColor: "#000000",
          bgColor: "#ffffff",
          lineHeight: 60,
          emojiSize: 48,
          spaceWidth: 14,
          maxUnitsPerLine: 28,
          align: "center",
          uppercase: true,
        });
      }

      let bottomSection: { buffer: Buffer; height: number } | null = null;
      if (bottomText) {
        bottomSection = await renderTextWithEmojis(bottomText, {
          font: "Baloo 2 ExtraBold",
          fontfile: "./Assets/baloo.ttf",
          maxWidth: 1080,
          textColor: "#000000",
          bgColor: "#ffffff",
          lineHeight: 60,
          emojiSize: 48,
          spaceWidth: 14,
          maxUnitsPerLine: 28,
          align: "center",
          uppercase: true,
        });
      }

      let questionSection: { buffer: Buffer; height: number } | null = null;
      if (questionText) {
        questionSection = await renderTextWithEmojis(questionText, {
          font: "Baloo 2 ExtraBold",
          fontfile: "./Assets/baloo.ttf",
          maxWidth: 1080,
          textColor: "#FFE600",
          bgColor: "#000000",
          lineHeight: 64,
          emojiSize: 48,
          spaceWidth: 14,
          maxUnitsPerLine: 32,
          align: "center",
          uppercase: true,
          bannerPadding: 8,
        });
      }

      const watermarkMeta = await sharp("./Assets/watermark.png").metadata();
      const wmHeight = watermarkMeta.height ?? 76;
      const wmWidth = watermarkMeta.width ?? 150;

      const imageInfo = await inspectImage(buffer);

      if (imageInfo.isAnimated) {
        const extracted = await extractFrames(buffer, 20);
        const scale = 0.5;
        const targetWidth = 540;

        const scaledHeader = await sharp("./Assets/rvcjheader.png")
          .resize(targetWidth, Math.round(182 * scale), { fit: "fill" })
          .png()
          .toBuffer();
        const scaledFooter = await sharp("./Assets/rvcjfooter.png")
          .resize(targetWidth, Math.round(48 * scale), { fit: "fill" })
          .png()
          .toBuffer();
        const scaledWatermark = await sharp("./Assets/watermark.png")
          .resize(Math.round(wmWidth * scale), Math.round(wmHeight * scale))
          .png()
          .toBuffer();

        let gifCurrentY = Math.round(145 * scale);
        let scaledTopOverlay: Buffer | null = null;
        let scaledTopHeight = 0;
        if (topSection) {
          scaledTopHeight = Math.round(topSection.height * scale);
          scaledTopOverlay = await sharp(topSection.buffer)
            .resize(targetWidth, scaledTopHeight, { fit: "fill" })
            .png()
            .toBuffer();
          gifCurrentY += scaledTopHeight + Math.round(20 * scale);
        } else {
          gifCurrentY += Math.round(10 * scale);
        }

        const gifImageTop = gifCurrentY;

        let sampleFrame = await sharp(extracted.frames[0]).resize(targetWidth).png().toBuffer();
        let sampleMeta = await sharp(sampleFrame).metadata();
        const isGifTallerThan16by9 = (sampleMeta.height ?? 0) > Math.round((sampleMeta.width ?? targetWidth) * (9 / 16));
        const scaledFrameHeight = isGifTallerThan16by9
          ? 304
          : (sampleMeta.height ?? 304);
        gifCurrentY += scaledFrameHeight;

        let scaledBottomOverlay: Buffer | null = null;
        let scaledBottomHeight = 0;
        if (bottomSection) {
          gifCurrentY += Math.round(15 * scale);
          scaledBottomHeight = Math.round(bottomSection.height * scale);
          scaledBottomOverlay = await sharp(bottomSection.buffer)
            .resize(targetWidth, scaledBottomHeight, { fit: "fill" })
            .png()
            .toBuffer();
          gifCurrentY += scaledBottomHeight + Math.round(15 * scale);
        }

        let scaledQuestionOverlay: Buffer | null = null;
        let scaledQuestionHeight = 0;
        if (questionSection) {
          if (!bottomSection) gifCurrentY += Math.round(15 * scale);
          scaledQuestionHeight = Math.round(questionSection.height * scale);
          scaledQuestionOverlay = await sharp(questionSection.buffer)
            .resize(targetWidth, scaledQuestionHeight, { fit: "fill" })
            .png()
            .toBuffer();
          gifCurrentY += scaledQuestionHeight;
        }

        const gifFooterTop = gifCurrentY;
        const gifFinalHeight = gifFooterTop + Math.round(48 * scale);

        const rawFrames: Buffer[] = [];
        for (const frame of extracted.frames) {
          let resizedFrame = await sharp(frame).resize(targetWidth).png().toBuffer();
          let frameMeta = await sharp(resizedFrame).metadata();
          if ((frameMeta.height ?? 0) > Math.round((frameMeta.width ?? targetWidth) * (9 / 16))) {
            resizedFrame = await sharp(resizedFrame)
              .resize({
                width: targetWidth,
                height: 304,
                fit: "contain",
                background: { r: 255, g: 255, b: 255, alpha: 1 },
              })
              .png()
              .toBuffer();
          }

          const frameComposites: OverlayOptions[] = [
            { input: scaledHeader, top: 0, left: 0 },
          ];
          if (scaledTopOverlay) {
            frameComposites.push({ input: scaledTopOverlay, top: Math.round(145 * scale), left: 0 });
          }
          frameComposites.push({ input: resizedFrame, top: gifImageTop, left: 0 });
          frameComposites.push({
            input: scaledWatermark,
            top: gifImageTop + scaledFrameHeight - Math.round(wmHeight * scale) - 8,
            left: targetWidth - Math.round(wmWidth * scale) - 8,
          });
          if (scaledBottomOverlay) {
            frameComposites.push({
              input: scaledBottomOverlay,
              top: gifImageTop + scaledFrameHeight + Math.round(15 * scale),
              left: 0,
            });
          }
          if (scaledQuestionOverlay) {
            const qTop = gifImageTop + scaledFrameHeight + (bottomSection ? scaledBottomHeight + Math.round(30 * scale) : Math.round(15 * scale));
            frameComposites.push({ input: scaledQuestionOverlay, top: qTop, left: 0 });
          }
          frameComposites.push({ input: scaledFooter, top: gifFooterTop, left: 0 });

          const raw = await sharp({
            create: {
              width: targetWidth,
              height: gifFinalHeight,
              background: { r: 255, g: 255, b: 255, alpha: 1 },
              channels: 4,
            },
          })
            .composite(frameComposites)
            .raw()
            .toBuffer();
          rawFrames.push(raw);
        }

        const gifBuffer = await renderAnimatedGif(rawFrames, targetWidth, gifFinalHeight, extracted.delay);
        const file = new AttachmentBuilder(gifBuffer, { name: "rvcj.gif" });
        return ctx.reply({ content: "men are simple 🙂", files: [file] });
      }

      // Static Image composite stack
      let currentY = 145;
      const composites: OverlayOptions[] = [
        { input: "./Assets/rvcjheader.png", top: 0, left: 0 },
      ];

      if (topSection) {
        composites.push({ input: topSection.buffer, top: currentY, left: 0 });
        currentY += topSection.height + 20;
      } else {
        currentY += 10;
      }

      const imageTop = currentY;
      const imageHeight = md.height ?? 608;
      composites.push({ input, top: imageTop, left: 0 });
      currentY += imageHeight;

      composites.push({
        input: "./Assets/watermark.png",
        top: Math.max(0, imageTop + imageHeight - wmHeight - 15),
        left: Math.max(0, 1080 - wmWidth - 15),
      });

      if (bottomSection) {
        currentY += 15;
        composites.push({ input: bottomSection.buffer, top: currentY, left: 0 });
        currentY += bottomSection.height + 15;
      }

      if (questionSection) {
        if (!bottomSection) currentY += 15;
        composites.push({ input: questionSection.buffer, top: currentY, left: 0 });
        currentY += questionSection.height;
      }

      const footerTop = currentY;
      composites.push({ input: "./Assets/rvcjfooter.png", top: footerTop, left: 0 });
      const finalHeight = footerTop + 48;

      const finalImage = await sharp({
        create: {
          width: 1080,
          height: finalHeight,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
          channels: 4,
        },
      })
        .composite(composites)
        .png()
        .toBuffer();

      const file = new AttachmentBuilder(finalImage, {
        name: "rvcj.png",
      });
      ctx.reply({ content: "men are simple 🙂", files: [file] });
    } catch (err) {
      console.error(err);
      ctx.reply(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
});
