import HybridCommand from "../../structures/HybridCommand.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { Client, Message } from "discord.js";
import { createHash } from "crypto";

export default new HybridCommand({
  name: "lol",
  ownerOnly: true,
  description: "Scrobble a track 50 times",
  aliases: [""],
  usage: "",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  options: [
    { type: 3, name: "arguments", description: "Command text and arguments, in prefix order" },
    { type: 6, name: "user", description: "Target user" },
    { type: 6, name: "user2", description: "Second target" },
    { type: 6, name: "user3", description: "Third target" },
    { type: 11, name: "image", description: "Input image or attachment" },
  ],
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const args = input.args;
    try {
      let arg = input.content.split(" ").splice(1).join(" ").split(",");
      if (!arg[0]?.trim() || !arg[1]?.trim()) return ctx.reply("Usage: lol <track>,<artist>");
      let song = arg[0].trim();
      let artist = arg[1].trim();
      let sk = await client.lastFmDb.get(ctx.user.id);
      if (!sk || !process.env.LASTFM_KEY || !process.env.LASTFM_SECRET) return ctx.reply("Connect Last.fm and configure its credentials first.");

      // Array to hold multiple scrobbles
      let options: Record<string, string> = {
        method: "track.scrobble",
        api_key: process.env.LASTFM_KEY,
        sk: sk,
      };

      // Add 50 scrobbles to the options object
      for (let i = 0; i < 50; i++) {
        options[`track[${i}]`] = song;
        options[`artist[${i}]`] = artist;
        options[`timestamp[${i}]`] = String(getTimestampTwoMinutesAgo() - i); // Slightly different timestamps for each
      }

      options.api_sig = getApiSig(options);
      options.format = "json";

      let params = new URLSearchParams(options);

      const response = await fetch("https://ws.audioscrobbler.com/2.0/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(15_000),
      });

      const data = await response.json();
      let attr = data.scrobbles?.["@attr"];
      if (!response.ok || !attr) return ctx.reply("Last.fm could not accept that request.");
      return ctx.reply(`Accepted: ${attr.accepted}\nIgnored: ${attr.ignored}`);
      //  console.log(data);
    } catch (e) {
      return ctx.reply("Last.fm request failed. Please try again later.");
    }
  },
});

function getApiSig(params: Record<string, string>) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`);
  const paramString = sortedParams.join("");
  const paramStringWithSecret = paramString + process.env.LASTFM_SECRET;
  const apiSig = createHash("md5").update(paramStringWithSecret).digest("hex");

  return apiSig;
}

function getTimestampTwoMinutesAgo() {
  const now = Date.now();
  const twoMinutesAgo = now - 2 * 60 * 1000;
  return Math.floor(twoMinutesAgo / 1000);
}
