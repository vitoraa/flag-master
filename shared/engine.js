/* ---------- icon set (inline SVG, stroke-based) ---------- */
const ICON = {
  flag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
  heartSmall: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/></svg>',
  trend: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>',
  heart: '<svg class="heart" width="22" height="22" viewBox="0 0 24 24"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z" fill="currentColor"/></svg>',
  check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>',
  replay: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>',
  globe: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>',
  crown: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l4.5 4L12 5l4.5 6L21 7l-1.5 12h-15z"/></svg>',
  medal: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.5 9.5L6 2h4l2 4 2-4h4l-2.5 7.5"/><path d="M12 13l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2L9.1 15l2-.3z"/></svg>',
  compass: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="16 8 10.5 10.5 8 16 13.5 13.5"/></svg>',
  sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="7" y2="7"/><line x1="17" y1="17" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="7" y2="17"/><line x1="17" y1="7" x2="19.1" y2="4.9"/></svg>',
  moon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>',
  close: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  plane: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15l-9-4V4a2 2 0 0 0-4 0v7l-5 2v2l5-1v3l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-3l8 2z"/></svg>',
  flame: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1.2-.5-2-1-2.7.9.2 3 1.6 3 5.2a5 5 0 0 1-10 0C7 8 12 6 12 2z"/></svg>',
};

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

const $ = id => document.getElementById(id);
const track = (event, props) => { try { posthog.capture(event, props); } catch {} };
try { const n = localStorage.getItem(NAME_KEY); if (n) posthog.register({ player_name: n }); } catch {}
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const flagUrl = code => `flags/${code}.png`;

let queue = [], round = 0, lives = MAX_LIVES, score = 0;
let streak = 0, bestStreak = 0, results = [], timerId = null, timeLeft = 0, locked = false;
let newBestAnnounced = false;

let practiceMode = false;
let practiceCfg = { timer: "off", lives: "unlimited", difficulty: "easy" };

function buildQueue() {
  if (practiceMode && practiceCfg.difficulty === "easy") {
    return shuffle(COUNTRIES.filter(c => c[2] === 1));
  }
  const t1 = shuffle(COUNTRIES.filter(c => c[2] === 1));
  const t2 = shuffle(COUNTRIES.filter(c => c[2] === 2));
  const t3 = shuffle(COUNTRIES.filter(c => c[2] === 3));
  const t4 = shuffle(COUNTRIES.filter(c => c[2] === 4));
  return [...t1, ...t2, ...t3, ...t4];
}

function getPersonalBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function savePersonalBest(bestScore, bestFlags) {
  try { localStorage.setItem(BEST_KEY, JSON.stringify({ score: bestScore, flags: bestFlags })); } catch {}
}

function renderPersonalBest() {
  const el = $("personal-best");
  const best = getPersonalBest();
  if (!best) { el.style.display = "none"; return; }
  $("pb-flags").textContent = best.flags;
  $("pb-score").textContent = best.score.toLocaleString();
  el.style.display = "";
}

function show(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
  $("flag-bg").style.display = (name === "start" || name === "practice-setup") ? "" : "none";
  $("theme-toggle").style.display = name === "game" ? "none" : "";
  $("arcade-trigger").style.display = name === "game" ? "none" : "";
  closeArcadeSheet();
  if (name === "start") renderPersonalBest();
}

const rnd = (min, max) => min + Math.random() * (max - min);

function startGame() {
  logPlay();
  track("game_started", practiceMode
    ? { mode: "practice", timer: practiceCfg.timer, lives: practiceCfg.lives, difficulty: practiceCfg.difficulty }
    : { mode: "standard" });
  queue = buildQueue();
  round = 0;
  lives = (practiceMode && practiceCfg.lives === "unlimited") ? Infinity : MAX_LIVES;
  score = 0; streak = 0; bestStreak = 0; results = []; newBestAnnounced = false;
  displayedScore = 0;
  lastAnimatedStreak = -1;
  $("score").textContent = "0";
  $("streak").style.display = "none";
  show("game");
  nextRound();
}

