# PixD migration plan

## Target and boundaries

Preserve PixD's observable commands, aliases, image outputs, game rules, persistent data, and member events. Use the template's existing HybridCommand, CommandContext, Component, Event, loaders, and permission checks. No synthetic Message objects, parallel prefix/slash implementations, paid image provider, or additional framework.

The original repository remains the reference. Work happens in this draft; only proven reusable framework corrections belong in discord-bot-template. The copied .env contains live credentials: do not start another bot instance or alter database records during implementation.

## Feature map

| Area | Implementation target | Behavior to preserve/check |
| --- | --- | --- |
| Music and Last.fm | HybridCommands/Music, services/music, services/lastfm | Queue, voice controls, playback errors, authentication and persisted sessions; yt-dlp replaces Poru |
| AI | HybridCommands/XUV | Existing names/aliases, grouped slash paths, provider errors and input semantics |
| Images | One Image command directory and existing image helpers | All nine meme/caption commands, images/mentions/attachments/replies, original rendering and translation flags |
| Games | HybridCommands/games and existing game helpers/components | Eight games; actual reply IDs, current player, collector lifecycle, per-channel word-chain sessions |
| Utilities | HybridCommands/Utility and utils | Image/reverse search, dictionary, pins, screenshots, contact, help, donation and lookup |
| Jeetlife | HybridCommands/Jeetlife, model, gender components | Existing user documents, inventory, one daily claim, ownership |
| Owner actions | HybridCommands/owner | Restrictions on both routes, explicit inputs and meaningful replies |
| Interactions/events | Template Component/Event classes | Buttons, selects, modals, context menus and member events; preserve IDs used in messages |
| Storage/web/assets | Existing services/helpers and original assets | Existing collections/keys, TTL units, static pages and Last.fm callbacks |

## Execution sequence

1. Inventory: match all routes to original features; identify dead examples versus user features. Record gaps, not just counts.
2. Contracts: settle prefix/slash inputs, reply/defer semantics, component ownership, route selection and state identity using existing template classes. Avoid competing helpers for the same job.
3. Implement: complete each category above. Remove file-wide type suppression by supplying real types and correcting logic, not replacing it with blanket any. Fix exposed migration conflicts first, then inherited defects that affect the migrated paths.
4. Simplify: remove dead examples, empty legacy scaffolding, duplicate folders/functions and stale instructions. Help comes from registered command metadata and must show correct usage, aliases, restrictions and slash routes.
5. Verify after implementation: TypeScript compilation, import/runtime smoke checks, then focused manual Discord checks. Automated tests are supporting evidence, not a substitute for implementation or live feature parity.

## Known failures driving this pass

- Broad ts-nocheck directives concealed genuine implementation errors.
- RVCJ's normalized input variable collided with its image buffer variable.
- Chess used an undeclared third argument and obsolete attachment constructor arguments.
- Interaction handlers applied restrictions inconsistently and sometimes left deferred replies unresolved.
- Help was a hard-coded duplicate command list with the wrong development prefix.
- Raw Discord payloads have invalid/null fields and widened numeric discriminants.
- Several async operations were unawaited, errors were swallowed, and game state assumed it could never expire.

## Done means

Every original feature has one intended implementation, all routed objects follow template schemas, source compiles without file-wide type suppression, redundant migration scaffolding is gone, and run instructions distinguish verified local behavior from external services that still require live checks.

## Current status

- Implemented: 49 native hybrid command entries; shared image implementations; consolidated helpers and interaction dispatch; registry-driven help; concrete board/image types and corrected migration conflicts.
- Cleaned: obsolete slash-image helpers, unused template test button, split helper/image folders and empty legacy directories. Original assets and original repository retained.
- Verified locally: both projects compile; draft source contains no ts-nocheck/ts-ignore; compiled route/schema loading; help reaches all 44 non-owner commands; six additional image renders (three commands, two input modes) succeed with mocked downloads.
- Still requires live verification: Discord login/intents/permissions, actual voice playback, interactive game sessions, Google scraper availability, optional API credentials and database-backed workflows. Local checks did not connect to these services or change their state.
