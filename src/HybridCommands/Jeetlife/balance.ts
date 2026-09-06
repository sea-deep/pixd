import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import User from "../../models/jeetModel.js";
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
    let data = await User.findOne({ userID: target.id });
    if (!data && target.id !== ctx.user.id) return ctx.reply(`**${displayName} has not joined Jeetlife yet!**`);
    if (!data) {
      data = await new User({ userID: target.id }).save();
      return ctx.reply({
        content: `**${displayName}'s balance:** \`0\` ${emote.paise}`,
        embeds: [{ title: "New User!", description: `Welcome to Jeetlife, **${displayName}**.`, color: client.color, thumbnail: { url: target.displayAvatarURL() } }],
      });
    }
    return ctx.reply(`**${displayName}'s balance:** \`${data.balance}\` ${emote.paise}`);
  },
});
