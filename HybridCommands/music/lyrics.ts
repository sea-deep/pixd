import HybridCommand from "../../src/structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../src/services/music/commandHelpers.js";

export default new HybridCommand({
  name: "lyrics",
  description: "Find lyrics for the current track.",
  guildOnly: true,
  execute: (context) => replyWithError(context, async () => {
    const track = requirePlayer(context).current;
    if (!track) throw new Error("Nothing is currently playing.");
    const response = await fetch(`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(`${track.author} ${track.title}`)}`);
    if (!response.ok) throw new Error("Lyrics could not be found.");
    const data = await response.json() as { lyrics?: string };
    if (!data.lyrics) throw new Error("Lyrics could not be found.");
    const chunks = data.lyrics.match(/[\s\S]{1,3900}/g) ?? [];
    await context.reply({ embeds: [{ title: track.title, description: chunks.shift(), color: context.raw.client.color }] });
    for (const chunk of chunks) await context.followUp({ embeds: [{ description: chunk, color: context.raw.client.color }] });
  }),
});
