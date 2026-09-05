import { client } from "../index.js";
import { createHash } from "crypto";
import { env } from "../src/utilities/env.js";
import { verifyLastFmState } from "../src/services/lastfm/AuthState.js";

export async function handleLastFmAuth(req) {
    const userId = verifyLastFmState(String(req.query.state ?? ""));
    const token = String(req.query.token ?? "");
    if (!token) throw new Error("Last.fm did not return an authentication token.");
    let options = {
      method: "auth.getSession",
      api_key: env.LASTFM_KEY,
      token,
    };
    options.api_sig = getApiSig(options);
    options.format = "json";

    let params = new URLSearchParams(options);
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?${params.toString()}`,
    );
    const data = await response.json();
    const { session } = data;
    if (!session?.key) throw new Error("Last.fm did not return a session key.");

    await client.lastFmDb.set(userId, session.key);
    let user = await client.users.fetch(userId);
    await user.send({
      content: "",
      embeds: [
        {
          description:
            "**✅ Your account has been authenticated with Last.fm successfully**",
          color: client.color,
        },
      ],
    });
}
function getApiSig(params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`);
  const paramString = sortedParams.join("");
  const paramStringWithSecret = paramString + env.LASTFM_SECRET;
  const apiSig = createHash("md5").update(paramStringWithSecret).digest("hex");

  return apiSig;
}
