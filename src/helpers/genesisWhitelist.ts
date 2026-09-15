import mongoose from "mongoose";
import { PermissionsBitField } from "discord.js";
import config from "../../Configs/config.js";
import CommandContext from "./CommandContext.js";
import { MongodbKeyValue } from "./helperUtil.js";

export interface WhitelistEntry {
  whitelisted: boolean;
  guildId?: string | null;
  setBy?: string;
  timestamp: number;
}

const whitelistKV = new MongodbKeyValue("genesis_nsfw_whitelist");
const memoryFallback = new Map<string, WhitelistEntry>();

export async function isChannelNsfwWhitelisted(channelId: string): Promise<boolean> {
  if (!channelId) return false;
  try {
    if (mongoose.connection.readyState === 1) {
      const entry = await whitelistKV.get(channelId);
      if (!entry) return false;
      if (typeof entry === "boolean") return entry;
      return Boolean(entry.whitelisted);
    }
    return Boolean(memoryFallback.get(channelId)?.whitelisted);
  } catch {
    return Boolean(memoryFallback.get(channelId)?.whitelisted);
  }
}

export async function setChannelNsfwWhitelist(
  channelId: string,
  whitelisted: boolean,
  meta?: { guildId?: string | null; setBy?: string }
): Promise<void> {
  if (!channelId) return;
  const entry: WhitelistEntry = {
    whitelisted,
    guildId: meta?.guildId ?? null,
    setBy: meta?.setBy,
    timestamp: Date.now(),
  };

  if (whitelisted) {
    memoryFallback.set(channelId, entry);
  } else {
    memoryFallback.delete(channelId);
  }

  if (mongoose.connection.readyState === 1) {
    try {
      if (whitelisted) {
        await whitelistKV.set(channelId, entry);
      } else {
        await whitelistKV.delete(channelId);
      }
    } catch {
      // Maintain in-memory state if DB operation fails
    }
  }
}

export function isServerAdminOrOwner(ctx: CommandContext): boolean {
  if (!ctx.guild) return false;
  if (ctx.guild.ownerId === ctx.user.id) return true;
  if (config.users.ownerId && ctx.user.id === config.users.ownerId) return true;
  if (ctx.member?.permissions && typeof ctx.member.permissions.has === "function") {
    return ctx.member.permissions.has(PermissionsBitField.Flags.Administrator);
  }
  return false;
}
