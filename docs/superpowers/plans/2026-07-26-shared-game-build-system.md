# Shared Game Build System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the copy-pasted `index.html` (Flag Master) and `capital-master/index.html` (Capital Master) with a small Node build step that assembles each game's single-file `index.html` from shared source (`shared/engine.js`, `shared/styles.css`, `shared/template.html`, `shared/arcade-menu.js`) plus a per-game `game.js`/`background.js` and a `games.json` registry entry — so a third game only needs a config file, not a copy-pasted HTML file.

**Architecture:** `engine.js` owns 100% of the generic game loop (streaks, lives, timer, scoring, practice mode, leaderboard fetch/submit/render, PostHog tracking, theme toggle, arcade sheet) and calls a fixed set of hooks + reads a fixed set of config fields exported by each game's `game.js`. `build.js` inlines `styles.css` + game CSS + `template.html` + `engine.js` + `arcade-menu.js` + `game.js` + `background.js` into a single deployable `index.html` per `games.json` entry. Generated files are committed to git; GitHub Pages/Netlify hosting is unchanged.

**Tech Stack:** Plain Node.js (no npm dependencies), vanilla JS/CSS/HTML — matches the existing project. There is no frontend test runner in this repo (`leaderboard-apps-script.test.js` only covers the Apps Script backend); verification for every task in this plan is (a) `node build.js` running without error, (b) a diff of generated output against the current source for logic equivalence, and (c) manual browser verification per this project's standing workflow — test in-browser and get explicit go-ahead before pushing.

## Global Constraints

- No new npm dependencies. `build.js` uses only Node built-ins (`fs`, `path`).
- Generated `index.html` files must remain single, self-contained static files — no `<script src>`/`<link>` to other repo files at runtime.
- No changes to `leaderboard-apps-script.js`, `.github/workflows/deploy-apps-script.yml`, `netlify.toml`, or GitHub Pages configuration.
- Preserve existing localStorage keys, PostHog event names/properties, and the leaderboard `?game=` values exactly, so historical data and dashboards keep working.
- All work happens on a feature branch; the final task opens a PR (do not push to `main` directly).

---

## File Structure

```
games.json                          # registry: id, storagePrefix, leaderboardGame, url, outputDir, enabled, ...
shared/
  template.html                     # HTML shell with {{...}} placeholders
  styles.css                        # shared CSS (everything except background-layer + option-button rules)
  engine.js                         # generic game loop, calls game.js hooks
  arcade-menu.js                    # renders "more games" sheet + cross-promo card from games.json
games/
  flag-master/
    game.js                         # config + hooks + COUNTRIES data
    background.js                   # buildBackground(container) — drifting flag tiles
  capital-master/
    game.js                         # config + hooks + COUNTRIES(+capital) + OTHER_CITIES
    background.js                   # buildBackground(container) — world map + capital dots
build.js                            # Node build script
index.html                          # generated (flag-master, outputDir ".")
capital-master/index.html           # generated
```

`capital-master/flags/` is deleted; both generated pages reference the single root `/flags/` directory via relative path (`flags/<code>.png` from root, `../flags/<code>.png` from `capital-master/`).

---

## Task 1: Create feature branch and `games.json` registry

**Files:**
- Create: `games.json`

**Interfaces:**
- Produces: `games.json` — an array of game registry entries, each with fields `id`, `enabled`, `outputDir`, `url`, `icon`, `title`, `tagline`, `storagePrefix`, `leaderboardGame`, `analyticsId`, `gameUrl`, `crossPromoUrl`, `crossPromoTargetId`, `crossPromoHeading`, `crossPromoBody`. Later tasks (`build.js`, `shared/arcade-menu.js`, each `game.js`) read this file.

- [ ] **Step 1: Create and check out a feature branch**

```bash
git checkout -b shared-game-build-system
```

- [ ] **Step 2: Write `games.json`**

```json
[
  {
    "id": "flag-master",
    "enabled": true,
    "outputDir": ".",
    "url": "/",
    "icon": "🌍",
    "title": "Flag&nbsp;Master",
    "titlePlain": "Flag Master",
    "tagline": "How many flags of the world do you actually know? Prove it.",
    "storagePrefix": "flagmaster",
    "leaderboardGame": "flags",
    "analyticsId": "flags",
    "gameUrl": "https://vitoraa.github.io/flag-master/",
    "crossPromoUrl": "capital-master/",
    "crossPromoTargetId": "capital-master",
    "crossPromoHeading": "Know your capitals too?",
    "crossPromoBody": "Try Capital Master — same streaks, new map"
  },
  {
    "id": "capital-master",
    "enabled": true,
    "outputDir": "capital-master",
    "url": "capital-master/",
    "icon": "🏛️",
    "title": "Capital&nbsp;Master",
    "titlePlain": "Capital Master",
    "tagline": "How many capital cities of the world do you actually know? Prove it.",
    "storagePrefix": "capitalmaster",
    "leaderboardGame": "capitals",
    "analyticsId": "capital-master",
    "gameUrl": "https://vitoraa.github.io/flag-master/capital-master/",
    "crossPromoUrl": "../",
    "crossPromoTargetId": "flags",
    "crossPromoHeading": "Know your flags too?",
    "crossPromoBody": "Try Flag Master — same streaks, new challenge"
  },
  {
    "id": "math-master",
    "enabled": false,
    "icon": "🔢",
    "title": "Math&nbsp;Master",
    "titlePlain": "Math Master",
    "tagline": "Coming soon"
  }
]
```

- [ ] **Step 3: Verify it parses**

Run: `node -e "console.log(require('./games.json').map(g => g.id))"`
Expected: `[ 'flag-master', 'capital-master', 'math-master' ]`

- [ ] **Step 4: Commit**

```bash
git add games.json
git commit -m "feat: add games.json registry"
```

---

## Task 2: Create `shared/template.html`

**Files:**
- Create: `shared/template.html`
- Reference (read-only, do not modify yet): `index.html` (current committed version)

