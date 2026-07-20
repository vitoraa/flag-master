const SHEET_NAME = "Scores";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Score", "Flags", "Streak"]);
  }
  return sheet;
}

function doPost(e) {
  const sheet = getSheet_();
  const data = JSON.parse(e.postData.contents);
  const name = String(data.name || "Anonymous").slice(0, 24);
  const score = Number(data.score) || 0;
  const flags = Number(data.flags) || 0;
  const streak = Number(data.streak) || 0;

  sheet.appendRow([new Date(), name, score, flags, streak]);

  const scores = sheet.getDataRange().getValues().slice(1).map(r => Number(r[2]) || 0);
  const rank = scores.filter(s => s > score).length + 1;

  return ContentService
    .createTextOutput(JSON.stringify({ rank: rank, total: scores.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues().slice(1);
  const all = rows
    .map(r => ({ name: r[1], score: Number(r[2]) || 0 }))
    .sort((a, b) => b.score - a.score);

  return ContentService
    .createTextOutput(JSON.stringify({ top: all.slice(0, 10), all: all, total: rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}
