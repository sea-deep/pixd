import { spawn, type ChildProcess } from "node:child_process";
import type { Readable } from "node:stream";
import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  type AudioPlayer,
  type AudioResource,
  type VoiceConnection,
} from "@discordjs/voice";
import { type Client, type Guild, type TextBasedChannel } from "discord.js";
import { youtubeDl } from "youtube-dl-exec";
import config from "../../../Configs/config.js";
import { env } from "../../utilities/env.js";
import { getCookiesPath } from "../../helpers/cookieHelper.js";
import Logger from "../../helpers/Logger.js";
import type { AudioFilter, LoopMode, MusicTrack } from "./types.js";
import { AUDIO_FILTERS } from "./audioFilters.js";
import LastFmService from "../lastfm/LastFmService.js";
import remixService from "./remix/RemixService.js";
import YtDlpResolver from "./YtDlpResolver.js";

const resolver = new YtDlpResolver();

export default class GuildPlayer {
  readonly guildId: string;
  readonly voiceChannelId: string;
  readonly textChannelId: string;
  readonly queue: MusicTrack[] = [];
  readonly audioPlayer: AudioPlayer;
  readonly connection: VoiceConnection;
  current: MusicTrack | null = null;
  loopMode: LoopMode = "off";
  filter: AudioFilter = "off";
  volume: number = config.music.defaultVolume;
  private currentResource: AudioResource<MusicTrack> | null = null;
  private process: ChildProcess | null = null;
  private filterProcess: ChildProcess | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private destroyed = false;
  private isTransitioning = false;
  private pendingAdvance = false;
  private isRestartingStream = false;
  private streamGeneration = 0;
  private startAtMs = 0;
  private playStartedAt = 0;
  private activeStartedAt = 0;
  private playedMs = 0;
  private readonly lastFm: LastFmService;

