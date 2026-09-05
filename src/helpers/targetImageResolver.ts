import type { Message, User, Attachment } from "discord.js";
import type CommandContext from "./CommandContext.js";
import { resolveMediaUrl } from "./gifHelper.js";
import emojiRegex from "emoji-regex";
import sharp from "sharp";
import { commandInput } from "./commandInput.js";

/**
 * Converts a Unicode emoji into a Twemoji CDN PNG URL.
 */
export function getTwemojiUrl(emoji: string): string {
  const codepoints = [...emoji]
    .map((char) => char.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== "fe0f")
    .join("-")
    .toLowerCase();
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codepoints}.png`;
}

/**
 * Safely fetches a remote image or GIF as a Buffer.
 */
export async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

interface TargetCandidate {
  type: "attachment" | "mention" | "id" | "custom_emoji" | "unicode_emoji" | "url" | "author";
  url?: string;
  userId?: string;
}

export interface ResolveMultiTargetsOptions {
  /**
   * If true, and the user provided exactly 1 explicit input, duplicate that single target to fill the count.
   * Useful for commands like `lapata` where 1 input means all posters use the same image.
   * Default: false.
   */
  duplicateIfSingle?: boolean;
}

/**
 * Resolves multiple image targets for image commands (e.g. animan, rancho, lapata).
 * Scans in order:
 * 1. Direct attachments (from message or slash options)
 * 2. Positional tokens (mentions, IDs, custom emojis, unicode emojis, URLs)
 * 3. Replied/referenced message (attachments, embeds, emojis, URLs, author)
 * 4. Recent active channel users (excluding bot) if more targets are needed
 * 5. Command author fallback
 * 6. Cyclic duplication fallback
 */
export async function resolveMultiImageTargets(
  ctx: CommandContext,
  count: number,
  options?: ResolveMultiTargetsOptions
): Promise<Buffer[]> {
  const input = commandInput(ctx);
  const candidates: TargetCandidate[] = [];
  const source = ctx.isSlash ? null : (ctx.raw as Message);

  // 1. Collect direct attachments
  for (const attachment of input.attachments.values()) {
    if (attachment.url) {
      candidates.push({ type: "attachment", url: attachment.url });
    }
  }

  // 2. Parse text content & arguments
  const textToScan = source ? source.content : input.args.join(" ");
  if (textToScan) {
    const words = textToScan.split(/\s+/).filter(Boolean);
    const customEmojiRe = /^<(a?):([a-zA-Z0-9_]+):([0-9]+)>$/;
    const mentionRe = /^<@!?([0-9]+)>$/;
    const idRe = /^([0-9]{17,20})$/;
    const urlRe = /^https?:\/\/[^\s<>"{}|\\^`]+[^\s<>"{}|\\^`.,?!:;]/i;
    const unicodeEmojiRe = emojiRegex();

    for (const word of words) {
      // Check custom emoji: <:name:123> or <a:name:123>
      const customMatch = word.match(customEmojiRe);
      if (customMatch) {
        const isAnim = customMatch[1] === "a";
        const emojiId = customMatch[3];
        candidates.push({
          type: "custom_emoji",
          url: `https://cdn.discordapp.com/emojis/${emojiId}.${isAnim ? "gif" : "png"}?size=256&quality=lossless`,
        });
        continue;
      }

      // Check user mention: <@123> or <@!123>
      const mentionMatch = word.match(mentionRe);
      if (mentionMatch) {
        candidates.push({ type: "mention", userId: mentionMatch[1] });
        continue;
      }

      // Check direct URL
      const urlMatch = word.match(urlRe);
      if (urlMatch) {
        candidates.push({ type: "url", url: urlMatch[0] });
        continue;
      }

      // Check snowflake user ID
      const idMatch = word.match(idRe);
      if (idMatch) {
        candidates.push({ type: "id", userId: idMatch[1] });
        continue;
      }

      // Check for unicode emoji(s) within word
      let uMatch: RegExpExecArray | null;
      let matchedUnicode = false;
      while ((uMatch = unicodeEmojiRe.exec(word)) !== null) {
        matchedUnicode = true;
        candidates.push({
          type: "unicode_emoji",
          url: getTwemojiUrl(uMatch[0]),
        });
      }
      if (matchedUnicode) continue;
    }
  }

  // 2b. Add any slash command users not explicitly captured in content
  if (ctx.isSlash && input.users.size > 0) {
    for (const user of input.users.values()) {
      if (!candidates.some((c) => c.userId === user.id)) {
        candidates.push({ type: "mention", userId: user.id });
      }
    }
  }

  // 3. Replied / Referenced message
  if (candidates.length < count && source?.reference?.messageId) {
    try {
      const refMsg = await source.fetchReference();
      if (refMsg) {
        // Attachments
        for (const att of refMsg.attachments.values()) {
          candidates.push({ type: "attachment", url: att.url });
        }
        // Embeds
        for (const embed of refMsg.embeds) {
          if (embed.image?.url) candidates.push({ type: "url", url: embed.image.url });
          else if (embed.thumbnail?.url) candidates.push({ type: "url", url: embed.thumbnail.url });
          else if (embed.video?.url && /\.gif(?:\?.*)?$/i.test(embed.video.url)) {
            candidates.push({ type: "url", url: embed.video.url });
          }
        }
        // Stickers
        for (const sticker of refMsg.stickers.values()) {
          candidates.push({
            type: "url",
            url: `https://cdn.discordapp.com/stickers/${sticker.id}.png`,
          });
        }
        // Reference author
        if (refMsg.author) {
          candidates.push({ type: "author", userId: refMsg.author.id });
        }
      }
    } catch {
      // Ignore reference fetch failure
    }
  }

  // Resolve explicit candidates to Buffers
  const resolvedBuffers: Buffer[] = [];
  const usedUserIds = new Set<string>();

  for (const candidate of candidates) {
    if (resolvedBuffers.length >= count * 2) break; // Reasonable cap on candidate processing

    if (candidate.userId) {
      usedUserIds.add(candidate.userId);
      try {
        const user =
          ctx.client.users.cache.get(candidate.userId) ??
          (await ctx.client.users.fetch(candidate.userId).catch(() => null));
        if (user) {
          const avatarUrl = user.displayAvatarURL({ size: 256, forceStatic: false });
          const buf = await fetchImageBuffer(avatarUrl);
          if (buf) resolvedBuffers.push(buf);
        }
      } catch {
        // Skip user fetch error
      }
    } else if (candidate.url) {
      try {
        const resolvedUrl = await resolveMediaUrl(candidate.url);
        const buf = await fetchImageBuffer(resolvedUrl);
        if (buf) resolvedBuffers.push(buf);
      } catch {
        // Skip URL fetch error
      }
    }
  }

  const explicitCount = resolvedBuffers.length;

  // Handle single-target duplication mode (e.g. lapata)
  if (options?.duplicateIfSingle && explicitCount === 1) {
    const single = resolvedBuffers[0];
    return new Array(count).fill(single);
  }

  // 4. Channel History Fallback (fetch recent chatters if still needed)
  if (resolvedBuffers.length < count && ctx.channel && "messages" in ctx.channel) {
    try {
      const messages = await ctx.channel.messages.fetch({ limit: 50 });
      const botId = ctx.client.user?.id;

      for (const msg of messages.values()) {
        if (resolvedBuffers.length >= count) break;
        // Skip the command message itself
        if (source && msg.id === source.id) continue;
        // Skip the bot
        if (botId && msg.author.id === botId) continue;
        // Skip already added user
        if (usedUserIds.has(msg.author.id)) continue;

        usedUserIds.add(msg.author.id);
        const avatarUrl = msg.author.displayAvatarURL({ size: 256, forceStatic: false });
        const buf = await fetchImageBuffer(avatarUrl);
        if (buf) {
          resolvedBuffers.push(buf);
        }
      }
    } catch {
      // Ignore channel history error (e.g. missing permissions)
    }
  }

  // 5. Command Author Fallback
  if (resolvedBuffers.length < count && !usedUserIds.has(ctx.user.id)) {
    usedUserIds.add(ctx.user.id);
    const authorUrl = ctx.user.displayAvatarURL({ size: 256, forceStatic: false });
    const buf = await fetchImageBuffer(authorUrl);
    if (buf) resolvedBuffers.push(buf);
  }

  // 6. Cyclic Duplication Fallback
  if (resolvedBuffers.length > 0 && resolvedBuffers.length < count) {
    const original = [...resolvedBuffers];
    let idx = 0;
    while (resolvedBuffers.length < count) {
      resolvedBuffers.push(original[idx % original.length]);
      idx++;
    }
  }

  // 7. Safety Placeholder Fallback
  if (resolvedBuffers.length === 0) {
    const placeholder = await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 4,
        background: { r: 120, g: 120, b: 120, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    while (resolvedBuffers.length < count) {
      resolvedBuffers.push(placeholder);
    }
  }

  return resolvedBuffers.slice(0, count);
}
