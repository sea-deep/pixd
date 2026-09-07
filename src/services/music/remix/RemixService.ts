import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import PQueue from "p-queue";
import { youtubeDl } from "youtube-dl-exec";
import Logger from "../../../helpers/Logger.js";
import { getCookiesPath } from "../../../helpers/cookieHelper.js";
import type { MusicTrack } from "../types.js";

export const REMIX_VERSION = "brazilian-phonk-v1";

export interface RemixResult {
  trackId: string;
  outputPath: string;
  cached: boolean;
  bpm?: number;
  duration?: number;
}

export class RemixService {
  private static instance: RemixService;
  private readonly queue = new PQueue({ concurrency: 1 });
  private readonly inFlightJobs = new Map<string, Promise<string>>();
  private readonly cacheDir: string;
  private readonly rawAudioDir: string;
  private readonly pythonPath: string;

  constructor(baseCacheDir: string = ".cache") {
    this.cacheDir = path.resolve(baseCacheDir, "remixes");
    this.rawAudioDir = path.resolve(baseCacheDir, "raw");

    const venvPython = path.resolve(process.cwd(), ".venv", "bin", "python");
    this.pythonPath = existsSync(venvPython) ? venvPython : (process.env.PYTHON_PATH || "python3");
  }

  static getInstance(): RemixService {
    if (!RemixService.instance) {
      RemixService.instance = new RemixService();
    }
    return RemixService.instance;
  }

  getCanonicalHash(trackId: string): string {
    return createHash("sha256").update(`${trackId}:${REMIX_VERSION}`).digest("hex").slice(0, 24);
  }

  getRemixPath(trackId: string): string | null {
    const hash = this.getCanonicalHash(trackId);
    const dest = path.join(this.cacheDir, hash, "remix.wav");
    if (existsSync(dest)) {
      return dest;
    }
    return null;
  }

  isRemixCached(trackId: string): boolean {
    return Boolean(this.getRemixPath(trackId));
  }

  async requestRemix(track: MusicTrack, onStatus?: (msg: string) => void): Promise<string> {
    const cachedPath = this.getRemixPath(track.id);
    if (cachedPath) {
      return cachedPath;
    }

    const hash = this.getCanonicalHash(track.id);
    const existing = this.inFlightJobs.get(hash);
    if (existing) {
      return existing;
    }

    const jobPromise = this.queue.add(() => this.executeRemixJob(track, hash, onStatus)) as Promise<string>;
    this.inFlightJobs.set(hash, jobPromise);

    try {
      return await jobPromise;
    } finally {
      this.inFlightJobs.delete(hash);
    }
  }

  private async executeRemixJob(
    track: MusicTrack,
    hash: string,
    onStatus?: (msg: string) => void,
  ): Promise<string> {
    // Double check cache
    const existing = this.getRemixPath(track.id);
    if (existing) return existing;

    await mkdir(this.cacheDir, { recursive: true });
    await mkdir(this.rawAudioDir, { recursive: true });

    const trackOutDir = path.join(this.cacheDir, hash);
    await mkdir(trackOutDir, { recursive: true });
    const finalWavPath = path.join(trackOutDir, "remix.wav");
    const rawAudioPath = path.join(this.rawAudioDir, `${hash}.wav`);

    onStatus?.("Acquiring source audio...");
    await this.acquireSourceAudio(track, rawAudioPath);

    onStatus?.("Remixing with Brazilian funk engine...");
    const scriptPath = path.resolve(
      process.cwd(),
      "src", "services", "music", "remix", "worker", "remix_pipeline.py",
    );

    const args = [
      scriptPath,
      "--input", rawAudioPath,
      "--output", finalWavPath,
      "--cache-dir", this.cacheDir,
      "--track-id", track.id,
      "--model", process.env.PHONK_SEPARATOR_MODEL || "dsp",
    ];

    await new Promise<void>((resolve, reject) => {
      const child: ChildProcess = spawn(this.pythonPath, args, { stdio: ["ignore", "pipe", "pipe"] });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (d) => { stdout += String(d); });
      child.stderr?.on("data", (d) => { stderr += String(d); });

      child.once("error", (err) => {
        reject(new Error(`Remix worker process error: ${err.message}`));
      });

      child.once("close", (code, signal) => {
        if (code === 0) {
          try {
            const parsed = JSON.parse(stdout.trim());
            Logger.info(`Remix completed for ${track.title}`, parsed.timings);
          } catch {
            // Non-fatal parse warning
          }
          resolve();
        } else {
          const detail = signal ? `signal ${signal}` : `code ${code}`;
          Logger.error(`Remix worker exited with ${detail}: ${stderr.trim()}`);
          reject(new Error(`Remix failed (${detail}): ${stderr.trim() || stdout.trim()}`));
        }
      });
    });

    // Cleanup raw intermediate audio to save disk space
    await unlink(rawAudioPath).catch(() => undefined);

    const s = await stat(finalWavPath).catch(() => null);
    if (!s || s.size < 1024) {
      throw new Error("Remix audio file was not created or is empty.");
    }

    return finalWavPath;
  }

  private async acquireSourceAudio(track: MusicTrack, destPath: string): Promise<void> {
    if (existsSync(destPath)) {
      const s = await stat(destPath).catch(() => null);
      if (s && s.size > 1024) return;
    }

    const cookiesPath = getCookiesPath();
    const args = [
      track.url,
      "--format", "bestaudio/best",
      "--output", destPath,
      "--extract-audio",
      "--audio-format", "wav",
      "--postprocessor-args", "ffmpeg:-ar 48000 -ac 2",
      "--no-playlist",
      "--no-progress",
      "--no-warnings",
      "--quiet",
      "--extractor-args", "youtube:player_client=ios,android,mweb;player_skip=webpage",
    ];
    if (cookiesPath) args.push("--cookies", cookiesPath);

    const executable = (youtubeDl as typeof youtubeDl & {
      constants: { YOUTUBE_DL_PATH: string };
    }).constants.YOUTUBE_DL_PATH;

    await new Promise<void>((resolve, reject) => {
      const child = spawn(executable, args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      child.stderr?.on("data", (chunk) => {
        if (stderr.length < 4000) stderr += String(chunk);
      });
      child.once("error", reject);
      child.once("close", (code) => {
        if (code === 0 && existsSync(destPath)) {
          resolve();
        } else {
          reject(new Error(`Failed to download audio for ${track.url}: ${stderr.trim()}`));
        }
      });
    });
  }
}

export default RemixService.getInstance();
