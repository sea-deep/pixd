import { ApplicationCommandOptionType, type RepliableInteraction } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";
import HybridCommand from "../../structures/HybridCommand.js";
import YtDlpResolver from "../../services/music/YtDlpResolver.js";
import { replyWithError, requireVoiceChannel } from "../../services/music/commandHelpers.js";
import type { MusicSource } from "../../services/music/types.js";

const resolver = new YtDlpResolver();

export default new HybridCommand({
  name: "play",
  description: "Play or queue audio from YouTube, SoundCloud, Bandcamp, or Spotify.",
  aliases: ["p"],
  usage: "<song name or URL>",
  guildOnly: true,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "query",
      description: "Song name, search query, or media URL (supports sc:, yt:, bc: prefixes)",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "source",
      description: "Music source preference (default: auto with fallbacks)",
      required: false,
      choices: [
        { name: "Auto (YouTube with Fallbacks)", value: "auto" },
        { name: "SoundCloud", value: "soundcloud" },
        { name: "YouTube", value: "youtube" },
        { name: "Bandcamp", value: "bandcamp" },
      ],
    },
  ],
  execute: (context, client) => replyWithError(context, async () => {
    const query = context.options.getString("query", true)!;
    const sourceChoice = context.options.getString("source") as MusicSource | null;

    const voiceChannelId = requireVoiceChannel(context);
    const result = await resolver.resolve(query, context.user.id, sourceChoice ?? "auto");
    const player = await client.music.connect(context.guild!, voiceChannelId, context.channel!.id);
    const wasPlaying = Boolean(player.current) && player.audioPlayer.state.status !== AudioPlayerStatus.Idle;
    player.enqueue(result.tracks);
    await player.ensurePlaying();

    if (!wasPlaying && result.tracks.length === 1) {
      if (context.isInteraction) {
        await (context.raw as RepliableInteraction).deleteReply().catch(() => undefined);
      }
      return;
    }

    const firstTrack = result.tracks[0];
    const sourceLabel = firstTrack.source && firstTrack.source !== "youtube" && firstTrack.source !== "custom"
      ? `Source: ${firstTrack.source === "soundcloud" ? "SoundCloud" : firstTrack.source === "bandcamp" ? "Bandcamp" : "Spotify"}`
      : undefined;

    return context.reply({
      embeds: [{
        title: result.playlistName ? "Playlist queued" : "Track queued",
        description: result.playlistName
          ? `${result.playlistName} — ${result.tracks.length} tracks`
          : `**${firstTrack.title}** by **${firstTrack.author}**`,
        thumbnail: firstTrack.thumbnail ? { url: firstTrack.thumbnail } : undefined,
        footer: sourceLabel ? { text: sourceLabel } : undefined,
        color: client.color,
      }],
    });
  }),
});
