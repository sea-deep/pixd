import pkg from "glob";
const { glob } = pkg;
import { pathToFileURL } from "node:url";
import { client } from "../index.js";

try {
  const Files = await glob(
    `${process.cwd().replace(/\\/g, "/")}/Interactions/Buttons/**/*.js`,
  );

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);
    const buttonFile = await import(Files[i]);
    const button = buttonFile.default;

    if (button.name) {
      client.buttons.set(button.name, button);
    }
  }
  console.info(`[INFO] - Buttons Registered!`);
} catch (err) {
  console.error(`[ButtonHandler] -`, err);
}
