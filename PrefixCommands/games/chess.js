import { Client, Message, AttachmentBuilder } from "discord.js";

import { Chess } from "chess.js";
import { chess2img, chessComponents } from "../../Helpers/helpersChess.js";

export default {
  name: "chess",
  description: "Play chess with anyone",
  aliases: ["ces", "ches", "chs"],
  usage: "p!chess @someone",
  guildOnly: true,
  args: true,
  permissions: { bot: [], user: [] },

  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    // FEW exceptions and quick returns/...
    if (
      message.mentions.users.size <= 1 &&
      message.mentions.users.first().id == message.author.id &&
      message.mentions.users.first().bot
    ) {
      return message.reply(
        "**Please use the command correctly.**\nThe proper usage would be: `p!chess @someone`"
      );
    }

    let chess = new Chess();

    // console.log(chess.board());
    let img = await chess2img(chess.board());
    let file = new AttachmentBuilder(img, "board.png");
    let challenger = message.member.user;
    let opponent = message.mentions.users.first();
    let components = await chessComponents(chess, "w");
    let urlMap = {
      b: "https://iili.io/dpouoTG.jpg",
      w: "https://iili.io/dpouCps.jpg",
    };

    let initMsg = await message.channel.send({
      content: `<:chess:1292536865743704187> <@${challenger.id}> ⚔️ <@${opponent.id}>`,
      files: [file],
      components: components,
      embeds: [
        {
          author: {
            name: "Current turn :",
            icon_url: urlMap["w"],
          },
          description: `<@${message.author.id}>`,
        },
      ],
    });
    await client.chess.set(initMsg.id, chess.pgn(), 3600000);
  },
};
