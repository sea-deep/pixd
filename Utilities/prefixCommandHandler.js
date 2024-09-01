import pkg from "glob";
const { glob } = pkg;
import { pathToFileURL } from "node:url";
import { client } from "../index.js";

try {
  const Files = await glob(
    `${process.cwd().replace(/\\/g, "/")}/PrefixCommands/**/*.js`,
  );

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);
    //  console.log(Files[i])
    const commandFile = await import(Files[i]);
    const command = commandFile.default;
    if (command.name) {
      client.prefixCommands.set(command.name, command);
    }
  }
  console.info(`[INFO] - Prefix Commands Loaded!\n`);
} catch (err) {
  console.error("[PrefixCommandHandler]", err);
}
