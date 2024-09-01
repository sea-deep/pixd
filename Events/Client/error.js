import { Client } from "discord.js";

export default {
  event: "error",
  /**
   * @param {Client} client
   */
  execute: async (error, client) => {
    client.login(process.env.TOKEN);
    const errorChannelId = "1200865021450801259";
    const errorChannel = client.channels.cache.get(errorChannelId);
      const userId = "1258396025354453054";
      const userMention = `<@${userId}>`;
      const errorMessage = `[ERROR] - An error occurred: ${userMention}\n${error.message}\n${error?.stack}`;
      console.error(error);
      errorChannel.send(errorMessage);
  },
};
