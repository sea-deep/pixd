import { Collection } from "discord.js";

/** Register one routed object without allowing filesystem order to hide collisions. */
export function registerUnique<T>(
  collection: Collection<string, T>,
  key: string,
  value: T,
  kind: string,
  source: string,
): void {
  if (collection.has(key)) {
    throw new Error(`Duplicate ${kind} registration '${key}' from ${source}`);
  }
  collection.set(key, value);
}

/** Add application-command JSON while enforcing Discord's per-scope name uniqueness. */
export function pushUniqueApplicationCommand(commands: any[], data: any, source: string): void {
  if (commands.some((command) => command.name === data.name)) {
    throw new Error(`Duplicate application command registration '${data.name}' from ${source}`);
  }
  commands.push(data);
}
