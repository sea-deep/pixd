import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { JeetlifeService } from "../../services/JeetlifeService.js";
import emote from "../../../Configs/emote.js";

export default new HybridCommand({
  name: "balance",
  description: "Check your or another user's Jeetlife balance.",
  aliases: ["bal", "paise", "paisa"],
  usage: "[user]",
  guildOnly: true,
  options: [{ type: ApplicationCommandOptionType.User, name: "user", description: "User whose balance you want to see" }],
  execute: async (ctx, client) => {
    const target = ctx.options.getUser("user") ?? ctx.user;
    const displayName = target.id === ctx.user.id ? (ctx.member?.displayName ?? target.username) : (target.globalName ?? target.username);

    if (target.id !== ctx.user.id) {
      const data = await JeetlifeService.getBalance(target.id);
      if (!data) return ctx.reply(`**${displayName} has not joined Jeetlife yet!**`);
      return ctx.reply(`**${displayName}'s balance:** \`${data.balance}\` ${emote.paise}`);
    }

    const player = await JeetlifeService.ensurePlayer(ctx.user.id, ctx.user);
    return ctx.reply({
      content: `**${displayName}'s balance:** \`${player.balance}\` ${emote.paise}`,
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
