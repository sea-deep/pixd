import type { Message } from "discord.js";
import { resolveMediaUrl } from "./gifHelper.js";
export function escapeImageText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
const urlRegex = /https?:\/\/[^\s<>"{}|\\^`]+[^\s<>"{}|\\^`.,?!:;]/i;
const emoteRegex = /<(a?):[^:]+:(\d+)>/;
import axios from 'axios';
import * as cheerio from "cheerio";
import { isUnembeddableMedia } from "../services/ImageSearchService.js";

function getEmbedMedia(message: Message): string | null {
  for (const embed of message.embeds) {
    if (embed.image?.url) return embed.image.url;
    if (embed.thumbnail?.url) return embed.thumbnail.url;
    if (embed.video?.url && /\.gif(?:\?.*)?$/i.test(embed.video.url)) return embed.video.url;
  }
  return null;
}

export async function getInputImage(message: Message, opt?: { dynamic?: boolean }) {
  const forceStatic = opt?.dynamic === false;

  if (message.attachments.size >= 1) {
    return message.attachments.first()!.url;
  }

  const embedMedia = getEmbedMedia(message);
  if (embedMedia) {
    return embedMedia;
  }

  if (message.stickers.size >= 1) {
    return `https://cdn.discordapp.com/stickers/${
      message.stickers.first()!.id
    }.png`;
  }

  const emoteMatch = message.content.match(emoteRegex);
  if (emoteMatch) {
    const isAnimated = emoteMatch[1] === "a";
    const emojiId = emoteMatch[2];
    return `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}`;
  }

  const match = message.content.match(urlRegex);
  if (match) {
    return resolveMediaUrl(match[0]);
  }

  if (message.reference) {
    const refMsg = await message.channel.messages.fetch(
      message.reference.messageId!,
    );

    if (refMsg.attachments.size >= 1) {
      return refMsg.attachments.first()!.url;
    }

    const refEmbedMedia = getEmbedMedia(refMsg);
    if (refEmbedMedia) {
      return refEmbedMedia;
    }

    const refEmoteMatch = refMsg.content.match(emoteRegex);
    if (refEmoteMatch) {
      const isAnimated = refEmoteMatch[1] === "a";
      const emojiId = refEmoteMatch[2];
      return `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}`;
    }

    const refUrlMatch = refMsg.content.match(urlRegex);
    if (refUrlMatch) {
      return resolveMediaUrl(refUrlMatch[0]);
    }

    if (refMsg.stickers.size >= 1) {
      return `https://cdn.discordapp.com/stickers/${
        refMsg.stickers.first()!.id
      }.png`;
    }
  }

  if (message.mentions.users.size >= 1) {
    return message.mentions.users.first()!.displayAvatarURL({
      size: 512,
      forceStatic,
    });
  }

  return message.author.displayAvatarURL({
    size: 512,
    forceStatic,
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
      const refEmbedMedia = getEmbedMedia(refMsg);
      if (refEmbedMedia) {
        image = refEmbedMedia;
      } else {
        const match = refMsg.content.match(urlRegex);
        if (match) {
          image = await resolveMediaUrl(match[0]);
        } else {
          const emoteMatch = refMsg.content.match(emoteRegex);
          if (emoteMatch) {
            const isAnimated = emoteMatch[1] === "a";
            const emojiId = emoteMatch[2];
            image = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}`;
          } else if (refMsg.stickers.size >= 1) {
            image = `https://cdn.discordapp.com/stickers/${refMsg.stickers.first()!.id}.png`;
          }
        }
      }
    }

    if (image) {
      return image;
    }
  }

  // Check current message
  if (message.attachments.size >= 1) {
    image = message.attachments.first()!.url;
  } else {
    const currentEmbedMedia = getEmbedMedia(message);
    if (currentEmbedMedia) {
      image = currentEmbedMedia;
    } else if (message.stickers.size >= 1) {
      image = `https://cdn.discordapp.com/stickers/${message.stickers.first()!.id}.png`;
    } else {
      const match = message.content.match(urlRegex);
      if (match) {
        image = await resolveMediaUrl(match[0]);
      } else {
        const emoteMatch = message.content.match(emoteRegex);
        if (emoteMatch) {
          const isAnimated = emoteMatch[1] === "a";
          const emojiId = emoteMatch[2];
          image = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}`;
        }
      }
    }
  }

  // If image still not found, check recent messages
  if (!image) {
    const messages = await message.channel.messages.fetch({
      limit: 10,
      cache: false,
    });
    for (const msg of messages.values()) {
      if (image) break;
      if (msg.attachments.size >= 1) {
        image = msg.attachments.first()!.url;
      } else {
        const recentEmbedMedia = getEmbedMedia(msg);
        if (recentEmbedMedia) {
          image = recentEmbedMedia;
        } else if (msg.stickers.size >= 1) {
          image = `https://cdn.discordapp.com/stickers/${msg.stickers.first()!.id}.png`;
        } else {
          const match = msg.content.match(urlRegex);
          if (match) {
            image = await resolveMediaUrl(match[0]);
          } else {
            const emoteMatch = msg.content.match(emoteRegex);
            if (emoteMatch) {
              const isAnimated = emoteMatch[1] === "a";
              const emojiId = emoteMatch[2];
              image = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}`;
            }
          }
        }
      }
    }
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
