# Flag Master PT Localization A/B Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Portuguese localization of Flag Master's core play loop, gated behind a PostHog feature flag so its effect on completion rate can be measured as an A/B test, for Portuguese-browser visitors only.

**Architecture:** A single mutable `locale` variable (default `"en"`) is set once, early, from a PostHog feature-flag check that only runs for visitors whose `navigator.language` starts with `pt`. Every render site that currently hardcodes an English string is changed to consult `locale` at the moment it renders (not a one-time batch DOM rewrite) — this avoids any race between async flag loading and the first question rendering. Country names and UI strings live in plain JS lookup tables (`COUNTRY_NAMES_PT`, `LEVELS_PT`, `RANKS`), consistent with the file's existing style (no build step, single HTML file).

**Tech Stack:** Vanilla JS embedded in `index.html`, PostHog JS SDK (already loaded), no test framework (this repo has no frontend test harness — `leaderboard-apps-script.test.js` only covers the Apps Script backend). Verification here uses `node --check` for syntax and the Browser pane (`mcp__Claude_Browser__*`) for behavior, matching how this session already verified `index.html` changes.

## Global Constraints

- Country matching logic in `answerWith`/`lockRound` compares `dataset.code === answer[0]` (country codes), never display names — translating display text cannot affect scoring. Do not touch this comparison.
- Analytics stability: the `rank` property sent to PostHog via `track("game_over", ...)` must always be the **English** rank title (e.g. `"World Legend"`), regardless of display `locale`, so existing PostHog rank breakdowns keep working across both variants. Only the on-screen text and share text vary by locale.
- Feature flag key: `flag-master-pt-localization`. Detection gate: only visitors where `navigator.language` (lowercased) starts with `"pt"` ever call `posthog.getFeatureFlag`; everyone else never enters the experiment and is never delayed by it.
- No manual language toggle in this version (confirmed with user — out of scope).
- Do not localize: the cross-promo card, settings/footer text, or the leaderboard nearby/top-3 widgets (fetch-driven lists, "flags"/"pts" unit labels, loading/error states) — these are secondary widgets, not the core play loop, and are out of scope per the approved spec's non-goals.
- Manual browser verification against the real `index.html` will emit real PostHog events under the project's live API key (same as this session's existing testing practice) — a handful of test `game_started`/`game_over`/`flag_answered` events from manual playthroughs is expected and acceptable, not a bug.
- Country name translations use European Portuguese (pt-PT) spelling throughout (e.g. "Polónia", not "Polônia"), since Portugal (114 games/month) is the larger of the two Portuguese-speaking markets in this dataset versus Brazil (26 games/month). This is a judgment call, not a spec requirement — flag it to the user if they'd prefer Brazilian Portuguese spelling instead.
- The 195-entry country translation table below is a best-effort machine translation covering every code in the existing `COUNTRIES` array. A few entries (small/less-common nations) carry more translation-accuracy risk than the well-known ones — worth a native-speaker skim before merging, though the fallback-to-English behavior means a wrong or missing entry never breaks the game, only shows the English name.

---

### Task 1: Branch setup + country name translations

**Files:**
- Modify: `index.html:802` (insert `COUNTRY_NAMES_PT` after the `COUNTRIES` array), `index.html:814` (insert `let locale = "en";`), `index.html:1009` (country-name render), `index.html:1015` (aria-label), `index.html:1121-1124` (`nameOf`)

