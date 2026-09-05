import type { Interaction, Client, Collection } from "discord.js";
import config from "../../../Configs/config.js";
import Logger from "../../helpers/Logger.js";
import Event from "../../structures/Event.js";
import type Component from "../../structures/Component.js";
import { handleApplicationCommandOptions } from "../../utilities/CommandOptions.js";
import { resolveComponent, componentOwner, replyInteractionError } from "../../utilities/InteractionRouting.js";

export default new Event({
  event: "interactionCreate",
  execute: async (interaction: Interaction, client: Client) => {
    if (config.restricted.includes(interaction.user.id)) return;
    try {
      if (interaction.isAutocomplete()) {
        const handler = client.autocompletes.get(interaction.commandName);
        return handler ? await handler.execute(interaction, client) : await interaction.respond([]);
      }
      if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
        const registry = interaction.isChatInputCommand() ? client.slashCommands : interaction.isUserContextMenuCommand() ? client.userContextMenus : client.messageContextMenus;
        const parent = registry.get(interaction.commandName);
        if (!parent) return replyInteractionError(interaction, "This command is no longer available. Please refresh Discord's command list.");
        if (!await handleApplicationCommandOptions(interaction, parent)) return;
        let command = parent;
        if (interaction.isChatInputCommand()) {
          const sub = interaction.options.getSubcommand(false);
          if (sub) {
            const route = [interaction.commandName, interaction.options.getSubcommandGroup(false), sub].filter(Boolean).join(" ");
            command = client.subCommands.get(route);
            if (!command) return replyInteractionError(interaction, "This subcommand is currently unavailable.");
            if (!await handleApplicationCommandOptions(interaction, command)) return;
          }
        }
        if (command.execute) return await command.execute(interaction, client);
        return replyInteractionError(interaction, "Select a subcommand to continue.");
      }
      if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) return;
      const registry: Collection<string, Component> = interaction.isButton() ? client.buttons
        : interaction.isModalSubmit() ? client.modals
        : interaction.isStringSelectMenu() ? client.stringSelectMenus
        : interaction.isUserSelectMenu() ? client.userSelectMenus
        : interaction.isRoleSelectMenu() ? client.roleSelectMenus
        : interaction.isMentionableSelectMenu() ? client.mentionableSelectMenus : client.channelSelectMenus;
      const { handler, params } = resolveComponent(registry, interaction.customId);
      // Unregistered IDs may be owned by an active per-message game collector.
      if (!handler) return;
      if (handler.options.ownerOnly && interaction.user.id !== config.users.ownerId) return replyInteractionError(interaction, config.messages.NOT_BOT_OWNER);
      if (!handler.options.public && componentOwner(interaction.message) !== interaction.user.id) return replyInteractionError(interaction, config.messages.COMPONENT_NOT_PUBLIC);
      return await handler.execute(interaction, client, ...params);
    } catch (error) {
      Logger.error("Interaction execution failed", error);
      if (interaction.isAutocomplete()) {
        if (!interaction.responded) await interaction.respond([]).catch(() => undefined);
      } else if (interaction.isRepliable()) {
        await replyInteractionError(interaction, config.messages.INTERACTION_ERROR).catch(() => undefined);
      }
    }
  },
});
