import { Client } from 'discord.js';
import { getColoredWord } from '../../Helpers/helpersWordle.js';
import words from '../../Assets/words.json' assert {type: "json"};
export default {
  name: 'guessedWordle',

  /**
    * @param {Client} client
    */
  async execute(interaction, client) {
    const value = interaction.fields.getTextInputValue('answer').toLowerCase();
    if (words.ALL_WORDS.includes(value.toLowerCase())) {
      const answer = client.keyv.get(interaction.message.id);
      const wordArr = getColoredWord(answer, value);
      const colouredWord = wordArr.join(' ');
      const oldChances = parseInt(interaction.message.embeds[0].fields[0].value);
      const newChances = oldChances - 1;
      let descArr = interaction.message.embeds[0].description.split('\n').reverse();
      descArr[newChances] = colouredWord;
      let newDesc = descArr.reverse().join('\n');

      const count = descArr.reduce((count, el) => (!el.includes('◻️') ? count + 1 : count), 0);

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
            type: 'rich',
            title: `WORDLE`,
            description: `${newDesc}`,
            color: 0x562fff,
            fields: [
              {
                name: `🏆 YOU WON`,
                value: `Your performance: \`${count}/6\``,
              },
            ],
          },
        ],
      };

      if (!wordArr.some((element) => !element.includes('green'))) {
        // If the player wins
        // client.keyv.delete(interaction.message.id);
      } else if (oldChances == 1) {
        // Updating the msg object for when the user loses
        msg.embeds[0].fields[0].name = '🦆 You Lost';
        msg.embeds[0].fields[0].value = `The word was \`${answer}\``;
        // client.keyv.delete(interaction.message.id);
      } else {
        // If the game is not over
        msg.components = [
          {
            type: 1,
            components: [
              {
                style: 1,
                label: `GUESS`,
                custom_id: `guessWordle`,
                disabled: false,
                emoji: {
                  id: null,
                  name: `🧐`,
                },
                type: 2,
              },
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
        msg.embeds[0].fields[0].name = '🎚️ Chances Left :';
        msg.embeds[0].fields[0].value = newChances;
      }

      await interaction.deferUpdate();
      await interaction.message.edit(msg);
    } else {
      await interaction.reply({
        content: 'Please enter a valid word.',
        ephemeral: true,
      });
    }
  }
}
