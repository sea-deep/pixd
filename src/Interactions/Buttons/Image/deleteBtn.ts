import { ButtonInteraction, Client, GuildMember } from "discord.js";
import Component from "../../../structures/Component.js";
import config from "../../../../Configs/config.js";
import { isComponentOwner } from "../../../helpers/componentOwnership.js";

/**
 * Validates whether the user clicking the delete button is:
 * 1. The Bot Owner (or Developer)
 * 2. An Admin (Server Owner, Administrator, or ManageMessages)
 * 3. The Command Author (via customId param, interaction metadata, message reference, or mentions)
 */
export async function canDeleteMessage(
  interaction: ButtonInteraction,
  client: Client,
  authorId?: string,
): Promise<boolean> {
  const userId = interaction.user.id;

  // 1. Bot Owner & Developers (Owner ID)
  const ownerId = (client as any).config?.users?.ownerId ?? config.users.ownerId;
  const developers: string[] = (client as any).config?.users?.developers ?? config.users.developers ?? [];
  if (userId === ownerId || developers.includes(userId)) {
    return true;
  }

  // 2. Server Administrator & Moderators (Admin)
  if (
    interaction.guild?.ownerId === userId ||
    interaction.memberPermissions?.has("Administrator") ||
    interaction.memberPermissions?.has("ManageMessages")
  ) {
    return true;
  }

  const member = interaction.member;
  if (member && "permissions" in member) {
    const perms = (member as GuildMember).permissions;
    if (typeof perms?.has === "function") {
      if (perms.has("Administrator") || perms.has("ManageMessages")) {
        return true;
      }
    }
  }

  // 3. Command Author
  // A. Explicit author ID passed via custom_id (e.g. "delete-btn:<authorId>")
  if (authorId && authorId === userId) {
    return true;
  }

  // B. DMs context
  if (!interaction.guild) {
    return true;
  }

  // C. Slash command interaction author
  const metaUserId = interaction.message.interactionMetadata?.user?.id ?? interaction.message.interaction?.user?.id;
  if (metaUserId && metaUserId === userId) {
    return true;
  }

  // D. Referenced message author (for prefix commands)
  const refMsgId = interaction.message.reference?.messageId;
  if (refMsgId) {
    const cached = interaction.message.channel?.messages?.cache?.get(refMsgId);
    if (cached && cached.author.id === userId) {
      return true;
    }
    try {
      if (interaction.message.channel && "messages" in interaction.message.channel) {
        const fetched = await (interaction.message.channel as any).messages.fetch(refMsgId);
        if (fetched && fetched.author.id === userId) {
          return true;
        }
      }
    } catch {
      // Ignored if reference fetch fails
    }
  }

  // E. First mentioned user in the message
  if (interaction.message.mentions?.users?.first()?.id === userId) {
    return true;
  }

  // F. Fallback to isComponentOwner
  if (isComponentOwner(interaction)) {
    return true;
  }

  return false;
}

export default new Component({
  customId: "delete-btn",
  type: "button",

  execute: async (interaction: ButtonInteraction, client: Client, authorId?: string) => {
    await client.interactionDefer(interaction);
    if (await canDeleteMessage(interaction, client, authorId)) {
      try {
        return await interaction.message.delete();
      } catch {
        return await interaction.followUp({
          content: "",
          ephemeral: true,
          embeds: [
            {
              description: "**Failed to delete message (missing bot permissions).**",
              color: client.color,
            },
          ],
        });
      }
    } else {
      return await interaction.followUp({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: "**You cannot delete this message.**",
            color: client.color,
          },
        ],
      });
    }
  },
});