**Interfaces:**
- Produces: `let locale` (global, `"en"` | `"pt"`), `COUNTRY_NAMES_PT` (object, keyed by country code), `nameOf(code)` (locale-aware, unchanged signature), `countryName(c)` (new helper, takes a `COUNTRIES` row, returns display string)

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b feature/pt-localization-ab-test
```

- [ ] **Step 2: Add `locale` state**

In `index.html`, after line 814 (`const CROSS_PROMO_URL = "capital-master/";`) and before line 816 (`const $ = id => ...`), insert:

```javascript
let locale = "en";
```

- [ ] **Step 3: Add the country name translation table**

In `index.html`, immediately after line 802 (the `];` closing the `COUNTRIES` array), insert:

```javascript
const COUNTRY_NAMES_PT = {
  us: "Estados Unidos", br: "Brasil", fr: "França", de: "Alemanha",
  it: "Itália", es: "Espanha", gb: "Reino Unido", jp: "Japão",
  cn: "China", ca: "Canadá", mx: "México", ar: "Argentina",
  pt: "Portugal", au: "Austrália", in: "Índia", ru: "Rússia",
  kr: "Coreia do Sul", nl: "Países Baixos", ch: "Suíça", se: "Suécia",
  no: "Noruega", gr: "Grécia", tr: "Turquia", eg: "Egito",
  za: "África do Sul", ie: "Irlanda", dk: "Dinamarca", be: "Bélgica",
  pl: "Polónia", at: "Áustria", fi: "Finlândia", ua: "Ucrânia",
  cl: "Chile", co: "Colômbia", pe: "Peru", uy: "Uruguai",
  ve: "Venezuela", cu: "Cuba", th: "Tailândia", vn: "Vietname",
  ph: "Filipinas", id: "Indonésia", my: "Malásia", sg: "Singapura",
  nz: "Nova Zelândia", il: "Israel", sa: "Arábia Saudita", ae: "Emirados Árabes Unidos",
  ma: "Marrocos", ng: "Nigéria", ke: "Quénia", cz: "Chéquia",
  hu: "Hungria", ro: "Roménia", hr: "Croácia", is: "Islândia",
  pk: "Paquistão", bd: "Bangladeche", ec: "Equador", bo: "Bolívia",
  py: "Paraguai", pa: "Panamá", cr: "Costa Rica", jm: "Jamaica",
  qa: "Catar", ir: "Irão", iq: "Iraque", dz: "Argélia",
  si: "Eslovénia", sk: "Eslováquia", rs: "Sérvia", bg: "Bulgária",
  lt: "Lituânia", lv: "Letónia", ee: "Estónia", md: "Moldávia",
  al: "Albânia", mk: "Macedónia do Norte", ba: "Bósnia e Herzegovina", me: "Montenegro",
  lu: "Luxemburgo", mt: "Malta", cy: "Chipre", am: "Arménia",
  ge: "Geórgia", az: "Azerbaijão", kz: "Cazaquistão", uz: "Usbequistão",
  kg: "Quirguistão", tj: "Tajiquistão", tm: "Turquemenistão", mn: "Mongólia",
  np: "Nepal", lk: "Sri Lanka", mm: "Mianmar", kh: "Camboja",
  la: "Laos", bt: "Butão", bn: "Brunei", om: "Omã",
  kw: "Kuwait", bh: "Barém", jo: "Jordânia", lb: "Líbano",
  tn: "Tunísia", ly: "Líbia", sd: "Sudão", et: "Etiópia",
  gh: "Gana", ci: "Costa do Marfim", sn: "Senegal", cm: "Camarões",
  tz: "Tanzânia", ug: "Uganda", zm: "Zâmbia", zw: "Zimbabué",
  mz: "Moçambique", ao: "Angola", na: "Namíbia", bw: "Botsuana",
  mg: "Madagáscar", mu: "Maurícia", fj: "Fiji", pg: "Papua-Nova Guiné",
  gt: "Guatemala", hn: "Honduras", sv: "El Salvador", ni: "Nicarágua",
  do: "República Dominicana", ht: "Haiti", tt: "Trindade e Tobago", gy: "Guiana",
  sr: "Suriname", bz: "Belize", mv: "Maldivas", mc: "Mónaco",
  li: "Liechtenstein", ad: "Andorra", sm: "São Marino", va: "Cidade do Vaticano",
  af: "Afeganistão", ag: "Antígua e Barbuda", bb: "Barbados", bf: "Burquina Faso",
  bi: "Burundi", bj: "Benim", bs: "Baamas", by: "Bielorrússia",
  cd: "RD Congo", cf: "República Centro-Africana", cg: "República do Congo", cv: "Cabo Verde",
  dj: "Jibuti", dm: "Dominica", er: "Eritreia", fm: "Micronésia",
  ga: "Gabão", gd: "Granada", gm: "Gâmbia", gn: "Guiné",
  gq: "Guiné Equatorial", gw: "Guiné-Bissau", ki: "Quiribáti", km: "Comores",
  kn: "São Cristóvão e Neves", kp: "Coreia do Norte", lc: "Santa Lúcia", lr: "Libéria",
  ls: "Lesoto", mh: "Ilhas Marshall", ml: "Mali", mr: "Mauritânia",
  mw: "Malaui", ne: "Níger", nr: "Nauru", ps: "Palestina",
  pw: "Palau", rw: "Ruanda", sb: "Ilhas Salomão", sc: "Seicheles",
  sl: "Serra Leoa", so: "Somália", ss: "Sudão do Sul", st: "São Tomé e Príncipe",
  sy: "Síria", sz: "Essuatíni", td: "Chade", tg: "Togo",
  tl: "Timor-Leste", to: "Tonga", tv: "Tuvalu", vc: "São Vicente e Granadinas",
  vu: "Vanuatu", ws: "Samoa", ye: "Iémen",
};
```

- [ ] **Step 4: Verify translation coverage against `COUNTRIES`**

Run:

```bash
node -e '
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const countriesSrc = html.match(/const COUNTRIES = \[([\s\S]*?)\n\];/)[1];
const ptSrc = html.match(/const COUNTRY_NAMES_PT = \{([\s\S]*?)\n\};/)[1];
const countries = eval("[" + countriesSrc + "]");
const pt = eval("({" + ptSrc + "})");
const missing = countries.map(c => c[0]).filter(code => !pt[code]);
console.log(missing.length === 0 ? "OK: " + countries.length + "/" + countries.length : "MISSING: " + missing.join(","));
'
```

Expected: `OK: 195/195`

- [ ] **Step 5: Make `nameOf` locale-aware and add `countryName`**

Replace (around line 1121):

```javascript
function nameOf(code) {
  const c = COUNTRIES.find(c => c[0] === code);
  return c ? c[1] : code;
}
```

with:

```javascript
function nameOf(code) {
  if (locale === "pt" && COUNTRY_NAMES_PT[code]) return COUNTRY_NAMES_PT[code];
  const c = COUNTRIES.find(c => c[0] === code);
  return c ? c[1] : code;
}

