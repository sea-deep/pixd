import { client } from "../../index.js";
import { createHash } from "node:crypto";
import type { Request } from "express";
import { env } from "../utilities/env.js";
import { verifyLastFmState } from "../services/lastfm/AuthState.js";

export async function handleLastFmAuth(req: Request): Promise<void> {
    if (!env.LASTFM_KEY || !env.LASTFM_SECRET) throw new Error("Last.fm is not configured.");
    const userId = verifyLastFmState(String(req.query.state ?? ""));
    const token = String(req.query.token ?? "");
    if (!token) throw new Error("Last.fm did not return an authentication token.");
    const options: Record<string, string> = {
      method: "auth.getSession",
      api_key: env.LASTFM_KEY,
      token,
    };
    options.api_sig = getApiSig(options);
    options.format = "json";

    const params = new URLSearchParams(options);
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?${params.toString()}`,
    );
    if (!response.ok) throw new Error(`Last.fm returned HTTP ${response.status}.`);
    const data = await response.json() as { session?: { key?: string } };
    const { session } = data;
    if (!session?.key) throw new Error("Last.fm did not return a session key.");

    await client.lastFmDb.set(userId, session.key);
    const user = await client.users.fetch(userId);
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
function getApiSig(params: Record<string, string>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`);
  const paramString = sortedParams.join("");
  const paramStringWithSecret = paramString + env.LASTFM_SECRET;
  const apiSig = createHash("md5").update(paramStringWithSecret).digest("hex");

  return apiSig;
}
