import pkg from "glob";
import { pathToFileURL } from "url";
import { client } from "../index.js";

const { glob } = pkg;

try {
  client.messageSelectMenus.clear();

  const Files = await glob(
    `${process.cwd().replace(/\\/g, "/")}/Interactions/MessageSelectMenuCommands/**/*.js`,
  );

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);
    const interactionFile = await import(Files[i]);
    const interaction = interactionFile.default;
    client.messageSelectMenus.set(interaction.data.name, interaction);
  }
} catch (err) {
  console.error(`[MessageSelectMenuHandler] -`, err)
}
