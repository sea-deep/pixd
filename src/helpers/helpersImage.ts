import type { Message } from "discord.js";
import { resolveMediaUrl } from "./gifHelper.js";
import { getTwemojiUrl } from "./targetImageResolver.js";
import emojiRegex from "emoji-regex";
export function escapeImageText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
const urlRegex = /https?:\/\/[^\s<>"{}|\\^`]+[^\s<>"{}|\\^`.,?!:;]/i;
const emoteRegex = /<(a?):[^:]+:(\d+)>/;
import axios from 'axios';
import * as cheerio from "cheerio";
import { isUnembeddableMedia } from "../services/ImageSearchService.js";

export function getEmbedMedia(message: Message): string | null {
  for (const embed of message.embeds) {
    if (embed.image?.url) return embed.image.url;
    if (embed.video?.url) return embed.video.url;
    if (embed.thumbnail?.url) return embed.thumbnail.url;
  }
  return null;
}

/**
 * Extracts a target media URL from a single Discord message.
 * Checks attachments, embeds (including videos and proxies), stickers, custom emotes, unicode emojis, and URLs.
 */
export async function extractMediaFromMessage(message: Message): Promise<string | null> {
  if (message.attachments.size >= 1) {
    return message.attachments.first()!.url;
  }

  const embedMedia = getEmbedMedia(message);
  if (embedMedia) {
    return await resolveMediaUrl(embedMedia);
  }

  if (message.stickers.size >= 1) {
    return `https://cdn.discordapp.com/stickers/${message.stickers.first()!.id}.png`;
  }

  const emoteMatch = message.content.match(emoteRegex);
  if (emoteMatch) {
    const isAnimated = emoteMatch[1] === "a";
    const emojiId = emoteMatch[2];
    return `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}?size=512&quality=lossless`;
  }

  const uMatch = message.content.match(emojiRegex());
  if (uMatch) {
    return getTwemojiUrl(uMatch[0]);
  }

  const match = message.content.match(urlRegex);
  if (match) {
    return await resolveMediaUrl(match[0]);
  }

  return null;
}

export async function getInputImage(message: Message, opt?: { dynamic?: boolean }): Promise<string> {
  const forceStatic = opt?.dynamic === false;

  const currentMedia = await extractMediaFromMessage(message);
  if (currentMedia) {
    return currentMedia;
  }

  if (message.reference?.messageId) {
    try {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId);
      const refMedia = await extractMediaFromMessage(refMsg);
      if (refMedia) {
        return refMedia;
      }
    } catch {}
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

export async function getCaptionInput(message: Message): Promise<string> {
  // Check referenced message first
  if (message.reference?.messageId) {
    try {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId);
      const refMedia = await extractMediaFromMessage(refMsg);
      if (refMedia) {
        return refMedia;
      }
    } catch {}
  }

  // Check current message
  const currentMedia = await extractMediaFromMessage(message);
  if (currentMedia) {
    return currentMedia;
  }

  // Check recent messages in channel
  try {
    const messages = await message.channel.messages.fetch({
      limit: 10,
      cache: false,
    });
    for (const msg of messages.values()) {
      if (msg.id === message.id) continue;
      const recentMedia = await extractMediaFromMessage(msg);
      if (recentMedia) {
        return recentMedia;
      }
    }
  } catch {}

  throw new Error("Supply an image attachment, URL, emoji, or reply to an image.");
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
    const resolved = await resolveMediaUrl(url);
    if (resolved && resolved !== url) return resolved;
  } catch {}
  return fallback || url;
}
