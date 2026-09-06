import "dotenv/config";
import { z } from "zod";

const optionalSecret = z.preprocess((value) => typeof value === "string" && !value.trim() ? undefined : value, z.string().trim().min(1).optional());
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
  GOOGLEAI_KEY: optionalSecret,
  GOOGLEAI_MODEL: z.string().trim().min(1).default("gemini-2.5-flash"),
  B2_KEY_ID: optionalSecret,
  B2_APPLICATION_KEY: optionalSecret,
  B2_BUCKET_NAME: optionalSecret,
  B2_ENDPOINT: optionalSecret,
  B2_REGION: optionalSecret,
});

const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Invalid environment configuration:\n${result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n")}`);
}
export const env = result.data;
