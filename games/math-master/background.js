GAME.buildBackground = function (layer) {
  const OPS = ["+", "−", "×", "÷"];
  // Each operator gets its own hue (reusing the shared palette) so the
  // drifting equations read as gently color-coded "math soup" instead of
  // one flat block of muted text.
  const OP_COLOR = { "+": "var(--accent)", "−": "var(--accent-2)", "×": "var(--good)", "÷": "var(--gold)" };
  const randDigit = () => Math.floor(1 + Math.random() * 9);
  // Every tile is a short decorative equation (e.g. "4 × 7"), not a lone
  // digit or operator, so the background reads as math problems.
  function randomTile() {
    const op = OPS[Math.floor(Math.random() * OPS.length)];
    return { text: `${randDigit()} ${op} ${randDigit()}`, op };
  }
  // --muted reads much fainter against the light theme's near-white
  // background than against the dark theme's near-black one at the same
  // alpha, so light mode needs a noticeably higher opacity floor/ceiling
  // to actually be visible.
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const opacityRange = isLight ? [0.4, 0.62] : [0.22, 0.4];
  // Three depth layers give the field parallax instead of one flat plane:
  // far tiles are small/dim/slow, near tiles are big/bright/fast. Weighted
  // so the far layer (which reads as background texture) dominates.
  const DEPTH_LAYERS = [
    { weight: 0.45, size: [12, 20], opacityMul: 0.8, drift: 22, duration: [7, 11] },
    { weight: 0.35, size: [18, 32], opacityMul: 1.0, drift: 46, duration: [4.5, 9] },
    { weight: 0.20, size: [30, 48], opacityMul: 1.3, drift: 72, duration: [3, 6] },
  ];
  function pickDepthLayer() {
    let x = Math.random();
    for (const d of DEPTH_LAYERS) {
      if (x < d.weight) return d;
      x -= d.weight;
    }
    return DEPTH_LAYERS[DEPTH_LAYERS.length - 1];
  }
  // Skip a fixed fraction of grid cells so density is tunable without
  // reshaping the grid itself (0 = fill every cell, full density).
  const SKIP_RATE = 0;
  const cols = 9, rows = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < SKIP_RATE) continue;
      const { text, op } = randomTile();
      const depth = pickDepthLayer();
      const el = document.createElement("div");
      el.className = "mg";
      el.textContent = text;
      el.style.color = OP_COLOR[op];
      el.style.fontSize = rnd(depth.size[0], depth.size[1]) + "px";
      el.style.left = (c / cols * 100 + rnd(-3, 3)) + "%";
      el.style.top  = (r / rows * 100 + rnd(-3, 3)) + "%";
      const opacity = Math.min(0.85, rnd(opacityRange[0], opacityRange[1]) * depth.opacityMul);
      el.style.opacity = opacity.toFixed(2);
      el.style.setProperty("--tx", rnd(-depth.drift, depth.drift).toFixed(0) + "px");
      el.style.setProperty("--ty", rnd(-depth.drift, depth.drift).toFixed(0) + "px");
      el.style.setProperty("--r1", rnd(-9, 9).toFixed(1) + "deg");
      el.style.setProperty("--r2", rnd(-9, 9).toFixed(1) + "deg");
      el.style.setProperty("--d", rnd(depth.duration[0], depth.duration[1]).toFixed(1) + "s");
      el.style.setProperty("--delay", (-rnd(0, 9)).toFixed(1) + "s");
      layer.appendChild(el);
    }
  }
  const veil = document.createElement("div");
  veil.className = "veil";
  layer.appendChild(veil);
};
