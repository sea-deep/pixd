import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../utilities/env.js";

const MAX_AGE_MS = 10 * 60 * 1000;

function signature(value: string): string {
  if (!env.LASTFM_SECRET) throw new Error("Last.fm is not configured.");
  return createHmac("sha256", env.LASTFM_SECRET).update(value).digest("base64url");
}

export function createLastFmState(userId: string): string {
  const value = `${userId}.${Date.now()}`;
  return `${value}.${signature(value)}`;
}

export function verifyLastFmState(state: string): string {
  const [userId, timestampText, supplied] = state.split(".");
  if (!userId || !timestampText || !supplied) throw new Error("Invalid Last.fm login state.");
  const timestamp = Number(timestampText);
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > MAX_AGE_MS || timestamp > Date.now() + 30_000) {
    throw new Error("Last.fm login state has expired.");
  }
  const expected = signature(`${userId}.${timestampText}`);
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    throw new Error("Invalid Last.fm login state.");
  }
  return userId;
}
