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
    return [id, `${a} + ${b}`, tier, a + b, { op: "+", a, b }];
  }
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return [id, `${hi} − ${lo}`, tier, hi - lo, { op: "−", a: hi, b: lo }];
}

function mul(aMin, aMax, bMin, bMax, tier, nextId) {
  const a = randInt(aMin, aMax), b = randInt(bMin, bMax);
  const id = `m${nextId()}`;
  return [id, `${a} × ${b}`, tier, a * b, { op: "×", a, b }];
}

function div(divMin, divMax, quotMin, quotMax, tier, nextId) {
  const divisor = randInt(divMin, divMax);
  const quotient = randInt(quotMin, quotMax);
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
  module.exports = { generateItems, pickMathDistractors, applyOp };
}
