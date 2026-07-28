// Procedurally generated equation pool — unlike flags/capitals, math
// problems are cheap to generate, so there's no hand-written data list.
// Item shape: [id, exprText, tier, answer, meta]
// meta = { op, a, b } describes the operands actually shown (for ÷,
// a = dividend, b = divisor) so pickMathDistractors can simulate mistakes
// without re-parsing the display string.

function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }

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
  // A subtracting tail must not drive the stated total to zero or below —
  // a non-positive total reads as broken and breaks the distractor rules.
  // When the inner value is too small to subtract from at all, fall back to
  // addition instead of clamping to a degenerate c.
  let usedTail = null;
  if (tail) {
    if (tail.op === "−" && inner - 1 >= 1) {
      usedTail = { op: "−", c: Math.min(tail.c, inner - 1) };
    } else if (tail.op === "−") {
      usedTail = { op: "+", c: tail.c };
    } else {
      usedTail = { op: tail.op, c: tail.c };
    }
  }
  const total = usedTail ? applyOp(usedTail.op, inner, usedTail.c) : inner;
  const left = slot === "a" ? `? ${op} ${b}` : `${a} ${op} ?`;
  const text = usedTail ? `${left} ${usedTail.op} ${usedTail.c} = ${total}` : `${left} = ${total}`;
  return [`m${nextId()}`, text, tier, answer, { kind: "missing", op, a, b, slot, tail: usedTail }];
}

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

function generateItems() {
  let counter = 0;
  const nextId = () => counter++;
  // 6 tiers instead of 4 — each step up is a smaller increment, so the
  // ramp feels gradual instead of jumping straight from plain addition
  // to two-digit multiplication in the same block.
  const GENERATORS = {
    1: () => addSub(1, 20, 1, nextId),
    2: () => Math.random() < 0.5 ? mul(2, 9, 2, 10, 2, nextId) : div(2, 9, 2, 9, 2, nextId),
    3: () => Math.random() < 0.5 ? addSub(15, 50, 3, nextId) : mul(2, 9, 11, 15, 3, nextId),
    4: () => Math.random() < 0.5 ? mul(2, 12, 2, 12, 4, nextId) : div(2, 12, 2, 12, 4, nextId),
    5: () => Math.random() < 0.5 ? mul(13, 50, 2, 12, 5, nextId) : div(2, 15, 10, 30, 5, nextId),
    6: () => Math.random() < 0.5 ? mul(13, 99, 2, 12, 6, nextId) : div(2, 20, 10, 50, 6, nextId),
  };
  // Fewer easy-tier items so the ramp to real difficulty happens sooner —
  // a large easy-tier block frustrates stronger players into quitting
  // before the game gets interesting. itemCount is 100 overall.
  const PER_TIER = { 1: 8, 2: 10, 3: 15, 4: 20, 5: 22, 6: 25 };
  const items = [];
  // Retry on a repeated question (e.g. two "4 x 10"s in the same pool) so
  // players never see the exact same equation twice in one playthrough.
  // Capped so a tier whose operand range is too small to fill without
  // repeats can't loop forever — falls back to accepting the repeat.
  const MAX_ATTEMPTS = 30;
  const usedSignatures = new Set();
  for (let tier = 1; tier <= 6; tier++) {
    for (let i = 0; i < PER_TIER[tier]; i++) {
      let item, attempts = 0;
      do {
        item = GENERATORS[tier]();
        attempts++;
      } while (usedSignatures.has(equationSignature(item[4])) && attempts < MAX_ATTEMPTS);
      usedSignatures.add(equationSignature(item[4]));
      items.push(item);
    }
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

// A distractor sharing the correct answer's last digit (e.g. 56 vs 66)
// stops players from shortcutting to the right option by computing only
// the ones digit and picking whichever option is the only one that matches.
function sameLastDigitVariants(correct) {
  return [10, -10, 20, -20].map(d => correct + d);
}

// Custom pickDistractors: unlike flags/capitals (where any other pool item
// is a plausible wrong answer), a random other equation's answer could be
// wildly off or collide with the correct value. Instead this simulates
// specific mistakes: off-by-one-operand, wrong operator, small offset.
function pickMathDistractors(answer) {
  const tier = answer[2], correct = answer[3], meta = answer[4];
  const used = new Set([correct]);
  const picks = [];

  // Guarantee at least one same-last-digit distractor from tier 3 up —
  // tiers 1-2's answers are small enough that this isn't worth forcing.
  if (tier >= 3) {
    for (const c of sameLastDigitVariants(correct)) {
      if (c > 0 && !used.has(c)) { used.add(c); picks.push(c); break; }
    }
  }

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
  let step = 1, attempt = 0;
  while (picks.length < 3) {
    const n = correct + step * (attempt % 2 === 0 ? 1 : -1);
    step++;
    attempt++;
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

  GAME.optionKey = function (item) { return String(item[3]); };

  GAME.wrongAnswerText = function (item, clickedKey) {
    return `The answer was ${item[3]}`;
  };

  GAME.pickDistractors = pickMathDistractors;
}

// Exposed for game.test.js only. The browser build never sets `module`.
if (typeof module !== "undefined") {
  module.exports = {
    generateItems, pickMathDistractors, applyOp, equationSignature,
    missingOperand, twoStepPlain, twoStepTrap, twoStepDouble, twoStepMissing,
    evalTwoStep, evalLeftToRight,
  };
}
