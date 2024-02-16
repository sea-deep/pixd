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
    async client.user.setAvatar("https://cdn.discordapp.com/attachments/1128597323895808020/1207939137722650654/doremon-smile.gif?ex=65e177fc&is=65cf02fc&hm=4b4e2afbd14e84f221f689c308fe3e5081e5aafc5f5fcdc88085d4a5b6f73287&");
  },
};

