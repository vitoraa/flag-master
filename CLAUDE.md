# Flag Master / Capital Master

Each game (`index.html`, `capital-master/index.html`) is a **generated** file — do not hand-edit them directly.

Source of truth:
- `games.json` — registry of games (title, storage keys, leaderboard id, copy strings)
- `shared/` — generic engine, CSS, HTML template, arcade menu, shared across all games
- `games/<id>/game.js`, `background.js`, `game.css` — per-game quiz data, render hooks, background animation, and game-specific styling

After changing anything in `shared/`, `games/*/`, or `games.json`, run:

```bash
node build.js
```

and commit the regenerated `index.html` files alongside your source changes. There is no CI check enforcing this yet — it's a required manual step before pushing.
