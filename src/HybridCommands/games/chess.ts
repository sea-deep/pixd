import HybridCommand from "../../structures/HybridCommand.js";
import { Client, Message, AttachmentBuilder } from "discord.js";

import { Chess } from "chess.js";
import { chess2img, chessComponents, getBotMove } from "../../helpers/helpersChess.js";

export default new HybridCommand({
  name: "chess",
  description: "Play chess with anyone",
  aliases: ["ces", "ches", "chs"],
  usage: "p!chess @someone",
  guildOnly: true,
  permissions: { bot: [], user: [] },

  /**
   * @param {Message} message
   * @param {Client} client
   */
  options: [{ type: 6, name: "opponent", description: "Play against another user" }],
  execute: async (ctx, client) => {
    const opponent = ctx.options.getUser("opponent");
    let players = [ctx.user.id];
    players.push(
      !opponent ||
      opponent.id === ctx.user.id ||
      opponent.bot
        ? client.user!.id
        : opponent.id);
        players.sort(() => Math.random() - 0.5);

    let chess = new Chess();
    // console.log(chess.board());
    let img = await chess2img(chess.board(), "w");
    let file = new AttachmentBuilder(img, {name: 'board.png'});
    let components = await chessComponents(chess, "w");
    let urlMap = {
      b: "https://iili.io/dpouoTG.jpg",
      w: "https://iili.io/dpouCps.jpg",
    };

    let initMsg = await ctx.reply({
      content: [
        "**Chess**",
        `:white_circle: <@${players[0]}>\`0\``,
        `:black_circle: <@${players[1]}>\`0\``,
      ].join("\n"),
      files: [file],
      components: components,
      embeds: [
        {
          author: {
            name: "Current turn :",
            icon_url: urlMap["w"],
          },
          description: `<@${players[0]}>`,
          color: 0xfffcf3
        },
      ],
    });
    if (players[0] === client.user!.id) {
      const botMove = await getBotMove(chess.fen(), "hard");
      chess.move(botMove);
   // console.log(botMove);
      const botComponents = await chessComponents(chess, chess.turn());
      const img = await chess2img(chess.board(), chess.turn());
      const file = new AttachmentBuilder(img, { name: "board.png" });
     
      await initMsg.edit({
        components: botComponents,
        files: [file],
        embeds: [
          {
            author: { name: "Current turn :", icon_url: urlMap['b'] },
            description: `<@${players[1]}>`,
            color: 0xAB723B
          },
        ],
      });
    }


    await client.chess.set(initMsg.id, chess.pgn(), 60 * 60);

  },
});
