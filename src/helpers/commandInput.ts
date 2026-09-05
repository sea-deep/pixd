import { Collection, type Message, type GuildMember, type User, type Attachment } from "discord.js";
import type CommandContext from "./CommandContext.js";
import { getInputImage, getCaptionInput } from "../helpers/helpersImage.js";

/** Resolve input data, without emulating a Discord Message or transport. */
export function commandInput(ctx: CommandContext) {
  const source = ctx.isSlash ? null : ctx.raw as Message;
  const users = new Collection<string, User>();
  const members = new Collection<string, GuildMember>();
  if (source) {
    for (const [id, user] of source.mentions.users) users.set(id, user);
    for (const [id, member] of source.mentions.members ?? []) members.set(id, member);
  } else {
    for (const name of ["user", "user1", "user2", "user3", "user4", "user5"]) {
      const user = ctx.options.getUser(name);
      const member = ctx.options.getMember(name);
      if (user) users.set(user.id, user);
      if (member && "user" in member) members.set(member.user.id, member as GuildMember);
    }
  }
  const text = source
    ? ctx.args.join(" ")
    : [
        ctx.options.getString("arguments") ??
          ctx.options.getString("caption") ??
          ctx.options.getString("text") ??
          "",
        ...users.map((user) => `<@${user.id}>`),
      ]
        .join(" ")
        .trim();

  const attachments = new Collection<string, Attachment>();
  if (source?.attachments) {
    for (const [id, att] of source.attachments) attachments.set(id, att);
  } else if (ctx.isSlash) {
    for (const name of ["image", "image-file", "image1", "image2", "image3", "image4", "image5"]) {
      const att = ctx.options.getAttachment(name);
      if (att) attachments.set(att.id, att);
    }
  }

  return {
    args: source ? ctx.args : text ? text.split(/\s+/) : [],
    content: source?.content ?? `command ${text}`,
    users,
    members,
    attachments,
    reference: source?.reference,
    fetchReference: () => {
      if (!source?.reference)
        throw new Error("Reply to a message with the prefix command, or supply slash arguments/image directly.");
      return source.fetchReference();
    },
  };
}

import { resolveMediaUrl } from "./gifHelper.js";
import { getTwemojiUrl } from "./targetImageResolver.js";
import emojiRegex from "emoji-regex";

export async function contextImage(ctx: CommandContext, caption = false, options?: { dynamic?: boolean }): Promise<string> {
  if (!ctx.isSlash) return caption ? getCaptionInput(ctx.raw as Message) : getInputImage(ctx.raw as Message, options);
  const input = commandInput(ctx);
  const attachment = input.attachments.first();
  if (attachment) return attachment.url;
  const rawUrl = ctx.options.getString("image-url") ?? input.args.find(arg => /^https?:\/\//i.test(arg));
  if (rawUrl) return resolveMediaUrl(new URL(rawUrl).href);

  // Check custom emojis in args
  const emoteMatch = input.content.match(/<(a?):[^:]+:(\d+)>/);
  if (emoteMatch) {
    const isAnimated = emoteMatch[1] === "a";
    const emojiId = emoteMatch[2];
    return `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}?size=512&quality=lossless`;
  }

  // Check unicode emojis in args
  const uMatch = input.content.match(emojiRegex());
  if (uMatch) {
    return getTwemojiUrl(uMatch[0]);
  }

  const user = input.users.first();
  if (caption && !user) throw new Error("Supply an image attachment, URL, or target user.");
  return (user ?? ctx.user).displayAvatarURL({ size: 512, forceStatic: options?.dynamic === false });
}