function quitToStart() {
  clearInterval(timerId);
  locked = true;
  show("start");
}

let displayedScore = 0;
let lastAnimatedStreak = -1;

function renderHud(answer) {
  $("lives").innerHTML = Array.from({length: MAX_LIVES}, (_, i) =>
    ICON.heart.replace('class="heart"', `class="heart ${i >= lives ? "lost" : ""}"`)).join("");
  $("level-txt").textContent = LEVELS[answer[2]];

  if (score !== displayedScore) {
    animateScore($("score"), displayedScore, score);
    displayedScore = score;
  }

  const streakEl = $("streak");
  if (streak >= 2) {
    const milestone = streak > 0 && streak % 10 === 0;
    const multiplier = streakMultiplier(streak);
    $("streak-num").textContent = streak;
    $("streak-mult").textContent = multiplier > 1 ? `×${multiplier}` : "";
    $("streak-mult").style.display = multiplier > 1 ? "" : "none";
    streakEl.style.display = "inline-flex";
    if (streak !== lastAnimatedStreak) {
      streakEl.classList.remove("pop", "milestone");
      void streakEl.offsetWidth;
      streakEl.classList.add(milestone ? "milestone" : "pop");
      if (milestone) triggerMilestoneFlash();
    }
    lastAnimatedStreak = streak;
  } else {
    streakEl.style.display = "none";
    streakEl.classList.remove("pop", "milestone");
    lastAnimatedStreak = -1;
  }
}

function triggerMilestoneFlash() {
  const flash = $("milestone-flash");
  flash.classList.remove("show");
  void flash.offsetWidth;
  flash.classList.add("show");
}

function triggerNewBestBanner() {
  const banner = $("new-best-banner");
  banner.classList.add("show");
  clearTimeout(banner.__hideTimer);
  banner.__hideTimer = setTimeout(() => banner.classList.remove("show"), 2200);
}

function animateScore(el, from, to) {
  const duration = 450;
  const start = performance.now();
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = to;
  }
  requestAnimationFrame(step);
}

function streakMultiplier(s) {
  if (s >= 20) return 3;
  if (s >= 10) return 2;
  if (s >= 5) return 1.5;
  return 1;
}

function pickDistractors(answer) {
  if (GAME.pickDistractors) return GAME.pickDistractors(answer, COUNTRIES);
  const sameTier = COUNTRIES.filter(c => c !== answer && c[2] === answer[2]);
  const rest = COUNTRIES.filter(c => c !== answer && c[2] !== answer[2]);
  return shuffle(sameTier).slice(0, 3).concat(shuffle(rest)).slice(0, 3);
}

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

  clearInterval(timerId);
  const noTimer = practiceMode && practiceCfg.timer === "off";
  if (noTimer) {
    $("timerbar").style.display = "none";
    timeLeft = Infinity;
  } else {
    $("timerbar").style.display = "";
    timeLeft = ROUND_TIME;
    updateTimerBar();
    timerId = setInterval(() => {
      timeLeft -= 0.1;
      updateTimerBar();
      if (timeLeft <= 0) timeUp(answer);
    }, 100);
  }
}

function updateTimerBar() {
  const pct = Math.max(0, timeLeft / ROUND_TIME * 100);
  const fill = $("timerfill");
  fill.style.width = pct + "%";
  fill.classList.toggle("danger", timeLeft <= 3);
}

function lockRound(answer) {
  locked = true;
  clearInterval(timerId);
  $("options").querySelectorAll("button").forEach(b => {
    b.disabled = true;
    if (b.dataset.key === GAME.optionKey(answer)) {
      b.classList.add("correct");
      b.querySelector(".mark").innerHTML = ICON.check;
    } else {
      b.classList.add("dim");
    }
  });
}

function setFeedback(text, kind) {
  const f = $("feedback");
  f.textContent = text;
  f.className = `feedback show ${kind}`;
}

