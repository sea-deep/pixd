import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import express from "express";
import { handleLastFmAuth } from "../Helpers/helpersLastFm.js";
import axios from "axios";

try {
  const app = express();

  const staticPath = join(dirname(fileURLToPath(import.meta.url)), "../www");
  app.use(express.static(staticPath));
  app.get("/", (req, res) => res.redirect("/home"));
  app.get("/home", (req, res) => res.sendFile(join(staticPath, "index.html")));
  app.get("/lastfm/login", async (req, res) => {
    await handleLastFmAuth(req, res);
    res.sendFile(join(staticPath, "lastfm.html"));
  });
  app.get("/download", (req, res) => res.redirect("https://rpqsk.github.io/"));
  app.get("/repo", (req, res) =>
    res.redirect("https://github.com/susudeepa/pixd"),
  );
  app.get("/invite", (req, res) =>
    res.redirect(
      "https://discord.com/api/oauth2/authorize?client_id=1026234292017299586&permissions=343634472000&scope=bot",
    ),
  );
  app.get('/igproxy', async (req, res) => {
    const url = decodeURIComponent(req.query.url);
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)'
        }
      });
      res.set('Content-Type', response.headers['content-type']);
      res.send(response.data);
    } catch (e) {
      res.status(404).send('fail');
    }
  });

  app.get("/:page", (req, res) => {
    const pagePath = join(staticPath, `${req.params.page}.html`);
    if (existsSync(pagePath)) {
      res.sendFile(pagePath);
    } else {
      res.status(404).sendFile(join(staticPath, "404.html"));
    }
  });
  const port = process.env.PORT;
  app.listen(port, () =>
    console.log("[INFO] - Webpage is live!"),
  );
} catch (err) {
  console.error(`[WebpageHandler] - ${err}`);
}
