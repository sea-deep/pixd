import { ChatInputCommandInteraction, Client, PermissionResolvable, ChatInputApplicationCommandData } from "discord.js";

/**
 * Interface definition for configuration options of Slash commands.
 */
export interface SlashCommandOptions {
  /** Command category name. */
  category?: string;
  /** Examples of command usage (without prefix). */
  examples?: string[];
  /** Command cooldown in milliseconds. */
  cooldown?: number;
  /** Limit command to owner only. */
  ownerOnly?: boolean;
  /** Limit command to developers only. */
  developerOnly?: boolean;
  /** Enforce command execution inside servers only. */
  guildOnly?: boolean;
  /** Require nsfw channel trigger. */
  nsfw?: boolean;
  /** Required permissions. */
  permissions?: {
    bot?: PermissionResolvable[];
    user?: PermissionResolvable[];
  };
}

/**
 * Interface definition for Slash commands metadata.
 */
export interface SlashCommandData {
  /** Command metadata for registration (SlashCommandBuilder, JSON structure, or Object). */
  data: ChatInputApplicationCommandData | any;
  /** Execution options. */
  options?: SlashCommandOptions;
  /** Main execution callback (interaction, client) => void (Omit if subcommands are routed dynamically). */
  execute?: (interaction: ChatInputCommandInteraction, client: Client) => any;
}

/**
 * Metadata Schema for Slash / Application Commands.
 */
export default class SlashCommand {
  public name: string;
  public data: ChatInputApplicationCommandData;
  public options: SlashCommandOptions;
  public category: string | null;
  public examples: string[];
  public execute: ((interaction: ChatInputCommandInteraction, client: Client) => any) | null;
  public permissions?: {
    bot?: PermissionResolvable[];
    user?: PermissionResolvable[];
  };
  public commandType: "slash" = "slash";

  /**
   * @param data - Config parameters.
   */
  constructor(data: SlashCommandData) {
    if (!data.data || (!data.data.name && typeof data.data.setName !== "function")) {
      throw new Error("SlashCommand Schema Validation: 'data' is required and must contain a command name.");
    }

    const commandName = typeof data.data.setName === "function" ? data.data.name : data.data.name;

    this.name = commandName;
    this.data = typeof data.data.toJSON === "function" ? data.data.toJSON() : data.data;
    this.options = data.options || {};
    this.execute = data.execute || null;
    this.category = this.options.category || null;
    this.examples = this.options.examples || [];
    this.permissions = this.options.permissions || { bot: [], user: [] };

    if (!this.execute && (!this.data.options || !this.data.options.some((opt: any) => opt.type === 1))) {
      throw new Error(`SlashCommand Schema Validation (${commandName}): 'execute' function is required if there are no subcommands.`);
    }
  }
}
