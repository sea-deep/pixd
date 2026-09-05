import { Client, ButtonInteraction, AnySelectMenuInteraction, ModalSubmitInteraction } from "discord.js";

export type ComponentInteraction = ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction;

/**
 * Interface definition for component interactions (Buttons, Modals, Select Menus).
 */
export interface ComponentData {
  /** Component custom identifier (supports prefix matching with split parameters, e.g. "my-btn"). */
  customId: string;
  /** Component type identifier. */
  type: 'button' | 'modal' | 'stringSelect' | 'userSelect' | 'roleSelect' | 'mentionableSelect' | 'channelSelect';
  /** Settings/restrictions block. */
  options?: {
    /** If anyone can interact with the component (defaults to true). */
    public?: boolean;
    /** If only the bot owner can interact. */
    ownerOnly?: boolean;
  };
  /** Execution callback block. */
  execute: (interaction: ComponentInteraction | any, client: Client, ...params: string[]) => any;
}

/**
 * Metadata Schema for Buttons, Modals, and 5 distinct Select Menus.
 */
export default class Component {
  public customId: string;
  public type: 'button' | 'modal' | 'stringSelect' | 'userSelect' | 'roleSelect' | 'mentionableSelect' | 'channelSelect';
  public options: {
    public: boolean;
    ownerOnly: boolean;
  };
  public execute: (interaction: ComponentInteraction | any, client: Client, ...params: string[]) => any;

  /**
   * @param data - Config parameters.
   */
  constructor(data: ComponentData) {
    const validTypes = [
      "button",
      "modal",
      "stringSelect",
      "userSelect",
      "roleSelect",
      "mentionableSelect",
      "channelSelect",
    ];

    if (!data.customId || typeof data.customId !== "string") {
      throw new Error("Component Schema Validation: 'customId' is required and must be a string.");
    }
    if (!data.type || !validTypes.includes(data.type)) {
      throw new Error(`Component Schema Validation (${data.customId}): 'type' must be one of: ${validTypes.join(", ")}`);
    }
    if (!data.execute || typeof data.execute !== "function") {
      throw new Error(`Component Schema Validation (${data.customId}): 'execute' is required and must be a function.`);
    }

    this.customId = data.customId;
    this.type = data.type;
    this.options = {
      public: data.options?.public ?? true,
      ownerOnly: data.options?.ownerOnly ?? false,
    };
    this.execute = data.execute;
  }
}
