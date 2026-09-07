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

export function formatMusicError(error: unknown): string {
  if (!(error instanceof Error)) return "The music command failed.";
  const raw = error.message;

  if (/Sign in to confirm you're not a bot/i.test(raw) || /bot.*authentication/i.test(raw)) {
    return "YouTube is requiring bot verification on this server IP. Try searching by title or using a SoundCloud link.";
  }
  if (/Sign in to confirm your age/i.test(raw)) {
    return "This track is age-restricted on YouTube and cannot be played.";
  }
  if (/Video unavailable/i.test(raw) || /Private video/i.test(raw)) {
    return "This track is unavailable or private.";
  }
  if (/not available in your country/i.test(raw) || /Geo-restricted/i.test(raw)) {
    return "This track is region-restricted.";
  }
  if (/Spotify audio is DRM-protected/i.test(raw)) {
    return raw;
  }
  if (/No playable tracks/i.test(raw)) {
    return "No playable tracks were found.";
  }

  // Strip CLI prefixes, stderr stack traces, and URLs to prevent Discord embed cards
  const cleaned = raw
    .replace(/^ERROR:\s*(?:\[[^\]]+\]\s*)?/i, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "The music command failed.";
}

export async function replyWithError(context: CommandContext, action: () => unknown | Promise<unknown>): Promise<unknown> {
  try {
    return await action();
  } catch (error) {
    const message = formatMusicError(error);
    return context.reply({ content: `❌ ${message}` });
  }
}
