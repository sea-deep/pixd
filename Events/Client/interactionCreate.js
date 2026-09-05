import { Client, BaseInteraction } from "discord.js";
import config from "../../Configs/config.js";

const interactionError = (interaction, description) => {
  const payload = {
    content: "",
    ephemeral: true,
    embeds: [{ description, color: interaction.client.color }],
  };
  return interaction.replied || interaction.deferred
    ? interaction.followUp(payload)
    : interaction.reply(payload);
};

export default {
  event: "interactionCreate",
  /**
   * @param {Client} client
   * @param {BaseInteraction} interaction
   */
  execute: async (interaction, client) => {
    if (config.restricted.includes(interaction.user.id)) return;
    if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);
      if (!button) return;

      try {
        return await button.execute(interaction, client);
      } catch (err) {
        console.log("Error in button:", interaction.customId, err);
        return interactionError(interaction, "*There was an error while executing that button.*");
      }
    }

    if (interaction.isChatInputCommand()) {
      const isSubCommand = interaction.options.getSubcommand(false);
      if (isSubCommand) {
        const subCommandName = interaction.options.getSubcommand();
        const subCommand = client.subCommands.get(
          `${interaction.commandName} ${subCommandName}`,
        );
        if (!subCommand) return;

        try {
          return await subCommand.execute(interaction, client);
        } catch (err) {
          console.log(
            "Error in subcommand:",
            interaction.commandName,
            interaction.subCommandName,
            err,
          );
          return interactionError(interaction, "*There was an error while executing that command.*");
        }
      }

      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;

      try {
        return await command.execute(interaction, client);
      } catch (err) {
        console.log("Error in slash command:", interaction.commandName, err);
        return interactionError(interaction, "*There was an error while executing that command.*");
      }
    }

    if (interaction.isMessageContextMenuCommand()) {
      const command = client.messageSelectMenus.get(interaction.commandName);
      if (!command) return;

      try {
        return await command.execute(interaction, client);
      } catch (err) {
        console.log(
          "Error in Msg Context Menu:",
          interaction.commandName,
          interaction,
          err,
        );
        return interactionError(interaction, "*There was an error while executing that command.*");
      }
    }

    if (interaction.isModalSubmit()) {
      const modal = client.modals.get(interaction.customId);
      if (!modal) return;
      try {
        return await modal.execute(interaction, client);
      } catch (err) {
        console.log("Error in Modal:", interaction.customId, err);
        return interactionError(interaction, "*There was an error while executing that modal.*");
      }
    }

    if (interaction.isStringSelectMenu()) {
      const menu = client.stringSelectMenus.get(interaction.customId);
      if (!menu) return;
      try {
        return await menu.execute(interaction, client);
      } catch (err) {
        console.log("Error in Select Menu:", interaction.customId, err);
        return interactionError(interaction, "*There was an error while executing that select menu.*");
      }
    }
  },
};
