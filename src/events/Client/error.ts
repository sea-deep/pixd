import Event from "../../structures/Event.js";
import { Client } from "discord.js";
import Logger from "../../helpers/Logger.js";

export default new Event({
  event: "error",
  /**
   * @param {Client} client
   */
  execute: async (error, client) => {
    Logger.error("Discord client error:", error);
    try {
      const errorChannelId = "1200865021450801259";
      const errorChannel = client.channels?.cache?.get(errorChannelId);
      if (errorChannel && "send" in errorChannel && typeof errorChannel.send === "function") {
        const userId = "1258396025354453054";
        const userMention = `<@${userId}>`;
        const errorMessage = `[ERROR] - An error occurred: ${userMention}\n${error?.message ?? error}\n${error?.stack ?? ""}`;
        await errorChannel.send(errorMessage).catch(() => {});
      }
    } catch {
      // Ignore notification failures to avoid crashing error handler
    }
  },
});
