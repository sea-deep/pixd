import {
  MessageContextMenuCommandInteraction,
  Client,
  PermissionResolvable,
  ApplicationCommandType,
  MessageApplicationCommandData
} from "discord.js";
import { ContextMenuCommandOptions } from "./UserContextMenu.js";

/**
 * Interface definition for Message Context Menu metadata.
 */
export interface MessageContextMenuData {
  /** Command metadata for registration (ContextMenuCommandBuilder, JSON structure, or Object). */
  data: MessageApplicationCommandData | any;
  /** Execution options. */
  options?: ContextMenuCommandOptions;
  /** Main execution callback (interaction, client) => void. */
  execute: (interaction: MessageContextMenuCommandInteraction, client: Client) => any;
}

/**
 * Metadata Schema for Message Context Menu Commands (Right-click Message -> Apps -> Command).
 */
export default class MessageContextMenu {
  public name: string;
  public type: ApplicationCommandType.Message = ApplicationCommandType.Message;
  public data: MessageApplicationCommandData;
  public options: ContextMenuCommandOptions;
  public category: string | null;
  public examples: string[];
  public execute: (interaction: MessageContextMenuCommandInteraction, client: Client) => any;
  public permissions?: {
    bot?: PermissionResolvable[];
    user?: PermissionResolvable[];
  };
  public commandType: "messageContextMenu" = "messageContextMenu";

  /**
   * @param data - Config parameters.
   */
  constructor(data: MessageContextMenuData) {
    if (!data.data || (!data.data.name && typeof data.data.setName !== "function")) {
      throw new Error("MessageContextMenu Schema Validation: 'data' is required and must contain a command name.");
    }
    if (!data.execute || typeof data.execute !== "function") {
      const commandName = typeof data.data.setName === "function" ? data.data.name : data.data.name;
      throw new Error(`MessageContextMenu Schema Validation (${commandName}): 'execute' is required and must be a function.`);
    }

    const commandName = typeof data.data.setName === "function" ? data.data.name : data.data.name;
    const jsonPayload = typeof data.data.toJSON === "function" ? data.data.toJSON() : { ...data.data };

    // Ensure type is ApplicationCommandType.Message
    jsonPayload.type = ApplicationCommandType.Message;

    this.name = commandName;
    this.data = jsonPayload as MessageApplicationCommandData;
    this.options = data.options || {};
    this.execute = data.execute;
    this.category = this.options.category || null;
    this.examples = this.options.examples || [];
    this.permissions = this.options.permissions || { bot: [], user: [] };
  }
}
