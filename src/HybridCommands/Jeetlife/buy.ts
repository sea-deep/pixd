import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { JeetlifeService } from "../../services/JeetlifeService.js";
import { CATALOG_ITEMS } from "../../data/jeetlife.js";
import emote from "../../../Configs/emote.js";

function resolveItemId(input: string): string | null {
  const norm = input.toLowerCase().replace(/[\s_-]+/g, "");
  for (const item of Object.values(CATALOG_ITEMS)) {
    const itemIdNorm = item.id.replace(/[\s_-]+/g, "");
    const itemNameNorm = item.name.toLowerCase().replace(/[\s_-]+/g, "");
    if (itemIdNorm === norm || itemNameNorm === norm || itemNameNorm.includes(norm) || norm.includes(itemIdNorm)) {
      return item.id;
    }
  }
  return null;
}

export default new HybridCommand({
  name: "buy",
  description: "Buy an item or street food from the Jeetlife shop.",
  aliases: ["purchase", "khareed"],
  usage: "<item> [quantity]",
  guildOnly: true,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "item",
      description: "Item or food to buy (e.g. samosa, chai, gloves, cycle)",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Integer,
      name: "quantity",
      description: "Quantity to purchase (1-10)",
      required: false,
    },
  ],
  execute: async (ctx, client) => {
    const rawItem = ctx.options.getString("item") ?? ctx.args?.[0];
    const rawQty = ctx.options.getInteger("quantity") ?? (ctx.args?.[1] ? parseInt(ctx.args[1], 10) : 1);

    if (!rawItem) {
      return ctx.reply("❌ Kripya item ka naam batayein! Example: `/buy samosa 2` ya `p!buy chai`");
    }

    const itemId = resolveItemId(rawItem);
    if (!itemId) {
      return ctx.reply(`❌ **${rawItem}** naam ka koi item dukaan mein nahi mila. Shop dekhne ke liye \`/shop\` chalayein.`);
    }

    const qty = Math.max(1, Math.min(10, isNaN(rawQty) ? 1 : rawQty));
    const res = await JeetlifeService.buyItem(ctx.user.id, itemId, qty);

    if ("error" in res && res.error) {
      return ctx.reply(res.message);
    }

    return ctx.reply({
      content: `✅ **Khareed Daari Safal!**\n• Item: **${res.quantity}x ${res.item?.name}**\n• Kul Kharcha: \`${res.totalCost}\` ${emote.paise}\n• Bacha hua Balance: \`${res.remainingBalance}\` ${emote.paise}`,
    });
  },
});
