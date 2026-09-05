import type { APIEmbed, APIActionRowComponent, APIButtonComponent, APIStringSelectComponent, ButtonInteraction, Client, StringSelectMenuInteraction } from "discord.js";
import HybridCommand from "../structures/HybridCommand.js";
import config from "../../Configs/config.js";
import type { ContextReplyOptions } from "../helpers/CommandContext.js";

export interface HelpViewer { userId: string; inGuild: boolean; nsfw?: boolean; mode?: "prefix" | "slash" }
interface HelpStyle { label: string; description: string; emoji: string; emojiId?: string }
// Presentation only: command membership, names, routes and descriptions come from the registry.
const categories: Record<string, HelpStyle> = {
  xuv: { label: "2047 AI Technology", description: "AI gadgets from the future.", emoji: "🤖", emojiId: "1084739827167154176" },
  utility: { label: "Helpful Utilities", description: "Useful things, questionable tech support.", emoji: "🛠️", emojiId: "1219696858339737761" },
  music: { label: "Music", description: "Supar high quality music. Your queue, your rules.", emoji: "🎵", emojiId: "1084743885063991346" },
  image: { label: "Image Generation", description: "Create funny images and highly important memes.", emoji: "🎨", emojiId: "1084741002339831839" },
  games: { label: "Mini-games", description: "Some chotte motte games. Pick your next distraction.", emoji: "🎮", emojiId: "1116349246732521472" },
  jeetlife: { label: "Jeetlife", description: "Daily rojgaar, your balance, and life admin.", emoji: "🪪" },
  owner: { label: "Owner Tools", description: "Behind-the-scenes bot controls.", emoji: "🔧" },
  general: { label: "More Commands", description: "A little bit of everything else.", emoji: "✨" },
};
const PAGE_SIZE = 8;
const HELP_COLOR = 0xe08e67;
type HelpPayload = Exclude<ContextReplyOptions, string>;
const categoryOf = (command: HybridCommand): string => {
  const key = (command.category || "general").toLowerCase();
  return Object.hasOwn(categories, key) ? key : "general";
};
const slashRoute = (command: HybridCommand): string => `/${command.subCommand ?? command.data.name}`;
const invocation = (command: HybridCommand, mode: HelpViewer["mode"]): string => mode === "slash" ? slashRoute(command) : `${config.prefix}${command.name}`;

