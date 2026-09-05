import type CommandContext from "../../helpers/CommandContext.js";
import type GuildPlayer from "./GuildPlayer.js";

export function requireVoiceChannel(context: CommandContext): string {
  if (!context.guild || !context.member) throw new Error("This command can only be used in a server.");
  const channelId = context.member.voice.channelId;
  if (!channelId) throw new Error("Join a voice channel before using this command.");
  return channelId;
}

export function requirePlayer(context: CommandContext): GuildPlayer {
  if (!context.guild) throw new Error("This command can only be used in a server.");
  const voiceChannelId = requireVoiceChannel(context);
  const player = context.raw.client.music.get(context.guild.id);
  if (!player) throw new Error("Nothing is currently playing.");
  if (player.voiceChannelId !== voiceChannelId) throw new Error("Join my voice channel to control playback.");
  return player;
}

export function parseTimestamp(input: string): number {
  if (!input.trim()) throw new Error("Use a timestamp such as `90`, `1:30`, or `1:02:30`.");
  const parts = input.split(":").map(Number);
  if (!parts.length || parts.some((part) => !Number.isFinite(part) || part < 0) || parts.length > 3) {
    throw new Error("Use a timestamp such as `90`, `1:30`, or `1:02:30`.");
  }
  return parts.reduce((total, part) => total * 60 + part, 0) * 1000;
}

export async function replyWithError(context: CommandContext, action: () => unknown | Promise<unknown>): Promise<unknown> {
  try {
    return await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : "The music command failed.";
    return context.reply({ content: `❌ ${message}` });
  }
}
