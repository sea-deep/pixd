import { Client, Message } from "discord.js";

export default {
  name: "wordchain",
  description: "",
  aliases: ["wc"],
  usage: "",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    let game = await client.keyv.get("chain_" + message.channel.id);
    if (!game?.running) {
      let msg = await message.channel.send({
        content:
          "**New Word Chain**\n" +
          `<@${message.author.id}> start the game by sending a word after pressing the button.`,
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
                  id: null,
                  name: `🖋️`,
                },
                type: 2,
              },
            ],
          },
        ],
      });

      await client.keyv.set("chain_" + message.channel.id, {
        running: true,
        words: [],
        players: [],
      });
    }
  },
};
