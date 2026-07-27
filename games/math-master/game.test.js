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
