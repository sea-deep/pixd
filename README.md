# PixD TypeScript Draft

This is the template-based PixD migration. It carries PixD's commands, games, image tools, interaction components, web pages, MongoDB state, Last.fm integration, and direct music playback into the template's TypeScript layout.

## Runtime

- Node.js 24+
- Python 3 and FFmpeg
- MongoDB
- Discord bot token/application ID
- yt-dlp is installed through `youtube-dl-exec`; Poru and Lavalink are not used

```sh
cd /home/dipak/code/pixd
test -f .env || cp .env.example .env
# Edit .env: TOKEN, CLIENT_ID, MONGODB_URL, ENVIRONMENT=dev
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

Production:

```sh
npm start
```

## Feature layout

- `src/HybridCommands`: 49 commands shared by prefix and slash routing, including all migrated games, music, AI, image memes, utilities, owner commands, and Jeetlife
- No prefix-only command entries remain. The newly converted commands execute through the template's `CommandContext`; game collectors keep their actual reply messages and session state.
- `src/Interactions`: slash parent containers, context menus, buttons, modals, and select menus
- `src/events`: Discord lifecycle and member events
- `src/services/music`: guild queue/player and yt-dlp resolver
- `src/services/lastfm`: signed authentication state and scrobbling
- `src/helpers`: template context/input helpers and shared game, image, YouTube, and persistence logic
- `Assets` and `www`: original PixD media and web UI

Spotify URLs are rejected because Spotify does not provide directly playable audio. Searching by artist/title resolves through YouTube instead. `YT_DLP_COOKIES_PATH` may point to a secret-mounted Netscape cookie file when a provider requires authentication.

## Image search

`/imagesearch` and `d!img` (`p!img` in production) use the original free `google-img-scrap` library. No SerpApi account or paid provider is used. Searches request up to 250 results, filter invalid URLs and duplicates, and run in terminable workers: ten seconds per attempt, one retry, and at most two simultaneous searches. Actual result counts depend on Google; blocking or markup changes can still prevent results. Failures produce a friendly message rather than hanging the bot. Hundreds of results are not guaranteed.

The same library also supports the retained reverse-image command.

## Manual smoke test

The original `.env` has been copied locally, is Git-ignored, and has owner-only file permissions. It points to the same account/database as the original: stop the original bot before running this draft to avoid duplicate command processing. No live bot was started as part of the automated checks.

New game slash commands accept an `opponent` where applicable. Image/owner/pin commands accept `arguments` in the original prefix order, optional target users, and an `image` attachment. For example, `/pin arguments:"add example some text"` corresponds to `d!pin add example some text`. Reply-to-message inputs remain available through prefix commands; slash commands take explicit inputs instead.

Use a separate test bot and test MongoDB database so the original bot remains unaffected. Enable Message Content and Server Members intents in the Discord developer portal. Invite the bot with `bot` and `applications.commands` scopes and appropriate text/voice permissions. Set your owner ID in `Configs/config.ts` for owner commands. Optional external integrations need their matching keys in `.env`.

With `ENVIRONMENT=dev`, test `d!ping`, `/ping`, `d!help`, `/help`, `d!img cats`, and `/imagesearch`. Check image navigation and deletion. Join a voice channel and test `d!play <YouTube URL>`, `d!queue`, `d!pause`, `d!resume`, and `d!stop` (or their slash equivalents). Test games and image generation in a private channel. Application commands register at startup and may take time to appear.

From another terminal, run `curl http://localhost:3000/healthz`. Stop the bot with Ctrl+C. For normal non-watch execution use `npm start`; `ENVIRONMENT=prod` changes the prefix to `p!`.

## Verification

`npm run typecheck` checks all bot source; no file-wide type-check suppression remains. `npm run build` produces the runnable bot. The automated suite remains available with `npm test`, but compilation or tests alone do not establish live feature parity. Discord, music playback, and external integrations require manual verification with your credentials. The implementation-first migration plan is in `MIGRATION-PLAN.md`.

Help keeps the original warm-colored Tech Saport landing page and named/emoji categories, while command lists come from the live registry. Each category appears once in the dropdown; Previous/Next buttons browse extra commands within that category, and Home returns to the landing page. Category changes reset to page one. The list uses prefix or slash names according to how help was opened; command details show both forms, aliases and inputs. `/help command:name` and the equivalent prefix command show details. Restricted commands stay hidden, and only the requester can navigate the menu. Custom category emojis fall back to Unicode when unavailable.

Docker includes Node 24, Python 3, FFmpeg, the compiled bot, assets, and static pages.
