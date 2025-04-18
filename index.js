import "dotenv/config";

import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { Poru } from "poru";
import { KeyValueStore, MongodbKeyValue, sleep } from "./Helpers/helperUtil.js";
import config from "./Configs/config.js";
import mongoose from "mongoose";
import User from "./Utilities/jeetModel.js";
const Nodes = config.nodes;

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

const PoruOptions = {
  library: "discord.js",
  defaultPlatform: "ytmsearch",
};

mongoose.connect(process.env.MONGODB_URL)
  .then(async () => {
    console.log('[INFO] - Connected to mongodb')
    await User.deleteMany({})
  })
  .catch((err) => console.error('mongodb connection error:', err));


client.poru = new Poru(client, Nodes, PoruOptions);
// Setting a Global Collection for Commands, Aliases, Buttons & Interactions and more
client.prefixCommands = new Collection();
client.slashCommands = new Collection();
client.subCommands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.messageSelectMenus = new Collection();
client.stringSelectMenus = new Collection();
//client.queue = new Collection();
client.keyv = new KeyValueStore();
client.sleep = sleep;
client.pinsDB = new MongodbKeyValue();
client.chess = new MongodbKeyValue();
client.lastFmDb = new MongodbKeyValue();
client.color = 0xe08e6

// Website Handler
import("./Utilities/webpageHandler.js");

// Slash Command Handler
import("./Utilities/slashCommandHandler.js");

// Prefix Command Handler
import("./Utilities/prefixCommandHandler.js");

// Event Handler
import("./Utilities/eventHandler.js");

// Button Handler
import("./Utilities/buttonHandler.js");

// Modal Handler
import("./Utilities/modalHandler.js");

// String Select Menu Handler
import("./Utilities/stringSelectMenuHandler.js");

// Message Select Menu Handler
import("./Utilities/messageSelectMenuHandler.js");

// Register application commands
import("./Utilities/registerCommands.js");

//Import poru events
import("./Events/poru.js");

// Logging in to the bot..
client.login(process.env.TOKEN);

// Setting current time to present the Uptime
client.keyv.set("uptime", Date.now());
client.interactionDefer = async (interaction) => {
  try {
    await interaction.deferUpdate();
  } catch (e) {
    console.warn("Interaction defer failed.");
  }
};

process.on("unhandledRejection", (error) => {
  console.error(`[ERROR] - Unhandled Promise Rejection: ${error.message}`);
});

process.on("uncaughtException", (error) => {
  console.error(`[ERROR] - Uncaught Exception: ${error.message}`);
});
