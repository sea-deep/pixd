import { Worker } from "node:worker_threads";
import { createRequire } from "node:module";

export interface ImageSearchResult {
  title: string; url: string; originalUrl: string; thumbnailUrl: string;
  width: number; height: number; source: string;
}
export interface ImageSearchOptions { limit?: number; safeSearch?: boolean; timeoutMs?: number }
const library = createRequire(import.meta.url).resolve("google-img-scrap");
let active = 0;

/** Isolate the legacy scraper so even a hung request/parser can be terminated. */
function scrape(query: string, limit: number, safeSearch: boolean, timeout: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      const { GOOGLE_IMG_SCRAP } = require(workerData.library);
      GOOGLE_IMG_SCRAP(workerData.options).then(
        value => parentPort.postMessage({ value }),
        () => parentPort.postMessage({ failed: true })
      );
    `, { eval: true, execArgv: [], workerData: { library, options: { search: query, limit, safeSearch } } });
    const finish = (error?: Error, value?: unknown) => {
      clearTimeout(timer);
      worker.removeAllListeners();
      void worker.terminate();
      if (error) reject(error); else resolve(value);
    };
    const timer = setTimeout(() => finish(new Error("Image search timed out.")), timeout);
    worker.once("message", message => message.failed
      ? finish(new Error("Image provider unavailable.")) : finish(undefined, message.value));
    worker.once("error", () => finish(new Error("Image provider unavailable.")));
    worker.once("exit", () => finish(new Error("Image search stopped unexpectedly.")));
  });
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
      results.set(image.href, {
        title: String(item.title || page.hostname).slice(0, 250), url: image.href,
        originalUrl: page.href, thumbnailUrl: image.href, source: "Google Images",
        width: Math.max(0, Number(item.width) || 0), height: Math.max(0, Number(item.height) || 0),
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
