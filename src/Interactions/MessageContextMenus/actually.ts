import MessageContextMenu from "../../structures/MessageContextMenu.js";
import emote from "../../../Configs/emote.js";
import { PermissionFlagsBits, DiscordAPIError } from "discord.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    if (interaction.guild && interaction.channel && "permissionsFor" in interaction.channel && interaction.client.user) {
      const perms = interaction.channel.permissionsFor(interaction.client.user);
      if (perms && (!perms.has(PermissionFlagsBits.AddReactions) || !perms.has(PermissionFlagsBits.ReadMessageHistory))) {
        return interaction.editReply({
          content: "❌ I need `Add Reactions` and `Read Message History` permissions in this channel!",
        });
      }
    }

    // Discord allows maximum 20 unique reactions per message
    const existingReactionsCount = targetMessage.reactions?.cache?.size || 0;
    const remainingSlots = Math.max(0, 20 - existingReactionsCount);

    if (remainingSlots === 0) {
      return interaction.editReply({
        content: "❌ This message already has the maximum of 20 reactions!",
      });
    }

    const emojisToReact = emote.nerdEmojis.slice(0, remainingSlots);
    let reactedCount = 0;

    for (const emoji of emojisToReact) {
      try {
        await targetMessage.react(emoji);
        reactedCount++;
        // 260ms pacing to stay comfortably within Discord's 4/sec reaction rate limit bucket
        await sleep(260);
      } catch (err: any) {
        if (err instanceof DiscordAPIError) {
          if (err.code === 30010) {
            // Maximum number of reactions reached on this message
            break;
          }
          if (err.code === 10008) {
            // Target message deleted
            return interaction.editReply({ content: "⚠️ The target message was deleted." });
          }
          if (err.code === 50013) {
            // Missing permissions
            return interaction.editReply({ content: "❌ Missing permission to react in this channel." });
          }
        }
        console.error("Failed reacting with nerd emoji:", err);
      }
    }

    return interaction.editReply({
      content: `🤓 *\"Erm, actually...\"*\nSuccessfully deployed **${reactedCount}** nerd reaction${reactedCount === 1 ? "" : "s"}!`,
    });
  },
});

