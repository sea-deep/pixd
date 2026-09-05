import HybridCommand from "../../src/structures/HybridCommand.js";
import { createLastFmState } from "../../src/services/lastfm/AuthState.js";
import { env } from "../../src/utilities/env.js";

export default new HybridCommand({
  name: "lastfm",
  description: "Connect your Last.fm account.",
  aliases: ["lf"],
  guildOnly: true,
  ephemeral: true,
  execute: async (context, client) => {
    if (!env.LASTFM_KEY || !env.LASTFM_SECRET) return context.reply("Last.fm is not configured.");
    const state = createLastFmState(context.user.id);
    const callback = `${env.PUBLIC_BASE_URL.replace(/\/$/, "")}/lastfm/login?state=${encodeURIComponent(state)}`;
    const params = new URLSearchParams({ api_key: env.LASTFM_KEY, cb: callback });
    return context.reply({
      embeds: [{ description: "Connect your Last.fm account using the button below.", color: client.color }],
      components: [{ type: 1, components: [{ type: 2, style: 5, label: "LOGIN WITH LAST.FM", url: `https://www.last.fm/api/auth/?${params}` }] }],
    });
  },
});
