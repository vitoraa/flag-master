const SHEET_NAME = "Scores";
const PLAY_LOG_SHEET_NAME = "PlayLog";
const CACHE_KEY = "leaderboard_sorted_v1";
const CACHE_TTL_SECONDS = 300;

// Maps a `game` value ("capitals" or anything else, including undefined)
// to the sheet tabs and cache key it should use. Defaulting anything
// other than "capitals" to the original flags names keeps the deployed
// flag-master client (which never sends `game`) working unchanged.
function sheetNamesFor_(game) {
  if (game === "capitals") {
    return { scores: "CapitalScores", log: "CapitalPlayLog", cacheKey: CACHE_KEY + ":capitals" };
  }
  return { scores: SHEET_NAME, log: PLAY_LOG_SHEET_NAME, cacheKey: CACHE_KEY + ":flags" };
}

function getSheet_(game) {
  const names = sheetNamesFor_(game);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(names.scores);
  if (!sheet) {
    sheet = ss.insertSheet(names.scores);
    sheet.appendRow(["Timestamp", "Name", "Score", "Flags", "Streak"]);
  }
  return sheet;
}

// Log-only sheet: every finished game lands here (even ones that never got
// a name typed in and submitted to the real leaderboard).
function getPlayLogSheet_(game) {
  const names = sheetNamesFor_(game);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(names.log);
  if (!sheet) {
    sheet = ss.insertSheet(names.log);
    sheet.appendRow(["Timestamp", "Name", "Score", "Flags", "Streak", "Practice"]);
  }
  return sheet;
}

// Returns the full leaderboard (name/score/flags only, sorted desc) from
// CacheService when available, so most requests skip reading+sorting the
// whole sheet. Cache is invalidated on every new submission.
function getSortedAll_(game) {
  const cache = CacheService.getScriptCache();
  const names = sheetNamesFor_(game);
  const cached = cache.get(names.cacheKey);
  if (cached) return JSON.parse(cached);

  const sheet = getSheet_(game);
  const rows = sheet.getDataRange().getValues().slice(1);
  const all = rows
    .map(r => ({ name: r[1], score: Number(r[2]) || 0, flags: Number(r[3]) || 0 }))
    .sort((a, b) => b.score - a.score);

  cache.put(names.cacheKey, JSON.stringify(all), CACHE_TTL_SECONDS);
  return all;
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const game = data.game === "capitals" ? "capitals" : "flags";
  const name = String(data.name || "Anonymous").slice(0, 24);
  const score = Number(data.score) || 0;
  const flags = Number(data.flags) || 0;
  const streak = Number(data.streak) || 0;

  if (data.type === "play") {
    const logSheet = getPlayLogSheet_(game);
    logSheet.appendRow([new Date(), name, score, flags, streak, !!data.practice]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSheet_(game);
  sheet.appendRow([new Date(), name, score, flags, streak]);
  CacheService.getScriptCache().remove(sheetNamesFor_(game).cacheKey);

  const scores = sheet.getDataRange().getValues().slice(1).map(r => Number(r[2]) || 0);
  const rank = scores.filter(s => s > score).length + 1;

  return ContentService
    .createTextOutput(JSON.stringify({ rank: rank, total: scores.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Builds the combined ranking rows (top 3 + a window around "you"), the same
// shape the client used to build itself from the full list. Position p
// (0-based) in the combined ranking is: "you" if p === idx, else all[p] if
// p < idx, else all[p - 1].
function buildNearbyRows_(all, idx, youName, youScore, youFlags) {
  const total = all.length + 1;
  const keepPos = {};
  for (let p = 0; p < Math.min(3, total); p++) keepPos[p] = true;
  for (let p = Math.max(0, idx - 2); p <= Math.min(total - 1, idx + 2); p++) keepPos[p] = true;
  const sortedPos = Object.keys(keepPos).map(Number).sort(function (a, b) { return a - b; });

  const rows = [];
  let prev = -1;
  sortedPos.forEach(function (p) {
    if (prev !== -1 && p - prev > 1) rows.push({ ellipsis: true });
    const rank = p + 1;
    if (p === idx) {
      rows.push({ pos: rank, name: youName, score: youScore, flags: youFlags, you: true });
    } else {
      const r = all[p < idx ? p : p - 1];
      rows.push({ pos: rank, name: r.name, score: r.score, flags: r.flags });
    }
    prev = p;
  });
  return rows;
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const game = p.game === "capitals" ? "capitals" : "flags";
  let all = getSortedAll_(game);

  const total = all.length;
  const top = all.slice(0, 3);
  const result = { top: top, total: total };

  if (p.score !== undefined) {
    const youScore = Number(p.score) || 0;
    const youFlags = Number(p.flags) || 0;
    const youName = p.name || "You";

    if (p.name) {
      for (let i = all.length - 1; i >= 0; i--) {
        if (all[i].name === p.name && all[i].score === youScore && all[i].flags === youFlags) {
          all.splice(i, 1);
          break;
        }
      }
    }

    const idx = all.filter(r => r.score > youScore).length;
    result.rows = buildNearbyRows_(all, idx, youName, youScore, youFlags);
    result.total = all.length + 1;
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Exposed for leaderboard-apps-script.test.js only. Apps Script's runtime
// has no `module` global, so this is a no-op when deployed.
if (typeof module !== "undefined") {
  module.exports = { sheetNamesFor_ };
}
