import type { Message } from "discord.js";
export function escapeImageText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
const regex = /https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i;
const emoteRegex = /<:[^:]+:(\d+)>/;
import axios from 'axios';
import * as cheerio from "cheerio";
import { isUnembeddableMedia } from "../services/ImageSearchService.js";
export async function getInputImage(message: Message, opt?: { dynamic?: boolean }) {
  let state = opt?.dynamic ? false : true;

  if (message.attachments.size >= 1) {
    return message.attachments.first()!.url;
  }

  if (message.stickers.size >= 1) {
    return `https://cdn.discordapp.com/stickers/${
      message.stickers.first()!.id
    }.png`;
  }

  let match = message.content.match(emoteRegex);
  if (match) {
    let emojiId = match[1];
    return `https://cdn.discordapp.com/emojis/${emojiId}.png`;
  }

  match = message.content.match(regex);
  if (match) {
    return match[0];
  }

  if (message.reference) {
    let refMsg = await message.channel.messages.fetch(
      message.reference.messageId!,
    );

    if (refMsg.attachments.size >= 1) {
      return refMsg.attachments.first()!.url;
    }

    match = refMsg.content.match(regex);
    if (match) {
      return match[0];
    }

    match = refMsg.content.match(emoteRegex);
    if (match) {
      let emojiId = match[1];
      return `https://cdn.discordapp.com/emojis/${emojiId}.png`;
    }

    if (refMsg.stickers.size >= 1) {
      return `https://cdn.discordapp.com/stickers/${
        refMsg.stickers.first()!.id
      }.png`;
    }
  }

  if (message.mentions.users.size >= 1) {
    return message.mentions.users.first()!.displayAvatarURL({
      extension: "png",
      forceStatic: state,
    });
  }

  return message.author.displayAvatarURL({
    extension: "png",
    forceStatic: state,
  });
}

export async function getCaptionInput(message: Message) {
  let image: string | null = null;

  // Check referenced message
  if (message.reference) {
    const refMsg = await message.channel.messages.fetch(
      message.reference.messageId!,
    );

    if (refMsg.attachments.size >= 1) {
      image = refMsg.attachments.first()!.url;
    } else {
      let match = refMsg.content.match(regex);
      if (match) {
        image = match[0];
      } else {
        match = refMsg.content.match(emoteRegex);
        if (match) {
          const emojiId = match[1];
          image = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
        }
      }
    }

    // Return if image is found in the referenced message
    if (image) {
      return image;
    }
  }

  // Check current message
  if (message.attachments.size >= 1) {
    image = message.attachments.first()!.url;
  } else if (message.stickers.size >= 1) {
    image = `https://cdn.discordapp.com/stickers/${message.stickers.first()!.id}.png`;
  } else {
    let match = message.content.match(regex);
    if (match) {
      image = match[0];
    } else {
      match = message.content.match(emoteRegex);
      if (match) {
        const emojiId = match[1];
        image = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
      }
    }
  }

  // If image still not found, check recent messages
  if (!image) {
    const messages = await message.channel.messages.fetch({
      limit: 10,
      cache: false,
    });
    messages.forEach((msg) => {
      if (!image) {
        if (msg.attachments.size >= 1) {
          image = msg.attachments.first()!.url;
        } else if (msg.stickers.size >= 1) {
          image = `https://cdn.discordapp.com/stickers/${msg.stickers.first()!.id}.png`;
        } else {
          const match = msg.content.match(
            regex,
          );
          if (match) {
            image = match[0];
          } else {
            const emojiMatch = msg.content.match(emoteRegex);
            if (emojiMatch) {
              const emojiId = emojiMatch[1];
              image = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
            }
          }
        }
      }
    });
  }

  if (!image) throw new Error("Supply an image attachment, URL, emoji, or reply to an image.");
  return image;
}

export function resolveEmbedImageUrl(image: { url: string; thumbnailUrl?: string; originalUrl?: string }): string {
  if (!image) return "";
  if (isUnembeddableMedia(image.url, image.originalUrl) && image.thumbnailUrl) {
    return image.thumbnailUrl;
  }
  return image.url || image.thumbnailUrl || "";
}

export async function handleMeta(url: string, fallback?: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 3000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const $ = cheerio.load(response.data);
    const metaImage = $('meta[property="og:image"]').attr("content");
    if (metaImage && /^https?:\/\//.test(metaImage)) {
      return metaImage;
    }
  } catch {
    // Fail safely without throwing unhandled exceptions
  }
  return fallback || url;
}
