import {
  Message,
  Client,
  User,
  GuildMember,
  Role,
  GuildChannel,
  Attachment,
  ApplicationCommandOptionType,
  ApplicationCommandOptionData
} from "discord.js";

/**
 * Normalizes text-based prefix command arguments so they mirror
 * the CommandInteractionOptionResolver API of Discord.js.
 */
export default class MessageOptionResolver {
  public message: Message;
  public args: string[];
  public client: Client;
  public optionsList: ApplicationCommandOptionData[];
  public resolved: Record<string, string> = {};
  public subcommand: string | null = null;
  public subcommandGroup: string | null = null;

  /**
   * @param message - The original Discord Message.
   * @param args - Positional string arguments parsed from the message.
   * @param optionsList - Registered options block configuration list.
   */
  constructor(message: Message, args: string[], optionsList?: ApplicationCommandOptionData[]) {
    this.message = message;
    this.args = args;
    this.client = message.client;
    this.optionsList = optionsList || [];

    // 1. Separate subcommand/group arguments from parameters
    let paramIndex = 0;
    const hasSubcommandGroup = this.optionsList.some((opt) => opt.type === ApplicationCommandOptionType.SubcommandGroup);
    const hasSubcommand = this.optionsList.some((opt) => opt.type === ApplicationCommandOptionType.Subcommand);

    if (hasSubcommandGroup) {
      this.subcommandGroup = this.args[0] || null;
      this.subcommand = this.args[1] || null;
      paramIndex = 2; // Parameters start at index 2
    } else if (hasSubcommand) {
      this.subcommand = this.args[0] || null;
      paramIndex = 1; // Parameters start at index 1
    }

    // 2. Parse positional arguments mapping to the command options
    const parameterOptions = this.optionsList.filter(
      (opt) =>
        opt.type !== ApplicationCommandOptionType.Subcommand &&
        opt.type !== ApplicationCommandOptionType.SubcommandGroup
    );

    for (let i = 0; i < parameterOptions.length; i++) {
      const opt = parameterOptions[i];
      const argPosition = paramIndex + i;
      const val = this.args[argPosition];

      if (val === undefined) continue;

      if (opt.type === ApplicationCommandOptionType.String) {
        // If it's the last option in the list, automatically grab all remaining arguments
        if (i === parameterOptions.length - 1) {
          this.resolved[opt.name] = this.args.slice(argPosition).join(" ");
        } else {
          this.resolved[opt.name] = val;
        }
      } else {
        this.resolved[opt.name] = val;
      }
    }
  }

  /**
   * Resolve a string option by its parameter name.
   */
  getString(name: string): string | null {
    return this.resolved[name] || null;
  }

  /**
   * Resolve an integer option by its parameter name.
   */
  getInteger(name: string): number | null {
    const val = this.resolved[name];
    if (!val) return null;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Resolve a number/float option by its parameter name.
   */
  getNumber(name: string): number | null {
    const val = this.resolved[name];
    if (!val) return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Resolve a boolean option by its parameter name.
   * Maps text triggers like "true", "yes", "y", "1" to true.
   */
  getBoolean(name: string): boolean | null {
    const val = this.resolved[name];
    if (!val) return null;
    return /^(true|yes|y|1)$/i.test(val);
  }

  /**
   * Resolve a User object matching mentions, IDs, or usernames.
   */
  getUser(name: string): User | null {
    const val = this.resolved[name];
    if (!val) return null;
    const match = val.match(/^<@!?(\d+)>$/) || val.match(/^(\d+)$/);
    if (match) {
      const userId = match[1];
      return this.client.users.cache.get(userId) || null;
    }
    return this.client.users.cache.find((u) => u.username.toLowerCase() === val.toLowerCase()) || null;
  }

  /**
   * Resolve a GuildMember object matching mentions, IDs, usernames, or nicknames.
   */
  getMember(name: string): GuildMember | null {
    const val = this.resolved[name];
    if (!val || !this.message.guild) return null;
    const match = val.match(/^<@!?(\d+)>$/) || val.match(/^(\d+)$/);
    if (match) {
      const memberId = match[1];
      return this.message.guild.members.cache.get(memberId) || null;
    }
    return (
      this.message.guild.members.cache.find(
        (m) =>
          m.user.username.toLowerCase() === val.toLowerCase() ||
          m.displayName.toLowerCase() === val.toLowerCase()
      ) || null
    );
  }

  /**
   * Resolve a Role object matching role mentions, IDs, or role names.
   */
  getRole(name: string): Role | null {
    const val = this.resolved[name];
    if (!val || !this.message.guild) return null;
    const match = val.match(/^<@&(\d+)>$/) || val.match(/^(\d+)$/);
    if (match) {
      const roleId = match[1];
      return this.message.guild.roles.cache.get(roleId) || null;
    }
    return this.message.guild.roles.cache.find((r) => r.name.toLowerCase() === val.toLowerCase()) || null;
  }

  /**
   * Resolve a GuildChannel object matching channel mentions, IDs, or channel names.
   */
  getChannel(name: string): GuildChannel | null {
    const val = this.resolved[name];
    if (!val || !this.message.guild) return null;
    const match = val.match(/^<#(\d+)>$/) || val.match(/^(\d+)$/);
    if (match) {
      const channelId = match[1];
      return (this.message.guild.channels.cache.get(channelId) as GuildChannel) || null;
    }
    return (this.message.guild.channels.cache.find((c) => c.name.toLowerCase() === val.toLowerCase()) as GuildChannel) || null;
  }

  /**
   * Resolve a User or Role object matching mentions or IDs.
   */
  getMentionable(name: string): User | Role | null {
    return this.getUser(name) || this.getRole(name) || null;
  }

  /**
   * Resolve an Attachment object from the message attachments.
   */
  getAttachment(name: string): Attachment | null {
    const parameterOptions = this.optionsList.filter(
      (opt) =>
        opt.type !== ApplicationCommandOptionType.Subcommand &&
        opt.type !== ApplicationCommandOptionType.SubcommandGroup
    );
    const index = parameterOptions.findIndex((opt) => opt.name === name);
    if (index === -1) return null;

    return this.message.attachments.at(index) || this.message.attachments.first() || null;
  }

  /**
   * Resolve the active subcommand name.
   */
  getSubcommand(): string | null {
    return this.subcommand;
  }

  /**
   * Resolve the active subcommand group name.
   */
  getSubcommandGroup(): string | null {
    return this.subcommandGroup;
  }
}
