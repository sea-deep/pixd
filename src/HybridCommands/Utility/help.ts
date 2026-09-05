import HybridCommand from "../../structures/HybridCommand.js";
import { buildHelp } from "../../services/HelpService.js";

export default new HybridCommand({
  name: "help", description: "Browse available commands or inspect a command and its inputs.", aliases: ["commands"], defer: false,
  options: [{ type: 3, name: "command", description: "Command name, alias, or grouped slash route" }],
  execute: (ctx, client) => ctx.reply(buildHelp(client, {
    userId: ctx.user.id, inGuild: Boolean(ctx.guild), mode: ctx.isSlash ? "slash" : "prefix", nsfw: Boolean(ctx.channel && "nsfw" in ctx.channel && ctx.channel.nsfw),
  }, ctx.options.getString("command") ?? "")),
});
