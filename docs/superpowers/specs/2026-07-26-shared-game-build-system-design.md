# Shared game build system

## Problem

`index.html` (Flag Master) and `capital-master/index.html` (Capital Master) are
each a single self-contained HTML file (per the project's browser-game-stack
approach), but the second was built by copy-pasting the first. The two files
now duplicate:

- All CSS (layout, screens, buttons, theme variables, arcade sheet) — only
  small chunks (background animation, option-button styling) actually differ.
- All JS infrastructure: streak/lives/timer/scoring, practice mode, leaderboard
  fetch/submit/render, PostHog wiring, arcade "more games" sheet.
- The `/flags` image asset directory (828K, byte-identical, present twice).

Only three things are genuinely game-specific: the quiz item list, how a
question/answer is rendered (flag-image buttons + name prompt vs.
capital-name buttons + flag+name prompt), and the ambient background
animation (drifting flag tiles vs. world map with blinking capital dots).

Adding a third game (Math Master, already stubbed as a "coming soon" arcade
card) under the current approach means copy-pasting ~1500-1800 lines again.

## Goal

Restructure so that adding a new game means writing one `game.js` (quiz data
+ a handful of render hooks) and one `games.json` entry — no HTML/CSS/JS
copy-paste. Preserve the current deployment model exactly: each game is still
served as a single static `index.html` file, with zero hosting changes
(GitHub Pages, Netlify, and the Apps Script leaderboard backend all keep
working unmodified).

## Non-goals

- No change to the Apps Script leaderboard backend (`leaderboard-apps-script.js`
  already keys sheets off an optional `?game=` param, defaulting to `"flags"`
  when absent — this already supports the registry-driven approach below).
- No new CI gate for this project (see Verification section) — enforcement
  starts as a documented habit, not a build-breaking check.
- No framework/bundler adoption. Stays zero-dependency, matching the existing
  single-file-per-game philosophy.
- Math Master's actual gameplay is out of scope; only its arcade-menu stub
  entry is touched (already exists as `enabled:false` in spirit — this design
  formalizes it in `games.json`).

## Design

### Source layout

```
/games.json                    # registry: id, title, tagline, icon, theme, leaderboardGame, url, outputDir, enabled
/games/
  flag-master/
    game.js                    # COUNTRIES data + 4 render hooks (see below)
    background.js               # drifting flag-tile animation
  capital-master/
    game.js                    # COUNTRIES data + 4 render hooks
    background.js               # world map + blinking capital dots
/shared/
  engine.js                    # streak/lives/timer/scoring, practice mode, leaderboard
                                # fetch/submit/render, PostHog wiring, screen nav —
                                # today's generic ~700 lines, game-agnostic
  styles.css                    # shared layout/screens/buttons/theme-variable CSS
  template.html                 # HTML shell (screen-start/practice-setup/game/end
                                # markup) with {{TITLE}}/{{TAGLINE}} placeholders
                                # and a script-insertion point
  arcade-menu.js                 # renders the "more games" sheet from games.json
                                 # (baked in at build time, not fetched at runtime)
/flags/                          # single copy of flag images; both games
                                  # reference it via relative path
build.js                         # plain Node script, zero deps
index.html                       # generated (flag-master; stays at repo root)
capital-master/index.html         # generated
```

`capital-master/flags/` is deleted; `capital-master/index.html` references
`../flags/<code>.png` instead of its own copy.

### `game.js` contract

`engine.js` owns the entire round/timer/streak/leaderboard/practice-mode flow
and calls into a fixed set of hooks + data exported by each game's `game.js`:

