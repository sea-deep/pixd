import chalk from "chalk";
import pkg from "glob";
import { promisify } from "util";
import { pathToFileURL } from "url";
import { client } from "../index.js";

const { glob } = pkg;
const proGlob = promisify(glob);

try {
  client.messageSelectMenus.clear();

  const Files = await proGlob(
    `${process.cwd().replace(/\\/g, "/")}/Interactions/MessageSelectMenuCommands/**/*.js`,
  );

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);
    const interactionFile = await import(Files[i]);
    const interaction = interactionFile.default;
    client.messageSelectMenus.set(interaction.data.name, interaction);
  }
} catch (err) {
  const errorOutput = `[${chalk.red("MessageSelectMenuHandler")}] - ${err}`;
  process.stderr.write(`${errorOutput}\n`);
}
