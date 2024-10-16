import "dotenv/config";

import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { Poru } from "poru";
import { KeyValueStore, MongodbKeyValue, sleep } from "./Helpers/helperUtil.js";
import config from "./Configs/config.js";

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
client.pinsDB = new MongodbKeyValue(process.env.MONGODB_URL, "pins");
client.chess = new MongodbKeyValue(process.env.MONGODB_URL, "chess");
client.lastFmDb = new MongodbKeyValue(process.env.MONGODB_URL, "lastfmaccs");
client.color = 0xe08e67;

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
client.login(process.env.hdjec);

// Setting current time to present the Uptime
client.keyv.set("uptime", Date.now());
client.interactionDefer = async (interaction) => {
  try {
    await interaction.deferUpdate();
  } catch (e) {
    console.warn("Interaction defer failed.");
  }
};
