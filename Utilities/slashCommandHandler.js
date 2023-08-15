import chalk from "chalk";
import pkg from "glob";
import { promisify } from "util";
import { pathToFileURL } from "url";
import { client } from "../index.js";
import fetch from "node-fetch";

const { glob } = pkg;
const proGlob = promisify(glob);

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

  await registerSlashCommands(client.interactionsArray);
} catch (err) {
  const errorOutput = `[${chalk.red("SlashCommandHandler")}] - ${err}`;
  process.stderr.write(`${errorOutput}\n`);
}



// Helper API function 
async function registerSlashCommands(commandsArray) {
  const clientId = "1026234292017299586";
  const url = `https://discord.com/api/v10/applications/${clientId}/commands`;
  const headers = {
    "Authorization": `Bot ${process.env.TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(commandsArray),
    });

    if (response.ok) {
      const infoMessage = `[${chalk.blue("INFO")}] - Slash Command Registered!`;
      process.stdout.write(`${infoMessage}\n`);
    } else {
      const errorMessage = await response.text();
      const errorOutput = `[${chalk.red("SlashCommandHandler")}] - ${errorMessage}`;
      process.stderr.write(`${errorOutput}\n`);
    }
  } catch (err) {
    const errorOutput = `[${chalk.red("SlashCommandHandler")}] - ${err}`;
    process.stderr.write(`${errorOutput}\n`);
  }
}