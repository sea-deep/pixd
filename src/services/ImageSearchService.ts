import { Worker } from "node:worker_threads";
import { env } from "../utilities/env.js";

export interface ImageSearchResult {
  title: string;
  url: string;
  originalUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  source: string;
}

export interface ImageSearchOptions {
  limit?: number;
  safeSearch?: boolean;
  timeoutMs?: number;
}

export interface ReverseSearchResult {
  search: string;
  result: ImageSearchResult[];
}

let active = 0;

const WORKER_SCRIPT = `
const { parentPort, workerData } = require('node:worker_threads');

const NOKIA_USER_AGENTS = [
  'Nokia6230/2.0 (05.50) Profile/MIDP-2.0 Configuration/CLDC-1.1',
  'Nokia7610/2.0 (5.0509.0) SymbianOS/7.0s Series60/2.1 Profile/MIDP-2.0 Configuration/CLDC-1.0',
  'Nokia6280/2.0 (03.60) Profile/MIDP-2.0 Configuration/CLDC-1.1',
];

function formatTitle(imgurl, imgrefurl) {
  if (imgrefurl) {
    try {
      const pageUrl = new URL(imgrefurl);
      const segments = pageUrl.pathname.split('/').filter(Boolean);
      let candidate = segments.pop() || '';
      if (/^\\d+$/.test(candidate) && segments.length > 0) {
        candidate = segments.pop() || candidate;
      }
      candidate = candidate
        .replace(/\\.(html?|php|aspx?|jsp)$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();
      if (candidate.length > 2) {
        candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        return candidate + ' · ' + pageUrl.hostname.replace(/^www\\./, '');
      }
      return pageUrl.hostname.replace(/^www\\./, '');
    } catch { }
  }
  try {
    const u = new URL(imgurl);
    const filename = u.pathname.split('/').pop()?.replace(/\\.[^.]+$/, '') || 'Google Image';
    return decodeURIComponent(filename).replace(/[-_]+/g, ' ').slice(0, 100);
  } catch {
    return 'Google Image';
  }
}

function isUnembeddableMedia(url, refUrl) {
  if (!url) return true;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();

    // Direct video formats that Discord embed.image cannot render
    if (/\\.(mp4|webm|mov|m4v|mkv|flv|avi|wmv|ts|m3u8)(\\?|$)/i.test(path)) return true;

    // Video platforms and social media domains with bot-blocking or non-image endpoints
    if (
      host.includes('tiktok.com') ||
      host.includes('byteoversea.com') ||
      host.includes('ibytedtos.com') ||
      host.includes('muscdn.com') ||
      host.includes('tiktokcdn.com') ||
      host.includes('fbsbx.com') ||
      host.includes('facebook.com') ||
      host.includes('fbcdn.net') ||
      host.includes('instagram.com') ||
      host.includes('cdninstagram.com') ||
      host.includes('threads.net') ||
      host.includes('vimeo.com') ||
      host.includes('dailymotion.com') ||
      host.includes('twitch.tv') ||
      host.includes('lookaside')
    ) {
      return true;
    }

    // YouTube video/short URLs (except i.ytimg.com image CDN)
    if ((host.includes('youtube.com') || host.includes('youtu.be')) && !host.includes('ytimg.com')) {
      return true;
    }

    // Web page / document endpoints
    if (/\\.(html?|php|aspx?|jsp)(\\?|$)/i.test(path)) return true;

    // Check refUrl if imgurl lacks an image extension and comes from social media
    if (refUrl) {
      const refHost = new URL(refUrl).hostname.toLowerCase();
      if (
        (refHost.includes('tiktok.com') || refHost.includes('facebook.com') || refHost.includes('instagram.com')) &&
        !/\\.(png|jpe?g|gif|webp|svg|avif)(\\?|$)/i.test(path)
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return true;
  }
}

async function fetchGooglePage(query, safeSearch, start = 0) {
  const ua = NOKIA_USER_AGENTS[Math.floor(Math.random() * NOKIA_USER_AGENTS.length)];
  const url = 'https://www.google.com/search?q=' + encodeURIComponent(query) +
    '&tbm=isch' + (safeSearch ? '&safe=active' : '') + (start > 0 ? '&start=' + start : '');
  const res = await fetch(url, {
    headers: {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error('Google returned HTTP ' + res.status);
  const html = await res.text();
  const matches = [...html.matchAll(/href=\\"(\\/imgres\\?[^\\"]+)\\"/g)].map(m => m[1]);
  const results = [];
  for (const raw of matches) {
    const clean = raw.replace(/&amp;/g, '&');
    try {
      const u = new URL('https://www.google.com' + clean);
      const imgurl = u.searchParams.get('imgurl');
      const imgrefurl = u.searchParams.get('imgrefurl');
      if (!imgurl || !/^https?:/.test(imgurl)) continue;
      const w = parseInt(u.searchParams.get('w') || '0', 10);
      const h = parseInt(u.searchParams.get('h') || '0', 10);
      const tbnid = u.searchParams.get('tbnid');
      const thumbUrl = tbnid ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:' + tbnid : imgurl;
      const displayUrl = isUnembeddableMedia(imgurl, imgrefurl) ? thumbUrl : imgurl;
      results.push({
        title: formatTitle(imgurl, imgrefurl),
        url: displayUrl,
        originalUrl: imgrefurl || imgurl,
        thumbnailUrl: thumbUrl,
        width: Math.max(0, w),
        height: Math.max(0, h),
        source: 'Google Images',
      });
    } catch { }
  }
  return results;
}

async function scrapeGoogle({ search, limit = 250, safeSearch = true }) {
  const pagesNeeded = Math.min(Math.ceil(limit / 20), 4);
  const pagePromises = [];
  for (let i = 0; i < pagesNeeded; i++) {
    pagePromises.push(fetchGooglePage(search, safeSearch, i * 20));
  }
  const pages = await Promise.all(pagePromises);
  const dedupe = new Map();
  for (const page of pages) {
    for (const item of page) {
      if (!dedupe.has(item.url)) {
        dedupe.set(item.url, item);
        if (dedupe.size >= limit) break;
      }
    }
  }
  return { result: [...dedupe.values()] };
}

scrapeGoogle(workerData.options)
  .then(value => parentPort.postMessage({ value }))
  .catch(() => parentPort.postMessage({ failed: true }));
`;

