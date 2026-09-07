import { PermissionFlagsBits, PermissionsBitField, OAuth2Scopes } from "discord.js";
import { env } from "../utilities/env.js";

/**
 * All Discord permissions required for PIXD to function properly:
 * - ViewChannel, SendMessages, SendMessagesInThreads: Core channel access & interaction
 * - ManageMessages: Deleting trigger messages (e.g. actually, genetics) & ephemeral countdown notes
 * - EmbedLinks, AttachFiles: Rich UI cards, image generation (canvas), screenshots, upload cards
 * - ReadMessageHistory: Resolving target messages for reaction bombs, pinned messages, target image resolution
 * - AddReactions, UseExternalEmojis: Reaction bombs, game board controls, custom emotes
 * - Connect, Speak, UseVAD, RequestToSpeak: Voice & stage channel music playback
 * - UseApplicationCommands: Slash commands & context menus in guild channels
 */
export const REQUIRED_BOT_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.UseExternalEmojis,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
  PermissionFlagsBits.UseVAD,
  PermissionFlagsBits.UseApplicationCommands,
  PermissionFlagsBits.RequestToSpeak,
] as const;

export const REQUIRED_BOT_PERMISSIONS_BITFIELD = PermissionsBitField.resolve(
  REQUIRED_BOT_PERMISSIONS as unknown as bigint[]
).toString();

export const REQUIRED_BOT_SCOPES = [
  OAuth2Scopes.Bot,
  OAuth2Scopes.ApplicationsCommands,
] as const;

/**
 * Generates an OAuth2 bot authorization URL with the required permissions and scopes.
 * @param clientId - Optional client/application ID (defaults to env.CLIENT_ID)
 */
export function generateInviteUrl(clientId?: string): string {
  const targetId = (clientId && clientId.trim()) || env.CLIENT_ID;
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", targetId);
  url.searchParams.set("permissions", REQUIRED_BOT_PERMISSIONS_BITFIELD);
  url.searchParams.set("scope", REQUIRED_BOT_SCOPES.join(" "));
  return url.toString();
}
