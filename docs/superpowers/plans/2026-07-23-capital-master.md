# Capital Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a second game, `capital-master/`, in the flag-master repo: same quiz engine, but the player is shown a country (flag + name) and picks its capital from four text choices.

**Architecture:** `capital-master/index.html` starts life as a byte-for-byte copy of the root `index.html` (plus a copy of `flags/`), then gets mechanically adapted: the `COUNTRIES` data gains a capital field, the round UI shows a flag image in the prompt and renders answer choices as capital-name buttons instead of flag-image buttons, all game text is rebranded, and storage keys / the leaderboard payload get an independent `capitals` identity. `leaderboard-apps-script.js` (shared by both games) gains a `game` parameter that selects between two independent pairs of sheet tabs, defaulting to today's behavior when absent so the already-deployed flag-master client keeps working untouched.

**Tech Stack:** Vanilla HTML/CSS/JS (no build step, no framework), Google Apps Script + Google Sheets backend, Netlify static hosting, `clasp` + GitHub Actions for Apps Script deploys.

## Global Constraints

- Root `index.html`, root `flags/`, `netlify.toml`, `appsscript.json`, and `.github/workflows/` must not be modified.
- `capital-master/` must be fully self-contained (its own copy of flag images, no path reaching into the root `flags/`).
- No new Netlify config, no new Apps Script deployment ID — reuse the existing one.
- Flag-master's leaderboard calls (which never send a `game` field) must continue to read/write the existing `Scores`/`PlayLog` sheets exactly as today.
- This repo has no test framework or `package.json`. Verification is either a plain `node` script/assertion (for pure, framework-free logic) or a manual browser check — do not introduce a test runner or dependency.

---

## File Structure

- `capital-master/index.html` — new file, the adapted game (create by copying root `index.html`, then edit in place).
- `capital-master/flags/*.png` — new files, copied from root `flags/`.
- `.claude/launch.json` — modify: add a `capital-master` dev-server entry (serves the repo root, same static tree used to reach both games) for local preview.
- `leaderboard-apps-script.js` — modify: add `sheetNamesFor_(game)` and thread a `game` parameter through `getSheet_`, `getPlayLogSheet_`, `getSortedAll_`, `doPost`, `doGet`.
- `leaderboard-apps-script.test.js` — new file, a dependency-free Node test for `sheetNamesFor_`.

---

### Task 1: Scaffold capital-master as an unmodified clone

**Files:**
- Create: `capital-master/index.html` (copy of root `index.html`)
- Create: `capital-master/flags/*.png` (copy of root `flags/*.png`)
- Modify: `.claude/launch.json`

**Interfaces:**
- Produces: a working local preview reachable at `http://localhost:8935/capital-master/` that behaves exactly like flag-master (nothing is adapted yet — this task is pure scaffolding, proven identical before any content changes land).

- [ ] **Step 1: Copy the game file and its assets**

```bash
mkdir -p capital-master
cp index.html capital-master/index.html
cp -r flags capital-master/flags
```

- [ ] **Step 2: Add a dev-server launch entry**

Read `.claude/launch.json`, then add a new entry to the `configurations` array (keep the existing `pinball-xp` entry untouched):

```json
    {
      "name": "capital-master",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "8935", "--directory", "/Users/vitoralves/Projects/Personal/flag-master"],
      "port": 8935
    }
```

- [ ] **Step 3: Verify the clone runs identically to flag-master**

Start the `capital-master` preview and navigate to `http://localhost:8935/capital-master/`. Confirm:
- The start screen reads "Flag Master" (not yet rebranded — expected at this stage).
- Starting a game shows a country name and 4 flag-image buttons to choose from, exactly like the root game.
- Play one full round and confirm scoring/timer/lives behave normally.

- [ ] **Step 4: Commit**

```bash
git add capital-master .claude/launch.json
git commit -m "chore: scaffold capital-master as a clone of flag-master"
```

---

### Task 2: Add capitals to the country dataset

**Files:**
- Modify: `capital-master/index.html` (the `COUNTRIES` array only)

