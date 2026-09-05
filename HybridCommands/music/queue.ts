import HybridCommand from "../../src/structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../src/services/music/commandHelpers.js";

export default new HybridCommand({
  name: "queue",
  description: "Show the current track and upcoming queue.",
  aliases: ["q", "np", "nowplaying"],
  guildOnly: true,
  execute: (context, client) => replyWithError(context, () => {
    const player = requirePlayer(context);
    const upcoming = player.queue.slice(0, 15).map((track, index) => `${index + 1}. ${track.author} — ${track.title}`);
    const remaining = Math.max(0, player.queue.length - upcoming.length);
    return context.reply({ embeds: [{
      title: "Music queue",
      description: [
        `**Now playing:** ${player.current ? `${player.current.author} — ${player.current.title}` : "Nothing"}`,
        "",
        upcoming.length ? `**Up next:**\n${upcoming.join("\n")}` : "*No queued tracks.*",
        remaining ? `\n…and ${remaining} more.` : "",
      ].join("\n"),
      footer: { text: `Loop: ${player.loopMode} • ${player.queue.length} queued` },
      color: client.color,
    }] });
  }),
});
