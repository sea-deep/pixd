import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Server } from "node:http";
import axios from "axios";
import express from "express";
import { handleLastFmAuth } from "../helpers/helpersLastFm.js";
import { env } from "../utilities/env.js";
import Logger from "../helpers/Logger.js";
import StorageService from "./StorageService.js";
import UploadModel from "../models/uploadModel.js";

export const app = express();
let ready = () => false;
const staticPath = join(process.cwd(), "www");
app.disable("x-powered-by");
app.use(express.json());
app.use(express.static(staticPath));

// Web Upload Portal & File Landing Pages
app.get("/upload", (_req, res) => res.sendFile(join(staticPath, "upload.html")));
app.get("/file/:fileId", (req, res) => {
  const fileId = String(req.params.fileId);
  if (!/^[a-f0-9]{12}$/i.test(fileId)) return res.status(404).sendFile(join(staticPath, "404.html"));
  return res.sendFile(join(staticPath, "file.html"));
});

// Storage API Endpoints
app.post("/api/upload/presign", async (req, res) => {
  const { token, fileName, fileSize, mimeType } = req.body || {};
  if (!token || !fileName || typeof fileSize !== "number") {
    return res.status(400).json({ success: false, error: "Missing required upload parameters." });
  }

  const result = await StorageService.initiateUpload(
    String(token),
    String(fileName),
    fileSize,
    String(mimeType || "application/octet-stream")
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
app.get("/invite", (_req, res) => res.redirect(
  "https://discord.com/oauth2/authorize?client_id=1397525517569097729&scope=bot&permissions=1003113402177",
));
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
      Logger.info(`Web server listening on port ${env.PORT}`);
      try {
        const { client } = await import("../../index.js");
        StorageService.startCleanupWorker(client);
      } catch (err) {
        Logger.error("Failed to start storage cleanup worker", err);
      }
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
