import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { JeetlifeService } from "../../services/JeetlifeService.js";
import { JeetlifeViews } from "../../helpers/jeetlifeViews.js";

export default new HybridCommand({
  name: "shop",
  description: "Browse the Jeetlife bazaari for equipment, consumables, and street food.",
  aliases: ["bazaar", "market", "dukaan"],
  usage: "[category]",
  guildOnly: true,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "category",
      description: "Filter shop items",
      choices: [
        { name: "All Items", value: "all" },
        { name: "Street Food Corner", value: "food" },
      ],
      required: false,
    },
  ],
  execute: async (ctx, client) => {
    const category = ctx.options.getString("category") ?? ctx.args?.[0] ?? "all";
    const player = await JeetlifeService.ensurePlayer(ctx.user.id, ctx.user);
    const view = JeetlifeViews.renderShop(player, category, client.color);
    return ctx.reply(view);
  },
});
