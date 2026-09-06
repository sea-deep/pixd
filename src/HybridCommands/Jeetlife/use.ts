import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { JeetlifeService } from "../../services/JeetlifeService.js";
import { CATALOG_ITEMS } from "../../data/jeetlife.js";

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
  name: "use",
  description: "Consume food or use an item from your Jeetlife inventory.",
  aliases: ["consume", "khao", "peeyo"],
  usage: "<item>",
  guildOnly: true,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "item",
      description: "Item or food to consume (e.g. samosa, chai, vimal)",
      required: true,
    },
  ],
  execute: async (ctx, client) => {
    const rawItem = ctx.options.getString("item") ?? ctx.args?.[0];

    if (!rawItem) {
      return ctx.reply("❌ Kripya item ka naam batayein! Example: `/use samosa` ya `p!use chai`");
    }

    const itemId = resolveItemId(rawItem);
    if (!itemId) {
      return ctx.reply(`❌ **${rawItem}** naam ka koi item nahi mila.`);
    }

    const res = await JeetlifeService.useItem(ctx.user.id, itemId);

    if ("error" in res && res.error) {
      return ctx.reply(res.message);
    }

    return ctx.reply({
      content: `${res.item?.icon} **${res.item?.name}** use kiya:\n> *${res.message}*`,
    });
  },
});