function answerWith(btn, answer) {
  if (locked) return;
  const correct = btn.dataset.key === GAME.optionKey(answer);
  lockRound(answer);
  if (correct) {
    const noTimer = practiceMode && practiceCfg.timer === "off";
    const bonus = noTimer ? 0 : Math.ceil(timeLeft) * 10;
    const tierPts = answer[2] * 100;
    streak++; bestStreak = Math.max(bestStreak, streak);
    const multiplier = streakMultiplier(streak);
    const pts = Math.round((tierPts + bonus) * multiplier);
    score += pts;
    results.push("ok");

    if (!practiceMode && !newBestAnnounced) {
      const best = getPersonalBest();
      if (best && score > best.score) {
        newBestAnnounced = true;
        triggerNewBestBanner();
      }
    }

    const multTag = multiplier > 1 ? ` ×${multiplier}` : "";
    const milestone = streak % 10 === 0;
    if (milestone) {
      setFeedback(`+${pts}${multTag}   ·   🔥 ${streak} STREAK!`, "good milestone");
    } else {
      setFeedback(`+${pts}${multTag}${streak >= 3 ? "   ·   " + streak + " in a row" : ""}`, "good");
    }
  } else {
    btn.classList.remove("dim");
    btn.classList.add("wrong");
    btn.querySelector(".mark").innerHTML = ICON.x;
    lives--; streak = 0;
    results.push("no");
    setFeedback(GAME.wrongAnswerText(answer), "bad");
  }
  track(GAME.trackAnswerEvent, { result: correct ? "correct" : "incorrect", country: answer[0], tier: answer[2], streak, score, mode: practiceMode ? "practice" : "standard" });
  renderHud(answer);
  round++;
  setTimeout(nextRound, correct ? 850 : 1550);
}

function timeUp(answer) {
  if (locked) return;
  lockRound(answer);
  lives--; streak = 0;
  results.push("to");
  setFeedback("Out of time", "bad");
  track(GAME.trackAnswerEvent, { result: "timeout", country: answer[0], tier: answer[2], streak, score, mode: practiceMode ? "practice" : "standard" });
  renderHud(answer);
  round++;
  setTimeout(nextRound, 1350);
}

function rank(flags) {
  if (flags >= 60) return [ICON.globe, "World Legend", "Do you work at the UN?"];
  if (flags >= 40) return [ICON.crown, GAME.titlePlain, "Genuinely elite. Respect."];
  if (flags >= 25) return [ICON.medal, "Globetrotter", "You know your way around a map."];
  if (flags >= 15) return [ICON.medal, "Traveler", "Solid geography instincts."];
  if (flags >= 8)  return [ICON.plane, "Tourist", "Not bad — the world is big."];
  return [ICON.compass, "Lost Tourist", "Time to spin the globe some more."];
}

function endGame() {
  clearInterval(timerId);
  const flagsRight = results.filter(r => r === "ok").length;
  const [icon, title, sub] = rank(flagsRight);
  track("game_over", { mode: practiceMode ? "practice" : "standard", score, flags_right: flagsRight, best_streak: bestStreak, rounds_played: results.length, rank: title });
  $("end-medal").innerHTML = icon;
  $("end-title").textContent = title;
  $("end-subtitle").textContent = sub;
  $("stat-score").textContent = score;
  $("stat-flags").textContent = flagsRight;
  $("stat-flags-label").textContent = GAME.unitPlural[0].toUpperCase() + GAME.unitPlural.slice(1);
  $("stat-streak").textContent = bestStreak;
  $("dots").innerHTML = results.map(r =>
    `<span class="d ${r}"></span>`).join("");
  show("end");
  $("new-best-badge").style.display = "none";
  if (practiceMode) {
    $("lb-card").style.display = "none";
    $("practice-end-note").style.display = "";
  } else {
    $("lb-card").style.display = "";
    $("practice-end-note").style.display = "none";
    resetLeaderboardUI();
  }
  updateCrossPromo();
}

