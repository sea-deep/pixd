import { Client } from "discord.js";
import chalk from 'chalk'

export default {
  event: "ready",
  once: true,
  /**
  * @param {Client} client
  */
  execute(client) {
    console.log(`[${chalk.blue("INFO")}] - Logged in as: ${chalk.greenBright(client.user.tag)}`);

    client.keyv.set("uptime", Date.now());
  },
};

