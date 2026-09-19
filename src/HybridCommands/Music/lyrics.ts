import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError } from "../../services/music/commandHelpers.js";
import { fetchLyrics } from "../../services/music/LyricsService.js";

export default new HybridCommand({
  name: "lyrics",
  description: "Find lyrics for a song or the currently playing track.",
  aliases: ["ly"],
  usage: "[song title]",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "song",
      description: "Song title or artist to search lyrics for (defaults to currently playing track)",
      required: false,
    },
  ],
  execute: (context) => replyWithError(context, async () => {
    const inputQuery = (
      context.options.getString("song") ||
      context.options.getString("query") ||
      context.args.join(" ")
    ).trim();

    let targetQuery = inputQuery;
    let targetArtist: string | undefined;

    // If no query specified, attempt to read the currently playing track in the server
    if (!targetQuery) {
      const player = context.guild ? context.raw.client.music?.get(context.guild.id) : null;
      const track = player?.current;
      if (!track) {
        throw new Error("Specify a song name: `p!lyrics <song name>` (or play a track in voice first).");
      }
      targetQuery = track.title;
      targetArtist = track.author;
    }

    const result = await fetchLyrics(targetQuery, targetArtist);
    if (!result || !result.lyrics) {
      throw new Error(`Lyrics could not be found for "${targetQuery}".`);
    }

    const chunks = result.lyrics.match(/[\s\S]{1,3900}/g) ?? [];
    const firstChunk = chunks.shift();
    await context.reply({
      embeds: [{
        title: result.geniusUrl ? `🎶 [${result.title}](${result.geniusUrl})` : `🎶 ${result.title}`,
        author: result.artist ? { name: result.artist } : undefined,
        description: firstChunk,
        thumbnail: result.thumbnail ? { url: result.thumbnail } : undefined,
        color: context.raw.client.color,
      }],
    });
    for (const chunk of chunks) {
      await context.followUp({
        embeds: [{ description: chunk, color: context.raw.client.color }],
      });
    }
  }),
});
