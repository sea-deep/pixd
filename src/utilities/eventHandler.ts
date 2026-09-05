import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { client } from "../../index.js";
import Logger from "../helpers/Logger.js";
import { getLoaderPattern } from "./pathResolver.js";

/**
 * Dynamically registers all client and guild event listeners located in the events folder.
 */
async function loadEvents(): Promise<void> {
  try {
    const pattern = getLoaderPattern("events");
    const files = await glob(pattern);

    for (const file of files.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const module = await import(fileUrl);
      const eventObj = module.default;

      if (!eventObj || !eventObj.event || !eventObj.execute) continue;

      if (eventObj.disabled) {
        Logger.warn(`Skipping disabled event: ${eventObj.event}`);
        continue;
      }

      const once = eventObj.once ?? false;

      // Bind to the client instance
      client[once ? "once" : "on"](eventObj.event, async (...args: any[]) => {
        try {
          await eventObj.execute(...args, client);
        } catch (err) {
          Logger.error(`Error in event listener (${eventObj.event}):`, err);
        }
      });
    }
    Logger.success(`Loaded ${files.length} Event Listeners!`);
  } catch (err) {
    Logger.error("Error loading Events:", err);
    throw err;
  }
}

await loadEvents();
