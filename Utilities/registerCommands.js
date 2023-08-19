import chalk from "chalk";
import pkg from "glob";
import { promisify } from "util";
import { pathToFileURL } from "url";
import fetch from "node-fetch";

const { glob } = pkg;
const proGlob = promisify(glob);

const clientId = "1026234292017299586";

const SlashCommands = await proGlob(`${process.cwd().replace(/\\/g, "/")}/Interactions/SlashCommands/**/*.js`);
const MessageSelectMenuCommands = await proGlob(`${process.cwd().replace(/\\/g, "/")}/Interactions/MessageSelectMenuCommands/**/*.js`);
const Files = SlashCommands.concat(MessageSelectMenuCommands);

const commandsArray = [];
for (let i = 0; i < Files.length; i++) {
  Files[i] = pathToFileURL(Files[i]);
  const interactionFile = await import(Files[i]);
  const interaction = interactionFile.default;
  commandsArray.push(interaction.data);
}

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
