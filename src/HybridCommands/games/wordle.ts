import HybridCommand from "../../structures/HybridCommand.js";
import { Client, Message } from "discord.js";
import words from "../../data/words.js";
export default new HybridCommand({
  name: "wordle",
  description: "Play wordle om discord!",
  aliases: ["playwordle"],
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
    let msg = await ctx.reply({
      content: `<@${ctx.user.id}>'s game`,
      tts: false,
      components: [
        {
          type: 1,
          components: [
            {
              style: 2,
              label: `ENTER`,
              custom_id: `guessWordle`,
              disabled: false,
              emoji: {

                name: `🖋️`,
              },
              type: 2,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              style: 4,
              label: `How to play?`,
              custom_id: `htpWordle`,
              disabled: false,
              emoji: {

                name: `❓`,
              },
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {

          title: `WORDLE`,
          description: [
            `◻️ ◻️ ◻️ ◻️ ◻️`,
            `◻️ ◻️ ◻️ ◻️ ◻️`,
            `◻️ ◻️ ◻️ ◻️ ◻️`,
            `◻️ ◻️ ◻️ ◻️ ◻️`,
            `◻️ ◻️ ◻️ ◻️ ◻️`,
            `◻️ ◻️ ◻️ ◻️ ◻️`,
          ].join("\n"),
          color: 0xe08e67,
          fields: [
            {
              name: `🎚️ Chances Left :`,
              value: `6`,
            },
          ],
        },
      ],
    });

    let key = msg.id;
    let val = words.words[Math.floor(Math.random() * words.words.length)];
    client.keyv.set(key, val);
  },
});