// Only pitch the sibling game once a player has finished a couple of runs here first.
function updateCrossPromo() {
  let plays = 0;
  try { plays = parseInt(localStorage.getItem(PLAYS_KEY) || "0", 10) + 1; localStorage.setItem(PLAYS_KEY, plays); } catch {}
  $("cross-promo").style.display = plays >= 2 ? "" : "none";
}

// Fire-and-forget: logs every game as soon as it starts, even ones that
// get closed or abandoned before reaching the end screen.
function logPlay() {
  if (!LEADERBOARD_URL) return;
  let savedName = "";
  try { savedName = localStorage.getItem(NAME_KEY) || ""; } catch {}
  fetch(LEADERBOARD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      type: "play",
      name: savedName,
      practice: practiceMode,
      game: GAME.leaderboardGame,
    }),
  }).catch(() => {});
}

let scoreSubmitted = false;
let lastSubmitId = null;

function resetLeaderboardUI() {
  scoreSubmitted = false;
  lastSubmitId = null;
  $("lb-row").style.display = "none";
  $("lb-submit").disabled = false;
  $("lb-submit").textContent = "Edit name";
  setLbStatus(LEADERBOARD_URL ? "" : "Leaderboard isn't set up yet.");
  let savedName = "";
  try { savedName = localStorage.getItem(NAME_KEY) || ""; } catch {}
  $("lb-name").value = savedName;
  if (LEADERBOARD_URL) {
    $("lb-nearby-list").innerHTML = skeletonRow().repeat(4);
    $("lb-nearby").style.display = "";
  } else {
    $("lb-nearby").style.display = "none";
  }
  submitScore(undefined, { silent: true });
}

function ensureScoreSaved() {
  if (practiceMode || scoreSubmitted || !LEADERBOARD_URL) return;
  if (!$("screen-end").classList.contains("active")) return;
  submitScore(undefined, { silent: true });
}

const MEDALS = { 0: "🥇", 1: "🥈", 2: "🥉" };

function skeletonRow() {
  return `<div class="lb-nearby-row skeleton">
     <span class="pos">#0</span>
     <span class="n">Loading</span>
     <span class="metrics"><span class="f">00<span class="unit">${GAME.unitPlural}</span></span><span class="pts">000 pts</span></span>
   </div>`;
}

function top3Hero(name, flags, score) {
  return `<div class="top3-hero">
     <span class="top3-hero-medal">${MEDALS[0]}</span>
     <div class="top3-hero-name">${escapeHtml(name)}</div>
     <div class="top3-hero-stats"><b>${score} pts</b> · ${flags} ${GAME.unitPlural}</div>
   </div>`;
}

function top3HeroSkeleton() {
  return `<div class="top3-hero">
     <span class="top3-hero-medal top3-skel" style="display:inline-block;width:44px;height:44px;border-radius:50%;">${MEDALS[0]}</span>
     <div class="top3-hero-name top3-skel" style="height:17px;border-radius:6px;width:70%;margin:6px auto 4px;">&nbsp;</div>
     <div class="top3-hero-stats top3-skel" style="height:12px;border-radius:6px;width:50%;margin:0 auto;">&nbsp;</div>
   </div>`;
}

function top3Runner(rank, name, flags, score) {
  return `<div class="top3-runner">
     <div class="top3-runner-medal">${MEDALS[rank - 1]}</div>
     <div class="top3-runner-name">${escapeHtml(name)}</div>
     <div class="top3-runner-stats"><b>${score}</b> pts</div>
   </div>`;
}

function top3RunnerSkeleton(rank) {
  return `<div class="top3-runner top3-skel" style="height:76px;">
     <div class="top3-runner-medal">${MEDALS[rank - 1]}</div>
   </div>`;
}

