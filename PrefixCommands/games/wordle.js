import { Client, Message } from "discord.js";
import words from "../../Assets/words.json" with { type: "json" };
export default {
  name: "wordle",
  description: "Play wordle om discord!",
  aliases: ["playwordle"],
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
    let msg = await message.reply({
      content: `<@${message.author.id}>'s game`,
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
                id: null,
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
                id: null,
                name: `❓`,
              },
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: "rich",
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
};
