import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";

export default new HybridCommand({
  name: "loop",
  description: "Toggle looping the current track on or off.",
  aliases: ["repeat", "l"],
  guildOnly: true,
  execute: (context) => replyWithError(context, () => {
    const player = requirePlayer(context);
    const enabled = player.loopMode === "off";
    player.setLoopMode(enabled ? "track" : "off");
    return context.reply(
      enabled
        ? "🔂 Looping is now **enabled** for the current track."
        : "➡️ Looping is now **disabled**."
    );
  }),
});