async function loadStartTop3() {
  const card = $("top3-card");
  if (!LEADERBOARD_URL) { card.style.display = "none"; return; }

  $("top3-list").innerHTML = top3HeroSkeleton() + `<div class="top3-runners">${[2, 3].map(top3RunnerSkeleton).join("")}</div>`;
  try {
    const res = await fetch(`${LEADERBOARD_URL}?game=${GAME.leaderboardGame}`);
    const data = await res.json();
    const top = data.top || [];
    if (!top.length) {
      $("top3-list").innerHTML = `<div class="lb-nearby-error">No scores yet — be the first!</div>`;
      return;
    }
    const [first, ...rest] = top;
    const runners = rest.slice(0, 2).map((r, i) => top3Runner(i + 2, r.name, r.flags, r.score)).join("");
    $("top3-list").innerHTML = top3Hero(first.name, first.flags, first.score)
      + (runners ? `<div class="top3-runners">${runners}</div>` : "");
  } catch {
    $("top3-list").innerHTML = `<div class="lb-nearby-error">Couldn't load the leaderboard — <a href="#" id="top3-retry">retry</a></div>`;
    $("top3-retry").addEventListener("click", e => { e.preventDefault(); loadStartTop3(); });
  }
}

async function loadNearbyLeaderboard(displayName, flagsCount) {
  const nearby = $("lb-nearby");
  if (!LEADERBOARD_URL) { nearby.style.display = "none"; return; }

  $("lb-nearby-list").innerHTML = skeletonRow().repeat(4);
  nearby.style.display = "";
  $("lb-row").style.display = "";

  try {
    const youName = displayName || "You";
    const url = `${LEADERBOARD_URL}?score=${score}&flags=${flagsCount}&name=${encodeURIComponent(youName)}&game=${GAME.leaderboardGame}`;
    const res = await fetch(url);
    const data = await res.json();
    const rows = data.rows || [];
    if (!rows.length) {
      $("lb-nearby-list").innerHTML = `<div class="lb-nearby-error">No scores yet — be the first!</div>`;
      return;
    }

    $("lb-nearby-list").innerHTML = rows.map(r => {
      if (r.ellipsis) return `<div class="lb-nearby-ellipsis">···</div>`;
      const medal = MEDALS[r.pos - 1];
      return `<div class="lb-nearby-row ${r.you ? "you" : ""}">
         <span class="pos">${medal || "#" + r.pos}</span>
         <span class="n">${escapeHtml(r.name)}</span>
         <span class="metrics">
           <span class="f">${r.flags}<span class="unit">${GAME.unitPlural}</span></span>
           <span class="pts">${r.score} pts</span>
         </span>
       </div>`;
    }).join("");
    nearby.style.display = "";
  } catch {
    $("lb-nearby-list").innerHTML = `<div class="lb-nearby-error">Couldn't load the leaderboard — <a href="#" id="lb-retry">retry</a></div>`;
    $("lb-retry").addEventListener("click", e => { e.preventDefault(); loadNearbyLeaderboard(displayName, flagsCount); });
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function setLbStatus(msg) {
  $("lb-status").textContent = msg;
}

async function submitScore(nameOverride, { silent = false } = {}) {
  if (!LEADERBOARD_URL) {
    setLbStatus("Leaderboard isn't set up yet.");
    return;
  }
  const submitBtn = $("lb-submit");
  if (!silent && submitBtn.disabled) return;

  const name = (nameOverride ?? $("lb-name").value).trim().slice(0, 20) || "Anonymous";
  try { localStorage.setItem(NAME_KEY, name); } catch {}
  try { posthog.register({ player_name: name }); } catch {}

  const isRename = scoreSubmitted && lastSubmitId;
  setLbStatus("");
  if (!silent) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving…";
  }

  const flagsRight = results.filter(r => r === "ok").length;
  try {
    const res = await fetch(LEADERBOARD_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(isRename
        ? { type: "rename", id: lastSubmitId, name, game: GAME.leaderboardGame }
        : { name, score, flags: flagsRight, streak: bestStreak, game: GAME.leaderboardGame }),
    });
    const data = await res.json();
    if (!isRename && data && data.id) lastSubmitId = data.id;
    scoreSubmitted = true;
    $("lb-name").value = name;
    if (!silent) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Edit name";
    }
    loadNearbyLeaderboard(name, flagsRight);

    if (!practiceMode) {
      const best = getPersonalBest();
      if (!best || score > best.score) {
        savePersonalBest(score, flagsRight);
        $("new-best-badge").style.display = "";
      }
    }
  } catch {
    if (!isRename) scoreSubmitted = false;
    if (!silent) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Edit name";
    }
    setLbStatus("Couldn't reach the leaderboard — try again?");
  }
}

