GAME.buildBackground = function (layer) {
  const GLYPHS = ["+", "−", "×", "÷", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const cols = 6, rows = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const el = document.createElement("div");
      el.className = "mg";
      el.textContent = glyph;
      el.style.fontSize = rnd(34, 64) + "px";
      el.style.left = (c / cols * 100 + rnd(-4, 4)) + "%";
      el.style.top  = (r / rows * 100 + rnd(-4, 4)) + "%";
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
