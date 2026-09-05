import { Client, ActivityType } from "discord.js";
import config from "../../Configs/config.js";
import registerCommands from "../../Utilities/registerCommands.js";

export default {
  event: "clientReady",
  once: true,
  /**
   * @param {Client} client
   */
  execute: async (client) => {
  console.log("[INFO] Logged in as", client.user.tag)
 
  
    await registerCommands(client);
    let status = `${config.prefix}help or /help`;
    client.user.setActivity({
      name: `${status}`,
      type: ActivityType.Listening,
    });
  },
};
