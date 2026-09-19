import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
} from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError } from "../../services/music/commandHelpers.js";
import { cacheLyrics, fetchLyrics } from "../../services/music/LyricsService.js";

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

    const cacheId = cacheLyrics(result);

    // Provide a neat 3-4 line preview in blockquotes so chat isn't flooded with a text wall
    const rawLines = result.lyrics.split("\n").map((l) => l.trim()).filter(Boolean);
    const previewLines = rawLines.slice(0, 4);
    const previewBlock = previewLines.map((l) => `> *${l}*`).join("\n");

    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`lyrics-view:${cacheId}`)
        .setLabel("View Lyrics")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📜")
    );

    if (result.geniusUrl) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel("Genius")
          .setStyle(ButtonStyle.Link)
          .setURL(result.geniusUrl)
      );
    }

    await context.reply({
      embeds: [{
        title: `🎶 ${result.title}`,
        url: result.geniusUrl,
        author: result.artist ? { name: result.artist } : undefined,
        description: previewBlock,
        thumbnail: result.thumbnail ? { url: result.thumbnail } : undefined,
        color: context.raw.client.color,
      }],
      components: [row],
    });
  }),
});
