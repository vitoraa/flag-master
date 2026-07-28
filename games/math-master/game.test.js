const assert = require("assert");
const {
  generateItems, pickMathDistractors, applyOp, equationSignature,
  missingOperand, twoStepPlain, twoStepTrap, twoStepDouble, twoStepMissing,
  evalTwoStep, evalLeftToRight,
} = require("./game.js");

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
