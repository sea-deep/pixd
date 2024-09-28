import { Client } from "discord.js";
import words from "../../Assets/words.js";
export default {
  name: "guessedWordle",

  /**
   * @param {Client} client
   */
  async execute(interaction, client) {
    await client.interactionDefer(interaction);

    const value = interaction.fields.getTextInputValue("answer").toLowerCase();
    let newWord = [...value]
      .map((char) => `:regional_indicator_${char.toLowerCase()}:`)
      .join(" ");

    if (words.ALL_WORDS.includes(value.toLowerCase())) {
      const chances = parseInt(interaction.message.embeds[0].fields[0].value);

      let descArr = interaction.message.embeds[0].description
        .split("\n")
        .reverse();
      descArr[chances - 1] = newWord;
      let newDesc = descArr.reverse().join("\n");

      let msg = {
        content: `<@${interaction.user.id}>'s game`,
        tts: false,
        components: [
          {
            type: 1,
            components: [
              {
                style: 2,
                label: `EDIT`,
                custom_id: `guessWordle`,
                disabled: false,
                emoji: {
                  id: null,
                  name: `🖋️`,
                },
                type: 2,
              },
              {
                style: 1,
                label: `SUBMIT`,
                custom_id: `wordleSubmit`,
                disabled: false,
                emoji: {
                  id: null,
                  name: `🔏`,
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
            description: `${newDesc}`,
            color: client.color,
            fields: [
              {
                name: "🎚️ Chances Left :",
                value: chances,
              },
            ],
          },
        ],
      };

      await interaction.message.edit(msg);
    } else {
      await interaction.followUp({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: "**Please enter a valid word**.",
            color: client.color,
          },
        ],
      });
    }
  },
};
