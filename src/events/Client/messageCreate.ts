import { Message, Client } from "discord.js";
import config from "../../../Configs/config.js";
import Logger from "../../helpers/Logger.js";
import Event from "../../structures/Event.js";
import { handleMessageCommandOptions } from "../../utilities/CommandOptions.js";

export default new Event({
  event: "messageCreate",
  execute: async (message: Message, client: Client) => {
    // 1. Skip bot-authored messages. Individual commands decide whether DMs are allowed.
    if (message.author.bot) return;

    // 2. Restricted User Check
    if (config.restricted.includes(message.author.id)) return;

    // 3. Check if prefix commands are enabled
    if (!config.commands.message_commands) return;

    const prefix = config.commands.prefix;
    if (!message.content.startsWith(prefix)) return;

    // 4. Parse args and command input
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandInput = args.shift()?.toLowerCase();

    if (!commandInput) return;

    // 5. Look up command or aliases
    const command =
      client.prefixCommands.get(commandInput) ||
      client.prefixCommands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandInput));

    if (!command) return;

    // 6. Run option checks (ownerOnly, developerOnly, permissions, cooldown, nsfw, guildOnly)
    const proceed = await handleMessageCommandOptions(message, command);
    if (!proceed) return;

    // 7. Execute the command
    try {
      await command.execute(message, args, client);
    } catch (err) {
      Logger.error(`Error in Prefix Command (${command.name}):`, err);
      await message.reply({
        embeds: [
          {
            description: "❌ There was an error while trying to execute that command.",
            color: 0xff0000,
          },
        ],
      });
    }
  },
});
