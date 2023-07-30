import { REST, Routes } from "discord.js";
import chalk from "chalk";
import pkg from "glob";
const { glob } = pkg
import { promisify } from "node:util";
const proGlob = promisify(glob);
import { pathToFileURL } from "node:url";
import { client } from "../index.js";

try {
  client.slashCommands.clear();
  client.subCommands.clear();

  const Files = await proGlob(`${process.cwd().replace(/\\/g, "/")}/Interactions/SlashCommands/**/*.js`);

  client.interactionsArray = [];

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);
    const interactionFile = await import(Files[i]);
    const interaction = interactionFile.default;
    if (interaction.subCommand) {
      client.subCommands.set(interaction.subCommand, interaction);
      continue;
    }

    client.slashCommands.set(interaction.data.name, interaction);
    client.interactionsArray.push(interaction.data);
  }
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    const clientId = "1026234292017299586";
    
      await rest.put(Routes.applicationCommands(clientId), {
        body: client.interactionsArray,
      });
     process.stdout.write(`[${chalk.blue("INFO")}] - Slash Command Registered!\n`);
  } catch (err) {
    process.stdout.write(`[${chalk.red("SlashCommandHandler")}] - ${err}\n`);
  }
} catch (err) {
  process.stdout.write(`[${chalk.red("SlashCommandHandler")}] - ${err}\n`)
}
