import { Client } from "discord.js";
import { getColoredWord } from "../../../Helpers/helpersWordle.js";
import words from "../../../Assets/words.json" assert { type: "json" };
export default {
  name: "wordleSubmit",

  /**
   * @param {Client} client
   */
  async execute(interaction, client) {
    if (interaction.message.mentions.users.first().id !== interaction.user.id) {
      return interaction.reply({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: "❌ *This is not your game.*",
            color: 0xe08e67,
          },
        ],
      });
    }
    await interaction.deferUpdate();
    const answer = client.keyv.get(interaction.message.id);

    const oldChances = parseInt(interaction.message.embeds[0].fields[0].value);
    const newChances = oldChances - 1;
    let descArr = interaction.message.embeds[0].description
      .split("\n")
      .reverse();

    // console.log(descArr, oldChances)

    const value = descArr[newChances]
      .replace(/:regional_indicator_(\w+):/g, (_, p1) => p1.toUpperCase())
      .replace(/\s/g, "")
      .toLowerCase();
    const wordArr = getColoredWord(answer, value);
    const colouredWord = wordArr.join(" ");
    descArr[newChances] = colouredWord;

    let newDesc = descArr.reverse().join("\n");

    const count = descArr.reduce(
      (count, el) => (!el.includes("◻️") ? count + 1 : count),
      0,
    );

    let msg = {
      content: `<@${interaction.user.id}>'s game`,
      tts: false,
      components: [
        {
          type: 1,
          components: [
            {
              style: 1,
              label: `Get Definition`,
              custom_id: `getWordDef`,
              disabled: false,
              emoji: {
                id: null,
                name: `ℹ️`,
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
          description: `${newDesc}`,
          color: 0xe08e67,
          fields: [
            {
              name: `🏆 YOU WON`,
              value: `Your performance: \`${count}/6\``,
            },
          ],
        },
      ],
    };

    if (!wordArr.some((element) => !element.includes("green"))) {
      // If the player wins
    } else if (oldChances == 1) {
      // Updating the msg object for when the user loses
      msg.embeds[0].fields[0].name = "🦆 You Lost";
      msg.embeds[0].fields[0].value = `The word was \`${answer}\``;
    } else {
      msg.components = [
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
      ];
      msg.embeds[0].fields[0].name = "🎚️ Chances Left :";
      msg.embeds[0].fields[0].value = newChances;
    }
    await interaction.message.edit(msg);
  },
};
