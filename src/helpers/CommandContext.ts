import {
  Message,
  Client,
  Guild,
  User,
  GuildMember,
  TextBasedChannel,
  CommandInteractionOptionResolver,
  MessageInteraction,
  RepliableInteraction,
  InteractionReplyOptions,
  MessageReplyOptions,
  ApplicationCommandOptionData
} from "discord.js";
import MessageOptionResolver from "./MessageOptionResolver.js";

export type ContextReplyOptions = string | (Omit<InteractionReplyOptions, "flags"> & Omit<MessageReplyOptions, "flags"> & { flags?: string | string[] | number; ephemeral?: boolean });

function stripInteractionOnlyFlags(payload: any): void {
  delete payload.ephemeral;
  if (typeof payload.flags === "number") payload.flags &= ~64;
  else if (payload.flags === "Ephemeral") delete payload.flags;
  else if (Array.isArray(payload.flags)) payload.flags = payload.flags.filter((flag: string) => flag !== "Ephemeral");
}

/**
 * Normalizes execution contexts between Prefix (Message) and Slash (Interaction) commands.
 */
export default class CommandContext {
  public raw: Message | RepliableInteraction;
  public client: Client;
  public isInteraction: boolean;
  public isSlash: boolean;
  public type: "slash" | "component" | "prefix";
  public guild: Guild | null;
  public channel: TextBasedChannel | null;
  public user: User;
  public member: GuildMember | null;
  public options: CommandInteractionOptionResolver | MessageOptionResolver;
  public args: string[];
  public replyMessage: Message | null = null;
  public messageInteraction: MessageInteraction | null = null;
  public originalAuthor: User;

  /**
   * @param interactionOrMessage - The raw Message or Interaction instance triggering this context.
   * @param args - Positional arguments (for prefix messages only).
   * @param optionsList - Option configuration definitions (for prefix messages only).
   */
  constructor(interactionOrMessage: Message | RepliableInteraction, args: string[] = [], optionsList: ApplicationCommandOptionData[] = []) {
    this.raw = interactionOrMessage;
    this.client = interactionOrMessage.client;

    // Check if context is an Interaction
    const isAnyInteraction = "user" in interactionOrMessage;
    this.isInteraction = isAnyInteraction;
    this.isSlash = typeof (interactionOrMessage as any).isCommand === "function" && (interactionOrMessage as any).isCommand();
    this.type = this.isSlash ? "slash" : (isAnyInteraction ? "component" : "prefix");

    this.guild = interactionOrMessage.guild;
    this.channel = interactionOrMessage.channel;

    // User who triggered this specific execution context
    this.user = isAnyInteraction ? (interactionOrMessage as RepliableInteraction).user : (interactionOrMessage as Message).author;
    this.member = interactionOrMessage.member as GuildMember | null;

    this.options = this.isSlash
      ? ((interactionOrMessage as any).options as CommandInteractionOptionResolver)
      : new MessageOptionResolver(interactionOrMessage as Message, args, optionsList);
    this.args = args;

    // Expose interaction metadata of the parent message if it exists
    this.messageInteraction = !this.isSlash ? ((interactionOrMessage as Message).interaction || null) : null;

    // --- Dynamic Command Author (Session Ownership Tracker) ---
    if ("message" in interactionOrMessage && (interactionOrMessage as any).message) {
      const msg = (interactionOrMessage as any).message as Message;

      // Safe resolve of referenced message author
      const refMsgId = msg.reference?.messageId;
      const refMsg = refMsgId ? msg.channel.messages.cache.get(refMsgId) : null;

      this.originalAuthor =
        msg.interactionMetadata?.user || msg.interaction?.user ||
        refMsg?.author ||
        msg.mentions?.users?.first() ||
        this.user;
    } else {
      this.originalAuthor = this.user;
    }
  }

  /**
   * Normalize sending a reply message.
   * Handles editing the defer/thinking state automatically if previously deferred.
   * @param options - Text payload or full MessageOptions object.
   */
  async reply(options: ContextReplyOptions): Promise<any> {
    const payload: any = typeof options === "string" ? { content: options } : { ...options };

    if (this.isInteraction) {
      const rawInteraction = this.raw as RepliableInteraction;
      if (rawInteraction.replied || rawInteraction.deferred) {
        return await rawInteraction.editReply(payload);
      }

      // Supplying "ephemeral" is deprecated in v14.16+, map to flags instead
      if (payload.ephemeral) {
        payload.flags = "Ephemeral";
        delete payload.ephemeral;
      }

      await rawInteraction.reply(payload);
      return await rawInteraction.fetchReply();
    } else {
      const rawMessage = this.raw as Message;
      stripInteractionOnlyFlags(payload);
      if (this.replyMessage) {
        return await this.replyMessage.edit(payload);
      }
      this.replyMessage = await rawMessage.reply(payload);
      return this.replyMessage;
    }
  }

  /**
   * Normalize deferring the response.
   * For interactions: defers reply (ack within 3s).
   * For prefix: triggers channel typing animation indicator.
   * @param ephemeral - Ephemeral flag (slash commands only).
   */
  async defer(ephemeral = false): Promise<any> {
    if (this.isInteraction) {
      const rawInteraction = this.raw as RepliableInteraction;
      if (rawInteraction.deferred || rawInteraction.replied) return;
      return await rawInteraction.deferReply({
        flags: ephemeral ? "Ephemeral" as any : undefined
      });
    } else {
      if (this.channel && typeof (this.channel as any).sendTyping === "function") {
        try {
          await (this.channel as any).sendTyping();
        } catch (err) {
          // Ignore permission-based typing indicators errors
        }
      }
    }
  }

  /**
   * Normalize editing a reply message.
   * @param options - Text payload or full MessageOptions object.
   */
  async editReply(options: ContextReplyOptions): Promise<any> {
    return await this.reply(options);
  }

  /**
   * Normalize sending follow-up messages.
   * @param options - Text payload or full MessageOptions object.
   */
  async followUp(options: ContextReplyOptions): Promise<any> {
    const payload: any = typeof options === "string" ? { content: options } : { ...options };

    if (this.isInteraction) {
      const rawInteraction = this.raw as RepliableInteraction;
      if (payload.ephemeral) {
        payload.flags = "Ephemeral";
        delete payload.ephemeral;
      }
      return await rawInteraction.followUp(payload);
    } else {
      stripInteractionOnlyFlags(payload);
      if (!this.channel) {
        throw new Error("Cannot send follow-up message: channel is null.");
      }
      return await (this.channel as any).send(payload);
    }
  }
}
