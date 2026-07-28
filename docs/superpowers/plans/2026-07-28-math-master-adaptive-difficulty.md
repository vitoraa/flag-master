# Math Master Adaptive Difficulty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Math Master's fixed 100-problem tier-1-to-6 queue with an endless run whose difficulty adapts to the player, and add four new tiers of genuinely hard content.

**Architecture:** A new pure module `games/math-master/difficulty.js` owns tier movement (`nextDifficulty(state, outcome) -> state`). `games/math-master/game.js` gains generators for tiers 7–10 and generates problems on demand instead of pre-baking a pool. `shared/engine.js` gains four optional hooks — `GAME.nextItem`, `GAME.roundTime`, `GAME.onAnswer`, plus per-round timer budget — each falling back to today's behaviour so Flag Master and Capital Master are unaffected.

**Tech Stack:** Vanilla JavaScript, no framework, no bundler. Node's built-in `assert` for tests, run directly with `node`. `build.js` concatenates per-game files into a single `index.html`.

## Global Constraints

- **No new dependencies.** No npm packages, no `package.json`. Tests are plain `node file.test.js` scripts using `require("assert")`.
- **Dual-environment modules.** Every game file must work both concatenated into the browser bundle (no `module`, no `require`) and under Node for tests. Use the existing guards: `if (typeof GAME !== "undefined") { ... }` for browser wiring and `if (typeof module !== "undefined") { module.exports = {...}; }` for test exports. Never `require` between game files at top level.
- **Flag Master and Capital Master must not change behaviour.** They define none of the new hooks. Every engine change must be gated on the hook existing.
- **Item shape is `[id, exprText, tier, answer, meta]`.** Do not change the arity or the index of any field — `shared/engine.js` reads `[0]`, `[2]`, and games read `[1]`/`[3]`/`[4]`.
- **All answers must be positive integers.** `pickMathDistractors` rejects non-positive values, and the existing test asserts `Number.isInteger(answer) && answer >= 0`.
- **Tiers are 1–10.** `MAX_LIVES` is 3 and `ROUND_TIME`'s default stays 10 for other games.
- **Rebuild after every change to `games/`, `shared/`, or `games.json`:** `node build.js`. The generated `index.html` files are committed.
- **Commit after every task.** Message prefix `feat:`, `test:`, `refactor:`, or `build:` matching the existing log style.

---

## File Structure

| File | Responsibility |
|---|---|
| `games/math-master/difficulty.js` | **New.** Pure adaptive tier controller. No DOM, no randomness, no globals. |
| `games/math-master/difficulty.test.js` | **New.** Unit tests for the controller. |
| `games/math-master/game.js` | Problem generation (all 10 tiers), display text, distractors, `GAME.*` wiring. |
| `games/math-master/game.test.js` | Extended: generator invariants and distractor rules for the new tiers. |
| `shared/engine.js` | Four optional hooks + endless end-condition + per-round timer budget. |
| `games.json` | Tier 7–10 level names, `itemCountLabel`. |
| `build.js` | Optional `difficulty.js` in the concat; `itemCountLabel` in the allowlist and the `TOTAL_ALL_DIFFICULTY` fallback. |
| `math-master/index.html` | Generated output — never edited by hand. |

---

### Task 1: Adaptive difficulty controller

Pure state machine, no dependencies on anything else in the codebase. Built first so later tasks can rely on its exact signature.

**Files:**
- Create: `games/math-master/difficulty.js`
- Test: `games/math-master/difficulty.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `initialDifficulty(startTier = 2) -> state`
  - `nextDifficulty(state, outcome) -> state` where
    `state = { tier, highTier, consecutiveCorrect, consecutiveFast, consecutiveWrong }`
    and `outcome = { correct: boolean, timeRatio: number }`
  - `MIN_TIER = 1`, `MAX_TIER = 10`, `FAST_RATIO = 0.30`

- [ ] **Step 1: Write the failing test**

Create `games/math-master/difficulty.test.js`:

```js
const assert = require("assert");
const { initialDifficulty, nextDifficulty, MIN_TIER, MAX_TIER } = require("./difficulty.js");

const SLOW = 0.9, FAST = 0.1;
const ok = (r) => ({ correct: true, timeRatio: r });
const miss = { correct: false, timeRatio: 1 };

// Starts at tier 2 by default.
assert.strictEqual(initialDifficulty().tier, 2);
assert.strictEqual(initialDifficulty(5).tier, 5);

// Two ordinary correct answers promote by exactly 1.
let s = initialDifficulty();
s = nextDifficulty(s, ok(SLOW));
assert.strictEqual(s.tier, 2, "one correct answer must not promote");
s = nextDifficulty(s, ok(SLOW));
assert.strictEqual(s.tier, 3, "two correct answers promote by 1");

// Two fast correct answers promote by 2.
s = initialDifficulty();
s = nextDifficulty(s, ok(FAST));
s = nextDifficulty(s, ok(FAST));
assert.strictEqual(s.tier, 4, "two fast correct answers promote by 2");

// Counters reset after a promotion, so promotion is not repeated immediately.
s = nextDifficulty(s, ok(FAST));
assert.strictEqual(s.tier, 4, "promotion resets the counters");

// A slow answer breaks the fast streak but still counts as correct.
s = initialDifficulty();
s = nextDifficulty(s, ok(FAST));
s = nextDifficulty(s, ok(SLOW));
assert.strictEqual(s.tier, 3, "fast-then-slow promotes by 1, not 2");

// A single miss does not demote.
s = initialDifficulty(6);
s = nextDifficulty(s, miss);
assert.strictEqual(s.tier, 6, "a single miss must not demote");

// Two consecutive misses demote by 1.
s = nextDifficulty(s, miss);
assert.strictEqual(s.tier, 5, "two consecutive misses demote by 1");

// A correct answer between misses resets the wrong counter.
s = initialDifficulty(6);
s = nextDifficulty(s, miss);
s = nextDifficulty(s, ok(SLOW));
s = nextDifficulty(s, miss);
assert.strictEqual(s.tier, 6, "a correct answer resets the miss counter");

// Ratchet floor: never more than 2 tiers below the highest tier reached.
s = initialDifficulty(8);
assert.strictEqual(s.highTier, 8);
for (let i = 0; i < 20; i++) s = nextDifficulty(s, miss);
assert.strictEqual(s.tier, 6, "ratchet floor holds tier at highTier - 2");

// highTier tracks the maximum ever reached, not the current tier.
s = initialDifficulty(2);
for (let i = 0; i < 10; i++) s = nextDifficulty(s, ok(FAST));
const peak = s.highTier;
assert.strictEqual(peak, MAX_TIER);
for (let i = 0; i < 10; i++) s = nextDifficulty(s, miss);
assert.strictEqual(s.highTier, MAX_TIER, "highTier never decreases");

// Clamps at both ends.
s = initialDifficulty(1);
for (let i = 0; i < 10; i++) s = nextDifficulty(s, miss);
assert.strictEqual(s.tier, MIN_TIER, "tier clamps at MIN_TIER");
s = initialDifficulty(2);
for (let i = 0; i < 40; i++) s = nextDifficulty(s, ok(FAST));
assert.strictEqual(s.tier, MAX_TIER, "tier clamps at MAX_TIER");

