import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { client } from "../../index.js";
import Logger from "../helpers/Logger.js";
import { getLoaderPattern } from "./pathResolver.js";
import { pushUniqueApplicationCommand, registerUnique } from "./registry.js";

/**
 * Dynamically registers monolithic hybrid commands, binding them
 * as both legacy prefix commands and standard slash commands.
 */
async function loadHybridCommands(): Promise<void> {
  try {
    const pattern = getLoaderPattern("HybridCommands");
    const files = await glob(pattern);

    for (const file of files.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const module = await import(fileUrl);
      const command = module.default;

      if (!command || !command.name) continue;

      // Resolve category fallback based on parent folder name
      if (!command.category) {
        const parts = file.replace(/\\/g, "/").split("/");
        const parentFolder = parts[parts.length - 2];
        command.category = (parentFolder === "HybridCommands" || parentFolder === "dist") ? "general" : parentFolder.toLowerCase();
      } else {
        command.category = command.category.toLowerCase();
      }

      // 1. Register as Prefix Command (with aliases)
      registerUnique(client.prefixCommands, command.name, command, "prefix command", file);
      if (command.aliases && Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          if (!alias) continue;
          registerUnique(client.prefixCommands, alias, command, "prefix alias", file);
        }
      }

      // 2. Register either as a grouped slash subcommand or a top-level command.
      if (command.subCommand) {
        registerUnique(client.subCommands, command.subCommand, command, "hybrid subcommand", file);
      } else {
        registerUnique(client.slashCommands, command.data.name, command, "slash command", file);
        pushUniqueApplicationCommand(client.slashCommandsArray, command.data, file);
      }
    }

    Logger.success(`Loaded ${files.length} Hybrid Commands!`);
  } catch (err) {
    Logger.error("Error loading Hybrid Commands:", err);
    throw err;
  }
}

await loadHybridCommands();
