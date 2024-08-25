import { ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "help",
    description: "Get some help.",
  },
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    let msg = await interaction.reply("Pong!");

const startTime = client.keyv.get("uptime");
const uptime = formatUptime(Date.now() - startTime);

return interaction.channel.send({
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
