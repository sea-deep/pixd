import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { client } from "../../index.js";
import Logger from "../helpers/Logger.js";
import { getLoaderPattern } from "./pathResolver.js";
import { registerUnique } from "./registry.js";

/**
 * Dynamically registers all 5 types of select menu interaction handlers.
 */
async function loadSelectMenus(): Promise<void> {
  try {
    const pattern = getLoaderPattern("Interactions/*Select");
    const files = await glob(pattern);

    for (const file of files.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const module = await import(fileUrl);
      const component = module.default;

      if (!component || !component.customId || !component.type) continue;

      switch (component.type) {
        case "stringSelect":
          registerUnique(client.stringSelectMenus, component.customId, component, "string select", file);
          break;
        case "userSelect":
          registerUnique(client.userSelectMenus, component.customId, component, "user select", file);
          break;
        case "roleSelect":
          registerUnique(client.roleSelectMenus, component.customId, component, "role select", file);
          break;
        case "mentionableSelect":
          registerUnique(client.mentionableSelectMenus, component.customId, component, "mentionable select", file);
          break;
        case "channelSelect":
          registerUnique(client.channelSelectMenus, component.customId, component, "channel select", file);
          break;
        default:
          Logger.warn(`Unknown select menu type '${component.type}' in file: ${file}`);
          continue;
      }
    }
    const total =
      client.stringSelectMenus.size +
      client.userSelectMenus.size +
      client.roleSelectMenus.size +
      client.mentionableSelectMenus.size +
      client.channelSelectMenus.size;

    Logger.success(`Loaded ${total} Select Menu Components!`);
  } catch (err) {
    Logger.error("Error loading Select Menu Components:", err);
    throw err;
  }
}

await loadSelectMenus();
