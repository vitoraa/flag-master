const assert = require("assert");
const { generateItems, pickMathDistractors, applyOp, equationSignature } = require("./game.js");

const items = generateItems();
assert.strictEqual(items.length, 100, "pool should contain 100 items");
const EXPECTED_PER_TIER = { 1: 8, 2: 10, 3: 15, 4: 20, 5: 22, 6: 25 };
for (let tier = 1; tier <= 6; tier++) {
  const count = items.filter(it => it[2] === tier).length;
  assert.strictEqual(count, EXPECTED_PER_TIER[tier], `tier ${tier} should have ${EXPECTED_PER_TIER[tier]} items, got ${count}`);
}

// Regression: no two items in the pool should be the same underlying
// question (e.g. two "4 x 10"s), across many freshly-generated pools.
for (let trial = 0; trial < 30; trial++) {
  const pool = trial === 0 ? items : generateItems();
  const seen = new Set();
  pool.forEach(it => {
    const sig = equationSignature(it[4]);
    assert.ok(!seen.has(sig), `duplicate question found in pool: ${it[1]} (signature ${sig})`);
    seen.add(sig);
  });
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
  // Regression: tier 3+ must include at least one distractor sharing the
  // correct answer's last digit, so players can't shortcut by only
  // computing the ones digit.
  if (answer[2] >= 3) {
    const correctLastDigit = answer[3] % 10;
    assert.ok(
      values.some(v => v % 10 === correctLastDigit),
      `tier ${answer[2]} answer ${answer[3]} (${answer[1]}) should have a same-last-digit distractor among ${values}`
    );
  }
}

// Regression: ensure fallback loop terminates with correct === 0 (edge case)
const edgeCase = [
  "edge0", "0 - 0", 1, 0, { op: "−", a: 0, b: 0 }
];
const edgeDistr = pickMathDistractors(edgeCase);
assert.strictEqual(edgeDistr.length, 3, "edge case: must produce exactly 3 distractors");
const edgeValues = edgeDistr.map(d => d[3]);
assert.strictEqual(new Set(edgeValues).size, 3, "edge case: distractors must be unique");
edgeValues.forEach(v => {
  assert.ok(v > 0, "edge case: distractor must be positive");
  assert.notStrictEqual(v, 0, "edge case: distractor must not equal correct answer");
});

console.log("All math-master game tests passed");
