import { youtubeDl } from "youtube-dl-exec";
import config from "../../../Configs/config.js";
import { env } from "../../utilities/env.js";
import type { MusicTrack, ResolveResult } from "./types.js";

type YtDlpEntry = {
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
    const payload = await youtubeDl(target, {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
      playlistEnd: config.music.maxPlaylistSize,
      socketTimeout: 20,
      ...(env.YT_DLP_COOKIES_PATH ? { cookies: env.YT_DLP_COOKIES_PATH } : {}),
    }) as unknown as YtDlpEntry;

    const entries = payload.entries?.length ? payload.entries : [payload];
    const tracks = entries
      .slice(0, config.music.maxPlaylistSize)
      .map((entry) => this.toTrack(entry, requesterId))
      .filter((track): track is MusicTrack => track !== null);

    if (tracks.length === 0) {
      throw new Error("No playable tracks were found.");
    }

    return {
      tracks,
      playlistName: payload.entries ? payload.title ?? payload.playlist_title : undefined,
    };
  }

  private toTrack(entry: YtDlpEntry, requesterId: string): MusicTrack | null {
    const url = entry.webpage_url ?? entry.original_url ?? entry.url;
    const title = entry.title ?? entry.fulltitle;
    if (!url || !title) return null;

    const durationMs = Math.max(0, Math.round((entry.duration ?? 0) * 1000));
    if (durationMs > config.music.maxTrackDurationMs) return null;

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
