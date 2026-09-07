import { youtubeDl } from "youtube-dl-exec";
import config from "../../../Configs/config.js";
import { env } from "../../utilities/env.js";
import { getCookiesPath } from "../../helpers/cookieHelper.js";
import Logger from "../../helpers/Logger.js";
import type { MusicSource, MusicTrack, ResolveResult } from "./types.js";

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
  extractor?: string;
  extractor_key?: string;
  entries?: YtDlpEntry[];
  playlist_title?: string;
  title_requested?: string;
};

export default class YtDlpResolver {
  async resolve(
    input: string,
    requesterId: string,
    preferredSource: MusicSource = "auto",
  ): Promise<ResolveResult> {
    let query = input.trim();
    if (!query) throw new Error("Provide a song name or media URL.");

    let source: MusicSource = preferredSource;

    // Detect explicit source prefix
    if (/^(?:sc|soundcloud):\s*/i.test(query)) {
      source = "soundcloud";
      query = query.replace(/^(?:sc|soundcloud):\s*/i, "").trim();
    } else if (/^(?:yt|youtube):\s*/i.test(query)) {
      source = "youtube";
      query = query.replace(/^(?:yt|youtube):\s*/i, "").trim();
    } else if (/^(?:bc|bandcamp):\s*/i.test(query)) {
      source = "bandcamp";
      query = query.replace(/^(?:bc|bandcamp):\s*/i, "").trim();
    }

    if (!query) throw new Error("Provide a song name or search query after the prefix.");

    const isUrl = /^https?:\/\//i.test(query);

    if (isUrl) {
      const url = new URL(query);
      // Handle Spotify URLs: Extract track title/artist via oEmbed + OpenGraph
      if (url.hostname === "open.spotify.com" || url.hostname.endsWith(".spotify.com")) {
        const metadata = await this.resolveSpotifyMetadata(query);
        if (!metadata) {
          throw new Error("Could not extract Spotify track metadata. Search by song title instead.");
        }
        const searchQuery = `${metadata.title} ${metadata.artist || ""}`.trim();
        const resolved = await this.resolveTrackSearch(searchQuery, requesterId, "auto");
        for (const track of resolved.tracks) {
          track.source = "spotify";
          if (metadata.thumbnail) track.thumbnail = metadata.thumbnail;
        }
        resolved.source = "spotify";
        return resolved;
      }

      // Direct URL resolution (YouTube, SoundCloud, Bandcamp, raw stream, etc.)
      return this.resolveUrl(query, requesterId);
    }

    // Text search query resolution with multi-tier fallback
    return this.resolveTrackSearch(query, requesterId, source);
  }

