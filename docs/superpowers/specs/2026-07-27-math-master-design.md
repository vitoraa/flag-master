# Math Master — Design Spec

Date: 2026-07-27

## Summary

Add a third game, **Math Master**, to the shared Flag Master build system
(`games.json` + `shared/` + `games/<id>/`). The player is shown an equation
and picks the correct result from 4 numeric options — same core loop
(streaks, lives, timer, leaderboard, arcade menu, share card) as Flag Master
and Capital Master, reusing `shared/engine.js` unmodified.

The `math-master` entry already exists in `games.json` as a disabled stub
(`icon: "➗"`, `title: "Math Master"`, `tagline: "Coming soon"`). This spec
fills it in and enables it.

## Architecture

No changes to `shared/engine.js`, `shared/template.html`, or `build.js`.
Math Master fits the existing per-game contract:

- `games/math-master/game.js` — data generation + game-specific hooks
- `games/math-master/game.css` — answer-button and background styling
- `games/math-master/background.js` — floating math-glyph background
- `games.json` — filled-in `math-master` entry (all `REQUIRED_FIELDS`)

### Item shape

The engine treats every item as `[key, ..., tier]` where `tier` (1–4) is
read directly (`answer[2]`) for scoring, leveling, and `buildQueue()`
grouping. Flags use `[code, name, tier]`; Math Master uses:

```js
[id, "7 × 8", tier, answer]   // id: string, expression: string, tier: 1-4, answer: number
```

`GAME.items` is **generated procedurally** in `game.js` when the script
loads (an IIFE builds ~200 equations across the 4 tiers) rather than
hand-written like the country lists, since equations are cheap to generate
and hand-writing hundreds would be pure busywork. `itemCount` in
`games.json` is set to match the generated pool size.

### Difficulty tiers

- **Tier 1**: addition/subtraction, operands 1–20, plus easy multiplication
  (tables 2–5). Deliberately not trivial single-digit sums — kept
  substantive enough to hold attention as the "warm up" tier.
- **Tier 2**: addition/subtraction with operands up to ~50, plus
  multiplication tables 2–9.
- **Tier 3**: multiplication up to 12×12, plus division.
- **Tier 4**: large multiplication (2–3 digit operands), plus division with
  bigger numbers.

Division equations are always generated backwards (pick divisor and
quotient first, multiply to get the dividend), so the correct answer is
always a clean integer — no decimals or remainders anywhere.

Subtraction always keeps the first operand ≥ the second (no negative
results). All generation happens with plain `Math.random()`, consistent
with `shuffle()` elsewhere in the codebase.

### Distractors (plausible near-misses)

Default `pickDistractors()` in `shared/engine.js` pulls other pool items
of the same/different tier — appropriate for flags (any other country is a
plausible wrong flag) but wrong here (a random *other equation's* answer
could be wildly off, or collide with the correct value). Math Master
defines a custom hook:

```js
GAME.pickDistractors = function (answer) { ... }
```

It synthesizes 3 unique wrong numbers by simulating specific common
mistakes based on the equation's operator and operands, e.g.:

- **Off-by-one-operand**: recompute with one operand shifted by ±1
  (7×8 → 7×9, 7×7).
- **Operation slip**: apply a different operator to the same operands
  (e.g. add instead of subtract).
- **Small offset**: correct answer ± a small delta scaled to the tier.

Generated candidates are deduped against each other and against the
correct answer (regenerating on collision) so all 4 options are always
distinct.

### Rendering hooks

- `GAME.renderPrompt(item)` — sets the equation text (`item[1]`, e.g.
  `"7 × 8 = ?"`) large and centered, replacing flag-master's flag image /
  capital-master's country name.
- `GAME.renderOption(item)` — renders a big, bold number-pill button
  showing `item[3]`. New CSS: a 2×2 grid of pill buttons — the natural fit
  for pure numeric options (flags use image buttons, capitals use text
  pills; neither fits a numeric keypad-style layout).
- `GAME.optionKey(item)` — returns `String(item[3])`, since correctness is
  determined by numeric value, not by identity of the underlying equation
  object (a distractor is a synthesized number, not a real pool item).
- `GAME.wrongAnswerText(item, clickedKey)` — reports the correct answer,
  e.g. `"The answer was 56"`.
- `GAME.detectLocale` — reused pattern from flag-master (PostHog
  `pt` A/B flag), only if/when PT localization is added for this game;
  out of scope for v1 (see Non-goals).

### Background

Following flag-master's floating-tile grid pattern (`background.js`) —
not capital-master's SVG world map, which doesn't fit a math theme. A grid
of large, faded grey glyphs (digits 0–9 and the four operators) drift and
rotate slowly across a light background, matching the "grey letters/numbers
moving around" look requested. Implemented the same way as flag-master's
`.fl` tiles: absolutely positioned divs with randomized position/rotation/
duration CSS custom properties, animated via existing shared CSS keyframes
(new glyph tiles reuse the same animation approach, just swapping flag
`<img>` for a text glyph).

### games.json entry

Filled-in fields for the existing stub:

- `enabled: true`
- `outputDir`/`url`: `"math-master"` (matches capital-master's pattern)
- `assetPrefix: "../"`
- `tagline`: matches existing tone, e.g. "How fast can you crunch the
  numbers? Prove it."
- `storagePrefix`: `"mathmaster"`
- `leaderboardGame`: `"math"`
- `analyticsId`: `"math-master"`
- `gameUrl`: `"https://vitoraa.github.io/flag-master/math-master/"`
- `crossPromoUrl`/`crossPromoTargetId`: points at Flag Master (mirrors the
  existing flag↔capital cross-promo pairing; the arcade menu already lists
  all games, so this isn't the only discovery path)
- `arcadeGradient`: a new gradient distinct from the existing blue/green
- `itemCount`: generated pool size (~200)
- `itemNoun`: `"problems"`; `unitSingular`/`unitPlural`: `"problem"`/
  `"problems"`
- `promptCounterLabel`: `"Problem"`
- `practiceCfgLabel`: `"Problems"`
- `initialTheme`: `"light"` (background design assumes a light backdrop)
- `levels`: 4 tiers, e.g. `{"1": "Warming up", "2": "Getting tricky", "3":
  "Math nerd zone", "4": "Very hard"}`
- `trackAnswerEvent`: `"math_answered"`
- `ranks`: new set of 6 tiers with math-flavored copy/emoji (e.g. "Math
  Wizard", "Number Cruncher", ... down to a bottom-tier joke rank),
  mirroring the existing rank-count/structure

No PT copy (`levelsPt`, `ranksPt`, `promptCounterLabelPt`) in v1 — English
only, consistent with capital-master's current state (only flag-master has
PT localization today).

## Testing

- `npm run build` (or equivalent `node build.js`) succeeds and produces
  `math-master/index.html` with no missing required fields.
- Manual browser verification of the golden path: start game, answer
  correctly/incorrectly across a few rounds spanning multiple tiers,
  confirm no duplicate answer options ever appear, confirm timer/lives/
  streak/leaderboard/share/arcade-menu behave identically to the existing
  games, confirm the floating background renders and doesn't obscure
  content.
- Spot-check each tier's generator directly (e.g. via browser console) for
  a few hundred generated items to confirm: tier ranges are respected, no
  negative subtraction results, all division results are integers, no
  distractor ever equals the correct answer.

## Non-goals (v1)

- Portuguese localization (can follow flag-master's existing pattern
  later, as a separate piece of work).
- Order-of-operations / multi-step expressions.
- Decimal or negative answers.
- A 5th difficulty tier or changes to `shared/engine.js`.
