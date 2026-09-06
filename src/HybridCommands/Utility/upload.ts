import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import StorageService from "../../services/StorageService.js";

export default new HybridCommand({
  name: "upload",
  description: "Bypass Discord's 20MB limit: upload files up to 1GB to the cloud.",
  category: "Utility",
  aliases: ["b2", "cloud"],
  defer: true,
  ephemeral: true,
  execute: async (ctx, client) => {
    if (!ctx.channel) {
      return ctx.reply({
        content: "❌ **This command cannot be used here.**",
        ephemeral: true,
      });
    }

    if (!StorageService.isConfigured()) {
      return ctx.reply({
        content: "⚠️ **Cloud file transfer service is currently not configured.**",
        ephemeral: true,
      });
    }

    const channelName = "name" in ctx.channel && ctx.channel.name ? `#${ctx.channel.name}` : "this channel";
    const guildName = ctx.guild?.name ?? "Direct Messages";

    const session = await StorageService.createSession(
      ctx.user.id,
      ctx.user.tag,
      ctx.channel.id,
      ctx.guild?.id ?? null,
      channelName,
      guildName
    );

    if (!session.success || !session.url) {
      return ctx.reply({
        content: session.error || "❌ **Failed to initialize upload session.**",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("☁️ PIXD Upload")
      .setColor((client as any).color || 0x5865f2)
      .setDescription("Click the button below to upload your file (up to 1 GB).");

    const button = new ButtonBuilder()
      .setLabel("Open Upload Portal")
      .setEmoji("☁️")
      .setStyle(ButtonStyle.Link)
      .setURL(session.url);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // If Slash command: reply ephemerally (only visible to caller)
    if (ctx.isInteraction) {
      return ctx.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    }

    // If Prefix command: NEVER leak the upload link in a public channel! Send directly to DM
    try {
      await ctx.user.send({
        embeds: [embed],
        components: [row],
      });

      const note = await ctx.reply({
        content: `📬 **Check your DMs, <@${ctx.user.id}>!** I've sent your private 1-time upload link.`,
      });

      if (note && typeof (note as any).delete === "function") {
        setTimeout(() => {
          void (note as any).delete().catch(() => {});
        }, 8000);
      }
      return;
    } catch {
      return ctx.reply({
        content: `❌ **Could not send you a DM, <@${ctx.user.id}>!** Please enable Direct Messages from server members, or use the slash command \`/upload\` (which is private/ephemeral).`,
      });
    }
  },
});
