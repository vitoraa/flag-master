#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = __dirname;
const games = JSON.parse(fs.readFileSync(path.join(root, "games.json"), "utf8"));
const template = fs.readFileSync(path.join(root, "shared/template.html"), "utf8");
const sharedCss = fs.readFileSync(path.join(root, "shared/styles.css"), "utf8");
const engineJs = fs.readFileSync(path.join(root, "shared/engine.js"), "utf8");
const arcadeJs = fs.readFileSync(path.join(root, "shared/arcade-menu.js"), "utf8");

const gamesJsonLiteral = JSON.stringify(games);

for (const game of games.filter(g => g.enabled)) {
  const gameDir = path.join(root, "games", game.id);
  const gameCss = fs.readFileSync(path.join(gameDir, "game.css"), "utf8");
  const gameJs = fs.readFileSync(path.join(gameDir, "game.js"), "utf8");
  const backgroundJs = fs.readFileSync(path.join(gameDir, "background.js"), "utf8");

  const itemCount = countItems(gameJs);
  const unitSingular = extractStringAssignment(gameJs, "unitSingular");
  const unitPlural = extractStringAssignment(gameJs, "unitPlural");
  const practiceCfgLabel = extractStringAssignment(gameJs, "practiceCfgLabel");
  const initialTheme = extractStringAssignment(gameJs, "initialTheme", "light");

  const prodHostCheck = game.id === "flag-master"
    ? `(location.hostname === 'vitoraa.github.io' && location.pathname.startsWith('/flag-master/') && !location.pathname.startsWith('/flag-master/capital-master/')) || location.hostname === 'flag-master-game.netlify.app'`
    : `location.hostname === 'vitoraa.github.io' && location.pathname.startsWith('/flag-master/${game.id}/')`;

  let html = template
    .replace(/\{\{DOC_TITLE\}\}/g, `${game.titlePlain} — how many ${unitPlural} do you know?`)
    .replace(/\{\{PROD_HOST_CHECK\}\}/g, prodHostCheck)
    .replace(/\{\{INITIAL_THEME\}\}/g, initialTheme)
    .replace(/\{\{GAME_CSS\}\}/g, sharedCss + "\n" + gameCss)
    .replace(/\{\{TITLE_HTML\}\}/g, game.title)
    .replace(/\{\{TAGLINE\}\}/g, game.tagline)
    .replace(/\{\{ITEM_COUNT\}\}/g, itemCount)
    .replace(/\{\{UNIT_SINGULAR\}\}/g, unitSingular)
    .replace(/\{\{UNIT_PLURAL\}\}/g, unitPlural)
    .replace(/\{\{PRACTICE_CFG_LABEL\}\}/g, practiceCfgLabel)
    .replace(/\{\{TOTAL_ALL_DIFFICULTY\}\}/g, `All ${itemCount}`)
    .replace(/\{\{CROSS_PROMO_HEADING\}\}/g, game.crossPromoHeading)
    .replace(/\{\{CROSS_PROMO_BODY\}\}/g, game.crossPromoBody)
    .replace(
      "<!--GAME_SCRIPT-->",
      `const GAMES = ${gamesJsonLiteral};\nconst GAME = GAMES.find(g => g.id === ${JSON.stringify(game.id)});\n${gameJs}\n${backgroundJs}\n${engineJs}\n${arcadeJs}`
    );

  const outPath = path.join(root, game.outputDir, "index.html");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`Built ${outPath}`);
}

function countItems(gameJsSource) {
  const match = gameJsSource.match(/GAME_ITEM_COUNT\s*=\s*(\d+)/);
  if (!match) throw new Error("game.js must define GAME_ITEM_COUNT = <n>;");
  return match[1];
}

function extractStringAssignment(gameJsSource, propName, fallback) {
  const re = new RegExp(`GAME\\.${propName}\\s*=\\s*["']([^"']*)["']`);
  const match = gameJsSource.match(re);
  if (match) return match[1];
  if (fallback !== undefined) return fallback;
  throw new Error(`game.js must define GAME.${propName} = "...";`);
}