**Interfaces:**
- Consumes: nothing new.
- Produces: each `COUNTRIES` entry becomes `[code, name, tier, capital]` — a 4th element (`capital`, a string) is appended after the existing `tier` field. Every other index (`c[0]` code, `c[1]` name, `c[2]` tier) is unchanged, so this task alone doesn't break any existing tier/difficulty logic in the file (`buildQueue`, `pickDistractors`, `LEVELS[...]`, etc. all still work against the same indices).

- [ ] **Step 1: Replace the `COUNTRIES` array**

In `capital-master/index.html`, replace the entire `const COUNTRIES = [ ... ];` block with:

```js
const COUNTRIES = [
  ["us","United States",1,"Washington, D.C."],
  ["br","Brazil",1,"Brasília"],
  ["fr","France",1,"Paris"],
  ["de","Germany",1,"Berlin"],
  ["it","Italy",1,"Rome"],
  ["es","Spain",1,"Madrid"],
  ["gb","United Kingdom",1,"London"],
  ["jp","Japan",1,"Tokyo"],
  ["cn","China",1,"Beijing"],
  ["ca","Canada",1,"Ottawa"],
  ["mx","Mexico",1,"Mexico City"],
  ["ar","Argentina",1,"Buenos Aires"],
  ["pt","Portugal",1,"Lisbon"],
  ["au","Australia",1,"Canberra"],
  ["in","India",1,"New Delhi"],
  ["ru","Russia",1,"Moscow"],
  ["kr","South Korea",1,"Seoul"],
  ["nl","Netherlands",1,"Amsterdam"],
  ["ch","Switzerland",1,"Bern"],
  ["se","Sweden",1,"Stockholm"],
  ["no","Norway",1,"Oslo"],
  ["gr","Greece",1,"Athens"],
  ["tr","Turkey",1,"Ankara"],
  ["eg","Egypt",1,"Cairo"],
  ["za","South Africa",1,"Pretoria"],
  ["ie","Ireland",1,"Dublin"],
  ["dk","Denmark",1,"Copenhagen"],
  ["be","Belgium",1,"Brussels"],
  ["pl","Poland",2,"Warsaw"],
  ["at","Austria",2,"Vienna"],
  ["fi","Finland",2,"Helsinki"],
  ["ua","Ukraine",2,"Kyiv"],
  ["cl","Chile",2,"Santiago"],
  ["co","Colombia",2,"Bogotá"],
  ["pe","Peru",2,"Lima"],
  ["uy","Uruguay",2,"Montevideo"],
  ["ve","Venezuela",2,"Caracas"],
  ["cu","Cuba",2,"Havana"],
  ["th","Thailand",2,"Bangkok"],
  ["vn","Vietnam",2,"Hanoi"],
  ["ph","Philippines",2,"Manila"],
  ["id","Indonesia",2,"Jakarta"],
  ["my","Malaysia",2,"Kuala Lumpur"],
  ["sg","Singapore",2,"Singapore"],
  ["nz","New Zealand",2,"Wellington"],
  ["il","Israel",2,"Jerusalem"],
  ["sa","Saudi Arabia",2,"Riyadh"],
  ["ae","United Arab Emirates",2,"Abu Dhabi"],
  ["ma","Morocco",2,"Rabat"],
  ["ng","Nigeria",2,"Abuja"],
  ["ke","Kenya",2,"Nairobi"],
  ["cz","Czechia",2,"Prague"],
  ["hu","Hungary",2,"Budapest"],
  ["ro","Romania",2,"Bucharest"],
  ["hr","Croatia",2,"Zagreb"],
  ["is","Iceland",2,"Reykjavik"],
  ["pk","Pakistan",2,"Islamabad"],
  ["bd","Bangladesh",2,"Dhaka"],
  ["ec","Ecuador",2,"Quito"],
  ["bo","Bolivia",2,"Sucre"],
  ["py","Paraguay",2,"Asunción"],
  ["pa","Panama",2,"Panama City"],
  ["cr","Costa Rica",2,"San José"],
  ["jm","Jamaica",2,"Kingston"],
  ["qa","Qatar",2,"Doha"],
  ["ir","Iran",2,"Tehran"],
  ["iq","Iraq",2,"Baghdad"],
  ["dz","Algeria",2,"Algiers"],
  ["si","Slovenia",3,"Ljubljana"],
  ["sk","Slovakia",3,"Bratislava"],
  ["rs","Serbia",3,"Belgrade"],
  ["bg","Bulgaria",3,"Sofia"],
  ["lt","Lithuania",3,"Vilnius"],
  ["lv","Latvia",3,"Riga"],
  ["ee","Estonia",3,"Tallinn"],
  ["md","Moldova",3,"Chișinău"],
  ["al","Albania",3,"Tirana"],
  ["mk","North Macedonia",3,"Skopje"],
  ["ba","Bosnia and Herzegovina",3,"Sarajevo"],
  ["me","Montenegro",3,"Podgorica"],
  ["lu","Luxembourg",3,"Luxembourg City"],
  ["mt","Malta",3,"Valletta"],
  ["cy","Cyprus",3,"Nicosia"],
  ["am","Armenia",3,"Yerevan"],
  ["ge","Georgia",3,"Tbilisi"],
  ["az","Azerbaijan",3,"Baku"],
  ["kz","Kazakhstan",3,"Astana"],
  ["uz","Uzbekistan",3,"Tashkent"],
  ["kg","Kyrgyzstan",3,"Bishkek"],
  ["tj","Tajikistan",3,"Dushanbe"],
  ["tm","Turkmenistan",3,"Ashgabat"],
  ["mn","Mongolia",3,"Ulaanbaatar"],
  ["np","Nepal",3,"Kathmandu"],
  ["lk","Sri Lanka",3,"Sri Jayawardenepura Kotte"],
  ["mm","Myanmar",3,"Naypyidaw"],
  ["kh","Cambodia",3,"Phnom Penh"],
  ["la","Laos",3,"Vientiane"],
  ["bt","Bhutan",3,"Thimphu"],
  ["bn","Brunei",3,"Bandar Seri Begawan"],
  ["om","Oman",3,"Muscat"],
  ["kw","Kuwait",3,"Kuwait City"],
  ["bh","Bahrain",3,"Manama"],
  ["jo","Jordan",3,"Amman"],
  ["lb","Lebanon",3,"Beirut"],
  ["tn","Tunisia",3,"Tunis"],
  ["ly","Libya",3,"Tripoli"],
  ["sd","Sudan",3,"Khartoum"],
  ["et","Ethiopia",3,"Addis Ababa"],
  ["gh","Ghana",3,"Accra"],
  ["ci","Ivory Coast",3,"Yamoussoukro"],
  ["sn","Senegal",3,"Dakar"],
  ["cm","Cameroon",3,"Yaoundé"],
  ["tz","Tanzania",3,"Dodoma"],
  ["ug","Uganda",3,"Kampala"],
  ["zm","Zambia",3,"Lusaka"],
  ["zw","Zimbabwe",3,"Harare"],
  ["mz","Mozambique",3,"Maputo"],
  ["ao","Angola",3,"Luanda"],
  ["na","Namibia",3,"Windhoek"],
  ["bw","Botswana",3,"Gaborone"],
  ["mg","Madagascar",3,"Antananarivo"],
  ["mu","Mauritius",3,"Port Louis"],
  ["fj","Fiji",3,"Suva"],
  ["pg","Papua New Guinea",3,"Port Moresby"],
  ["gt","Guatemala",3,"Guatemala City"],
  ["hn","Honduras",3,"Tegucigalpa"],
  ["sv","El Salvador",3,"San Salvador"],
  ["ni","Nicaragua",3,"Managua"],
  ["do","Dominican Republic",3,"Santo Domingo"],
  ["ht","Haiti",3,"Port-au-Prince"],
  ["tt","Trinidad and Tobago",3,"Port of Spain"],
  ["gy","Guyana",3,"Georgetown"],
  ["sr","Suriname",3,"Paramaribo"],
  ["bz","Belize",3,"Belmopan"],
  ["mv","Maldives",3,"Malé"],
  ["mc","Monaco",3,"Monaco"],
  ["li","Liechtenstein",3,"Vaduz"],
  ["ad","Andorra",3,"Andorra la Vella"],
  ["sm","San Marino",3,"San Marino"],
  ["va","Vatican City",3,"Vatican City"],
  ["af","Afghanistan",4,"Kabul"],
  ["ag","Antigua and Barbuda",4,"Saint John's"],
  ["bb","Barbados",4,"Bridgetown"],
  ["bf","Burkina Faso",4,"Ouagadougou"],
  ["bi","Burundi",4,"Gitega"],
  ["bj","Benin",4,"Porto-Novo"],
  ["bs","Bahamas",4,"Nassau"],
  ["by","Belarus",4,"Minsk"],
  ["cd","DR Congo",4,"Kinshasa"],
  ["cf","Central African Republic",4,"Bangui"],
  ["cg","Republic of the Congo",4,"Brazzaville"],
  ["cv","Cabo Verde",4,"Praia"],
  ["dj","Djibouti",4,"Djibouti"],
  ["dm","Dominica",4,"Roseau"],
  ["er","Eritrea",4,"Asmara"],
  ["fm","Micronesia",4,"Palikir"],
  ["ga","Gabon",4,"Libreville"],
  ["gd","Grenada",4,"Saint George's"],
  ["gm","Gambia",4,"Banjul"],
  ["gn","Guinea",4,"Conakry"],
  ["gq","Equatorial Guinea",4,"Malabo"],
  ["gw","Guinea-Bissau",4,"Bissau"],
  ["ki","Kiribati",4,"Tarawa"],
  ["km","Comoros",4,"Moroni"],
  ["kn","Saint Kitts and Nevis",4,"Basseterre"],
  ["kp","North Korea",4,"Pyongyang"],
  ["lc","Saint Lucia",4,"Castries"],
  ["lr","Liberia",4,"Monrovia"],
  ["ls","Lesotho",4,"Maseru"],
  ["mh","Marshall Islands",4,"Majuro"],
  ["ml","Mali",4,"Bamako"],
  ["mr","Mauritania",4,"Nouakchott"],
  ["mw","Malawi",4,"Lilongwe"],
  ["ne","Niger",4,"Niamey"],
  ["nr","Nauru",4,"Yaren"],
  ["ps","Palestine",4,"Ramallah"],
  ["pw","Palau",4,"Ngerulmud"],
  ["rw","Rwanda",4,"Kigali"],
  ["sb","Solomon Islands",4,"Honiara"],
  ["sc","Seychelles",4,"Victoria"],
  ["sl","Sierra Leone",4,"Freetown"],
  ["so","Somalia",4,"Mogadishu"],
  ["ss","South Sudan",4,"Juba"],
  ["st","Sao Tome and Principe",4,"São Tomé"],
  ["sy","Syria",4,"Damascus"],
  ["sz","Eswatini",4,"Mbabane"],
  ["td","Chad",4,"N'Djamena"],
  ["tg","Togo",4,"Lomé"],
  ["tl","Timor-Leste",4,"Dili"],
  ["to","Tonga",4,"Nuku'alofa"],
  ["tv","Tuvalu",4,"Funafuti"],
  ["vc","Saint Vincent and the Grenadines",4,"Kingstown"],
  ["vu","Vanuatu",4,"Port Vila"],
  ["ws","Samoa",4,"Apia"],
  ["ye","Yemen",4,"Sana'a"],
];
```

