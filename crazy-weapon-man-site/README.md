# Crazy Weapon Man — web game + Cloudflare Worker

Live at https://crazyweaponman.noobscrub.workers.dev. Work notes and roadmap: `../WORK-LOG.md`.

## Layout

- `game-src/` — the game source. **Edit here.**
  - `core/` — the main game: one closure split into files at top-level boundaries. `00-setup-world.js` opens it, `99-boot.js` closes it and starts the loop.
  - `systems/` — feature modules that run inside the same closure, after `core/` and before `99-boot.js`. They can read and replace core functions (`hurt`, `killE`, `draw`, ...).
  - `addons/` — separate scripts that load after the game. They only see globals and the DOM, not closure variables.
  - `shell/` — `shell.html` page markup and `styles.css`.
  - `manifest.json` — load order.
- `build.mjs` — builds `game-src/` into `public/` (no dependencies).
- `public/` — **built output**, deployed as static assets. Committed, because the Cloudflare build command is blank.
- `src/index.js` — Worker: `/api/leaderboard` (D1) and `/api/health`, everything else is static.
- `tests/smoke.sh` — runs the in-game self-tests in headless Chrome.

## Making a change

```sh
# edit files in game-src/, then:
node crazy-weapon-man-site/build.mjs
bash crazy-weapon-man-site/tests/smoke.sh        # needs chrome/chromium on PATH, or CHROME=/path
python3 -m http.server 8080 --directory crazy-weapon-man-site/public   # play locally
```

Commit both `game-src/` and `public/`. CI (`.github/workflows/game-check.yml`) fails if `public/` is out of date or a self-test fails.

## Cloudflare Workers Builds settings

Connect the GitHub repository `Dirzo/kamikaze-man` and use:

- Project name: `crazy-weapon-man`
- Production branch: `crazy-weapon-man-web`
- Root directory: `crazy-weapon-man-site`
- Build command: leave blank
- Deploy command: `npx wrangler deploy`
- Cloudflare Access: off for the public game

Pushes to `crazy-weapon-man-web` deploy automatically.

## D1 leaderboard

`wrangler.jsonc` declares the `DB` D1 binding without an account-specific resource ID; Wrangler provisions it on first deploy. The Worker creates its table and index on the first leaderboard or health request. `schema.sql` is a reference copy.

Verify a deployment: `/` loads the game, `/api/health` returns `"ok": true`, `/api/leaderboard?limit=10` returns `"scores": [...]`.
