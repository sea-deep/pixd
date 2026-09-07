import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Server } from "node:http";
import axios from "axios";
import express from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { handleLastFmAuth } from "../helpers/helpersLastFm.js";
import { env } from "../utilities/env.js";
import Logger from "../helpers/Logger.js";
import StorageService, { formatBytes } from "./StorageService.js";
import UploadModel from "../models/uploadModel.js";
import { generateInviteUrl } from "../helpers/inviteHelper.js";

export const app = express();
let ready = () => false;
const staticPath = join(process.cwd(), "www");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

app.disable("x-powered-by");

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Lightweight Rate Limiter for Storage APIs (max 60 req/min per IP)
const uploadRateLimits = new Map<string, { count: number; resetAt: number }>();
function checkUploadRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = String(req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown");
  const now = Date.now();
  const entry = uploadRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    uploadRateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (entry.count >= 60) {
    return res.status(429).json({ success: false, error: "Too many upload requests. Please try again later." });
  }
  entry.count++;
  return next();
}

// Fallback direct streaming route (bypass express.json to stream raw bytes directly to S3/B2)
app.put("/api/upload/stream/:fileId", checkUploadRateLimit, async (req, res) => {
  req.setTimeout(30 * 60 * 1000);
  const fileId = String(req.params.fileId);
  if (!/^[a-f0-9]{12}$/i.test(fileId)) {
    return res.status(400).json({ success: false, error: "Invalid fileId provided." });
  }

  const upload = await UploadModel.findOne({ fileId, status: "pending" });
  if (!upload) {
    return res.status(404).json({ success: false, error: "Upload session not found or already processed." });
  }

  const contentLengthHeader = req.headers["content-length"];
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : upload.fileSize;
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > StorageService.MAX_FILE_SIZE_BYTES) {
    return res.status(400).json({ success: false, error: "Invalid file size payload." });
  }

  const userOtherBytes = await StorageService.getUserActiveStorageBytes(upload.userId, upload.fileId);
  if (userOtherBytes + contentLength > StorageService.USER_STORAGE_LIMIT_BYTES) {
    const remaining = Math.max(0, StorageService.USER_STORAGE_LIMIT_BYTES - userOtherBytes);
    return res.status(400).json({
      success: false,
      error: `File size exceeds your remaining storage quota (${formatBytes(remaining)} remaining of ${formatBytes(StorageService.USER_STORAGE_LIMIT_BYTES)}). Free up space with \`p!rm\`!`,
    });
  }

  try {
    const s3 = StorageService.getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: StorageService.getBucketName(),
        Key: upload.s3Key,
        Body: req,
        ContentLength: contentLength,
        ContentType: upload.mimeType || "application/octet-stream",
      })
    );

    const { client } = await import("../../index.js");
    const completeRes = await StorageService.completeUpload(fileId, client);
    return res.status(completeRes.success ? 200 : 400).json(completeRes);
  } catch (err: any) {
    Logger.error(`Stream upload failed for fileId ${fileId}:`, err);
    return res.status(500).json({ success: false, error: err?.message || "Stream upload failed." });
  }
});

app.use(express.json());
app.use(express.static(staticPath));

// Web Upload Portal & File Landing Pages
app.get("/upload", (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
  if (!token || !UUID_REGEX.test(token)) {
    return res.status(403).sendFile(join(staticPath, "upload-invalid.html"));
  }

  const session = StorageService.getSession(token);
  if (!session) {
    return res.status(403).sendFile(join(staticPath, "upload-invalid.html"));
  }

  return res.sendFile(join(staticPath, "upload.html"));
});

app.get("/file/:fileId", (req, res) => {
  const fileId = String(req.params.fileId);
  if (!/^[a-f0-9]{12}$/i.test(fileId)) return res.status(404).sendFile(join(staticPath, "404.html"));
  return res.sendFile(join(staticPath, "file.html"));
});

// Storage API Endpoints
app.get("/api/upload/session-info", checkUploadRateLimit, async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
  if (!token || !UUID_REGEX.test(token)) {
    return res.status(400).json({ success: false, error: "Invalid or malformed session token." });
  }

  const session = StorageService.getSession(token);
  if (!session) {
    return res.status(404).json({ success: false, error: "Upload session not found or expired." });
  }

  const userUsedBytes = await StorageService.getUserActiveStorageBytes(session.userId);
  const userRemainingBytes = Math.max(0, StorageService.USER_STORAGE_LIMIT_BYTES - userUsedBytes);

  return res.json({
    success: true,
    userTag: session.userTag,
    channelName: session.channelName || "this channel",
    guildName: session.guildName || "",
    expiresAt: session.expiresAt,
    userUsedBytes,
    userLimitBytes: StorageService.USER_STORAGE_LIMIT_BYTES,
    userRemainingBytes,
  });
});

app.post("/api/upload/presign", checkUploadRateLimit, async (req, res) => {
  const { token, fileName, fileSize, mimeType } = req.body || {};
  if (
    typeof token !== "string" ||
    !UUID_REGEX.test(token.trim()) ||
    typeof fileName !== "string" ||
    fileName.trim().length === 0 ||
    typeof fileSize !== "number" ||
    !Number.isFinite(fileSize) ||
    fileSize <= 0
  ) {
    return res.status(400).json({ success: false, error: "Missing or invalid upload parameters." });
  }

  const result = await StorageService.initiateUpload(
    token.trim(),
    String(fileName),
    fileSize,
    typeof mimeType === "string" ? mimeType.slice(0, 100) : "application/octet-stream"
  );

  return res.status(result.success ? 200 : 400).json(result);
});

