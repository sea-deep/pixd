import { Client, BaseInteraction } from "discord.js";
import config from "../../Configs/config.js";

export default {
  event: "interactionCreate",
  /**
   * @param {Client} client
   * @param {BaseInteraction} interaction
   */
  execute: async (interaction, client) => {
    if (config.restricted.includes(interaction.member.id)) return;
    if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);
      if (!button) return;

      try {
        return button.execute(interaction, client);
      } catch (err) {
        console.log("Error in button:", interaction.customId, err);
        return interaction.followUp({
          content: "",
          ephemeral: true,
          embeds: [
            {
              description: "*There was an error while executing that button.*",
              color: client.color,
            },
          ],
        });
      }
    }

    if (interaction.isChatInputCommand()) {
      const isSubCommand = interaction.options.getSubcommand(false);
      if (isSubCommand) {
        const subCommandName = interaction.options.getSubcommand();
        const subCommand = client.subCommands.get(
          `${interaction.commandName} ${subCommandName}`,
        );

        try {
          return subCommand.execute(interaction, client);
        } catch (err) {
          console.log(
            "Error in subcommand:",
            interaction.commandName,
            interaction.subCommandName,
            err,
          );
          return interaction.followUp({
            content: "",
            ephemeral: true,
            embeds: [
              {
                description:
                  "*There was an error while executing that command.*",
                color: client.color,
              },
            ],
          });
        }
      }

      const command = client.slashCommands.get(interaction.commandName);

      try {
        return command.execute(interaction, client);
      } catch (err) {
        console.log("Error in slash command:", interaction.commandName, err);
        return interaction.followUp({
          content: "",
          ephemeral: true,
          embeds: [
            {
              description: "*There was an error while executing that command.*",
              color: client.color,
            },
          ],
        });
      }
    }

    if (interaction.isMessageContextMenuCommand()) {
      const command = client.messageSelectMenus.get(interaction.commandName);

      try {
        return command.execute(interaction, client);
      } catch (err) {
        console.log(
          "Error in Msg Context Menu:",
          interaction.commandName,
          interaction,
          err,
        );
        await interaction.followUp({
          content: "",
          ephemeral: true,
          embeds: [
            {
              description: "*There was an error while executing that command.*",
              color: client.color,
            },
          ],
        });
      }
    }

    if (interaction.isModalSubmit()) {
      const modal = client.modals.get(interaction.customId);
      if (!modal) return;
      try {
        return await modal.execute(interaction, client);
      } catch (err) {
        console.log("Error in Modal:", interaction.customId, err);
        await interaction.followUp({
          content: "",
          ephemeral: true,
          embeds: [
            {
              description: "*There was an error while executing that modal.*",
              color: client.color,
            },
          ],
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      const menu = client.stringSelectMenus.get(interaction.customId);
      if (!menu) return;
      try {
        return await menu.execute(interaction, client);
      } catch (err) {
        console.log("Error in Select Menu:", interaction.customId, err);
        await interaction.followUp({
          content: "",
          ephemeral: true,
          embeds: [
            {
              description:
                "*There was an error while executing that select menu.*",
              color: client.color,
            },
          ],
        });
      }
    }
  },
};
