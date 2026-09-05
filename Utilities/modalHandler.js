import chalk from "chalk";
import pkg from "glob";
const { glob } = pkg;
import { pathToFileURL } from "node:url";
import { client } from "../index.js";
import { loaderPattern } from "./loaderPattern.js";

try {
  const Files = (await glob(loaderPattern("Interactions/Modals"))).sort();

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);

    const modalFile = await import(Files[i]);
    const modal = modalFile.default;

    if (modal.name) {
      if (client.modals.has(modal.name)) throw new Error(`Duplicate modal '${modal.name}' in ${Files[i]}`);
      client.modals.set(modal.name, modal);
    }
  }
  console.log("[INFO] - Modals Registered!");
} catch (err) {
  console.error(`[ModalHandler] - ${err}`);
}
