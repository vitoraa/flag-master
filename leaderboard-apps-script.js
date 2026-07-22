const SHEET_NAME = "Scores";
const CACHE_KEY = "leaderboard_sorted_v1";
const CACHE_TTL_SECONDS = 300;

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Score", "Flags", "Streak"]);
  }
  return sheet;
}

// Returns the full leaderboard (name/score/flags only, sorted desc) from
// CacheService when available, so most requests skip reading+sorting the
// whole sheet. Cache is invalidated on every new submission.
function getSortedAll_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues().slice(1);
  const all = rows
    .map(r => ({ name: r[1], score: Number(r[2]) || 0, flags: Number(r[3]) || 0 }))
    .sort((a, b) => b.score - a.score);

  cache.put(CACHE_KEY, JSON.stringify(all), CACHE_TTL_SECONDS);
  return all;
}

function doPost(e) {
  const sheet = getSheet_();
  const data = JSON.parse(e.postData.contents);
  const name = String(data.name || "Anonymous").slice(0, 24);
  const score = Number(data.score) || 0;
  const flags = Number(data.flags) || 0;
  const streak = Number(data.streak) || 0;

  sheet.appendRow([new Date(), name, score, flags, streak]);
  CacheService.getScriptCache().remove(CACHE_KEY);

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
  let all = getSortedAll_();

  const total = all.length;
  const top = all.slice(0, 3);
  const result = { top: top, total: total };

  const p = (e && e.parameter) || {};
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
