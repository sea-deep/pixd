import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { client } from "../../index.js";
import Logger from "../helpers/Logger.js";
import { getLoaderPattern } from "./pathResolver.js";
import { registerUnique } from "./registry.js";

/**
 * Dynamically registers modal form submission handlers.
 */
async function loadModals(): Promise<void> {
  try {
    const pattern = getLoaderPattern("Interactions/Modals");
    const files = await glob(pattern);

    for (const file of files.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const module = await import(fileUrl);
      const component = module.default;

      if (component && component.customId) {
        registerUnique(client.modals, component.customId, component, "modal", file);
      }
    }
    Logger.success(`Loaded ${client.modals.size} Modal Components!`);
  } catch (err) {
    Logger.error("Error loading Modal Components:", err);
    throw err;
  }
}

await loadModals();
