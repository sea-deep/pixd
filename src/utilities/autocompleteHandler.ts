import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { client } from "../../index.js";
import Logger from "../helpers/Logger.js";
import { getLoaderPattern } from "./pathResolver.js";
import { registerUnique } from "./registry.js";

/**
 * Dynamically registers autocomplete suggestion response handlers.
 */
async function loadAutocompletes(): Promise<void> {
  try {
    const pattern = getLoaderPattern("Interactions/Autocomplete");
    const files = await glob(pattern);

    for (const file of files.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const module = await import(fileUrl);
      const component = module.default;

      if (component && component.name) {
        registerUnique(client.autocompletes, component.name, component, "autocomplete", file);
      }
    }
    Logger.success(`Loaded ${client.autocompletes.size} Autocomplete Components!`);
  } catch (err) {
    Logger.error("Error loading Autocomplete Components:", err);
    throw err;
  }
}

await loadAutocompletes();
