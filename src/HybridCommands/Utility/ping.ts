import HybridCommand from "../../structures/HybridCommand.js";

export default new HybridCommand({
  name: "ping",
  description: "Show bot latency and uptime.",
  aliases: ["ng"],
  defer: false,
  execute: async (ctx, client) => {
    const startedAt = Number(client.keyv.get("uptime") ?? Date.now());
    const latency = Math.max(0, Date.now() - ctx.raw.createdTimestamp);
    return ctx.reply({ embeds: [{
      color: client.color,
      description: [
        `**Latency:** \`${latency}ms\``,
        `**API latency:** \`${Math.round(client.ws.ping)}ms\``,
        `**Uptime:** ${formatUptime(Date.now() - startedAt)}`,
      ].join("\n"),
    }] });
  },
});

function formatUptime(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${Math.floor(hours / 24)}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}
