import { REST, Routes, type Client } from "discord.js";
import { env } from "../src/utilities/env.js";

export default async function registerCommands(client: Client): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(env.TOKEN);
  const unique = new Map<string, any>();
  for (const command of client.slashCommandsArray) {
    if (unique.has(command.name)) throw new Error(`Duplicate application command '${command.name}'.`);
    unique.set(command.name, command);
  }

  await rest.put(Routes.applicationCommands(env.CLIENT_ID), { body: [...unique.values()] });
  console.info(`[INFO] - ${unique.size} Application Commands Registered!`);
}
