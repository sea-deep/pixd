# Contributing to PixD

Thanks for your interest in contributing! This document explains how to set up your environment, make changes safely, and submit a great pull request for the PixD Discord bot.

## Ground rules

- Be respectful and collaborative. Assume good intent.
- Don’t commit secrets. Use `.env` for local values and never check it in.
- Keep changes focused. Prefer small, reviewable PRs over large ones.
- Match the existing style and project structure.

## How to help

- Report bugs (with clear repro steps and logs)
- Propose and discuss features before large changes
- Improve docs (README, command help, usage examples)
- Add new commands (prefix or slash), games, or utilities
- Fix typos, refactor small areas, and improve error handling

## Project overview

PixD is a Node.js Discord bot built with `discord.js` v14, `poru` for music/Lavalink, and MongoDB via Mongoose. Key folders:

- `index.js` – app entrypoint and bootstrapping
- `Configs/` – bot configuration (prefix, Lavalink nodes)
- `Utilities/` – handlers (events, commands registration, models)
- `Events/` – Poru/Lavalink related events
- `Interactions/` – Slash commands, buttons, modals, select menus
- `PrefixCommands/` – Prefix-based commands grouped by category
- `Helpers/` – Shared helpers (games, images, Last.fm, etc.)
- `www/` – Static web pages for status/info

## Development setup

1. Fork the repo and clone your fork
2. Use a recent Node.js LTS (v18+ recommended)
3. Install dependencies
   ```sh
   npm install
   ```
4. Copy environment template and fill values
   ```sh
   cp .env.example .env
   ```
   Required keys to get started:
   - `TOKEN` – Discord bot token
   - `CLIENT_ID` – Your application (bot) client ID (used for slash command registration)
   - `MONGODB_URL` – MongoDB connection string
   - `ENVIRONMENT` – `dev` (uses prefix `d!`) or `prod` (uses prefix `p!`)
   - Optional keys enable more features (Google/Groq/Last.fm/etc.) – see `.env.example` and `README.md`.
5. Start the bot
   ```sh
   npm start
   ```
   On startup, commands are auto-registered via `Utilities/registerCommands.js` if `TOKEN` and `CLIENT_ID` are set.

### Lavalink (music) notes
- Configuration lives in `Configs/config.js` under `nodes`.
- The repo includes example public nodes for convenience. For reliability, prefer running your own Lavalink v4 instance and update `host`, `port`, `password`, and `secure` accordingly.

## Where to put your code

- Prefix commands: add files under `PrefixCommands/<category>/<command>.js`
- Slash commands: add interaction files under `Interactions/SlashCommands/**`
- Buttons/Modals/Select menus: corresponding folders under `Interactions/`
- Event listeners: `Events/` and `Client/`
- Shared utilities: `Helpers/` or `Utilities/` as appropriate

Try to follow existing patterns in similar files for data shapes and handler contracts.

## Coding style

- This project uses ES Modules (`type: module`).
- Format with Prettier (devDependency).
  - Optional: run `npx prettier --write .` before committing.
- Keep functions small and focused. Prefer early returns and clear error messages.
- Name files and exports clearly. Co-locate related helpers.

## Commit messages and branches

- Use Conventional Commits for clarity and automation:
  - `feat: add chess rematch button`
  - `fix: handle null track info in queue`
  - `docs: update README with setup` 
  - `refactor: extract image caption builder`
- Branch naming: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`

## Pull request checklist

Before you open a PR:

- [ ] The bot runs locally (`npm start`) without new errors
- [ ] Commands/handlers you added are discoverable by the appropriate loader
- [ ] Prettier formatting applied (no noisy diffs)
- [ ] README or in-code docs updated for new commands/flags
- [ ] Screenshots/GIFs for UI-heavy interactions (optional but helpful)
- [ ] No secrets or tokens committed

## Testing and manual QA

There’s no formal test suite yet. Please include:

- Steps to reproduce the bug or verify the feature
- Expected result vs actual behavior
- Any relevant logs (stack traces, Discord API errors)

If you’re interested in adding tests, open an issue to discuss approach and tooling.

## Reporting bugs

Open a GitHub issue and include:

- Environment: Node.js version, OS, bot prefix (`d!` or `p!`), guild context
- Steps to reproduce (commands used, inputs)
- Actual vs expected behavior
- Logs or screenshots

## Proposing features

Start with an issue describing the problem and the user experience you want. Bonus points for a rough command contract (inputs/outputs, permissions, rate limits) and example interactions.

## Security and responsible disclosure

If you discover a security issue (token leakage, injection, unsafe eval, etc.), please do not open a public issue. Email the maintainer or use GitHub’s private reporting if enabled.

## License

By contributing, you agree that your contributions will be licensed under the MIT License of this repository.
