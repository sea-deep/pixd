import { ApplicationCommandOptionType, AttachmentBuilder, Message } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";

export default new HybridCommand({
  name: "contact",
  description: "Send a suggestion or bug report to the PixD developer.",
  usage: "<message> [attachment]",
  guildOnly: true,
  ephemeral: true,
  options: [
    { type: ApplicationCommandOptionType.String, name: "message", description: "Your message", required: true },
    { type: ApplicationCommandOptionType.Attachment, name: "attachment", description: "Optional screenshot" },
  ],
  execute: async (ctx, client) => {
    const message = ctx.isSlash
      ? ctx.options.getString("message", true)!
      : ctx.args.join(" ").trim();
    const attachment = ctx.isSlash
      ? ctx.options.getAttachment("attachment")
      : (ctx.raw as Message).attachments.first() ?? null;
    const channelId = process.env.CONTACT_CHANNEL_ID ?? "1051571067606544575";
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isSendable()) throw new Error("The configured contact channel is not sendable.");

    const payload: { content: string; files?: AttachmentBuilder[] } = {
      content: [
        "**New message** <@1258396025354453054>",
        `**User:** ${ctx.user.username} (${ctx.user.id})`,
        `**Server:** ${ctx.guild?.name ?? "Unknown"} (${ctx.guild?.id ?? "Unknown"})`,
        `**Message:** ${message}`,
      ].join("\n"),
    };
    if (attachment) {
      payload.content += "\n**Attachment:**";
      payload.files = [new AttachmentBuilder(attachment.url, { name: attachment.name })];
    }
    await channel.send(payload);
    return ctx.reply({ embeds: [{ description: "✅ Your message has been sent", color: client.color }] });
  },
});
