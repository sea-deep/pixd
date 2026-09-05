import {
  type ApplicationCommandOptionData,
  type ChatInputCommandInteraction,
  type GuildMember,
  type Message,
} from "discord.js";

class PrefixOptions {
  constructor(private readonly args: string[], private readonly definitions: ApplicationCommandOptionData[]) {}

  getString(name: string, required = false): string | null {
    const index = this.definitions.findIndex((option) => option.name === name);
    const value = index < 0
      ? null
      : index === this.definitions.length - 1
        ? this.args.slice(index).join(" ")
        : this.args[index];
    if (required && !value) throw new Error(`Missing required argument: ${name}`);
    return value || null;
  }
}

export default class CommandContext {
  readonly isInteraction: boolean;
  readonly guild;
  readonly channel;
  readonly user;
  readonly member: GuildMember | null;
  readonly options: ChatInputCommandInteraction["options"] | PrefixOptions;

  constructor(
    readonly raw: Message | ChatInputCommandInteraction,
    args: string[] = [],
    definitions: ApplicationCommandOptionData[] = [],
  ) {
    this.isInteraction = "isChatInputCommand" in raw;
    this.guild = raw.guild;
    this.channel = raw.channel;
    this.user = this.isInteraction ? (raw as ChatInputCommandInteraction).user : (raw as Message).author;
    this.member = raw.member as GuildMember | null;
    this.options = this.isInteraction
      ? (raw as ChatInputCommandInteraction).options
      : new PrefixOptions(args, definitions);
  }

  async defer(ephemeral = false): Promise<void> {
    if (this.isInteraction) {
      const interaction = this.raw as ChatInputCommandInteraction;
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: ephemeral ? 64 : undefined });
      }
    } else if (this.channel?.isSendable()) {
      await this.channel.sendTyping().catch(() => undefined);
    }
  }

  async reply(payload: any): Promise<any> {
    const options = typeof payload === "string" ? { content: payload } : payload;
    if (this.isInteraction) {
      const interaction = this.raw as ChatInputCommandInteraction;
      return interaction.deferred || interaction.replied
        ? interaction.editReply(options)
        : interaction.reply(options);
    }
    return (this.raw as Message).reply(options);
  }

  async followUp(payload: any): Promise<any> {
    const options = typeof payload === "string" ? { content: payload } : payload;
    if (this.isInteraction) return (this.raw as ChatInputCommandInteraction).followUp(options);
    if (!this.channel?.isSendable()) throw new Error("Channel is not sendable.");
    return this.channel.send(options);
  }
}
