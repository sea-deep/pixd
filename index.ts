import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import mongoose from "mongoose";
import { env } from "./src/utilities/env.js";
import Logger from "./src/helpers/Logger.js";
import config from "./Configs/config.js";
import { KeyValueStore, MongodbKeyValue, sleep } from "./Helpers/helperUtil.js";
import MusicManager from "./src/services/music/MusicManager.js";

declare module "discord.js" {
  interface Client {
    prefixCommands: Collection<string, any>;
    slashCommands: Collection<string, any>;
    slashCommandsArray: any[];
    subCommands: Collection<string, any>;
    buttons: Collection<string, any>;
    modals: Collection<string, any>;
    messageSelectMenus: Collection<string, any>;
    stringSelectMenus: Collection<string, any>;
    keyv: KeyValueStore;
    pinsDB: MongodbKeyValue;
    chess: MongodbKeyValue;
    lastFmDb: MongodbKeyValue;
    music: MusicManager;
    sleep: typeof sleep;
    color: number;
    interactionDefer: (interaction: any) => Promise<void>;
  }
}

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.prefixCommands = new Collection();
client.slashCommands = new Collection();
client.slashCommandsArray = [];
client.subCommands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.messageSelectMenus = new Collection();
client.stringSelectMenus = new Collection();
client.keyv = new KeyValueStore();
client.pinsDB = new MongodbKeyValue("pins");
client.chess = new MongodbKeyValue("chess");
client.lastFmDb = new MongodbKeyValue("lastfm");
client.music = new MusicManager(client);
client.sleep = sleep;
client.color = config.color;
client.interactionDefer = async (interaction): Promise<void> => {
  try {
    await interaction.deferUpdate();
  } catch {
    Logger.warn("Interaction defer failed");
  }
};

async function start(): Promise<void> {
  await client.music.validateRuntime();
  Logger.success("Music runtime is available");
  await mongoose.connect(env.MONGODB_URL);
  Logger.success("Connected to MongoDB");

  await import("./Utilities/webpageHandler.js");
  await import("./Utilities/slashCommandHandler.js");
  await import("./Utilities/prefixCommandHandler.js");
  await import("./Utilities/hybridCommandHandler.js");
  await import("./Utilities/eventHandler.js");
  await import("./Utilities/buttonHandler.js");
  await import("./Utilities/modalHandler.js");
  await import("./Utilities/stringSelectMenuHandler.js");
  await import("./Utilities/messageSelectMenuHandler.js");

  await client.login(env.TOKEN);
  client.keyv.set("uptime", Date.now());
}

async function shutdown(signal: string): Promise<void> {
  Logger.info(`Received ${signal}; shutting down`);
  await client.music.destroyAll();
  client.destroy();
  await mongoose.disconnect();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => Logger.error("Unhandled rejection", error));
process.on("uncaughtException", (error) => Logger.error("Uncaught exception", error));

void start().catch((error) => {
  Logger.error("PixD failed to start", error);
  process.exitCode = 1;
});
