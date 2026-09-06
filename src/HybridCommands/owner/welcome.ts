import HybridCommand from "../../structures/HybridCommand.js";
import { commandInput } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import { createOkbbWelcomeGif } from "../../helpers/welcomeHelper.js";

export default new HybridCommand({
  name: "welcome",
  ownerOnly: true,
  description: "Simulate a welcome message for a member",
  aliases: ["testwelcome"],
  usage: "welcome [@member]",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  options: [
    { type: 6, name: "user", description: "Target member to welcome (defaults to yourself)" },
  ],
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const member =
      input.members.first() ??
      (ctx.guild ? await ctx.guild.members.fetch(ctx.user.id).catch(() => null) : null);

    if (!member) {
      return ctx.reply("Please specify a valid server member to simulate welcome for.");
    }

    if (member.guild.id === "883291433925242950") {
      return ctx.reply({
        content: `**${member.user.tag}** just joined the server!!`,
      });
    }

    // Generate animated welcome GIF using Sharp
    const gifBuffer = await createOkbbWelcomeGif(member);
    const file = new AttachmentBuilder(gifBuffer, { name: "tofoquboolkaro.gif" });

    const content =
      member.guild.id === "804902112700923954"
        ? `namaste saar <@${member.user.id}> cummed in sarvar`
        : `Welcome <@${member.user.id}> to **${member.guild.name}**!`;

    return ctx.reply({
      content,
      files: [file],
    });
  },
});
