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
    for (const name of ["user", "user1", "user2", "user3", "user4"]) {
      const user = ctx.options.getUser(name);
      const member = ctx.options.getMember(name);
      if (user) users.set(user.id, user);
      if (member && "user" in member) members.set(member.user.id, member as GuildMember);
    }
  }
  const text = source ? ctx.args.join(" ") : [ctx.options.getString("arguments") ?? ctx.options.getString("caption") ?? "", ...users.map(user => `<@${user.id}>`)].join(" ").trim();
  const attachment = ctx.isSlash ? ctx.options.getAttachment("image") ?? ctx.options.getAttachment("image-file") : null;
  return {
    args: source ? ctx.args : text ? text.split(/\s+/) : [],
    content: source?.content ?? `command ${text}`,
    users, members,
    attachments: source?.attachments ?? new Collection<string, Attachment>(attachment ? [[attachment.id, attachment]] : []),
    reference: source?.reference,
    fetchReference: () => {
      if (!source?.reference) throw new Error("Reply to a message with the prefix command, or supply slash arguments/image directly.");
      return source.fetchReference();
    },
  };
}

import { resolveMediaUrl } from "./gifHelper.js";

export async function contextImage(ctx: CommandContext, caption = false, options?: { dynamic?: boolean }): Promise<string> {
  if (!ctx.isSlash) return caption ? getCaptionInput(ctx.raw as Message) : getInputImage(ctx.raw as Message, options);
  const input = commandInput(ctx);
  const attachment = input.attachments.first();
  if (attachment) return attachment.url;
  const rawUrl = ctx.options.getString("image-url") ?? input.args.find(arg => /^https?:\/\//i.test(arg));
  if (rawUrl) return resolveMediaUrl(new URL(rawUrl).href);
  const user = input.users.first();
  if (caption && !user) throw new Error("Supply an image attachment, URL, or target user.");
  return (user ?? ctx.user).displayAvatarURL({ size: 512, forceStatic: options?.dynamic === false });
}
