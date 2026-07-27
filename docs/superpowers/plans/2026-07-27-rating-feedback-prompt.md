# Rating & Feedback Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players rate each game 1-5 stars and optionally leave free-text feedback from the end screen, after their 4th completed game, logged to a new "Feedback" tab in the existing leaderboard Google Sheet.

**Architecture:** A small inline card on the shared end screen (`shared/template.html`) shows 5 stars once a per-game localStorage play counter hits 4. Tapping a star opens a modal (reusing the existing arcade-sheet/backdrop overlay pattern) with an optional textarea; closing the modal any way fires a single fire-and-forget POST to the existing Apps Script leaderboard endpoint, mirroring the existing `logPlay()` pattern in `shared/engine.js`. The Apps Script backend (`leaderboard-apps-script.js`) gets one new `doPost` branch that appends to a shared `Feedback` sheet tab (not per-game, distinguished by a `Game` column). Both games (`flag-master`, `capital-master`) share this code via the existing build pipeline (`build.js` stamps `shared/template.html` + `shared/engine.js` + `shared/styles.css` into `index.html` / `capital-master/index.html`).

**Tech Stack:** Vanilla JS/HTML/CSS (no framework, no bundler), Google Apps Script (`leaderboard-apps-script.js`) deployed via clasp/GitHub Actions, plain Node `assert`-based tests (no test framework/runner).

## Global Constraints

- English copy only — no `pt` localization for this feature (per spec).
- No loading state anywhere in the rating/feedback flow — sends are fire-and-forget, UI updates synchronously.
- Trigger, "already rated", and "dismissed" state are tracked **per game** via each game's existing `GAME.storagePrefix` — never combined across games.
- Fires regardless of practice mode (no special-casing).
- Feedback data goes into a **single shared `"Feedback"` sheet tab** (not per-game like `Scores`/`PlayLog`), with a `Game` column to distinguish rows.
- Reuse existing patterns/CSS classes (`arcade-backdrop`/`arcade-sheet` overlay, `.btn`, `var(--surface)`/`var(--line)`/`var(--gold)` etc.) rather than inventing new ones.
- Generated files `index.html` and `capital-master/index.html` are build output — never hand-edit them; always regenerate via `node build.js` after touching `shared/*`.

---

### Task 1: Apps Script — Feedback sheet + `doPost` branch

**Files:**
- Modify: `leaderboard-apps-script.js`
- Modify: `leaderboard-apps-script.test.js`

**Interfaces:**
- Produces: `doPost` now handles `data.type === "feedback"` — POST body `{ type: "feedback", game, rating, text, name }` → appends `[Timestamp, Game, Rating, Text, Name]` to a sheet tab named `"Feedback"`, returns `{ ok: true }`.
- Produces: `module.exports` now also includes `doPost` (previously only `sheetNamesFor_`, `getSortedAll_`), for testing.

- [ ] **Step 1: Add `getFeedbackSheet_()` and wire it into `doPost`**

In `leaderboard-apps-script.js`, add this function right after `getPlayLogSheet_` (after line 39):

```js
// Feedback is a single shared tab across both games (unlike Scores/PlayLog,
// which are per-game) — rows are distinguished by the Game column.
function getFeedbackSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Feedback");
  if (!sheet) {
    sheet = ss.insertSheet("Feedback");
    sheet.appendRow(["Timestamp", "Game", "Rating", "Text", "Name"]);
  }
  return sheet;
}
```

Then, inside `doPost` (after the existing `if (data.type === "rename") { ... }` block, which ends around line 91, and before `const sheet = getSheet_(game);` on line 93), add:

