import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";

export default new HybridCommand({
  name: "queue",
  description: "Show the current track and upcoming queue.",
  aliases: ["q", "np", "nowplaying"],
  guildOnly: true,
  execute: (context, client) => replyWithError(context, () => {
    const player = requirePlayer(context);
    const formatTrack = (track: typeof player.queue[0]) => {
      const src = track.source && track.source !== "youtube" && track.source !== "custom"
        ? ` [${track.source === "soundcloud" ? "SoundCloud" : track.source === "bandcamp" ? "Bandcamp" : "Spotify"}]`
        : "";
      return `${track.author} — ${track.title}${src}`;
    };
    const upcoming = player.queue.slice(0, 15).map((track, index) => `${index + 1}. ${formatTrack(track)}`);
    const remaining = Math.max(0, player.queue.length - upcoming.length);
    return context.reply({ embeds: [{
      title: "Music queue",
      description: [
        `**Now playing:** ${player.current ? formatTrack(player.current) : "Nothing"}`,
        "",
        upcoming.length ? `**Up next:**\n${upcoming.join("\n")}` : "*No queued tracks.*",
        remaining ? `\n…and ${remaining} more.` : "",
      ].join("\n"),
      footer: { text: `Loop: ${player.loopMode} • Filter: ${player.filter} • ${player.queue.length} queued` },
      color: client.color,
    }] });
  }),
});
