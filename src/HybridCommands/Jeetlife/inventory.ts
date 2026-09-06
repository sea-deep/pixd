import HybridCommand from "../../structures/HybridCommand.js";
import User from "../../models/jeetModel.js";

export default new HybridCommand({
  name: "inventory",
  description: "See your Jeetlife inventory.",
  aliases: ["invenory", "inv", "items"],
  guildOnly: true,
  execute: async (ctx, client) => {
    let data = await User.findOne({ userID: ctx.user.id });
    const isNew = !data;
    if (!data) data = await new User({ userID: ctx.user.id }).save();
    const inventory = data.inventory.map((item, index) => `${index + 1}. ${item.icon ?? ""} ${item.itemName} \`x${item.amount}\``).join("\n") || "Your inventory is empty.";
    return ctx.reply({
      content: `**${ctx.member?.displayName ?? ctx.user.username}'s inventory**`,
      embeds: [{
        title: isNew ? "New User!" : undefined,
        description: `${isNew ? `Welcome to Jeetlife!\n` : ""}${inventory}\n-# Use an item with its item number.`,
        color: client.color,
        thumbnail: { url: "https://www.clipartmax.com/png/middle/347-3475012_inventory-png-photos-inventory-icon-free.png" },
      }],
    });
  },
});
