import "dotenv/config";
import { z } from "zod";

const optionalSecret = z.string().trim().min(1).optional();

const schema = z.object({
  TOKEN: z.string().trim().min(1, "TOKEN is required"),
  CLIENT_ID: z.string().trim().min(1, "CLIENT_ID is required"),
  MONGODB_URL: z.string().trim().min(1, "MONGODB_URL is required"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  ENVIRONMENT: z.enum(["dev", "prod", "test"]).default("dev"),
  LASTFM_KEY: optionalSecret,
  LASTFM_SECRET: optionalSecret,
  YT_DLP_COOKIES_PATH: optionalSecret,
  PUBLIC_BASE_URL: z.string().url().default("https://pixd.up.railway.app"),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = result.data;
