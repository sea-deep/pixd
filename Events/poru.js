import { client } from "../index.js";
import { createHash } from "crypto";

function getApiSig(params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`);
  const paramString = sortedParams.join("");
  const paramStringWithSecret = paramString + process.env.LASTFM_SECRET;
  const apiSig = createHash("md5").update(paramStringWithSecret).digest("hex");

  return apiSig;
}

client.poru.on("trackStart", async (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  const vc = await client.channels.fetch(player.voiceChannel);
  let scrobbleList = [];
  for (let i = 0; i < vc.members.size; i++) {
    let member = vc.members.at(i);
    let sk = await client.lastFmDb.get(member.id);
    if (sk) {
      scrobbleList.push(sk);
    }
  }
  await channel.send(
    `Now playing **${track.info.title}** by **${track.info.author}**`
  );

  if (scrobbleList.length > 0) {
    scrobbleList.forEach(async (token) => {
      let options = {
        artist: track.info.author,
        track: track.info.title,
        method: "track.updateNowPlaying",
        api_key: process.env.LASTFM_KEY,
        sk: token,
      };

      options.api_sig = getApiSig(options);
      options.format = "json";

      let params = new URLSearchParams(options);
      try {
        await fetch("http://ws.audioscrobbler.com/2.0/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
      } catch (e) {
        console.error(e);
      }
    });
    return channel.send(
      `Scrobbling this track for ${scrobbleList.length} members!\n-# To enable scrobbling for your account use p!lastfm command...`
    );
  }
});

client.poru.on("trackEnd", async (player, track) => {
  const timestamp = Math.floor((Date.now() - track.info.length) / 1000);
  const vc = await client.channels.fetch(player.voiceChannel);
  let scrobbleList = [];
  for (let i = 0; i < vc.members.size; i++) {
    let member = vc.members.at(i);
    let sk = await client.lastFmDb.get(member.id);
    if (sk) {
      scrobbleList.push(sk);
    }
  }

  if (scrobbleList.length > 0) {
    scrobbleList.forEach(async (token) => {
      let options = {
        artist: track.info.author,
        track: track.info.title,
        method: "track.scrobble",
        timestamp: timestamp,
        api_key: process.env.LASTFM_KEY,
        sk: token,
      };

      options.api_sig = getApiSig(options);
      options.format = "json";

      let params = new URLSearchParams(options);
      try {
        await fetch("http://ws.audioscrobbler.com/2.0/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
      } catch (e) {
        console.error(e);
      }
    });
    console.log(`Scrobbled track for ${scrobbleList.length} members!`);
  }
  await client.sleep(30000);
  let plr = await client.poru.players.get(vc.guild.id);
  if (vc.members.size === 1 || (!player.isPlaying && !player.isPaused)) {
    await plr.destroy();
    return client.channels.cache.get(player.textChannel).send({
      content: "",
      embeds: [
        {
          title: "",
          description: "Leaving VC due to inactivity",
          color: client.color,
        },
      ],
    });
  }
});



client.poru.on("nodeError", (error) => {
  console.error(error.message);
})