```js
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

This reuses the `game` and `name` variables already parsed at the top of `doPost` (lines 66-71).

- [ ] **Step 2: Export `doPost` for testing**

At the bottom of `leaderboard-apps-script.js`, change:

```js
if (typeof module !== "undefined") {
  module.exports = { sheetNamesFor_, getSortedAll_ };
}
```

to:

```js
if (typeof module !== "undefined") {
  module.exports = { sheetNamesFor_, getSortedAll_, doPost };
}
```

- [ ] **Step 3: Write the failing test for the feedback branch**

Append to the end of `leaderboard-apps-script.test.js` (after the existing assertions, before nothing — it's currently the last lines of the file):

```js
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
```

- [ ] **Step 4: Run the test to verify it currently fails**

Run: `node leaderboard-apps-script.test.js`

Expected: FAILS (or throws) — `doPost` isn't exported / `getFeedbackSheet_` doesn't exist yet, if you run this before Steps 1-2. If you've already done Steps 1-2, skip this verification step and go straight to Step 5 (this is a backend script, not a strict TDD red/green loop, since Steps 1-2 and 3 are naturally written together).

- [ ] **Step 5: Run the test to verify it passes**

Run: `node leaderboard-apps-script.test.js`

Expected output:
```
All leaderboard-apps-script tests passed
All feedback tests passed
```

- [ ] **Step 6: Commit**

```bash
git add leaderboard-apps-script.js leaderboard-apps-script.test.js
git commit -m "feat: add feedback sheet branch to leaderboard Apps Script"
```

---

### Task 2: Client — rating card, feedback modal, trigger logic

**Files:**
- Modify: `shared/template.html`
- Modify: `shared/styles.css`
- Modify: `shared/engine.js`

**Interfaces:**
- Consumes: `GAME.storagePrefix`, `GAME.leaderboardGame`, `LEADERBOARD_URL`, `NAME_KEY`, `PLAYS_KEY`, `$()`, `track()` — all already defined earlier in `shared/engine.js`.
- Produces: `sendFeedback(rating, text)`, `updateRatingCard(plays)`, `openFeedbackModal(rating)`, `closeFeedbackModal()`, `renderFeedbackStars(rating)`, `sendFeedbackAndClose()` — internal to `engine.js`, not consumed elsewhere.

- [ ] **Step 1: Add the inline rating card markup to the end screen**

In `shared/template.html`, inside the `<!-- END -->` section, insert this new block right before the `<div class="share-row">` line (currently line 166):

```html
      <div class="rating-card" id="rating-card" style="display:none">
        <button class="rating-dismiss" id="rating-dismiss" aria-label="Dismiss">✕</button>
        <div class="rating-prompt">Enjoying the game?</div>
        <div class="rating-stars" id="rating-stars">
          <button class="star-btn" data-rating="1" aria-label="Rate 1 star">★</button>
          <button class="star-btn" data-rating="2" aria-label="Rate 2 stars">★</button>
          <button class="star-btn" data-rating="3" aria-label="Rate 3 stars">★</button>
          <button class="star-btn" data-rating="4" aria-label="Rate 4 stars">★</button>
          <button class="star-btn" data-rating="5" aria-label="Rate 5 stars">★</button>
        </div>
      </div>
```

- [ ] **Step 2: Add the feedback modal markup**

In `shared/template.html`, right after the existing arcade overlay block (after the `</div>` that closes `#arcade-sheet`, currently line 24, and before `<div id="flag-bg" ...>` on line 25), insert:

```html
<div id="feedback-backdrop" class="arcade-backdrop"></div>
<div id="feedback-sheet" class="arcade-sheet feedback-sheet">
  <div class="arcade-grip"></div>
  <div class="feedback-modal-stars" id="feedback-modal-stars"></div>
  <textarea id="feedback-text" class="feedback-textarea" placeholder="Anything we should improve? (optional)" maxlength="500"></textarea>
  <button class="btn" id="feedback-send">Send</button>
</div>
```

- [ ] **Step 3: Add CSS for the rating card**

In `shared/styles.css`, right after the `.share-row { ... }` rule (currently line 452), add:

