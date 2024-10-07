import {
  AttachmentBuilder,
  Client,
  StringSelectMenuInteraction,
} from "discord.js";

import { Chess } from "chess.js";
import { chess2img, chessComponents } from "../../../Helpers/helpersChess.js";
export default {
  name: "piece_destination",
  /**
   * @param {StringSelectMenuInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);
    if (
      !interaction.message.embeds[0].description.includes(interaction.member.id)
    ) {
      return interaction.followUp({
        content: ":x: **This is not your turn**",
        ephemeral: true,
      });
    }
    const chess = new Chess();
    chess.loadPgn(await client.chess.get(interaction.message.id));
    let from = interaction.message.components[0].components[0].options.find(
      (piece) => piece.default
    ).label;
    let to = interaction.values[0];
    chess.move({ from: from, to: to });
    let img = await chess2img(chess.board());
    let file = new AttachmentBuilder(img, "board.png");
    const components = await chessComponents(chess, chess.turn());
    let urlMap = {
      b: "https://iili.io/dpouoTG.jpg",
      w: "https://iili.io/dpouCps.jpg",
    };
    let playerMap = {
      w: interaction.message.mentions.parsedUsers.at(0).id,
      b: interaction.message.mentions.parsedUsers.at(1).id,
    };
    if (chess.isGameOver()) {
      await client.chess.delete(interaction.message.id);
      let msg;
      
      if (chess.isCheckmate()) {
        msg = `<@${playerMap[chess.turn() === 'w' ? 'b' : 'w']}> **wins by checkmate!**`;
      } else if (chess.isDraw() || chess.isStalemate()) {
        msg = "**The game is a draw.**";
      }

      await interaction.message.edit({
        components: [],
        files: [file],
        embeds: [
          {
            author: {
              name: "GAME OVER",
            },
            description: msg,
          },
        ],
      });
    } else {
      await interaction.message.edit({
        components: components,
        files: [file],
        embeds: [
          {
            author: {
              name: "Current turn :",
              icon_url: urlMap[chess.turn()],
            },
            description: `<@${playerMap[chess.turn()]}>`,
          },
        ],
      });
      await client.chess.set(interaction.message.id, chess.pgn(), 3600000);
    }
  },
};
