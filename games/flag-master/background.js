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
