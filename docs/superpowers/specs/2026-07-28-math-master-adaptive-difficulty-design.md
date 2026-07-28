# Math Master — Adaptive Difficulty

**Date:** 2026-07-28
**Status:** Approved

## Problem

Math Master is boring for competent players. Three causes:

1. **Fixed tier-ordered pool.** `generateItems()` builds 100 items with
   `PER_TIER = {1:8, 2:10, 3:15, 4:20, 5:22, 6:25}`, and `buildQueue()` serves them
   tier 1 → 6 in order. Questions 1–33 are tiers 1–3, and tier 3 is still
   `15–50 ± 15–50` or `2–9 × 11–15`. A strong player spends a third of the run
   on arithmetic they can do instantly.
2. **No responsiveness.** Difficulty is identical regardless of performance.
   Answering 20 in a row perfectly changes nothing.
3. **Low ceiling.** Tier 6 tops out at 2-digit × 1-digit and simple division.
   Even a perfect ramp would run out of difficulty.

A flat 10s timer compounds this: `3 + 7` and `87 × 9` carry identical pressure.

## Goals

- A fast player reaches genuinely hard material within roughly 8 rounds.
- Once a player demonstrates a level, they never drop back to trivial questions.
- The hardest content requires thinking, not just larger operands.
- Flag Master and Capital Master are unaffected.

## Non-goals

- Bigger-number arithmetic (3-digit, 2-digit × 2-digit). Rejected: slower, not harder.
- Squares, roots, percentages, negatives. Rejected: recall rather than calculation.
- Changing scoring formula shape, streak multipliers, or life count.

---

## Design

### 1. Tier ladder: 6 → 10

Tiers 1–6 keep their current generators unchanged. Four new tiers:

| Tier | Kind | Content | Example |
|---|---|---|---|
| 7 | `missing` | Missing operand, times-table range | `7 × ? = 56`, `? ÷ 6 = 9`, `84 − ? = 37` |
| 8 | `twostep` | Two-step, no precedence trap | `(12 − 5) × 8`, `60 ÷ 4 + 9` |
| 9 | `twostep` | Two-step **with** precedence trap | `7 + 6 × 4`, `40 − 3 × 9`, `5 × 8 − 12` |
| 10 | `missing` + `twostep` | Missing operand inside two-step, or three-term | `3 × ? + 7 = 31`, `9 × 7 − 4 × 8` |

Tier 9 is the centrepiece: the naive left-to-right evaluation (`7 + 6 × 4` → 52)
is **always** forced into the option set, so rushing costs a life.

`games.json` gains level names for tiers 7–10.

### 2. Item shape

Current: `[id, exprText, tier, answer, meta]` with `meta = { op, a, b }`.

`meta` gains a discriminant so distractor generation can branch:

- `{ kind: "binary", op, a, b }` — tiers 1–6, identical to today.
- `{ kind: "missing", op, a, b, slot }` — `slot` is `"a"` or `"b"`, naming which
  operand was replaced by `?`. `a`/`b` remain the true operands.
- `{ kind: "twostep", outerOp, innerOp, a, b, c, parenthesized }` — the displayed
  expression is built from these; `parenthesized` distinguishes tier 8 from tier 9.

`equationSignature()` extends to cover the new kinds so the no-repeat guarantee
holds. Commutativity folding (`4 × 10` ≡ `10 × 4`) applies only to `binary`.

### 3. Adaptive tier selection

Problems are generated on demand at the player's current tier, replacing the
pre-baked queue. Runs start at **tier 2**.

State (per run):

```
{ tier, highTier, consecutiveCorrect, consecutiveFast, consecutiveWrong }
```

Transitions, applied after each answered round:

- **Correct** → increment `consecutiveCorrect`; reset `consecutiveWrong`.
  Increment `consecutiveFast` if the answer landed in under 30% of the round's
  time budget, else reset it to 0.
  - `consecutiveFast >= 2` → **tier += 2**, reset both counters.
  - else `consecutiveCorrect >= 2` → **tier += 1**, reset both counters.
- **Wrong or timeout** → increment `consecutiveWrong`; reset `consecutiveCorrect`
  and `consecutiveFast`.
  - `consecutiveWrong >= 2` → **tier −= 1**, reset `consecutiveWrong`.
  - A single miss changes no tier — one slip must not punish momentum.
- **Clamp** to `[1, 10]`, then to a **ratchet floor** of `highTier − 2`.
  `highTier` is the maximum tier ever reached this run.

The ratchet floor is what fixes the stated complaint: once a player has proven a
level, demotion can never return them to trivial questions.

A player answering fast and correctly reaches tier 10 in roughly 8 rounds.

### 4. Tier-scaled round time

`ROUND_TIME` becomes a per-tier budget:

