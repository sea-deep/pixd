import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { generateInviteUrl } from "../../helpers/inviteHelper.js";

export default new HybridCommand({
  name: "invite",
  description: "Get the official invite link for PIXD.",
  aliases: ["botinvite"],
  guildOnly: false,
  defer: false,
  execute: (ctx, client) => {
    const inviteUrl = generateInviteUrl(client.user?.id);

    const button = new ButtonBuilder()
      .setLabel("Invite PIXD")
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    return ctx.reply({
      components: [row],
    });
  },
});
