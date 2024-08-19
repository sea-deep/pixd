import { Client, Message } from "discord.js";
import { createHash } from "crypto";

export default {
  name: "lol",
  description: "Scrobble a track 50 times",
  aliases: [""],
  usage: "",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    try {
      let arg = message.content.split(" ").splice(1).join(" ").split(",");
      let song = arg[0].trim();
      let artist = arg[1].trim();
      let sk = await client.lastFmDb.get(message.author.id);

      // Array to hold multiple scrobbles
      let options = {
        method: "track.scrobble",
        api_key: process.env.LASTFM_KEY,
        sk: sk,
      };

      // Add 50 scrobbles to the options object
      for (let i = 0; i < 50; i++) {
        options[`track[${i}]`] = song;
        options[`artist[${i}]`] = artist;
        options[`timestamp[${i}]`] = getTimestampTwoMinutesAgo() - i; // Slightly different timestamps for each
      }

      options.api_sig = getApiSig(options);
      options.format = "json";

      let params = new URLSearchParams(options);

      const response = await fetch("http://ws.audioscrobbler.com/2.0/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();
      let attr = data.scrobbles["@attr"];
      message.reply(`Accepted: ${attr.accepted}\nIgnored: ${attr.ignored}`);
      //  console.log(data);
    } catch (e) {
      console.log(e);
    }
  },
};

function getApiSig(params) {
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
