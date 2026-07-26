const assert = require("assert");

// Minimal Apps Script global stubs so leaderboard-apps-script.js can be
// required and its sheet/cache functions exercised under plain Node.
global.CacheService = {
  getScriptCache() {
    return {
      get: () => null,
      put: (key, value) => {
        if (value.length > 100 * 1024) {
          throw new Error('Argument too large: value (line 56, file "leaderboard-apps-script")');
        }
      },
      remove: () => {},
    };
  },
};

function makeRow(i) {
  return [new Date(), "Player" + i, i, i, 0];
}

global.SpreadsheetApp = {
  getActiveSpreadsheet() {
    return {
      getSheetByName(name) {
        // Enough rows that the sorted JSON blows past CacheService's 100KB cap.
        const rowCount = 6000;
        const rows = [["Timestamp", "Name", "Score", "Flags", "Streak"]];
        for (let i = 1; i <= rowCount; i++) rows.push(makeRow(i));
        return {
          getDataRange() {
            return { getValues: () => rows };
          },
          getLastRow: () => rows.length,
        };
      },
      insertSheet() {
        throw new Error("insertSheet should not be needed in this test");
      },
    };
  },
};

const { sheetNamesFor_, getSortedAll_ } = require("./leaderboard-apps-script.js");

// Regression test: previously an oversized cache value crashed getSortedAll_
// (and therefore every doGet/doPost) instead of just skipping the cache.
const all = getSortedAll_("flags");
assert.strictEqual(all.length, 6000);
assert.strictEqual(all[0].score, 6000);

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
