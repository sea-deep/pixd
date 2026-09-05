import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { env } from "../utilities/env.js";

let cachedCookiePath: string | null | undefined = undefined;

/**
 * Returns a valid filesystem path to YouTube cookies for yt-dlp.
 * Supports:
 * 1. env.YT_DLP_COOKIES_PATH (pointing to a file on disk)
 * 2. local cookies.txt in the project root
 * 3. raw/base64 Netscape cookie text in env.YT_DLP_COOKIES or process.env.YOUTUBE_COOKIES
 */
export function getCookiesPath(): string | undefined {
  if (cachedCookiePath !== undefined) {
    return cachedCookiePath ?? undefined;
  }

  // 1. Explicit path in env if file exists
  if (env.YT_DLP_COOKIES_PATH && fs.existsSync(env.YT_DLP_COOKIES_PATH)) {
    cachedCookiePath = env.YT_DLP_COOKIES_PATH;
    return cachedCookiePath;
  }

  // 2. Local cookies.txt in project root
  const localPath = path.resolve("cookies.txt");
  if (fs.existsSync(localPath)) {
    cachedCookiePath = localPath;
    return cachedCookiePath;
  }

  // 3. Raw cookies string in env (YT_DLP_COOKIES or YOUTUBE_COOKIES)
  const raw = process.env.YT_DLP_COOKIES || process.env.YOUTUBE_COOKIES || process.env.COOKIES;
  if (raw && raw.trim()) {
    try {
      let content = raw.trim();
      // Check if base64 encoded
      if (
        !content.includes("\t") &&
        !content.includes("\n") &&
        content.length > 50 &&
        /^[A-Za-z0-9+/=]+$/.test(content)
      ) {
        try {
          const decoded = Buffer.from(content, "base64").toString("utf8");
          if (decoded.includes("youtube.com") || decoded.includes("\t") || decoded.includes("# Netscape")) {
            content = decoded;
          }
        } catch { }
      }

      const tmpFile = path.join(os.tmpdir(), "yt-dlp-cookies.txt");
      fs.writeFileSync(tmpFile, content, "utf8");
      cachedCookiePath = tmpFile;
      return cachedCookiePath;
    } catch { }
  }

  cachedCookiePath = null;
  return undefined;
}
