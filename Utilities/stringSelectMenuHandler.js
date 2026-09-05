import chalk from "chalk";
import pkg from "glob";
const { glob } = pkg;
import { pathToFileURL } from "node:url";
import { client } from "../index.js";
import { loaderPattern } from "./loaderPattern.js";

try {
  const Files = (await glob(loaderPattern("Interactions/StringSelectMenu"))).sort();

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);

    const menuFile = await import(Files[i]);
    const stringSelectMenu = menuFile.default;
    if (stringSelectMenu.name) {
      if (client.stringSelectMenus.has(stringSelectMenu.name)) throw new Error(`Duplicate select menu '${stringSelectMenu.name}' in ${Files[i]}`);
      client.stringSelectMenus.set(stringSelectMenu.name, stringSelectMenu);
    }
  }
  console.log("[INFO] - StringSelectMenus Loaded!");
} catch (err) {
  console.error(`[StringSelectMenuHandler] - ${err}`);
}
