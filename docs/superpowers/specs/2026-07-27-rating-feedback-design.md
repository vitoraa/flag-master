# Rating & Feedback Prompt — Design

## Purpose

Give players a low-friction way to rate their experience (1-5 stars) and optionally leave
free-text feedback, so the developer can gauge public perception of each game and collect
improvement ideas. This is read by a human later — it does not drive any automated behavior
(e.g. no app-store review redirect).

## Scope

- Applies independently to both games (Flag Master, Capital Master) — each has its own
  `storagePrefix` and its own trigger state.
- English copy only for now. No localization in this pass.
- Fires regardless of practice mode — the prompt is about perception of the game, not score
  legitimacy.

## Trigger & state

Reuses the existing `PLAYS_KEY` counter (`{prefix}-games-played`), which already increments on
every end-screen render (see `updateCrossPromo()` in `shared/engine.js`).

Two new localStorage keys per game:
- `{prefix}-rating-given` — set the moment a star is tapped (regardless of whether the modal is
  later closed/sent).
- `{prefix}-rating-dismissed` — set when the inline card's X is tapped.

The inline card renders on the end screen when `plays >= 4` AND neither flag is set. Once either
flag is set, the card never renders again for that game on that device.

## UI

**Inline card** — placed in the end screen (`screen-end`) near the existing share-row, below the
stats/leaderboard block. Contains:
- Short prompt text (e.g. "Enjoying the game?")
- 5 tappable stars
- Small dismiss "X" in the corner (sets `rating-dismissed`, no network call, card hides
  immediately)

**Modal** — opens immediately when any star is tapped. Contains:
- The tapped star rating, pre-filled/highlighted
- An optional `<textarea>` for free-text feedback (e.g. placeholder "Anything we should
  improve? (optional)")
- A single "Send" action

Closing the modal any way (Send button, backdrop tap, modal X) triggers the same send path —
there is no separate "cancel without sending the rating" path once a star has been tapped, since
`rating-given` is set on tap. The modal closes instantly with no loading state; the POST happens
in the background, fire-and-forget, matching the existing `logPlay()` pattern.

## Submission

Client-side, in `shared/engine.js`, alongside the existing `logPlay()`/leaderboard submission
code:

```js
function sendFeedback(rating, text) {
  if (!LEADERBOARD_URL) return;
  let savedName = "";
  try { savedName = localStorage.getItem(NAME_KEY) || ""; } catch {}
  fetch(LEADERBOARD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      type: "feedback",
      game: GAME.leaderboardGame,
      rating: rating,
      text: text || "",
      name: savedName,
    }),
  }).catch(() => {});
}
```

No loading UI is shown; the modal closes synchronously and the fetch resolves in the background.

## Backend (`leaderboard-apps-script.js`)

Add a new branch in `doPost` for `data.type === "feedback"`. Unlike `Scores`/`PlayLog` (which
are per-game tabs via `sheetNamesFor_`), feedback goes into a **single shared tab**, `"Feedback"`,
covering both games, distinguished by a `Game` column:

```js
function getFeedbackSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Feedback");
  if (!sheet) {
    sheet = ss.insertSheet("Feedback");
    sheet.appendRow(["Timestamp", "Game", "Rating", "Text", "Name"]);
  }
  return sheet;
}

// inside doPost, before the existing per-game branches:
if (data.type === "feedback") {
  const sheet = getFeedbackSheet_();
  sheet.appendRow([
    new Date(),
    game,
    Number(data.rating) || 0,
    String(data.text || "").slice(0, 1000),
    name,
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

`game` and `name` reuse the existing parsing already at the top of `doPost` (`data.game === "capitals" ? "capitals" : "flags"`, and the 24-char-clamped `name`).

## Edge cases

- **`LEADERBOARD_URL` unset** (local/offline dev): `sendFeedback` no-ops, same guard as
  `logPlay()`.
- **Empty feedback text**: still sends, with `text: ""` — a bare rating is still useful signal.
- **Practice mode**: no special-casing; the prompt fires the same as a normal run.
- **Repeat games without reaching the trigger**: `plays` counter already persists across
  sessions via localStorage, so partial progress toward the 4th completion isn't lost.

## Testing

- Extend `leaderboard-apps-script.test.js` with a case that POSTs `type: "feedback"` and asserts
  a row lands in the `Feedback` tab with the expected columns, independent of `game`.
- Manual verification in-browser: play through 4 end screens on a fresh localStorage profile,
  confirm the card appears on the 4th, confirm star tap → modal → send hides the card
  permanently and does not reappear on a 5th run; confirm X-dismiss also hides it permanently
  without a network call (verify via network tab).
