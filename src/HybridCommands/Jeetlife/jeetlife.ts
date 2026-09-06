import HybridCommand from "../../structures/HybridCommand.js";
import { JeetlifeService } from "../../services/JeetlifeService.js";
import { JeetlifeViews } from "../../helpers/jeetlifeViews.js";

export default new HybridCommand({
  name: "jeetlife",
  description: "View your Jeetlife dashboard, MGNREGA card, and daily attendance.",
  aliases: ["jl"],
  guildOnly: true,
  execute: async (ctx, client) => {
    const player = await JeetlifeService.ensurePlayer(ctx.user.id, ctx.user);
    const view = JeetlifeViews.renderDashboard(player, ctx.user, client.color);
    return ctx.reply(view);
  },
});
