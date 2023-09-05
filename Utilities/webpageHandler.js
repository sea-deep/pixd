import chalk from "chalk";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import express from 'express';

try {
const app = express();

const staticPath = join(dirname(fileURLToPath(import.meta.url)), '../www');
app.use(express.static(staticPath));
app.get('/', (req, res) => res.redirect('/home'));
app.get('/home', (req, res) => res.sendFile(join(staticPath, 'index.html')));
app.get('/repo', (req, res) => res.redirect('https://github.com/susudeepa/pixd'));
app.get('/invite', (req, res) => res.redirect('https://discord.com/api/oauth2/authorize?client_id=1026234292017299586&permissions=343634472000&scope=bot'));
app.get('/:page', (req, res) => {
  const pagePath = join(staticPath, `${req.params.page}.html`);
  if (fs.existsSync(pagePath)) {
    res.sendFile(pagePath);
  } else {
    res.status(404).sendFile(join(staticPath, '404.html'));
  }
});
const port = process.env.PORT;
app.listen(port, () => process.stdout.write(`[${chalk.blue("INFO")}] - Webpage is live!\n`));

} catch (err) {
  process.stdout.write(`[${chalk.red("WebpageHandler")}] - ${err}\n`);
}
