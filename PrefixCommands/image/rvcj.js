import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import emojiRegex from "emoji-regex";
import { getCaptionInput } from "../../Helpers/helpersImage.js";

export default {
  name: "rvcj",
  description: "Create RVCJ styled image",
  aliases: ["cid", "caption"],
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
    try {
      const image = await getCaptionInput(message);

      const reg = /https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i;
      const text = message.content
        .split(" ")
        .splice(1)
        .join(" ")
        .replace(reg, "")
        .trim();

      const response = await fetch(image);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const data = await response.arrayBuffer();
      const buffer = Buffer.from(data);

      // Check if the buffer is a valid image format
      const inputInfo = await sharp(buffer)
        .metadata()
        .catch((err) => {
          throw new Error(`Invalid image format: ${err.message}`);
        });

      let input = await sharp(buffer).resize(1080).png().toBuffer();
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
      // Build lines with simple width heuristic that treats emoji as wide tokens
      const words = text.split(/\s+/).filter(Boolean);
      const approxWidth = (s) => {
        // Count emoji sequences (unicode/custom) as ~2 chars wide; others as 1 per char
        const eRe = emojiRegex();
        const cRe = /<(?:a?):[a-zA-Z0-9_]+:[0-9]+>/g;
        return s.replace(cRe, "__").replace(eRe, "__").length;
      };
      const lines = [];
      let currentLine = "";
      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (approxWidth(candidate) <= 24) {
          currentLine = candidate;
        } else {
          if (currentLine) lines.push(currentLine);
          // If single word is too long, still place it on its own line
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      let textLines = [];
      let textHeight = 0;

      for (const line of lines) {
        const tokens = segmentLine(line);
        let textChars = [];
        let currentLeft = 0;

        for (const token of tokens) {
          if (isEmoji(token)) {
            let emojiBuffer = null;
            try {
              emojiBuffer = await getEmojiImage(token);
            } catch (e) {
              // Fallback: render as text if emoji image fetch fails
            }
            if (emojiBuffer) {
              emojiBuffer = await sharp(emojiBuffer)
                .resize(48, 48)
                .png()
                .toBuffer();
              textChars.push({ input: emojiBuffer, top: 0, left: currentLeft });
              currentLeft += 51;
              continue;
            }
          }
          if (token === " ") {
            const spaceBuffer = await sharp({
              create: {
                width: 15,
                height: 60,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 0 },
              },
            })
              .png()
              .toBuffer();
            textChars.push({ input: spaceBuffer, top: 0, left: currentLeft });
            currentLeft += 15;
          } else {
            let textChar = await sharp({
              text: {
                text: token.toUpperCase(),
                dpi: 400,
                align: "center",
                font: "Baloo 2 ExtraBold",
                fontfile: "./Assets/baloo.ttf",
              },
            })
              .png()
              .toBuffer();

            let textCharMeta = await sharp(textChar).metadata();
            textChars.push({
              input: textChar,
              blend: "difference",
              top: 0,
              left: currentLeft,
            });
            currentLeft += (textCharMeta.width || 0) + 3;
          }
        }

        const textLine = await sharp({
          create: {
            width: currentLeft,
            height: 60,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
            channels: 4,
          },
        })
          .composite(textChars)
          .png()
          .toBuffer();

        let textLineMeta = await sharp(textLine).metadata();
        let leftPos = Math.floor((1080 - textLineMeta.width) / 2);
        textLines.push({
          input: textLine,
          top: textHeight,
          left: leftPos,
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
        .composite(textLines)
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
          {
            input: "./Assets/watermark.png",
            top: Math.floor(
              145 + textHeight + Math.random() * (finalHeight - 100)
            ),
            left: Math.floor(Math.random() * (1080 - 100)),
          },
        ])
        .png()
        .toBuffer();

      const file = new AttachmentBuilder(finalImage, {
        name: "rvcj.png",
      });
      message.reply({ content: "men are simple 🙂", files: [file] });
    } catch (err) {
      console.error(err);
      message.reply(`An error occurred: ${err.message}`);
    }
  },
};

const getEmojiImage = async (emoji) => {
  // Handle Discord custom emoji, including animated
  const customEmojiRegex = /<(a?):([a-zA-Z0-9_]+):([0-9]+)>/;
  const match = emoji.match(customEmojiRegex);
  if (match) {
    const isAnimated = match[1] === "a";
    const emojiId = match[3];
    const exts = isAnimated ? ["gif", "png", "webp"] : ["png", "webp"];
    for (const ext of exts) {
      const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?size=96&quality=lossless`;
      const res = await fetch(url);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        return Buffer.from(buf);
      }
    }
    throw new Error("Failed to fetch custom emoji from Discord CDN");
  }

  // Unicode emoji: use Twemoji assets by codepoint sequence
  const codepointSeq = [...emoji]
    .map((c) => c.codePointAt(0).toString(16))
    .join("-")
    .toLowerCase();
  const twemojiUrls = [
    `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codepointSeq}.png`,
    `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codepointSeq}.png`,
  ];
  for (const url of twemojiUrls) {
    const res = await fetch(url);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return Buffer.from(buf);
    }
  }
  // Fallback to GitHub emoji set (may not cover all sequences)
  const encodedEmoji = encodeURIComponent(emoji);
  const fallback = `https://raw.githubusercontent.com/luizbizzio/emojis/main/apple/${encodedEmoji}.png`;
  const res = await fetch(fallback);
  if (!res.ok) {
    throw new Error(`Failed to fetch emoji: ${res.statusText}`);
  }
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
};

const isEmoji = (part) => {
  const regex = emojiRegex();
  const customEmojiRegex = /<(?:a?):[a-zA-Z0-9_]+:[0-9]+>/;
  return customEmojiRegex.test(part) || regex.test(part);
};

// Split a string into tokens: full emoji sequences, custom emojis, spaces, or single characters
const segmentLine = (line) => {
  const eRe = emojiRegex();
  const customRe = /<(?:a?):[a-zA-Z0-9_]+:[0-9]+>/;
  const splitter = new RegExp(
    `${customRe.source}|${eRe.source}|\\s|.`,
    "gu"
  );
  return line.match(splitter) || [];
};
