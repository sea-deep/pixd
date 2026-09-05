import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import mongoose from "mongoose";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { env } from "./src/utilities/env.js";
import Logger from "./src/helpers/Logger.js";
import config from "./Configs/config.js";
import { KeyValueStore, MongodbKeyValue, sleep } from "./src/helpers/helperUtil.js";
import MusicManager from "./src/services/music/MusicManager.js";

declare module "discord.js" {
  interface Client {
    prefixCommands: Collection<string, any>; slashCommands: Collection<string, any>; slashCommandsArray: any[];
    userContextMenus: Collection<string, any>; messageContextMenus: Collection<string, any>; subCommands: Collection<string, any>;
    buttons: Collection<string, any>; modals: Collection<string, any>; autocompletes: Collection<string, any>;
    stringSelectMenus: Collection<string, any>; userSelectMenus: Collection<string, any>; roleSelectMenus: Collection<string, any>;
    mentionableSelectMenus: Collection<string, any>; channelSelectMenus: Collection<string, any>;
    keyv: KeyValueStore; pinsDB: MongodbKeyValue; chess: MongodbKeyValue; lastFmDb: MongodbKeyValue;
    music: MusicManager; sleep: typeof sleep; color: number;
    interactionDefer: (interaction: any) => Promise<void>; connect: () => Promise<void>;
  }
}

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction],
});

client.prefixCommands = new Collection(); client.slashCommands = new Collection(); client.slashCommandsArray = [];
client.userContextMenus = new Collection(); client.messageContextMenus = new Collection(); client.subCommands = new Collection();
client.buttons = new Collection(); client.modals = new Collection(); client.autocompletes = new Collection();
client.stringSelectMenus = new Collection(); client.userSelectMenus = new Collection(); client.roleSelectMenus = new Collection();
client.mentionableSelectMenus = new Collection(); client.channelSelectMenus = new Collection();
client.keyv = new KeyValueStore(); client.pinsDB = new MongodbKeyValue("pins"); client.chess = new MongodbKeyValue("chess");
client.lastFmDb = new MongodbKeyValue("lastfm"); client.music = new MusicManager(client); client.sleep = sleep; client.color = config.color;
client.interactionDefer = async (interaction) => { if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate(); };

export async function start(): Promise<void> {
  await client.music.validateRuntime();
  await mongoose.connect(env.MONGODB_URL);
  await import("./src/services/webServer.js");
  for (const handler of ["eventHandler", "prefixCommandHandler", "slashCommandHandler", "buttonHandler",
    "selectMenuHandler", "modalHandler", "autocompleteHandler", "hybridCommandHandler", "contextMenuHandler"]) {
    await import(`./src/utilities/${handler}.js`);
  }
  await client.login(env.TOKEN);
  client.keyv.set("uptime", Date.now());
}
client.connect = start;

async function shutdown(signal: string): Promise<void> {
  Logger.info(`Received ${signal}; shutting down`);
  await client.music.destroyAll(); client.destroy(); await mongoose.disconnect();
}
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => Logger.error("Unhandled rejection", error));
process.on("uncaughtException", (error) => Logger.error("Uncaught exception", error));
const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) void client.connect().catch((error) => { Logger.error("PixD failed to start", error); process.exitCode = 1; });
