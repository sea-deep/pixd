#!/usr/bin/env node 
 import 'dotenv/config'; 
  
 import {Client, GatewayIntentBits, Partials, Collection} from 'discord.js'; 
 import {KeyValueStore, sleep} from './Helpers/helperUtil.js'; 
  
 export const client = new Client({ 
   intents: [ 
     GatewayIntentBits.Guilds, 
     GatewayIntentBits.GuildMessages, 
     GatewayIntentBits.GuildVoiceStates, 
     GatewayIntentBits.MessageContent, 
     GatewayIntentBits.GuildMembers, 
   ], 
   ws: {properties: {browser: 'Discord iOS'}}, 
   partials: [Partials.Channel], 
 }); 
  
client.user.setAvatar("https://cdn.discordapp.com/attachments/1128597323895808020/1207939137722650654/doremon-smile.gif?ex=65e177fc&is=65cf02fc&hm=4b4e2afbd14e84f221f689c308fe3e5081e5aafc5f5fcdc88085d4a5b6f73287&");

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
  
 // Messave Select Menu Handler 
 import('./Utilities/messageSelectMenuHandler.js'); 
  
 // Register application commands 
 import('./Utilities/registerCommands.js'); 
  
 // Logging in to the bot.. 
 client.login(process.env.TOKEN); 
 // Setting current time to present the Uptiime 
 client.keyv.set('uptime', Date.now());