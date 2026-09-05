import HybridCommand from "../../src/structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../src/services/music/commandHelpers.js";

export default new HybridCommand({
  name: "stop",
  description: "Clear the queue and leave the voice channel.",
  aliases: ["leave", "kick"],
  guildOnly: true,
  execute: (context, client) => replyWithError(context, async () => {
    requirePlayer(context);
    await client.music.destroy(context.guild!.id);
    return context.reply("⏹️ Queue cleared and voice connection closed.");
  }),
});