```css
  .rating-card {
    background: var(--surface); border: 1px solid var(--line); border-radius: 15px;
    padding: 16px; margin-bottom: 22px; position: relative; text-align: center;
  }
  .rating-dismiss {
    position: absolute; top: 8px; right: 8px; width: 26px; height: 26px;
    border-radius: 50%; border: 0; background: none; color: var(--muted);
    cursor: pointer; display: grid; place-items: center; font-size: 13px;
    transition: background .15s, color .15s;
  }
  .rating-dismiss:hover { background: var(--surface-2); color: var(--text); }
  .rating-prompt { font-size: 13.5px; font-weight: 600; margin-bottom: 10px; }
  .rating-stars { display: flex; gap: 6px; justify-content: center; }
  .star-btn {
    border: 0; background: none; cursor: pointer; font-size: 26px; line-height: 1;
    color: var(--line); padding: 2px; transition: transform .15s, color .15s;
  }
  .star-btn:hover { color: var(--gold); transform: translateY(-2px); }
```

- [ ] **Step 4: Add CSS for the feedback modal**

In `shared/styles.css`, right after the rating card CSS just added, add:

```css
  .feedback-sheet { text-align: center; }
  .feedback-modal-stars {
    font-size: 30px; letter-spacing: 6px; margin-bottom: 14px; color: var(--line);
  }
  .feedback-modal-stars .modal-star.filled { color: var(--gold); }
  .feedback-textarea {
    display: block; width: 100%; min-height: 90px; resize: vertical; box-sizing: border-box;
    background: var(--surface-2); border: 1px solid var(--line); border-radius: 12px;
    padding: 12px 14px; color: var(--text); font-family: inherit; font-size: 14px;
    outline: none; transition: border-color .15s; margin-bottom: 14px;
  }
  .feedback-textarea:focus { border-color: var(--accent); }
  #feedback-send { width: 100%; }
```

- [ ] **Step 5: Add trigger/state logic to `engine.js` — extract the plays counter**

In `shared/engine.js`, replace the existing `endGame()` tail and `updateCrossPromo()` function. Find this block (currently lines 360, 363-368):

```js
  updateCrossPromo();
}

// Only pitch the sibling game once a player has finished a couple of runs here first.
function updateCrossPromo() {
  let plays = 0;
  try { plays = parseInt(localStorage.getItem(PLAYS_KEY) || "0", 10) + 1; localStorage.setItem(PLAYS_KEY, plays); } catch {}
  $("cross-promo").style.display = plays >= 2 ? "" : "none";
}
```

Replace it with:

```js
  let plays = 0;
  try { plays = parseInt(localStorage.getItem(PLAYS_KEY) || "0", 10) + 1; localStorage.setItem(PLAYS_KEY, plays); } catch {}
  updateCrossPromo(plays);
  updateRatingCard(plays);
}

// Only pitch the sibling game once a player has finished a couple of runs here first.
function updateCrossPromo(plays) {
  $("cross-promo").style.display = plays >= 2 ? "" : "none";
}
```

This moves the play-counter increment out of `updateCrossPromo` and into `endGame`, so both `updateCrossPromo` and the new `updateRatingCard` (added next) see the same up-to-date count without double-incrementing.

- [ ] **Step 6: Add the rating/feedback state, trigger, and submission functions**

In `shared/engine.js`, add these new constants near the other `*_KEY` constants (right after `const PLAYS_KEY = ...;` on line 31):

```js
const RATING_GIVEN_KEY = `${GAME.storagePrefix}-rating-given`;
const RATING_DISMISSED_KEY = `${GAME.storagePrefix}-rating-dismissed`;
```

Then add the following new functions right after `updateCrossPromo` (which you just edited in Step 5):

```js
function updateRatingCard(plays) {
  let given = false, dismissed = false;
  try {
    given = localStorage.getItem(RATING_GIVEN_KEY) === "1";
    dismissed = localStorage.getItem(RATING_DISMISSED_KEY) === "1";
  } catch {}
  $("rating-card").style.display = (plays >= 4 && !given && !dismissed) ? "" : "none";
}

let pendingRating = null;

function renderFeedbackStars(rating) {
  $("feedback-modal-stars").innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="modal-star ${i < rating ? "filled" : ""}">★</span>`).join("");
}

