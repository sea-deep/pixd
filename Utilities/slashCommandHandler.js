import chalk from "chalk";
import pkg from "glob";
import { pathToFileURL } from "url";
import { client } from "../index.js";

const { glob } = pkg;

try {
  client.slashCommands.clear();
  client.subCommands.clear();

  const Files = await glob(
    `${process.cwd().replace(/\\/g, "/")}/Interactions/SlashCommands/**/*.js`,
  );

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
  console.log("[INFO] - Slash Commands Loaded!");
} catch (err) {
  console.error(`[SlashCommandHandler] - ${err}`);
}
