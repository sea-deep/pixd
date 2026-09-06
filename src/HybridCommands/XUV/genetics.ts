import { ApplicationCommandOptionType, Message } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import emote from "../../../Configs/emote.js";
import ReactionBombService from "../../services/ReactionBombService.js";

export default new HybridCommand({
  name: "genetics",
  aliases: ["g"],
  description: "Attack a message with Genesis emojis",
  usage: "[message link | message ID | reply]",
  slashRoute: "genetics",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "message",
      description: "Message link, message ID, or leave empty for previous message/reply",
      required: false,
    },
  ],
  execute: async (ctx) => {
    // In all prefix executions, safely delete the author's command message
    if (!ctx.isInteraction && ctx.raw instanceof Message) {
      await ctx.raw.delete().catch(() => {});
    }

    const input = ctx.options.getString("message", false);
    const { message: targetMessage, error: resolveError } =
      await ReactionBombService.resolveTarget(ctx, input);

    if (!targetMessage) {
      const errContent = resolveError || "❌ Target message could not be found.";
      if (ctx.isInteraction) {
        return ctx.reply({ content: errContent, ephemeral: true });
      } else if (ctx.channel && "send" in ctx.channel) {
        const temp = await (ctx.channel as any).send(errContent).catch(() => {});
        if (temp) setTimeout(() => temp.delete().catch(() => {}), 4000);
        return;
      }
      return;
    }

    const result = await ReactionBombService.deploy(
      ctx.user.id,
      targetMessage,
      emote.genesisEmojis
    );

    const replyText =
      !result.success && result.reactedCount === 0
        ? result.error || "❌ Reaction deployment failed."
        : `🧬 **Genesis invasion successful!**\nDeployed **${result.reactedCount}** Genesis emoji reaction${
            result.reactedCount === 1 ? "" : "s"
          }!${result.error ? `\n${result.error}` : ""}`;

    if (ctx.isInteraction) {
      return ctx.reply({ content: replyText, ephemeral: true });
    } else if (ctx.channel && "send" in ctx.channel) {
      const temp = await (ctx.channel as any).send(replyText).catch(() => {});
      if (temp) setTimeout(() => temp.delete().catch(() => {}), 4000);
    }
  },
});
