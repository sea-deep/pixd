import type { Client, Guild } from "discord.js";
import { constants as fsConstants } from "node:fs";
import { access } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { youtubeDl } from "youtube-dl-exec";
import GuildPlayer from "./GuildPlayer.js";

const execFileAsync = promisify(execFile);

export default class MusicManager {
  readonly players = new Map<string, GuildPlayer>();

  constructor(private readonly client: Client) {}

  async validateRuntime(): Promise<void> {
    const executable = (youtubeDl as typeof youtubeDl & {
      constants: { YOUTUBE_DL_PATH: string };
    }).constants.YOUTUBE_DL_PATH;
    await access(executable, fsConstants.X_OK);
    await execFileAsync("ffmpeg", ["-version"], { timeout: 10_000 });
  }

  get(guildId: string): GuildPlayer | undefined {
    return this.players.get(guildId);
  }

  async connect(guild: Guild, voiceChannelId: string, textChannelId: string): Promise<GuildPlayer> {
    const existing = this.players.get(guild.id);
    if (existing) {
      if (existing.voiceChannelId !== voiceChannelId) {
        throw new Error("The bot is already playing in another voice channel.");
      }
      return existing;
    }

    const player = new GuildPlayer(this.client, guild, voiceChannelId, textChannelId, (destroyed) => {
      if (this.players.get(guild.id) === destroyed) this.players.delete(guild.id);
    });
    this.players.set(guild.id, player);
    try {
      await player.ready();
      return player;
    } catch (error) {
      this.players.delete(guild.id);
      await player.destroy();
      throw error;
    }
  }

  async destroy(guildId: string): Promise<boolean> {
    const player = this.players.get(guildId);
    if (!player) return false;
    this.players.delete(guildId);
    await player.destroy();
    return true;
  }

  async destroyAll(): Promise<void> {
    const players = [...this.players.values()];
    this.players.clear();
    await Promise.allSettled(players.map((player) => player.destroy()));
  }
}
