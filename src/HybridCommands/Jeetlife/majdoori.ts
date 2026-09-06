import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { JeetlifeService } from "../../services/JeetlifeService.js";
import { JeetlifeViews } from "../../helpers/jeetlifeViews.js";

export default new HybridCommand({
  name: "majdoori",
  description: "Start or resume a work shift at a site, tapri stall, or modern gig delivery.",
  aliases: ["work", "kaam", "shift"],
  usage: "[job]",
  guildOnly: true,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "job",
      description: "Job type to work on",
      choices: [
        { name: "Maal Utaro (Site Cargo)", value: "maal_utaro" },
        { name: "Stall Pe Majdoori (Chai/Samosa)", value: "stall_majdoori" },
        { name: "Mix Banao (Mortar Mix)", value: "mix_banao" },
        { name: "Hisaab Milao (Tally Audit)", value: "hisaab_milao" },
        { name: "Bhookhmato Delivery (Food Gig)", value: "bhookhmato_delivery" },
        { name: "Jhatpat 10-Min Delivery (Quick-Commerce)", value: "jhatpat_delivery" },
      ],
      required: false,
    },
  ],
  execute: async (ctx, client) => {
    const jobInput = ctx.options.getString("job") ?? (ctx.args && ctx.args[0]);

    if (!jobInput) {
      const player = await JeetlifeService.ensurePlayer(ctx.user.id, ctx.user);
      // Check if player has an active unexpired shift
      if (player.activeShift && player.activeShift.sessionId) {
        const now = new Date();
        if (player.activeShift.expiresAt && now < new Date(player.activeShift.expiresAt)) {
          const view = JeetlifeViews.renderTaskRound(player, player.activeShift, client.color);
          return ctx.reply(view);
        }
      }
      const view = JeetlifeViews.renderJobList(player, ctx.user, client.color);
      return ctx.reply(view);
    }

    const res = await JeetlifeService.startShift(ctx.user.id, jobInput);
    if ("error" in res && res.error) {
      return ctx.reply({ content: res.message });
    }

    const view = JeetlifeViews.renderTaskRound(res.player, res.activeShift, client.color);
    return ctx.reply(view);
  },
});
