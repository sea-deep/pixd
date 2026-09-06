# Jeetlife: playable implementation plan

Status: proposal, not implemented. Based on the current PIXD source and the preserved original bot. No production database was queried or changed for this review.

## 1. What exists now

Jeetlife currently has three hybrid commands (`daily`, `balance`, `inventory`), two gender-selection buttons, and a Mongoose user model. It is an account/balance foundation, not yet a playable game. The migration notes explicitly deferred the expansion.

| Area | Current implementation | What is missing or wrong |
| --- | --- | --- |
| Accounts | One global account per Discord user | Three separate creation paths; no consistent onboarding or completed-setup state |
| Daily | 100–199 paise, once per Indian calendar day | 75 of the 100 possible rewards violate the agreed four-paise denomination |
| Claim safety | Existing-user claims use a conditional update | Concurrent first-time commands can race on account creation; the schema declares a unique index, but the losing request can error when that index is present |
| Inventory | Aadhaar and PAN cards are default items | No MGNREGA card, shop, item catalog, item use or enforced stack limits |
| Setup | First-time `daily` fills generated identity fields and shows buttons | Starting through `balance` or `inventory` leaves those fields unset; later `daily` does not finish setup |
| Buttons | Ownership helper and gender updates | UI reports success and removes controls before the database write succeeds |
| Gameplay | None | No majdoori, decisions, payout settlement, spending loop or progression |
| Verification | Generic command/route inventory tests | No Jeetlife-specific checks for claims, purchases, sessions or migration |

Source anchors: `src/models/jeetModel.ts`, `src/HybridCommands/Jeetlife/{daily,balance,inventory}.ts`, `src/Interactions/Buttons/Jeetlife/`, `MIGRATION.md`.

An offline schema check confirmed that a fresh account has only Aadhaar/PAN items and no MGNREGA card. This was not a live feature-parity or database audit.

## 2. Product direction

- Currency is **paise**. Four paise is the smallest unit; every price, reward, refund and balance adjustment follows that rule.
- Every player receives an **MGNREGA card**. It is the entry point into progression, not an item they have to buy.
- Use normal labels: **majdoori**, site, contractor, room, chai, shop, attendance. Keep Vimal and the odd inventory flavour. Avoid the previously rejected naming and explanatory disclaimers in player-facing copy.
- Let the player do something. A work command must start an interactive task, not just roll a random wage.
- Gender/profile choices are optional cosmetics, not gameplay gates or differences in earning power. No real identity-document numbers or date of birth are required.
- Preserve global user accounts and the existing prefix aliases. Slash and prefix entry points use the same implementation.
- Street food is both a place to spend paise and another route into majdoori, with an optional player-owned thela after the basic loop ships. It shares the same currency, inventory and task system.

Target loop: **open card → choose majdoori → play a short task → collect an automatic payout → buy/use an item → unlock a harder task or upgrade.**

The first release should support a satisfying 10–15 minute session and a clear reason to return. It need not simulate an entire life immediately.

## 3. First playable release

### Home and onboarding

`/jeetlife` and `p!jeetlife` show one compact dashboard: card, paise, completed shifts, next unlock, and any unfinished shift. Buttons: **Majdoori**, **Food**, **Shop**, **Inventory**, **Daily**. Food opens the street-food menu and available stall work. Keep categories as categories; use Previous/Next buttons for long lists.

One shared `ensurePlayer` operation serves every entry point. It creates the account atomically, issues the MGNREGA card once and repairs incomplete legacy setup. Reading somebody else's balance must never create their account.

The card shows the display name, an internal Jeetlife card ID, attendance and completed shifts. It does not request real-world personal details. Existing generated Aadhaar/PAN fields remain compatible but are not prerequisites.

### Four actual tasks

Each shift is three short rounds, usually 30–60 seconds total, with a generous two-minute expiry. Use clear text/buttons or selects, not millisecond reaction windows. The server decides the outcome from the player's answers; flavour text does not secretly change the wage.

| Task | Player action | Unlock |
| --- | --- | --- |
| Maal utaro | Read a delivery order and choose the matching load from three visibly different combinations. New order each round. | Immediately |
| Mix banao | Follow a displayed in-game recipe and choose the missing quantity/correct mixture. Wrong amounts lose a quality bonus, not existing money. | Three completed shifts |
| Hisaab milao | Compare a short delivery tally with the receipt and select the incorrect line or correct total. All money stays in multiples of four. | Six completed shifts |
| Stall pe majdoori | Serve three customer orders: match chai/samosa quantities and preferences, assemble the order, then hand it over. | Immediately, as an alternative to site work |

