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
  module.exports = { generateItems, pickMathDistractors, applyOp, equationSignature };
}
