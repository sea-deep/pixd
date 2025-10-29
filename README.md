# PixD Discord Bot

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/vIstDW?referralCode=TDTzm0)

PixD is a fast, playful Discord bot that fetches info, plays music (Lavalink/Poru), generates images, and entertains with mini‑games. If you want an all‑in‑one assistant for your server, this is it.

## Table of contents

- Features
- Quick start
- Configuration
- Usage
- Project structure
- Development scripts
- Contributing
- Troubleshooting
- License

## Features

PixD is packed with a variety of commands and features to keep your server lively and engaging. Here's a glimpse of what it can do:

### AI Technology
- `p!gpt <query>`: Danky dank GPT for all your AI chat needs
- `p!padhaku <query>`: Ask study-related questions when homework's got you down
- `p!ytsum <youtube URL>`: Too lazy to watch that 20-minute video? Get a summary!

### Helpful Utilities
- `p!ud <word>`: Get word definitions from Urban Dictionary (for when regular dictionaries just don't cut it)
- `p!img <query>`: Search images from Google without leaving Discord
- `p!lens [image]`: Reverse search an image from Google (find out where that meme really came from)
- `p!pin <create|list|delete|edit>`: Manage pins or tags in your server
- `p!piracy <query> <type> <sort>`: Search and download various media types

### Music
- `p!play <search or url>`: Play any song or playlist from YouTube, Spotify, and SoundCloud
- `p!pause`: Pause the song (bathroom break, anyone?)
- `p!resume`: Resume the song after that break
- `p!stop`: Stop playing and clear the queue
- `p!skip`: Skip the current song (we won't judge your music taste)
- `p!lyrics <song-name>`: Get lyrics so you can sing along
- `p!queue`: Show songs in the queue
- `p!loop`: Repeat the current song (for when you just can't get enough)
- `p!seek <mm:ss>`: Jump to a specific part of the song

### Image Generation
- `p!rvcj [image]+[text]`: Caption an image in RVCJ style!
- `p!lapata [image] or <mentions>`: Get Lapata
- `p!allustuff [image]+[text]`: Allu Arjun funnies
- `p!vosahihai [image] or <mentions>`: He's right, you know
- `p!nearyou [image] or <mention>`: WHO ARE YOU
- `p!goodness [image] or <mention>`: Oh my goodness gracious
- `p!animan <4 mentions>`: Put that new forgis on the jeep

### Mini-games
- `p!wordle`: Play the game Wordle right in Discord
- `p!chess <@user>`: Challenge your friends to a game of chess
- `p!c4`: Play Connect 4 when you should be working
- `p!2048`: Merge numbers and procrastinate with 2048
- `p!wordchain`: Start a chain of words in the chat
- `p!hangman`: Yet another word guessing game

### Basic Commands
- `/contact`: Send a message to the developer
- `p!ping`: Check ping status and uptime
- `p!donate`: Send 10 rupees in UPI (the developer needs coffee!)

## Configuration

PixD is highly configurable through the `config.js` file in the `Configs` directory. Here's a peek at what it looks like:

```javascript
let prefix = process.env.ENVIRONMENT === "prod" ? "p!" : "d!";

export default {
  prefix: prefix,
  restricted: [
    "720286639691399218",
    "1104345879588126811",
    "887265587854737479",
  ],
  nodes: [
    {
      name: "node1",
      host: "lava-v4.ajieblogs.eu.org",
      password: "https://dsc.gg/ajidevserver",
      port: 443,
      secure: true,
    },
    // Additional nodes can be added here
  ],
};
```

## Quick start

### Requirements

Before jumping in, make sure you have:

- Node.js LTS (v18+ recommended)
- npm (bundled with Node)
- Discord bot token and application client ID
- MongoDB connection (for persistence)
- Optional: API keys for advanced features (see `.env.example`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sea-deep/pixd.git
   cd pixd
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Fill in your `.env` file with the required values (see `.env.example` for full list):
   ```
   DEPLOY_HOOK="xxx"
   DICTIONARY_API_KEY="dictionary api key"
   ENVIRONMENT="dev"
   GENIUS_ACCESS_TOKEN="xxx"
   GOOGLEAI_KEY="gemini api key"
   GOOGLE_KEY="google api key"
   GROQ_API_KEY="groq api key for gpt"
   LASTFM_KEY="last fm key"
   LASTFM_SECRET="lastfm secret"
   MONGODB_URL="mongodb uri"
   NODE_NO_WARNINGS="1"
   NODE_VERSION="lts"
   PORT="3000"
   RAPID_KEY="rapid api key"
   SS_PASS="xxx"
   TOKEN="bot token"
    CLIENT_ID="discord application client id"
   ```

5. Start the bot:
   ```bash
   npm start
   ```

Notes:
- `ENVIRONMENT` controls the prefix via `Configs/config.js`: `dev` -> `d!`, `prod` -> `p!`.
- Slash commands are registered at startup by `Utilities/registerCommands.js` when `TOKEN` and `CLIENT_ID` are set.

## Usage

With PixD up and running, you can start issuing commands using the configured prefix. Try `p!help` to see a list of available commands and categories.

## Project structure

```
pixd/
├─ index.js                  # App entrypoint and bootstrapping
├─ Configs/                  # Bot config (prefix, Lavalink nodes)
├─ Utilities/                # Handlers, models, command registration
├─ Interactions/             # Slash commands, buttons, modals, menus
├─ PrefixCommands/           # Prefix-based commands by category
├─ Events/                   # Poru/Lavalink and client events
├─ Helpers/                  # Shared helpers for games/images/etc.
└─ www/                      # Static web pages
```

## Development scripts

- Start the bot: `npm start`
- Format (optional): `npx prettier --write .`

## Contributing

Got ideas or found a bug? Awesome—PRs welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for setup, coding style, Conventional Commits, and a short PR checklist.

Quick checklist:
- The bot runs locally without new errors (`npm start`)
- No secrets committed; env via `.env`
- New commands/handlers live in the right folder and follow existing patterns
- Docs updated where relevant

## Troubleshooting

- Slash commands not appearing: ensure `CLIENT_ID` and `TOKEN` are set; global command updates can take up to an hour. For faster iteration, use guild commands or re-run after edits.
- Lavalink connection issues: update `Configs/config.js` `nodes` to a reliable server (or your own) and match `host/port/password/secure`.
- Prefix mismatch: set `ENVIRONMENT=dev` for `d!` or `ENVIRONMENT=prod` for `p!`.

## License

This project is licensed under the MIT License. Check out the [LICENSE](LICENSE) file for more details.
