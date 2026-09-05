import { AutocompleteInteraction, Client } from "discord.js";

/**
 * Interface definition for configuration options of Autocompletes.
 */
export interface AutocompleteData {
  /** Name of the application command associated with the autocomplete. */
  name: string;
  /** Autocomplete execution callback. */
  execute: (interaction: AutocompleteInteraction, client: Client) => any;
}

/**
 * Metadata Schema for Autocomplete interactions.
 */
export default class Autocomplete {
  public name: string;
  public execute: (interaction: AutocompleteInteraction, client: Client) => any;

  /**
   * @param data - Config parameters.
   */
  constructor(data: AutocompleteData) {
    if (!data.name || typeof data.name !== "string") {
      throw new Error("Autocomplete Schema Validation: 'name' is required and must be a string.");
    }
    if (!data.execute || typeof data.execute !== "function") {
      throw new Error(`Autocomplete Schema Validation (${data.name}): 'execute' is required and must be a function.`);
    }

    this.name = data.name;
    this.execute = data.execute;
  }
}
