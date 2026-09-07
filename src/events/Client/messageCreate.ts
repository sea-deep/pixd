import { Message, Client } from "discord.js";
import config from "../../../Configs/config.js";
import Logger from "../../helpers/Logger.js";
import Event from "../../structures/Event.js";
import { handleMessageCommandOptions } from "../../utilities/CommandOptions.js";
import { generateAiChatResponse, isAiChatConfigured } from "../../services/AiChatService.js";

const mentionCooldowns = new Map<string, number>();

export default new Event({
  event: "messageCreate",
  execute: async (message: Message, client: Client) => {
    // 1. Skip bot-authored messages. Individual commands decide whether DMs are allowed.
    if (message.author.bot) return;

    // 2. Restricted User Check
    if (config.restricted.includes(message.author.id)) return;

    // 2.5. Bot Mention Event Trigger
    if (
      client.user &&
      (message.mentions.users.has(client.user.id) ||
        (message.reference?.messageId &&
          message.channel.messages.cache.get(message.reference.messageId)?.author.id === client.user.id))
    ) {
      const prefix = config.commands.prefix;
      const isPrefixCommand =
        Boolean(prefix) && message.content.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase();

      if (!isPrefixCommand && isAiChatConfigured()) {
        const now = Date.now();
        const lastMention = mentionCooldowns.get(message.author.id) ?? 0;
        if (now - lastMention < 3000) return;
        mentionCooldowns.set(message.author.id, now);

        if (mentionCooldowns.size > 1000) {
          const oldest = mentionCooldowns.keys().next().value;
          if (oldest) mentionCooldowns.delete(oldest);
        }

        const mentionRegex = new RegExp(`^<@!?${client.user.id}>\\s*|<@!?${client.user.id}>`, "g");
        const rawPrompt = message.content.replace(mentionRegex, "").trim();
        const prompt = rawPrompt.length > 0 ? rawPrompt : "kya bolu";

        if ("sendTyping" in message.channel && typeof message.channel.sendTyping === "function") {
          await message.channel.sendTyping().catch(() => {});
        }
        try {
          const answer = await generateAiChatResponse(message.author.id, prompt);
          await message.reply({
            content: answer,
            allowedMentions: { repliedUser: false },
          }).catch((err) => Logger.warn("Could not send mention reply:", err));
        } catch (err) {
          Logger.error("Error generating AI mention response:", err);
        }
        return;
      }
    }

    // 3. Check if prefix commands are enabled
    if (!config.commands.message_commands) return;

    const prefix = config.commands.prefix;
    if (message.content.slice(0, prefix.length).toLowerCase() !== prefix.toLowerCase()) return;

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
