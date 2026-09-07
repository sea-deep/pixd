import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { formatBytes } from "../../services/StorageService.js";
import Logger from "../../helpers/Logger.js";

interface ApibayEntry {
  id: string;
  name: string;
  info_hash: string;
  leechers: string;
  seeders: string;
  size: string;
  category: string;
  status?: string;
  added?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  video: "200,201,202,203,204,205,206,207,208,209,299",
  movies: "200,201,202,203,204,205,206,207,208,209,299",
  movie: "200,201,202,203,204,205,206,207,208,209,299",
  audio: "100,101,102,103,104,199",
  music: "100,101,102,103,104,199",
  apps: "300,301,302,303,304,305,306,399",
  mobile: "304,305,306",
  games: "400,401,402,403,404,405,406,407,408,499",
  game: "400,401,402,403,404,405,406,407,408,499",
  ebook: "600,601,602,603,604,699",
  archive: "300,600",
};

const TRACKERS = [
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.torrent.eu.org:451/announce",
];

function getCategoryLabel(category: number): string {
  if (category >= 100 && category < 200) return "🎵 Audio";
  if (category >= 200 && category < 300) return "🎬 Video";
  if (category >= 300 && category < 400) return "💻 Apps";
  if (category >= 400 && category < 500) return "🎮 Games";
  if (category >= 500 && category < 600) return "🔞 NSFW";
  if (category >= 600 && category < 700) return "📚 Other";
  return "📦 Files";
}

function buildMagnet(infoHash: string, name: string): string {
  const tr = TRACKERS.map((t) => `&tr=${encodeURIComponent(t)}`).join("");
  return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(name)}${tr}`;
}

export default new HybridCommand({
  name: "piracy",
  description: "Search for indexed movies, music, games, software, and torrents.",
  aliases: ["pirate"],
  usage: "<query> [type]",
  guildOnly: true,
  ephemeral: true,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "query",
      description: "What are you searching for?",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "type",
      description: "Category filter",
      choices: [
        { name: "All 🌐", value: "all" },
        { name: "Videos & Movies 🎬", value: "video" },
        { name: "Audio & Music 🎵", value: "audio" },
        { name: "Games 🎮", value: "games" },
        { name: "Apps & Software 💻", value: "apps" },
        { name: "eBooks & Other 📚", value: "ebook" },
      ],
    },
  ],
  execute: async (ctx, client) => {
    let query = ctx.options.getString("query", true)?.trim();
    let type = ctx.options.getString("type")?.trim().toLowerCase();

    if (!ctx.isSlash) {
      const words = [...ctx.args];
      const lastWord = (words.at(-1) ?? "").toLowerCase();
      if (CATEGORY_MAP[lastWord] || lastWord === "all") {
        type = words.pop()!;
      }
      query = words.join(" ").trim();
    }

    if (!query) {
      return ctx.reply("❌ Please provide a search query.");
    }

    const catParam = type && CATEGORY_MAP[type] ? `&cat=${CATEGORY_MAP[type]}` : "";
    const endpoint = `https://apibay.org/q.php?q=${encodeURIComponent(query)}${catParam}`;

    let data: ApibayEntry[];
    try {
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": "PixD/1.0" },
      });
      if (!response.ok) {
        return ctx.reply(`❌ Search service returned HTTP ${response.status}. Please try again later.`);
      }
      data = (await response.json()) as ApibayEntry[];
    } catch (err: any) {
      Logger.warn(`Piracy search failed for query '${query}':`, err);
      return ctx.reply("❌ Search service timed out or is temporarily unavailable. Please try again later.");
    }

    if (!Array.isArray(data) || data.length === 0 || data[0]?.id === "0" || data[0]?.name === "No results returned") {
      return ctx.reply(`❌ **No results found for \`${query}\`.**`);
    }

    // Filter out NSFW if channel is not marked NSFW
    const isNsfwChannel = Boolean(ctx.channel && "nsfw" in ctx.channel && ctx.channel.nsfw);
    const validResults = data.filter((item) => {
      const catNum = Number(item.category) || 0;
      if (!isNsfwChannel && catNum >= 500 && catNum < 600) return false;
      return true;
    });

    if (validResults.length === 0) {
      return ctx.reply(`❌ **No results found for \`${query}\` in this channel.**`);
    }

    // Sort by seeders descending
    validResults.sort((a, b) => (Number(b.seeders) || 0) - (Number(a.seeders) || 0));

    // Display top 7 results to comfortably fit Discord embed limits
    const topResults = validResults.slice(0, 7);

    const description = topResults
      .map((item, index) => {
        const catLabel = getCategoryLabel(Number(item.category) || 0);
        const sizeFormatted = formatBytes(Number(item.size) || 0);
        const magnet = buildMagnet(item.info_hash, item.name);
        const titleClean = item.name.replace(/[*_`~]/g, "").slice(0, 75);
        return [
          `**${index + 1}. ${titleClean}**`,
          `${catLabel} • 💾 \`${sizeFormatted}\` • 🟢 \`${item.seeders}\` seeders • 🔴 \`${item.leechers}\` leechers`,
          `🧲 \`${magnet}\``,
        ].join("\n");
      })
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setTitle(`🏴‍☠️ Pirate Search: ${query.slice(0, 60)}`)
      .setColor((client as any).color || 0x2b2d31)
      .setDescription(description)
      .setFooter({
        text: "Copy the magnet link and paste into your torrent client (qBittorrent, etc.).",
      });

    const button1337x = new ButtonBuilder()
      .setLabel("Search on 1337x")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://1337x.to/search/${encodeURIComponent(query)}/1/`);

    const buttonFmhy = new ButtonBuilder()
      .setLabel("FMHY Megathread")
      .setStyle(ButtonStyle.Link)
      .setURL("https://fmhy.net/");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button1337x, buttonFmhy);

    return ctx.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },
});
