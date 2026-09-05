import { createHash } from "node:crypto";
import type { Client, VoiceBasedChannel } from "discord.js";
import { env } from "../../utilities/env.js";
import Logger from "../../helpers/Logger.js";
import type { MusicTrack } from "../music/types.js";

export default class LastFmService {
  constructor(private readonly client: Client) {}

  async updateNowPlaying(track: MusicTrack, voiceChannelId: string): Promise<number> {
    if (!env.LASTFM_KEY || !env.LASTFM_SECRET) return 0;
    const sessions = await this.sessionsInChannel(voiceChannelId);
    await Promise.allSettled(sessions.map((session) => this.post({
      method: "track.updateNowPlaying",
      artist: track.author,
      track: track.title,
      sk: session,
    })));
    return sessions.length;
  }

  async scrobble(track: MusicTrack, voiceChannelId: string, startedAt: number, playedMs: number): Promise<number> {
    if (!env.LASTFM_KEY || !env.LASTFM_SECRET || track.durationMs < 30_000) return 0;
    const requiredMs = Math.min(track.durationMs / 2, 4 * 60_000);
    if (playedMs < requiredMs) return 0;

    const sessions = await this.sessionsInChannel(voiceChannelId);
    await Promise.allSettled(sessions.map((session) => this.post({
      method: "track.scrobble",
      artist: track.author,
      track: track.title,
      timestamp: Math.floor(startedAt / 1000),
      sk: session,
    })));
    return sessions.length;
  }

  private async sessionsInChannel(channelId: string): Promise<string[]> {
    const channel = await this.client.channels.fetch(channelId).catch(() => null) as VoiceBasedChannel | null;
    if (!channel?.isVoiceBased()) return [];
    const sessions = await Promise.all(
      channel.members
        .filter((member) => !member.user.bot)
        .map((member) => this.client.lastFmDb.get(member.id)),
    );
    return sessions.filter((session): session is string => typeof session === "string" && session.length > 0);
  }

  private async post(values: Record<string, string | number>): Promise<void> {
    const signedValues: Record<string, string | number> = { ...values, api_key: env.LASTFM_KEY! };
    const apiSignature = Object.keys(signedValues)
      .sort()
      .map((key) => `${key}${signedValues[key]}`)
      .join("") + env.LASTFM_SECRET!;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(signedValues)) params.set(key, String(value));
    params.set("api_sig", createHash("md5").update(apiSignature).digest("hex"));
    params.set("format", "json");

    const response = await fetch("https://ws.audioscrobbler.com/2.0/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (!response.ok) Logger.warn(`Last.fm returned HTTP ${response.status}`);
  }
}
