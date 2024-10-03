import { describe } from "node:test";
import { title } from "process";

export default {
  name: "chain",
  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);
    let game = await client.keyv.get("chain_" + interaction.channel.id);
    if (game?.players.length === 0) {
        await interaction.followUp({
            content: "Send a word to start the game.",
            ephemeral:true,
        });
      const collector = interaction.channel.createMessageCollector({
        time: 150000,
      });

      collector.on("collect", async (m) => {
        let gam = await client.keyv.get("chain_" + interaction.channel.id);
        if (gam.players.includes(m.author.id)) {
          if (gam.words.length == 0) {
            gam.words.push(m.content.split(" ")[0].trim().toLowerCase());
            await client.keyv.set("chain_" + interaction.channel.id, gam);
            await m.react("✅");
          } else {
            let lastWord = gam.words[gam.words.length - 1];
            let newWord = m.content.split(" ")[0].trim().toLowerCase();
            let lastLetter = lastWord[lastWord.length - 1];
            let firstLetter = newWord[0];
            //  console.log(lastLetter, firstLetter, newWord, lastWord);
            if (lastLetter == firstLetter) {
              if (!gam.words.includes(newWord)) {
                gam.words.push(newWord);
                await client.keyv.set("chain_" + interaction.channel.id, gam);
                await m.react("✅");
                //    m.reply(`${JSON.stringify(gam, null, 2)}`)
              } else {
                m.react("❎");
              }
            } else {
              await client.keyv.set("chain_" + interaction.channel.id, {
                running: false,
                words: [],
                players: [],
              });
              await collector.stop();
              await interaction.message.edit({
                components: []
              })
              return m.reply({
                content: "Anddd the chain ends.",
                embeds: [
                  {
                    title: "Words of the game",
                    description: gam.words.join(" ") + ".",
                  },
                ],
              });
            }
          }
        }
      });
    }
    if (!game.players.includes(interaction.member.id)) {
      game.players.push(interaction.member.id);
      interaction.message.edit({
        embeds: [
          {
            color: 0xe08e67,
            description:
              "**RULES**: Send a word which begins with the last letter of the previous word",
            fields: [
              {
                name: "Current players",
                value:
                  interaction.message.embeds[0].fields[0].value +
                  ` <@${interaction.member.id}> -`,
              },
            ],
            footer: {
              text: "Join the game now by pressing the button below -",
            },
          },
        ],
      });
    }
  },
};
