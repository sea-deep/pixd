import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";

export default new HybridCommand({
  name: "skip",
  description: "Skip the current track.",
  aliases: ["next"],
  guildOnly: true,
  execute: (context) => replyWithError(context, async () => {
    const player = requirePlayer(context);
    const skipped = player.current;
    if (!player.skip()) throw new Error("Nothing is currently playing.");
    return context.reply(`⏭️ Skipped **${skipped?.title ?? "the current track"}**.`);
  }),
});
