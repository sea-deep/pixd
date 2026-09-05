import {
  type ApplicationCommandOptionData,
  type ChatInputCommandInteraction,
  type Client,
  type Message,
} from "discord.js";
import CommandContext from "../helpers/CommandContext.js";

interface HybridCommandData {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  options?: ApplicationCommandOptionData[];
  guildOnly?: boolean;
  defer?: boolean;
  ephemeral?: boolean;
  execute: (context: CommandContext, client: Client) => unknown | Promise<unknown>;
}

export default class HybridCommand {
  readonly commandType = "hybrid";
  readonly name: string;
  readonly description: string;
  readonly aliases: string[];
  readonly usage: string;
  readonly options: ApplicationCommandOptionData[];
  readonly guildOnly: boolean;
  readonly data;
  private readonly defer: boolean;
  private readonly ephemeral: boolean;
  private readonly run: HybridCommandData["execute"];

  constructor(data: HybridCommandData) {
    if (!data.name || !data.description || !data.execute) throw new Error("Invalid HybridCommand definition.");
    this.name = data.name;
    this.description = data.description;
    this.aliases = data.aliases ?? [];
    this.usage = data.usage ?? "";
    this.options = data.options ?? [];
    this.guildOnly = data.guildOnly ?? false;
    this.defer = data.defer ?? true;
    this.ephemeral = data.ephemeral ?? false;
    this.run = data.execute;
    this.data = { name: this.name, description: this.description, options: this.options };
  }

  async execute(source: Message | ChatInputCommandInteraction, ...rest: any[]): Promise<unknown> {
    const interaction = "isChatInputCommand" in source;
    const args = interaction ? [] : (rest[0] as string[] ?? []);
    const client = (interaction ? rest[0] : rest[1]) as Client;
    const context = new CommandContext(source, args, this.options);
    if (this.guildOnly && !context.guild) return context.reply("This command can only be used in a server.");
    if (this.defer) await context.defer(this.ephemeral);
    return this.run(context, client);
  }
}
