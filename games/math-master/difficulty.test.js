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
