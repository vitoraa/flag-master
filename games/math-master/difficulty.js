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
