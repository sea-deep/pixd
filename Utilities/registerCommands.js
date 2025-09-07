import chalk from "chalk";
import pkg from "glob";
import { pathToFileURL } from "url";

const { glob } = pkg;

const clientId = process.env.CLIENT_ID;

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
    console.log("[INFO] - Application Commands Registered!");
  } else {
    const errorMessage = await response.text();
    console.error(`[CommandRegister] - ${errorMessage}`);
  }
} catch (err) {
  console.error(`[CommandRegister] - ${JSON.stringify(err, null, 2)}`);
}
