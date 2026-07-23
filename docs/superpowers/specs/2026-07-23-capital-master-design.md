# Capital Master — design spec

Date: 2026-07-23

## Goal

Add a second game, "Capital Master," to the flag-master repo: same quiz mechanics as flag-master, but the player is shown a country (flag + name) and must pick its capital city from four choices.

## Repo layout

- `flag-master`'s repo root is untouched: `index.html`, `flags/`, `netlify.toml`, `leaderboard-apps-script.js`, `appsscript.json`, `.github/workflows/` all stay exactly as they are.
- New top-level folder `capital-master/`, fully self-contained:
  - `capital-master/index.html` — copied from the root `index.html` and adapted (see below).
  - `capital-master/flags/*.png` — a copy of the existing flag images (not a shared reference into the root `flags/` folder), so this folder has no dependency on the rest of the repo.
- No changes to `netlify.toml`. It already publishes `.` (repo root) as the site, so `capital-master/index.html` is automatically reachable at `<site>/capital-master/` once the folder exists — Netlify serves any static path under the publish directory.

## Game content

- Reuse the existing `COUNTRIES` array (197 entries, difficulty tiers 1–4, same flag codes) so the difficulty curve and flag assets carry over unchanged.
- Extend each entry with a capital: `["us","United States","Washington, D.C.",1]`.
- Capital data is authored during implementation. Known tricky cases to double check: South Africa (three capitals — use Pretoria as the administrative/most commonly cited one), Bolivia (constitutional capital Sucre vs seat of government La Paz — use Sucre, matching common quiz convention, and note the ambiguity in a code comment), Myanmar/Naypyidaw (commonly mistaken as Yangon).

## Quiz mechanics (unchanged from flag-master)

- Same difficulty-tiered queue building (`buildQueue`), 10s round timer, 3 lives, streak counter with milestone animation and score multiplier, practice mode, results screen, share flow, dark/light theme toggle.
- Prompt rendering stays the same: flag image + country name.
- Answer choices change from "4 country names, matched by country code" to "4 capital names, matched by capital string" — 3 wrong capitals drawn from other queued entries + the correct one, shuffled.

## What's copied verbatim vs adapted

**Copied verbatim** (game-agnostic mechanics, no changes needed):
- Timer/lives logic, streak + multiplier logic, milestone animation, share flow, results screen, theme handling, CSS/animations.

**Adapted:**
- `COUNTRIES` data (capital field added).
- Answer-choice generation (capitals instead of country names).
- Correctness check (`btn.dataset.capital === answer[2]` instead of comparing country codes).
- localStorage keys: `capitalmaster-name`, `capitalmaster-best` (instead of `flagmaster-name`, `flagmaster-best`) — keeps best-streak/name storage independent per game in the same browser.
- `GAME_URL` constant (points at the capital-master page for share links).
- Leaderboard payload/query: adds `game: "capitals"`.

## Leaderboard backend

- Reuses the existing Google Sheet and existing Apps Script deployment (no new deployment ID, no new GitHub Actions workflow needed — the current `Deploy Apps Script` workflow already triggers on changes to `leaderboard-apps-script.js`).
- `leaderboard-apps-script.js` changes:
  - `doPost` and `doGet` read a `game` field from the payload/query params. Default (absent/`"flags"`) behaves exactly as today — this keeps the already-deployed flag-master client (which never sends `game`) working unchanged.
  - When `game === "capitals"`, read/write a second pair of sheet tabs: `CapitalScores` (mirrors `Scores`) and `CapitalPlayLog` (mirrors `PlayLog`), created on first use the same way `getSheet_`/`getPlayLogSheet_` do today.
  - Cache key for the sorted-leaderboard cache becomes per-game (e.g. `leaderboard_sorted_v1:flags` / `leaderboard_sorted_v1:capitals`) so the two games' caches don't collide.
- `capital-master/index.html` sends `game: "capitals"` on every leaderboard call (submit + fetch).

## Out of scope

- No shared landing page and no cross-links between the two games.
- No shared JS/CSS engine file — the two games are independent copies and may diverge over time.
- No new Netlify site/config, no new Apps Script deployment.

## Testing / verification

- Manual verification in the browser preview: play through capital-master (correct/incorrect answers, timer running out, lives depleting, streak milestone animation, practice mode, share flow, leaderboard submit + fetch).
- Verify flag-master is unaffected: still plays normally, its leaderboard calls (without `game` field) still land in the original `Scores`/`PlayLog` sheets.
- Spot-check a sample of capitals against a reliable source (at minimum the tricky cases called out above) before shipping.