Generate quantities and distractors from validated rules; vary prompt/order/answer positions. Ship at least ten reviewed prompt variants per task. Each question must have exactly one valid answer. Do not use paid APIs or an LLM to generate or judge gameplay at runtime.

Every round shows progress, the task, choices and potential earnings. The finish screen explains base pay, quality bonus, items used, balance and the next unlock. Provide **Again**, **Shop** and **Card** buttons.

Example copy: “Attendance lag gayi. 24 paise aaye.” / “3 deliveries sahi. 48 paise.” Keep receipt amounts exact and readable.

### Street food: eat, serve, eventually own a thela

#### Eating — available in the first release

Put **Chai, Samosa, Pani puri, Chowmein and Momos** in the Food section of the existing shop. Proposed prices: 8, 12, 16, 20 and 24 paise respectively. Keep Vimal as a separate counter item, not a food recipe.

Food uses the existing `buy`/`use` operations. Chai retains its one-retry effect. Other dishes are optional flavour purchases: consuming one sets the profile's last food order and produces a short dish-specific exchange. Examples: “Chutney aur?” / “Bhai ek sukhi bhi.” / “Momos ke saath mayo alag hai.” Make those small interactions buttons where appropriate, with any extra charge shown before purchase. Do not imply real benefits or invent mandatory stat buffs just to justify every dish.

No hunger meter, starvation, daily meal requirement or lost earnings for skipping food. Clearly label which food has a gameplay effect and which is an optional flavour purchase. The food catalog defines prices and stack caps; no hidden charges.

#### Stall work — a playable first-release job

Start with **chai-samosa**, using three customer rounds in the existing task system. Each customer has a clear order, such as “2 chai, chini kam, 1 samosa, hari chutney.” Choose quantities/preferences with selects or buttons, review the tray, then press **Serve**. An order counts as correct only when the served tray matches it. Wrong combinations lose the round's quality bonus, not money from the player's wallet.

Prompts, customer lines and order combinations vary; instructions remain visible. Don't grade speed or hide the correct order behind random outcomes. The wage is the normal 24 + 8 per correctly served order, maximum 48. The stall owner supplies stock, so a new player can choose this job with zero paise. Gloves/cycle bonuses do not apply to serving food.

Stall work counts toward the same paid-shift limit and progression as site work. It is another majdoori choice, not an extra daily payout pool. Later unlocks can introduce a momos or chowmein menu with extra assembly choices using the same order model; avoid creating a separate minigame engine for each dish.

#### Your own thela — the first expansion after launch

After 12 completed paid shifts, offer an optional **chai-samosa thela for 320 paise**. This is a choice alongside saving for the cycle, not a prerequisite for either path. Customers are NPC orders; player-to-player sales remain out of scope.

Start with one product, three orders per session, a fixed selling price and finite stock. No passive income or mandatory rent. Show **stock cost, gross sales and net profit** separately:

| Example opening | Paise |
| --- | --- |
| Three vendor-only order kits at 12 each | 36 stock cost |
| Three correctly served orders at 28 each (2 chai + 1 samosa) | 84 gross sales |
| All three sold successfully | 48 net profit |
| Two sold, one served incorrectly and wasted | 20 net profit |
| All three served incorrectly and wasted | 36 loss, limited to the stock committed |

These are proposed game prices, to be tuned against wages. Vendor stock and retail food are distinct catalog entries: buying a retail samosa must not create resale stock or an unintended arbitrage loop. Owners receive sales proceeds, **not** sales plus a majdoori wage. Show the maximum possible stock loss before opening.

The player buys vendor stock into inventory, then reserves up to three order kits when opening. Each kit covers two chai and one samosa; the 28-paise selling price agrees with the retail menu (8 + 8 + 12). A served order consumes one kit; a correct order earns its posted sale price, an incorrect order earns zero. Untouched kits stay usable after closing. A later larger pan or momos steamer can expand capacity/menu choices, but not unlock unattended money generation.

Owner sessions share the global active-session guard and paid-session cap. Starting a stall cannot bypass limits by switching servers or alternating between worker and owner modes. Practice never uses owned stock. After any order is served, closing or timing out settles earned sales, consumes served stock, returns untouched reservations and counts one paid session—even when every served order was wrong. Closing before serving anything releases the reservation without consuming a paid slot.

