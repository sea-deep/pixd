import {
  Client,
  DiscordAPIError,
  Message,
  MessageContextMenuCommandInteraction,
  PermissionFlagsBits,
  TextBasedChannel,
} from "discord.js";
import CommandContext from "../helpers/CommandContext.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface DeployResult {
  success: boolean;
  reactedCount: number;
  error?: string;
}

export class ReactionBombService {
  /** Active message IDs currently receiving a reaction barrage (per-message mutex). */
  private static activeMessageLocks = new Set<string>();

  /** User cooldown timestamps (user ID -> timestamp). */
  private static userCooldowns = new Map<string, number>();

  /** 5-second cooldown per user to prevent cross-channel spam. */
  public static COOLDOWN_MS = 5_000;

  /**
   * Universal resolver to find the target Discord message.
   * Resolves:
   * 1. Discord message URL (cross-channel / announcement links)
   * 2. Message ID
   * 3. Replied-to message (for prefix commands)
   * 4. Previous message in the channel if no argument is provided
   */
  public static async resolveTarget(
    source: CommandContext | MessageContextMenuCommandInteraction | Message,
    input?: string | null
  ): Promise<{ message: Message | null; error?: string }> {
    // 1. Direct target message from context menu interaction
    if ("targetMessage" in source && source.targetMessage instanceof Message) {
      return { message: source.targetMessage };
    }

    const client: Client =
      "client" in source
        ? (source.client as Client)
        : ((source as any).ctx?.client as Client) || (source as any).channel?.client;

    const currentChannel =
      "channel" in source ? (source.channel as TextBasedChannel) : null;

    const trimmed = (input || "").trim();

    // 2. Parse Discord message link: https://discord.com/channels/<guildId>/<channelId>/<messageId>
    const linkMatch = trimmed.match(
      /(?:https?:\/\/)?(?:ptb\.|canary\.)?discord\.com\/channels\/(\d+|@me)\/(\d+)\/(\d+)/i
    );
    if (linkMatch) {
      const [, , channelId, messageId] = linkMatch;
      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !("messages" in channel)) {
          return { message: null, error: "❌ Target channel could not be accessed." };
        }
        const message = await (channel as any).messages.fetch(messageId);
        return { message };
      } catch {
        return { message: null, error: "❌ Target message link could not be resolved or found." };
      }
    }

    // 3. Direct Message ID
    if (/^\d{17,21}$/.test(trimmed)) {
      if (!currentChannel || !("messages" in currentChannel)) {
        return { message: null, error: "❌ Current channel does not support fetching messages." };
      }
      try {
        const message = await currentChannel.messages.fetch(trimmed);
        return { message };
      } catch {
        return { message: null, error: `❌ Message with ID \`${trimmed}\` was not found in this channel.` };
      }
    }

    // 4. Prefix Command: Message Reference (Reply)
    let triggerMessage: Message | null = null;
    if (source instanceof Message) {
      triggerMessage = source;
    } else if (source instanceof CommandContext && source.raw instanceof Message) {
      triggerMessage = source.raw;
    }

    if (triggerMessage?.reference?.messageId) {
      try {
        const refMessage = await triggerMessage.channel.messages.fetch(
          triggerMessage.reference.messageId
        );
        return { message: refMessage };
      } catch {
        // Fall back to previous message if reply fetch fails
      }
    }

    // 5. Default Fallback: Previous message in channel
    if (currentChannel && "messages" in currentChannel) {
      try {
        const fetchOptions: { limit: number; before?: string } = { limit: 1 };
        if (triggerMessage) {
          fetchOptions.before = triggerMessage.id;
        }
        const fetched = await currentChannel.messages.fetch(fetchOptions);
        const prev = fetched.first();
        if (prev) return { message: prev };
      } catch {
        // Ignore fetch errors
      }
    }

    return { message: null, error: "❌ Could not find a target message to react to." };
  }

  /**
   * Safely deploys a reaction bomb onto the target message.
   * Handles per-message mutex, user cooldowns, permission verification,
   * Discord's 20-reaction hard ceiling, and 260ms pacing to avoid 429 rate limits.
   */
  public static async deploy(
    userId: string,
    targetMessage: Message,
    emojis: string[]
  ): Promise<DeployResult> {
    // Check user cooldown
    const now = Date.now();
    const lastUse = this.userCooldowns.get(userId) || 0;
    if (now - lastUse < this.COOLDOWN_MS) {
      const waitSeconds = Math.ceil((this.COOLDOWN_MS - (now - lastUse)) / 1000);
      return {
        success: false,
        reactedCount: 0,
        error: `⏳ You're doing that too fast! Please wait **${waitSeconds}s** before reacting again.`,
      };
    }

    // Check per-message mutex
    if (this.activeMessageLocks.has(targetMessage.id)) {
      return {
        success: false,
        reactedCount: 0,
        error: "⏳ This message is already receiving a reaction barrage! Please wait for it to finish.",
      };
    }

    // Check bot channel permissions if inside a guild
    if (
      targetMessage.guild &&
      targetMessage.channel &&
      "permissionsFor" in targetMessage.channel &&
      targetMessage.client.user
    ) {
      const perms = targetMessage.channel.permissionsFor(targetMessage.client.user);
      if (
        perms &&
        (!perms.has(PermissionFlagsBits.AddReactions) ||
          !perms.has(PermissionFlagsBits.ReadMessageHistory))
      ) {
        return {
          success: false,
          reactedCount: 0,
          error: "❌ I need `Add Reactions` and `Read Message History` permissions in that channel!",
        };
      }
    }

    // Discord allows maximum 20 unique reactions per message
    const existingReactions = targetMessage.reactions?.cache?.size || 0;
    const availableSlots = Math.max(0, 20 - existingReactions);

    if (availableSlots === 0) {
      return {
        success: false,
        reactedCount: 0,
        error: "❌ Target message already has the maximum of 20 reactions!",
      };
    }

    const emojisToReact = emojis.slice(0, availableSlots);
    let reactedCount = 0;

    // Acquire lock and record cooldown
    this.activeMessageLocks.add(targetMessage.id);
    this.userCooldowns.set(userId, now);

    try {
      for (const emoji of emojisToReact) {
        try {
          await targetMessage.react(emoji);
          reactedCount++;
          // 260ms pacing stays strictly under Discord's 4/sec reaction route bucket limit
          await sleep(260);
        } catch (err: any) {
          if (err instanceof DiscordAPIError) {
            if (err.code === 30010) {
              // Discord max reactions ceiling hit
              break;
            }
            if (err.code === 10008) {
              // Message deleted while reacting
              return {
                success: reactedCount > 0,
                reactedCount,
                error: "⚠️ The target message was deleted during the barrage.",
              };
            }
            if (err.code === 50013) {
              return {
                success: reactedCount > 0,
                reactedCount,
                error: "❌ Missing permission to react in that channel.",
              };
            }
          }
          console.error("Failed reacting with emoji:", err);
        }
      }

      return { success: true, reactedCount };
    } finally {
      this.activeMessageLocks.delete(targetMessage.id);
    }
  }
}

export default ReactionBombService;