const RANK_EMOJI = {
  "World Legend": "🌍", [GAME.titlePlain]: "🏆", "Globetrotter": "🥇",
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
    `${RANK_EMOJI[title]} ${GAME.titlePlain} — ${title}`,
    ``,
    `🎯 ${flagsRight}/${total} ${GAME.unitPlural} correct`,
    `⭐ ${score.toLocaleString()} points`,
    `🔥 Best streak: ${bestStreak}`,
    ``,
    grid.join("\n"),
    ``,
    `Think you can beat my score of ${score.toLocaleString()}? →`,
    GAME_URL,
  ].join("\n");
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(shareText());
  } catch {
    const ta = document.createElement("textarea");
    ta.value = shareText(); document.body.appendChild(ta);
    ta.select(); document.execCommand("copy"); ta.remove();
  }
  const t = $("toast");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

/* wire up static icons */
$("ic-slot-1").innerHTML = ICON.flag;
$("ic-slot-2").innerHTML = ICON.clock;
$("ic-slot-3").innerHTML = ICON.heartSmall;
$("ic-slot-4").innerHTML = ICON.trend;
$("streak-flame").innerHTML = ICON.flame;
$("ic-share").innerHTML = ICON.share;
$("ic-again").innerHTML = ICON.replay;
$("promo-ic").innerHTML = ICON.globe;
$("ic-check").innerHTML = ICON.check;
$("quit-btn").innerHTML = ICON.close;
$("quit-btn").addEventListener("click", quitToStart);
$("lb-submit").addEventListener("click", () => submitScore());
$("lb-name").addEventListener("keydown", e => { if (e.key === "Enter") submitScore(); });

/* ---------- theme ---------- */
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  $("theme-toggle").innerHTML = t === "light" ? ICON.moon : ICON.sun;
}
let theme = "light";
try { theme = localStorage.getItem(THEME_KEY) || "light"; } catch {}
applyTheme(theme);
$("theme-toggle").addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  applyTheme(theme);
});

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

GAME.buildBackground($("flag-bg"));
loadStartTop3();
renderPersonalBest();

$("btn-start").addEventListener("click", () => { practiceMode = false; startGame(); });
$("btn-practice").addEventListener("click", () => show("practice-setup"));
$("btn-practice-back").addEventListener("click", () => show("start"));
$("btn-practice-start").addEventListener("click", () => { practiceMode = true; startGame(); });

document.querySelectorAll(".seg").forEach(seg => {
  seg.querySelectorAll(".seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      seg.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      practiceCfg[seg.dataset.cfg] = btn.dataset.value;
    });
  });
});
$("btn-again").addEventListener("click", () => { ensureScoreSaved(); startGame(); });
$("cross-promo").addEventListener("click", () => {
  track("cross_promo_clicked", { from: GAME.analyticsId, to: GAME.crossPromoTargetId });
  location.href = CROSS_PROMO_URL;
});
$("btn-share").addEventListener("click", async () => {
  ensureScoreSaved();
  if (navigator.share) {
    try {
      await navigator.share({ text: shareText() });
      track("share_clicked", { method: "native_share", score, flags: results.filter(r => r === "ok").length });
      return;
    } catch {}
  }
  track("share_clicked", { method: "clipboard", score, flags: results.filter(r => r === "ok").length });
  copyResult();
});