Store the pending sales and reserved stock in the active session. Finish, cancel and expiry use the same idempotent settlement operation. Previously earned sales cannot disappear because Discord timed out. If a player runs out of stock or paise, free stall/site majdoori remains available; no loans or negative balance are necessary.

### Initial economy — tuning values, not final balance promises

| Action/item | Initial value | Purpose |
| --- | --- | --- |
| Daily attendance | 24 paise | A small return bonus; active play should earn more |
| Completed starter shift | 24 base + 8 per correct round; max 48 | Completion earns something even with mistakes |
| Gloves-tier shift | 32 base + the same quality bonus; max 56 | Modest permanent progression |
| Cycle-tier delivery shift | 40 base + the same quality bonus; max 64 | Reuses delivery gameplay with harder orders |
| Chai | 8 paise, stack cap 10 | One retry on a wrong answer during the current shift; at most one chai per shift |
| Vimal | 4 paise, stack cap 10 | Optional flavour/status item; never required for progression or given a productivity advantage |
| Gloves | 160 paise, own at most one | Unlocks the gloves pay tier; does not supply correct answers |
| Cycle | 480 paise, own at most one; requires 12 completed shifts | Unlocks upgraded delivery work |

Starting balance remains zero. Daily attendance is claimable immediately, but work never requires an entry fee. With 24 daily paise and roughly 40–48 per completed shift, gloves take about 3–5 shifts; purchases of consumables can extend that. Show actual progress, not an arbitrary level bar.

Start with a configurable limit of 12 paid shifts per Indian calendar day, clearly displayed before starting. After that, offer explicitly labelled practice: no pay, item consumption or progression credit. This gives a bounded initial economy; raise the limit only after observing real session length and spending. Expired/cancelled attempts must not consume a paid-shift slot.

After three jobs unlock, a daily board objective asks for completion of three distinct available jobs and pays 16 paise once. Stall majdoori counts; owned-thela sales and practice do not. It uses the same task and receipt system, not a separate quest framework.

Daily rewards change substantially from the current 100–199 range. Announce that balancing change; preserve money already earned. Never quietly wipe old balances to make the new prices work. Inspect the legacy balance distribution before finalizing shop prices or adding ranked competitions.

### Commands and controls

| Command | Behaviour |
| --- | --- |
| `jeetlife` | Dashboard, card and onboarding |
| `majdoori [job]` | Select site or stall work, start a shift, or resume the active one |
| `daily` | Attendance payout; retain `d` and `rojgaar` aliases |
| `balance [user]` | Balance; retain `bal`, `paise`, `paisa` |
| `inventory` | Owned items and working item controls; retain `inv`, `items`, `invenory` |
| `shop [category]` | Catalog, prices, limits and requirements; `food` filters to the street-food menu |
| `buy <item> [quantity]` | Same purchase operation as the shop button |
| `use <item>` | Same item operation as inventory controls |

All eight are `HybridCommand`s, not eight slash implementations plus eight prefix implementations. Use stable item names/IDs rather than mutable inventory row numbers. Give cards an Inspect action, not a consume action. A non-usable item must explain what it is for.

Street-food examples: `p!shop food`, `p!buy samosa 2`, `p!use samosa`, and `p!majdoori stall`, with equivalent slash options. Do not add separate food-buy, food-use or food-work commands. When the owned-thela expansion is implemented, operate it through the Food dashboard using the same component/service operations.

Only show actions that exist. Nothing should advertise “use an item” until the use path works. Dynamic help should discover the command metadata; update only Jeetlife's category description where needed.

## 4. Architecture: use PixD's existing machinery

Keep the current `User` model/collection identity and `userID` key. Do not introduce another database, generic economy SDK, command dispatcher or collector framework.

Minimal reusable pieces:

- Extend `src/models/jeetModel.ts` with a schema version, completed onboarding, stable inventory IDs, progression, daily keys, active shift and a bounded receipt history.
- `src/data/jeetlife.ts`: typed jobs, items, food menus, order templates, unlock thresholds and prices. One source of truth for calculations and UI; food is catalog data, not another subsystem.
- `src/services/JeetlifeService.ts`: onboarding, task transitions, daily claims, purchases, item use and settlement. Commands and components call these same operations.
- `src/helpers/jeetlifeViews.ts`: dashboard, question, receipt, shop and inventory payloads. Avoid duplicating embed construction across routes.
- Thin hybrid command files and registered `Component` handlers under the existing Jeetlife folders.

