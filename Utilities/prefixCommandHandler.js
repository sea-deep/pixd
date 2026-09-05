import pkg from "glob";
const { glob } = pkg;
import { pathToFileURL } from "node:url";
import { client } from "../index.js";
import { loaderPattern } from "./loaderPattern.js";

try {
  const Files = (await glob(loaderPattern("PrefixCommands"))).sort();

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);
    //  console.log(Files[i])
    const commandFile = await import(Files[i]);
    const command = commandFile.default;
    if (command.name) {
      if (client.prefixCommands.has(command.name)) throw new Error(`Duplicate prefix command '${command.name}' in ${Files[i]}`);
      client.prefixCommands.set(command.name, command);
    }
  }
  console.info(`[INFO] - Prefix Commands Loaded!\n`);
} catch (err) {
  console.error("[PrefixCommandHandler]", err);
}
