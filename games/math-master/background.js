GAME.buildBackground = function (layer) {
  const GLYPHS = ["+", "−", "×", "÷", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const OPS = ["+", "−", "×", "÷"];
  const randDigit = () => Math.floor(1 + Math.random() * 9);
  // A third of the tiles are short decorative equations (e.g. "4 × 7")
  // rather than a single glyph, so the background reads as math, not
  // just scattered symbols.
  function randomTile() {
    if (Math.random() < 1 / 3) {
      return `${randDigit()} ${OPS[Math.floor(Math.random() * OPS.length)]} ${randDigit()}`;
    }
    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  const cols = 9, rows = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const text = randomTile();
      const isEquation = text.length > 1;
      const el = document.createElement("div");
      el.className = "mg";
      el.textContent = text;
      el.style.fontSize = (isEquation ? rnd(18, 32) : rnd(30, 58)) + "px";
      el.style.left = (c / cols * 100 + rnd(-3, 3)) + "%";
      el.style.top  = (r / rows * 100 + rnd(-3, 3)) + "%";
      el.style.opacity = rnd(0.12, 0.28).toFixed(2);
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
