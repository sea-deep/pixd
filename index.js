import 'dotenv/config'; 

import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js'; 
import playDL from 'play-dl'; 
import { KeyValueStore, sleep } from './Helpers/helperUtil.js'; 

export const client = new Client({ 
  intents: [ 
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.GuildVoiceStates, 
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildMembers, 
  ], 
  ws: { properties: { browser: 'Discord iOS' } }, 
  partials: [Partials.Channel], 
}); 

// Setting a Global Collection for Commands, Aliases, Buttons & Interactions and more 
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

// Website Handler 
import('./Utilities/webpageHandler.js'); 

// Slash Command Handler 
import('./Utilities/slashCommandHandler.js'); 

// Prefix Command Handler 
import('./Utilities/prefixCommandHandler.js'); 

// Event Handler 
import('./Utilities/eventHandler.js'); 

// Button Handler 
import('./Utilities/buttonHandler.js'); 

// Modal Handler 
import('./Utilities/modalHandler.js'); 

// String Select Menu Handler 
import('./Utilities/stringSelectMenuHandler.js'); 

// Message Select Menu Handler 
import('./Utilities/messageSelectMenuHandler.js'); 

// Register application commands 
import('./Utilities/registerCommands.js'); 

// Logging in to the bot.. 
client.login(process.env.TOKEN); 

// Setting current time to present the Uptime 
client.keyv.set('uptime', Date.now());

(async () => { 
  await playDL.setToken({ 
    youtube: { 
      cookie: process.env.YT_COOKIES, 
    }, 
    spotify: { 
      client_id: process.env.SPOT_ID, 
      client_secret: process.env.SPOT_SECRET, 
      refresh_token: process.env.SPOT_TOKEN, 
      market: 'US' 
    },
    SoundCloud: {
      client_id: process.env.SC_CLIENT,
    },
    useragent: [ 
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36", 
      "Mozilla/5.0 (Windows NT 6.0; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/110.0.5481.97 Safari/537.11", 
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0" 
    ] 
  }); 
})();