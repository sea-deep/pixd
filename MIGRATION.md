# Migration notes

## Preserved surface

- 49 hybrid commands shared across prefix and slash routing; no prefix-only entries remain
- 42 top-level slash routes and 10 grouped slash subcommands
- 30 buttons, 5 string selects, 2 modals, and 2 message context menus (unused template test button removed; help-pagination button added)
- 7 Discord event listeners
- Original image/game assets and static website

## Corrected during migration

- Replaced Poru/Lavalink with per-guild Discord Voice players backed by yt-dlp and FFmpeg.
- Registered application commands only after the Discord client is ready.
- Removed orphan `/img rap` and `/xuv padhaku` declarations that had no executable handlers; inventory tests now check declared subcommands for handlers too.
- Added deterministic loading and fatal duplicate-route detection.
- Fixed duplicate component IDs and mismatched delete/hangman routes.
- Namespaced MongoDB key/value stores and stopped deleting persisted state at startup.
- Signed and expiry-limited Last.fm callback state; switched Last.fm requests to HTTPS.
- Restricted deploy, avatar, say, welcome simulation, and Last.fm test commands to the configured owner.
- Kept public ping and donation commands public, and fixed the broken slash-ping latency calculation.
- Corrected temporary-state TTL units and excluded tests from production output.
- Added environment validation, graceful shutdown, health checks, upstream timeouts, and safer Instagram media-ID handling.
- Retained free `google-img-scrap` for image search, with terminable workers, bounded retries/concurrency, URL validation, deduplication, and safe failure messages. No paid provider or SerpApi dependency remains. Google availability and hundreds of results are not guaranteed.
- Consolidated all existing prefix/slash pairs into hybrid registration, including grouped `/xuv` and `/img` subcommands.
- Added slash counterparts for image search, screenshots, Urban Dictionary, Jeetlife, and contact while preserving prefix aliases.
- Corrected the `invenory` typo without breaking its old alias, fixed Jeetlife's mixed `$inc`/date update, and restored its gender buttons to the message component layer.

## Verification and remaining limits

- The earlier automated pass covered 49 tests. The current implementation-first pass uses compilation, compiled registry/schema checks, help coverage checks, and focused rendering checks; the full suite was not rerun during that pass.
- Live free image-scraper check for `cats` returned zero results in this environment; the empty-result path is supported, but Google availability is not established.
- Discord login, voice playback, games, and optional external integrations still require credentialed manual tests (see README).
- No `@ts-nocheck` or `@ts-ignore` remains in bot source. There are no duplicate prefix/slash image implementations or legacy routing wrappers. Live Discord/API parity still requires credentialed manual verification.

## Architecture decision

Use the template's `HybridCommand`, `CommandContext`, route registries, option/permission checks, and `Component` structures as the bot framework. Preserve the original algorithms, command names/aliases, assets, component IDs, per-message game state, per-channel word-chain state, and MongoDB data models. The newly converted 18 commands use native context replies and normalized input data, not fake Discord Messages. Local game collectors remain attached to the real reply returned by the context; registered reusable buttons/modals/selects continue through the template's component dispatcher.

The source `.env` was copied without displaying secrets or changing the original. Automated checks do not log into Discord, register live commands, or write to the configured database.

## Implementation-first correction pass

- Recorded the feature map, contracts, implementation order and known failures in MIGRATION-PLAN.md before continuing.
- Consolidated helper and image directories and removed unused slash-image helper functions and the template test button.
- Replaced hard-coded help with registered metadata; fixed empty-alias selection, configured-prefix display, pagination and menu ownership.
- Unified interaction dispatch so buttons, selects and modals all receive consistent ownership, owner-only and error handling; grouped subcommands check their own restrictions.
- Corrected RVCJ's input-variable collision, user-text markup escaping, image-buffer types, embed values, obsolete attachments, and missing async acknowledgements.
- Typed existing board algorithms and corrected Connect Four's string/cell mismatch with a simple win/block move selector. The game rules remain unchanged; the bot's move-selection heuristic is intentionally simplified.
- Kept source assets, static pages, original credentials and original repository intact. No production bot or database was started during verification.
# Local promotion — 2026-09-05

The TypeScript draft now lives in `/home/dipak/code/pixd` on `main`, retaining the
original PixD Git history and `origin` remote. The previous working state, including
uncommitted source changes, is preserved in `codex/pixd-before-draft-20260905` and
the complete `/home/dipak/code/pixd-legacy-20260905` folder. The draft's former
template Git metadata is retained at `/home/dipak/code/pixd-draft-template-git-20260905`.
The draft's current `.env` was retained without exposing it in Git. No remote push
or production deployment was performed during promotion. The proposed Jeetlife
expansion is deferred; its existing commands and database schema are unchanged.
