GAME.buildBackground = function (layer) {
  const OPS = ["+", "−", "×", "÷"];
  const randDigit = () => Math.floor(1 + Math.random() * 9);
  // Every tile is a short decorative equation (e.g. "4 × 7"), not a lone
  // digit or operator, so the background reads as math problems.
  function randomTile() {
    return `${randDigit()} ${OPS[Math.floor(Math.random() * OPS.length)]} ${randDigit()}`;
  }
  // --muted reads much fainter against the light theme's near-white
  // background than against the dark theme's near-black one at the same
  // alpha, so light mode needs a noticeably higher opacity floor/ceiling
  // to actually be visible.
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const opacityRange = isLight ? [0.28, 0.48] : [0.12, 0.28];
  // Skip a fixed fraction of grid cells so density is tunable without
  // reshaping the grid itself (currently 15% less dense than a full grid).
  const SKIP_RATE = 0.15;
  const cols = 9, rows = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < SKIP_RATE) continue;
      const text = randomTile();
      const el = document.createElement("div");
      el.className = "mg";
      el.textContent = text;
      el.style.fontSize = rnd(18, 32) + "px";
      el.style.left = (c / cols * 100 + rnd(-3, 3)) + "%";
      el.style.top  = (r / rows * 100 + rnd(-3, 3)) + "%";
      el.style.opacity = rnd(opacityRange[0], opacityRange[1]).toFixed(2);
      el.style.setProperty("--tx", rnd(-46, 46).toFixed(0) + "px");
      el.style.setProperty("--ty", rnd(-46, 46).toFixed(0) + "px");
      el.style.setProperty("--r1", rnd(-9, 9).toFixed(1) + "deg");
      el.style.setProperty("--r2", rnd(-9, 9).toFixed(1) + "deg");
      el.style.setProperty("--d", rnd(4.5, 9).toFixed(1) + "s");
      el.style.setProperty("--delay", (-rnd(0, 9)).toFixed(1) + "s");
      layer.appendChild(el);
    }
  }
  const veil = document.createElement("div");
  veil.className = "veil";
  layer.appendChild(veil);
};
