#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = __dirname;
const games = JSON.parse(fs.readFileSync(path.join(root, "games.json"), "utf8"));
const template = fs.readFileSync(path.join(root, "shared/template.html"), "utf8");
const sharedCss = fs.readFileSync(path.join(root, "shared/styles.css"), "utf8");
const engineJs = fs.readFileSync(path.join(root, "shared/engine.js"), "utf8");
const arcadeJs = fs.readFileSync(path.join(root, "shared/arcade-menu.js"), "utf8");

const gamesJsonLiteral = JSON.stringify(games).replace(/</g, "\\u003c");

// Fields every enabled game must define in games.json — everything the
// template/engine/build script reads structurally. Extend this list when
// shared/template.html or shared/engine.js starts reading a new GAME.*
// field, so a half-filled registry entry fails the build instead of
// silently rendering "undefined" somewhere.
const REQUIRED_FIELDS = [
  "id", "outputDir", "url", "assetPrefix", "icon", "title", "titlePlain", "tagline",
  "storagePrefix", "leaderboardGame", "analyticsId", "gameUrl",
  "crossPromos", "arcadeGradient",
  "itemCount", "itemNoun", "unitSingular", "unitPlural",
  "promptCounterLabel", "practiceCfgLabel", "initialTheme",
  "levels", "trackAnswerEvent", "ranks",
];

for (const game of games.filter(g => g.enabled)) {
  const missing = REQUIRED_FIELDS.filter(f => game[f] === undefined);
  if (missing.length) {
    throw new Error(`games.json entry "${game.id}" is enabled but missing required field(s): ${missing.join(", ")}`);
  }

  const gameDir = path.join(root, "games", game.id);
  const gameCss = fs.readFileSync(path.join(gameDir, "game.css"), "utf8");
  const gameJs = fs.readFileSync(path.join(gameDir, "game.js"), "utf8");
  const backgroundJs = fs.readFileSync(path.join(gameDir, "background.js"), "utf8");

  const prodHostCheck = game.id === "flag-master"
    ? `(location.hostname === 'vitoraa.github.io' && location.pathname.startsWith('/flag-master/') && !location.pathname.startsWith('/flag-master/capital-master/')) || location.hostname === 'flag-master-game.netlify.app'`
    : `location.hostname === 'vitoraa.github.io' && location.pathname.startsWith('/flag-master/${game.id}/')`;

  let html = template
    .replace(/\{\{DOC_TITLE\}\}/g, `${game.titlePlain} — how many ${game.unitPlural} do you know?`)
    .replace(/\{\{PROD_HOST_CHECK\}\}/g, prodHostCheck)
    .replace(/\{\{INITIAL_THEME\}\}/g, game.initialTheme)
    .replace(/\{\{GAME_CSS\}\}/g, sharedCss + "\n" + gameCss)
    .replace(/\{\{TITLE_HTML\}\}/g, game.title)
    .replace(/\{\{TAGLINE\}\}/g, game.tagline)
    .replace(/\{\{ITEM_COUNT\}\}/g, game.itemCount)
    .replace(/\{\{ITEM_NOUN\}\}/g, game.itemNoun)
    .replace(/\{\{UNIT_SINGULAR\}\}/g, game.unitSingular)
    .replace(/\{\{UNIT_PLURAL\}\}/g, game.unitPlural)
    .replace(/\{\{PRACTICE_CFG_LABEL\}\}/g, game.practiceCfgLabel)
    .replace(/\{\{TOTAL_ALL_DIFFICULTY\}\}/g, `All ${game.itemCount}`)
    .replace(
      "<!--GAME_SCRIPT-->",
      `const GAMES = ${gamesJsonLiteral};\nconst GAME = GAMES.find(g => g.id === ${JSON.stringify(game.id)});\n${gameJs}\n${backgroundJs}\n${engineJs}\n${arcadeJs}`
    );

  const outPath = path.join(root, game.outputDir, "index.html");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`Built ${outPath}`);
}
