import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import YtDlpResolver from "../../services/music/YtDlpResolver.js";
import { replyWithError, requireVoiceChannel } from "../../services/music/commandHelpers.js";

const resolver = new YtDlpResolver();

export default new HybridCommand({
  name: "play",
  description: "Play or queue audio from YouTube or SoundCloud.",
  aliases: ["p"],
  usage: "<song name or URL>",
  guildOnly: true,
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "query",
    description: "Song name or media URL",
    required: true,
  }],
  execute: (context, client) => replyWithError(context, async () => {
    const query = context.options.getString("query", true)!;
    const voiceChannelId = requireVoiceChannel(context);
    const result = await resolver.resolve(query, context.user.id);
    const player = await client.music.connect(context.guild!, voiceChannelId, context.channel!.id);
    player.enqueue(result.tracks);
    await player.ensurePlaying();
    return context.reply({
      embeds: [{
        title: result.playlistName ? "Playlist queued" : "Track queued",
        description: result.playlistName
          ? `${result.playlistName} — ${result.tracks.length} tracks`
          : `**${result.tracks[0].title}** by **${result.tracks[0].author}**`,
        thumbnail: result.tracks[0].thumbnail ? { url: result.tracks[0].thumbnail } : undefined,
        color: client.color,
      }],
    });
  }),
});
