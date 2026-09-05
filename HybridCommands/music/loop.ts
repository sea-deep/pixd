import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../src/structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../src/services/music/commandHelpers.js";
import type { LoopMode } from "../../src/services/music/types.js";

export default new HybridCommand({
  name: "loop",
  description: "Set the music loop mode.",
  guildOnly: true,
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "mode",
    description: "Loop mode",
    required: true,
    choices: [
      { name: "Off", value: "off" },
      { name: "Current track", value: "track" },
      { name: "Entire queue", value: "queue" },
    ],
  }],
  execute: (context) => replyWithError(context, () => {
    const mode = context.options.getString("mode", true) as LoopMode;
    if (!["off", "track", "queue"].includes(mode)) throw new Error("Mode must be off, track, or queue.");
    requirePlayer(context).setLoopMode(mode);
    return context.reply(`🔁 Loop mode set to **${mode}**.`);
  }),
});
