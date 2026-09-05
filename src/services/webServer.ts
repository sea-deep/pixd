import { existsSync } from "node:fs";
import { join } from "node:path";
import axios from "axios";
import express from "express";
import { handleLastFmAuth } from "../helpers/helpersLastFm.js";
import { env } from "../utilities/env.js";
import Logger from "../helpers/Logger.js";

const app = express();
const staticPath = join(process.cwd(), "www");
app.disable("x-powered-by");
app.use(express.static(staticPath));
app.get("/", (_req, res) => res.redirect("/home"));
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
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

app.listen(env.PORT, () => Logger.info(`Web server listening on port ${env.PORT}`));

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
