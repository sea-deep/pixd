import { Client, PermissionResolvable, ApplicationCommandOptionData, ChatInputApplicationCommandData, Message, RepliableInteraction } from "discord.js";
import CommandContext from "../helpers/CommandContext.js";
import MessageOptionResolver from "../helpers/MessageOptionResolver.js";
import config from "../../Configs/config.js";

/**
 * Interface definition for unified hybrid commands.
 */
export interface HybridCommandData {
  /** The command name (lower case, alphanumeric). */
  name: string;
  /** Slash route. Use "parent subcommand" to share a grouped slash subcommand. */
  slashRoute?: string;
  /** Command description. */
  description: string;
  /** Command category name (defaults to parent folder). */
  category?: string;
  /** Prefix command aliases. */
  aliases?: string[];
  /** Prefix command usage pattern (e.g. "<user> [reason]"). */
  usage?: string;
  /** Example usage strings (without leading prefixes). */
  examples?: string[];
  /** Slash and prefix positional options block. */
  options?: ApplicationCommandOptionData[];
  /** Command cooldown in milliseconds. */
  cooldown?: number;
  /** Enforce command execution inside servers only. */
  guildOnly?: boolean;
  /** Require nsfw channel trigger. */
  nsfw?: boolean;
  /** Limit command to owner only. */
  ownerOnly?: boolean;
  /** Limit command to developers only. */
  developerOnly?: boolean;
  /** Automate deferReply / sendTyping on start (defaults to true). */
  defer?: boolean;
  /** If the deferred slash reply should be ephemeral (defaults to false). */
  ephemeral?: boolean;
  /** Required permissions. */
  permissions?: {
    bot?: PermissionResolvable[];
    user?: PermissionResolvable[];
  };
  /** Consolidated execution callback block. */
  execute: (ctx: CommandContext, client: Client) => Promise<unknown> | unknown;
}

/**
 * Monolithic metadata schema representing unified Prefix and Slash commands.
 */
export default class HybridCommand {
  public name: string;
  public subCommand: string | null;
  public description: string;
  public category: string | null;
  public aliases: string[];
  public usage: string;
  public examples: string[];
  public options: ApplicationCommandOptionData[];
  public cooldown: number;
  public guildOnly: boolean;
  public nsfw: boolean;
  public ownerOnly: boolean;
  public developerOnly: boolean;
  public defer: boolean;
  public ephemeral: boolean;
  public permissions: {
    bot: PermissionResolvable[];
    user: PermissionResolvable[];
  };
  public run: (ctx: CommandContext, client: Client) => Promise<unknown> | unknown;
  public data: ChatInputApplicationCommandData;
  public execute: (interactionOrMessage: Message | RepliableInteraction, ...argsOrClient: any[]) => Promise<any>;
  public commandType: "hybrid" = "hybrid";

  /**
   * @param data - Config parameters.
   */
  constructor(data: HybridCommandData) {
    if (!data.name || typeof data.name !== "string") {
      throw new Error("HybridCommand Schema Validation: 'name' is required and must be a string.");
    }
    if (!data.description || typeof data.description !== "string") {
      throw new Error(`HybridCommand Schema Validation (${data.name}): 'description' is required and must be a string.`);
    }
    if (!data.execute || typeof data.execute !== "function") {
      throw new Error(`HybridCommand Schema Validation (${data.name}): 'execute' is required and must be a function.`);
    }

    this.name = data.name;
    this.subCommand = data.slashRoute?.includes(" ") ? data.slashRoute : null;
    this.description = data.description;
    this.category = data.category || null;
    this.aliases = data.aliases || [];
    this.usage = data.usage || "";
    this.examples = data.examples || [];
    this.options = data.options || [];
    this.cooldown = data.cooldown || 0;
    this.guildOnly = data.guildOnly ?? false;
    this.nsfw = data.nsfw ?? false;
    this.ownerOnly = data.ownerOnly ?? false;
    this.developerOnly = data.developerOnly ?? false;
    this.defer = data.defer ?? true; // Defaults to true
    this.ephemeral = data.ephemeral ?? false; // Defaults to false
    this.permissions = {
      bot: data.permissions?.bot || [],
      user: data.permissions?.user || [],
    };

    // Store execution logic internally
    this.run = data.execute;

    // Build standard slash command metadata structure for registerCommands.ts
    this.data = {
      name: this.subCommand ? this.name : (data.slashRoute || this.name),
      description: this.description,
      options: this.options,
    };

    // Under-the-hood standard dispatcher matching legacy handlers expectations
    this.execute = async (interactionOrMessage: Message | RepliableInteraction, ...argsOrClient: any[]): Promise<any> => {
      const isInteraction = (interactionOrMessage as any).isCommand?.() ?? false;

      if (isInteraction) {
        const client = argsOrClient[0] as Client;
        const ctx = new CommandContext(interactionOrMessage as RepliableInteraction, [], this.options);

        // Auto-defer if configured
        if (this.defer) {
          await ctx.defer(this.ephemeral);
        }

        return await this.run(ctx, client);
      } else {
        const args = (argsOrClient[0] || []) as string[];
        const client = argsOrClient[1] as Client;
        const message = interactionOrMessage as Message;

        // Automatic required argument validation for prefix command flow
        const resolver = new MessageOptionResolver(message, args, this.options);
        for (const opt of this.options) {
          const isRequired = (opt as any).required;
          if (isRequired) {
            const resolvedValue = resolver.resolved[opt.name];
            if (resolvedValue === undefined || resolvedValue === null) {
              const prefix = config.commands.prefix;
              return await message.reply({
                content: `❌ **Missing required argument:** \`${opt.name}\`\nUsage: \`${prefix}${this.name} ${this.usage || ""}\``,
              });
            }
          }
        }

        const ctx = new CommandContext(message, args, this.options);

        // Auto-defer if configured
        if (this.defer) {
          await ctx.defer(this.ephemeral);
        }

        return await this.run(ctx, client);
      }
    };
  }
}
