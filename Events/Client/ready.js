import { Client } from "discord.js";
import chalk from 'chalk';

export default {
  event: "ready",
  once: false,
  /**  
  * @param {Client} client     
  */ 
  execute: async (client) => {
    process.stdout.write(`[${chalk.blue("INFO")}] - Logged in as: ${chalk.greenBright(client.user.tag)}\n`);
  },
};

