const assert = require("assert");
const { sheetNamesFor_ } = require("./leaderboard-apps-script.js");

const flagsDefault = sheetNamesFor_(undefined);
assert.strictEqual(flagsDefault.scores, "Scores");
assert.strictEqual(flagsDefault.log, "PlayLog");

const flagsExplicit = sheetNamesFor_("flags");
assert.strictEqual(flagsExplicit.scores, "Scores");
assert.strictEqual(flagsExplicit.log, "PlayLog");

const capitals = sheetNamesFor_("capitals");
assert.strictEqual(capitals.scores, "CapitalScores");
assert.strictEqual(capitals.log, "CapitalPlayLog");

assert.notStrictEqual(flagsDefault.cacheKey, capitals.cacheKey);

console.log("All leaderboard-apps-script tests passed");