/** Isolate the Google scraper worker so even a hung request/parser can be terminated. */
function scrape(query: string, limit: number, safeSearch: boolean, timeout: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_SCRIPT, {
      eval: true,
      execArgv: [],
      workerData: { options: { search: query, limit, safeSearch } },
    });
    const finish = (error?: Error, value?: unknown) => {
      clearTimeout(timer);
      worker.removeAllListeners();
      void worker.terminate();
      if (error) reject(error); else resolve(value);
    };
    const timer = setTimeout(() => finish(new Error("Image search timed out.")), timeout);
    worker.once("message", (message) => message.failed
      ? finish(new Error("Image provider unavailable.")) : finish(undefined, message.value));
    worker.once("error", () => finish(new Error("Image provider unavailable.")));
    worker.once("exit", () => finish(new Error("Image search stopped unexpectedly.")));
  });
}

export function isUnembeddableMedia(url?: string, refUrl?: string): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();

    // Direct video formats that Discord embed.image cannot render
    if (/\.(mp4|webm|mov|m4v|mkv|flv|avi|wmv|ts|m3u8)(\?|$)/i.test(path)) return true;

    // Video platforms and social media domains with bot-blocking or non-image endpoints
    if (
      host.includes("tiktok.com") ||
      host.includes("byteoversea.com") ||
      host.includes("ibytedtos.com") ||
      host.includes("muscdn.com") ||
      host.includes("tiktokcdn.com") ||
      host.includes("fbsbx.com") ||
      host.includes("facebook.com") ||
      host.includes("fbcdn.net") ||
      host.includes("instagram.com") ||
      host.includes("cdninstagram.com") ||
      host.includes("threads.net") ||
      host.includes("vimeo.com") ||
      host.includes("dailymotion.com") ||
      host.includes("twitch.tv") ||
      host.includes("lookaside")
    ) {
      return true;
    }

    // YouTube video/short URLs (except i.ytimg.com image CDN)
    if ((host.includes("youtube.com") || host.includes("youtu.be")) && !host.includes("ytimg.com")) {
      return true;
    }

    // Web page / document endpoints
    if (/\.(html?|php|aspx?|jsp)(\?|$)/i.test(path)) return true;

    // Check refUrl if imgurl lacks an image extension and comes from social media
    if (refUrl) {
      const refHost = new URL(refUrl).hostname.toLowerCase();
      if (
        (refHost.includes("tiktok.com") || refHost.includes("facebook.com") || refHost.includes("instagram.com")) &&
        !/\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(path)
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return true;
  }
}

