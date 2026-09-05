import sharp, { type OverlayOptions, type Color } from "sharp";
import emojiRegex from "emoji-regex";
import { escapeImageText } from "./helpersImage.js";
import { getTwemojiUrl } from "./targetImageResolver.js";

const customEmojiRegex = /<(a?):([a-zA-Z0-9_]+):(\d+)>/g;

// In-memory cache for fetched emoji buffers to avoid repeated HTTP calls
const emojiCache = new Map<string, Buffer>();

export function clearEmojiCache(): void {
  emojiCache.clear();
}

/**
 * Fetches the transparent PNG/GIF buffer for a custom Discord emoji.
 */
export async function getCustomEmojiBuffer(token: string): Promise<Buffer | null> {
  const match = /<(a?):([a-zA-Z0-9_]+):(\d+)>/.exec(token);
  if (!match) return null;

  const isAnimated = match[1] === "a";
  const emojiId = match[3];
  const cacheKey = `custom_${emojiId}`;
  if (emojiCache.has(cacheKey)) {
    return emojiCache.get(cacheKey)!;
  }

  // Discord CDN returns transparent PNG for static and animated emojis
  const urls = [
    `https://cdn.discordapp.com/emojis/${emojiId}.png`,
    `https://cdn.discordapp.com/emojis/${emojiId}.webp`,
  ];
  if (isAnimated) {
    urls.unshift(`https://cdn.discordapp.com/emojis/${emojiId}.gif`);
  }

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "PixD-Bot (https://github.com/sea-deep/pixd, 1.0.0)",
          "Accept": "image/*",
        },
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        emojiCache.set(cacheKey, buf);
        return buf;
      }
    } catch {
      // Continue to fallback URL
    }
  }

  return null;
}

/**
 * Fetches an emoji buffer (custom Discord emoji or Unicode Twemoji).
 */
export async function getEmojiBuffer(token: string): Promise<Buffer | null> {
  if (/<(?:a?):[a-zA-Z0-9_]+:\d+>/.test(token)) {
    return await getCustomEmojiBuffer(token);
  }

  const cacheKey = `unicode_${token}`;
  if (emojiCache.has(cacheKey)) {
    return emojiCache.get(cacheKey)!;
  }

  try {
    const twemojiUrl = getTwemojiUrl(token);
    const res = await fetch(twemojiUrl, {
      headers: { "User-Agent": "PixD-Bot/1.0" },
    });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      emojiCache.set(cacheKey, buf);
      return buf;
    }
  } catch {
    // Fail quietly
  }

  return null;
}

export interface Token {
  text: string;
  type: "word" | "space" | "custom_emoji" | "unicode_emoji";
  buffer?: Buffer;
}

/**
 * Tokenizes text into words, spaces, custom emojis, and Unicode emojis.
 */
export function tokenizeText(text: string): Token[] {
  const eRe = emojiRegex();
  const cRe = /<(?:a?):[a-zA-Z0-9_]+:\d+>/g;

  interface RawMatch {
    index: number;
    text: string;
    type: "custom_emoji" | "unicode_emoji";
  }

  const matches: RawMatch[] = [];
  let m: RegExpExecArray | null;

  while ((m = cRe.exec(text)) !== null) {
    matches.push({ index: m.index, text: m[0], type: "custom_emoji" });
  }
  while ((m = eRe.exec(text)) !== null) {
    matches.push({ index: m.index, text: m[0], type: "unicode_emoji" });
  }

  matches.sort((a, b) => a.index - b.index);

  const tokens: Token[] = [];
  let lastIndex = 0;

  const pushTextSegments = (rawText: string) => {
    // Split text into words and spaces
    const parts = rawText.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        tokens.push({ text: " ", type: "space" });
      } else {
        tokens.push({ text: part, type: "word" });
      }
    }
  };

  for (const match of matches) {
    if (match.index < lastIndex) continue; // skip overlapping
    if (match.index > lastIndex) {
      pushTextSegments(text.slice(lastIndex, match.index));
    }
    tokens.push({ text: match.text, type: match.type });
    lastIndex = match.index + match.text.length;
  }

  if (lastIndex < text.length) {
    pushTextSegments(text.slice(lastIndex));
  }

  return tokens;
}

