import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";

interface FileResult {
  file_name: string;
  file_type: string;
  file_size: string;
  time_ago: string;
  file_link: string;
}

interface FilePursuitResponse {
  status: string;
  files_found?: FileResult[];
}

export default new HybridCommand({
  name: "piracy",
  description: "Search for indexed videos, audio, ebooks, apps, and archives.",
  aliases: ["pirate"],
  usage: "<query> [type] [sort]",
  guildOnly: true,
  ephemeral: true,
  options: [
    { type: ApplicationCommandOptionType.String, name: "query", description: "What are you searching for?", required: true },
    { type: ApplicationCommandOptionType.String, name: "type", description: "File type", choices: [
      { name: "Videos 🎥", value: "video" }, { name: "Audios 🎵", value: "audio" },
      { name: "eBooks 📚", value: "ebook" }, { name: "Mobile apps 📱", value: "mobile" },
      { name: "Archives (ZIP/ISO) ⛓", value: "archive" },
    ] },
    { type: ApplicationCommandOptionType.String, name: "sort", description: "Sort order", choices: [
      { name: "Date Added 🔽", value: "datedesc" }, { name: "Date Added 🔼", value: "dateasc" },
      { name: "Size 🔽", value: "sizedesc" }, { name: "Size 🔼", value: "sizeasc" },
      { name: "Name (A-Z)", value: "fileasc" }, { name: "Name (Z-A)", value: "filedesc" },
    ] },
  ],
  execute: async (ctx, client) => {
    const apiKey = process.env.RAPID_KEY;
    if (!apiKey) return ctx.reply("❌ `RAPID_KEY` is not configured.");

    let query = ctx.options.getString("query", true)!;
    let type = ctx.options.getString("type");
    let sort = ctx.options.getString("sort");
    if (!ctx.isSlash) {
      const words = [...ctx.args];
      sort = /^(datedesc|dateasc|sizedesc|sizeasc|fileasc|filedesc)$/.test(words.at(-1) ?? "") ? words.pop()! : null;
      type = /^(video|audio|ebook|mobile|archive)$/.test(words.at(-1) ?? "") ? words.pop()! : null;
      query = words.join(" ");
      if (!query) return ctx.reply("Please provide a search query.");
    }
    const params = new URLSearchParams({ q: query });
    if (type) params.set("type", type);
    if (sort) params.set("sort", sort);

    const response = await fetch(`https://filepursuit.p.rapidapi.com/?${params}`, {
      headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "filepursuit.p.rapidapi.com" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`File search returned HTTP ${response.status}.`);
    const result = await response.json() as FilePursuitResponse;
    const files = result.files_found?.slice(0, 30) ?? [];
    if (result.status !== "success" || files.length === 0) return ctx.reply("**❌ No results found.**");

    const chunks = Array.from({ length: Math.ceil(files.length / 10) }, (_, index) => files.slice(index * 10, index * 10 + 10));
    for (const [index, chunk] of chunks.entries()) {
      const payload = {
        content: `${index === 0 ? `Found **${result.files_found?.length ?? files.length} results.** ` : ""}(${index + 1}/${chunks.length})`,
        ephemeral: true,
        embeds: [{
          title: index === 0 ? `🔍 ${query}` : undefined,
          color: client.color,
          fields: chunk.map((file, itemIndex) => ({
            name: `${index * 10 + itemIndex + 1}. ${file.file_name}`.slice(0, 256),
            value: `>>> **Type:** \`${file.file_type}\`\n**Size:** \`${file.file_size || "N/A"}\`\n**Added ${file.time_ago}**\n**File link:** [\`Click here\`](${file.file_link})`.slice(0, 1024),
          })),
          footer: { text: "Note: Some third-party links may not work." },
        }],
      };
      if (index === 0) await ctx.reply(payload);
      else await ctx.followUp(payload);
    }
  },
});