  constructor(
    private readonly client: Client,
    guild: Guild,
    voiceChannelId: string,
    textChannelId: string,
    private readonly onDestroyed: (player: GuildPlayer) => void,
  ) {
    this.guildId = guild.id;
    this.voiceChannelId = voiceChannelId;
    this.textChannelId = textChannelId;
    this.audioPlayer = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Stop } });
    this.connection = joinVoiceChannel({
      guildId: guild.id,
      channelId: voiceChannelId,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    this.connection.subscribe(this.audioPlayer);
    this.lastFm = new LastFmService(client);

    this.audioPlayer.on("stateChange", (oldState, newState) => {
      if (oldState.status === AudioPlayerStatus.Playing && newState.status !== AudioPlayerStatus.Playing) {
        this.recordActivePlayback();
      }
      if (oldState.status !== AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Playing) {
        this.activeStartedAt = Date.now();
      }
    });
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => this.onIdle());
    this.audioPlayer.on("error", (error) => {
      Logger.error(`Audio player error in guild ${this.guildId}`, error);
      this.onIdle();
    });
    this.connection.on(VoiceConnectionStatus.Disconnected, () => void this.recoverConnection());
  }

  async ready(): Promise<void> {
    await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
  }

  enqueue(tracks: MusicTrack[]): void {
    const occupied = this.queue.length + (this.current ? 1 : 0);
    if (occupied + tracks.length > config.music.maxQueueSize) {
      throw new Error(`The queue can contain at most ${config.music.maxQueueSize} tracks.`);
    }
    this.queue.push(...tracks);
    this.clearInactivityTimer();
  }

  async ensurePlaying(): Promise<void> {
    if (this.destroyed) return;
    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle && !this.isTransitioning && !this.isRestartingStream) {
      await this.advanceTrack();
    }
  }

  pause(): boolean {
    return this.audioPlayer.pause();
  }

  resume(): boolean {
    return this.audioPlayer.unpause();
  }

  async skip(): Promise<MusicTrack | null> {
    if (this.destroyed) return null;
    if (!this.current && this.queue.length === 0) return null;

    const skipped = this.current ?? this.queue[0];
    this.killProcess();
    await this.advanceTrack({ isManualSkip: true });
    return skipped;
  }

  async seek(positionMs: number): Promise<void> {
    if (!this.current) throw new Error("Nothing is currently playing.");
    if (positionMs < 0 || (this.current.durationMs > 0 && positionMs >= this.current.durationMs)) {
      throw new Error("Seek position is outside the current track.");
    }

    this.isRestartingStream = true;
    try {
      this.startAtMs = positionMs;
      this.killProcess();
      await this.startCurrent(true);
    } catch (err) {
      Logger.error("Failed to seek in track", err);
      this.isRestartingStream = false;
      await this.advanceTrack();
    } finally {
      this.isRestartingStream = false;
    }
  }

  setLoopMode(mode: LoopMode): void {
    this.loopMode = mode;
  }

  getCurrentPositionMs(): number {
    if (!this.current) return 0;
    const base = this.startAtMs || 0;
    const elapsed = this.activeStartedAt ? Date.now() - this.activeStartedAt : 0;
    return base + this.playedMs + elapsed;
  }

  async setFilter(newFilter: AudioFilter): Promise<boolean> {
    if (this.filter === newFilter) return false;
    this.filter = newFilter;
    if (!this.current || this.destroyed) return true;

    if (newFilter === "phonk") {
      const track = this.current;
      const cached = remixService.getRemixPath(track.id);
      if (cached) {
        const currentPos = this.getCurrentPositionMs();
        this.isRestartingStream = true;
        this.clearInactivityTimer();
        try {
          this.killProcess();
          this.startAtMs = currentPos;
          await this.startCurrent(true);
        } catch (err) {
          Logger.error("Failed to apply remixed audio", err);
          this.isRestartingStream = false;
          await this.advanceTrack();
        } finally {
          this.isRestartingStream = false;
        }
        return true;
      }

      void this.announce(`⏳ Preparing Brazilian funk remix for **${track.title}** in the background...`);
      void (async () => {
        try {
          await remixService.requestRemix(track);
          if (this.destroyed || this.current?.id !== track.id || this.filter !== "phonk") {
            return;
          }
          const currentPos = this.getCurrentPositionMs();
          this.isRestartingStream = true;
          this.clearInactivityTimer();
          try {
            this.killProcess();
            this.startAtMs = currentPos;
            await this.startCurrent(true);
            const hash = remixService.getCanonicalHash(track.id);
            const link = `\n-# 🔗 [Download / Listen to Remix WAV](${env.PUBLIC_BASE_URL}/remix/${hash})`;
            await this.announce(`🔥 Applied Brazilian funk remix to **${track.title}**!${link}`);
          } finally {
            this.isRestartingStream = false;
          }
        } catch (err) {
          Logger.error(`Failed to generate remix for ${track.title}`, err);
          if (!this.destroyed && this.current?.id === track.id) {
            await this.announce(`⚠️ Could not prepare Brazilian funk remix for **${track.title}**.`);
            this.filter = "off";
          }
        }
      })();
      return true;
    }

    const currentPos = this.getCurrentPositionMs();
    this.isRestartingStream = true;
    this.clearInactivityTimer();
    try {
      this.killProcess();
      this.startAtMs = currentPos;
      await this.startCurrent(true);
    } catch (err) {
      Logger.error("Failed to apply filter to track", err);
      this.isRestartingStream = false;
      await this.advanceTrack();
    } finally {
      this.isRestartingStream = false;
    }
    return true;
  }

  setVolume(volume: number): number {
    if (!Number.isFinite(volume) || volume < 0 || volume > config.music.maxVolume) {
      throw new Error(`Volume must be between 0 and ${config.music.maxVolume}%.`);
    }
    this.volume = volume;
    this.currentResource?.volume?.setVolumeLogarithmic(volume / 100);
    return this.volume;
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    this.streamGeneration++;
    this.clearInactivityTimer();
    this.queue.length = 0;
    this.current = null;
    this.currentResource = null;
    this.killProcess();
    this.audioPlayer.stop(true);
    this.connection.destroy();
    this.onDestroyed(this);
  }

  private onIdle(): void {
    if (this.destroyed || this.isRestartingStream) return;
    void this.advanceTrack();
  }

  private async advanceTrack(options: { isManualSkip?: boolean } = {}): Promise<void> {
    if (this.destroyed) return;
    if (this.isTransitioning) {
      this.pendingAdvance = true;
      return;
    }
    this.isTransitioning = true;
    try {
      const finished = this.current;
      const startedAt = this.playStartedAt;
      this.recordActivePlayback();
      const playedMs = this.playedMs;

      this.current = null;
      this.currentResource = null;
      this.playStartedAt = 0;
      this.activeStartedAt = 0;
      this.playedMs = 0;
      this.killProcess();

      if (finished && startedAt) {
        void this.lastFm.scrobble(finished, this.voiceChannelId, startedAt, playedMs).catch((error) => {
          Logger.warn(`Could not scrobble '${finished.title}'`, error);
        });
      }

      if (finished && !options.isManualSkip && this.loopMode === "track") {
        this.queue.unshift(finished);
      } else if (finished && this.loopMode === "queue") {
        this.queue.push(finished);
      }

      this.current = this.queue.shift() ?? null;
      this.startAtMs = 0;

      if (!this.current) {
        this.audioPlayer.stop(true);
        this.scheduleInactivity();
        return;
      }

      try {
        await this.startCurrent();
      } catch (err) {
        Logger.error(`Failed to start track ${this.current.title}`, err);
        await this.announce(`⚠️ Failed to play **${this.current.title}**.`);
        this.current = null;
        if (this.queue.length > 0) {
          this.pendingAdvance = true;
        } else {
          this.scheduleInactivity();
        }
      }
    } finally {
      this.isTransitioning = false;
      if (this.pendingAdvance) {
        this.pendingAdvance = false;
        void this.advanceTrack();
      }
    }
  }

  private async startCurrent(isSeek = false): Promise<void> {
    const track = this.current;
    if (!track || this.destroyed) return;
    this.clearInactivityTimer();
    this.killProcess();

    const generation = ++this.streamGeneration;
    const remixPath = this.filter === "phonk" ? remixService.getRemixPath(track.id) : null;
    let audioStream: Readable;
    let inputType: StreamType;

    if (remixPath) {
      const ffmpegArgs: string[] = [];
      if (this.startAtMs > 0) {
        ffmpegArgs.push("-ss", `${this.startAtMs / 1000}`);
      }
      ffmpegArgs.push(
        "-i", remixPath,
        "-f", "s16le",
        "-ar", "48000",
        "-ac", "2",
        "pipe:1",
      );
      const child = spawn("ffmpeg", ffmpegArgs, { stdio: ["ignore", "pipe", "pipe"] });
      this.process = child;
      child.once("error", (error) => {
        if (this.streamGeneration === generation && !this.destroyed) {
          Logger.error(`FFmpeg failed for remixed audio ${remixPath}`, error);
        }
      });
      child.once("close", (code) => {
        if (code && code !== 0 && this.streamGeneration === generation && !this.destroyed) {
          Logger.error(`FFmpeg remix process exited with code ${code}`);
          if (this.audioPlayer.state.status === AudioPlayerStatus.Idle && !this.isRestartingStream && !this.isTransitioning) {
            void this.advanceTrack();
          }
        }
      });
      audioStream = child.stdout as Readable;
      inputType = StreamType.Raw;
    } else {
      const cookiesPath = getCookiesPath();
      const args = [
        track.url,
        "--format", "bestaudio/best",
        "--output", "-",
        "--no-playlist",
        "--no-progress",
        "--no-warnings",
        "--quiet",
        "--extractor-args", "youtube:player_client=ios,android,mweb;player_skip=webpage",
      ];
      if (cookiesPath) args.push("--cookies", cookiesPath);
      if (this.startAtMs > 0) {
        args.push("--download-sections", `*${this.startAtMs / 1000}-inf`, "--force-keyframes-at-cuts");
      }

      const executable = (youtubeDl as typeof youtubeDl & {
        constants: { YOUTUBE_DL_PATH: string };
      }).constants.YOUTUBE_DL_PATH;
      const child = spawn(executable, args, { stdio: ["ignore", "pipe", "pipe"] });
      this.process = child;
      let stderr = "";
      child.stderr.on("data", (chunk) => {
        if (stderr.length < 8_000) stderr += String(chunk);
      });
      child.once("error", (error) => {
        if (this.streamGeneration === generation && !this.destroyed) {
          Logger.error(`yt-dlp failed to start for ${track.url}`, error);
        }
      });
      child.once("close", async (code) => {
        if (code && code !== 0 && this.streamGeneration === generation && !this.destroyed) {
          Logger.error(`yt-dlp exited with code ${code}: ${stderr.trim()}`);
          if (this.audioPlayer.state.status === AudioPlayerStatus.Idle && !this.isRestartingStream && !this.isTransitioning) {
            // Live playback fallback: If YouTube stream failed and we haven't attempted a fallback yet
            const isYouTube = /youtube\.com|youtu\.be/i.test(track.url) || track.source === "youtube";
            if (isYouTube && !track.fallbackUrl) {
              try {
                Logger.info(`Attempting live SoundCloud fallback for blocked YouTube track: ${track.title}`);
                const fallback = await resolver.findSoundCloudFallback(track.title, track.author, track.requesterId);
                if (fallback && this.streamGeneration === generation && !this.destroyed) {
                  track.fallbackUrl = track.url;
                  track.url = fallback.url;
                  track.source = "soundcloud";
                  void this.announce(`🔄 YouTube stream was blocked; seamlessly switched to SoundCloud for **${track.title}**.`);
                  await this.startCurrent();
                  return;
                }
              } catch (fallbackError) {
                Logger.error("SoundCloud live fallback failed", fallbackError);
              }
            }
            void this.announce(`⚠️ Stream error: ${stderr.trim() || `Exit code ${code}`}`);
            void this.advanceTrack();
          }
        }
      });

      audioStream = child.stdout as Readable;
      inputType = StreamType.Arbitrary;

      const filterDef = AUDIO_FILTERS[this.filter];
      if (filterDef?.ffmpegArgs) {
        const ffmpegArgs = [
          "-i", "pipe:0",
          ...filterDef.ffmpegArgs,
          "-f", "s16le",
          "-ar", "48000",
          "-ac", "2",
          "pipe:1",
        ];
        const ffmpegChild = spawn("ffmpeg", ffmpegArgs, { stdio: ["pipe", "pipe", "pipe"] });
        this.filterProcess = ffmpegChild;

        child.stdout?.pipe(ffmpegChild.stdin);
        child.stdout?.on("error", () => {});
        ffmpegChild.stdin?.on("error", () => {});
        ffmpegChild.stdout?.on("error", () => {});

        ffmpegChild.once("error", (err) => {
          if (this.streamGeneration === generation && !this.destroyed) {
            Logger.error("FFmpeg filter process error", err);
          }
        });
        ffmpegChild.stderr?.on("data", () => {});

        audioStream = ffmpegChild.stdout as Readable;
        inputType = StreamType.Raw;
      }
    }

    const resource = createAudioResource(audioStream, {
      inputType,
      metadata: track,
      inlineVolume: true,
    });
    this.currentResource = resource;
    resource.volume?.setVolumeLogarithmic(this.volume / 100);
    if (!isSeek) {
      this.playStartedAt = Date.now();
      this.activeStartedAt = 0;
      this.playedMs = 0;
    }
    this.audioPlayer.play(resource);
    if (!isSeek) {
      void (async () => {
        try {
          const scrobblers = await this.lastFm.updateNowPlaying(track, this.voiceChannelId);
          const sourceBadge = track.source && track.source !== "youtube" && track.source !== "custom"
            ? ` • *via ${track.source === "soundcloud" ? "SoundCloud" : track.source === "bandcamp" ? "Bandcamp" : "Spotify"}*`
            : "";
          if (this.streamGeneration === generation && !this.destroyed) {
            await this.announce(
              `Now playing **${track.title}** by **${track.author}**${sourceBadge}` +
              (scrobblers ? `\n-# Scrobbling for ${scrobblers} listener${scrobblers === 1 ? "" : "s"}.` : ""),
            );
          }
        } catch (err) {
          Logger.warn(`Could not update now playing for ${track.title}`, err);
        }
      })();
    }
  }

  private async recoverConnection(): Promise<void> {
    if (this.destroyed) return;
    try {
      await Promise.race([
        entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      await this.announce("Voice connection was lost; clearing the music queue.");
      await this.destroy();
    }
  }

  private scheduleInactivity(): void {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => void this.destroy(), config.music.inactivityMs);
    this.inactivityTimer.unref();
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = null;
  }

  private killProcess(): void {
    const child = this.process;
    this.process = null;
    if (child) {
      child.stdout?.destroy();
      child.stderr?.destroy();
      if (child.exitCode === null && !child.killed) child.kill("SIGKILL");
    }

    const filterChild = this.filterProcess;
    this.filterProcess = null;
    if (filterChild) {
      filterChild.stdin?.destroy();
      filterChild.stdout?.destroy();
      filterChild.stderr?.destroy();
      if (filterChild.exitCode === null && !filterChild.killed) filterChild.kill("SIGKILL");
    }
  }

  private recordActivePlayback(): void {
    if (!this.activeStartedAt) return;
    this.playedMs += Date.now() - this.activeStartedAt;
    this.activeStartedAt = 0;
  }

  private async announce(content: string): Promise<void> {
    const channel = this.client.channels.cache.get(this.textChannelId) as TextBasedChannel | undefined;
    if (channel?.isSendable()) await channel.send({ content }).catch(() => undefined);
  }
}
