import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";

interface UrbanDefinition {
  word: string; definition: string; example: string; author: string;
  permalink: string; defid: number; thumbs_up: number; thumbs_down: number;
}

export default new HybridCommand({
  name: "ud",
  description: "Search Urban Dictionary.",
  aliases: ["urbandictionary"],
  usage: "<term>",
  guildOnly: true,
  options: [{ type: ApplicationCommandOptionType.String, name: "term", description: "Word or phrase", required: true }],
  execute: async (ctx, client) => {
    const term = ctx.options.getString("term", true)!;
    const endpoint = new URL("https://api.urbandictionary.com/v0/define");
    endpoint.searchParams.set("term", term);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Urban Dictionary returned HTTP ${response.status}.`);
    const body = await response.json() as { list?: UrbanDefinition[] };
    const definitions = body.list ?? [];
    if (definitions.length === 0) return ctx.reply({ embeds: [{ title: "Not found", description: "Couldn't find a definition for this term.", color: client.color }] });

    const definition = definitions[0];
    const sent = await ctx.reply({
      components: [{ type: 1, components: [
        { style: 1, custom_id: "ud_left", emoji: { name: "◀" }, type: 2 },
        { style: 2, label: `1/${definitions.length}`, custom_id: "nulll", disabled: true, type: 2 },
        { style: 1, custom_id: "ud_right", emoji: { name: "▶" }, type: 2 },
        { style: 5, label: `Get the “${definition.word}” mug.`.slice(0, 80), url: `https://urbandictionary.store/products/mug?defid=${definition.defid}`, emoji: { name: "🍵" }, type: 2 },
      ] }],
      embeds: [definitionEmbed(definition, client.color)],
    });
    await client.keyv.set(`ud${sent.id}`, term, 30 * 60);
  },
});

function definitionEmbed(definition: UrbanDefinition, color: number) {
  const linkTerms = (text: string) => text.replaceAll(/\[(.*?)\]/g, (_match, word: string) =>
    `[${word}](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)})`);
  return {
    title: definition.word.slice(0, 256),
    description: linkTerms(definition.definition).slice(0, 4096),
    color,
    fields: [{ name: "Example:", value: linkTerms(definition.example || "No example provided.").slice(0, 1024) }],
    author: { name: definition.author, url: "https://urbandictionary.com/" },
    footer: { text: `👍:${definition.thumbs_up} | 👎:${definition.thumbs_down}` },
    url: definition.permalink,
  };
}
