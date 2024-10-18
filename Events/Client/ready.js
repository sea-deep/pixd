import { Client, ActivityType } from "discord.js";

export default {
  event: "ready",
  once: true,
  /**
   * @param {Client} client
   */
  execute: async (client) => {
  console.log("[INFO] Logged in as", client.user.tag)
    try{
     client.poru.init(client);
    } catch(e) {
      console.error("Error in Poru", e.message);
    }
    let status = `p!help or /help`;
    client.user.setActivity({
      name: `${status}`,
      type: ActivityType.Listening,
    });
  },
};