| Tiers | Seconds |
|---|---|
| 1–2 | 6 |
| 3–4 | 8 |
| 5–6 | 10 |
| 7 | 11 |
| 8–9 | 13 |
| 10 | 15 |

Easy rounds get tenser; hard rounds get fair. The speed bonus
(`ceil(timeLeft) * 10`) is unchanged, so hard tiers naturally pay more.

`updateTimerBar()` must divide by the round's budget, not the module constant.

### 5. Endless runs

A run ends only when lives reach zero. The start-screen badge changes from
`100 problems · one shot` to `endless · one shot`.

`itemCount` stays in `games.json` for build-template compatibility. A new
optional `itemCountLabel` field overrides the badge text; Math Master sets it to
`"endless"` and the other two games omit it, keeping their `100 problems` /
`195 countries` badges. `itemCountLabel` must be added to the field allowlist in
`build.js:24`, and the `{{TOTAL_ALL_DIFFICULTY}}` substitution
(`build.js:56`, used by the practice-setup screen) must fall back to
`itemCountLabel` when present so Math Master does not render "All 100".

### 6. Engine hooks

Four additions to `shared/engine.js`, each optional and falling back to current
behaviour when the game does not define it. Flag Master and Capital Master
define none of them and are byte-identical in behaviour.

- **`GAME.nextItem(ctx)`** — when defined, `nextRound()` calls it instead of
  reading `queue[round]`, and the `round >= queue.length` end condition is
  skipped (endless). `ctx = { round, streak, score }`.
- **`GAME.roundTime(item)`** — returns this round's budget in seconds. Default
  `ROUND_TIME` (10).
- **`GAME.onAnswer(item, outcome)`** — called after every resolved round with
  `outcome = { correct, timedOut, timeRatio }`, where `timeRatio` is elapsed
  time as a fraction of the budget. It is `1` on timeout, and also `1` when the
  round had no timer (practice mode with the timer off), so an untimed round can
  never earn the fast-promotion bonus. Drives the adaptive controller.
- Practice mode: when `practiceCfg.difficulty === "easy"` and `GAME.nextItem`
  exists, the game pins tier to 1–2 and disables adaptation.

### 7. Module boundaries

New file `games/math-master/difficulty.js` holds the adaptive controller as a
pure function:

```js
nextDifficulty(state, outcome) -> state
```

No DOM, no randomness, no globals — directly unit-testable. `game.js` owns
generation and distractors; `difficulty.js` owns only tier movement.

Generators for tiers 7–10 live in `game.js` alongside the existing
`addSub`/`mul`/`div`, following the same signature convention.

### 8. Distractors

`pickMathDistractors` branches on `meta.kind`:

- **`binary`** — unchanged.
- **`missing`** — forced candidate: the result of *applying* the operator instead
  of inverting it (`7 × ? = 56` → `392`). Plus off-by-one on the true operand,
  and the existing small-offset variants.
- **`twostep`** — forced candidate: strict left-to-right evaluation. When that
  equals the correct answer (no trap exists for this instance), fall back to
  off-by-one on each operand. Plus wrong-inner-operator and small-offset variants.

The existing same-last-digit guarantee for tier ≥ 3 still applies.

### 9. Scoring and the leaderboard

Base points stay `tier * 100`, so tier 10 pays 1000 versus today's 600 ceiling,
and endless runs are longer. **Existing Math Master leaderboard scores become
non-comparable.** Decision: wipe the math leaderboard rows when this ships.
Flag and Capital rows are untouched.

## Testing

Extend `games/math-master/game.test.js`:

- Every tier 1–10 generator produces a positive integer answer matching the
  displayed expression, over many samples.
- Tier 9 expressions always have a left-to-right value differing from the correct
  value (that is what makes them traps).
- `equationSignature` distinguishes the new kinds and still folds commutativity
  for `binary` only.
- Distractors: never contain the correct answer, never non-positive, always
  exactly 3, always distinct; the forced trap candidate is present for tiers 9
  and 7.

New `games/math-master/difficulty.test.js`:

- Two fast-correct answers promote by 2; two ordinary-correct promote by 1.
- A single wrong answer does not demote.
- Two consecutive wrong answers demote by 1.
- The ratchet floor prevents dropping more than 2 below `highTier`.
- Tier clamps at 1 and 10.
- A simulated perfect-and-fast player reaches tier 10 within 10 rounds.

Engine hooks are verified by confirming Flag Master and Capital Master behaviour
is unchanged (they define none of the hooks) and by manual browser verification
of a Math Master run.

## Verification

Per project convention, verify in the browser before pushing: run a Math Master
game, confirm the tier climbs visibly in the HUD level label, that the timer bar
duration changes with tier, that tier 9 traps appear in the options, and that the
run continues past 100 problems.