- [ ] **Step 2: Write a failing validation check**

```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('capital-master/index.html', 'utf8');
const m = src.match(/const COUNTRIES = \[[\s\S]*?\n\];/);
if (!m) { console.error('COUNTRIES array not found'); process.exit(1); }
const arr = eval(m[0].replace('const COUNTRIES = ', ''));
const bad = arr.filter(c => typeof c[3] !== 'string' || c[3].length === 0);
if (arr.length !== 195) { console.error('expected 195 entries, got', arr.length); process.exit(1); }
if (bad.length) { console.error('entries missing a capital:', bad); process.exit(1); }
console.log('OK:', arr.length, 'countries, all with capitals');
"
```

Run this **before** Step 1's edit is saved (against the original 3-field array) to confirm it fails first — expected: `expected 195 entries, got 195` is fine on count, but `entries missing a capital` should list all 195 (since `c[3]` is `undefined` before the edit). This confirms the check actually detects the missing field.

- [ ] **Step 3: Apply Step 1's edit, then run the check again**

Expected output: `OK: 195 countries, all with capitals`

- [ ] **Step 4: Commit**

```bash
git add capital-master/index.html
git commit -m "feat(capital-master): add capital field to country dataset"
```

---

### Task 3: Show flag+country as the prompt, capitals as the answer choices

