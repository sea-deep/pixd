import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";

export default new HybridCommand({
  name: "resume",
  description: "Resume paused playback.",
  guildOnly: true,
  execute: (context) => replyWithError(context, async () => {
    if (!requirePlayer(context).resume()) throw new Error("Playback is not paused.");
    return context.reply("▶️ Playback resumed.");
  }),
});
