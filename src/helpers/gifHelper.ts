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
 * Resolves Tenor, Klipy, Giphy, Discord embeds or general webpage URLs into direct image / GIF URLs.
 */
export async function resolveMediaUrl(rawUrl: string): Promise<string> {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  const url = rawUrl.trim();

  // Handle proxy converters like gifconvert.vxtwitter.com
  if (url.includes("gifconvert.vxtwitter.com") || url.includes("convert.avif") || url.includes("convert.gif")) {
    try {
      const parsed = new URL(url);
      const innerUrl = parsed.searchParams.get("url");
      if (innerUrl && /^https?:\/\//i.test(innerUrl)) {
        return innerUrl;
      }
    } catch {}
  }

  // If already a direct media URL (handles query params on Discord CDN / imgur / twimg etc.)
  if (/^https?:\/\/.*?\.(?:png|jpg|jpeg|gif|webp|avif|mp4)(?:\?.*)?$/i.test(url)) {
    return url;
  }

  // Handle common web GIF providers and open-graph pages
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      },
    });

    if (typeof response.data === "string") {
      const $ = cheerio.load(response.data);
      const meta =
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        $('meta[name="twitter:image:src"]').attr("content") ||
        $('meta[property="og:video"]').attr("content");

      if (meta && /^https?:\/\//i.test(meta)) {
        return meta;
      }
    }
  } catch {
    // Fail silently to the original URL if web scrape fails
  }

  return url;
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
