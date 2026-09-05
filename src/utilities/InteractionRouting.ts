import type { Collection, RepliableInteraction, Message } from "discord.js";

export function resolveComponent<T>(registry: Collection<string, T>, id: string): { handler: T | undefined; params: string[] } {
  if (registry.has(id)) return { handler: registry.get(id), params: [] };
  const prefix = [...registry.keys()].filter(key => id.startsWith(`${key}:`)).sort((a, b) => b.length - a.length)[0];
  return prefix ? { handler: registry.get(prefix), params: id.slice(prefix.length + 1).split(":") } : { handler: undefined, params: [] };
}

export function componentOwner(message: Message | null | undefined): string | undefined {
  const reference = message?.reference?.messageId;
  return message?.interactionMetadata?.user.id ?? message?.interaction?.user.id
    ?? (reference ? message?.channel.messages.cache.get(reference)?.author.id : undefined)
    ?? message?.mentions.users.first()?.id;
}

export async function replyInteractionError(interaction: RepliableInteraction, content: string): Promise<unknown> {
  if (interaction.deferred && !interaction.replied && !interaction.isMessageComponent()) return interaction.editReply({ content });
  if (interaction.replied || interaction.deferred) return interaction.followUp({ content, flags: 64 });
  return interaction.reply({ content, flags: 64 });
}
