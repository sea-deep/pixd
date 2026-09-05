import type { ButtonInteraction } from "discord.js";
import { componentOwner } from "../utilities/InteractionRouting.js";

export function isComponentOwner(interaction: ButtonInteraction): boolean {
  const ownerId = componentOwner(interaction.message);
  return Boolean(ownerId && ownerId === interaction.user.id);
}
