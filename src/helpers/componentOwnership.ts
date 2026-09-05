import type { ButtonInteraction } from "discord.js";
import { componentOwner } from "../utilities/InteractionRouting.js";
import config from "../../Configs/config.js";

export function isComponentOwner(interaction: ButtonInteraction): boolean {
  if (interaction.user.id === config.users.ownerId || config.users.developers?.includes(interaction.user.id)) {
    return true;
  }
  const ownerId = componentOwner(interaction.message);
  return Boolean(ownerId && ownerId === interaction.user.id);
}