  private async resolveUrl(url: string, requesterId: string): Promise<ResolveResult> {
    const cookiesPath = getCookiesPath();
    const options: Record<string, unknown> = {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
      jsRuntimes: "node",
      playlistEnd: config.music.maxPlaylistSize,
      socketTimeout: 20,
      ...(cookiesPath
        ? { cookies: cookiesPath }
        : { extractorArgs: "youtube:player_client=ios,android,mweb;player_skip=webpage" }),
    };

    let payload: YtDlpEntry;
    try {
      payload = await (youtubeDl as (target: string, flags?: Record<string, unknown>) => Promise<unknown>)(
        url,
        options,
      ) as YtDlpEntry;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      // If YouTube URL fails with bot verification and we can extract the title from oEmbed
      if (/Sign in to confirm you're not a bot|bot.*authentication|HTTP Error 403/i.test(errMsg) && /youtube\.com|youtu\.be/i.test(url)) {
        Logger.warn(`YouTube bot check triggered for URL ${url}. Attempting oEmbed title fallback.`);
        try {
          const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
          const resp = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(5000) });
          if (resp.ok) {
            const data = await resp.json() as { title?: string; author_name?: string };
            if (data.title) {
              const query = `${data.title} ${data.author_name || ""}`.trim();
              Logger.info(`Successfully recovered YouTube URL title "${data.title}". Falling back to multi-source search.`);
              const fallbackRes = await this.resolveTrackSearch(query, requesterId, "auto");
              if (fallbackRes.tracks.length > 0) {
                return fallbackRes;
              }
            }
          }
        } catch (fallbackErr) {
          Logger.warn("Failed to recover title via YouTube oEmbed", fallbackErr);
        }
      }
      throw err;
    }

    const detectedSource = this.detectSource(url, payload.extractor);
    return this.processEntries(payload, requesterId, true, detectedSource);
  }

  private async resolveTrackSearch(
    query: string,
    requesterId: string,
    source: MusicSource,
  ): Promise<ResolveResult> {
    const cookiesPath = getCookiesPath();
    const defaultOptions: Record<string, unknown> = {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
      jsRuntimes: "node",
      socketTimeout: 20,
      ...(cookiesPath
        ? { cookies: cookiesPath }
        : { extractorArgs: "youtube:player_client=ios,android,mweb;player_skip=webpage" }),
    };

    // 1. Explicit SoundCloud search
    if (source === "soundcloud") {
      const payload = await (youtubeDl as (target: string, flags?: Record<string, unknown>) => Promise<unknown>)(
        `scsearch1:${query}`,
        defaultOptions,
      ) as YtDlpEntry;
      return this.processEntries(payload, requesterId, false, "soundcloud");
    }

    // 2. Explicit Bandcamp search
    if (source === "bandcamp") {
      const bandcampUrl = await this.searchBandcampUrl(query);
      if (!bandcampUrl) {
        throw new Error(`No Bandcamp results found for "${query}".`);
      }
      return this.resolveUrl(bandcampUrl, requesterId);
    }

    // 3. YouTube search (explicit)
    if (source === "youtube") {
      const fastApiResult = await this.resolveYouTubeDataApi(query, requesterId);
      if (fastApiResult && fastApiResult.tracks.length > 0) {
        return fastApiResult;
      }
      const payload = await (youtubeDl as (target: string, flags?: Record<string, unknown>) => Promise<unknown>)(
        `ytsearch1:${query}`,
        defaultOptions,
      ) as YtDlpEntry;
      return this.processEntries(payload, requesterId, false, "youtube");
    }

    // 4. "auto" Mode: Fast YouTube API -> yt-dlp YouTube -> SoundCloud -> Bandcamp
    const fastApiResult = await this.resolveYouTubeDataApi(query, requesterId);
    if (fastApiResult && fastApiResult.tracks.length > 0) {
      return fastApiResult;
    }

    try {
      const payload = await (youtubeDl as (target: string, flags?: Record<string, unknown>) => Promise<unknown>)(
        `ytsearch1:${query}`,
        defaultOptions,
      ) as YtDlpEntry;

      const result = this.processEntries(payload, requesterId, false, "youtube");
      if (result.tracks.length > 0) return result;
    } catch (err: unknown) {
      Logger.warn(`YouTube search failed for "${query}". Triggering SoundCloud fallback.`, err);
    }

    // Fallback tier 1: SoundCloud
    try {
      const payload = await (youtubeDl as (target: string, flags?: Record<string, unknown>) => Promise<unknown>)(
        `scsearch1:${query}`,
        defaultOptions,
      ) as YtDlpEntry;
      const result = this.processEntries(payload, requesterId, false, "soundcloud");
      if (result.tracks.length > 0) {
        Logger.info(`Successfully resolved "${query}" via SoundCloud fallback.`);
        return result;
      }
    } catch (scErr: unknown) {
      Logger.warn(`SoundCloud fallback failed for "${query}".`, scErr);
    }

    // Fallback tier 2: Bandcamp
    try {
      const bandcampUrl = await this.searchBandcampUrl(query);
      if (bandcampUrl) {
        const result = await this.resolveUrl(bandcampUrl, requesterId);
        if (result.tracks.length > 0) {
          Logger.info(`Successfully resolved "${query}" via Bandcamp fallback.`);
          return result;
        }
      }
    } catch (bcErr: unknown) {
      Logger.warn(`Bandcamp fallback failed for "${query}".`, bcErr);
    }

    throw new Error(`No playable tracks were found across YouTube, SoundCloud, or Bandcamp for "${query}".`);
  }

  private async resolveYouTubeDataApi(query: string, requesterId: string): Promise<ResolveResult | null> {
    if (env.ENVIRONMENT === "test") return null;
    const apiKey = env.YT_API_KEY || env.YOUTUBE_API_KEY;
    if (!apiKey) return null;

    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${apiKey}`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
      if (!searchRes.ok) {
        Logger.warn(`YouTube Data API search returned HTTP ${searchRes.status}`);
        return null;
      }
      const searchData = await searchRes.json() as {
        items?: Array<{
          id?: { videoId?: string };
          snippet?: {
            title?: string;
            channelTitle?: string;
            thumbnails?: { high?: { url?: string }; default?: { url?: string } };
          };
        }>;
      };

      const item = searchData.items?.[0];
      const videoId = item?.id?.videoId;
      if (!videoId) return null;

      let durationMs = 0;
      try {
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`;
        const videoRes = await fetch(videoUrl, { signal: AbortSignal.timeout(4000) });
        if (videoRes.ok) {
          const videoData = await videoRes.json() as {
            items?: Array<{ contentDetails?: { duration?: string } }>;
          };
          const isoDuration = videoData.items?.[0]?.contentDetails?.duration;
          if (isoDuration) {
            durationMs = this.parseIsoDuration(isoDuration);
          }
        }
      } catch { }

      const track: MusicTrack = {
        id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: item.snippet?.title || "Unknown Title",
        author: item.snippet?.channelTitle || "YouTube",
        durationMs,
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
        requesterId,
        source: "youtube",
      };

      return {
        tracks: [track],
        source: "youtube",
      };
    } catch (err) {
      Logger.warn("YouTube Data API lookup failed; falling back to yt-dlp", err);
      return null;
    }
  }

  private parseIsoDuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  /**
   * Performs an instantaneous live fallback lookup on SoundCloud for a given track title/author.
   * Used by GuildPlayer when a YouTube stream gets blocked on datacenter IPs during playback.
   */
  async findSoundCloudFallback(
    title: string,
    author?: string,
    requesterId = "system",
  ): Promise<MusicTrack | null> {
    const cleanTitle = title.replace(/[\(\[\{].*?[\)\]\}]/g, "").trim();
    const query = `${cleanTitle} ${author ?? ""}`.trim();
    try {
      const payload = await (youtubeDl as (target: string, flags?: Record<string, unknown>) => Promise<unknown>)(
        `scsearch1:${query}`,
        {
          dumpSingleJson: true,
          skipDownload: true,
          noWarnings: true,
          socketTimeout: 15,
        },
      ) as YtDlpEntry;
      const res = this.processEntries(payload, requesterId, false, "soundcloud");
      return res.tracks[0] ?? null;
    } catch (error) {
      Logger.error(`SoundCloud fallback search error for ${title}`, error);
      return null;
    }
  }

  private async resolveSpotifyMetadata(url: string): Promise<{ title: string; artist?: string; thumbnail?: string } | null> {
    try {
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
      const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
      if (!oembedRes.ok) return null;
      const data = await oembedRes.json() as { title?: string; thumbnail_url?: string };
      if (!data.title) return null;

      let artist: string | undefined;
      try {
        const pageRes = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0)" },
          signal: AbortSignal.timeout(4000),
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
          if (descMatch?.[1]) {
            artist = descMatch[1].split("·")[0]?.trim();
          }
        }
      } catch {
        // Continue with oEmbed data only
      }

      return {
        title: data.title,
        artist,
        thumbnail: data.thumbnail_url,
      };
    } catch {
      return null;
    }
  }

  private async searchBandcampUrl(query: string): Promise<string | null> {
    try {
      const searchUrl = `https://bandcamp.com/api/fuzzysearch/2/app_autocomplete?q=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PixD/1.0)" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json() as { results?: Array<{ type: string; url?: string }> };
      const item = data.results?.find((r) => r.type === "t" || r.type === "a");
      if (!item?.url) return null;

      // Handle duplicate protocol artifact in Bandcamp API (e.g. https://...https://...)
      const cleanUrl = item.url.replace(/^https?:\/\/[^/]+(https?:\/\/)/, "$1");
      return cleanUrl;
    } catch {
      return null;
    }
  }

  private detectSource(url: string, extractor?: string): MusicSource {
    if (extractor) {
      if (/soundcloud/i.test(extractor)) return "soundcloud";
      if (/youtube/i.test(extractor)) return "youtube";
      if (/bandcamp/i.test(extractor)) return "bandcamp";
    }
    if (/soundcloud\.com/i.test(url)) return "soundcloud";
    if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
    if (/bandcamp\.com/i.test(url)) return "bandcamp";
    return "custom";
  }

  private processEntries(
    payload: YtDlpEntry,
    requesterId: string,
    isUrl: boolean,
    source: MusicSource = "custom",
  ): ResolveResult {
    const entries = payload.entries?.length ? payload.entries : [payload];
    const tracks = entries
      .slice(0, config.music.maxPlaylistSize)
      .map((entry) => this.toTrack(entry, requesterId, source))
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
      source,
    };
  }

  private toTrack(
    entry: YtDlpEntry,
    requesterId: string,
    sourceOverride?: MusicSource,
  ): MusicTrack | null {
    const url = entry.webpage_url ?? entry.original_url ?? entry.url;
    const title = entry.title ?? entry.fulltitle;
    if (!url || !title) return null;

    const durationMs = Math.max(0, Math.round((entry.duration ?? 0) * 1000));
    if (config.music.maxTrackDurationMs > 0 && durationMs > config.music.maxTrackDurationMs) return null;

    const source = sourceOverride ?? this.detectSource(url, entry.extractor ?? entry.extractor_key);

    return {
      id: entry.id ?? url,
      url,
      title,
      author: entry.artist ?? entry.uploader ?? entry.channel ?? "Unknown artist",
      durationMs,
      thumbnail: entry.thumbnail,
      requesterId,
      source,
    };
  }
}