**Files:**
- Modify: `capital-master/index.html` (CSS, HTML, and the round-rendering JS functions)

**Interfaces:**
- Consumes: `COUNTRIES` entries as `[code, name, tier, capital]` (from Task 2).
- Produces: `nextRound()` renders a flag image + country name as the prompt and 4 capital-name buttons (class `capital-btn`, `data-capital="<capital>"`) as the answer choices. `lockRound()` and `answerWith()` compare `dataset.capital` against `answer[3]` instead of `dataset.code` against `answer[0]`.

- [ ] **Step 1: Add prompt-flag CSS and replace `.flag-btn` with `.capital-btn`**

In the `<style>` block, replace:

```css
  .options { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
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

with:

```css
  .prompt-flag {
    width: 96px; aspect-ratio: 4 / 2.7; object-fit: cover; border-radius: 10px;
    box-shadow: 0 10px 24px -10px rgba(0,0,0,.5); margin: 0 auto 12px; display: block;
  }
  .options { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
  .capital-btn {
    border: 2px solid var(--line); border-radius: 16px; overflow: hidden;
    background: var(--surface); cursor: pointer; padding: 18px 12px;
    min-height: 64px; position: relative;
    display: flex; align-items: center; justify-content: center;
    transition: transform .14s cubic-bezier(.2,.8,.2,1), border-color .15s, box-shadow .15s;
  }
  .capital-btn .capital-name { font-size: 16px; font-weight: 600; text-align: center; line-height: 1.25; }
  .capital-btn:not(:disabled):hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 12px 30px -10px rgba(108,140,255,.5); }
  .capital-btn .mark {
    position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%;
    display: grid; place-items: center; opacity: 0; transform: scale(.5);
    transition: opacity .2s, transform .2s; z-index: 2;
  }
  .capital-btn.correct { border-color: var(--good); box-shadow: 0 0 0 1px var(--good), 0 12px 30px -8px rgba(47,224,160,.5); }
  .capital-btn.correct .mark { opacity: 1; transform: scale(1); background: var(--good); color: #04241a; }
  .capital-btn.wrong { border-color: var(--bad); animation: shake .4s; }
  .capital-btn.wrong .mark { opacity: 1; transform: scale(1); background: var(--bad); color: #2a0710; }
  .capital-btn:disabled { cursor: default; }
  .capital-btn.dim { opacity: .3; }
```

- [ ] **Step 2: Add a flag image element to the question prompt**

In the HTML, replace:

```html
    <div class="question">
      <div class="prompt" id="qnum"></div>
      <h2 id="country-name"></h2>
    </div>
```

with:

```html
    <div class="question">
      <div class="prompt" id="qnum"></div>
      <img class="prompt-flag" id="prompt-flag" src="" alt="" draggable="false">
      <h2 id="country-name"></h2>
    </div>
```

- [ ] **Step 3: Render the flag in the prompt and capital-name buttons as options**

Replace:

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

with:

```js
function nextRound() {
  if (lives <= 0 || round >= queue.length) return endGame();
  locked = false;
  const answer = queue[round];
  renderHud(answer);
  $("qnum").textContent = `Country ${round + 1}`;
  $("prompt-flag").src = flagUrl(answer[0]);
  $("country-name").textContent = answer[1];
  $("feedback").textContent = "";
  $("feedback").className = "feedback";

  const options = shuffle([answer, ...pickDistractors(answer)]);
  $("options").innerHTML = options.map(c =>
    `<button class="capital-btn" data-capital="${c[3]}" aria-label="Guess ${c[3]}">
       <span class="capital-name">${c[3]}</span>
       <span class="mark"></span>
     </button>`).join("");
  document.querySelectorAll(".capital-btn").forEach(b =>
    b.addEventListener("click", () => answerWith(b, answer)));
```

- [ ] **Step 4: Match on capital in `lockRound` and `answerWith`**

Replace:

```js
function lockRound(answer) {
  locked = true;
  clearInterval(timerId);
  document.querySelectorAll(".flag-btn").forEach(b => {
    b.disabled = true;
    if (b.dataset.code === answer[0]) {
      b.classList.add("correct");
      b.querySelector(".mark").innerHTML = ICON.check;
    } else {
      b.classList.add("dim");
    }
  });
}
```

with:

```js
function lockRound(answer) {
  locked = true;
  clearInterval(timerId);
  document.querySelectorAll(".capital-btn").forEach(b => {
    b.disabled = true;
    if (b.dataset.capital === answer[3]) {
      b.classList.add("correct");
      b.querySelector(".mark").innerHTML = ICON.check;
    } else {
      b.classList.add("dim");
    }
  });
}
```

Replace:

```js
function answerWith(btn, answer) {
  if (locked) return;
  const correct = btn.dataset.code === answer[0];
```

with:

```js
function answerWith(btn, answer) {
  if (locked) return;
  const correct = btn.dataset.capital === answer[3];
```

Replace the wrong-answer feedback line:

```js
    setFeedback(`That flag is ${nameOf(btn.dataset.code)}`, "bad");
```

with:

```js
    setFeedback(`The capital is ${answer[3]}`, "bad");
```

(`nameOf()` is no longer called anywhere in this file after this change — leave the function itself in place, since `rank()`/other lookups don't use it either way and removing dead code is out of scope for this task.)

- [ ] **Step 5: Verify in the browser**

With the `capital-master` preview still running, hard-reload `http://localhost:8935/capital-master/` and play a full round:
- Prompt shows a flag image above the country name.
- The 4 options are capital-city text buttons, not flag images.
- Clicking the correct capital highlights it green with a checkmark and awards points.
- Clicking a wrong capital highlights it red, dims the others, and shows "The capital is `<correct capital>`".
- Letting the timer run out shows "Out of time" and the correct capital is still revealed via the green highlight.
- Losing all 3 lives ends the game and shows the results screen.

- [ ] **Step 6: Commit**

```bash
git add capital-master/index.html
git commit -m "feat(capital-master): show flag+country prompt with capital-choice answers"
```

---

### Task 4: Rebrand copy, independent storage keys, and the leaderboard `game` field

**Files:**
- Modify: `capital-master/index.html`

**Interfaces:**
- Consumes: nothing new from earlier tasks.
- Produces: `capital-master/index.html` uses `capitalmaster-name` / `capitalmaster-best` / `capitalmaster-theme` localStorage keys (independent from flag-master's `flagmaster-*` keys, since localStorage is shared per-origin across both games on the same Netlify site) and sends `game: "capitals"` on every leaderboard request.

- [ ] **Step 1: Rebrand title, tagline, and personal-best label**

Replace:

```html
<title>Flag Master — how many flags do you know?</title>
```

with:

```html
<title>Capital Master — how many capitals do you know?</title>
```

Replace:

```html
      <h1>Flag&nbsp;Master</h1>
      <p class="tag">How many flags of the world do you actually know? Prove it.</p>
```

with:

```html
      <h1>Capital&nbsp;Master</h1>
      <p class="tag">How many capital cities of the world do you actually know? Prove it.</p>
```

Replace:

```html
        🏆 Your best: <b id="pb-flags">0</b> flags · <b id="pb-score">0</b> pts
```

with:

```html
        🏆 Your best: <b id="pb-flags">0</b> capitals · <b id="pb-score">0</b> pts
```

Replace:

```html
          <span class="txt">Spot the right flag out of <b>4 options</b></span>
```

with:

```html
          <span class="txt">Spot the right capital out of <b>4 options</b></span>
```

Replace:

```html
          <span class="cfg-label">Flags</span>
```

with:

```html
          <span class="cfg-label">Countries</span>
```

Replace the end-screen stat label:

```html
        <div class="stat"><b id="stat-flags">0</b><span>Flags</span></div>
```

with:

```html
        <div class="stat"><b id="stat-flags">0</b><span>Capitals</span></div>
```

- [ ] **Step 2: Rebrand difficulty label, ranks, and share text**

Replace:

```js
const LEVELS = { 1: "Warming up", 2: "Getting tricky", 3: "Flag nerd zone", 4: "Very hard" };
```

with:

```js
const LEVELS = { 1: "Warming up", 2: "Getting tricky", 3: "Capital nerd zone", 4: "Very hard" };
```

Replace:

```js
  if (flags >= 40) return [ICON.crown, "Flag Master", "Genuinely elite. Respect."];
```

with:

```js
  if (flags >= 40) return [ICON.crown, "Capital Master", "Genuinely elite. Respect."];
```

Replace:

```js
  "World Legend": "🌍", "Flag Master": "🏆", "Globetrotter": "🥇",
```

with:

```js
  "World Legend": "🌍", "Capital Master": "🏆", "Globetrotter": "🥇",
```

Replace:

```js
    `${RANK_EMOJI[title]} Flag Master — ${title}`,
```

with:

```js
    `${RANK_EMOJI[title]} Capital Master — ${title}`,
```

Replace:

```js
    `🎯 ${flagsRight}/${total} flags correct`,
```

with:

```js
    `🎯 ${flagsRight}/${total} capitals correct`,
```

- [ ] **Step 3: Independent storage keys and game URL**

Replace:

```js
const NAME_KEY = "flagmaster-name";
const BEST_KEY = "flagmaster-best";
const GAME_URL = "https://vitoraa.github.io/flag-master/";
```

with:

```js
const NAME_KEY = "capitalmaster-name";
const BEST_KEY = "capitalmaster-best";
const GAME_URL = "https://vitoraa.github.io/flag-master/capital-master/";
```

Replace:

```js
const THEME_KEY = "flagmaster-theme";
```

with:

```js
const THEME_KEY = "capitalmaster-theme";
```

- [ ] **Step 4: Send `game: "capitals"` on every leaderboard call**

Replace the play-log POST body:

```js
    body: JSON.stringify({
      type: "play",
      name: savedName,
      practice: practiceMode,
    }),
```

with:

```js
    body: JSON.stringify({
      type: "play",
      name: savedName,
      practice: practiceMode,
      game: "capitals",
    }),
```

Replace the score-submit POST body:

```js
      body: JSON.stringify({ name, score, flags: flagsRight, streak: bestStreak }),
```

with:

```js
      body: JSON.stringify({ name, score, flags: flagsRight, streak: bestStreak, game: "capitals" }),
```

Replace the nearby-leaderboard fetch URL:

```js
    const url = `${LEADERBOARD_URL}?score=${score}&flags=${flagsCount}&name=${encodeURIComponent(youName)}`;
```

with:

```js
    const url = `${LEADERBOARD_URL}?score=${score}&flags=${flagsCount}&name=${encodeURIComponent(youName)}&game=capitals`;
```

Replace:

```js
  try {
    const res = await fetch(LEADERBOARD_URL);
```

with:

```js
  try {
    const res = await fetch(`${LEADERBOARD_URL}?game=capitals`);
```

- [ ] **Step 5: Verify independence from flag-master**

With both previews reachable (root `index.html` on one port/tab, `capital-master/index.html` on another), in the browser devtools/JS console for each tab run `localStorage.getItem('flagmaster-name')` / `localStorage.getItem('capitalmaster-name')` after entering a name on each game's end screen, and confirm each game only ever reads/writes its own key (the other key stays whatever it was, unaffected). Also open the Network tab while submitting a capital-master score and confirm the POST body includes `"game":"capitals"`.

- [ ] **Step 6: Commit**

```bash
git add capital-master/index.html
git commit -m "feat(capital-master): rebrand copy, independent storage keys, tag leaderboard calls with game=capitals"
```

---

### Task 5: Per-game leaderboard sheets in the shared Apps Script

**Files:**
- Modify: `leaderboard-apps-script.js`
- Create: `leaderboard-apps-script.test.js`

**Interfaces:**
- Produces: `sheetNamesFor_(game)` — a pure function, `game` is `"capitals"` or anything else (including `undefined`) — returning `{ scores: string, log: string, cacheKey: string }`. `getSheet_(game)`, `getPlayLogSheet_(game)`, `getSortedAll_(game)` all take the same `game` parameter and use `sheetNamesFor_` internally. `doPost(e)`/`doGet(e)` derive `game` from `data.game` / `e.parameter.game` (defaulting to `"flags"` behavior when absent or anything other than `"capitals"`).

- [ ] **Step 1: Write the failing test**

Create `leaderboard-apps-script.test.js`:

```js
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
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node leaderboard-apps-script.test.js`
Expected: throws `TypeError: sheetNamesFor_ is not a function` (or similar — `module.exports` doesn't exist in `leaderboard-apps-script.js` yet).

- [ ] **Step 3: Implement `sheetNamesFor_` and thread `game` through the sheet/cache functions**

Replace:

```js
const SHEET_NAME = "Scores";
const PLAY_LOG_SHEET_NAME = "PlayLog";
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

// Log-only sheet: every finished game lands here (even ones that never got
// a name typed in and submitted to the real leaderboard).
function getPlayLogSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PLAY_LOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PLAY_LOG_SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Score", "Flags", "Streak", "Practice"]);
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
```

with:

```js
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
```

- [ ] **Step 4: Thread `game` through `doPost` and `doGet`**

Replace:

```js
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const name = String(data.name || "Anonymous").slice(0, 24);
  const score = Number(data.score) || 0;
  const flags = Number(data.flags) || 0;
  const streak = Number(data.streak) || 0;

  if (data.type === "play") {
    const logSheet = getPlayLogSheet_();
    logSheet.appendRow([new Date(), name, score, flags, streak, !!data.practice]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSheet_();
  sheet.appendRow([new Date(), name, score, flags, streak]);
  CacheService.getScriptCache().remove(CACHE_KEY);

  const scores = sheet.getDataRange().getValues().slice(1).map(r => Number(r[2]) || 0);
  const rank = scores.filter(s => s > score).length + 1;

  return ContentService
    .createTextOutput(JSON.stringify({ rank: rank, total: scores.length }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

with:

```js
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
```

Replace:

```js
function doGet(e) {
  let all = getSortedAll_();

  const total = all.length;
```

with:

```js
function doGet(e) {
  const p = (e && e.parameter) || {};
  const game = p.game === "capitals" ? "capitals" : "flags";
  let all = getSortedAll_(game);

  const total = all.length;
```

Then, further down in the same function, replace:

```js
  const p = (e && e.parameter) || {};
  if (p.score !== undefined) {
```

with:

```js
  if (p.score !== undefined) {
```

(`p` is now declared once at the top of `doGet`, so this second declaration is removed to avoid a duplicate-`const` error.)

- [ ] **Step 5: Add the Node-test export guard**

At the very end of `leaderboard-apps-script.js`, add:

```js

// Exposed for leaderboard-apps-script.test.js only. Apps Script's runtime
// has no `module` global, so this is a no-op when deployed.
if (typeof module !== "undefined") {
  module.exports = { sheetNamesFor_ };
}
```

- [ ] **Step 6: Run the test and confirm it passes**

Run: `node leaderboard-apps-script.test.js`
Expected: `All leaderboard-apps-script tests passed`

- [ ] **Step 7: Commit**

```bash
git add leaderboard-apps-script.js leaderboard-apps-script.test.js
git commit -m "feat(leaderboard): support per-game sheets via a game param, default to flags"
```

---

## Final acceptance check (no new code)

After Task 5 is committed and pushed to `main` (which triggers the existing `Deploy Apps Script` GitHub Actions workflow), do a full manual pass:

1. Play flag-master at the repo root end-to-end (start → answer a few rounds → lose all lives → submit a score). Confirm it behaves exactly as before and its entry lands in the `Scores`/`PlayLog` sheets (not the `Capital*` ones).
2. Play capital-master end-to-end the same way. Confirm the flag+country prompt, capital-choice answers, streak/multiplier, share flow, and leaderboard submit/fetch all work, and its entry lands in `CapitalScores`/`CapitalPlayLog`.
3. Confirm the two games' `localStorage` best-score/name/theme entries stay independent (spot-checked in Task 4, re-confirm here after all later tasks have landed).
