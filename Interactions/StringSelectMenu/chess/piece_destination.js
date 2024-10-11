import {
  AttachmentBuilder,
  Client,
  StringSelectMenuInteraction,
} from "discord.js";
import { Chess } from "chess.js";
import { chess2img, chessComponents, getBotMove } from "../../../Helpers/helpersChess.js";

export default {
  name: "piece_destination",
  /**
   * @param {StringSelectMenuInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);
    
    const message = interaction.message;
    const memberId = interaction.member.id;

    if (!message.embeds[0].description.includes(memberId)) {
      return interaction.followUp({
        content: ":x: **This is not your turn**",
        ephemeral: true,
      });
    }

    const chess = new Chess();
    chess.loadPgn(await client.chess.get(message.id));

    const from = message.components[0].components[0].options.find(piece => piece.default).label;
    const to = interaction.values[0];
    chess.move({ from, to });

    const img = await chess2img(chess.board());
    const file = new AttachmentBuilder(img, "board.png");
    const components = await chessComponents(chess, chess.turn());

    const urlMap = {
      b: "https://iili.io/dpouoTG.jpg",
      w: "https://iili.io/dpouCps.jpg",
    };
    const playerMap = {
      w: message.mentions.parsedUsers.at(0).id,
      b: message.mentions.parsedUsers.at(1).id,
    };


    const handleGameOver = async () => {
      await client.chess.delete(message.id);
      let msg = chess.isCheckmate()
        ? `<@${playerMap[chess.turn() === 'w' ? 'b' : 'w']}> **wins by checkmate!**`
        : "**The game is a draw.**";

      await message.edit({
        components: [],
        files: [file],
        embeds: [{ author: { name: "GAME OVER" }, description: msg }],
      });
    };

    if (chess.isGameOver()) {
      return handleGameOver();
    }


    await message.edit({
      components,
      files: [file],
      embeds: [
        {
          author: { name: "Current turn :", icon_url: urlMap[chess.turn()] },
          description: `<@${playerMap[chess.turn()]}>`,
        },
      ],
    });

    if (message.content.includes(client.user.id)) {
      const botMove = await getBotMove(chess.fen(), "hard");
      chess.move(botMove);
   // console.log(botMove);
      const botComponents = await chessComponents(chess, chess.turn());
      const img = await chess2img(chess.board());
      const file = new AttachmentBuilder(img, "board.png");
     
  
      if (chess.isGameOver()) {
        return handleGameOver();
      }

      await message.edit({
        components: botComponents,
        files: [file],
        embeds: [
          {
            author: { name: "Current turn :", icon_url: urlMap[chess.turn()] },
            description: `<@${playerMap[chess.turn()]}>`,
          },
        ],
      });
    }

    await client.chess.set(message.id, chess.pgn(), 3600000);
  },
};
