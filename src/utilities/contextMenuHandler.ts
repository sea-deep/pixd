import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { client } from "../../index.js";
import Logger from "../helpers/Logger.js";
import { getLoaderPattern } from "./pathResolver.js";
import { pushUniqueApplicationCommand, registerUnique } from "./registry.js";

/**
 * Dynamically registers User and Message Context Menu application commands.
 */
async function loadContextMenus(): Promise<void> {
  try {
    const userPattern = getLoaderPattern("Interactions/UserContextMenus");
    const userFiles = await glob(userPattern);

    for (const file of userFiles.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const module = await import(fileUrl);
      const command = module.default;

      if (!command || !command.data || !command.name) continue;

      // Resolve category fallback based on parent folder name
      if (!command.category) {
        const parts = file.replace(/\\/g, "/").split("/");
        const parentFolder = parts[parts.length - 2];
        command.category = (parentFolder === "UserContextMenus" || parentFolder === "dist") ? "general" : parentFolder.toLowerCase();
      } else {
        command.category = command.category.toLowerCase();
      }

      registerUnique(client.userContextMenus, command.name, command, "user context menu", file);
      pushUniqueApplicationCommand(client.slashCommandsArray, command.data, file);
    }

    const messagePattern = getLoaderPattern("Interactions/MessageContextMenus");
    const messageFiles = await glob(messagePattern);

    for (const file of messageFiles.sort()) {
      const fileUrl = pathToFileURL(file).href;
      const module = await import(fileUrl);
      const command = module.default;

      if (!command || !command.data || !command.name) continue;

      // Resolve category fallback based on parent folder name
      if (!command.category) {
        const parts = file.replace(/\\/g, "/").split("/");
        const parentFolder = parts[parts.length - 2];
        command.category = (parentFolder === "MessageContextMenus" || parentFolder === "dist") ? "general" : parentFolder.toLowerCase();
      } else {
        command.category = command.category.toLowerCase();
      }

      registerUnique(client.messageContextMenus, command.name, command, "message context menu", file);
      pushUniqueApplicationCommand(client.slashCommandsArray, command.data, file);
    }

    Logger.success(`Loaded ${client.userContextMenus.size} User Context Menus and ${client.messageContextMenus.size} Message Context Menus!`);
  } catch (err) {
    Logger.error("Error loading Context Menus:", err);
    throw err;
  }
}

await loadContextMenus();
