import HybridCommand from "../../structures/HybridCommand.js";
import User from "../../models/jeetModel.js";
import emote from "../../../Configs/emote.js";

export default new HybridCommand({
  name: "daily",
  description: "Claim your daily Jeetlife balance.",
  aliases: ["d", "rojgaar"],
  guildOnly: true,
  execute: async (ctx, client) => {
    const amount = 100 + Math.floor(Math.random() * 100);
    const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    let data = await User.findOne({ userID: ctx.user.id });
    if (data?.lastDaily === today) return ctx.reply("**You have already claimed your daily rojgaar.**\n-# Come back tomorrow for more!");

    if (!data) {
      const letters = ctx.user.username.replace(/[^a-z]/gi, "").toUpperCase();
      data = new User({
        userID: ctx.user.id,
        balance: amount,
        dob: ctx.user.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        aadhaarNo: `${ctx.user.id.slice(0, 4)} ${ctx.user.id.slice(4, 8)} ${ctx.user.id.slice(8, 12)}`,
        panNo: `${letters.padEnd(5, "X").slice(0, 5)}${ctx.user.id.padStart(4, "0").slice(0, 4)}${letters.slice(-1) || "X"}`,
        lastDaily: today,
      });
      await data.save();
      return ctx.reply({
        content: `**You receive \`${amount}\` ${emote.paise} as your daily rojgaar.**`,
        embeds: [{ title: "New User!", description: `Welcome to Jeetlife, **${ctx.member?.displayName ?? ctx.user.username}**.`, color: client.color, thumbnail: { url: ctx.user.displayAvatarURL() } }],
        components: [{ type: 1, components: [
          { style: 2, custom_id: "pajeet", label: "Male", emoji: { name: "♂️" }, type: 2 },
          { style: 2, custom_id: "pajeeta", label: "Female", emoji: { name: "♀️" }, type: 2 },
        ] }],
      });
    }

    const claim = await User.updateOne({ userID: ctx.user.id, lastDaily: { $ne: today } }, { $inc: { balance: amount }, $set: { lastDaily: today } });
    if (!claim.modifiedCount) return ctx.reply("You have already claimed your daily rojgaar. Come back tomorrow!");
    return ctx.reply(`**You receive \`${amount}\` ${emote.paise} as your daily rojgaar.**`);
  },
});
