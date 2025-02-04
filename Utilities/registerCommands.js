import chalk from "chalk";
import pkg from "glob";
import { pathToFileURL } from "url";

const { glob } = pkg;

const clientId = "1026234292017299586";

const SlashCommands = await glob(
  `${process.cwd().replace(/\\/g, "/")}/Interactions/SlashCommands/**/*.js`,
);
const MessageSelectMenuCommands = await glob(
  `${process.cwd().replace(/\\/g, "/")}/Interactions/MessageSelectMenuCommands/**/*.js`,
);
const Files = SlashCommands.concat(MessageSelectMenuCommands);

const commandsArray = [];
for (let i = 0; i < Files.length; i++) {
  Files[i] = pathToFileURL(Files[i]);
  const interactionFile = await import(Files[i]);
  const interaction = interactionFile.default;
  if (interaction.data) {
    commandsArray.push(interaction.data);
  }
}
// console.log(commandsArray)
const url = `https://discord.com/api/v10/applications/${clientId}/commands`;
const headers = {
  Authorization: `Bot ${process.env.TOKEN}`,
  "Content-Type": "application/json",
};

try {
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(commandsArray),
  });

  if (response.ok) {
    const infoMessage = `[${chalk.blue("INFO")}] - Application Commands Registered!`;
    process.stdout.write(`${infoMessage}\n`);
  } else {
    const errorMessage = await response.text();
    const errorOutput = `[${chalk.red("CommandRegister")}] - ${errorMessage}`;
    process.stderr.write(`${errorOutput}\n`);
  }
} catch (err) {
  const errorOutput = `[${chalk.red("CommandRegister")}] - ${JSON.stringify(err, null, 2)}`;
  process.stderr.write(`${errorOutput}\n`);
}
