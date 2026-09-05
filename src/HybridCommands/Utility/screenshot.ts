import { ApplicationCommandOptionType, AttachmentBuilder } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";

export default new HybridCommand({
  name: "screenshot",
  description: "Capture a desktop or mobile screenshot of a website.",
  aliases: ["ss"],
  usage: "<url> [-m]",
  guildOnly: true,
  options: [
    { type: ApplicationCommandOptionType.String, name: "url", description: "Website URL", required: true },
    { type: ApplicationCommandOptionType.Boolean, name: "mobile", description: "Use a mobile viewport" },
  ],
  execute: async (ctx, client) => {
    const input = ctx.options.getString("url", true)!;
    const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    let url: URL;
    try {
      url = new URL(candidate);
      if (!/^https?:$/.test(url.protocol)) throw new Error("Unsupported protocol");
    } catch {
      return ctx.reply({ embeds: [{ description: "❎ **Please provide a valid HTTP(S) URL.**", color: client.color }] });
    }

    const mobile = ctx.isSlash ? (ctx.options.getBoolean("mobile") ?? false) : ctx.args.includes("-m");
    const endpoint = new URL("https://fetch-ss.up.railway.app/screenshot");
    endpoint.searchParams.set("url", url.href);
    endpoint.searchParams.set("mobile", String(mobile));
    if (process.env.SS_PASS) endpoint.searchParams.set("password", process.env.SS_PASS);

    const response = await fetch(endpoint, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return ctx.reply({ embeds: [{ description: `❎ Screenshot service returned HTTP ${response.status}.`, color: client.color }] });
    const attachment = new AttachmentBuilder(Buffer.from(await response.arrayBuffer()), { name: "screenshot.png" });
    return ctx.reply({ files: [attachment], embeds: [{ description: `**Screenshot for: __${url.href}__**`, color: client.color }] });
  },
});