**Interfaces:**
- Produces: `shared/template.html` — the full HTML document from `<!DOCTYPE html>` to `</html>`, with these placeholders `build.js` will substitute per game: `{{TITLE_HTML}}` (e.g. `Flag&nbsp;Master`), `{{TITLE_PLAIN}}` (e.g. `Flag Master`), `{{TAGLINE}}`, `{{DOC_TITLE}}` (e.g. `Flag Master — how many flags do you know?`), `{{INITIAL_THEME}}` (`light`/`dark`), `{{PROD_HOST_CHECK}}` (a JS boolean expression), `{{ITEM_COUNT}}` (e.g. `195`), `{{UNIT_SINGULAR}}`, `{{UNIT_PLURAL}}`, `{{PROMPT_COUNTER_LABEL}}`, `{{CROSS_PROMO_HEADING}}`, `{{CROSS_PROMO_BODY}}`, `{{TOTAL_ALL_DIFFICULTY}}` (e.g. `All 195`), `{{PRACTICE_CFG_LABEL}}` (`Flags`/`Countries`), and `<!--GAME_SCRIPT-->` (where the game's own `<script>` content is inserted, after `engine.js`).

- [ ] **Step 1: Copy `index.html` to `shared/template.html` as the starting point**

```bash
mkdir -p shared games/flag-master games/capital-master
cp index.html shared/template.html
```

- [ ] **Step 2: Replace the PostHog head block's host check and document title**

In `shared/template.html`, replace lines 6 and 9-10 (the `<title>` tag and the `isProdHost` check):

```html
<title>{{DOC_TITLE}}</title>
```
```js
  const isProdHost = {{PROD_HOST_CHECK}};
```

(`build.js`, written in Task 6, will supply a per-game boolean expression string for `{{PROD_HOST_CHECK}}`.)

- [ ] **Step 3: Set the initial theme attribute**

Change `<html lang="en" data-theme="light">` (line 2) to:
```html
<html lang="en" data-theme="{{INITIAL_THEME}}">
```

- [ ] **Step 4: Delete the entire `<style>` block**

Delete everything from the `<style>` line to the matching `</style>` line (the full block currently at index.html:15-552). `build.js` will inject `shared/styles.css` plus the game's own CSS in its place. Leave a single line in that spot:
```html
<style>{{GAME_CSS}}</style>
```

- [ ] **Step 5: Parameterize the START screen hero markup**

Replace the hero block (originally around line 582-587):
```html
      <span class="badge"><span class="dot"></span>{{ITEM_COUNT}} countries · one shot</span>
      <h1>{{TITLE_HTML}}</h1>
      <p class="tag">{{TAGLINE}}</p>
      <div class="personal-best" id="personal-best" style="display:none">
        🏆 Your best: <b id="pb-flags">0</b> {{UNIT_PLURAL}} · <b id="pb-score">0</b> pts
      </div>
```

And the first rule line (originally `Spot the right flag out of <b>4 options</b>`):
```html
          <span class="txt">Spot the right {{UNIT_SINGULAR}} out of <b>4 options</b></span>
```

- [ ] **Step 6: Parameterize the PRACTICE SETUP screen**

Replace the difficulty `cfg-row` block (originally around line 641-647):
```html
        <div class="cfg-row">
          <span class="cfg-label">{{PRACTICE_CFG_LABEL}}</span>
          <div class="seg" data-cfg="difficulty">
            <button class="seg-btn active" data-value="easy" type="button">Easy only</button>
            <button class="seg-btn" data-value="all" type="button">{{TOTAL_ALL_DIFFICULTY}}</button>
          </div>
        </div>
```

- [ ] **Step 7: Parameterize the GAME screen prompt**

The `<h2 id="country-name"></h2>` stays as-is (engine.js sets its text at runtime via the `renderPrompt` hook — no template change needed here beyond what already exists).

- [ ] **Step 8: Parameterize the END screen stat label and cross-promo card**

Replace the "Flags" stat label (originally `<div class="stat"><b id="stat-flags">0</b><span>Flags</span></div>`):
```html
        <div class="stat"><b id="stat-flags">0</b><span id="stat-flags-label"></span></div>
```
(engine.js sets `stat-flags-label`'s text from `game.unitPlural` at runtime, capitalized — simpler than templating capitalization at build time.)

Replace the cross-promo card text (originally the two `promo-h`/`promo-s` lines):
```html
          <div class="promo-h">{{CROSS_PROMO_HEADING}}</div>
          <div class="promo-s">{{CROSS_PROMO_BODY}}</div>
```

- [ ] **Step 9: Replace the game `<script>` block with an insertion point**

Delete the entire second `<script>...</script>` block (originally index.html:727-1501) and replace with:
```html
<script>
<!--GAME_SCRIPT-->
</script>
```

- [ ] **Step 10: Sanity-check no leftover game-specific text remains**

Run: `grep -n "Flag Master\|flagmaster\|drifting flag field" shared/template.html`
Expected: no output (empty).

- [ ] **Step 11: Commit**

```bash
git add shared/template.html
git commit -m "feat: extract parameterized HTML template"
```

---

## Task 3: Create `shared/styles.css`

**Files:**
- Create: `shared/styles.css`
- Reference: `index.html` (current committed version, lines 15-552)

**Interfaces:**
- Produces: `shared/styles.css` — all CSS from the current `index.html:15-552` **except** the two game-specific blocks listed below, which move to each game's `game.js` `css` field (Tasks 7 and 9).
- Excluded block A — background layer (`index.html:64-83`, the comment `/* ---------- drifting flag field (start screen only) ---------- */` through the closing `}` of `@media (prefers-reduced-motion: reduce) { #flag-bg .fl { animation: none; } }`).
- Excluded block B — option buttons (`index.html:362-385`, `.flag-btn` through the `@keyframes shake` rule — but **keep** `@keyframes shake` itself in `shared/styles.css` since both games reuse the same animation name; only the `.flag-btn*` selectors move out).

- [ ] **Step 1: Copy the CSS body into the new file**

```bash
sed -n '16,551p' index.html > shared/styles.css
```
(this captures everything between the `<style>` and `</style>` lines of the original file)

- [ ] **Step 2: Remove excluded block A (background layer)**

Delete these lines from `shared/styles.css` (originally index.html:64-83, now shifted by -15 in the new file — locate by content, not line number, since exact offsets shift):
```css
  /* ---------- drifting flag field (start screen only) ---------- */
  #flag-bg { position: fixed; inset: -6%; z-index: 0; overflow: hidden; pointer-events: none; }
  #flag-bg .fl {
    position: absolute; aspect-ratio: 3 / 2; border-radius: 8px; overflow: hidden;
    box-shadow: 0 14px 34px -10px rgba(0,0,0,.7);
    will-change: transform; filter: saturate(1.1);
    animation: drift var(--d) ease-in-out var(--delay) infinite alternate;
  }
  #flag-bg .fl img { width: 100%; height: 100%; object-fit: cover; display: block; }
  #flag-bg .veil {
    position: absolute; inset: 0;
    background:
      radial-gradient(900px 620px at 50% 42%, rgba(6,7,13,.42), rgba(6,7,13,.8) 78%),
      linear-gradient(180deg, rgba(6,7,13,.32), rgba(6,7,13,.74));
  }
  @keyframes drift {
    from { transform: translate(0,0) rotate(var(--r1)); }
    to   { transform: translate(var(--tx), var(--ty)) rotate(var(--r2)); }
  }
  @media (prefers-reduced-motion: reduce) {
    #flag-bg .fl { animation: none; }
  }
```
Keep an empty `#flag-bg { position: fixed; inset: -6%; z-index: 0; overflow: hidden; pointer-events: none; }` rule in `shared/styles.css` (the container itself is generic — only its child `.fl`/veil/animation rules are flag-specific). Both games' `css` fields will define their own children of `#flag-bg` (or, for capital-master, an `#world-map` element inside it).

- [ ] **Step 3: Remove excluded block B (option buttons), keep `@keyframes shake`**

Delete only these lines (leave `@keyframes shake` in place):
```css
  .flag-btn {
    border: 2px solid var(--line); border-radius: 16px; overflow: hidden;
    background: var(--surface); cursor: pointer; padding: 0;
    aspect-ratio: 4 / 2.7; position: relative;
    transition: transform .14s cubic-bezier(.2,.8,.2,1), border-color .15s, box-shadow .15s;
  }
  .flag-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .flag-btn::after {
    content: ""; position: absolute; inset: 0; border-radius: 14px;
    box-shadow: inset 0 0 40px rgba(0,0,0,.25); pointer-events: none;
  }
  .flag-btn:not(:disabled):hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 12px 30px -10px rgba(108,140,255,.5); }
  .flag-btn .mark {
    position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%;
    display: grid; place-items: center; opacity: 0; transform: scale(.5);
    transition: opacity .2s, transform .2s; z-index: 2;
  }
  .flag-btn.correct { border-color: var(--good); box-shadow: 0 0 0 1px var(--good), 0 12px 30px -8px rgba(47,224,160,.5); }
  .flag-btn.correct .mark { opacity: 1; transform: scale(1); background: var(--good); color: #04241a; }
  .flag-btn.wrong { border-color: var(--bad); animation: shake .4s; }
  .flag-btn.wrong .mark { opacity: 1; transform: scale(1); background: var(--bad); color: #2a0710; }
  .flag-btn:disabled { cursor: default; }
  .flag-btn.dim { opacity: .3; }
```
Also check for the light-theme override `:root[data-theme="light"] .flag-btn::after { box-shadow: inset 0 0 30px rgba(0,0,0,.12); }` (search for `.flag-btn::after` in the light-theme section) and remove it too — it moves into the per-game CSS alongside the rest of `.flag-btn`.

- [ ] **Step 4: Verify no game-specific selectors remain**

Run: `grep -n "flag-btn\|#flag-bg \.fl\|drift" shared/styles.css`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add shared/styles.css
git commit -m "feat: extract shared CSS"
```

---

## Task 4: Create `shared/engine.js`

**Files:**
- Create: `shared/engine.js`
- Reference: `index.html` (current committed version, lines 727-1501)

**Interfaces:**
- Consumes: a global `GAME` object (assigned by the per-game script, inserted by `build.js` *before* `engine.js` in the final output) with this shape — this is the full, final `game.js` contract used by all later tasks:
  ```js
  window.GAME = {
    id, storagePrefix, leaderboardGame, analyticsId, gameUrl, crossPromoUrl,
    unitSingular, unitPlural, promptCounterLabel,          // e.g. "flag", "flags", "Flag"
    levels,                                                 // {1:"Warming up",2:"Getting tricky",3:"...",4:"Very hard"}
    items,                                                  // array of per-item tuples, shape is game-defined
    pickDistractors(answer, items),                         // -> array of up to 3 distractor items
    renderPrompt(item),                                     // sets DOM for the question (qnum/country-name/etc.)
    renderOption(item),                                     // -> HTML string for one answer button
    optionKey(item),                                        // -> string/value used to grade a click
    wrongAnswerText(item),                                  // -> string, e.g. "That flag is France"
    buildBackground(container),                              // renders the ambient start-screen background
  };
  ```
- Produces: all the generic functions from the current engine (see step list) available as top-level identifiers in the final page, unchanged in behavior from today's `index.html`.

- [ ] **Step 1: Copy the entire game script into the new file**

```bash
sed -n '728,1500p' index.html > shared/engine.js
```
(this captures everything between the two `<script>`/`</script>` tags of the game logic, excluding the tags themselves)

- [ ] **Step 2: Remove game-specific data and replace with `GAME` reads**

Delete the `ICON` object's definition is NOT game-specific — keep it. Delete these game-specific declarations (search and remove):
```js
// [code, name, tier]  tier 1 = famous, 2 = medium, 3 = hard, 4 = very hard
const COUNTRIES = [ ... ];   // the whole array, ~50 lines

const ROUND_TIME = 10;
const MAX_LIVES = 3;
const LEVELS = { 1: "Warming up", 2: "Getting tricky", 3: "Flag nerd zone", 4: "Very hard" };

// Paste your deployed Google Apps Script Web App URL here to enable the leaderboard.
const LEADERBOARD_URL = "https://script.google.com/macros/s/AKfycbxiOvdi5JWkd4o6d_1R6Dd392q1xawUz9yOBJASbGKdtxirVVjb-TfU5X0HhjqIrkQ/exec";
const NAME_KEY = "flagmaster-name";
const BEST_KEY = "flagmaster-best";
const GAME_URL = "https://vitoraa.github.io/flag-master/";
const PLAYS_KEY = "flagmaster-games-played";
const CROSS_PROMO_URL = "capital-master/";
```

Replace with, at the top of `shared/engine.js`:
```js
const ROUND_TIME = 10;
const MAX_LIVES = 3;
const LEVELS = GAME.levels;
const LEADERBOARD_URL = "https://script.google.com/macros/s/AKfycbxiOvdi5JWkd4o6d_1R6Dd392q1xawUz9yOBJASbGKdtxirVVjb-TfU5X0HhjqIrkQ/exec";
const NAME_KEY = `${GAME.storagePrefix}-name`;
const BEST_KEY = `${GAME.storagePrefix}-best`;
const GAME_URL = GAME.gameUrl;
const PLAYS_KEY = `${GAME.storagePrefix}-games-played`;
const CROSS_PROMO_URL = GAME.crossPromoUrl;
const THEME_KEY = `${GAME.storagePrefix}-theme`;
const COUNTRIES = GAME.items;
```
(Note `THEME_KEY` moves up here — remove its separate later declaration, originally `const THEME_KEY = "flagmaster-theme";` around index.html:1433.)

- [ ] **Step 3: Replace `flagUrl` with the generic image helper — keep as-is**

`const flagUrl = code => \`flags/${code}.png\`;` stays unchanged (flag image paths are used by both games — capital-master shows a flag image on its prompt too). No change needed.

- [ ] **Step 4: Replace `buildBackground()` call site with the hook**

Find (originally around index.html:1466):
```js
buildBackground();
```
Delete the entire `function buildBackground() { ... }` definition (originally index.html:855-880-ish, the one building `.fl` tile divs) — it moves to each game's `background.js`. Replace the call site with:
```js
GAME.buildBackground($("flag-bg"));
```

- [ ] **Step 5: Replace `pickDistractors` with a default that games can override**

Find the existing `function pickDistractors(answer) { ... }` (tier-based). Replace it with:
```js
function pickDistractors(answer) {
  if (GAME.pickDistractors) return GAME.pickDistractors(answer, COUNTRIES);
  const sameTier = COUNTRIES.filter(c => c !== answer && c[2] === answer[2]);
  const rest = COUNTRIES.filter(c => c !== answer && c[2] !== answer[2]);
  return shuffle(sameTier).slice(0, 3).concat(shuffle(rest)).slice(0, 3);
}
```

- [ ] **Step 6: Replace prompt/option rendering in `nextRound()`**

Find (originally index.html:1003-1020):
```js
function nextRound() {
  if (lives <= 0 || round >= queue.length) return endGame();
  locked = false;
  const answer = queue[round];
  renderHud(answer);
  $("qnum").textContent = `Flag ${round + 1}`;
  $("country-name").textContent = answer[1];
  $("feedback").textContent = "";
  $("feedback").className = "feedback";

  const options = shuffle([answer, ...pickDistractors(answer)]);
  $("options").innerHTML = options.map(c =>
    `<button class="flag-btn" data-code="${c[0]}" aria-label="Guess ${c[1]}">
       <img src="${flagUrl(c[0])}" alt="" draggable="false">
       <span class="mark"></span>
     </button>`).join("");
  document.querySelectorAll(".flag-btn").forEach(b =>
    b.addEventListener("click", () => answerWith(b, answer)));
```

Replace with:
```js
function nextRound() {
  if (lives <= 0 || round >= queue.length) return endGame();
  locked = false;
  const answer = queue[round];
  renderHud(answer);
  $("qnum").textContent = `${GAME.promptCounterLabel} ${round + 1}`;
  GAME.renderPrompt(answer);
  $("feedback").textContent = "";
  $("feedback").className = "feedback";

  const options = shuffle([answer, ...pickDistractors(answer)]);
  $("options").innerHTML = options.map(c => GAME.renderOption(c)).join("");
  $("options").querySelectorAll("button").forEach(b =>
    b.addEventListener("click", () => answerWith(b, answer)));
```

- [ ] **Step 7: Replace answer grading in `lockRound()` and `answerWith()`**

Find `lockRound()` (originally index.html:1046-1058):
```js
function lockRound(answer) {
  locked = true;
  clearInterval(timerId);
  document.querySelectorAll(".flag-btn").forEach(b => {
    b.disabled = true;
    if (b.dataset.code === answer[0]) {
```
Replace `document.querySelectorAll(".flag-btn")` with `$("options").querySelectorAll("button")`, and `b.dataset.code === answer[0]` with `b.dataset.key === GAME.optionKey(answer)`.

Find `answerWith()` (originally index.html:1066-1107). Replace:
```js
  const correct = btn.dataset.code === answer[0];
```
with:
```js
  const correct = btn.dataset.key === GAME.optionKey(answer);
```
and replace:
```js
    setFeedback(`That flag is ${nameOf(btn.dataset.code)}`, "bad");
```
with:
```js
    setFeedback(GAME.wrongAnswerText(answer), "bad");
```

- [ ] **Step 8: Update `GAME.renderOption` contract note — buttons must set `data-key`**

(No engine.js code change here; this is a note for Task 7/9's `renderOption` implementations: each `<button>` returned by `renderOption(item)` must carry `data-key="${GAME.optionKey(item)}"` — e.g. `data-key="${item[0]}"` for flag-master's country code, `data-key="${item[3]}"` for capital-master's capital name — so Step 6/7's generic click and grading logic works for both games.)

- [ ] **Step 9: Replace analytics event names**

Find and replace both occurrences of `"flag_answered"` (originally index.html:1103, 1115) with `GAME.trackAnswerEvent`.

Find and replace `track("arcade_menu_opened", { from: "flags" });` (originally index.html:1455) with `track("arcade_menu_opened", { from: GAME.analyticsId });`.

This specific `track("cross_promo_clicked", ...)` call (originally index.html:1486, inside the end-screen `$("cross-promo")` click handler) is handled separately in Step 14 below, using `GAME.crossPromoTargetId` — do not change it here.

- [ ] **Step 10: Replace `rank()` and `RANK_EMOJI` to use `GAME.titlePlain`**

Find:
```js
function rank(flags) {
  if (flags >= 60) return [ICON.globe, "World Legend", "Do you work at the UN?"];
  if (flags >= 40) return [ICON.crown, "Flag Master", "Genuinely elite. Respect."];
```
Replace the `"Flag Master"` literal with `` `${GAME.titlePlain}` ``:
```js
function rank(flags) {
  if (flags >= 60) return [ICON.globe, "World Legend", "Do you work at the UN?"];
  if (flags >= 40) return [ICON.crown, GAME.titlePlain, "Genuinely elite. Respect."];
```
Find:
```js
const RANK_EMOJI = {
  "World Legend": "🌍", "Flag Master": "🏆", "Globetrotter": "🥇",
  "Traveler": "🥈", "Tourist": "🧳", "Lost Tourist": "🧭",
};
```
Replace with:
```js
const RANK_EMOJI = {
  "World Legend": "🌍", [GAME.titlePlain]: "🏆", "Globetrotter": "🥇",
  "Traveler": "🥈", "Tourist": "🧳", "Lost Tourist": "🧭",
};
```

- [ ] **Step 11: Replace `shareText()`'s unit label and title**

Find (originally index.html:1382-1402):
```js
    `${RANK_EMOJI[title]} Flag Master — ${title}`,
    ``,
    `🎯 ${flagsRight}/${total} flags correct`,
```
Replace with:
```js
    `${RANK_EMOJI[title]} ${GAME.titlePlain} — ${title}`,
    ``,
    `🎯 ${flagsRight}/${total} ${GAME.unitPlural} correct`,
```

- [ ] **Step 12: Update the END screen stat label and hero unit text at render time**

In `endGame()` (originally index.html:1135-1159), after the existing `$("stat-flags").textContent = flagsRight;` line, add:
```js
  $("stat-flags-label").textContent = GAME.unitPlural[0].toUpperCase() + GAME.unitPlural.slice(1);
```
In `renderPersonalBest()` (originally index.html:846-852), after `$("pb-score").textContent = best.score.toLocaleString();`, the existing markup already reads `{{UNIT_PLURAL}}` from the template (Task 2 Step 5) — no JS change needed there since it's static per-page text, not dynamic.

- [ ] **Step 13: Remove the arcade menu's hardcoded single-sibling logic**

Delete the entire block (originally index.html:1447-1464):
```js
/* ---------- arcade menu (more games) ---------- */
$("arcade-trigger").innerHTML = ICON.grid;
function openArcadeSheet() {
  let best = null;
  try { const raw = localStorage.getItem("capitalmaster-best"); best = raw ? JSON.parse(raw) : null; } catch {}
  $("arcade-card-sub").textContent = best ? `Your best: ${best.score.toLocaleString()} pts` : "Not played yet";
  $("arcade-backdrop").classList.add("show");
  $("arcade-sheet").classList.add("show");
  track("arcade_menu_opened", { from: "flags" });
}
function closeArcadeSheet() {
  $("arcade-backdrop").classList.remove("show");
  $("arcade-sheet").classList.remove("show");
}
$("arcade-trigger").addEventListener("click", openArcadeSheet);
$("arcade-backdrop").addEventListener("click", closeArcadeSheet);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeArcadeSheet(); });
$("arcade-card").addEventListener("click", () => track("arcade_menu_clicked", { from: "flags", to: "capital-master" }));
```
Replace with:
```js
/* ---------- arcade menu (more games) ---------- */
$("arcade-trigger").innerHTML = ICON.grid;
function openArcadeSheet() {
  renderArcadeMenu(GAME);
  $("arcade-backdrop").classList.add("show");
  $("arcade-sheet").classList.add("show");
  track("arcade_menu_opened", { from: GAME.analyticsId });
}
function closeArcadeSheet() {
  $("arcade-backdrop").classList.remove("show");
  $("arcade-sheet").classList.remove("show");
}
$("arcade-trigger").addEventListener("click", openArcadeSheet);
$("arcade-backdrop").addEventListener("click", closeArcadeSheet);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeArcadeSheet(); });
```
(`renderArcadeMenu`, which builds the arcade sheet's card list and wires up its own click tracking, is defined in `shared/arcade-menu.js` — Task 5.)

- [ ] **Step 14: Update the cross-promo click handler**

Find (originally index.html:1485-1488):
```js
$("cross-promo").addEventListener("click", () => {
  track("cross_promo_clicked", { from: "flags", to: "capital-master" });
  location.href = CROSS_PROMO_URL;
});
```
Replace with:
```js
$("cross-promo").addEventListener("click", () => {
  track("cross_promo_clicked", { from: GAME.analyticsId, to: GAME.crossPromoTargetId });
  location.href = CROSS_PROMO_URL;
});
```

- [ ] **Step 15: Verify no game-specific literals remain**

Run: `grep -n "Flag Master\|flagmaster\|\"flags\"\|flag_answered\|That flag is" shared/engine.js`
Expected: no output (the string `"flags"` may legitimately appear only inside generic code like `results.filter(r => r === "ok")` comments — inspect any hits manually to confirm they're not game-specific).

- [ ] **Step 16: Commit**

```bash
git add shared/engine.js
git commit -m "feat: extract generic game engine with GAME hook contract"
```

---

## Task 5: Create `shared/arcade-menu.js`

**Files:**
- Create: `shared/arcade-menu.js`

**Interfaces:**
- Consumes: `window.GAMES` (the full parsed `games.json` array, injected by `build.js` before this script), `GAME` (the current page's own entry from that array), `$` (the `id => document.getElementById(id)` helper already defined in `engine.js`, which loads before this file), `track` (the PostHog helper already defined in `engine.js`).
- Produces: `renderArcadeMenu(currentGame)`, called by `shared/engine.js`'s `openArcadeSheet()`.

- [ ] **Step 1: Write the file**

```js
function renderArcadeMenu(currentGame) {
  const others = GAMES.filter(g => g.id !== currentGame.id);
  $("arcade-sheet-cards").innerHTML = others.map(g => {
    if (!g.enabled) {
      return `<div class="arcade-card arcade-card-disabled">
         <span class="arcade-ic">${g.icon}</span>
         <div class="arcade-body">
           <div class="arcade-h">${g.titlePlain}</div>
           <div class="arcade-s">${g.tagline}</div>
         </div>
       </div>`;
    }
    let best = null;
    try { const raw = localStorage.getItem(`${g.storagePrefix}-best`); best = raw ? JSON.parse(raw) : null; } catch {}
    const sub = best ? `Your best: ${best.score.toLocaleString()} pts` : "Not played yet";
    return `<a class="arcade-card" href="${g.url}" data-to="${g.analyticsId}">
       <span class="arcade-ic">${g.icon}</span>
       <div class="arcade-body">
         <div class="arcade-h">${g.titlePlain}</div>
         <span class="arcade-s">${sub}</span>
       </div>
       <span class="arcade-go">→</span>
     </a>`;
  }).join("");
  $("arcade-sheet-cards").querySelectorAll("[data-to]").forEach(el => {
    el.addEventListener("click", () => track("arcade_menu_clicked", { from: currentGame.analyticsId, to: el.dataset.to }));
  });
}
```

- [ ] **Step 2: Update `shared/template.html` to hold a container for the generated cards**

The current arcade sheet markup (search `arcade-card` in `shared/template.html`) has a single hardcoded card with `id="arcade-card"` and `id="arcade-card-sub"`. Replace that single `<a class="arcade-card" ...>...</a>` element with an empty container:
```html
      <div id="arcade-sheet-cards"></div>
```

- [ ] **Step 3: Commit**

```bash
git add shared/arcade-menu.js shared/template.html
git commit -m "feat: generate arcade menu from games.json registry"
```

---

## Task 6: Write `build.js`

**Files:**
- Create: `build.js`

**Interfaces:**
- Consumes: `games.json`, `shared/template.html`, `shared/styles.css`, `shared/engine.js`, `shared/arcade-menu.js`, `games/<id>/game.js`, `games/<id>/background.js` (all produced by Tasks 1-5, 7, 9).
- Produces: `<outputDir>/index.html` for every `enabled: true` entry in `games.json`.

- [ ] **Step 1: Write the script**

```js
#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = __dirname;
const games = JSON.parse(fs.readFileSync(path.join(root, "games.json"), "utf8"));
const template = fs.readFileSync(path.join(root, "shared/template.html"), "utf8");
const sharedCss = fs.readFileSync(path.join(root, "shared/styles.css"), "utf8");
const engineJs = fs.readFileSync(path.join(root, "shared/engine.js"), "utf8");
const arcadeJs = fs.readFileSync(path.join(root, "shared/arcade-menu.js"), "utf8");

const gamesJsonLiteral = JSON.stringify(games);

for (const game of games.filter(g => g.enabled)) {
  const gameDir = path.join(root, "games", game.id);
  const gameCss = fs.readFileSync(path.join(gameDir, "game.css"), "utf8");
  const gameJs = fs.readFileSync(path.join(gameDir, "game.js"), "utf8");
  const backgroundJs = fs.readFileSync(path.join(gameDir, "background.js"), "utf8");

  const itemCount = countItems(gameJs);
  const prodHostCheck = game.id === "flag-master"
    ? `(location.hostname === 'vitoraa.github.io' && location.pathname.startsWith('/flag-master/') && !location.pathname.startsWith('/flag-master/capital-master/')) || location.hostname === 'flag-master-game.netlify.app'`
    : `location.hostname === 'vitoraa.github.io' && location.pathname.startsWith('/flag-master/${game.id}/')`;

  let html = template
    .replace(/\{\{DOC_TITLE\}\}/g, `${game.titlePlain} — how many ${game.unitPlural} do you know?`)
    .replace(/\{\{PROD_HOST_CHECK\}\}/g, prodHostCheck)
    .replace(/\{\{INITIAL_THEME\}\}/g, game.initialTheme || "light")
    .replace(/\{\{GAME_CSS\}\}/g, sharedCss + "\n" + gameCss)
    .replace(/\{\{TITLE_HTML\}\}/g, game.title)
    .replace(/\{\{TAGLINE\}\}/g, game.tagline)
    .replace(/\{\{ITEM_COUNT\}\}/g, itemCount)
    .replace(/\{\{UNIT_SINGULAR\}\}/g, game.unitSingular)
    .replace(/\{\{UNIT_PLURAL\}\}/g, game.unitPlural)
    .replace(/\{\{PRACTICE_CFG_LABEL\}\}/g, game.practiceCfgLabel)
    .replace(/\{\{TOTAL_ALL_DIFFICULTY\}\}/g, `All ${itemCount}`)
    .replace(/\{\{CROSS_PROMO_HEADING\}\}/g, game.crossPromoHeading)
    .replace(/\{\{CROSS_PROMO_BODY\}\}/g, game.crossPromoBody)
    .replace(
      "<!--GAME_SCRIPT-->",
      `const GAMES = ${gamesJsonLiteral};\nconst GAME = GAMES.find(g => g.id === ${JSON.stringify(game.id)});\n${gameJs}\n${backgroundJs}\n${engineJs}\n${arcadeJs}`
    );

  const outPath = path.join(root, game.outputDir, "index.html");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`Built ${outPath}`);
}

function countItems(gameJsSource) {
  const match = gameJsSource.match(/GAME_ITEM_COUNT\s*=\s*(\d+)/);
  if (!match) throw new Error("game.js must define GAME_ITEM_COUNT = <n>;");
  return match[1];
}
```

- [ ] **Step 2: Verify it fails cleanly with no games yet built**

Run: `node build.js`
Expected: `Error: ENOENT ... games/flag-master/game.css` (fails because Tasks 7/9 haven't run yet — this confirms the script reads the right paths before we build real content)

- [ ] **Step 3: Commit**

```bash
git add build.js
git commit -m "feat: add build.js to generate per-game index.html"
```

---

## Task 7: Create `games/flag-master/game.js`, `background.js`, `game.css`

**Files:**
- Create: `games/flag-master/game.js`
- Create: `games/flag-master/background.js`
- Create: `games/flag-master/game.css`
- Reference: `index.html` (current committed version)

**Interfaces:**
- Produces: the `flag-master` implementation of the `GAME` contract defined in Task 4 (`items`, `unitSingular`, `unitPlural`, `promptCounterLabel`, `levels`, `initialTheme`, `practiceCfgLabel`, `renderPrompt`, `renderOption`, `optionKey`, `wrongAnswerText`, `buildBackground` — assigned onto the `GAME` object `build.js` already constructed from `games.json`), plus a `GAME_ITEM_COUNT` constant `build.js` reads (Task 6 Step 1).

- [ ] **Step 1: Write `games/flag-master/game.js`**

```js
const GAME_ITEM_COUNT = 195;

// [code, name, tier]  tier 1 = famous, 2 = medium, 3 = hard, 4 = very hard
GAME.items = [
  ["us","United States",1],["br","Brazil",1],["fr","France",1],["de","Germany",1],
  ["it","Italy",1],["es","Spain",1],["gb","United Kingdom",1],["jp","Japan",1],
  ["cn","China",1],["ca","Canada",1],["mx","Mexico",1],["ar","Argentina",1],
  ["pt","Portugal",1],["au","Australia",1],["in","India",1],["ru","Russia",1],
  ["kr","South Korea",1],["nl","Netherlands",1],["ch","Switzerland",1],["se","Sweden",1],
  ["no","Norway",1],["gr","Greece",1],["tr","Turkey",1],["eg","Egypt",1],
  ["za","South Africa",1],["ie","Ireland",1],["dk","Denmark",1],["be","Belgium",1],
  ["pl","Poland",2],["at","Austria",2],["fi","Finland",2],["ua","Ukraine",2],
  ["cl","Chile",2],["co","Colombia",2],["pe","Peru",2],["uy","Uruguay",2],
  ["ve","Venezuela",2],["cu","Cuba",2],["th","Thailand",2],["vn","Vietnam",2],
  ["ph","Philippines",2],["id","Indonesia",2],["my","Malaysia",2],["sg","Singapore",2],
  ["nz","New Zealand",2],["il","Israel",2],["sa","Saudi Arabia",2],["ae","United Arab Emirates",2],
  ["ma","Morocco",2],["ng","Nigeria",2],["ke","Kenya",2],["cz","Czechia",2],
  ["hu","Hungary",2],["ro","Romania",2],["hr","Croatia",2],["is","Iceland",2],
  ["pk","Pakistan",2],["bd","Bangladesh",2],["ec","Ecuador",2],["bo","Bolivia",2],
  ["py","Paraguay",2],["pa","Panama",2],["cr","Costa Rica",2],["jm","Jamaica",2],
  ["qa","Qatar",2],["ir","Iran",2],["iq","Iraq",2],["dz","Algeria",2],
  ["si","Slovenia",3],["sk","Slovakia",3],["rs","Serbia",3],["bg","Bulgaria",3],
  ["lt","Lithuania",3],["lv","Latvia",3],["ee","Estonia",3],["md","Moldova",3],
  ["al","Albania",3],["mk","North Macedonia",3],["ba","Bosnia and Herzegovina",3],["me","Montenegro",3],
  ["lu","Luxembourg",3],["mt","Malta",3],["cy","Cyprus",3],["am","Armenia",3],
  ["ge","Georgia",3],["az","Azerbaijan",3],["kz","Kazakhstan",3],["uz","Uzbekistan",3],
  ["kg","Kyrgyzstan",3],["tj","Tajikistan",3],["tm","Turkmenistan",3],["mn","Mongolia",3],
  ["np","Nepal",3],["lk","Sri Lanka",3],["mm","Myanmar",3],["kh","Cambodia",3],
  ["la","Laos",3],["bt","Bhutan",3],["bn","Brunei",3],["om","Oman",3],
  ["kw","Kuwait",3],["bh","Bahrain",3],["jo","Jordan",3],["lb","Lebanon",3],
  ["tn","Tunisia",3],["ly","Libya",3],["sd","Sudan",3],["et","Ethiopia",3],
  ["gh","Ghana",3],["ci","Ivory Coast",3],["sn","Senegal",3],["cm","Cameroon",3],
  ["tz","Tanzania",3],["ug","Uganda",3],["zm","Zambia",3],["zw","Zimbabwe",3],
  ["mz","Mozambique",3],["ao","Angola",3],["na","Namibia",3],["bw","Botswana",3],
  ["mg","Madagascar",3],["mu","Mauritius",3],["fj","Fiji",3],["pg","Papua New Guinea",3],
  ["gt","Guatemala",3],["hn","Honduras",3],["sv","El Salvador",3],["ni","Nicaragua",3],
  ["do","Dominican Republic",3],["ht","Haiti",3],["tt","Trinidad and Tobago",3],["gy","Guyana",3],
  ["sr","Suriname",3],["bz","Belize",3],["mv","Maldives",3],["mc","Monaco",3],
  ["li","Liechtenstein",3],["ad","Andorra",3],["sm","San Marino",3],["va","Vatican City",3],
  ["af","Afghanistan",4],["ag","Antigua and Barbuda",4],["bb","Barbados",4],["bf","Burkina Faso",4],
  ["bi","Burundi",4],["bj","Benin",4],["bs","Bahamas",4],["by","Belarus",4],
  ["cd","DR Congo",4],["cf","Central African Republic",4],["cg","Republic of the Congo",4],["cv","Cabo Verde",4],
  ["dj","Djibouti",4],["dm","Dominica",4],["er","Eritrea",4],["fm","Micronesia",4],
  ["ga","Gabon",4],["gd","Grenada",4],["gm","Gambia",4],["gn","Guinea",4],
  ["gq","Equatorial Guinea",4],["gw","Guinea-Bissau",4],["ki","Kiribati",4],["km","Comoros",4],
  ["kn","Saint Kitts and Nevis",4],["kp","North Korea",4],["lc","Saint Lucia",4],["lr","Liberia",4],
  ["ls","Lesotho",4],["mh","Marshall Islands",4],["ml","Mali",4],["mr","Mauritania",4],
  ["mw","Malawi",4],["ne","Niger",4],["nr","Nauru",4],["ps","Palestine",4],
  ["pw","Palau",4],["rw","Rwanda",4],["sb","Solomon Islands",4],["sc","Seychelles",4],
  ["sl","Sierra Leone",4],["so","Somalia",4],["ss","South Sudan",4],["st","Sao Tome and Principe",4],
  ["sy","Syria",4],["sz","Eswatini",4],["td","Chad",4],["tg","Togo",4],
  ["tl","Timor-Leste",4],["to","Tonga",4],["tv","Tuvalu",4],["vc","Saint Vincent and the Grenadines",4],
  ["vu","Vanuatu",4],["ws","Samoa",4],["ye","Yemen",4],
];

GAME.unitSingular = "flag";
GAME.unitPlural = "flags";
GAME.promptCounterLabel = "Flag";
GAME.practiceCfgLabel = "Flags";
GAME.initialTheme = "light";
GAME.levels = { 1: "Warming up", 2: "Getting tricky", 3: "Flag nerd zone", 4: "Very hard" };
GAME.trackAnswerEvent = "flag_answered";

GAME.renderPrompt = function (item) {
  $("country-name").textContent = item[1];
};

GAME.renderOption = function (item) {
  return `<button class="flag-btn" data-key="${item[0]}" aria-label="Guess ${item[1]}">
     <img src="${flagUrl(item[0])}" alt="" draggable="false">
     <span class="mark"></span>
   </button>`;
};

GAME.optionKey = function (item) { return item[0]; };

GAME.wrongAnswerText = function (item) {
  const correct = COUNTRIES.find(c => c[0] === item[0]);
  return `That flag is ${correct ? correct[1] : item[0]}`;
};
```

- [ ] **Step 2: Write `games/flag-master/background.js`**

```js
GAME.buildBackground = function (layer) {
  const rnd = (min, max) => min + Math.random() * (max - min);
  const pool = shuffle(COUNTRIES.filter(c => c[2] <= 2).map(c => c[0]));
  const cols = 6, rows = 6;
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const code = pool[i % pool.length]; i++;
      const el = document.createElement("div");
      el.className = "fl";
      const w = rnd(72, 128);
      el.style.width = w + "px";
      el.style.left = (c / cols * 100 + rnd(-4, 4)) + "%";
      el.style.top  = (r / rows * 100 + rnd(-4, 4)) + "%";
      el.style.opacity = rnd(0.55, 0.95).toFixed(2);
      el.style.setProperty("--tx", rnd(-46, 46).toFixed(0) + "px");
      el.style.setProperty("--ty", rnd(-46, 46).toFixed(0) + "px");
      el.style.setProperty("--r1", rnd(-9, 9).toFixed(1) + "deg");
      el.style.setProperty("--r2", rnd(-9, 9).toFixed(1) + "deg");
      el.style.setProperty("--d", rnd(4.5, 9).toFixed(1) + "s");
      el.style.setProperty("--delay", (-rnd(0, 9)).toFixed(1) + "s");
      el.innerHTML = `<img src="${flagUrl(code)}" alt="" draggable="false" loading="lazy">`;
      layer.appendChild(el);
    }
  }
  const veil = document.createElement("div");
  veil.className = "veil";
  layer.appendChild(veil);
};
```

- [ ] **Step 3: Write `games/flag-master/game.css`**

The two blocks excluded from `shared/styles.css` in Task 3 (background layer + option buttons), unchanged:

```css
#flag-bg .fl {
  position: absolute; aspect-ratio: 3 / 2; border-radius: 8px; overflow: hidden;
  box-shadow: 0 14px 34px -10px rgba(0,0,0,.7);
  will-change: transform; filter: saturate(1.1);
  animation: drift var(--d) ease-in-out var(--delay) infinite alternate;
}
#flag-bg .fl img { width: 100%; height: 100%; object-fit: cover; display: block; }
#flag-bg .veil {
  position: absolute; inset: 0;
  background:
    radial-gradient(900px 620px at 50% 42%, rgba(6,7,13,.42), rgba(6,7,13,.8) 78%),
    linear-gradient(180deg, rgba(6,7,13,.32), rgba(6,7,13,.74));
}
@keyframes drift {
  from { transform: translate(0,0) rotate(var(--r1)); }
  to   { transform: translate(var(--tx), var(--ty)) rotate(var(--r2)); }
}
@media (prefers-reduced-motion: reduce) {
  #flag-bg .fl { animation: none; }
}

.flag-btn {
  border: 2px solid var(--line); border-radius: 16px; overflow: hidden;
  background: var(--surface); cursor: pointer; padding: 0;
  aspect-ratio: 4 / 2.7; position: relative;
  transition: transform .14s cubic-bezier(.2,.8,.2,1), border-color .15s, box-shadow .15s;
}
.flag-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }
.flag-btn::after {
  content: ""; position: absolute; inset: 0; border-radius: 14px;
  box-shadow: inset 0 0 40px rgba(0,0,0,.25); pointer-events: none;
}
.flag-btn:not(:disabled):hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 12px 30px -10px rgba(108,140,255,.5); }
.flag-btn .mark {
  position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%;
  display: grid; place-items: center; opacity: 0; transform: scale(.5);
  transition: opacity .2s, transform .2s; z-index: 2;
}
.flag-btn.correct { border-color: var(--good); box-shadow: 0 0 0 1px var(--good), 0 12px 30px -8px rgba(47,224,160,.5); }
.flag-btn.correct .mark { opacity: 1; transform: scale(1); background: var(--good); color: #04241a; }
.flag-btn.wrong { border-color: var(--bad); animation: shake .4s; }
.flag-btn.wrong .mark { opacity: 1; transform: scale(1); background: var(--bad); color: #2a0710; }
.flag-btn:disabled { cursor: default; }
.flag-btn.dim { opacity: .3; }
:root[data-theme="light"] .flag-btn::after { box-shadow: inset 0 0 30px rgba(0,0,0,.12); }
```

(Search `index.html`'s light-theme section, near `:root[data-theme="light"]`, to confirm the exact text of that last override line before copying it — it was noted at index.html:169 in the pre-refactor file.)

- [ ] **Step 4: Commit**

```bash
git add games/flag-master
git commit -m "feat: add flag-master game config"
```

---

## Task 8: Build and verify Flag Master

**Files:**
- Modify: `index.html` (generated output — will be overwritten)

**Interfaces:**
- Consumes: everything from Tasks 1-7.

- [ ] **Step 1: Run the build**

```bash
node build.js
```
Expected: `Built /Users/vitoralves/Projects/Personal/flag-master/index.html` (and it errors on capital-master/math-master paths not existing yet — temporarily comment out or `git stash` the other two `games.json` entries' `enabled` flags if the script aborts on the first missing directory; otherwise confirm `build.js` continues past errors per-game, or fix it to skip a game whose directory is missing and log a warning instead of throwing, since Task 9 hasn't created capital-master's files yet).

- [ ] **Step 2: Diff against the pre-refactor version for logic equivalence**

```bash
git diff HEAD~7 -- index.html | head -200
```
Read through the diff. Expect only structural reshuffling (whitespace, comment removal) and the literal substitutions made in Tasks 2/4/7 (e.g. `flag_answered` string still present, `"flags"` unit text still present, `Flag Master` title still present) — no behavioral changes. If anything looks semantically different (a changed number, a missing event property, a different CSS value), stop and fix it before proceeding.

- [ ] **Step 3: Serve and manually verify in the browser**

```bash
npx serve .
```
Open the printed local URL and verify, per this project's standing workflow of testing in-browser before pushing:
- Start screen renders (flag background animation, "195 countries" badge, top-3 leaderboard loads)
- Standard game: play a full round, confirm flag images load, correct/wrong feedback, streak multiplier, timer countdown, lives depleting, end screen with rank/medal/share text
- Practice mode: toggle timer/lives/difficulty options, confirm "Easy only" restricts to tier-1 flags, confirm no leaderboard prompt at the end
- Leaderboard: submit a score, confirm it appears in the nearby list, edit the name, confirm the rename request succeeds
- Theme toggle switches light/dark and persists on reload
- Arcade sheet opens, shows the Capital Master card (with its stored best score or "Not played yet"), and the Math Master card greyed out as "Coming soon"
- Cross-promo card appears after 2 finished runs and links to `capital-master/`
- Share button copies text containing "Flag Master", the score, and the flags-correct count

- [ ] **Step 4: Wait for explicit user go-ahead before proceeding**

Per this project's established workflow, stop here and report the verification results; do not continue to Task 9 (or push anything) until the user confirms Flag Master looks correct.

- [ ] **Step 5: Commit the generated file**

```bash
git add index.html
git commit -m "build: generate flag-master index.html from shared engine"
```

---

## Task 9: Create `games/capital-master/game.js`, `background.js`, `game.css`

**Files:**
- Create: `games/capital-master/game.js`
- Create: `games/capital-master/background.js`
- Create: `games/capital-master/game.css`
- Reference: `capital-master/index.html` (current committed version)

**Interfaces:**
- Produces: the `capital-master` implementation of the same `GAME` contract Task 7 implemented for `flag-master`, including the `pickDistractors` override and `GAME_ITEM_COUNT`.

**Note on line numbers in this task:** `capital-master/index.html` received a real content commit (country tier reassignments — see `git log -- capital-master/index.html`) after this plan was written, which shifts line numbers for everything after the `COUNTRIES` array. Every line reference below is a starting-point estimate, not gospel — locate each block by searching for its marker (`const OTHER_CITIES`, `const COUNTRIES`, `function pickDistractors`, `#world-map`, `.capital-btn`) in the live file rather than trusting the number alone.

- [ ] **Step 1: Write `games/capital-master/game.js`**

Copy the `OTHER_CITIES` object verbatim from the current `capital-master/index.html` (search for `const OTHER_CITIES`, originally around line 789-900, 112 entries), and the `COUNTRIES` array (with the 4th `capital` field, search for `const COUNTRIES`, originally around line 901-1010, 108 entries, including its current tier values — copy them exactly as they are in the live file, not from memory) — both unchanged data, just reference the file directly when writing this rather than retyping by hand. Then add:

```js
const GAME_ITEM_COUNT = 108;

// OTHER_CITIES = { ...copied verbatim from capital-master/index.html:789-900... }
// GAME.items = [ ...copied verbatim from capital-master/index.html:901-1010, each row keeping its 4th "capital" field... ]

const SAME_COUNTRY_DISTRACTOR_CHANCE = 0.75;

GAME.unitSingular = "capital";
GAME.unitPlural = "capitals";
GAME.promptCounterLabel = "Country";
GAME.practiceCfgLabel = "Countries";
GAME.initialTheme = "dark";
GAME.levels = { 1: "Warming up", 2: "Getting tricky", 3: "Capital nerd zone", 4: "Very hard" };
GAME.trackAnswerEvent = "capital_answered";

GAME.renderPrompt = function (item) {
  $("prompt-flag").src = flagUrl(item[0]);
  $("country-name").textContent = item[1];
};

GAME.renderOption = function (item) {
  return `<button class="capital-btn" data-key="${item[3]}" aria-label="Guess ${item[3]}">
     <span class="capital-name">${item[3]}</span>
     <span class="mark"></span>
   </button>`;
};

GAME.optionKey = function (item) { return item[3]; };

GAME.wrongAnswerText = function (item) {
  return `The capital is ${item[3]}`;
};

GAME.pickDistractors = function (answer, items) {
  const sameCountry = shuffle((OTHER_CITIES[answer[0]] || []).slice());
  const sameTier = shuffle(items.filter(c => c !== answer && c[2] === answer[2]));
  const otherTier = shuffle(items.filter(c => c !== answer && c[2] !== answer[2]));
  const foreignCapitals = sameTier.concat(otherTier).map(c => c[3]);

  const used = new Set([answer[3]]);
  const picks = [];
  while (picks.length < 3 && (sameCountry.length || foreignCapitals.length)) {
    const useSameCountry = sameCountry.length > 0 &&
      (foreignCapitals.length === 0 || Math.random() < SAME_COUNTRY_DISTRACTOR_CHANCE);
    const candidate = useSameCountry ? sameCountry.shift() : foreignCapitals.shift();
    if (candidate && !used.has(candidate)) { used.add(candidate); picks.push(candidate); }
  }
  return picks.map(cap => items.find(c => c[3] === cap) || { 3: cap });
};
```

Before writing the `GAME.pickDistractors` body above, open `capital-master/index.html` and read the full `pickDistractors` function (starting at line 1292) to confirm the exact return shape used by `renderOption`/`optionKey` (it must return objects/arrays where `item[3]` is the distractor capital name) — adjust the synthetic fallback `{ 3: cap }` if the original function's actual return type differs from this reconstruction.

- [ ] **Step 2: Write `games/capital-master/background.js`**

Copy the `buildBackground`-equivalent logic verbatim from `capital-master/index.html` (search for where `#world-map` and `.capital-dot` elements are constructed, referenced at capital-master/index.html:1150 for the map SVG setup) into:

```js
GAME.buildBackground = function (layer) {
  // ...copied verbatim from capital-master/index.html's world-map + capital-dot construction...
};
```

- [ ] **Step 3: Write `games/capital-master/game.css`**

Copy verbatim from `capital-master/index.html`: the `#world-map`/`.land`/`#flag-bg .capital-dot`/`@keyframes blink`/`@keyframes blink-color` block (capital-master/index.html:64-92) and the `.capital-btn`/`.prompt-flag` block (capital-master/index.html:372-409), following the same exclude-from-shared-css logic as Task 3 applied to flag-master's blocks.

- [ ] **Step 4: Commit**

```bash
git add games/capital-master
git commit -m "feat: add capital-master game config"
```

---

## Task 10: Build and verify Capital Master

**Files:**
- Modify: `capital-master/index.html` (generated output)

**Interfaces:**
- Consumes: everything from Task 9 plus the shared files from Tasks 1-6.

- [ ] **Step 1: Run the build**

```bash
node build.js
```
Expected: `Built .../index.html` and `Built .../capital-master/index.html` with no errors.

- [ ] **Step 2: Diff against the pre-refactor version**

```bash
git diff main -- capital-master/index.html | head -200
```
Same equivalence check as Task 8 Step 2 — confirm no behavioral drift (capital list still 108 entries, `capital_answered` event name intact, "Capital nerd zone" label intact, `../` cross-promo URL intact).

- [ ] **Step 3: Manually verify in the browser**

```bash
npx serve .
```
Navigate to `/capital-master/`. Repeat the same checklist as Task 8 Step 3, specific to Capital Master: world map + blinking capital-dot background, flag image shown above the country-name prompt, capital-name text buttons (not images), `OTHER_CITIES` same-country distractors appearing plausibly often, "Country N" counter label, "Capital nerd zone" level label, arcade sheet showing the Flag Master card, cross-promo linking back to `../`.

- [ ] **Step 4: Wait for explicit user go-ahead before proceeding**

Stop here and report verification results; do not continue until the user confirms Capital Master looks correct.

- [ ] **Step 5: Commit**

```bash
git add capital-master/index.html
git commit -m "build: generate capital-master index.html from shared engine"
```

---

## Task 11: De-duplicate `/flags`

**Files:**
- Delete: `capital-master/flags/` (197 files)
- Modify: no source change needed — `flagUrl` in `shared/engine.js` already returns a relative `flags/<code>.png`; verify this resolves correctly from `capital-master/index.html`'s location.

**Interfaces:** none new.

- [ ] **Step 1: Confirm root `/flags/` is byte-identical to `capital-master/flags/` before deleting**

```bash
diff -rq flags capital-master/flags
```
Expected: no output (directories identical).

- [ ] **Step 2: Update `flagUrl` to be relative-path-aware, or confirm the existing relative path already works**

Since `capital-master/index.html` is served from the `capital-master/` directory, a bare `flags/<code>.png` reference resolves to `capital-master/flags/<code>.png`, not the root. Change `games/capital-master/game.js` is not the right place for this — instead, `shared/engine.js`'s `flagUrl` needs a per-game base path. Add to `games.json`'s capital-master entry (Task 1) a field `"assetPrefix": "../"` and to flag-master's entry `"assetPrefix": ""`. Then in `shared/engine.js`, change:
```js
const flagUrl = code => `flags/${code}.png`;
```
to:
```js
const flagUrl = code => `${GAME.assetPrefix}flags/${code}.png`;
```
Re-run `git add games.json` after adding the field, since `games.json` was already committed in Task 1 — this is an amendment to that file, committed here instead.

- [ ] **Step 3: Delete the duplicated directory**

```bash
git rm -r capital-master/flags
```

- [ ] **Step 4: Rebuild and verify**

```bash
node build.js
npx serve .
```
Open `/capital-master/` and confirm flag images (on the prompt and, if applicable, anywhere else) still load with no broken-image icons or 404s in the browser console/network tab.

- [ ] **Step 5: Commit**

```bash
git add games.json shared/engine.js capital-master/index.html
git commit -m "fix: de-duplicate /flags directory, share one copy across games"
```

---

## Task 12: Document the build workflow

**Files:**
- Create: `CLAUDE.md`

**Interfaces:** none.

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# Flag Master / Capital Master

Each game (`index.html`, `capital-master/index.html`) is a **generated** file — do not hand-edit them directly.

Source of truth:
- `games.json` — registry of games (title, storage keys, leaderboard id, copy strings)
- `shared/` — generic engine, CSS, HTML template, arcade menu, shared across all games
- `games/<id>/game.js`, `background.js`, `game.css` — per-game quiz data, render hooks, background animation, and game-specific styling

After changing anything in `shared/`, `games/*/`, or `games.json`, run:

\`\`\`bash
node build.js
\`\`\`

and commit the regenerated `index.html` files alongside your source changes. There is no CI check enforcing this yet — it's a required manual step before pushing.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document the generated-file build workflow"
```

---

## Task 13: Push branch and open PR

**Files:** none.

**Interfaces:** none.

- [ ] **Step 1: Push the branch**

```bash
git push -u origin shared-game-build-system
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Replace copy-pasted game HTML with a shared build system" --body "$(cat <<'EOF'
## Summary
- Adds a `games.json` registry + `shared/` (engine.js, styles.css, template.html, arcade-menu.js) + per-game `games/<id>/` (game.js, background.js, game.css) source layout.
- `build.js` (plain Node, no dependencies) generates each game's single-file `index.html` from that source — deployment stays exactly the same (static files, no hosting changes).
- De-duplicates the `/flags` asset directory (previously copied byte-for-byte into `capital-master/`).
- A new game now only needs a `games.json` entry + a `games/<id>/` folder — no more copy-pasting HTML/CSS/JS.

## Test plan
- [ ] `node build.js` runs with no errors
- [ ] Flag Master verified in-browser: full game loop, practice mode, leaderboard submit/fetch/rename, theme toggle, arcade sheet, cross-promo, share text
- [ ] Capital Master verified in-browser: same checklist, plus world-map background and same-country distractors
- [ ] No broken flag-image requests after the `/flags` de-duplication
- [ ] Generated `index.html` diffs contain no unintended behavior changes versus `main`
EOF
)"
```

- [ ] **Step 3: Report the PR URL to the user**

---

## Self-Review Notes

- **Spec coverage:** All four approved design sections (source layout, `game.js` hook contract, `games.json`/template/`build.js`, migration order) map to Tasks 1-13. The `pickDistractors`, `wrongAnswerText`, `levels`, `analyticsId`, `assetPrefix`, and arcade-menu data-driven rendering needs were discovered during implementation research (they weren't in the original 4-hook contract from the spec) and are folded into the `GAME` contract in Task 4 — this is a superset of the spec's contract, not a contradiction.
- **Placeholder scan:** Steps that reference "copy verbatim from file:line" point to real, currently-committed line ranges the implementer can open directly — these are not vague TBDs, they're exact source-of-truth pointers for content too large to duplicate twice in this document (COUNTRIES arrays, OTHER_CITIES map, world-map SVG construction). Task 9 Step 1 and Step 2 explicitly call out where the implementer must read the source before writing, rather than guessing.
- **Type/name consistency:** `GAME.optionKey(item)` → `data-key` attribute → grading logic in `shared/engine.js` (Task 4 Steps 6-7) is used identically by both `games/flag-master/game.js` (Task 7) and `games/capital-master/game.js` (Task 9). `GAME.trackAnswerEvent`, `GAME.analyticsId`, `GAME.titlePlain`, `GAME.unitPlural`, `GAME.levels` are each defined once in Task 1's `games.json` shape and Task 4's contract, then consumed identically in Tasks 7 and 9.
