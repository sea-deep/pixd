import Component from "../../../structures/Component.js";
import type { ButtonInteraction, Client } from "discord.js";
import { JeetlifeService } from "../../../services/JeetlifeService.js";
import { JeetlifeViews } from "../../../helpers/jeetlifeViews.js";
import { componentOwner } from "../../../utilities/InteractionRouting.js";
import emote from "../../../../Configs/emote.js";

export default new Component({
  customId: "jeet",
  type: "button",
  execute: async (interaction: ButtonInteraction, client: Client, ...params: string[]) => {
    // Security check: only the player who initiated the session can click economic buttons
    const ownerId = componentOwner(interaction.message);
    if (ownerId && ownerId !== interaction.user.id) {
      return interaction.reply({
        content: "❌ Yeh aapka Jeetlife dashboard/shift nahi hai! Apna dashboard kholne ke liye `/jeetlife` ya `p!jeetlife` chalayein.",
        ephemeral: true,
      });
    }

    const action = params[0] || "dash";

    if (action === "dash") {
      const player = await JeetlifeService.ensurePlayer(interaction.user.id, interaction.user);
      const view = JeetlifeViews.renderDashboard(player, interaction.user, client.color);
      return interaction.update(view);
    }

    if (action === "card") {
      const player = await JeetlifeService.ensurePlayer(interaction.user.id, interaction.user);
      const view = JeetlifeViews.renderCard(player, interaction.user, client.color);
      return interaction.update(view);
    }

    if (action === "jobs") {
      const player = await JeetlifeService.ensurePlayer(interaction.user.id, interaction.user);
      const view = JeetlifeViews.renderJobList(player, interaction.user, client.color);
      return interaction.update(view);
    }

    if (action === "work") {
      const jobId = params[1] || "maal_utaro";
      const res = await JeetlifeService.startShift(interaction.user.id, jobId);
      if ("error" in res && res.error) {
        return interaction.reply({ content: res.message, ephemeral: true });
      }
      const view = JeetlifeViews.renderTaskRound(res.player, res.activeShift, client.color);
      return interaction.update(view);
    }

    if (action === "ans") {
      const sessionId = params[1];
      const round = parseInt(params[2], 10);
      const choice = parseInt(params[3], 10);

      const res = await JeetlifeService.submitAnswer(interaction.user.id, sessionId, round, choice);

      if ("error" in res && res.error) {
        return interaction.reply({ content: res.message, ephemeral: true });
      }

      if ("retryAvailable" in res && res.retryAvailable) {
        return interaction.update({
          embeds: [
            {
              title: "❌ Galat Jawab!",
              description: `**${res.message}**\n\nTapri Chai peekar ek mauka lene ke liye niche click karein:`,
              color: 0xe53935,
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 3,
                  custom_id: `jeet:chai:${sessionId}`,
                  label: "☕ Peeyo Tapri Chai (Retry)",
                },
                {
                  type: 2,
                  style: 2,
                  custom_id: `jeet:skip_retry:${sessionId}:${round}`,
                  label: "Skip without Retry",
                },
              ],
            },
          ],
        });
      }

      if ("nextRound" in res && res.nextRound) {
        const view = JeetlifeViews.renderTaskRound(res.player, res.activeShift, client.color);
        return interaction.update(view);
      }

      if ("completed" in res && res.completed) {
        const view = JeetlifeViews.renderShiftSummary(res, interaction.user, client.color);
        return interaction.update(view);
      }
    }

    if (action === "skip_retry") {
      const sessionId = params[1];
      const round = parseInt(params[2], 10);
      // Skip retry counts as an incorrect answer and advances or settles
      const player = await JeetlifeService.ensurePlayer(interaction.user.id, interaction.user);
      if (player.activeShift && player.activeShift.sessionId === sessionId) {
        player.activeShift.usedChai = true; // prevent infinite loops
        await player.save();
        // Submit dummy wrong choice to proceed
        const res = await JeetlifeService.submitAnswer(interaction.user.id, sessionId, round, -1);
        if ("nextRound" in res && res.nextRound) {
          const view = JeetlifeViews.renderTaskRound(res.player, res.activeShift, client.color);
          return interaction.update(view);
        }
        if ("completed" in res && res.completed) {
          const view = JeetlifeViews.renderShiftSummary(res, interaction.user, client.color);
          return interaction.update(view);
        }
      }
      const view = JeetlifeViews.renderDashboard(player, interaction.user, client.color);
      return interaction.update(view);
    }

    if (action === "chai") {
      const sessionId = params[1];
      const res = await JeetlifeService.useChaiRetry(interaction.user.id, sessionId);
      if ("error" in res && res.error) {
        return interaction.reply({ content: res.message, ephemeral: true });
      }
      const view = JeetlifeViews.renderTaskRound(res.player, res.activeShift, client.color);
      return interaction.update(view);
    }

    if (action === "shop") {
      const category = params[1] || "all";
      const player = await JeetlifeService.ensurePlayer(interaction.user.id, interaction.user);
      const view = JeetlifeViews.renderShop(player, category, client.color);
      return interaction.update(view);
    }

    if (action === "buy") {
      const itemId = params[1];
      const qty = parseInt(params[2] || "1", 10);
      const res = await JeetlifeService.buyItem(interaction.user.id, itemId, qty);
      if ("error" in res && res.error) {
        return interaction.reply({ content: res.message, ephemeral: true });
      }
      const view = JeetlifeViews.renderShop(res.player, "all", client.color);
      await interaction.reply({
        content: `✅ Aapne **${qty}x ${res.item?.name}** khareeda for \`${res.totalCost}\` ${emote.paise}!`,
        ephemeral: true,
      });
      return interaction.message.edit(view);
    }

    if (action === "inv") {
      const player = await JeetlifeService.ensurePlayer(interaction.user.id, interaction.user);
      const view = JeetlifeViews.renderInventory(player, interaction.user, client.color);
      return interaction.update(view);
    }

    if (action === "use") {
      const itemId = params[1];
      const res = await JeetlifeService.useItem(interaction.user.id, itemId);
      if ("error" in res && res.error) {
        return interaction.reply({ content: res.message, ephemeral: true });
      }
      await interaction.reply({
        content: `${res.item?.icon} **${res.item?.name}** use kiya:\n> *${res.message}*`,
        ephemeral: true,
      });
      const view = JeetlifeViews.renderInventory(res.player, interaction.user, client.color);
      return interaction.message.edit(view);
    }

    if (action === "daily") {
      const res = await JeetlifeService.claimDaily(interaction.user.id, interaction.user);
      if (!res.success) {
        return interaction.reply({ content: `⚠️ ${res.message}`, ephemeral: true });
      }
      await interaction.reply({
        content: `🎉 **Daily Attendance Lag Gayi!** Aapko \`24\` ${emote.paise} mile!\nNaya balance: \`${res.balance}\` ${emote.paise}.`,
        ephemeral: true,
      });
      const player = await JeetlifeService.ensurePlayer(interaction.user.id, interaction.user);
      const view = JeetlifeViews.renderDashboard(player, interaction.user, client.color);
      return interaction.message.edit(view);
    }

    return interaction.reply({ content: "Unknown action.", ephemeral: true });
  },
});
