import HybridCommand from "../../structures/HybridCommand.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";

export default new HybridCommand({
  name: "deploy",
  ownerOnly: true,
  description: "Trigger the configured deployment hook",
  aliases: [],
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  options: [],
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const args = input.args;
    const deployHook = process.env.DEPLOY_HOOK;
    if (!deployHook) {
      await ctx.reply("`DEPLOY_HOOK` is not configured.");
      return;
    }

    const response = await fetch(deployHook);
    if (!response.ok) {
      throw new Error(`Deployment hook returned HTTP ${response.status}.`);
    }

    await ctx.reply("Deploy started!");
    await client.sleep(60 * 1000);
    client.destroy();
  },
});
