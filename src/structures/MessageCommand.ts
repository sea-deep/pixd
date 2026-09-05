import { Message, Client, PermissionResolvable } from "discord.js";

/**
 * Interface definition for prefix message commands.
 */
export interface MessageCommandData {
  /** The command name (lower case, alphanumeric). */
  name: string;
  /** Command description. */
  description?: string;
  /** Command category name (defaults to parent folder). */
  category?: string;
  /** Command aliases. */
  aliases?: string[];
  /** Usage pattern instructions (e.g. "<user> [reason]"). */
  usage?: string;
  /** Example usage strings (without prefix). */
  examples?: string[];
  /** Enforce command execution inside servers only. */
  guildOnly?: boolean;
  /** Enforce command has parameters passed. */
  args?: boolean;
  /** Required permissions. */
  permissions?: {
    bot?: PermissionResolvable[];
    user?: PermissionResolvable[];
  };
  /** Command cooldown in milliseconds. */
  cooldown?: number;
  /** Require nsfw channel trigger. */
  nsfw?: boolean;
  /** Limit command to owner only. */
  ownerOnly?: boolean;
  /** Limit command to developers only. */
  developerOnly?: boolean;
  /** Command execution callback block. */
  execute: (message: Message, args: string[], client: Client) => any;
}

/**
 * Metadata Schema for legacy/prefix message commands.
 */
export default class MessageCommand {
  public name: string;
  public description: string;
  public category: string | null;
  public aliases: string[];
  public usage: string;
  public examples: string[];
  public guildOnly: boolean;
  public args: boolean;
  public permissions: {
    bot: PermissionResolvable[];
    user: PermissionResolvable[];
  };
  public cooldown: number;
  public nsfw: boolean;
  public ownerOnly: boolean;
  public developerOnly: boolean;
  public execute: (message: Message, args: string[], client: Client) => any;
  public commandType: "prefix" = "prefix";

  /**
   * @param data - Config parameters.
   */
  constructor(data: MessageCommandData) {
    if (!data.name || typeof data.name !== "string") {
      throw new Error("MessageCommand Schema Validation: 'name' is required and must be a string.");
    }
    if (!data.execute || typeof data.execute !== "function") {
      throw new Error(`MessageCommand Schema Validation (${data.name}): 'execute' is required and must be a function.`);
    }

    this.name = data.name;
    this.description = data.description || "";
    this.category = data.category || null;
    this.aliases = data.aliases || [];
    this.usage = data.usage || "";
    this.examples = data.examples || [];
    this.guildOnly = data.guildOnly ?? false;
    this.args = data.args ?? false;
    this.permissions = {
      bot: data.permissions?.bot || [],
      user: data.permissions?.user || [],
    };
    this.cooldown = data.cooldown || 0;
    this.nsfw = data.nsfw ?? false;
    this.ownerOnly = data.ownerOnly ?? false;
    this.developerOnly = data.developerOnly ?? false;
    this.execute = data.execute;
  }
}