export function normalizeImages(response: unknown, limit: number): ImageSearchResult[] {
  const items = (response as { result?: unknown[] } | null)?.result;
  if (!Array.isArray(items)) throw new Error("Invalid image search response.");
  const results = new Map<string, ImageSearchResult>();
  for (const record of items) {
    try {
      const item = record as Record<string, unknown>;
      const image = new URL(String(item.url));
      const page = new URL(String(item.originalUrl || item.url));
      if (!/^https?:$/.test(image.protocol) || !/^https?:$/.test(page.protocol)) continue;
      const thumbUrl = item.thumbnailUrl ? String(item.thumbnailUrl) : image.href;
      const displayUrl = isUnembeddableMedia(image.href, page.href) ? thumbUrl : image.href;
      results.set(displayUrl, {
        title: String(item.title || page.hostname).slice(0, 250),
        url: displayUrl,
        originalUrl: page.href,
        thumbnailUrl: thumbUrl,
        source: "Google Images",
        width: Math.max(0, Number(item.width) || 0),
        height: Math.max(0, Number(item.height) || 0),
      });
      if (results.size >= limit) break;
    } catch { /* Ignore malformed individual records. */ }
  }
  return [...results.values()];
}

export async function searchImages(query: string, options: ImageSearchOptions = {}): Promise<ImageSearchResult[]> {
  query = query.trim();
  if (!query) throw new Error("Image search query cannot be empty.");
  if (query.length > 300) throw new Error("Keep image searches under 300 characters.");
  if (active >= 2) throw new Error("Image search is busy. Please try again shortly.");
  const limit = Number.isFinite(options.limit) ? Math.min(300, Math.max(1, Math.floor(options.limit!))) : 250;
  const timeout = Number.isFinite(options.timeoutMs) ? Math.min(15_000, Math.max(100, options.timeoutMs!)) : 10_000;
  active++;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return normalizeImages(await scrape(query, limit, options.safeSearch !== false, timeout), limit);
      } catch {
        if (attempt === 1) throw new Error("Google image search is temporarily unavailable or blocked. Please try again later.");
      }
    }
    return [];
  } finally { active--; }
}

export async function reverseImageSearch(imageUrl: string, options: { limit?: number } = {}): Promise<ReverseSearchResult> {
  const limit = options.limit ?? 5;
  let query = "";

  if (env.GOOGLEAI_KEY) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: env.GOOGLEAI_KEY });
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const mimeType = imgRes.headers.get("content-type")?.split(";")[0] || "image/jpeg";
        const res = await ai.models.generateContent({
          model: env.GOOGLEAI_MODEL || "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: buf.toString("base64") } },
                { text: "Identify the main subject in this image in 1 to 4 keywords suitable for a Google search query. Reply with ONLY the search keywords." },
              ],
            },
          ],
        });
        const detected = res.text?.trim();
        if (detected && detected.length < 100) {
          query = detected;
        }
      }
    } catch {
      // Fall through to query inference
    }
  }

  if (!query) {
    try {
      const u = new URL(imageUrl);
      const filename = u.pathname.split("/").pop()?.replace(/\.[^.]+$/, "");
      if (filename) {
        const candidate = decodeURIComponent(filename).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
        if (candidate.length >= 3 && !/^\d+$/.test(candidate)) {
          query = candidate;
        }
      }
    } catch { }
  }

  if (!query) {
    throw new Error("Could not determine search query for image.");
  }

  const results = await searchImages(query, { limit });
  return {
    search: query,
    result: results,
  };
}

export { reverseImageSearch as GOOGLE_IMG_INVERSE_ENGINE_URL };
