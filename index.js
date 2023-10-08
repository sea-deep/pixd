#!/usr/bin/env node

// Load environment variables from .env file
import 'dotenv/config';

// Import necessary modules from discord.js and your own utility functions
import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} from 'discord.js';
import { KeyValueStore, sleep } from './Helpers/helperUtil.js';

// Create a Discord client instance
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

// Setting up global collections for various purposes
client.prefixCommands = new Collection();
client.slashCommands = new Collection();
client.subCommands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.messageSelectMenus = new Collection();
client.stringSelectMenus = new Collection();
client.queue = new Collection();
client.keyv = new KeyValueStore();
client.sleep = sleep;

// Import various utility modules
import './Utilities/webpageHandler.js';
import './Utilities/slashCommandHandler.js';
import './Utilities/prefixCommandHandler.js';
import './Utilities/eventHandler.js';
import './Utilities/buttonHandler.js';
import './Utilities/modalHandler.js';
import './Utilities/stringSelectMenuHandler.js';
import './Utilities/messageSelectMenuHandler.js';
import './Utilities/registerCommands.js';

// Logging in to the bot with your token
client.login(process.env.TOKEN);

// Set the current time for uptime tracking
client.keyv.set('uptime', Date.now());