export function helpCommands(client: Client, viewer: HelpViewer): HybridCommand[] {
  return [...new Set<HybridCommand>(client.prefixCommands.values())]
    .filter(command => command instanceof HybridCommand)
    .filter(command => (!command.ownerOnly || viewer.userId === config.users.ownerId)
      && (!command.developerOnly || config.users.developers.includes(viewer.userId))
      && (!command.guildOnly || viewer.inGuild) && (!command.nsfw || viewer.nsfw))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function prefixUsage(command: HybridCommand): string {
  let usage = command.usage.trim();
  const first = usage.split(/\s+/)[0];
  if ([command.name, ...command.aliases].includes(first)) usage = usage.slice(first.length).trim();
  return `${config.prefix}${command.name}${usage ? ` ${usage}` : ""}`;
}

export function buildHelp(client: Client, viewer: HelpViewer, query = "", category = "home", page = 0): HelpPayload {
  const commands = helpCommands(client, viewer);
  const groups = Object.keys(categories).map(key => ({ key, commands: commands.filter(command => categoryOf(command) === key) }))
    .filter(group => group.commands.length);
  const mode = viewer.mode === "slash" ? "slash" : "prefix";
  const normalized = query.trim().toLowerCase().replace(/^\//, "");
  const selected = normalized ? commands.find(command => [command.name, `${config.prefix}${command.name}`, command.subCommand ?? command.data.name, ...command.aliases.filter(Boolean)].includes(normalized)) : undefined;
  const current = groups.find(group => group.key === (selected ? categoryOf(selected) : category));
  const totalPages = current ? Math.ceil(current.commands.length / PAGE_SIZE) : 1;
  const pageIndex = Number.isInteger(page) ? Math.max(0, Math.min(page, totalPages - 1)) : 0;
  const style = current ? categories[current.key] : undefined;
  const customEmoji = style?.emojiId ? client.emojis.cache.get(style.emojiId) : undefined;
  const hint = mode === "slash" ? "/help command:name" : `${config.prefix}help name`;
  const embed: APIEmbed = { color: HELP_COLOR, footer: { text: "Send command suggestions using /contact" } };

  if (selected) {
    embed.author = { name: `${style?.emoji ?? "✨"} ${style?.label ?? "PixD"}` };
    embed.title = invocation(selected, mode);
    embed.description = selected.description;
    embed.fields = [
      { name: "Prefix", value: `\`${prefixUsage(selected).slice(0, 1000)}\``, inline: true },
      { name: "Slash", value: `\`${slashRoute(selected)}\``, inline: true },
    ];
    const aliases = selected.aliases.filter(Boolean);
    if (aliases.length) embed.fields.push({ name: "Also known as", value: aliases.map(alias => `\`${alias}\``).join(" · ").slice(0, 1024) });
    if (selected.options.length) embed.fields.push({ name: "Inputs", value: selected.options.map(option =>
      `**${option.name}**${"required" in option && option.required ? "" : " (optional)"} — ${option.description}`).join("\n").slice(0, 1024) });
  } else if (current && style) {
    embed.author = customEmoji
      ? { name: style.label, icon_url: customEmoji.imageURL() }
      : { name: `${style.emoji} ${style.label}` };
    embed.description = [
      `*${style.description}*`, "",
      ...current.commands.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE).map(command =>
        `• \`${invocation(command, mode)}\` — ${command.description.replace(/\s+/g, " ").slice(0, 160)}`),
      "", `*More info: \`${hint}\`*`,
    ].join("\n");
    embed.footer = { text: `${current.commands.length} commands · Page ${pageIndex + 1} of ${totalPages} · ${mode === "slash" ? "Slash commands" : `Prefix: ${config.prefix}`}` };
  } else {
    embed.author = { name: "Tech Saport", icon_url: "https://cdn.discordapp.com/emojis/898562618833383444.gif" };
    const shortcuts = ["contact", "ping", "donate"].map(name => commands.find(command => command.name === name)).filter((command): command is HybridCommand => Boolean(command));
    embed.description = [
      normalized ? "Couldn't find that command here. Try a name or alias, or pick a category below." : "A little help from your local tech saport.",
      "", ...shortcuts.map(command => `• \`${invocation(command, mode)}\` — ${command.description.slice(0, 140)}`),
      "", "[Website](https://pixd.up.railway.app)   •   [Invite me](https://pixd.up.railway.app/invite)",
      "", `**${commands.length} commands** · Choose a category below to get started.`,
    ].join("\n");
  }

  const components: (APIActionRowComponent<APIStringSelectComponent> | APIActionRowComponent<APIButtonComponent>)[] = [];
  if (groups.length) components.push({ type: 1, components: [{ type: 3, custom_id: `cmd:${viewer.userId}:${mode}`, placeholder: "Select Category", min_values: 1, max_values: 1,
    options: groups.map(group => {
      const categoryStyle = categories[group.key];
      const emoji = categoryStyle.emojiId ? client.emojis.cache.get(categoryStyle.emojiId) : undefined;
      return { label: categoryStyle.label, value: group.key, description: `${group.commands.length} commands · ${categoryStyle.description}`.slice(0, 100),
        emoji: emoji ? { id: emoji.id, name: emoji.name ?? undefined, animated: emoji.animated ?? false } : { name: categoryStyle.emoji }, default: group === current };
    }),
  }] });
  if (current) {
    const buttonId = (key: string, number: number) => `help-page:${viewer.userId}:${mode}:${key}:${number}`;
    const buttons: APIButtonComponent[] = [];
    if (selected) buttons.push({ type: 2, style: 2, label: "Back to category", emoji: { name: "◀️" }, custom_id: buttonId(current.key, 0) });
    else if (totalPages > 1) buttons.push({ type: 2, style: 2, label: "Previous", emoji: { name: "◀️" }, custom_id: buttonId(current.key, Math.max(0, pageIndex - 1)), disabled: pageIndex === 0 });
    buttons.push({ type: 2, style: 2, label: "Home", emoji: { name: "🏠" }, custom_id: buttonId("home", 0) });
    if (!selected && totalPages > 1) buttons.push({ type: 2, style: 2, label: "Next", emoji: { name: "▶️" }, custom_id: buttonId(current.key, Math.min(totalPages - 1, pageIndex + 1)), disabled: pageIndex >= totalPages - 1 });
    components.push({ type: 1, components: buttons });
  }
  return { content: "", embeds: [embed], components };
}

export async function updateHelp(interaction: StringSelectMenuInteraction | ButtonInteraction, client: Client, ownerId?: string, mode?: string, category?: string, page?: string): Promise<unknown> {
  if (!ownerId || ownerId !== interaction.user.id) return interaction.reply({ content: "Open your own help menu with /help.", flags: 64 });
  if (mode !== "prefix" && mode !== "slash") return interaction.reply({ content: "This help menu is outdated. Open a new one with /help.", flags: 64 });
  const selectedCategory = interaction.isStringSelectMenu() ? interaction.values[0] : category;
  if (!selectedCategory || (selectedCategory !== "home" && !Object.hasOwn(categories, selectedCategory))) return interaction.reply({ content: "Choose a category from the help menu.", flags: 64 });
  // Category selection always starts at page one. Page buttons keep the same category.
  const nextPage = interaction.isStringSelectMenu() ? 0 : Number(page ?? 0);
  const payload = buildHelp(client, { userId: interaction.user.id, inGuild: Boolean(interaction.guild), mode,
    nsfw: Boolean(interaction.channel && "nsfw" in interaction.channel && interaction.channel.nsfw),
  }, "", selectedCategory, nextPage);
  await interaction.deferUpdate();
  return interaction.editReply(payload as Parameters<typeof interaction.editReply>[0]);
}
