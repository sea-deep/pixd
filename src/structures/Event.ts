import { Client } from "discord.js";

/**
 * Interface definition for configuration options of Event Listeners.
 */
export interface EventData {
  /** Event trigger name (e.g. 'ready', 'messageCreate', 'interactionCreate'). */
  event: string;
  /** If the event listener should run once (defaults to false). */
  once?: boolean;
  /** Skip loading this event. */
  disabled?: boolean;
  /** Execution handler callback block: (...args, client) => void. */
  execute: (...args: any[]) => any;
}

/**
 * Metadata Schema for Discord.js Client/Guild events.
 */
export default class Event {
  public event: string;
  public once: boolean;
  public disabled: boolean;
  public execute: (...args: any[]) => any;

  /**
   * @param data - Config parameters.
   */
  constructor(data: EventData) {
    if (!data.event || typeof data.event !== "string") {
      throw new Error("Event Schema Validation: 'event' is required and must be a string.");
    }
    if (!data.execute || typeof data.execute !== "function") {
      throw new Error(`Event Schema Validation (${data.event}): 'execute' is required and must be a function.`);
    }

    this.event = data.event;
    this.once = data.once ?? false;
    this.disabled = data.disabled ?? false;
    this.execute = data.execute;
  }
}
