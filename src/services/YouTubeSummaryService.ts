import { GoogleGenAI } from "@google/genai";
import { youtubeDl } from "youtube-dl-exec";
import { env } from "../utilities/env.js";
import { getCookiesPath } from "../helpers/cookieHelper.js";

interface VideoMetadata { id: string; title: string; description: string; channel: string; thumbnail: string }
interface SummaryResult { summary: string; title: string; thumbnail: string }

export async function summarizeYouTubeVideo(url: string, language = "en"): Promise<SummaryResult> {
  if (!env.GOOGLEAI_KEY) throw new Error("YouTube summaries are not configured.");
  const id = extractVideoId(url);
  if (!id) throw new Error("Provide a valid YouTube video URL.");
  const [metadata, subtitles] = await Promise.all([getMetadata(url, id), getSubtitles(id, language)]);
  if (!subtitles) throw new Error("No subtitles are available for this video.");

  const prompt = [
    "Summarize this YouTube video in 10 to 15 clear, easy-to-read points. Preserve important facts and context.",
    `Title: ${metadata.title}`,
    `Channel: ${metadata.channel}`,
    `Description: ${metadata.description}`,
    "Transcript:",
    subtitles.slice(0, 500_000),
  ].join("\n");
  const ai = new GoogleGenAI({ apiKey: env.GOOGLEAI_KEY });
  const response = await ai.models.generateContent({ model: env.GOOGLEAI_MODEL, contents: prompt });
  const summary = response.text?.trim();
  if (!summary) throw new Error("The summary model returned an empty response.");
  return { summary, title: metadata.title, thumbnail: metadata.thumbnail };
}

async function getMetadata(url: string, id: string): Promise<VideoMetadata> {
  const cookiesPath = getCookiesPath();
  const options: Record<string, unknown> = {
    dumpSingleJson: true,
    skipDownload: true,
    noWarnings: true,
    extractorArgs: "youtube:player_client=ios,android,mweb;player_skip=webpage",
    ...(cookiesPath ? { cookies: cookiesPath } : {}),
  };
  const data = await (youtubeDl as (target: string, flags?: Record<string, unknown>) => Promise<unknown>)(
    url,
    options,
  ) as {
    title?: string; description?: string; uploader?: string; channel?: string; thumbnail?: string;
  };
  return {
    id,
    title: data.title ?? `Video ${id}`,
    description: data.description ?? "",
    channel: data.uploader ?? data.channel ?? "Unknown channel",
    thumbnail: data.thumbnail ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

async function getSubtitles(videoId: string, language: string): Promise<string> {
  const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  if (!pageResponse.ok) throw new Error(`YouTube returned HTTP ${pageResponse.status}.`);
  const page = await pageResponse.text();
  const apiKey = page.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  if (!apiKey) throw new Error("Could not access YouTube caption metadata.");
  const playerResponse = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context: { client: { clientName: "WEB", clientVersion: "2.20260101.00.00" } }, videoId }),
  });
  if (!playerResponse.ok) throw new Error(`YouTube captions returned HTTP ${playerResponse.status}.`);
  const player = await playerResponse.json() as any;
  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks as Array<{ languageCode: string; baseUrl: string }> | undefined;
  const track = tracks?.find((item) => item.languageCode === language) ?? tracks?.[0];
  if (!track?.baseUrl) throw new Error(`No captions were found for language '${language}'.`);
  const transcriptResponse = await fetch(track.baseUrl);
  if (!transcriptResponse.ok) throw new Error(`Caption download returned HTTP ${transcriptResponse.status}.`);
  return decodeTranscript(await transcriptResponse.text());
}

export function extractVideoId(value: string): string | null {
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).match(/^[\w-]{11}/)?.[0] ?? null;
    if (url.hostname.endsWith("youtube.com")) {
      return url.searchParams.get("v")?.match(/^[\w-]{11}$/)?.[0]
        ?? url.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})/)?.[1]
        ?? null;
    }
  } catch { return null; }
  return null;
}

function decodeTranscript(xml: string): string {
  const lines = [...xml.matchAll(/<(?:text|s)[^>]*>([\s\S]*?)<\/(?:text|s)>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/&#x([\da-f]+);/gi, (_m, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_m, number) => String.fromCodePoint(Number(number)))
      .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim())
    .filter(Boolean);
  return lines.join("\n");
}
