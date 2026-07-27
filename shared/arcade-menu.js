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
