import chalk from "chalk";
import pkg from "glob";
import { promisify } from "util";
import { pathToFileURL } from "url";
import { client } from "../index.js";

const { glob } = pkg;
const proGlob = promisify(glob);

try {
  client.slashCommands.clear();
  client.subCommands.clear();

  const Files = await proGlob(`${process.cwd().replace(/\\/g, "/")}/Interactions/SlashCommands/**/*.js`);

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);
    const interactionFile = await import(Files[i]);
    const interaction = interactionFile.default;
    if (interaction.subCommand) {
      client.subCommands.set(interaction.subCommand, interaction);
      continue;
    }

    client.slashCommands.set(interaction.data.name, interaction);
  }
  const infoMessage = `[${chalk.blue("INFO")}] - Slash Commands Loaded!`;
    process.stdout.write(`${infoMessage}\n`);

} catch (err) {
  const errorOutput = `[${chalk.red("SlashCommandHandler")}] - ${err}`;
  process.stderr.write(`${errorOutput}\n`);
}
