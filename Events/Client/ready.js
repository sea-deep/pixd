import { Client, ActivityType } from "discord.js";
import chalk from 'chalk';

export default {
  event: "ready",
  once: true,
  /**  
  * @param {Client} client     
  */ 
  execute: async (client) => {
    process.stdout.write(`[${chalk.blue("INFO")}] - Logged in as: ${chalk.greenBright(client.user.tag)}\n`);
      let status = `p!help or /help`; 
      await client.user.setActivity({
       name: `${status}`,
       type: ActivityType.Listening 
     });
  },
};