function countryName(c) {
  return (locale === "pt" && COUNTRY_NAMES_PT[c[0]]) ? COUNTRY_NAMES_PT[c[0]] : c[1];
}
```

- [ ] **Step 6: Wire the question render and flag aria-labels to use the locale-aware name**

In `nextRound()`, replace line 1009:

```javascript
  $("country-name").textContent = answer[1];
```

with:

```javascript
  $("country-name").textContent = countryName(answer);
```

And replace the options template (around line 1015):

```javascript
  $("options").innerHTML = options.map(c =>
    `<button class="flag-btn" data-code="${c[0]}" aria-label="Guess ${c[1]}">
```

with:

```javascript
  $("options").innerHTML = options.map(c =>
    `<button class="flag-btn" data-code="${c[0]}" aria-label="Guess ${countryName(c)}">
```

- [ ] **Step 7: Run the syntax check**

```bash
node --check <(sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d')
```

Expected: no output (exit code 0).

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat(i18n): add Portuguese country name translations"
```

---

### Task 2: UI string translations (levels, feedback, ranks, share text)

**Files:**
- Modify: `index.html:806` (LEVELS_PT), `index.html:1003-1009` (qnum), `index.html:1088-1101` (feedback), `index.html:1109-1119` (timeout feedback), `index.html:1126-1133` (rank → RANKS), `index.html:1135-1159` (endGame), `index.html:1377-1401` (RANK_EMOJI/shareText), `index.html:718` (share button label markup)

**Interfaces:**
- Consumes: `locale` (from Task 1), `nameOf(code)` (from Task 1)
- Produces: `LEVELS_PT`, `RANKS` (array replacing `rank()`/`RANK_EMOJI`), `rankFor(flags)` (replaces `rank(flags)`; returns a `RANKS` entry, not a tuple)

- [ ] **Step 1: Add `LEVELS_PT`**

In `index.html`, after line 806 (`const LEVELS = { ... };`), insert:

```javascript
const LEVELS_PT = { 1: "Aquecendo", 2: "Ficando difícil", 3: "Fera das bandeiras", 4: "Muito difícil" };
```

- [ ] **Step 2: Localize the level label and question number**

Replace line 931:

```javascript
  $("level-txt").textContent = LEVELS[answer[2]];
```

with:

```javascript
  $("level-txt").textContent = (locale === "pt" ? LEVELS_PT : LEVELS)[answer[2]];
```

Replace line 1008:

```javascript
  $("qnum").textContent = `Flag ${round + 1}`;
```

with:

```javascript
  $("qnum").textContent = locale === "pt" ? `Bandeira ${round + 1}` : `Flag ${round + 1}`;
```

- [ ] **Step 3: Localize round-feedback text**

Replace (around lines 1088-1094):

```javascript
    const multTag = multiplier > 1 ? ` ×${multiplier}` : "";
    const milestone = streak % 10 === 0;
    if (milestone) {
      setFeedback(`+${pts}${multTag}   ·   🔥 ${streak} STREAK!`, "good milestone");
    } else {
      setFeedback(`+${pts}${multTag}${streak >= 3 ? "   ·   " + streak + " in a row" : ""}`, "good");
    }
```

with:

```javascript
    const multTag = multiplier > 1 ? ` ×${multiplier}` : "";
    const milestone = streak % 10 === 0;
    if (milestone) {
      const streakWord = locale === "pt" ? "SEQUÊNCIA!" : "STREAK!";
      setFeedback(`+${pts}${multTag}   ·   🔥 ${streak} ${streakWord}`, "good milestone");
    } else {
      const comboWord = locale === "pt" ? "seguidas" : "in a row";
      setFeedback(`+${pts}${multTag}${streak >= 3 ? "   ·   " + streak + " " + comboWord : ""}`, "good");
    }
```

Replace line 1101:

```javascript
    setFeedback(`That flag is ${nameOf(btn.dataset.code)}`, "bad");
```

with:

```javascript
    setFeedback(locale === "pt" ? `Essa bandeira é do(a) ${nameOf(btn.dataset.code)}` : `That flag is ${nameOf(btn.dataset.code)}`, "bad");
```

Replace line 1114:

```javascript
  setFeedback("Out of time", "bad");
```

with:

```javascript
  setFeedback(locale === "pt" ? "Tempo esgotado" : "Out of time", "bad");
```

- [ ] **Step 4: Replace `rank()`/`RANK_EMOJI` with a locale-aware `RANKS` table**

Replace the `rank()` function (around lines 1126-1133):

```javascript
function rank(flags) {
  if (flags >= 60) return [ICON.globe, "World Legend", "Do you work at the UN?"];
  if (flags >= 40) return [ICON.crown, "Flag Master", "Genuinely elite. Respect."];
  if (flags >= 25) return [ICON.medal, "Globetrotter", "You know your way around a map."];
  if (flags >= 15) return [ICON.medal, "Traveler", "Solid geography instincts."];
  if (flags >= 8)  return [ICON.plane, "Tourist", "Not bad — the world is big."];
  return [ICON.compass, "Lost Tourist", "Time to spin the globe some more."];
}
```

with:

```javascript
const RANKS = [
  { min: 60, icon: ICON.globe,   emoji: "🌍", en: ["World Legend", "Do you work at the UN?"], pt: ["Lenda Mundial", "Trabalhas na ONU?"] },
  { min: 40, icon: ICON.crown,   emoji: "🏆", en: ["Flag Master", "Genuinely elite. Respect."], pt: ["Mestre das Bandeiras", "Verdadeiramente de elite. Respeito."] },
  { min: 25, icon: ICON.medal,   emoji: "🥇", en: ["Globetrotter", "You know your way around a map."], pt: ["Globetrotter", "Sabes mesmo orientar-te num mapa."] },
  { min: 15, icon: ICON.medal,   emoji: "🥈", en: ["Traveler", "Solid geography instincts."], pt: ["Viajante", "Bom instinto de geografia."] },
  { min: 8,  icon: ICON.plane,   emoji: "🧳", en: ["Tourist", "Not bad — the world is big."], pt: ["Turista", "Nada mau — o mundo é grande."] },
  { min: 0,  icon: ICON.compass, emoji: "🧭", en: ["Lost Tourist", "Time to spin the globe some more."], pt: ["Turista Perdido", "Hora de rodar mais um pouco o globo."] },
];

function rankFor(flags) {
  return RANKS.find(r => flags >= r.min) || RANKS[RANKS.length - 1];
}
```

- [ ] **Step 5: Update `endGame()` to use `rankFor` and localize the share button label**

Replace (around lines 1135-1142):

```javascript
function endGame() {
  clearInterval(timerId);
  const flagsRight = results.filter(r => r === "ok").length;
  const [icon, title, sub] = rank(flagsRight);
  track("game_over", { mode: practiceMode ? "practice" : "standard", score, flags_right: flagsRight, best_streak: bestStreak, rounds_played: results.length, rank: title });
  $("end-medal").innerHTML = icon;
  $("end-title").textContent = title;
  $("end-subtitle").textContent = sub;
```

with:

```javascript
function endGame() {
  clearInterval(timerId);
  const flagsRight = results.filter(r => r === "ok").length;
  const rk = rankFor(flagsRight);
  const [title, sub] = locale === "pt" ? rk.pt : rk.en;
  track("game_over", { mode: practiceMode ? "practice" : "standard", score, flags_right: flagsRight, best_streak: bestStreak, rounds_played: results.length, rank: rk.en[0] });
  $("end-medal").innerHTML = rk.icon;
  $("end-title").textContent = title;
  $("end-subtitle").textContent = sub;
  $("btn-share-label").textContent = locale === "pt" ? "Desafiar um amigo" : "Challenge a friend";
```

Note: `rank: rk.en[0]` is intentional — analytics always records the English rank name regardless of display locale (see Global Constraints).

- [ ] **Step 6: Add an id to the share button label in the HTML markup**

Find (around line 718):

```html
          <button class="btn" id="btn-share"><span id="ic-share"></span>Challenge a friend</button>
```

Replace with:

```html
          <button class="btn" id="btn-share"><span id="ic-share"></span><span id="btn-share-label">Challenge a friend</span></button>
```

- [ ] **Step 7: Localize `shareText()`**

Replace (around lines 1377-1401):

```javascript
const RANK_EMOJI = {
  "World Legend": "🌍", "Flag Master": "🏆", "Globetrotter": "🥇",
  "Traveler": "🥈", "Tourist": "🧳", "Lost Tourist": "🧭",
};

function shareText() {
  const flagsRight = results.filter(r => r === "ok").length;
  const total = results.length;
  const [, title] = rank(flagsRight);
  const squares = results.map(r => r === "ok" ? "🟩" : r === "no" ? "🟥" : "⬛");
  // group into rows of 10 so the grid reads cleanly in a comment
  const grid = [];
  for (let i = 0; i < squares.length; i += 10) grid.push(squares.slice(i, i + 10).join(""));
  return [
    `${RANK_EMOJI[title]} Flag Master — ${title}`,
    ``,
    `🎯 ${flagsRight}/${total} flags correct`,
    `⭐ ${score.toLocaleString()} points`,
    `🔥 Best streak: ${bestStreak}`,
    ``,
    grid.join("\n"),
    ``,
    `Think you can beat my score of ${score.toLocaleString()}? →`,
    GAME_URL,
  ].join("\n");
}
```

with:

```javascript
function shareText() {
  const flagsRight = results.filter(r => r === "ok").length;
  const total = results.length;
  const rk = rankFor(flagsRight);
  const isPt = locale === "pt";
  const title = isPt ? rk.pt[0] : rk.en[0];
  const squares = results.map(r => r === "ok" ? "🟩" : r === "no" ? "🟥" : "⬛");
  // group into rows of 10 so the grid reads cleanly in a comment
  const grid = [];
  for (let i = 0; i < squares.length; i += 10) grid.push(squares.slice(i, i + 10).join(""));
  return [
    `${rk.emoji} Flag Master — ${title}`,
    ``,
    isPt ? `🎯 ${flagsRight}/${total} bandeiras corretas` : `🎯 ${flagsRight}/${total} flags correct`,
    isPt ? `⭐ ${score.toLocaleString()} pontos` : `⭐ ${score.toLocaleString()} points`,
    isPt ? `🔥 Melhor sequência: ${bestStreak}` : `🔥 Best streak: ${bestStreak}`,
    ``,
    grid.join("\n"),
    ``,
    isPt ? `Achas que consegues bater a minha pontuação de ${score.toLocaleString()}? →` : `Think you can beat my score of ${score.toLocaleString()}? →`,
    GAME_URL,
  ].join("\n");
}
```

- [ ] **Step 8: Run the syntax check**

```bash
node --check <(sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d')
```

Expected: no output (exit code 0).

- [ ] **Step 9: Browser check of both variants without touching PostHog yet**

Use the Browser pane to open `index.html`, then use `javascript_tool` to run:

```javascript
locale = "pt";
JSON.stringify({
  country: countryName(COUNTRIES.find(c => c[0] === "br")),
  level: LEVELS_PT[1],
  rank: rankFor(50).pt,
});
```

Expected: `{"country":"Brasil","level":"Aquecendo","rank":["Globetrotter","Sabes mesmo orientar-te num mapa."]}`

Then run `locale = "en";` and confirm the same expressions return the original English strings. Check `read_console_messages` for errors after each.

- [ ] **Step 10: Commit**

```bash
git add index.html
git commit -m "feat(i18n): add Portuguese UI string translations for levels, feedback, ranks, and share text"
```

---

### Task 3: Locale detection via PostHog feature flag

**Files:**
- Modify: `index.html:818` (insert detection block, right after the existing `player_name` super-property registration)

**Interfaces:**
- Consumes: `locale` (declared in Task 1)
- Produces: sets `locale = "pt"` asynchronously when the visitor is both browser-language-Portuguese and assigned the `"test"` variant of the `flag-master-pt-localization` flag

- [ ] **Step 1: Add the detection block**

In `index.html`, immediately after line 818 (`try { const n = localStorage.getItem(NAME_KEY); if (n) posthog.register({ player_name: n }); } catch {}`), insert:

```javascript
try {
  if (navigator.language && navigator.language.toLowerCase().startsWith("pt")) {
    posthog.onFeatureFlags(() => {
      try {
        if (posthog.getFeatureFlag("flag-master-pt-localization") === "test") locale = "pt";
      } catch {}
    });
  }
} catch {}
```

- [ ] **Step 2: Run the syntax check**

```bash
node --check <(sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d')
```

Expected: no output (exit code 0).

- [ ] **Step 3: Browser check — non-Portuguese browsers are unaffected**

Open `index.html` in the Browser pane. Use `javascript_tool` to confirm:

```javascript
navigator.language
```

If it does not start with `pt`, confirm `locale` stays `"en"` after a few seconds (no `posthog.onFeatureFlags` callback should have fired the pt branch). Check `read_console_messages` for errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(i18n): detect Portuguese browsers and gate locale behind PostHog feature flag"
```

---

### Task 4: Create the PostHog feature flag / experiment

**Files:** none (PostHog project configuration only)

- [ ] **Step 1: Create the draft experiment**

Call the PostHog `experiment-create` tool:

```json
{
  "name": "Flag Master PT localization",
  "description": "Tests whether a Portuguese-localized UI (country names + core play-loop strings) changes game_over completion rate for Portuguese-browser visitors, vs. the existing English-only experience.",
  "feature_flag_key": "flag-master-pt-localization"
}
```

This creates the flag with the tool's defaults: 50/50 `control`/`test` split, 100% rollout. No further flag config is needed — the client-side `navigator.language` check (Task 3) is what actually restricts the experiment to Portuguese-browser visitors; PostHog's 100% rollout applies only within that pre-filtered group.

- [ ] **Step 2: Confirm the flag key**

Call `feature-flag-get-all` (or equivalent) and confirm `flag-master-pt-localization` exists with variants `control` and `test`. This must match the string literal used in Task 3's code exactly.

- [ ] **Step 3: Leave the experiment in draft / do not launch yet**

Do not launch the experiment until Task 5's end-to-end browser verification passes. Launching starts the clock on the 4-8 week sample-size window noted in the spec.

---

### Task 5: End-to-end verification and PR

**Files:** none (verification + git only)

- [ ] **Step 1: Full playthrough — English (default) variant**

In the Browser pane, open `index.html` fresh (real, unmodified `navigator.language`, assuming it isn't Portuguese). Play one full game through to the end screen. Confirm:
- Country names, level label, feedback text, rank title/subtitle, and share button text are all in English (unchanged from before this branch).
- `read_console_messages` shows no errors.

- [ ] **Step 2: Full playthrough — Portuguese (test) variant**

Use `javascript_tool` to force the test variant deterministically for this check (bypassing the real flag assignment, which is randomized):

```javascript
locale = "pt";
```

Then play one full game through to the end screen via the Browser pane's `computer` tool (clicking, not JS). Confirm:
- The question shows a Portuguese country name (e.g. "Brasil", "Alemanha").
- The level chip, in-round feedback ("+N", "SEQUÊNCIA!"/"seguidas", "Tempo esgotado", "Essa bandeira é do(a) ..."), end-screen rank title/subtitle, and the share button label ("Desafiar um amigo") are all in Portuguese.
- Clicking share (or copying) produces Portuguese share text.
- Gameplay itself (scoring, streaks, lives, correct/incorrect detection) behaves identically to the English playthrough — only text differs.
- `read_console_messages` shows no errors.

- [ ] **Step 3: Confirm flag-driven assignment works (not just the manual override)**

Use `javascript_tool` to spoof `navigator.language` before the page's script runs, by reloading with an injected override:

```javascript
Object.defineProperty(navigator, "language", { value: "pt-PT", configurable: true });
```

then `navigate` to reload `index.html`, and after a short wait, check via `javascript_tool`:

```javascript
typeof posthog.getFeatureFlag === "function" ? posthog.getFeatureFlag("flag-master-pt-localization") : "posthog not ready"
```

Confirm it resolves to `"control"` or `"test"` (not `undefined`), and that `locale` matches (`"pt"` only when the variant is `"test"`).

- [ ] **Step 4: Confirm the PR is ready**

Run:

```bash
git status
git log main..feature/pt-localization-ab-test --oneline
```

Confirm only the expected commits from Tasks 1-3 are present and the working tree is clean.

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin feature/pt-localization-ab-test
gh pr create --title "Add Portuguese localization A/B test for Flag Master" --body "$(cat <<'EOF'
## Summary
- Adds Portuguese translations for country names and core play-loop UI strings (levels, feedback, ranks, share text), gated behind a PostHog feature flag (`flag-master-pt-localization`).
- Only visitors with a Portuguese `navigator.language` are entered into the experiment (50/50 control/test); everyone else is unaffected.
- Analytics `rank` property stays English-canonical in both variants so existing PostHog rank breakdowns keep working.
- No manual language toggle in this version (deliberate — see design spec).

## Test plan
- [x] Manual English playthrough — unaffected, no console errors
- [x] Manual Portuguese playthrough (forced `locale = "pt"`) — all core-loop strings localized, gameplay logic unaffected
- [x] Confirmed PostHog feature flag drives `locale` assignment via spoofed `navigator.language`
- [ ] PostHog experiment created in draft, to be launched after this PR merges

Spec: docs/superpowers/specs/2026-07-26-flag-master-pt-localization-ab-test-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Report the PR URL back to the user.

## Self-Review Notes

- **Spec coverage:** targeting/detection (Task 3), country names (Task 1), UI strings (Task 2), measurement/analytics stability (Task 2 Step 5 note), error handling/fallback (Task 1's `nameOf`/`countryName` already fall back to English when a PT key is missing; Task 3's flag check defaults to `"en"` if unresolved or erroring), testing (Task 5), rollout expectation (already in the spec, referenced in Task 4 Step 3) — all covered.
- **Type consistency:** `rankFor(flags)` returns a `RANKS` entry object (`{min, icon, emoji, en, pt}`) everywhere it's used (Task 2 Steps 4, 5, 7) — no lingering references to the old tuple-returning `rank()`.
- **No placeholders:** every step has literal code or literal commands with expected output.