// A perfect fast player reaches the top tier within 10 rounds.
s = initialDifficulty();
let rounds = 0;
while (s.tier < MAX_TIER && rounds < 100) { s = nextDifficulty(s, ok(FAST)); rounds++; }
assert.ok(rounds <= 10, `fast player should reach tier ${MAX_TIER} within 10 rounds, took ${rounds}`);

// Purity: the input state is never mutated.
const before = initialDifficulty(4);
const snapshot = JSON.stringify(before);
nextDifficulty(before, ok(FAST));
assert.strictEqual(JSON.stringify(before), snapshot, "nextDifficulty must not mutate its input");

console.log("All math-master difficulty tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node games/math-master/difficulty.test.js`
Expected: FAIL with `Cannot find module './difficulty.js'`

- [ ] **Step 3: Write minimal implementation**

Create `games/math-master/difficulty.js`:

```js
// Adaptive tier controller for Math Master. Pure: no DOM, no randomness, no
// globals — every decision is a function of the previous state and the last
// round's outcome, which is what makes it directly unit-testable.

const MIN_TIER = 1;
const MAX_TIER = 10;
// An answer counts as "fast" when it lands inside the first 30% of the
// round's time budget. Two of those in a row promote by two tiers, so a
// genuinely quick player reaches the top of the ladder in ~8 rounds rather
// than grinding through arithmetic they can already do.
const FAST_RATIO = 0.30;
// Demotion can never drop a player more than this far below the highest tier
// they have reached. Without it, a couple of unlucky rounds would slide a
// strong player back into trivial questions — the exact problem this
// controller exists to solve.
const RATCHET_SLACK = 2;

function initialDifficulty(startTier = 2) {
  return {
    tier: startTier,
    highTier: startTier,
    consecutiveCorrect: 0,
    consecutiveFast: 0,
    consecutiveWrong: 0,
  };
}

function clampTier(tier, highTier) {
  const floor = Math.max(MIN_TIER, highTier - RATCHET_SLACK);
  return Math.min(MAX_TIER, Math.max(floor, tier));
}

function nextDifficulty(state, outcome) {
  let { tier, highTier, consecutiveCorrect, consecutiveFast, consecutiveWrong } = state;

  if (outcome.correct) {
    consecutiveWrong = 0;
    consecutiveCorrect++;
    consecutiveFast = outcome.timeRatio < FAST_RATIO ? consecutiveFast + 1 : 0;
    if (consecutiveFast >= 2) {
      tier += 2;
      consecutiveCorrect = 0;
      consecutiveFast = 0;
    } else if (consecutiveCorrect >= 2) {
      tier += 1;
      consecutiveCorrect = 0;
      consecutiveFast = 0;
    }
  } else {
    consecutiveCorrect = 0;
    consecutiveFast = 0;
    consecutiveWrong++;
    if (consecutiveWrong >= 2) {
      tier -= 1;
      consecutiveWrong = 0;
    }
  }

  highTier = Math.max(highTier, Math.min(MAX_TIER, tier));
  return {
    tier: clampTier(tier, highTier),
    highTier,
    consecutiveCorrect,
    consecutiveFast,
    consecutiveWrong,
  };
}

// Exposed for difficulty.test.js only. The browser build never sets `module`.
if (typeof module !== "undefined") {
  module.exports = { initialDifficulty, nextDifficulty, MIN_TIER, MAX_TIER, FAST_RATIO };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node games/math-master/difficulty.test.js`
Expected: `All math-master difficulty tests passed`

- [ ] **Step 5: Commit**

```bash
git add games/math-master/difficulty.js games/math-master/difficulty.test.js
git commit -m "feat(math-master): add pure adaptive difficulty controller"
```

---

### Task 2: Tag existing tiers with `kind: "binary"`

Additive and behaviour-preserving. Done as its own task so the discriminant is in place before any new kind exists.

**Files:**
- Modify: `games/math-master/game.js:10-44` (`addSub`, `mul`, `div`, `equationSignature`)
- Test: `games/math-master/game.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: every tier 1–6 `meta` is now `{ kind: "binary", op, a, b }`. `equationSignature(meta)` branches on `meta.kind` and treats a missing/`"binary"` kind identically to today.

- [ ] **Step 1: Write the failing test**

Append to `games/math-master/game.test.js`, immediately before the final `console.log`:

```js
// Every tier 1-6 item carries the binary discriminant.
generateItems().forEach(([, expr, , , meta]) => {
  assert.strictEqual(meta.kind, "binary", `${expr} should be tagged kind "binary"`);
});

// Signature still folds commutativity for + and x, and still does not for - and /.
assert.strictEqual(
  equationSignature({ kind: "binary", op: "×", a: 4, b: 10 }),
  equationSignature({ kind: "binary", op: "×", a: 10, b: 4 }),
  "multiplication signature must ignore operand order"
);
assert.notStrictEqual(
  equationSignature({ kind: "binary", op: "÷", a: 12, b: 4 }),
  equationSignature({ kind: "binary", op: "÷", a: 4, b: 12 }),
  "division signature must respect operand order"
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node games/math-master/game.test.js`
Expected: FAIL with `... should be tagged kind "binary"` (actual `undefined`)

- [ ] **Step 3: Write minimal implementation**

In `games/math-master/game.js`, add `kind: "binary"` to all four meta literals in `addSub`, `mul`, and `div`:

```js
function addSub(min, max, tier, nextId) {
  const a = randInt(min, max), b = randInt(min, max);
  const id = `m${nextId()}`;
  if (Math.random() < 0.5) {
    return [id, `${a} + ${b}`, tier, a + b, { kind: "binary", op: "+", a, b }];
  }
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return [id, `${hi} − ${lo}`, tier, hi - lo, { kind: "binary", op: "−", a: hi, b: lo }];
}

function mul(aMin, aMax, bMin, bMax, tier, nextId) {
  const a = randInt(aMin, aMax), b = randInt(bMin, bMax);
  const id = `m${nextId()}`;
  return [id, `${a} × ${b}`, tier, a * b, { kind: "binary", op: "×", a, b }];
}

function div(divMin, divMax, quotMin, quotMax, tier, nextId) {
  const divisor = randInt(divMin, divMax);
  const quotient = randInt(quotMin, quotMax);
  const dividend = divisor * quotient;
  const id = `m${nextId()}`;
  return [id, `${dividend} ÷ ${divisor}`, tier, quotient, { kind: "binary", op: "÷", a: dividend, b: divisor }];
}
```

Replace `equationSignature` (currently at `game.js:37-44`) with a version that dispatches on kind. The new branches are placeholders that later tasks fill in — but they must exist now so the dispatch shape is settled:

```js
// Two equations count as "the same question" if they're the same operator
// on the same operands — for +/x, operand order doesn't matter (4x10 is
// the same question as 10x4). Non-binary kinds have no commutativity to
// fold, so they serialise every field that distinguishes them.
function equationSignature(meta) {
  if (meta.kind === "missing") {
    const tail = meta.tail ? `:${meta.tail.op}:${meta.tail.c}` : "";
    return `?${meta.slot}:${meta.op}:${meta.a}:${meta.b}${tail}`;
  }
  if (meta.kind === "twostep") {
    return `2s:${meta.shape}:${meta.outerOp}:${meta.innerOp}:${meta.a}:${meta.b}:${meta.c}:${meta.d ?? ""}`;
  }
  const { op, a, b } = meta;
  if (op === "+" || op === "×") {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return `${op}:${lo}:${hi}`;
  }
  return `${op}:${a}:${b}`;
}
```

- [ ] **Step 4: Run tests and rebuild**

Run: `node games/math-master/game.test.js`
Expected: `All math-master game tests passed`

Run: `node build.js`
Expected: three `Built ...` lines, no error.

- [ ] **Step 5: Commit**

```bash
git add games/math-master/game.js games/math-master/game.test.js math-master/index.html
git commit -m "refactor(math-master): tag binary items with a meta kind discriminant"
```

---

### Task 3: Tier 7 — missing operand

**Files:**
- Modify: `games/math-master/game.js` (add `missingOperand` after `div`)
- Test: `games/math-master/game.test.js`

**Interfaces:**
- Consumes: `randInt(min, max)`, `applyOp(op, a, b)`, `equationSignature(meta)` from Task 2.
- Produces:
  - `missingOperand(tier, nextId, tail = null) -> item`
  - meta shape `{ kind: "missing", op, a, b, slot, tail }` where `slot` is `"a"` or `"b"` (which operand was hidden), `a`/`b` are the *true* operands, and `tail` is `null` for tier 7. `answer` is the hidden operand's value.
  - `applyOp` must be declared **above** `missingOperand` in the file (move it up from its current position at `game.js:85` if necessary — hoisting makes this work either way, but keep the reading order sane).

**Note on display text:** `missing` items already contain `= <result>` in their expression string, so `GAME.renderPrompt` must not append `" = ?"` to them. That change lands in Task 6.

- [ ] **Step 1: Write the failing test**

Append to `games/math-master/game.test.js`, before the final `console.log`:

```js
// --- Tier 7: missing operand ---
{
  const nextId = (() => { let n = 0; return () => n++; })();
  for (let i = 0; i < 2000; i++) {
    const [id, expr, tier, answer, meta] = missingOperand(7, nextId);
    assert.strictEqual(tier, 7);
    assert.strictEqual(meta.kind, "missing");
    assert.strictEqual(meta.tail, null, "tier 7 items have no tail");
    assert.ok(["a", "b"].includes(meta.slot), `slot must be "a" or "b", got ${meta.slot}`);
    assert.ok(Number.isInteger(answer) && answer > 0, `${expr} must have a positive integer answer, got ${answer}`);

    // The answer is the hidden operand.
    assert.strictEqual(answer, meta.slot === "a" ? meta.a : meta.b, `${expr}: answer must be the hidden operand`);

    // Substituting the answer back into the expression makes it true.
    const result = applyOp(meta.op, meta.a, meta.b);
    assert.ok(Number.isInteger(result) && result > 0, `${expr}: stated result must be a positive integer, got ${result}`);
    assert.ok(expr.endsWith(`= ${result}`), `${expr} must state the result ${result}`);
    assert.ok(expr.includes("?"), `${expr} must contain a "?" placeholder`);

    // The visible operand appears in the text; the hidden one does not stand in for "?".
    const visible = meta.slot === "a" ? meta.b : meta.a;
    assert.ok(expr.includes(String(visible)), `${expr} must show the visible operand ${visible}`);
  }
}
```

Add `missingOperand` to the destructured `require` on line 2 of `game.test.js`:

```js
const { generateItems, pickMathDistractors, applyOp, equationSignature, missingOperand } = require("./game.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node games/math-master/game.test.js`
Expected: FAIL with `TypeError: missingOperand is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `games/math-master/game.js`, after `div`:

```js
// Tier 7+: one operand is replaced by "?" and the result is given, so the
// player has to invert the operation rather than evaluate it. `tail`, when
// present, appends a second term (tier 10) — see twoStepMissing.
function missingOperand(tier, nextId, tail = null) {
  const op = ["+", "−", "×", "÷"][randInt(0, 3)];
  let a, b;
  if (op === "×") { a = randInt(2, 12); b = randInt(2, 12); }
  else if (op === "÷") { b = randInt(2, 12); a = b * randInt(2, 12); }
  else if (op === "+") { a = randInt(10, 60); b = randInt(10, 60); }
  // Subtraction: pick the subtrahend strictly below the minuend so the
  // stated result is always positive.
  else { a = randInt(30, 99); b = randInt(2, a - 1); }

  const slot = Math.random() < 0.5 ? "a" : "b";
  const answer = slot === "a" ? a : b;
  const inner = applyOp(op, a, b);
  const left = slot === "a" ? `? ${op} ${b}` : `${a} ${op} ?`;
  const total = tail ? applyOp(tail.op, inner, tail.c) : inner;
  const text = tail ? `${left} ${tail.op} ${tail.c} = ${total}` : `${left} = ${total}`;
  return [`m${nextId()}`, text, tier, answer, { kind: "missing", op, a, b, slot, tail }];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node games/math-master/game.test.js`
Expected: `All math-master game tests passed`

- [ ] **Step 5: Commit**

```bash
git add games/math-master/game.js games/math-master/game.test.js
git commit -m "feat(math-master): add tier 7 missing-operand generator"
```

---

### Task 4: Tiers 8, 9, 10 — two-step expressions

**Files:**
- Modify: `games/math-master/game.js` (add `evalTwoStep`, `evalLeftToRight`, `twoStepPlain`, `twoStepTrap`, `twoStepDouble`, `twoStepMissing`)
- Test: `games/math-master/game.test.js`

**Interfaces:**
- Consumes: `randInt`, `applyOp`, `missingOperand` from Task 3.
- Produces:
  - `twoStepPlain(tier, nextId) -> item` (tier 8) — meta `shape: "left"`
  - `twoStepTrap(tier, nextId) -> item` (tier 9) — meta `shape: "right"`
  - `twoStepDouble(tier, nextId) -> item` (tier 10) — meta `shape: "both"`
  - `twoStepMissing(tier, nextId) -> item` (tier 10) — delegates to `missingOperand` with a `tail`
  - `evalTwoStep(meta) -> number` — the mathematically correct value
  - `evalLeftToRight(meta) -> number` — the value a player gets by ignoring precedence
  - meta shape `{ kind: "twostep", shape, outerOp, innerOp, a, b, c, d? }` where:
    - `shape: "left"` → value is `(a innerOp b) outerOp c`
    - `shape: "right"` → value is `a outerOp (b innerOp c)`
    - `shape: "both"` → value is `(a × b) outerOp (c × d)`, `innerOp` is `"×"`

- [ ] **Step 1: Write the failing test**

Append to `games/math-master/game.test.js`, before the final `console.log`:

```js
// --- Tiers 8-10: two-step expressions ---
{
  const nextId = (() => { let n = 0; return () => n++; })();

  // Tier 8: correct evaluation equals plain left-to-right — no trap.
  for (let i = 0; i < 2000; i++) {
    const [, expr, tier, answer, meta] = twoStepPlain(8, nextId);
    assert.strictEqual(tier, 8);
    assert.strictEqual(meta.kind, "twostep");
    assert.strictEqual(meta.shape, "left");
    assert.ok(Number.isInteger(answer) && answer > 0, `${expr} must have a positive integer answer, got ${answer}`);
    assert.strictEqual(answer, evalTwoStep(meta), `${expr}: answer must match evalTwoStep`);
    assert.strictEqual(evalLeftToRight(meta), answer, `${expr}: tier 8 must have no precedence trap`);
  }

  // Tier 9: the left-to-right value must ALWAYS differ from the correct value.
  // That difference is the entire point of the tier.
  for (let i = 0; i < 2000; i++) {
    const [, expr, tier, answer, meta] = twoStepTrap(9, nextId);
    assert.strictEqual(tier, 9);
    assert.strictEqual(meta.shape, "right");
    assert.strictEqual(meta.innerOp, "×", "the trap comes from x binding tighter");
    assert.ok(Number.isInteger(answer) && answer > 0, `${expr} must have a positive integer answer, got ${answer}`);
    assert.strictEqual(answer, evalTwoStep(meta), `${expr}: answer must match evalTwoStep`);
    const trap = evalLeftToRight(meta);
    assert.notStrictEqual(trap, answer, `${expr}: tier 9 must have a distinct left-to-right trap value`);
    assert.ok(trap > 0, `${expr}: trap value must be positive to be usable as a distractor, got ${trap}`);
  }

  // Tier 10a: three-term, two products.
  for (let i = 0; i < 2000; i++) {
    const [, expr, tier, answer, meta] = twoStepDouble(10, nextId);
    assert.strictEqual(tier, 10);
    assert.strictEqual(meta.shape, "both");
    assert.ok(Number.isInteger(meta.d) && meta.d > 0, `${expr} must define a fourth operand`);
    assert.ok(Number.isInteger(answer) && answer > 0, `${expr} must have a positive integer answer, got ${answer}`);
    assert.strictEqual(answer, evalTwoStep(meta), `${expr}: answer must match evalTwoStep`);
  }

  // Tier 10b: missing operand inside a two-step expression.
  for (let i = 0; i < 2000; i++) {
    const [, expr, tier, answer, meta] = twoStepMissing(10, nextId);
    assert.strictEqual(tier, 10);
    assert.strictEqual(meta.kind, "missing");
    assert.ok(meta.tail && ["+", "−"].includes(meta.tail.op), `${expr} must carry a +/- tail`);
    assert.ok(Number.isInteger(answer) && answer > 0, `${expr} must have a positive integer answer, got ${answer}`);
    assert.strictEqual(answer, meta.slot === "a" ? meta.a : meta.b);
    const total = applyOp(meta.tail.op, applyOp(meta.op, meta.a, meta.b), meta.tail.c);
    assert.ok(total > 0, `${expr}: stated total must be positive, got ${total}`);
    assert.ok(expr.endsWith(`= ${total}`), `${expr} must state the total ${total}`);
  }

  // Signatures distinguish the shapes rather than colliding.
  const sigs = new Set();
  for (let i = 0; i < 200; i++) {
    sigs.add(equationSignature(twoStepPlain(8, nextId)[4]));
    sigs.add(equationSignature(twoStepTrap(9, nextId)[4]));
    sigs.add(equationSignature(twoStepDouble(10, nextId)[4]));
  }
  assert.ok(sigs.size > 100, `two-step signatures must be varied, got ${sigs.size} distinct`);
}
```

Update the `require` on line 2 of `game.test.js`:

```js
const {
  generateItems, pickMathDistractors, applyOp, equationSignature,
  missingOperand, twoStepPlain, twoStepTrap, twoStepDouble, twoStepMissing,
  evalTwoStep, evalLeftToRight,
} = require("./game.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node games/math-master/game.test.js`
Expected: FAIL with `TypeError: twoStepPlain is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `games/math-master/game.js`, after `missingOperand`:

```js
// A two-step expression's correct value, honouring operator precedence.
// `shape` says where the tightly-binding operation sits:
//   "left"  -> (a innerOp b) outerOp c        e.g. (12 − 5) × 8, 60 ÷ 4 + 9
//   "right" -> a outerOp (b innerOp c)        e.g. 7 + 6 × 4
//   "both"  -> (a × b) outerOp (c × d)        e.g. 9 × 7 − 4 × 8
function evalTwoStep(meta) {
  const { shape, outerOp, innerOp, a, b, c, d } = meta;
  if (shape === "left") return applyOp(outerOp, applyOp(innerOp, a, b), c);
  if (shape === "right") return applyOp(outerOp, a, applyOp(innerOp, b, c));
  return applyOp(outerOp, applyOp("×", a, b), applyOp("×", c, d));
}

// What a player gets by evaluating strictly left to right and ignoring
// precedence. For "left"-shaped expressions this equals the correct value
// (tier 8 is deliberately trap-free); for the others it is the mistake the
// tier is designed to punish, and is forced into the option set.
function evalLeftToRight(meta) {
  const { shape, outerOp, innerOp, a, b, c, d } = meta;
  if (shape === "left") return applyOp(outerOp, applyOp(innerOp, a, b), c);
  if (shape === "right") return applyOp(innerOp, applyOp(outerOp, a, b), c);
  return applyOp("×", applyOp(outerOp, applyOp("×", a, b), c), d);
}

// Tier 8: two steps, but written so left-to-right reading is already correct —
// either the first step is parenthesised, or it is a division written first.
function twoStepPlain(tier, nextId) {
  const id = `m${nextId()}`;
  if (Math.random() < 0.5) {
    const innerOp = Math.random() < 0.5 ? "+" : "−";
    const b = randInt(2, 9);
    // For subtraction keep a strictly above b so the inner value stays positive.
    const a = innerOp === "−" ? randInt(b + 2, 20) : randInt(2, 20);
    const c = randInt(2, 9);
    const meta = { kind: "twostep", shape: "left", outerOp: "×", innerOp, a, b, c };
    return [id, `(${a} ${innerOp} ${b}) × ${c}`, tier, evalTwoStep(meta), meta];
  }
  const b = randInt(2, 9);
  const quotient = randInt(4, 12);
  const a = b * quotient;
  const outerOp = Math.random() < 0.5 ? "+" : "−";
  // Keep the final value positive: subtract strictly less than the quotient.
  const c = outerOp === "−" ? randInt(1, quotient - 1) : randInt(2, 20);
  const meta = { kind: "twostep", shape: "left", outerOp, innerOp: "÷", a, b, c };
  return [id, `${a} ÷ ${b} ${outerOp} ${c}`, tier, evalTwoStep(meta), meta];
}

// Tier 9: a ± b × c. Multiplication binds tighter than the leading ±, so
// reading left to right gives (a ± b) × c — always a different number, since
// the two agree only when c === 1 and c is never 1 here.
function twoStepTrap(tier, nextId) {
  const id = `m${nextId()}`;
  const b = randInt(2, 9), c = randInt(2, 9);
  const product = b * c;
  const outerOp = Math.random() < 0.5 ? "+" : "−";
  // For subtraction keep a above the product (correct value positive) and
  // above b (so the left-to-right trap value is positive too, making it a
  // usable distractor).
  const a = outerOp === "−" ? randInt(product + 1, product + 40) : randInt(2, 40);
  const meta = { kind: "twostep", shape: "right", outerOp, innerOp: "×", a, b, c };
  return [id, `${a} ${outerOp} ${b} × ${c}`, tier, evalTwoStep(meta), meta];
}

// Tier 10: a × b ± c × d — two products to hold in your head at once.
function twoStepDouble(tier, nextId) {
  const id = `m${nextId()}`;
  const outerOp = Math.random() < 0.5 ? "+" : "−";
  let a = randInt(3, 12), b = randInt(3, 12), c = randInt(2, 9), d = randInt(2, 9);
  if (outerOp === "−" && a * b <= c * d) {
    // Swap the pairs so the left product is the larger one; the result stays
    // positive without rejecting and regenerating.
    [a, b, c, d] = [c, d, a, b];
  }
  if (outerOp === "−" && a * b === c * d) d = Math.max(2, d - 1);
  const meta = { kind: "twostep", shape: "both", outerOp, innerOp: "×", a, b, c, d };
  return [id, `${a} × ${b} ${outerOp} ${c} × ${d}`, tier, evalTwoStep(meta), meta];
}

// Tier 10: a missing operand buried in a two-step expression, e.g. 3 × ? + 7 = 31.
function twoStepMissing(tier, nextId) {
  const op = Math.random() < 0.5 ? "+" : "−";
  return missingOperand(tier, nextId, { op, c: randInt(2, 20) });
}
```

`twoStepMissing` delegates to `missingOperand`, whose inner operation may be any of the four. With a `"−"` tail the stated total could go non-positive, so constrain the tail inside `missingOperand`. Replace its `total`/`text` lines with:

```js
  const inner = applyOp(op, a, b);
  // A subtracting tail must not drive the stated total to zero or below —
  // a non-positive total reads as broken and breaks the distractor rules.
  const tailC = tail && tail.op === "−" ? Math.min(tail.c, inner - 1) : (tail ? tail.c : 0);
  const usedTail = tail ? { op: tail.op, c: Math.max(1, tailC) } : null;
  const total = usedTail ? applyOp(usedTail.op, inner, usedTail.c) : inner;
  const left = slot === "a" ? `? ${op} ${b}` : `${a} ${op} ?`;
  const text = usedTail ? `${left} ${usedTail.op} ${usedTail.c} = ${total}` : `${left} = ${total}`;
  return [`m${nextId()}`, text, tier, answer, { kind: "missing", op, a, b, slot, tail: usedTail }];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node games/math-master/game.test.js`
Expected: `All math-master game tests passed`

- [ ] **Step 5: Commit**

```bash
git add games/math-master/game.js games/math-master/game.test.js
git commit -m "feat(math-master): add tier 8-10 two-step and three-term generators"
```

---

### Task 5: Distractors for the new kinds

**Files:**
- Modify: `games/math-master/game.js:131-164` (`pickMathDistractors`)
- Test: `games/math-master/game.test.js`

**Interfaces:**
- Consumes: `evalLeftToRight`, `applyOp`, `sameLastDigitVariants`, `smallOffsetVariants`, `shuffleArr` from earlier tasks.
- Produces: `pickMathDistractors(answer)` returns exactly 3 objects of shape `{ 3: number }`, unchanged signature. New behaviour:
  - `kind: "twostep"` with `shape !== "left"` → the `evalLeftToRight` value is **always** present when it is positive and differs from the correct answer.
  - `kind: "missing"` → the "applied instead of inverted" value is always present when positive and distinct.

- [ ] **Step 1: Write the failing test**

Append to `games/math-master/game.test.js`, before the final `console.log`:

```js
// --- Distractors for the new kinds ---
{
  const nextId = (() => { let n = 0; return () => n++; })();
  const check = (item) => {
    const distractors = pickMathDistractors(item);
    const values = distractors.map(d => d[3]);
    assert.strictEqual(values.length, 3, `${item[1]}: must produce exactly 3 distractors`);
    assert.strictEqual(new Set(values).size, 3, `${item[1]}: distractors must be unique`);
    values.forEach(v => {
      assert.ok(Number.isInteger(v) && v > 0, `${item[1]}: distractor ${v} must be a positive integer`);
      assert.notStrictEqual(v, item[3], `${item[1]}: distractor must not equal the answer`);
    });
    return values;
  };

  // Tier 9's whole point: the left-to-right trap is always on offer.
  for (let i = 0; i < 1000; i++) {
    const item = twoStepTrap(9, nextId);
    const values = check(item);
    const trap = evalLeftToRight(item[4]);
    assert.ok(values.includes(trap), `${item[1]}: trap value ${trap} must be among distractors ${values}`);
  }

  // Missing-operand items offer the "applied instead of inverted" mistake.
  for (let i = 0; i < 1000; i++) {
    const item = missingOperand(7, nextId);
    const values = check(item);
    const meta = item[4];
    const visible = meta.slot === "a" ? meta.b : meta.a;
    const stated = applyOp(meta.op, meta.a, meta.b);
    const applied = applyOp(meta.op, stated, visible);
    if (Number.isInteger(applied) && applied > 0 && applied !== item[3]) {
      assert.ok(values.includes(applied), `${item[1]}: applied-instead-of-inverted value ${applied} must be offered, got ${values}`);
    }
  }

  // The other new tiers just have to satisfy the universal rules.
  for (let i = 0; i < 1000; i++) {
    check(twoStepPlain(8, nextId));
    check(twoStepDouble(10, nextId));
    check(twoStepMissing(10, nextId));
  }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node games/math-master/game.test.js`
Expected: FAIL with `... trap value N must be among distractors [...]`

- [ ] **Step 3: Write minimal implementation**

Replace `pickMathDistractors` in `games/math-master/game.js` with:

```js
// The specific mistake each kind is designed to punish. These are forced into
// the option set (subject to the usual positive-and-distinct rules) so the
// wrong answer a rushing player computes is always sitting right there.
function forcedMistakes(item) {
  const meta = item[4], correct = item[3];
  if (meta.kind === "twostep" && meta.shape !== "left") {
    return [evalLeftToRight(meta)];
  }
  if (meta.kind === "missing") {
    const visible = meta.slot === "a" ? meta.b : meta.a;
    const stated = applyOp(meta.op, meta.a, meta.b);
    // Applying the operation to the stated result instead of inverting it.
    const applied = applyOp(meta.op, stated, visible);
    // Inverting with the wrong operand order, e.g. reading "? ÷ 6 = 9" as 6 ÷ 9.
    const swapped = applyOp(meta.op, visible, stated);
    return [applied, swapped, correct + 1, correct - 1];
  }
  return [];
}

// Custom pickDistractors: unlike flags/capitals (where any other pool item
// is a plausible wrong answer), a random other equation's answer could be
// wildly off or collide with the correct value. Instead this simulates
// specific mistakes: the kind's signature trap, off-by-one-operand, wrong
// operator, small offset.
function pickMathDistractors(answer) {
  const tier = answer[2], correct = answer[3], meta = answer[4];
  const used = new Set([correct]);
  const picks = [];

  const accept = (raw) => {
    const n = Math.round(raw);
    if (!Number.isFinite(n) || n <= 0 || used.has(n)) return false;
    used.add(n);
    picks.push(n);
    return true;
  };

  for (const m of forcedMistakes(answer)) {
    if (picks.length >= 2) break;
    accept(m);
  }

  // Guarantee at least one same-last-digit distractor from tier 3 up —
  // tiers 1-2's answers are small enough that this isn't worth forcing.
  if (tier >= 3 && !picks.some(p => p % 10 === correct % 10)) {
    for (const c of sameLastDigitVariants(correct)) {
      if (accept(c)) break;
    }
  }

  const candidates = meta.kind === "binary"
    ? [
        ...offByOperandVariants(meta.op, meta.a, meta.b),
        ...operationSlipVariants(meta.op, meta.a, meta.b),
        ...smallOffsetVariants(tier, correct),
      ]
    : smallOffsetVariants(tier, correct);

  for (const c of shuffleArr(candidates)) {
    if (picks.length >= 3) break;
    accept(c);
  }

  let step = 1, attempt = 0;
  while (picks.length < 3) {
    const n = correct + step * (attempt % 2 === 0 ? 1 : -1);
    step++;
    attempt++;
    accept(n);
  }
  return picks.slice(0, 3).map(n => ({ 3: n }));
}
```

Note the `picks.length >= 2` cap on forced mistakes: it leaves at least one slot for the same-last-digit guarantee, which the existing tier-3+ test still enforces for every tier.

- [ ] **Step 4: Run test to verify it passes**

Run: `node games/math-master/game.test.js`
Expected: `All math-master game tests passed`

- [ ] **Step 5: Commit**

```bash
git add games/math-master/game.js games/math-master/game.test.js
git commit -m "feat(math-master): add trap distractors for two-step and missing-operand tiers"
```

---

### Task 6: On-demand generation and `GAME.*` wiring

Replaces the fixed 100-item pool with per-tier generation driven by the Task 1 controller. `GAME.items` becomes `[]` — `shared/engine.js:35` reads it at load time, so it must still be an array.

**Files:**
- Modify: `games/math-master/game.js` (replace `generateItems`, rewrite the `GAME` block)
- Modify: `games/math-master/game.test.js` (replace the pool-shape assertions)

**Interfaces:**
- Consumes: `initialDifficulty`/`nextDifficulty` from Task 1, all generators from Tasks 3–4.
- Produces:
  - `makeItem(tier, nextId) -> item` — dispatches to the right generator for tiers 1–10.
  - `GAME.nextItem(ctx) -> item`, `GAME.roundTime(item) -> seconds`, `GAME.onAnswer(item, outcome)`.
  - `TIER_TIME` — object keyed by tier number, values in seconds.
  - In Node, `difficulty.js` is `require`d at the top of `game.js` **behind a `typeof module` guard**, because the browser build has both files concatenated into one scope.

- [ ] **Step 1: Write the failing test**

In `games/math-master/game.test.js`, delete lines 4–10 (the `generateItems()` pool-size and per-tier-count assertions) and the `EXPECTED_PER_TIER` constant, and delete the duplicate-signature loop at lines 12–22. Replace them with:

```js
// Every tier produces valid items, and repeated draws at one tier stay varied.
for (let tier = 1; tier <= 10; tier++) {
  const nextId = (() => { let n = 0; return () => n++; })();
  const sigs = new Set();
  for (let i = 0; i < 500; i++) {
    const [id, expr, itemTier, answer, meta] = makeItem(tier, nextId);
    assert.strictEqual(itemTier, tier, `makeItem(${tier}) must stamp tier ${tier}`);
    assert.ok(typeof id === "string" && id.length > 0, `tier ${tier} item needs an id`);
    assert.ok(typeof expr === "string" && expr.length > 0, `tier ${tier} item needs display text`);
    assert.ok(Number.isInteger(answer) && answer > 0, `tier ${tier}: ${expr} must have a positive integer answer, got ${answer}`);
    assert.ok(["binary", "missing", "twostep"].includes(meta.kind), `tier ${tier}: unknown kind ${meta.kind}`);
    sigs.add(equationSignature(meta));
  }
  assert.ok(sigs.size > 20, `tier ${tier} must generate varied questions, got ${sigs.size} distinct in 500 draws`);
}

// Round time rises with tier and is always a usable number of seconds.
let previous = 0;
for (let tier = 1; tier <= 10; tier++) {
  const t = TIER_TIME[tier];
  assert.ok(Number.isFinite(t) && t >= 5 && t <= 20, `tier ${tier} time ${t} out of range`);
  assert.ok(t >= previous, `tier ${tier} time ${t} must not be shorter than tier ${tier - 1}'s ${previous}`);
  previous = t;
}
assert.ok(TIER_TIME[10] > TIER_TIME[1], "the hardest tier must get more time than the easiest");
```

Update the `require` on line 2 to add `makeItem` and `TIER_TIME`. Also update the two later loops that use `items` (the answer-validity loop and the 500-iteration distractor loop) to build their sample from `makeItem` instead:

```js
const items = [];
{
  const nextId = (() => { let n = 0; return () => n++; })();
  for (let tier = 1; tier <= 10; tier++) {
    for (let i = 0; i < 10; i++) items.push(makeItem(tier, nextId));
  }
}
```

Place that block immediately after the `require`, replacing `const items = generateItems();`. The existing `meta.op === "÷"` and `meta.op === "−"` assertions must be guarded so they only run for binary items:

```js
items.forEach(([id, expr, tier, answer, meta]) => {
  assert.ok(Number.isInteger(answer) && answer >= 0, `${expr} should have a non-negative integer answer, got ${answer}`);
  if (meta.kind !== "binary") return;
  if (meta.op === "÷") {
    assert.strictEqual(meta.a / meta.b, answer, `${expr} should divide evenly`);
  }
  if (meta.op === "−") {
    assert.ok(meta.a >= meta.b, `${expr} subtraction should never go negative`);
  }
});
```

The Task 2 `generateItems()` "every item is kind binary" assertion must be deleted along with `generateItems` itself.

- [ ] **Step 2: Run test to verify it fails**

Run: `node games/math-master/game.test.js`
Expected: FAIL with `TypeError: makeItem is not a function`

- [ ] **Step 3: Write minimal implementation**

At the very top of `games/math-master/game.js`, above the existing comment block:

```js
// Under Node (tests) the difficulty controller is a separate module; in the
// browser build difficulty.js is concatenated ahead of this file, so its
// function declarations are already in scope and requiring would fail.
// `var` (not `let`/`const`) is deliberate: it coexists with those hoisted
// function declarations instead of throwing a redeclaration SyntaxError.
var initialDifficulty, nextDifficulty;
if (typeof module !== "undefined") {
  ({ initialDifficulty, nextDifficulty } = require("./difficulty.js"));
}
```

Replace `generateItems` (currently `game.js:46-83`) with:

```js
// Tier -> generator. Problems are produced on demand at the player's current
// tier rather than pre-baked into a fixed pool, which is what makes endless
// adaptive runs possible.
const GENERATORS = {
  1: (nextId) => addSub(1, 20, 1, nextId),
  2: (nextId) => Math.random() < 0.5 ? mul(2, 9, 2, 10, 2, nextId) : div(2, 9, 2, 9, 2, nextId),
  3: (nextId) => Math.random() < 0.5 ? addSub(15, 50, 3, nextId) : mul(2, 9, 11, 15, 3, nextId),
  4: (nextId) => Math.random() < 0.5 ? mul(2, 12, 2, 12, 4, nextId) : div(2, 12, 2, 12, 4, nextId),
  5: (nextId) => Math.random() < 0.5 ? mul(13, 50, 2, 12, 5, nextId) : div(2, 15, 10, 30, 5, nextId),
  6: (nextId) => Math.random() < 0.5 ? mul(13, 99, 2, 12, 6, nextId) : div(2, 20, 10, 50, 6, nextId),
  7: (nextId) => missingOperand(7, nextId),
  8: (nextId) => twoStepPlain(8, nextId),
  9: (nextId) => twoStepTrap(9, nextId),
  10: (nextId) => Math.random() < 0.5 ? twoStepDouble(10, nextId) : twoStepMissing(10, nextId),
};

function makeItem(tier, nextId) {
  return GENERATORS[tier](nextId);
}

// Seconds on the clock per tier. A flat 10s made "3 + 7" and "7 + 6 × 4"
// equally urgent — easy rounds were sleepy and hard ones unfair.
const TIER_TIME = { 1: 6, 2: 6, 3: 8, 4: 8, 5: 10, 6: 10, 7: 11, 8: 13, 9: 13, 10: 15 };
```

Replace the `if (typeof GAME !== "undefined")` block with:

```js
if (typeof GAME !== "undefined") {
  // shared/engine.js reads GAME.items at load time. Math Master generates on
  // demand instead, so the pool stays empty.
  GAME.items = [];

  let run = null;
  const MAX_ATTEMPTS = 30;

  GAME.nextItem = function (ctx) {
    // round 0 is a fresh run — engine resets `round` in startGame().
    if (ctx.round === 0 || !run) {
      const easy = ctx.practiceMode && ctx.practiceDifficulty === "easy";
      let counter = 0;
      run = {
        easy,
        seen: new Set(),
        nextId: () => counter++,
        diff: initialDifficulty(easy ? 1 : 2),
      };
    }
    // Easy practice pins the bottom of the ladder and never adapts.
    const tier = run.easy ? (Math.random() < 0.5 ? 1 : 2) : run.diff.tier;
    // Retry on a repeated question so players never see the same equation
    // twice in one run. Capped so a tier too small to fill without repeats
    // can't loop forever — falls back to accepting the repeat.
    let item, attempts = 0;
    do {
      item = makeItem(tier, run.nextId);
      attempts++;
    } while (run.seen.has(equationSignature(item[4])) && attempts < MAX_ATTEMPTS);
    run.seen.add(equationSignature(item[4]));
    return item;
  };

  GAME.roundTime = function (item) { return TIER_TIME[item[2]] || 10; };

  GAME.onAnswer = function (item, outcome) {
    if (!run || run.easy) return;
    run.diff = nextDifficulty(run.diff, outcome);
  };

  GAME.renderPrompt = function (item) {
    $("prompt-flag").style.display = "none";
    // "missing" items already state their own "= N", so appending "= ?"
    // would render "7 × ? = 56 = ?".
    const suffix = item[4].kind === "missing" ? "" : " = ?";
    $("country-name").textContent = `${item[1]}${suffix}`;
  };

  GAME.renderOption = function (item) {
    return `<button class="math-btn" data-key="${item[3]}" aria-label="Answer ${item[3]}">
       <span class="math-num">${item[3]}</span>
       <span class="mark"></span>
     </button>`;
  };

  GAME.optionKey = function (item) { return String(item[3]); };

  GAME.wrongAnswerText = function (item, clickedKey) {
    return `The answer was ${item[3]}`;
  };

  GAME.pickDistractors = pickMathDistractors;
}
```

Update the export block at the bottom:

```js
if (typeof module !== "undefined") {
  module.exports = {
    makeItem, TIER_TIME, pickMathDistractors, applyOp, equationSignature,
    missingOperand, twoStepPlain, twoStepTrap, twoStepDouble, twoStepMissing,
    evalTwoStep, evalLeftToRight,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node games/math-master/game.test.js`
Expected: `All math-master game tests passed`

Run: `node games/math-master/difficulty.test.js`
Expected: `All math-master difficulty tests passed`

- [ ] **Step 5: Commit**

```bash
git add games/math-master/game.js games/math-master/game.test.js
git commit -m "feat(math-master): generate problems on demand at the adaptive tier"
```

---

### Task 7: Engine hooks

The only shared-code change. Every edit is gated on a hook existing, so Flag Master and Capital Master take the identical path they take today.

**Files:**
- Modify: `shared/engine.js:53-61` (`buildQueue` call site), `:101` (`startGame`), `:199-236` (`nextRound`, `updateTimerBar`), `:261-304` (`answerWith`), `:313-323` (`timeUp`)

**Interfaces:**
- Consumes: `GAME.nextItem(ctx)`, `GAME.roundTime(item)`, `GAME.onAnswer(item, outcome)` from Task 6.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the per-round budget state**

In `shared/engine.js`, change line 47 to add `roundBudget`:

```js
let streak = 0, bestStreak = 0, results = [], timerId = null, timeLeft = 0, locked = false, lockedAt = 0, nextRoundTimer = null;
let roundBudget = ROUND_TIME;
```

- [ ] **Step 2: Skip queue building for on-demand games**

Change line 101 in `startGame` from `queue = buildQueue();` to:

```js
  // Games that supply GAME.nextItem generate problems on demand and run
  // endlessly, so there is no pool to pre-build.
  queue = GAME.nextItem ? [] : buildQueue();
```

- [ ] **Step 3: Make `nextRound` endless-aware and budget-aware**

Replace lines 199–229 (`nextRound`) with:

```js
function nextRound() {
  if (lives <= 0) return endGame();
  if (!GAME.nextItem && round >= queue.length) return endGame();
  locked = false;
  const answer = GAME.nextItem
    ? GAME.nextItem({
        round,
        streak,
        score,
        practiceMode,
        practiceDifficulty: practiceCfg.difficulty,
      })
    : queue[round];
  renderHud(answer);
  $("qnum").textContent = `${(locale === "pt" && GAME.promptCounterLabelPt) || GAME.promptCounterLabel} ${round + 1}`;
  GAME.renderPrompt(answer);
  $("feedback").textContent = "";
  $("feedback").className = "feedback";

  const options = shuffle([answer, ...pickDistractors(answer)]);
  $("options").innerHTML = options.map(c => GAME.renderOption(c)).join("");
  $("options").querySelectorAll("button").forEach(b =>
    b.addEventListener("click", () => answerWith(b, answer)));

  clearInterval(timerId);
  const noTimer = practiceMode && practiceCfg.timer === "off";
  roundBudget = GAME.roundTime ? GAME.roundTime(answer) : ROUND_TIME;
  if (noTimer) {
    $("timerbar").style.display = "none";
    timeLeft = Infinity;
  } else {
    $("timerbar").style.display = "";
    timeLeft = roundBudget;
    updateTimerBar();
    timerId = setInterval(() => {
      timeLeft -= 0.1;
      updateTimerBar();
      if (timeLeft <= 0) timeUp(answer);
    }, 100);
  }
}
```

- [ ] **Step 4: Make the timer bar use the round's budget**

Replace line 232 in `updateTimerBar`:

```js
  const pct = Math.max(0, timeLeft / roundBudget * 100);
```

- [ ] **Step 5: Report outcomes to the game**

Add this helper directly above `answerWith`:

```js
// Fraction of the round's budget the player used. 1 on timeout, and 1 when
// the round had no timer at all, so an untimed round can never register as
// a "fast" answer.
function timeRatioNow() {
  if (!Number.isFinite(timeLeft) || roundBudget <= 0) return 1;
  return Math.min(1, Math.max(0, (roundBudget - timeLeft) / roundBudget));
}
```

In `answerWith`, insert immediately before the existing `track(...)` call on line 300:

```js
  if (GAME.onAnswer) GAME.onAnswer(answer, { correct, timedOut: false, timeRatio: timeRatioNow() });
```

In `timeUp`, insert immediately before its `track(...)` call on line 319:

```js
  if (GAME.onAnswer) GAME.onAnswer(answer, { correct: false, timedOut: true, timeRatio: 1 });
```

- [ ] **Step 6: Rebuild and verify the other two games are untouched**

Run: `node build.js`
Expected: three `Built ...` lines.

Run: `git diff --stat index.html capital-master/index.html`
Expected: both files change, since the engine source they embed changed. Confirm the change is *only* the engine edits by checking that no game-specific line moved:

Run: `git diff index.html | grep '^[-+]' | grep -v 'GAME.nextItem\|GAME.roundTime\|GAME.onAnswer\|roundBudget\|timeRatioNow\|practiceDifficulty\|^[-+][-+]'`
Expected: no output. Any line printed here is an unintended change — investigate before committing.

- [ ] **Step 7: Commit**

```bash
git add shared/engine.js index.html capital-master/index.html math-master/index.html
git commit -m "feat(engine): add optional nextItem, roundTime and onAnswer hooks"
```

---

### Task 8: Registry and build wiring

**Files:**
- Modify: `games.json` (math-master entry: `levels`, `itemCountLabel`)
- Modify: `build.js:24` (allowlist), `:36-38` (file reads), `:51`/`:56` (substitutions), `:60` (concat order)

**Interfaces:**
- Consumes: `difficulty.js` from Task 1.
- Produces: `difficulty.js` present in the browser bundle ahead of `game.js`; `itemCountLabel` available to the template.

- [ ] **Step 1: Add tier 7–10 level names and the endless label**

In `games.json`, in the `math-master` entry, replace the `levels` object and add `itemCountLabel` next to `itemCount`:

```json
    "itemCount": 100,
    "itemCountLabel": "Endless",
    "levels": {
      "1": "Warming up",
      "2": "Times tables",
      "3": "Leveling up",
      "4": "Getting tricky",
      "5": "Math nerd zone",
      "6": "Very hard",
      "7": "Fill the blank",
      "8": "Two steps",
      "9": "Mind the order",
      "10": "Brain melter"
    },
```

- [ ] **Step 2: Wire `difficulty.js` into the build**

In `build.js`, after the `backgroundJs` read (around line 38), add:

```js
  // Optional per-game module. Only Math Master has one today; games without
  // it build exactly as before.
  const difficultyPath = path.join(gameDir, "difficulty.js");
  const difficultyJs = fs.existsSync(difficultyPath) ? fs.readFileSync(difficultyPath, "utf8") : "";
```

In the `<!--GAME_SCRIPT-->` replacement (around line 60), put `difficultyJs` first so its constants are defined before `game.js` reads them:

```js
      `const GAMES = ${gamesJsonLiteral};\nconst GAME = GAMES.find(g => g.id === ${JSON.stringify(game.id)});\n${difficultyJs}\n${gameJs}\n${backgroundJs}\n${engineJs}\n${arcadeJs}`
```

- [ ] **Step 3: Use `itemCountLabel` in the badge and practice screen**

In `build.js`, replace the `ITEM_COUNT` and `TOTAL_ALL_DIFFICULTY` substitutions:

```js
    .replace(/\{\{ITEM_COUNT\}\}/g, game.itemCountLabel || game.itemCount)
    ...
    .replace(/\{\{TOTAL_ALL_DIFFICULTY\}\}/g, game.itemCountLabel || `All ${game.itemCount}`)
```

`itemCountLabel` is optional, so it is deliberately **not** added to `REQUIRED_FIELDS`.

- [ ] **Step 4: Rebuild and check the output**

Run: `node build.js`
Expected: three `Built ...` lines.

Run: `grep -o 'Endless problems · one shot' math-master/index.html`
Expected: `Endless problems · one shot`

Run: `grep -c 'initialDifficulty' math-master/index.html`
Expected: a number greater than 0 (the controller is embedded).

Run: `grep -c 'initialDifficulty' index.html capital-master/index.html`
Expected: `index.html:0` and `capital-master/index.html:0` — the controller must not leak into the other games.

Run: `grep -o '100 problems' math-master/index.html`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add games.json build.js index.html capital-master/index.html math-master/index.html
git commit -m "build: wire difficulty.js and endless label into the math-master bundle"
```

---

### Task 9: Browser verification

Per project convention, verify in the browser and wait for the user's explicit go-ahead before pushing.

**Files:** none modified (unless a defect is found).

- [ ] **Step 1: Run the full test suite**

Run: `node games/math-master/game.test.js && node games/math-master/difficulty.test.js && node leaderboard-apps-script.test.js`
Expected: all three pass.

- [ ] **Step 2: Rebuild and serve**

Run: `node build.js`

Then start a static server via `preview_start` pointing at the repo root, and open `math-master/index.html`.

- [ ] **Step 3: Verify the adaptive ramp**

Play a run answering correctly and quickly. Confirm:
- The HUD level label starts at "Times tables" (tier 2), not "Warming up".
- It climbs and reaches "Brain melter" (tier 10) within roughly 8–10 correct fast answers.
- The timer bar's full duration visibly lengthens at the higher tiers (6s at the bottom, 15s at the top) and always starts full.

- [ ] **Step 4: Verify the new question types render correctly**

Confirm:
- A tier 7 prompt reads `7 × ? = 56` — **not** `7 × ? = 56 = ?`.
- A tier 9 prompt reads `7 + 6 × 4 = ?` and the option set contains the left-to-right value (52 for that example) alongside the correct one (31).
- A tier 10 prompt shows either `9 × 7 − 4 × 8 = ?` or `3 × ? + 7 = 31`.
- All four option buttons show distinct positive numbers on every round.

- [ ] **Step 5: Verify endlessness and the ratchet**

Confirm:
- The start-screen badge reads "Endless problems · one shot".
- The run continues past problem 100 (use practice mode with unlimited lives and the timer off to get there quickly; note that untimed rounds never promote by 2, so the climb is slower there).
- After deliberately missing two in a row at a high tier, the level label drops by exactly one and never falls more than two tiers below the peak reached.

- [ ] **Step 6: Verify the other two games are unaffected**

Open `index.html` (Flag Master) and `capital-master/index.html`. Confirm each still shows its own badge (`195 countries` / `100 capitals`), runs a normal fixed-length game, and uses a 10-second timer on every round.

- [ ] **Step 7: Report and wait**

Report the results to the user with the actual observations. **Do not push.** Wait for explicit go-ahead.

---

### Task 10: Leaderboard reset (manual, user-performed)

Spec §9: base points stay `tier * 100`, but tier 10 now pays 1000 against the
old 600 ceiling, and endless runs are longer. Existing Math Master scores
become non-comparable, so the math rows get wiped on release.

**This task involves no code.** No file in this repo stores leaderboard rows —
they live in the user's Google Sheet behind the Apps Script backend, and
deleting them is destructive and outward-facing. **Do not perform it.** Surface
it to the user and let them do it.

- [ ] **Step 1: Confirm no code change is needed**

Run: `grep -n 'game=' leaderboard-apps-script.js`
Expected: rows are filtered by a `game` column, confirming math rows can be
deleted without touching flag or capital rows.

- [ ] **Step 2: Hand off to the user**

Tell the user, after they approve the browser verification and before the
release goes out:

> Math Master leaderboard rows are now non-comparable with the new scoring.
> To wipe them, open the leaderboard Google Sheet and delete every row whose
> `game` column is `math`, leaving `flags` and `capitals` rows intact. I have
> not touched the sheet.

Do not proceed past this step without the user confirming they have handled it
or decided to skip it.
