import Component from "../../../structures/Component.js";
import type { StringSelectMenuInteraction, Client } from "discord.js";
import { JeetlifeService } from "../../../services/JeetlifeService.js";
import { JeetlifeViews } from "../../../helpers/jeetlifeViews.js";
import { componentOwner } from "../../../utilities/InteractionRouting.js";
import emote from "../../../../Configs/emote.js";

export default new Component({
  customId: "jeet_select",
  type: "stringSelect",
  execute: async (interaction: StringSelectMenuInteraction, client: Client, ...params: string[]) => {
    const ownerId = componentOwner(interaction.message);
    if (ownerId && ownerId !== interaction.user.id) {
      return interaction.reply({
        content: "❌ Yeh aapka Jeetlife menu nahi hai! Apna dashboard kholne ke liye `/jeetlife` ya `p!jeetlife` chalayein.",
        ephemeral: true,
      });
    }

    const action = params[0];
    const selected = interaction.values[0];

    if (action === "buy_select") {
      const res = await JeetlifeService.buyItem(interaction.user.id, selected, 1);
      if ("error" in res && res.error) {
        return interaction.reply({ content: `⚠️ ${res.message}`, ephemeral: true });
      }
      if (!res.player) return interaction.reply({ content: "Error purchasing item.", ephemeral: true });
      const view = JeetlifeViews.renderShop(res.player, "all", client.color);
      await interaction.reply({
        content: `✅ Aapne **1x ${res.item?.name}** khareeda for \`${res.totalCost}\` ${emote.paise}!\n-# Naya balance: \`${res.player.balance}\` ${emote.paise}`,
        ephemeral: true,
      });
      return interaction.message.edit(view);
    }

    if (action === "use_select") {
      const res = await JeetlifeService.useItem(interaction.user.id, selected);
      if ("error" in res && res.error) {
        return interaction.reply({ content: `⚠️ ${res.message}`, ephemeral: true });
      }
      await interaction.reply({
        content: `${res.item?.icon ?? "📦"} **${res.item?.name}** use kiya:\n> *${res.message}*`,
        ephemeral: true,
      });
      const view = JeetlifeViews.renderInventory(res.player, interaction.user, client.color);
      return interaction.message.edit(view);
    }

    if (action === "job_select") {
      const res = await JeetlifeService.startShift(interaction.user.id, selected);
      if ("error" in res && res.error) {
        return interaction.reply({ content: `⚠️ ${res.message}`, ephemeral: true });
      }
      const view = JeetlifeViews.renderTaskRound(res.player, res.activeShift, client.color);
      return interaction.update(view);
    }

    return interaction.reply({ content: "Unknown select menu action.", ephemeral: true });
  },
});
