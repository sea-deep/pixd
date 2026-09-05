import { glob } from "glob";
import { pathToFileURL } from "node:url";
import { client } from "../index.js";
import { loaderPattern } from "./loaderPattern.js";

const files = (await glob(loaderPattern("HybridCommands"))).sort();
for (const file of files) {
  const command = (await import(pathToFileURL(file).href)).default;
  if (!command?.name) continue;
  if (client.prefixCommands.has(command.name) || client.slashCommands.has(command.name)) {
    throw new Error(`Duplicate hybrid command '${command.name}' from ${file}`);
  }
  client.prefixCommands.set(command.name, command);
  for (const alias of command.aliases ?? []) {
    if (!alias) continue;
    if (client.prefixCommands.has(alias)) throw new Error(`Duplicate prefix alias '${alias}' from ${file}`);
    client.prefixCommands.set(alias, command);
  }
  client.slashCommands.set(command.name, command);
  client.slashCommandsArray.push(command.data);
}
console.info(`[INFO] - ${files.length} Hybrid Commands Loaded!`);
