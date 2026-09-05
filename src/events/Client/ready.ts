import { ActivityType, Client } from "discord.js";
import Event from "../../structures/Event.js";
import Logger from "../../helpers/Logger.js";
import config from "../../../Configs/config.js";
import registerCommands from "../../utilities/registerCommands.js";

export default new Event({
  event: "clientReady",
  once: true,
  execute: async (client: Client) => {
    Logger.success(`Logged in as ${client.user!.tag}!`);

    // Register / Update application commands dynamically
    await registerCommands(client);
    client.keyv.set("commandsRegistered", true);

    // Set activity
    client.user!.setActivity({
      name: `${config.commands.prefix}help or /help`,
      type: ActivityType.Listening,
    });
  },
});
