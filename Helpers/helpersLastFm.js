import { format } from "path";
import { client } from "../index.js";
import { createHash } from "crypto";

export async function handleLastFmAuth(req, res) {
  try {
    let options = {
      method: "auth.getSession",
      api_key: process.env.LASTFM_KEY,
      token: req.query.token,
    };
    options.api_sig = getApiSig(options);
    options.format = "json";

    let params = new URLSearchParams(options);
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?${params.toString()}`,
    );
    const data = await response.json();
    const { session } = data;
    let accessToken;
    if (session && session.key) {
      accessToken = session.key;
    } else {
      console.error("Access token not found in response");
    }

    await client.lastFmDb.set(req.query.userid, accessToken);
    let user = await client.users.fetch(req.query.userid);
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
  } catch (error) {
    console.error("Error exchanging token for access token:", error);
  }
}
function getApiSig(params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`);
  const paramString = sortedParams.join("");
  const paramStringWithSecret = paramString + process.env.LASTFM_SECRET;
  const apiSig = createHash("md5").update(paramStringWithSecret).digest("hex");

  return apiSig;
}
