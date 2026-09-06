import Component from "../../structures/Component.js";
import { Chess } from "chess.js";
export default new Component({
  customId: "resign_chess",
  type: "button",
  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);
    if (
      !interaction.message.embeds[0].description.includes(interaction.member.id)
    ) {
      return interaction.followUp({
        content: ":x: **This is not your turn**",
        ephemeral: true,
      });
    }

    const chess = new Chess();
    chess.loadPgn(await client.chess.get(interaction.message.id));
    let playerMap = {
      w: interaction.message.mentions.parsedUsers.at(0).id,
      b: interaction.message.mentions.parsedUsers.at(1).id,
    };
    await client.chess.delete(interaction.message.id);
    await interaction.message.edit({
      components: [],
      embeds: [
        {
          author: {
            name: "GAME OVER",
          },
          description: `<@${interaction.member.id}> **Resigned**\n<@${playerMap[chess.turn() === "w" ? "b" : "w"]}> **wins!**`,
        },
      ],
    });
  },
});