/**
 * Wraps tokens into lines based on approximate character units.
 */
export function wrapTokensToLines(tokens: Token[], maxUnitsPerLine = 28): Token[][] {
  const lines: Token[][] = [];
  let currentLine: Token[] = [];
  let currentUnits = 0;

  const tokenUnits = (t: Token): number => {
    if (t.type === "space") return 1;
    if (t.type === "custom_emoji" || t.type === "unicode_emoji") return 2;
    return t.text.length;
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const units = tokenUnits(t);

    if (currentLine.length === 0) {
      // Don't start a line with leading whitespace
      if (t.type === "space") continue;
      currentLine.push(t);
      currentUnits += units;
    } else if (currentUnits + units <= maxUnitsPerLine) {
      currentLine.push(t);
      currentUnits += units;
    } else {
      // Wrap: if this token is a space, skip it and start next line
      if (t.type === "space") {
        if (currentLine.length > 0) lines.push(currentLine);
        currentLine = [];
        currentUnits = 0;
      } else {
        // Strip trailing space from current line if present
        while (currentLine.length > 0 && currentLine[currentLine.length - 1].type === "space") {
          currentLine.pop();
        }
        if (currentLine.length > 0) lines.push(currentLine);
        currentLine = [t];
        currentUnits = units;
      }
    }
  }

  // Strip trailing space from final line
  while (currentLine.length > 0 && currentLine[currentLine.length - 1].type === "space") {
    currentLine.pop();
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Replaces custom emojis with placeholders so Google Translate doesn't mangle them.
 */
export function protectCustomEmojis(text: string): {
  protectedText: string;
  restore: (translated: string) => string;
} {
  const emojis: string[] = [];
  const placeholderRegex = /__DISCORD_EMOJI_(\d+)__/g;

  const protectedText = text.replace(customEmojiRegex, (match) => {
    const idx = emojis.length;
    emojis.push(match);
    return `__DISCORD_EMOJI_${idx}__`;
  });

  const restore = (translated: string): string => {
    return translated.replace(placeholderRegex, (_, idxStr) => {
      const idx = parseInt(idxStr, 10);
      return emojis[idx] || "";
    });
  };

  return { protectedText, restore };
}

export interface RenderTextWithEmojisOptions {
  font?: string;
  fontfile?: string;
  textColor?: string;
  bgColor?: string;
  lineHeight?: number;
  emojiSize?: number;
  spaceWidth?: number;
  maxUnitsPerLine?: number;
  maxWidth?: number;
  maxHeight?: number;
  align?: "center" | "left";
  uppercase?: boolean;
  bannerPadding?: number;
}

/**
 * Renders multiline text containing words, spaces, custom emojis, and Unicode emojis
 * with transparency preserved.
 */
export async function renderTextWithEmojis(
  text: string,
  options: RenderTextWithEmojisOptions = {}
): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  const {
    font = "Baloo 2 ExtraBold",
    fontfile = "./Assets/baloo.ttf",
    textColor = "#000000",
    bgColor = "transparent",
    lineHeight = 60,
    emojiSize = 48,
    spaceWidth = 14,
    maxUnitsPerLine = 28,
    maxWidth = 1080,
    maxHeight,
    align = "center",
    uppercase = false,
    bannerPadding = 0,
  } = options;

  const trimmed = text.trim();
  if (!trimmed) return null;

  // Split by newline first, then tokenize and wrap
  const rawLines = trimmed.split(/\r?\n/);
  const allLines: Token[][] = [];

  for (const rawLine of rawLines) {
    const tokens = tokenizeText(rawLine);
    if (tokens.length === 0) continue;
    const wrapped = wrapTokensToLines(tokens, maxUnitsPerLine);
    allLines.push(...wrapped);
  }

  if (allLines.length === 0) return null;

  // Pre-fetch all emojis in parallel
  const uniqueEmojiTokens = new Set<string>();
  for (const line of allLines) {
    for (const t of line) {
      if (t.type === "custom_emoji" || t.type === "unicode_emoji") {
        uniqueEmojiTokens.add(t.text);
      }
    }
  }

  await Promise.all(
    [...uniqueEmojiTokens].map(async (tok) => {
      await getEmojiBuffer(tok);
    })
  );

  const renderedLineOverlays: OverlayOptions[] = [];
  const renderedLineWidths: number[] = [];
  let maxLineWidth = 0;

  for (let lineIdx = 0; lineIdx < allLines.length; lineIdx++) {
    const lineTokens = allLines[lineIdx];
    const lineComposites: OverlayOptions[] = [];
    let currentLeft = 0;

    for (const token of lineTokens) {
      if (token.type === "space") {
        currentLeft += spaceWidth;
        continue;
      }

      if (token.type === "custom_emoji" || token.type === "unicode_emoji") {
        const rawBuf = await getEmojiBuffer(token.text);
        if (rawBuf) {
          const resizedEmoji = await sharp(rawBuf)
            .resize(emojiSize, emojiSize, { fit: "contain" })
            .png()
            .toBuffer();

          lineComposites.push({
            input: resizedEmoji,
            left: currentLeft,
            top: Math.floor((lineHeight - emojiSize) / 2),
          });
          currentLeft += emojiSize;
          continue;
        }
      }

      // Render text token
      const displayText = uppercase ? token.text.toUpperCase() : token.text;
      const textBuf = await sharp({
        text: {
          text: `<span foreground="${textColor}">${escapeImageText(displayText)}</span>`,
          font,
          fontfile,
          dpi: 400,
          rgba: true,
        },
      })
        .resize({ height: lineHeight - 10, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();

      const meta = await sharp(textBuf).metadata();
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;

      lineComposites.push({
        input: textBuf,
        left: currentLeft,
        top: Math.floor((lineHeight - h) / 2),
      });
      currentLeft += w;
    }

    if (currentLeft === 0) continue;

    let lineImg = await sharp({
      create: {
        width: Math.max(1, currentLeft),
        height: lineHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(lineComposites)
      .png()
      .toBuffer();

    const maxLineWidthAllowed = maxWidth - 60;
    if (currentLeft > maxLineWidthAllowed) {
      lineImg = await sharp(lineImg)
        .resize({ width: maxLineWidthAllowed, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
    }

    const lineMeta = await sharp(lineImg).metadata();
    const effectiveWidth = lineMeta.width ?? currentLeft;
    renderedLineWidths.push(effectiveWidth);
    if (effectiveWidth > maxLineWidth) maxLineWidth = effectiveWidth;

    renderedLineOverlays.push({
      input: lineImg,
      top: lineIdx * lineHeight + bannerPadding,
      left: 0, // centered later
    });
  }

  if (renderedLineOverlays.length === 0) return null;

  const totalHeight = allLines.length * lineHeight + bannerPadding * 2;
  const canvasWidth = maxWidth;

  // Align lines horizontally
  for (let i = 0; i < renderedLineOverlays.length; i++) {
    const lineWidth = renderedLineWidths[i] || 0;
    if (align === "center") {
      renderedLineOverlays[i].left = Math.max(0, Math.floor((canvasWidth - lineWidth) / 2));
    } else {
      renderedLineOverlays[i].left = 15;
    }
  }

  let bgObj: Color = { r: 0, g: 0, b: 0, alpha: 0 };
  if (bgColor === "#000000" || bgColor === "black") {
    bgObj = { r: 0, g: 0, b: 0, alpha: 1 };
  } else if (bgColor === "#ffffff" || bgColor === "white") {
    bgObj = { r: 255, g: 255, b: 255, alpha: 1 };
  }

  let canvasBuffer = await sharp({
    create: {
      width: canvasWidth,
      height: totalHeight,
      channels: 4,
      background: bgObj,
    },
  })
    .composite(renderedLineOverlays)
    .png()
    .toBuffer();

  let finalWidth = canvasWidth;
  let finalHeight = totalHeight;

  // If maxHeight is constrained (e.g. speech bubbles), scale down to fit
  if (maxHeight && totalHeight > maxHeight) {
    canvasBuffer = await sharp(canvasBuffer)
      .resize({ width: maxWidth, height: maxHeight, fit: "inside" })
      .png()
      .toBuffer();
    const scaledMeta = await sharp(canvasBuffer).metadata();
    finalWidth = scaledMeta.width ?? maxWidth;
    finalHeight = scaledMeta.height ?? maxHeight;
  }

  return { buffer: canvasBuffer, width: finalWidth, height: finalHeight };
}
