import { ChatInputCommandInteraction, Client, ApplicationCommandOptionData } from "discord.js";

/**
 * Interface definition for configuration options of Subcommands.
 */
export interface SubCommandData {
  /** The subcommand signature formatted as "parent subcommand" or "parent group subcommand" (e.g. "hello world"). */
  subCommand: string;
  /** Subcommand description (used for dynamically building documentation). */
  description?: string;
  /** Command positional options (used for dynamically building documentation). */
  options?: ApplicationCommandOptionData[];
  /** Subcommand execution callback. */
  execute: (interaction: ChatInputCommandInteraction, client: Client) => any;
}

/**
 * Metadata Schema for individual Subcommand files.
 */
export default class SubCommand {
  public subCommand: string;
  public description: string;
  public options: ApplicationCommandOptionData[];
  public execute: (interaction: ChatInputCommandInteraction, client: Client) => any;

  /**
   * @param data - Config parameters.
   */
  constructor(data: SubCommandData) {
    if (!data.subCommand || typeof data.subCommand !== "string") {
      throw new Error("SubCommand Schema Validation: 'subCommand' is required and must be a string.");
    }
    if (!data.subCommand.includes(" ")) {
      throw new Error(`SubCommand Schema Validation (${data.subCommand}): 'subCommand' signature must include a space linking to the parent, e.g. "hello world".`);
    }
    if (!data.execute || typeof data.execute !== "function") {
      throw new Error(`SubCommand Schema Validation (${data.subCommand}): 'execute' is required and must be a function.`);
    }

    this.subCommand = data.subCommand;
    this.description = data.description || "";
    this.options = data.options || [];
    this.execute = data.execute;
  }
}
