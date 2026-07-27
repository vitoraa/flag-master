# Math Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third game, Math Master, to the shared build system — an equation with 4 multiple-choice numeric answers, reusing `shared/engine.js` unmodified.

**Architecture:** Follows the existing `games/<id>/{game.js,game.css,background.js}` + `games.json` contract that flag-master and capital-master already use. `game.js` procedurally generates ~200 equations across 4 difficulty tiers (instead of a hand-written data list) and defines the engine's per-game hooks (`renderPrompt`, `renderOption`, `optionKey`, `wrongAnswerText`, `pickDistractors`). A custom distractor generator synthesizes plausible wrong numbers (off-by-one-operand, operation slip, small offset) rather than reusing other equations' answers. The leaderboard Apps Script backend gets a third `"math"` branch alongside its existing `"flags"`/`"capitals"` branches so scores don't collide with the flags sheet.

**Tech Stack:** Vanilla JS/CSS/HTML (no build tooling beyond the existing `build.js` string-templating script), Google Apps Script for the leaderboard backend, plain Node `assert` for backend/logic tests (no test framework is used anywhere in this repo).

## Global Constraints

- Do NOT modify `shared/engine.js`, `shared/template.html`, or `build.js` — Math Master must fit the existing per-game contract unchanged.
- Division answers must always be a clean integer — never a decimal or remainder.
- Subtraction must never produce a negative result.
- Exactly 4 difficulty tiers (matching `GAME.levels` keys `"1"`-`"4"`), no 5th tier.
- Tier 1 is addition/subtraction (operands 1–20) plus easy multiplication (tables 2–5) — deliberately not trivial single-digit sums, per explicit user direction to keep the "warm up" tier from feeling too easy.
- No Portuguese localization in v1 (English only, matching capital-master's current state).
- No order-of-operations / multi-step expressions in v1.
- `itemCount`: 200 (the generated pool size).

---

### Task 1: Leaderboard backend — add `"math"` game support

**Files:**
- Modify: `leaderboard-apps-script.js`
- Modify: `leaderboard-apps-script.test.js`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `sheetNamesFor_(game)` now returns `{ scores: "MathScores", log: "MathPlayLog", cacheKey: "leaderboard_sorted_v1:math" }` for `game === "math"`. This is what `games.json`'s `math-master.leaderboardGame: "math"` (Task 3) will send as the `game` query/body param, and what `shared/engine.js` (unmodified) forwards verbatim via `GAME.leaderboardGame`.

Right now `sheetNamesFor_` only special-cases `"capitals"` and falls back to the flags sheet for anything else — so without this change, Math Master's scores would silently land in the *Flags* leaderboard sheet the moment it goes live.

- [ ] **Step 1: Write the failing assertions**

Add to the end of `leaderboard-apps-script.test.js` (before the final `console.log` line):

```js
const mathNames = sheetNamesFor_("math");
assert.strictEqual(mathNames.scores, "MathScores");
assert.strictEqual(mathNames.log, "MathPlayLog");
assert.notStrictEqual(mathNames.cacheKey, flagsDefault.cacheKey);
assert.notStrictEqual(mathNames.cacheKey, capitals.cacheKey);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node leaderboard-apps-script.test.js`
Expected: `AssertionError` — `mathNames.scores` is `"Scores"` (the flags default), not `"MathScores"`.

- [ ] **Step 3: Implement the `"math"` branch**

In `leaderboard-apps-script.js`, replace the `sheetNamesFor_` function (currently lines 10-15) with:

```js
function sheetNamesFor_(game) {
  if (game === "capitals") {
    return { scores: "CapitalScores", log: "CapitalPlayLog", cacheKey: CACHE_KEY + ":capitals" };
  }
  if (game === "math") {
    return { scores: "MathScores", log: "MathPlayLog", cacheKey: CACHE_KEY + ":math" };
  }
  return { scores: SHEET_NAME, log: PLAY_LOG_SHEET_NAME, cacheKey: CACHE_KEY + ":flags" };
}
```

Then replace the two ad-hoc game-normalizing ternaries with a shared helper. Add this function near the top (right after `sheetNamesFor_`):

```js
function normalizeGame_(raw) {
  if (raw === "capitals") return "capitals";
  if (raw === "math") return "math";
  return "flags";
}
```

In `doPost` (currently `const game = data.game === "capitals" ? "capitals" : "flags";` around line 67), replace with:

```js
  const game = normalizeGame_(data.game);
```

In `doGet` (currently `const game = p.game === "capitals" ? "capitals" : "flags";` around line 135), replace with:

```js
  const game = normalizeGame_(p.game);
```

Finally, update the exports line at the bottom of the file to also expose `normalizeGame_` for testing:

```js
if (typeof module !== "undefined") {
  module.exports = { sheetNamesFor_, getSortedAll_, normalizeGame_ };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node leaderboard-apps-script.test.js`
Expected: `All leaderboard-apps-script tests passed`

- [ ] **Step 5: Commit**

```bash
git add leaderboard-apps-script.js leaderboard-apps-script.test.js
git commit -m "feat: add math game leaderboard sheets to Apps Script backend"
```

Note: this file auto-deploys via `.github/workflows/deploy-apps-script.yml` whenever it changes on `main` — no manual `clasp` step needed, but the deploy only happens once this branch is merged.

---

### Task 2: Equation generator + distractor logic (`games/math-master/game.js`)

**Files:**
- Create: `games/math-master/game.js`
- Test: `games/math-master/game.test.js`

**Interfaces:**
- Consumes: nothing from other tasks (pure data/logic module).
- Produces:
  - `GAME.items`: array of `[id, exprText, tier, answer, meta]` where `id` is a string, `exprText` is a display string like `"7 × 8"`, `tier` is `1`-`4`, `answer` is the correct integer, and `meta` is `{ op: "+"|"−"|"×"|"÷", a: number, b: number }` describing the operands actually shown (for `÷`, `a` is the dividend and `b` is the divisor).
  - `GAME.renderPrompt`, `GAME.renderOption`, `GAME.optionKey`, `GAME.wrongAnswerText`, `GAME.pickDistractors` — the engine hooks Task 3's `game.css` styles and `shared/engine.js` (unmodified) call.
  - For Node testing only: `module.exports = { generateItems, pickMathDistractors, applyOp }`.

This file is loaded in two contexts: bundled into the browser build right after `const GAME = ...` (via `build.js`, unmodified), and required directly under plain Node by `game.test.js` (mirroring the existing `leaderboard-apps-script.test.js` pattern of exposing internals via `typeof module !== "undefined"`). To keep it requireable under Node, it must not touch `document`/`$`/browser globals at load time — only inside the hook functions, which Node never calls.

- [ ] **Step 1: Write the failing test**

Create `games/math-master/game.test.js`:

```js
const assert = require("assert");
const { generateItems, pickMathDistractors, applyOp } = require("./game.js");

const items = generateItems();
assert.strictEqual(items.length, 200, "pool should contain 200 items");
for (let tier = 1; tier <= 4; tier++) {
  const count = items.filter(it => it[2] === tier).length;
  assert.strictEqual(count, 50, `tier ${tier} should have 50 items, got ${count}`);
}

items.forEach(([id, expr, tier, answer, meta]) => {
  assert.ok(Number.isInteger(answer) && answer >= 0, `${expr} should have a non-negative integer answer, got ${answer}`);
  if (meta.op === "÷") {
    assert.strictEqual(meta.a / meta.b, answer, `${expr} should divide evenly`);
  }
  if (meta.op === "−") {
    assert.ok(meta.a >= meta.b, `${expr} subtraction should never go negative`);
  }
});

assert.strictEqual(applyOp("+", 2, 3), 5);
assert.strictEqual(applyOp("−", 5, 3), 2);
assert.strictEqual(applyOp("×", 4, 3), 12);
assert.strictEqual(applyOp("÷", 12, 4), 3);

for (let i = 0; i < 500; i++) {
  const answer = items[Math.floor(Math.random() * items.length)];
  const distractors = pickMathDistractors(answer);
  assert.strictEqual(distractors.length, 3, "must always produce exactly 3 distractors");
  const values = distractors.map(d => d[3]);
  assert.strictEqual(new Set(values).size, 3, "distractors must be unique among themselves");
  values.forEach(v => {
    assert.notStrictEqual(v, answer[3], "distractor must not equal the correct answer");
    assert.ok(v > 0, "distractor must be a positive number");
  });
}

console.log("All math-master game tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node games/math-master/game.test.js`
Expected: `Error: Cannot find module './game.js'`

- [ ] **Step 3: Implement the generator and hooks**

Create `games/math-master/game.js`:

```js
// Procedurally generated equation pool — unlike flags/capitals, math
// problems are cheap to generate, so there's no hand-written data list.
// Item shape: [id, exprText, tier, answer, meta]
// meta = { op, a, b } describes the operands actually shown (for ÷,
// a = dividend, b = divisor) so pickMathDistractors can simulate mistakes
// without re-parsing the display string.

function rnd(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }

function addSub(min, max, tier, nextId) {
  const a = rnd(min, max), b = rnd(min, max);
  const id = `m${nextId()}`;
  if (Math.random() < 0.5) {
    return [id, `${a} + ${b}`, tier, a + b, { op: "+", a, b }];
  }
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return [id, `${hi} − ${lo}`, tier, hi - lo, { op: "−", a: hi, b: lo }];
}

function mul(aMin, aMax, bMin, bMax, tier, nextId) {
  const a = rnd(aMin, aMax), b = rnd(bMin, bMax);
  const id = `m${nextId()}`;
  return [id, `${a} × ${b}`, tier, a * b, { op: "×", a, b }];
}

function div(divMin, divMax, quotMin, quotMax, tier, nextId) {
  const divisor = rnd(divMin, divMax);
  const quotient = rnd(quotMin, quotMax);
  const dividend = divisor * quotient;
  const id = `m${nextId()}`;
  return [id, `${dividend} ÷ ${divisor}`, tier, quotient, { op: "÷", a: dividend, b: divisor }];
}

function generateItems() {
  let counter = 0;
  const nextId = () => counter++;
  const GENERATORS = {
    1: () => Math.random() < 0.7 ? addSub(1, 20, 1, nextId) : mul(2, 5, 2, 5, 1, nextId),
    2: () => Math.random() < 0.6 ? addSub(10, 50, 2, nextId) : mul(2, 9, 2, 9, 2, nextId),
    3: () => Math.random() < 0.5 ? mul(2, 12, 2, 12, 3, nextId) : div(2, 12, 2, 12, 3, nextId),
    4: () => Math.random() < 0.5 ? mul(10, 99, 2, 12, 4, nextId) : div(2, 20, 10, 50, 4, nextId),
  };
  const PER_TIER = 50;
  const items = [];
  for (let tier = 1; tier <= 4; tier++) {
    for (let i = 0; i < PER_TIER; i++) items.push(GENERATORS[tier]());
  }
  return items;
}

function applyOp(op, a, b) {
  if (op === "+") return a + b;
  if (op === "−") return a - b;
  if (op === "×") return a * b;
  if (op === "÷") return b === 0 ? a : a / b;
  return a;
}

function offByOperandVariants(op, a, b) {
  const out = [];
  [-1, 1].forEach(d => {
    out.push(applyOp(op, a + d, b));
    if (b + d !== 0) out.push(applyOp(op, a, b + d));
  });
  return out;
}

function operationSlipVariants(op, a, b) {
  return ["+", "−", "×"].filter(o => o !== op).map(o => applyOp(o, a, b));
}

function smallOffsetVariants(tier, correct) {
  const scale = tier <= 2 ? 3 : Math.max(3, Math.round(correct * 0.1));
  return [correct - scale, correct + scale, correct - 2 * scale, correct + 2 * scale];
}

function shuffleArr(a) {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Custom pickDistractors: unlike flags/capitals (where any other pool item
// is a plausible wrong answer), a random other equation's answer could be
// wildly off or collide with the correct value. Instead this simulates
// specific mistakes: off-by-one-operand, wrong operator, small offset.
function pickMathDistractors(answer) {
  const tier = answer[2], correct = answer[3], meta = answer[4];
  const used = new Set([correct]);
  const picks = [];
  const candidates = shuffleArr([
    ...offByOperandVariants(meta.op, meta.a, meta.b),
    ...operationSlipVariants(meta.op, meta.a, meta.b),
    ...smallOffsetVariants(tier, correct),
  ]);
  for (const c of candidates) {
    if (picks.length >= 3) break;
    const n = Math.round(c);
    if (n <= 0 || used.has(n)) continue;
    used.add(n);
    picks.push(n);
  }
  let step = 1;
  while (picks.length < 3) {
    const n = correct + step * (picks.length % 2 === 0 ? 1 : -1);
    step++;
    if (n > 0 && !used.has(n)) { used.add(n); picks.push(n); }
  }
  return picks.map(n => ({ 3: n }));
}

if (typeof GAME !== "undefined") {
  GAME.items = generateItems();

  GAME.renderPrompt = function (item) {
    $("prompt-flag").style.display = "none";
    $("country-name").textContent = `${item[1]} = ?`;
  };

  GAME.renderOption = function (item) {
    return `<button class="math-btn" data-key="${item[3]}" aria-label="Answer ${item[3]}">
       <span class="math-num">${item[3]}</span>
       <span class="mark"></span>
     </button>`;
  };

  GAME.optionKey = function (item) { return item[3]; };

  GAME.wrongAnswerText = function (item, clickedKey) {
    return `The answer was ${item[3]}`;
  };

  GAME.pickDistractors = pickMathDistractors;
}

// Exposed for game.test.js only. The browser build never sets `module`.
if (typeof module !== "undefined") {
  module.exports = { generateItems, pickMathDistractors, applyOp };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node games/math-master/game.test.js`
Expected: `All math-master game tests passed`

- [ ] **Step 5: Commit**

```bash
git add games/math-master/game.js games/math-master/game.test.js
git commit -m "feat: add procedural equation generator and hooks for Math Master"
```

---

### Task 3: Styling, background, `games.json` entry, and build verification

**Files:**
- Create: `games/math-master/game.css`
- Create: `games/math-master/background.js`
- Modify: `games.json`

**Interfaces:**
- Consumes: `GAME.items`/hooks from Task 2 (`games/math-master/game.js`); `GAME.leaderboardGame: "math"` routing added in Task 1.
- Produces: a fully enabled `math-master` entry that `build.js` (unmodified) can build into `math-master/index.html`, plus the CSS classes (`.math-btn`, `#flag-bg .mg`) that Task 2's `GAME.renderOption` HTML depends on, plus `GAME.buildBackground` (called by `shared/engine.js`, unmodified).

This is one task because none of these three pieces produce a working, previewable page on their own — `build.js` requires every `REQUIRED_FIELDS` entry in `games.json` before it will build a game at all, and the CSS/background are only meaningfully verifiable once the page actually renders.

- [ ] **Step 1: Write the answer-button and background CSS**

Create `games/math-master/game.css`. This mirrors the structure of `games/flag-master/game.css` (floating background tiles + answer buttons), swapping flag images for text glyphs and numbers:

```css
#flag-bg .mg {
  position: absolute; font-weight: 700; color: var(--muted);
  will-change: transform; user-select: none; pointer-events: none;
  animation: drift var(--d) ease-in-out var(--delay) infinite alternate;
}
#flag-bg .veil {
  position: absolute; inset: 0;
  background:
    radial-gradient(900px 620px at 50% 42%, rgba(6,7,13,.42), rgba(6,7,13,.8) 78%),
    linear-gradient(180deg, rgba(6,7,13,.32), rgba(6,7,13,.74));
}
:root[data-theme="light"] #flag-bg .veil {
  background:
    radial-gradient(900px 620px at 50% 42%, rgba(238,241,248,.4), rgba(238,241,248,.8) 78%),
    linear-gradient(180deg, rgba(238,241,248,.28), rgba(238,241,248,.72));
}
@keyframes drift {
  from { transform: translate(0,0) rotate(var(--r1)); }
  to   { transform: translate(var(--tx), var(--ty)) rotate(var(--r2)); }
}
@media (prefers-reduced-motion: reduce) {
  #flag-bg .mg { animation: none; }
}
:root[data-theme="light"] .hero .tag {
  text-shadow: 0 0 12px var(--bg), 0 0 6px var(--bg), 0 1px 2px var(--bg);
}

#prompt-flag { display: none; }

.math-btn {
  border: 2px solid var(--line); border-radius: 16px;
  background: var(--surface); color: var(--text); cursor: pointer; padding: 22px 12px;
  min-height: 84px; position: relative;
  display: flex; align-items: center; justify-content: center;
  transition: transform .14s cubic-bezier(.2,.8,.2,1), border-color .15s, box-shadow .15s;
}
.math-btn .math-num { font-size: 28px; font-weight: 700; letter-spacing: -.5px; }
.math-btn:not(:disabled):hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 12px 30px -10px rgba(108,140,255,.5); }
.math-btn .mark {
  position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%;
  display: grid; place-items: center; opacity: 0; transform: scale(.5);
  transition: opacity .2s, transform .2s; z-index: 2;
}
.math-btn.correct { border-color: var(--good); box-shadow: 0 0 0 1px var(--good), 0 12px 30px -8px rgba(47,224,160,.5); }
.math-btn.correct .mark { opacity: 1; transform: scale(1); background: var(--good); color: #04241a; }
.math-btn.wrong { border-color: var(--bad); animation: shake .4s; }
.math-btn.wrong .mark { opacity: 1; transform: scale(1); background: var(--bad); color: #2a0710; }
.math-btn:disabled { cursor: default; }
.math-btn.dim { opacity: .3; }
```

- [ ] **Step 2: Write the floating math-glyph background**

Create `games/math-master/background.js`:

```js
GAME.buildBackground = function (layer) {
  const GLYPHS = ["+", "−", "×", "÷", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const cols = 6, rows = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const el = document.createElement("div");
      el.className = "mg";
      el.textContent = glyph;
      el.style.fontSize = rnd(34, 64) + "px";
      el.style.left = (c / cols * 100 + rnd(-4, 4)) + "%";
      el.style.top  = (r / rows * 100 + rnd(-4, 4)) + "%";
      el.style.opacity = rnd(0.12, 0.28).toFixed(2);
      el.style.setProperty("--tx", rnd(-46, 46).toFixed(0) + "px");
      el.style.setProperty("--ty", rnd(-46, 46).toFixed(0) + "px");
      el.style.setProperty("--r1", rnd(-9, 9).toFixed(1) + "deg");
      el.style.setProperty("--r2", rnd(-9, 9).toFixed(1) + "deg");
      el.style.setProperty("--d", rnd(4.5, 9).toFixed(1) + "s");
      el.style.setProperty("--delay", (-rnd(0, 9)).toFixed(1) + "s");
      layer.appendChild(el);
    }
  }
  const veil = document.createElement("div");
  veil.className = "veil";
  layer.appendChild(veil);
};
```

(`rnd` here is `shared/engine.js`'s existing `const rnd = (min, max) => min + Math.random() * (max - min);`, already in scope when this file is concatenated into the page by `build.js` — same as how `games/flag-master/background.js` uses it.)

- [ ] **Step 3: Fill in the `games.json` entry**

In `games.json`, find the existing disabled stub:

```json
  {
    "id": "math-master",
    "enabled": false,
    "icon": "➗",
    "title": "Math&nbsp;Master",
    "titlePlain": "Math Master",
    "tagline": "Coming soon"
  }
```

Replace it with:

```json
  {
    "id": "math-master",
    "enabled": true,
    "outputDir": "math-master",
    "url": "math-master/",
    "assetPrefix": "../",
    "icon": "➗",
    "title": "Math&nbsp;Master",
    "titlePlain": "Math Master",
    "tagline": "How fast can you crunch the numbers? Prove it.",
    "storagePrefix": "mathmaster",
    "leaderboardGame": "math",
    "analyticsId": "math-master",
    "gameUrl": "https://vitoraa.github.io/flag-master/math-master/",
    "crossPromoUrl": "../",
    "crossPromoTargetId": "flag-master",
    "crossPromoHeading": "Know your flags too?",
    "crossPromoBody": "Try Flag Master — same streaks, new challenge",
    "crossPromoIcon": "flag",
    "arcadeGradient": "radial-gradient(circle at 30% 30%, #ffb86b, #b3541e 70%)",
    "itemCount": 200,
    "itemNoun": "problems",
    "unitSingular": "problem",
    "unitPlural": "problems",
    "promptCounterLabel": "Problem",
    "practiceCfgLabel": "Problems",
    "initialTheme": "light",
    "levels": { "1": "Warming up", "2": "Getting tricky", "3": "Math nerd zone", "4": "Very hard" },
    "trackAnswerEvent": "math_answered",
    "ranks": [
      { "min": 60, "icon": "globe", "emoji": "🧮", "en": ["Math Legend", "Are you secretly a calculator?"] },
      { "min": 40, "icon": "crown", "emoji": "🏆", "en": ["Math Master", "Genuinely elite. Respect."] },
      { "min": 25, "icon": "medal", "emoji": "🥇", "en": ["Number Cruncher", "You chew through equations."] },
      { "min": 15, "icon": "medal", "emoji": "🥈", "en": ["Quick Thinker", "Solid mental math instincts."] },
      { "min": 8, "icon": "plane", "emoji": "🧠", "en": ["Warming Up", "Not bad — keep at it."] },
      { "min": 0, "icon": "compass", "emoji": "🔢", "en": ["Rusty", "Time to dust off the times tables."] }
    ]
  }
```

- [ ] **Step 4: Build and verify no errors**

Run: `node build.js`
Expected output includes all three lines (order may vary), with no thrown error:
```
Built .../index.html
Built .../capital-master/index.html
Built .../math-master/index.html
```

Note: because every built page embeds the *entire* `games.json` array (for the arcade "more games" menu), regenerating also legitimately changes `index.html` and `capital-master/index.html` — not just `math-master/index.html`. That's expected: it's what makes Math Master show up in their arcade menus too.

- [ ] **Step 5: Manual browser verification**

Start a static server over the repo root (e.g. `npx serve .` or any static file server) and open `math-master/index.html` in the browser tool. Verify:
- Start screen shows "Math Master", the tagline, and a light background with faint drifting digits/operators.
- Clicking "Start playing" shows an equation (e.g. "7 × 8 = ?") with 4 distinct numeric answer buttons in a 2×2 grid.
- Clicking the correct answer shows the green "correct" state; clicking wrong shows red + the "The answer was N" feedback text.
- Play through enough rounds to see tier 2, 3, and 4 equations (bigger numbers, multiplication, division) — confirm no two answer buttons ever show the same number.
- Open the arcade menu (grid icon) and confirm Flag Master and Capital Master both list correctly, and separately verify from Flag Master's own arcade menu that Math Master now appears there too.
- Toggle dark/light theme and confirm the background and answer buttons remain legible in both.

- [ ] **Step 6: Commit**

```bash
git add games.json games/math-master/game.css games/math-master/background.js index.html capital-master/index.html math-master/index.html
git commit -m "feat: enable Math Master with background, styling, and games.json entry"
```

## Testing

- `node leaderboard-apps-script.test.js` — backend sheet routing (Task 1).
- `node games/math-master/game.test.js` — equation generation and distractor logic (Task 2).
- `node build.js` — confirms `games.json` satisfies every required field and all three games build (Task 3).
- Manual browser walkthrough (Task 3, Step 5) — the only way to verify the actual player-facing experience, since none of the other games in this repo have browser-level automated tests either.
