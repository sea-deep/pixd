import { youtubeDl } from "youtube-dl-exec";
import config from "../../../Configs/config.js";
import { getCookiesPath } from "../../helpers/cookieHelper.js";
import type { MusicTrack, ResolveResult } from "./types.js";

type YtDlpEntry = {
  _type?: string;
  id?: string;
  url?: string;
  webpage_url?: string;
  original_url?: string;
  title?: string;
  fulltitle?: string;
  uploader?: string;
  channel?: string;
  artist?: string;
  duration?: number | null;
  thumbnail?: string;
  entries?: YtDlpEntry[];
  playlist_title?: string;
  title_requested?: string;
};

export default class YtDlpResolver {
  async resolve(input: string, requesterId: string): Promise<ResolveResult> {
    const query = input.trim();
    if (!query) throw new Error("Provide a song name or media URL.");

    const isUrl = /^https?:\/\//i.test(query);
    if (isUrl) {
      const url = new URL(query);
      if (url.hostname === "open.spotify.com" || url.hostname.endsWith(".spotify.com")) {
        throw new Error("Spotify audio is DRM-protected and cannot be played directly. Search for the song name instead.");
      }
    }

    const target = isUrl ? query : `ytsearch1:${query}`;
    const cookiesPath = getCookiesPath();
    const options: Record<string, unknown> = {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
      extractorArgs: "youtube:player_client=ios,android,mweb;player_skip=webpage",
      playlistEnd: config.music.maxPlaylistSize,
      socketTimeout: 20,
      ...(cookiesPath ? { cookies: cookiesPath } : {}),
    };
    const payload = await (youtubeDl as (target: string, flags?: Record<string, unknown>) => Promise<unknown>)(
      target,
      options,
    ) as YtDlpEntry;

    const entries = payload.entries?.length ? payload.entries : [payload];
    const tracks = entries
      .slice(0, config.music.maxPlaylistSize)
      .map((entry) => this.toTrack(entry, requesterId))
      .filter((track): track is MusicTrack => track !== null);

    if (tracks.length === 0) {
      if (entries.length > 0 && entries[0].duration && entries[0].duration * 1000 > config.music.maxTrackDurationMs) {
        const hours = Math.round(config.music.maxTrackDurationMs / (60 * 60 * 1000));
        throw new Error(`Track exceeds the maximum duration limit of ${hours} hours.`);
      }
      throw new Error("No playable tracks were found.");
    }

    const isPlaylist = isUrl && (
      Boolean(payload.playlist_title) ||
      (Array.isArray(payload.entries) && payload.entries.length > 1) ||
      (payload._type === "playlist" && tracks.length > 1)
    );

    return {
      tracks,
      playlistName: isPlaylist
        ? (payload.playlist_title ?? payload.title ?? "Playlist")
        : undefined,
    };
  }

  private toTrack(entry: YtDlpEntry, requesterId: string): MusicTrack | null {
    const url = entry.webpage_url ?? entry.original_url ?? entry.url;
    const title = entry.title ?? entry.fulltitle;
    if (!url || !title) return null;

    const durationMs = Math.max(0, Math.round((entry.duration ?? 0) * 1000));
    if (config.music.maxTrackDurationMs > 0 && durationMs > config.music.maxTrackDurationMs) return null;

    return {
      id: entry.id ?? url,
      url,
      title,
      author: entry.artist ?? entry.uploader ?? entry.channel ?? "Unknown artist",
      durationMs,
      thumbnail: entry.thumbnail,
      requesterId,
    };
  }
}
