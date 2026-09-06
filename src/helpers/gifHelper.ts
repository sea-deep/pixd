import sharp from "sharp";
import axios from "axios";
import * as cheerio from "cheerio";
import { spawn } from "child_process";

export interface ImageMetadataInfo {
  isAnimated: boolean;
  format?: string;
  pages: number;
  pageHeight: number;
  width: number;
  height: number;
  delay: number[];
  normalizedBuffer?: Buffer;
}

export interface ExtractedFrames {
  frames: Buffer[];
  delay: number[];
  width: number;
  height: number;
  isAnimated: boolean;
}

/**
 * Recursively unwraps any nested target media URL found in query parameters
 * (e.g. `?url=https://...`, `?src=https://...`, `?img=https://...`).
 * Completely domain-agnostic; handles any converter, proxy, or redirector.
 */
export function unwrapNestedMediaUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  let currentUrl = rawUrl.trim();

  for (let depth = 0; depth < 5; depth++) {
    try {
      const parsed = new URL(currentUrl);
      let foundNested: string | null = null;
      const candidateKeys = ["url", "src", "img", "image", "media", "file", "target", "link"];
      for (const key of candidateKeys) {
        const val = parsed.searchParams.get(key);
        if (val && /^https?:\/\//i.test(val)) {
          foundNested = val;
          break;
        }
      }

      if (!foundNested) {
        for (const val of parsed.searchParams.values()) {
          if (/^https?:\/\//i.test(val)) {
            foundNested = val;
            break;
          }
        }
      }

      if (foundNested && foundNested !== currentUrl) {
        currentUrl = foundNested;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return currentUrl;
}

const DIRECT_MEDIA_EXT_REGEX = /\.(?:png|jpe?g|gif|webp|avif|mp4|webm|mov|mkv|bmp|tiff?)(?:\?.*)?$/i;

/**
 * Resolves Tenor, Giphy, Discord embeds, proxies, or general webpage URLs into direct image / video URLs.
 * Uses domain-agnostic query-param unwrapping, HTTP Content-Type inspection, and OpenGraph / Twitter metadata parsing.
 */
export async function resolveMediaUrl(rawUrl: string): Promise<string> {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  const unwrapped = unwrapNestedMediaUrl(rawUrl);

  // If already a direct media URL by extension
  if (DIRECT_MEDIA_EXT_REGEX.test(unwrapped)) {
    return unwrapped;
  }

  try {
    const response = await axios.get(unwrapped, {
      timeout: 5000,
      maxRedirects: 5,
      responseType: "stream",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      },
    });

    const rawContentType = response.headers["content-type"];
    const contentType = typeof rawContentType === "string" ? rawContentType.toLowerCase() : "";
    const finalUrl = response.request?.res?.responseUrl || unwrapped;

    // If HTTP headers indicate direct media (image or video), return the URL
    if (contentType.startsWith("image/") || contentType.startsWith("video/")) {
      response.data.destroy();
      return unwrapNestedMediaUrl(finalUrl);
    }

    // Otherwise, read HTML head to extract OpenGraph / Twitter / HTML refresh tags
    const chunks: Buffer[] = [];
    let bytesRead = 0;
    for await (const chunk of response.data) {
      chunks.push(chunk);
      bytesRead += chunk.length;
      if (bytesRead >= 65536) break;
    }
    response.data.destroy();

    const html = Buffer.concat(chunks).toString("utf-8");
    const $ = cheerio.load(html);

    // Check for client-side HTML meta refresh
    const metaRefresh = $('meta[http-equiv="refresh"]').attr("content");
    if (metaRefresh) {
      const match = metaRefresh.match(/url=(https?:\/\/[^\s;'"]+)/i);
      if (match && match[1] && match[1] !== unwrapped) {
        return resolveMediaUrl(match[1]);
      }
    }

    // Extract OpenGraph / Twitter media in priority order
    const meta =
      $('meta[property="og:video"]').attr("content") ||
      $('meta[property="og:video:url"]').attr("content") ||
      $('meta[property="og:video:secure_url"]').attr("content") ||
      $('meta[name="twitter:player:stream"]').attr("content") ||
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content") ||
      $('meta[property="og:image:secure_url"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[name="twitter:image:src"]').attr("content");

    if (meta && /^https?:\/\//i.test(meta)) {
      return unwrapNestedMediaUrl(meta);
    }

    return unwrapNestedMediaUrl(finalUrl);
  } catch {
    // Fail silently to the unwrapped URL if web request fails
    return unwrapped;
  }
}

/**
 * Downloads media from a URL and guarantees it is in a Sharp-supported format.
 */
export async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const raw = Buffer.from(await res.arrayBuffer());
    return await ensureSupportedImageBuffer(raw);
  } catch {
    return null;
  }
}

/**
 * Ensures an image buffer is supported by Sharp.
 * If the buffer is an animated AVIF or video (e.g. MP4) that Sharp cannot decode,
 * transcodes it into a standard animated GIF buffer using ffmpeg.
 */
export async function ensureSupportedImageBuffer(buffer: Buffer): Promise<Buffer> {
  try {
    await sharp(buffer, { animated: true }).metadata();
    return buffer;
  } catch (err: any) {
    if (
      err?.message?.includes("unsupported image format") ||
      err?.message?.includes("Input buffer contains unsupported image format")
    ) {
      try {
        return await new Promise<Buffer>((resolve, reject) => {
          const p = spawn("ffmpeg", [
            "-i", "pipe:0",
            "-vf", "fps=20,scale=min(540\\,iw):-1:flags=fast_bilinear",
            "-f", "gif",
            "pipe:1",
          ]);
          const chunks: Buffer[] = [];
          p.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
          p.on("error", reject);
          p.on("close", (code) => {
            if (code === 0 && chunks.length) {
              resolve(Buffer.concat(chunks));
            } else {
              reject(new Error(`ffmpeg exited with code ${code}`));
            }
          });
          p.stdin.write(buffer);
          p.stdin.end();
        });
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

/**
 * Inspects an image buffer with sharp to detect format, animated state, dimensions, and frame delays.
 */
export async function inspectImage(buffer: Buffer): Promise<ImageMetadataInfo> {
  const supportedBuffer = await ensureSupportedImageBuffer(buffer);
  const meta = await sharp(supportedBuffer, { animated: true }).metadata();
  const pages = meta.pages && meta.pages > 1 ? meta.pages : 1;
  const pageHeight = meta.pageHeight ?? meta.height ?? 0;
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const isAnimated = pages > 1;
  const delay = Array.isArray(meta.delay) && meta.delay.length ? meta.delay : [100];

  return {
    isAnimated,
    format: meta.format,
    pages,
    pageHeight,
    width,
    height,
    delay,
    normalizedBuffer: supportedBuffer,
  };
}

/**
 * Extracts frames from an image buffer.
 * If static, returns [buffer].
 * If animated, samples up to maxFrames evenly and extracts PNG frame buffers.
 */
export async function extractFrames(buffer: Buffer, maxFrames = 30): Promise<ExtractedFrames> {
  const info = await inspectImage(buffer);
  const targetBuffer = info.normalizedBuffer ?? buffer;
  if (!info.isAnimated) {
    return {
      frames: [targetBuffer],
      delay: [100],
      width: info.width,
      height: info.height,
      isAnimated: false,
    };
  }

  const frameCount = Math.min(info.pages, maxFrames);
  const sampleIndices: number[] = [];
  const delays: number[] = [];

  for (let i = 0; i < frameCount; i++) {
    const kStart = Math.floor((i * info.pages) / frameCount);
    const kEnd = Math.floor(((i + 1) * info.pages) / frameCount) - 1;
    sampleIndices.push(kStart);

    let intervalDuration = 0;
    for (let k = kStart; k <= kEnd; k++) {
      const d = info.delay[k] ?? info.delay[0] ?? 100;
      intervalDuration += d > 10 ? d : 100;
    }
    delays.push(intervalDuration);
  }

  const frames = await Promise.all(
    sampleIndices.map((page) => sharp(targetBuffer, { page }).png().toBuffer())
  );

  return {
    frames,
    delay: delays,
    width: info.width,
    height: info.pageHeight,
    isAnimated: true,
  };
}

/**
 * Renders multiple raw RGBA frames into a native animated GIF using Sharp.
 */
export async function renderAnimatedGif(
  rawFrames: Buffer[],
  width: number,
  height: number,
  delay: number | number[] = 100
): Promise<Buffer> {
  if (!rawFrames.length) {
    throw new Error("Cannot render animated GIF without frames.");
  }

  const combined = Buffer.concat(rawFrames);
  let delays: number[];
  if (Array.isArray(delay)) {
    if (delay.length === rawFrames.length) {
      delays = delay;
    } else if (delay.length > 0) {
      delays = [];
      for (let i = 0; i < rawFrames.length; i++) {
        delays.push(delay[i % delay.length]);
      }
    } else {
      delays = new Array(rawFrames.length).fill(100);
    }
  } else {
    delays = new Array(rawFrames.length).fill(delay);
  }

  return sharp(combined, {
    raw: {
      width,
      height: height * rawFrames.length,
      channels: 4,
      pageHeight: height,
    },
  })
    .gif({
      delay: delays,
      loop: 0,
    })
    .toBuffer();
}
