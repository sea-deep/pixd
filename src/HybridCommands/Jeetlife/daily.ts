import HybridCommand from "../../structures/HybridCommand.js";
import { JeetlifeService } from "../../services/JeetlifeService.js";
import emote from "../../../Configs/emote.js";

export default new HybridCommand({
  name: "daily",
  description: "Claim your daily Jeetlife attendance allowance (24 paise).",
  aliases: ["d", "rojgaar"],
  guildOnly: true,
  execute: async (ctx, client) => {
    const res = await JeetlifeService.claimDaily(ctx.user.id, ctx.user);
    if (!res.success) {
      return ctx.reply({
        content: `**Aapne aaj ki daily attendance pehle hi claim kar li hai!**\n-# Kal dubara aana ya majdoori (\`/majdoori\`) karke kamao!`,
      });
    }

    return ctx.reply({
      content: `**You receive \`24\` ${emote.paise} as your daily rojgaar attendance.**\n-# Naya balance: \`${res.balance}\` ${emote.paise}`,
      components: [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "jeet:jobs", label: "Majdoori (Work)", emoji: { name: "🔨" } },
            { type: 2, style: 2, custom_id: "jeet:dash", label: "Dashboard", emoji: { name: "🏠" } },
          ],
        },
      ],
    });
  },
});
