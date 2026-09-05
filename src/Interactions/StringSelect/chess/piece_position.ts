import Component from "../../../structures/Component.js";
import { Client, StringSelectMenuInteraction } from "discord.js";

import { Chess } from "chess.js";
import { chessComponents } from "../../../helpers/helpersChess.js";
export default new Component({
  customId: "piece_position",
  type: "stringSelect",
  /**
   * @param {StringSelectMenuInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {

    await client.interactionDefer(interaction);
    if (!interaction.message.embeds[0].description.includes(interaction.member.id)) {
        return interaction.followUp({
            content: ":x: **This is not your turn**",
            ephemeral: true
        })
    }

    const chess = new Chess();
    chess.loadPgn(await client.chess.get(interaction.message.id));

    const components = await chessComponents(chess, chess.turn(), interaction.values[0]);
    await interaction.message.edit({
      components: components,
    });
  },
});
