import pkg from "glob";
const { glob } = pkg;
import { pathToFileURL } from "node:url";
import { client } from "../index.js";
import { loaderPattern } from "./loaderPattern.js";

try {
  const Files = (await glob(loaderPattern("Interactions/Buttons"))).sort();

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);
    const buttonFile = await import(Files[i]);
    const button = buttonFile.default;

    if (button.name) {
      if (client.buttons.has(button.name)) throw new Error(`Duplicate button '${button.name}' in ${Files[i]}`);
      client.buttons.set(button.name, button);
    }
  }
  console.info(`[INFO] - Buttons Registered!`);
} catch (err) {
  console.error(`[ButtonHandler] -`, err);
}
