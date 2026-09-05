import { PermissionsBitField, ChatInputCommandInteraction, ContextMenuCommandInteraction, Message, PermissionResolvable } from "discord.js";
import config from "../../Configs/config.js";
import MessageCommand from "../structures/MessageCommand.js";
import SlashCommand from "../structures/SlashCommand.js";
import HybridCommand from "../structures/HybridCommand.js";
import UserContextMenu from "../structures/UserContextMenu.js";
import MessageContextMenu from "../structures/MessageContextMenu.js";

const slashCooldowns = new Map<string, Map<string, number>>();
const messageCooldowns = new Map<string, Map<string, number>>();

interface CommandSettings {
  ownerOnly?: boolean;
  developerOnly?: boolean;
  guildOnly?: boolean;
  nsfw?: boolean;
  cooldown?: number;
  permissions?: {
    bot?: PermissionResolvable[];
    user?: PermissionResolvable[];
  };
}

/**
 * Handles options check for Slash / Application Commands / Context Menus.
 * @param interaction - The ChatInput or ContextMenu interaction triggering this command.
 * @param command - The loaded command metadata structure.
 * @returns True if checks passed, false if blocked.
 */
export async function handleApplicationCommandOptions(
  interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
  command: SlashCommand | HybridCommand | UserContextMenu | MessageContextMenu | any
): Promise<boolean> {
  const settings = (command.commandType === "hybrid" ? command : (command.options || {})) as CommandSettings;

  // 1. Owner Check
  if (settings.ownerOnly) {
    if (interaction.user.id !== config.users.ownerId) {
      await interaction.reply({
        content: config.messages.NOT_BOT_OWNER,
        flags: 64, // MessageFlags.Ephemeral
      });
      return false;
    }
  }

  // 2. Developer Check
  if (settings.developerOnly) {
    const devs = config.users.developers || [];
    if (!devs.includes(interaction.user.id)) {
      await interaction.reply({
        content: config.messages.NOT_BOT_DEVELOPER,
        flags: 64, // MessageFlags.Ephemeral
      });
      return false;
    }
  }

  // 3. Guild Only Check
  if (settings.guildOnly) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ This command can only be executed within a server.",
        flags: 64,
      });
      return false;
    }
  }

  // 4. NSFW Check
  if (settings.nsfw) {
    if (interaction.guild && !(interaction.channel as any).nsfw) {
      await interaction.reply({
        content: config.messages.CHANNEL_NOT_NSFW,
        flags: 64,
      });
      return false;
    }
  }

  // 4.5 User Permissions Check
  const userPerms = command.permissions?.user;
  if (interaction.guild && userPerms && userPerms.length > 0) {
    const needed = PermissionsBitField.resolve(userPerms);
    if (!(interaction.member as any).permissions.has(needed)) {
      await interaction.reply({
        content: config.messages.MISSING_PERMISSIONS,
        flags: 64,
      });
      return false;
    }
  }

  // 4.6 Bot Permissions Check
  const botPerms = command.permissions?.bot;
  if (interaction.guild && botPerms && botPerms.length > 0) {
    const needed = PermissionsBitField.resolve(botPerms);
    if (!interaction.guild.members.me?.permissions.has(needed)) {
      await interaction.reply({
        content: "❌ The bot lacks required permissions to run this command.",
        flags: 64,
      });
      return false;
    }
  }

  // 5. Cooldown Check
  if (settings.cooldown) {
    const now = Date.now();
    const commandName = command.name;
    const cooldownAmount = settings.cooldown;

    if (!slashCooldowns.has(interaction.user.id)) {
      slashCooldowns.set(interaction.user.id, new Map());
    }

    const userCooldowns = slashCooldowns.get(interaction.user.id)!;
    if (userCooldowns.has(commandName)) {
      const expirationTime = userCooldowns.get(commandName)! + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        await interaction.reply({
          content: config.messages.GUILD_COOLDOWN.replace(/%cooldown%/g, timeLeft.toFixed(1)),
          flags: 64,
        });
        return false;
      }
    }

    userCooldowns.set(commandName, now);
    setTimeout(() => userCooldowns.delete(commandName), cooldownAmount);
  }

  return true;
}

/**
 * Handles options check for Prefix Message Commands.
 * @param message - The message triggering this command.
 * @param command - The loaded command metadata structure.
 * @returns True if checks passed, false if blocked.
 */
export async function handleMessageCommandOptions(
  message: Message,
  command: MessageCommand | HybridCommand
): Promise<boolean> {
  // 1. Owner Check
  if (command.ownerOnly) {
    if (message.author.id !== config.users.ownerId) {
      await message.reply(config.messages.NOT_BOT_OWNER);
      return false;
    }
  }

  // 2. Developer Check
  if (command.developerOnly) {
    const devs = config.users.developers || [];
    if (!devs.includes(message.author.id)) {
      await message.reply(config.messages.NOT_BOT_DEVELOPER);
      return false;
    }
  }

  // 3. Guild Only Check
  if (command.guildOnly) {
    if (!message.guild) {
      await message.reply("❌ This command can only be executed within a server.");
      return false;
    }
  }

  // 4. NSFW Check
  if (command.nsfw) {
    if (message.guild && !(message.channel as any).nsfw) {
      await message.reply(config.messages.CHANNEL_NOT_NSFW);
      return false;
    }
  }

  // 5. User Permissions Check
  const userPerms = command.permissions?.user;
  if (message.guild && userPerms && userPerms.length > 0) {
    const needed = PermissionsBitField.resolve(userPerms);
    if (!message.member?.permissions.has(needed)) {
      await message.reply(config.messages.MISSING_PERMISSIONS);
      return false;
    }
  }

  // 6. Bot Permissions Check
  const botPerms = command.permissions?.bot;
  if (message.guild && botPerms && botPerms.length > 0) {
    const needed = PermissionsBitField.resolve(botPerms);
    if (!message.guild.members.me?.permissions.has(needed)) {
      await message.reply("❌ The bot lacks required permissions to run this command.");
      return false;
    }
  }

  // 7. Cooldown Check
  if (command.cooldown) {
    const now = Date.now();
    const commandName = command.name;
    const cooldownAmount = command.cooldown;

    if (!messageCooldowns.has(message.author.id)) {
      messageCooldowns.set(message.author.id, new Map());
    }

    const userCooldowns = messageCooldowns.get(message.author.id)!;
    if (userCooldowns.has(commandName)) {
      const expirationTime = userCooldowns.get(commandName)! + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        await message.reply(config.messages.GUILD_COOLDOWN.replace(/%cooldown%/g, timeLeft.toFixed(1)));
        return false;
      }
    }

    userCooldowns.set(commandName, now);
    setTimeout(() => userCooldowns.delete(commandName), cooldownAmount);
  }

  return true;
}
