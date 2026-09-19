import { env } from "../../utilities/env.js";

export interface LyricsResult {
  title: string;
  artist?: string;
  lyrics: string;
  geniusUrl?: string;
  thumbnail?: string;
}

interface CachedLyricsData extends LyricsResult {
  expiresAt: number;
}

const lyricsCache = new Map<string, CachedLyricsData>();

/**
 * Stores a lyrics result in memory for interactive button lookups.
 * Returns an 8-character cache identifier.
 */
export function cacheLyrics(result: LyricsResult): string {
  const id = Math.random().toString(36).slice(2, 10);
  lyricsCache.set(id, {
    ...result,
    expiresAt: Date.now() + 1000 * 60 * 60 * 2, // 2-hour TTL
  });

  // Prune expired entries if the cache grows
  if (lyricsCache.size > 200) {
    const now = Date.now();
    for (const [key, item] of lyricsCache.entries()) {
      if (item.expiresAt < now) lyricsCache.delete(key);
    }
  }

  return id;
}

/**
 * Retrieves cached lyrics by ID if still valid.
 */
export function getCachedLyrics(id: string): LyricsResult | null {
  const item = lyricsCache.get(id);
  if (!item) return null;
  if (item.expiresAt < Date.now()) {
    lyricsCache.delete(id);
    return null;
  }
  return item;
}

/**
 * Formats raw lyrics into clean Discord markdown with blockquotes and stanza spacing.
 */
export function formatLyrics(rawLyrics: string): string {
  const normalized = rawLyrics.replace(/\r\n/g, "\n").trim();
  const stanzas = normalized.split(/\n{2,}/);

  return stanzas
    .map((stanza) => {
      const lines = stanza.split("\n").map((l) => l.trim()).filter(Boolean);
      return lines
        .map((line) => {
          if (/^\[.*\]$/.test(line)) {
            return `**${line}**`;
          }
          return `> ${line}`;
        })
        .join("\n");
    })
    .join("\n\n");
}

/**
 * Splits formatted lyrics into chunks that respect Discord's embed character limits,
 * preserving whole stanzas whenever possible.
 */
export function chunkLyrics(lyrics: string, maxLen = 3900): string[] {
  if (lyrics.length <= maxLen) return [lyrics];

  const stanzas = lyrics.split("\n\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const stanza of stanzas) {
    if ((currentChunk + "\n\n" + stanza).trim().length > maxLen) {
      if (currentChunk) chunks.push(currentChunk.trim());
      if (stanza.length > maxLen) {
        const lines = stanza.split("\n");
        currentChunk = "";
        for (const line of lines) {
          if ((currentChunk + "\n" + line).trim().length > maxLen) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = line;
          } else {
            currentChunk = currentChunk ? `${currentChunk}\n${line}` : line;
          }
        }
      } else {
        currentChunk = stanza;
      }
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${stanza}` : stanza;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Resolves song lyrics across Genius, LRCLIB, and Popcat.
 * Can be queried with a song title/search phrase or with explicit artist and title.
 */
export async function fetchLyrics(query: string, artist?: string): Promise<LyricsResult | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  let songTitle = cleanQuery;
  let songArtist = artist?.trim() || "";
  let geniusUrl: string | undefined;
  let thumbnail: string | undefined;

  // 1. Query Genius API for verified metadata and album art if configured
  if (env.GENIUS_ACCESS_TOKEN) {
    try {
      const q = songArtist ? `${songArtist} ${songTitle}` : songTitle;
      const geniusRes = await fetch(
        `https://api.genius.com/search?q=${encodeURIComponent(q)}`,
        {
          headers: { Authorization: `Bearer ${env.GENIUS_ACCESS_TOKEN}` },
          signal: AbortSignal.timeout(4000),
        },
      );
      if (geniusRes.ok) {
        const geniusData = await geniusRes.json() as {
          response?: {
            hits?: Array<{
              result?: {
                title?: string;
                url?: string;
                song_art_image_thumbnail_url?: string;
                primary_artist?: { name?: string };
              };
            }>;
          };
        };
        const hit = geniusData.response?.hits?.[0]?.result;
        if (hit) {
          if (hit.title) songTitle = hit.title;
          if (hit.primary_artist?.name) songArtist = hit.primary_artist.name;
          if (hit.url) geniusUrl = hit.url;
          if (hit.song_art_image_thumbnail_url) thumbnail = hit.song_art_image_thumbnail_url;
        }
      }
    } catch { }
  }

  // If artist was not found via Genius, check if query contains " - "
  if (!songArtist && cleanQuery.includes(" - ")) {
    const [artistPart, ...titleParts] = cleanQuery.split(" - ");
    if (artistPart.trim() && titleParts.join(" - ").trim()) {
      songArtist = artistPart.trim();
      songTitle = titleParts.join(" - ").trim();
    }
  }

  let lyrics: string | null = null;

  // 2. Fetch from LRCLIB direct get if title and artist are known
  if (songTitle && songArtist) {
    try {
      const lrcRes = await fetch(
        `https://lrclib.net/api/get?track_name=${encodeURIComponent(songTitle)}&artist_name=${encodeURIComponent(songArtist)}`,
        { signal: AbortSignal.timeout(4000) },
      );
      if (lrcRes.ok) {
        const lrcData = await lrcRes.json() as { plainLyrics?: string };
        if (lrcData.plainLyrics && lrcData.plainLyrics.trim()) {
          lyrics = lrcData.plainLyrics.trim();
        }
      }
    } catch { }
  }

  // 3. Fallback to LRCLIB search
  if (!lyrics) {
    try {
      const q = songArtist ? `${songArtist} ${songTitle}` : songTitle;
      const lrcSearchRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`,
        { signal: AbortSignal.timeout(4000) },
      );
      if (lrcSearchRes.ok) {
        const list = await lrcSearchRes.json() as Array<{
          trackName?: string;
          artistName?: string;
          plainLyrics?: string;
        }>;
        if (Array.isArray(list)) {
          const match = list.find((x) => x.plainLyrics && x.plainLyrics.trim());
          if (match) {
            lyrics = match.plainLyrics!.trim();
            if (!songTitle || songTitle === cleanQuery) songTitle = match.trackName || songTitle;
            if (!songArtist) songArtist = match.artistName || songArtist;
          }
        }
      }
    } catch { }
  }

  // 4. Fallback to Popcat
  if (!lyrics) {
    try {
      const q = songArtist ? `${songArtist} ${songTitle}` : songTitle;
      const popcatRes = await fetch(
        `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(q)}`,
        { signal: AbortSignal.timeout(4000) },
      );
      if (popcatRes.ok) {
        const popcatData = await popcatRes.json() as {
          lyrics?: string;
          title?: string;
          artist?: string;
          image?: string;
        };
        if (popcatData.lyrics && popcatData.lyrics.trim()) {
          lyrics = popcatData.lyrics.trim();
          if (popcatData.title && (!songTitle || songTitle === cleanQuery)) songTitle = popcatData.title;
          if (popcatData.artist && !songArtist) songArtist = popcatData.artist;
          if (popcatData.image && !thumbnail) thumbnail = popcatData.image;
        }
      }
    } catch { }
  }

  if (!lyrics) return null;

  return {
    title: songTitle,
    artist: songArtist || undefined,
    lyrics,
    geniusUrl,
    thumbnail,
  };
}
