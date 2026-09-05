import {
  UserContextMenuCommandInteraction,
  Client,
  PermissionResolvable,
  ApplicationCommandType,
  UserApplicationCommandData
} from "discord.js";

/**
 * Interface definition for configuration options of Context Menu commands.
 */
export interface ContextMenuCommandOptions {
  /** Command category name. */
  category?: string;
  /** Examples of command usage. */
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
 * Interface definition for User Context Menu metadata.
 */
export interface UserContextMenuData {
  /** Command metadata for registration (ContextMenuCommandBuilder, JSON structure, or Object). */
  data: UserApplicationCommandData | any;
  /** Execution options. */
  options?: ContextMenuCommandOptions;
  /** Main execution callback (interaction, client) => void. */
  execute: (interaction: UserContextMenuCommandInteraction, client: Client) => any;
}

/**
 * Metadata Schema for User Context Menu Commands (Right-click User -> Apps -> Command).
 */
export default class UserContextMenu {
  public name: string;
  public type: ApplicationCommandType.User = ApplicationCommandType.User;
  public data: UserApplicationCommandData;
  public options: ContextMenuCommandOptions;
  public category: string | null;
  public examples: string[];
  public execute: (interaction: UserContextMenuCommandInteraction, client: Client) => any;
  public permissions?: {
    bot?: PermissionResolvable[];
    user?: PermissionResolvable[];
  };
  public commandType: "userContextMenu" = "userContextMenu";

  /**
   * @param data - Config parameters.
   */
  constructor(data: UserContextMenuData) {
    if (!data.data || (!data.data.name && typeof data.data.setName !== "function")) {
      throw new Error("UserContextMenu Schema Validation: 'data' is required and must contain a command name.");
    }
    if (!data.execute || typeof data.execute !== "function") {
      const commandName = typeof data.data.setName === "function" ? data.data.name : data.data.name;
      throw new Error(`UserContextMenu Schema Validation (${commandName}): 'execute' is required and must be a function.`);
    }

    const commandName = typeof data.data.setName === "function" ? data.data.name : data.data.name;
    const jsonPayload = typeof data.data.toJSON === "function" ? data.data.toJSON() : { ...data.data };

    // Ensure type is ApplicationCommandType.User
    jsonPayload.type = ApplicationCommandType.User;

    this.name = commandName;
    this.data = jsonPayload as UserApplicationCommandData;
    this.options = data.options || {};
    this.execute = data.execute;
    this.category = this.options.category || null;
    this.examples = this.options.examples || [];
    this.permissions = this.options.permissions || { bot: [], user: [] };
  }
}