app.post("/api/upload/complete", async (req, res) => {
  const { fileId } = req.body || {};
  if (!fileId || !/^[a-f0-9]{12}$/i.test(String(fileId))) {
    return res.status(400).json({ success: false, error: "Invalid fileId provided." });
  }

  const { client } = await import("../../index.js");
  const result = await StorageService.completeUpload(String(fileId), client);
  return res.status(result.success ? 200 : 400).json(result);
});

app.get("/api/file/:fileId/info", async (req, res) => {
  const fileId = String(req.params.fileId);
  if (!/^[a-f0-9]{12}$/i.test(fileId)) {
    return res.status(400).json({ error: "Invalid file ID format." });
  }

  const upload = await UploadModel.findOne({ fileId });
  if (!upload) {
    return res.status(404).json({ error: "File not found or expired." });
  }

  const isExpired = upload.status === "expired" || upload.expiresAt <= new Date();

  return res.json({
    fileId: upload.fileId,
    fileName: upload.fileName,
    fileSize: upload.fileSize,
    mimeType: upload.mimeType,
    userTag: upload.userTag,
    createdAt: upload.createdAt,
    expiresAt: upload.expiresAt,
    isExpired,
    downloadCount: upload.downloadCount,
  });
});

app.get("/api/file/:fileId/download", async (req, res) => {
  const fileId = String(req.params.fileId);
  if (!/^[a-f0-9]{12}$/i.test(fileId)) return res.status(404).send("File not found");

  const result = await StorageService.getDownloadUrl(fileId);
  if (!result) return res.status(404).send("File not found or has expired.");

  return res.redirect(result.url);
});

app.get("/api/file/:fileId/view", async (req, res) => {
  const fileId = String(req.params.fileId);
  if (!/^[a-f0-9]{12}$/i.test(fileId)) return res.status(404).send("File not found");

  const result = await StorageService.getViewUrl(fileId);
  if (!result) return res.status(404).send("File not found or has expired.");

  return res.redirect(result.url);
});

app.get("/", (_req, res) => res.redirect("/home"));
app.get("/healthz", (_req, res) => {
  const ok = ready();
  res.status(ok ? 200 : 503).json({ ok });
});
app.get("/home", (_req, res) => res.sendFile(join(staticPath, "index.html")));
app.get("/lastfm/login", async (req, res) => {
  try {
    await handleLastFmAuth(req);
    res.sendFile(join(staticPath, "lastfm.html"));
  } catch (error) {
    Logger.warn("Last.fm callback failed", error);
    res.status(400).send("Last.fm authentication failed or expired.");
  }
});
app.get("/download", (_req, res) => res.redirect("https://rpqsk.github.io/"));
app.get("/repo", (_req, res) => res.redirect("https://github.com/susudeepa/pixd"));
app.get("/invite", (_req, res) => res.redirect(generateInviteUrl()));
app.get("/ig-image", async (req, res) => {
  const mediaId = String(req.query.id ?? "");
  if (!/^\d{1,30}$/.test(mediaId)) return res.status(400).send("invalid media id");
  try {
    const html = await axios.get<string>(`https://www.instagram.com/p/${mediaIdToShortcode(mediaId)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PixD/1.0)" }, timeout: 10_000,
    });
    const imageUrl = html.data.match(/"og:image" content="([^"]+)"/)?.[1];
    if (!imageUrl) return res.status(404).send("no og:image");
    const image = await axios.get<ArrayBuffer>(imageUrl, { responseType: "arraybuffer", timeout: 10_000 });
    res.type(String(image.headers["content-type"] ?? "image/jpeg")).send(Buffer.from(image.data));
  } catch {
    res.status(502).send("upstream image fetch failed");
  }
});
app.get("/:page", (req, res) => {
  const page = String(req.params.page);
  if (!/^[a-z0-9-]+$/i.test(page)) return res.status(404).sendFile(join(staticPath, "404.html"));
  const pagePath = join(staticPath, `${page}.html`);
  return existsSync(pagePath) ? res.sendFile(pagePath) : res.status(404).sendFile(join(staticPath, "404.html"));
});

export function startWebServer(isReady: () => boolean): Promise<Server> {
  ready = isReady;
  return new Promise((resolve, reject) => {
    const server = app.listen(env.PORT, async () => {
      server.requestTimeout = 30 * 60 * 1000;
      server.headersTimeout = 35 * 60 * 1000;
      Logger.info(`Web server listening on port ${env.PORT}`);
      try {
        const { client } = await import("../../index.js");
        StorageService.startCleanupWorker(client);
      } catch (err) {
        Logger.error("Failed to start storage cleanup worker", err);
      }
      void StorageService.configureBucketCors();
      resolve(server);
    });
    server.once("error", reject);
  });
}

function mediaIdToShortcode(id: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let value = BigInt(id);
  let shortcode = "";
  while (value > 0n) {
    shortcode = alphabet[Number(value % 64n)] + shortcode;
    value /= 64n;
  }
  return shortcode;
}
