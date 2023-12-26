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
    let newWord = [...value].map(char => `:regional_indicator_${char.toLowerCase()}:`).join(" ");

    if (words.ALL_WORDS.includes(value.toLowerCase())) {
      const oldChances = parseInt(interaction.message.embeds[0].fields[0].value);
      const newChances = oldChances - 1;
      let descArr = interaction.message.embeds[0].description.split('\n').reverse();
      descArr[newChances] = newWord;
      let newDesc = descArr.reverse().join('\n');

      let msg = {
        content: `<@${interaction.user.id}>'s game`,
        tts: false,
        components:  [
          {
            type: 1,
            components: [
              {
                style: 1,
                label: `EDIT`,
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
                label: `SUBMIT`,
                custom_id: `wordleSubmit`,
                disabled: false,
                emoji: {
                  id: null,
                  name: `🖨️`,
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
            type: 'rich',
            title: `WORDLE`,
            description: `${newDesc}`,
            color: 0x562fff,
            fields: [
              {
                name:  '🎚️ Chances Left :',
                value: newChances,
              },
            ],
          },
        ],
      };

     
        // If the game is not over
  //      msg.components =
      

      await interaction.deferUpdate();
      await interaction.message.edit(msg);
    } else {
      await interaction.reply({
        content: 'Please enter a valid word.',
        ephemeral: true,
      });
    }
  }
};