```js
export default {
  id: "flag-master",
  leaderboardGame: "flags",        // sent as ?game= to the leaderboard backend
  items: COUNTRIES,                 // [code, name, tier]
  buildQueue(items, practiceCfg),   // default tier-ordering/shuffle logic
                                     // lives in engine.js; override only if a
                                     // game needs different queue behavior
  renderPrompt(item),                // HTML for the question (e.g. name only,
                                      // or name + flag image)
  renderOption(item),                 // HTML for one answer button
  optionKey(item),                    // value compared against a click to
                                       // grade correctness (code vs. capital name)
  buildBackground(container),          // ambient animated background for the
                                        // start/practice screens
  theme: { accent, accent2, gold, ... }, // CSS custom-property overrides,
                                          // appended after shared styles.css
                                          // so they win the cascade
  copy: { title, tagline, shareText, crossPromoTitle, ... },
};
```

Everything else — topbar, options-grid click wiring, correct/wrong animation
classes, timer bar, lives display, leaderboard fetch/submit/render, personal
best storage, PostHog event capture, theme toggle, arcade sheet rendering —
stays fully generic in `engine.js`. It does not know or care whether options
are images or text.

### `games.json` registry

```json
[
  { "id": "flag-master", "leaderboardGame": "flags", "title": "Flag Master",
    "icon": "🌍", "tagline": "How many flags do you know?",
    "url": "/", "outputDir": ".", "enabled": true },
  { "id": "capital-master", "leaderboardGame": "capitals", "title": "Capital Master",
    "icon": "🏛️", "tagline": "Same streaks, new map",
    "url": "capital-master/", "outputDir": "capital-master", "enabled": true },
  { "id": "math-master", "title": "Math Master", "icon": "🔢",
    "tagline": "Coming soon", "enabled": false }
]
```

`enabled:false` entries render as a greyed-out "coming soon" arcade card
(matching today's Math Master stub) and are skipped when generating pages.

### `build.js`

Plain Node, no npm dependencies. For each `enabled` entry in `games.json`:

1. Read `shared/template.html`; substitute `{{TITLE}}`/`{{TAGLINE}}` and other
   text placeholders.
2. Inline `shared/styles.css` into `<style>`, followed by the game's `theme`
   overrides as extra CSS custom-property rules (cascade order makes them win).
3. Inline `shared/engine.js`, `shared/arcade-menu.js` (rendered against the
   full `games.json` at build time — no runtime fetch), and the game's
   `game.js` + `background.js` into `<script>`.
4. Write the result to `<outputDir>/index.html`.

Run via `node build.js`; generated `index.html` files are committed to git,
exactly as today. GitHub Pages and Netlify continue serving static files with
no build step of their own — no hosting configuration changes.

### Migration steps

1. Extract flag-master's shared pieces into `shared/engine.js`, `styles.css`,
   `template.html`, `arcade-menu.js`; factor its 4 hooks into
   `games/flag-master/game.js` + `background.js`.
2. Write `build.js` + `games.json` (flag-master entry only); run it; diff the
   generated `index.html` against the currently-committed one — logic must be
   unchanged (whitespace/ordering differences are fine).
3. Verify flag-master in the browser: full game loop, practice mode,
   leaderboard submit/fetch, theme toggle, arcade sheet, streak/lives/timer —
   before moving on, per this project's standing workflow expectation to
   verify in-browser and get explicit go-ahead before pushing.
4. Port capital-master onto `shared/` by writing its `game.js`/`background.js`
   (world map, capital-name buttons); delete its duplicated CSS/JS; verify in
   the browser.
5. De-duplicate `/flags`: point capital-master's asset references at the root
   `flags/` folder via relative path; delete `capital-master/flags/`.
6. Document (in `CLAUDE.md` or `README`) that `node build.js` must be run and
   its output committed whenever `shared/`, `games/*/`, or `games.json`
   change — no new CI gate for this project.

## Verification

- Generated `index.html` (both games) diffed against pre-refactor versions
  for logic equivalence (not byte-identical — comments/whitespace may shift).
- Manual browser verification of both games after each porting step: full
  quiz loop, practice mode, leaderboard submit + fetch + name edit, theme
  toggle, arcade "more games" sheet (including the Math Master coming-soon
  card), streak multiplier, share flow.
- No backend or hosting changes to verify — `leaderboard-apps-script.js`,
  GitHub Pages, and Netlify configuration are untouched.
