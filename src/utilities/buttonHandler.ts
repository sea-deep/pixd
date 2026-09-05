import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { client } from "../../index.js";
import Logger from "../helpers/Logger.js";
import { getLoaderPattern } from "./pathResolver.js";
import { registerUnique } from "./registry.js";

/**
 * Dynamically registers button click listener handlers.
 */
async function loadButtons(): Promise<void> {
  try {
    const pattern = getLoaderPattern("Interactions/Buttons");
    const files = await glob(pattern);

    for (const file of files.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const module = await import(fileUrl);
      const component = module.default;

      if (component && component.customId) {
        registerUnique(client.buttons, component.customId, component, "button", file);
      }
    }
    Logger.success(`Loaded ${client.buttons.size} Button Components!`);
  } catch (err) {
    Logger.error("Error loading Button Components:", err);
    throw err;
  }
}

await loadButtons();
