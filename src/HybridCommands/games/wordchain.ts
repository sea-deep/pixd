import HybridCommand from "../../structures/HybridCommand.js";
import { Client, Message } from "discord.js";

export default new HybridCommand({
  name: "wordchain",
  description: "Start a word-chain game in this channel.",
  aliases: ["wc"],
  usage: "",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (ctx, client) => {
    let game = await client.keyv.get("chain_" + ctx.channel!.id);
    if (!game?.running) {
      let msg = await ctx.reply({
        content:
          "**New Word Chain**\n" +
          `<@${ctx.user.id}> start the game by sending a word after pressing the button.`,
        embeds: [
          {
            color: 0xe08e67,
            description:
              "**RULES**: Send a word which begins with the last letter of the previous word",
            fields: [
              {
                name: "Current players",
                value: `-`,
              },
            ],
            footer: {
              text: "Join the game now by pressing the button below -",
            },
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                style: 2,
                label: `JOIN GAME`,
                custom_id: `chain`,
                disabled: false,
                emoji: {

                  name: `🖋️`,
                },
                type: 2,
              },
            ],
          },
        ],
      });

      await client.keyv.set("chain_" + ctx.channel!.id, {
        running: true,
        words: [],
        players: [],
      });
    } else {
      return ctx.reply("A word-chain game is already running in this channel.");
    }
  },
});
