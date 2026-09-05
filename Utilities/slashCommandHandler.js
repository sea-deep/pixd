import chalk from "chalk";
import pkg from "glob";
import { pathToFileURL } from "url";
import { client } from "../index.js";
import { loaderPattern } from "./loaderPattern.js";

const { glob } = pkg;

try {
  client.slashCommands.clear();
  client.subCommands.clear();
  client.slashCommandsArray.length = 0;

  const Files = (await glob(loaderPattern("Interactions/SlashCommands"))).sort();

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);
    const interactionFile = await import(Files[i]);
    const interaction = interactionFile.default;
    if (interaction.subCommand) {
      if (client.subCommands.has(interaction.subCommand)) throw new Error(`Duplicate subcommand '${interaction.subCommand}' in ${Files[i]}`);
      client.subCommands.set(interaction.subCommand, interaction);
      continue;
    }

    if (client.slashCommands.has(interaction.data.name)) throw new Error(`Duplicate slash command '${interaction.data.name}' in ${Files[i]}`);
    client.slashCommands.set(interaction.data.name, interaction);
    client.slashCommandsArray.push(interaction.data);
  }
  console.log("[INFO] - Slash Commands Loaded!");
} catch (err) {
  console.error(`[SlashCommandHandler] - ${err}`);
}
