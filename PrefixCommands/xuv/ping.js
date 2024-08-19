import { client } from "../../index.js";
import { Message } from "discord.js";
export default {
  name: "ping",
  description: "A ping command",
  aliases: ["ng"],
  usage: "",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   */
  execute: async (message, args, client) => {
    let msg = await message.reply("Pong!");

    const startTime = client.keyv.get("uptime");
    const uptime = formatUptime(Date.now() - startTime);

    return msg.edit({
      content: "Pong!",
      tts: false,
      embeds: [
        {
          type: "rich",
          color: client.color,
          description: [
            `**Latency:** \`${msg.createdTimestamp - message.createdTimestamp}ms\``,
            `**API Latency:** \`${Math.round(client.ws.ping)}ms\``,
            `**Uptime:** ${uptime}`,
          ].join("\n"),
        },
      ],
    });
  },
};

function formatUptime(uptime) {
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}
