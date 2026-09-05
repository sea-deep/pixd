import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { parseTimestamp, replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";

export default new HybridCommand({
  name: "seek",
  description: "Restart the current track at a timestamp.",
  usage: "<seconds or hh:mm:ss>",
  guildOnly: true,
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "position",
    description: "Timestamp such as 90 or 1:30",
    required: true,
  }],
  execute: (context) => replyWithError(context, async () => {
    const value = context.options.getString("position", true)!;
    await requirePlayer(context).seek(parseTimestamp(value));
    return context.reply(`⏩ Seeked to **${value}**.`);
  }),
});