Use parameterized IDs such as `jeet:answer:<sessionId>:<step>:<choice>` and the template's existing component router. IDs identify an action; they must never contain trusted payout amounts or correctness flags. Check the persisted owner, message, channel, session and step server-side. Use the existing acknowledgement helpers and return the actual reply message for message binding.

The component ownership helper's owner/developer override must **not** grant permission to settle or spend another player's money. Economic operations always verify their actual account owner.

## 5. Durable state and money rules

Store active economic sessions in the same player document as money and inventory. `client.keyv` can cache rendered UI, but must not be the authority for rewards or purchases.

Suggested additions:

- `schemaVersion`, `onboardingComplete`, `cardId`.
- `daily.dayKey`, `daily.paidShifts`, `daily.jobCompletions`, `daily.objectiveClaimed`.
- `stats.completedShifts`, `stats.perfectShifts`, `stats.earned`, `stats.spent`.
- Inventory entries with stable `itemId` and integer quantity; catalog owns labels/icons/prices.
- `activeShift`: random session ID, revision, task seed/questions, round, quality, retry/item state, opening/expiry times, bound Discord message/channel, and the pay rules captured at start.
- Last 20 compact receipts with operation ID, money/item changes and timestamp.
- Street-food additions: optional `lastFoodOrder`; later, `stall` ownership/menu/upgrades and vendor-stock item IDs. Extend `activeShift` with employee/owner mode, reserved portions and pending sales only when owned stalls are implemented.

Requirements:

1. One active shift per global player, including across servers and prefix/slash invocations.
2. Every mutation is a conditional single-document update. Use an explicit revision/session guard, not read–modify–save for balances.
3. Finishing the final round marks the shift settled, adds paise/progression and writes its receipt in the same update. Replayed, duplicated or stale interactions cannot pay twice. For a later owned stall, settlement also consumes served stock and releases untouched stock, while distinguishing gross sales from profit.
4. Purchases check money, item limits and positive bounded integer quantity in the same update that debits money and adds items. Only server-side catalog prices count.
   Present a confirmation quote bound to the player's current revision. A successful purchase advances that revision; double clicks and stale confirmations fail the old revision check. Refresh an outdated quote rather than automatically retrying a spend against a new balance. Receipt history is for recovery/display, not the sole replay-prevention mechanism.
5. Item use decrements the item and applies its effect atomically. A copied or double-clicked action cannot consume or apply it twice. Cancelling does not refund an already used consumable; explain this before use.
6. Store paise as safe integers divisible by four. Reject negative, fractional, infinite, oversized and invalid client inputs before database operations. Check the resulting balance also stays within bounds.
7. A cancelled or expired employee shift pays nothing, deducts no money and releases the active slot. Correctly completed employee shifts earn at least base pay. Owned-stall sessions are different: always settle already served orders and return untouched stock; never erase earned sales or award an employee wage as well.
8. A restart resumes an unexpired shift from MongoDB. Resolve expiry lazily when the player returns; no cron or in-memory timer is required for economic correctness.
9. If MongoDB fails, do not report an award or purchase. If the write succeeds but Discord editing fails, the receipt remains authoritative and the next command can recover it without paying again.
10. Use explicit `YYYY-MM-DD` keys in `Asia/Kolkata`, not a locale-dependent display string. A shift reserves its paid slot for the day it starts; completion and daily reset must not miscount midnight-crossing sessions.

At the day boundary, don't erase an active shift's origin-day counters. Keep its reservation/settlement metadata until it finishes, and apply credits only to the corresponding day. Test this explicitly; a simple unconditional daily-counter reset is insufficient.

## 6. Safe migration of existing accounts

Before implementation rollout, perform a separate read-only production audit: user count, balance distribution, invalid quantities/balances, date formats and duplicate-user index state. Obtain a recoverable backup before modifying documents. None of this was performed for this plan.

Make migration versioned, idempotent and compatible with the existing collection:

