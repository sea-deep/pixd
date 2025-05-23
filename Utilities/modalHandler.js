import chalk from "chalk";
import pkg from "glob";
const { glob } = pkg;
import { pathToFileURL } from "node:url";
import { client } from "../index.js";

try {
  const Files = await glob(
    `${process.cwd().replace(/\\/g, "/")}/Interactions/Modals/**/*.js`,
  );

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);

    const modalFile = await import(Files[i]);
    const modal = modalFile.default;

    if (modal.name) {
      client.modals.set(modal.name, modal);
    }
  }
  console.log("[INFO] - Modals Registered!");
} catch (err) {
  console.error(`[ModalHandler] - ${err}`);
}
