import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { client } from "../../index.js";
import Logger from "../helpers/Logger.js";
import { getLoaderPattern } from "./pathResolver.js";
import { pushUniqueApplicationCommand, registerUnique } from "./registry.js";

client.slashCommandsArray.length = 0;

/**
 * Dynamically registers standard application commands and subcommands.
 */
async function loadSlashCommands(): Promise<void> {
  try {
    const pattern = getLoaderPattern("Interactions/SlashCommands");
    const files = await glob(pattern);

    for (const file of files.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const module = await import(fileUrl);
      const command = module.default;

      if (!command) continue;

      if (command.subCommand) {
        registerUnique(client.subCommands, command.subCommand, command, "subcommand", file);
        continue;
      }

      if (command.data && command.data.name) {
        // Resolve category fallback based on parent folder name
        if (!command.category) {
          const parts = file.replace(/\\/g, "/").split("/");
          const parentFolder = parts[parts.length - 2];
          command.category = (parentFolder === "SlashCommands" || parentFolder === "dist") ? "general" : parentFolder.toLowerCase();
        } else {
          command.category = command.category.toLowerCase();
        }

        registerUnique(client.slashCommands, command.data.name, command, "slash command", file);
        pushUniqueApplicationCommand(client.slashCommandsArray, command.data, file);
      }
    }
    Logger.success(`Loaded ${client.slashCommands.size} Slash Commands and ${client.subCommands.size} Subcommands!`);
  } catch (err) {
    Logger.error("Error loading Slash Commands:", err);
    throw err;
  }
}

await loadSlashCommands();
