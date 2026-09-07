import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";
import { env } from "../../utilities/env.js";

export default new HybridCommand({
  name: "lyrics",
  description: "Find lyrics for the current track.",
  guildOnly: true,
  execute: (context) => replyWithError(context, async () => {
    const track = requirePlayer(context).current;
    if (!track) throw new Error("Nothing is currently playing.");

    let songTitle = track.title;
    let songArtist = track.author;
    let geniusUrl: string | undefined = undefined;
    let thumbnail: string | undefined = track.thumbnail;

    // 1. Query Genius API for verified metadata and album art if configured
    if (env.GENIUS_ACCESS_TOKEN) {
      try {
        const geniusRes = await fetch(
          `https://api.genius.com/search?q=${encodeURIComponent(`${songArtist} ${songTitle}`)}`,
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

    // 2. Fetch lyrics from LRCLIB first, then fallback to Popcat
    let lyrics: string | null = null;
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

    if (!lyrics) {
      try {
        const popcatRes = await fetch(
          `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(`${songArtist} ${songTitle}`)}`,
          { signal: AbortSignal.timeout(4000) },
        );
        if (popcatRes.ok) {
          const popcatData = await popcatRes.json() as { lyrics?: string };
          if (popcatData.lyrics && popcatData.lyrics.trim()) {
            lyrics = popcatData.lyrics.trim();
          }
        }
      } catch { }
    }

    if (!lyrics) throw new Error("Lyrics could not be found.");

    const chunks = lyrics.match(/[\s\S]{1,3900}/g) ?? [];
    const firstChunk = chunks.shift();
    await context.reply({
      embeds: [{
        title: geniusUrl ? `🎶 [${songTitle}](${geniusUrl})` : `🎶 ${songTitle}`,
        author: { name: songArtist },
        description: firstChunk,
        thumbnail: thumbnail ? { url: thumbnail } : undefined,
        color: context.raw.client.color,
      }],
    });
    for (const chunk of chunks) {
      await context.followUp({
        embeds: [{ description: chunk, color: context.raw.client.color }],
      });
    }
  }),
});
