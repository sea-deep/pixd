import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";

export default new HybridCommand({
  name: "pause",
  description: "Pause the current track.",
  guildOnly: true,
  execute: (context) => replyWithError(context, async () => {
    if (!requirePlayer(context).pause()) throw new Error("Playback is not currently running.");
    return context.reply("⏸️ Playback paused.");
  }),
});
