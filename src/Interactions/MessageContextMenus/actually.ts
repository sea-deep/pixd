import MessageContextMenu from "../../structures/MessageContextMenu.js";
import emote from "../../../Configs/emote.js";
import { PermissionFlagsBits } from "discord.js";
import ReactionBombService from "../../services/ReactionBombService.js";

export default new MessageContextMenu({
  data: { name: "React Nerd" },
  options: {
    permissions: {
      bot: [PermissionFlagsBits.AddReactions, PermissionFlagsBits.ReadMessageHistory],
    },
  },
  execute: async (interaction) => {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: 64 });
    }

    const targetMessage = interaction.targetMessage;
    if (!targetMessage) {
      return interaction.editReply({ content: "❌ Target message could not be found." });
    }

    const result = await ReactionBombService.deploy(
      interaction.user.id,
      targetMessage,
      emote.nerdEmojis
    );

    if (!result.success && result.reactedCount === 0) {
      return interaction.editReply({ content: result.error || "❌ Reaction deployment failed." });
    }

    return interaction.editReply({
      content: `🤓 *\"Erm, actually...\"*\nSuccessfully deployed **${result.reactedCount}** nerd reaction${result.reactedCount === 1 ? "" : "s"}!${
        result.error ? `\n${result.error}` : ""
      }`,
    });
  },
});


