import { Client, BaseInteraction } from "discord.js";
import config from "../../Configs/config.js"; 
import chalk from "chalk";

export default {
  event: "interactionCreate",
  /**
    * @param {Client} client
    * @param {BaseInteraction} interaction
    */
  execute: async (interaction, client) => {
   if(config.restricted.includes(interaction.member.id)) return;
    if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId)
      if (!button) return

      try {
        return await button.execute(interaction, client)
      } catch (err) {
        console.log("Error in button:", interaction.customId, err);
     try {
        await interaction.reply({ content: '*There was an error while executing that button.*', ephemeral: true });
      } catch(e) {
         console.log("\nError with button", interaction.customId, e.message);
        try { await interaction.followUp({ content: '*There was an error while executing that button.*', ephemeral: true }); } catch (e) {console.log("InteractionNotSent error handled!!");}
        }
      }
    }
    
    if (interaction.isChatInputCommand()) {
      const isSubCommand = interaction.options.getSubcommand(false);
      if (isSubCommand) {
        const subCommandName = interaction.options.getSubcommand();
        const subCommand = client.subCommands.get(`${interaction.commandName} ${subCommandName}`);

        try {
          return await subCommand.execute(interaction, client)
        } catch (err) {
          process.stdout.write(`[${chalk.red("InteractionCreate")}] (${chalk.red("SubCommand")}) - ${err}`)
        }
      }

      const command = client.slashCommands.get(interaction.commandName);

      try {
        return await command.execute(interaction, client);
      } catch (err) {
        process.stdout.write(`[${chalk.red("InteractionCreate")} (${chalk.red("Command")})] - ${err}\n`);
        await interaction.reply({
          content: "*There was an error while executing this command!*",
          ephemeral: true,
        });
      }
    }

    if (interaction.isMessageContextMenuCommand()) {
      const command = client.messageSelectMenus.get(interaction.commandName);

      try {
        return await command.execute(interaction, client);
      } catch (err) {
        process.stdout.write(`[${chalk.red("InteractionCreate")} (${chalk.red("Command")})] - ${err}\n`);
        await interaction.reply({
          content: "*There was an error while executing this command!*",
          ephemeral: true,
        });
      }
    }
    

    if (interaction.isModalSubmit()) {
      const modal = client.modals.get(interaction.customId);
      if (!modal) return;
      try {
        return await modal.execute(interaction, client);
      } catch (err) {     process.stdout.write(`[${chalk.red("ModalHandler")}] - ${err}`);
        await interaction.reply({ content: '*There was an error while executing that modal.*', ephemeral: true });
      }
    }
    
    if (interaction.isStringSelectMenu()) {
      const menu = client.stringSelectMenus.get(interaction.customId);
      if (!menu) return;
      try {
        return await menu.execute(interaction, client);
      } catch (err) {
        process.stdout.write(`[${chalk.red("SelectMenuHandler")}] - ${err}`);
        await interaction.reply({ content: '*There was an error while executing that select menu.*', ephemeral: true });
      }
    }
  },
};

