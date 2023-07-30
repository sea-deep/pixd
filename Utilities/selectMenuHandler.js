import chalk from "chalk";
import pkg from "glob";
const { glob } = pkg
import { promisify } from "node:util";
const proGlob = promisify(glob);
import { pathToFileURL } from "node:url";
import { client } from "../index.js";

try {
  const Files = await proGlob(`${process.cwd().replace(/\\/g, "/")}/Interactions/SelectMenu/**/*.js`);

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);

    const menuFile = await import(Files[i]);
    const selectMenu = menuFile.default;
    if (selectMenu.name) {
      client.selectMenus.set(selectMenu.name, selectMenu);
    }
  }
  process.stdout.write(`[${chalk.blue("INFO")}] - SelectMenus Registered!\n`);
} catch (err) {
  process.stdout.write(`[${chalk.red("SelectMenuHandler")}] - ${err}\n`);
}
