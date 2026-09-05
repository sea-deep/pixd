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
  type VoiceConnection,
} from "@discordjs/voice";
import { type Client, type Guild, type TextBasedChannel } from "discord.js";
import { youtubeDl } from "youtube-dl-exec";
import config from "../../../Configs/config.js";
import { env } from "../../utilities/env.js";
import Logger from "../../helpers/Logger.js";
import type { LoopMode, MusicTrack } from "./types.js";
import LastFmService from "../lastfm/LastFmService.js";

export default class GuildPlayer {
  readonly guildId: string;
  readonly voiceChannelId: string;
  readonly textChannelId: string;
  readonly queue: MusicTrack[] = [];
  readonly audioPlayer: AudioPlayer;
  readonly connection: VoiceConnection;
  current: MusicTrack | null = null;
  loopMode: LoopMode = "off";
  private process: ChildProcess | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private destroyed = false;
  private advancing = false;
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
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => void this.onIdle());
    this.audioPlayer.on("error", (error) => {
      Logger.error(`Audio player error in guild ${this.guildId}`, error);
      void this.onIdle();
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
    if (!this.current && this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      await this.playNext();
    }
  }

  pause(): boolean {
    return this.audioPlayer.pause();
  }

  resume(): boolean {
    return this.audioPlayer.unpause();
  }

  skip(): boolean {
    if (!this.current) return false;
    this.killProcess();
    return this.audioPlayer.stop(true);
  }

  async seek(positionMs: number): Promise<void> {
    if (!this.current) throw new Error("Nothing is currently playing.");
    if (positionMs < 0 || (this.current.durationMs > 0 && positionMs >= this.current.durationMs)) {
      throw new Error("Seek position is outside the current track.");
    }

    this.advancing = true;
    try {
      this.startAtMs = positionMs;
      this.killProcess();
      await this.startCurrent(true);
    } finally {
      this.advancing = false;
    }
  }

  setLoopMode(mode: LoopMode): void {
    this.loopMode = mode;
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearInactivityTimer();
    this.queue.length = 0;
    this.current = null;
    this.killProcess();
    this.audioPlayer.stop(true);
    this.connection.destroy();
    this.onDestroyed(this);
  }

  private async playNext(): Promise<void> {
    if (this.destroyed || this.advancing) return;
    this.advancing = true;
    try {
      this.current = this.queue.shift() ?? null;
      this.startAtMs = 0;
      if (!this.current) {
        this.scheduleInactivity();
        return;
      }
      await this.startCurrent();
    } finally {
      this.advancing = false;
    }
  }

  private async startCurrent(isSeek = false): Promise<void> {
    const track = this.current;
    if (!track || this.destroyed) return;
    this.clearInactivityTimer();
    this.killProcess();

    const args = [
      track.url,
      "--format", "bestaudio/best",
      "--output", "-",
      "--no-playlist",
      "--no-progress",
      "--no-warnings",
      "--quiet",
    ];
    if (env.YT_DLP_COOKIES_PATH) args.push("--cookies", env.YT_DLP_COOKIES_PATH);
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
    child.once("error", (error) => Logger.error(`yt-dlp failed to start for ${track.url}`, error));
    child.once("close", (code) => {
      if (code && code !== 0 && !this.destroyed) {
        Logger.error(`yt-dlp exited with code ${code}: ${stderr.trim()}`);
      }
    });

    const resource = createAudioResource(child.stdout as Readable, {
      inputType: StreamType.Arbitrary,
      metadata: track,
    });
    if (!isSeek) {
      this.playStartedAt = Date.now();
      this.activeStartedAt = 0;
      this.playedMs = 0;
    }
    this.audioPlayer.play(resource);
    if (!isSeek) {
      const scrobblers = await this.lastFm.updateNowPlaying(track, this.voiceChannelId);
      await this.announce(
        `Now playing **${track.title}** by **${track.author}**` +
        (scrobblers ? `\n-# Scrobbling for ${scrobblers} listener${scrobblers === 1 ? "" : "s"}.` : ""),
      );
    }
  }

  private async onIdle(): Promise<void> {
    if (this.destroyed || this.advancing) return;
    const finished = this.current;
    const startedAt = this.playStartedAt;
    this.recordActivePlayback();
    const playedMs = this.playedMs;
    this.current = null;
    this.playStartedAt = 0;
    this.activeStartedAt = 0;
    this.playedMs = 0;
    this.killProcess();

    if (finished && startedAt) {
      await this.lastFm.scrobble(finished, this.voiceChannelId, startedAt, playedMs).catch((error) => {
        Logger.warn(`Could not scrobble '${finished.title}'`, error);
      });
    }

    if (finished && this.loopMode === "track") this.queue.unshift(finished);
    if (finished && this.loopMode === "queue") this.queue.push(finished);
    await this.playNext();
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
    if (child && child.exitCode === null && !child.killed) child.kill("SIGKILL");
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