- Keep existing balances, cards, aliases, selected profile fields and claim history.
- For valid legacy integer balances not divisible by four, propose a one-time **round up**, never down: 101 → 104, at most three paise credited. Record the adjustment and original value. Confirm this policy at migration review.
- Do not silently repair negative/non-finite/fractional or otherwise malformed balances; report those records for a deliberate correction policy.
- Add the MGNREGA card once; map known old inventory names to stable IDs. Preserve unknown legacy items instead of deleting them.
- Repair incomplete setup regardless of which command originally created the account. Rename Discord-account creation metadata appropriately; it is not the player's real birthday.
- Translate old Indian date strings deliberately and preserve whether today's daily was already claimed. Sentinel/invalid values must be handled explicitly, not passed to permissive date parsing.
- Keep old generated identity fields for compatibility until removal is separately approved.

Run a dry-run report first, then migrate in bounded batches or through the same guarded onboarding operation. Running migration twice must not re-credit rounding or duplicate cards.

## 7. Implementation order and completion gates

### Milestone 1 — correct account foundation

Implement shared onboarding, denomination rules, consistent daily claims, stable item IDs, the MGNREGA card and safe migration. Preserve the existing commands. Remove the unsupported inventory-use hint until the feature exists.

Gate: entry through any of the three existing commands yields the same complete account; concurrent creation succeeds cleanly; simultaneous daily claims pay once; old records survive migration.

### Milestone 2 — one complete playable loop

Implement the dashboard, Maal utaro, durable session transitions, quality-based wages, receipts, shop, chai, gloves and item use. Every advertised button must perform a complete action.

Gate: a new player can join, complete a shift, receive a correct payout, buy/use an item and see progress toward gloves. Wrong-user clicks, duplicate submissions and a restart cannot change the payout incorrectly. No dependency on the other two tasks to make this slice usable.

### Milestone 3 — first release content

Add Mix banao, Hisaab milao, Stall pe majdoori, the street-food menu, cycle-tier deliveries, Vimal, the daily board objective and reviewed content variations. Reuse the item operations already completed in milestone 2 for buying/eating. Complete the shared prefix/slash controls, help text and empty/expired states.

Gate: a full 10–15 minute playthrough has meaningful choices, a reachable first upgrade and a next objective. A new player can choose stall work immediately, buy a samosa with the proceeds, and continue earning without a hunger gate. A returning player sees saved progression and useful unlocked options. Practice mode is clear and never spends consumables.

### Milestone 4 — production readiness

Check concurrent mutations against a disposable MongoDB database, not production. Run a small manual Discord playthrough using both entry points. Verify account migration, rollover, restart and failed-reply recovery. Check build, relevant regression tests and deployment startup; no need to create a new test framework.

Update README/command help, deploy first to a controlled test guild, and verify real interactions there before enabling public play. Do not silently treat migration or login success as gameplay verification. During rollback, disable economic mutations first; do not restore an old database snapshot over new player progress.

## 8. After the loop proves fun

First expand street food into the owned-thela loop above. Verify stock reservation, sale settlement, bounded losses, cancellation, restart and no employee-wage double credit before releasing ownership. Keep future ownership buttons out of the launch UI until they work.

Then expand with weekly card stamps, room upgrades and a short co-op contract using the same task/payout system. Tune prices and the paid-shift limit from completion, repeat-play and spending behaviour. Add a weekly leaderboard based on completed/perfect shifts, not inherited wallet size; sales revenue must not be mistaken for profit.

Not in the first release: player transfers, theft, gambling, loans, passive rent deductions, hunger/stamina meters, multiple currencies, or a complicated market. Cross-player transactions need their own integrity design; don't sneak them into the single-player update.

## 9. Definition of actually playable

- New player understands the next action within one screen.
- First paid task is accessible with zero paise; no onboarding choice can block earning.
- Answers affect the result; luck is not the entire mechanic.
- Both input modes produce equivalent task state, rewards and available actions.
- Every inventory item has a working use, inspect, equipment or cosmetic purpose.
- Employee mistakes never reduce existing paise. Optional owned-stall play can lose committed stock, but cannot create debt or permanently lock the player out of free majdoori.
- Completing about 3–5 shifts makes the first upgrade reachable under the proposed prices.
- The second visit offers progression, not only another daily claim.
- A double-click, second server, expired message, restart or lost Discord response cannot duplicate or lose a committed payout.
- The bot only says “received,” “bought,” or “used” after the corresponding database change succeeds.
- Street food has a playable job, working food purchases and clear optional effects at launch; later stall ownership has real stock/profit decisions rather than passive income.