function openFeedbackModal(rating) {
  pendingRating = rating;
  try { localStorage.setItem(RATING_GIVEN_KEY, "1"); } catch {}
  $("rating-card").style.display = "none";
  renderFeedbackStars(rating);
  $("feedback-text").value = "";
  $("feedback-backdrop").classList.add("show");
  $("feedback-sheet").classList.add("show");
}

function closeFeedbackModal() {
  $("feedback-backdrop").classList.remove("show");
  $("feedback-sheet").classList.remove("show");
}

// Fire-and-forget, mirrors logPlay(): no loading state, the modal closes
// synchronously and this resolves in the background.
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

function sendFeedbackAndClose() {
  if (pendingRating === null) { closeFeedbackModal(); return; }
  const text = $("feedback-text").value.trim().slice(0, 500);
  sendFeedback(pendingRating, text);
  pendingRating = null;
  closeFeedbackModal();
}
```

- [ ] **Step 7: Wire up event listeners**

In `shared/engine.js`, add these listeners right after the existing `$("lb-name").addEventListener(...)` line (currently line 631):

```js
$("rating-stars").addEventListener("click", e => {
  const btn = e.target.closest(".star-btn");
  if (!btn) return;
  openFeedbackModal(Number(btn.dataset.rating));
});
$("rating-dismiss").addEventListener("click", () => {
  try { localStorage.setItem(RATING_DISMISSED_KEY, "1"); } catch {}
  $("rating-card").style.display = "none";
});
$("feedback-send").addEventListener("click", sendFeedbackAndClose);
$("feedback-backdrop").addEventListener("click", sendFeedbackAndClose);
```

- [ ] **Step 8: Rebuild both games**

Run: `node build.js`

Expected output:
```
Built <repo-root>/index.html
Built <repo-root>/capital-master/index.html
```

- [ ] **Step 9: Manually verify in a browser**

Start a local static server (e.g. `npx serve .` or `python3 -m http.server 8080`) and open the built `index.html`.

1. Open DevTools → Application → Local Storage, and clear any `flagmaster-*` keys for a clean run.
2. Play and finish 3 games. Confirm no rating card appears on the end screen for games 1-3.
3. Play and finish a 4th game. Confirm the rating card ("Enjoying the game?" + 5 stars) now appears near the share-row.
4. Tap a star (e.g. 3). Confirm: the inline card disappears, a modal opens showing 3 filled stars, a textarea, and a "Send" button — with no loading spinner or delay.
5. Type some text and tap "Send". Confirm the modal closes immediately. In the Network tab, confirm a POST fired to the Apps Script URL with `type: "feedback"`, the right `rating`/`text`/`game`.
6. Play and finish a 5th game. Confirm the rating card does **not** reappear (rated already).
7. Clear localStorage again, repeat through the 4th-game trigger, but this time tap the "✕" dismiss button instead of a star. Confirm the card disappears with no network request, and does not reappear on a 5th game.
8. Repeat steps 1-4 for `capital-master/index.html` to confirm the per-game counter and card are independent (Capital Master shouldn't be affected by Flag Master's localStorage state, and vice versa).

- [ ] **Step 10: Commit**

```bash
git add shared/template.html shared/styles.css shared/engine.js index.html capital-master/index.html
git commit -m "feat: add end-screen rating and feedback prompt"
```

---

### Task 3: Open the pull request

**Files:** none (repo-level action)

- [ ] **Step 1: Push the branch (if not already up to date)**

```bash
git push
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Add end-screen rating & feedback prompt" --body "$(cat <<'EOF'
## Summary
- Adds a 1-5 star rating + optional text feedback prompt to the end screen, per game, triggered after each game's 4th completed run
- Fire-and-forget submission to the existing leaderboard Apps Script endpoint, logged to a new shared "Feedback" sheet tab
- Rating/dismiss state persists in localStorage per game — shown once, never again after rating or dismissing

## Test plan
- [x] `node leaderboard-apps-script.test.js` passes (new feedback-branch test included)
- [x] Manually verified in-browser: card appears on 4th completion, star tap opens modal and sends fire-and-forget with no loading state, dismiss (✕) hides permanently with no network call, state is independent between Flag Master and Capital Master

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Report the PR URL back to the user.
