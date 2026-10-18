# Crazy Weapon Man — work log

Handoff notes so any session can pick up where the last one stopped. Newest first.

## Roadmap (16-bit noobscrub update)

1. **Consolidate the code** — done (2026-10-18), no visible change.
2. **16-bit art foundation** — 480×270 internal resolution, fixed palette, pixel font, sprite atlases; redraw player, enemies, bosses, 9 weapon types, tiles, parallax, VFX. Starts with a style sheet for approval. See `docs/STYLE.md`.
3. **UI/HUD** — framed pixel panels, compact edge HUD, restyled title / shop / level-up / death / leaderboard / Museum.
4. **Gameplay polish** — floating-text budget, one loot banner at a time, Dark-trait rework, hit-stop and screenshake tuning, chiptune SFX, balance via bot runs.
5. **Ship** each phase via a preview branch and PR into `crazy-weapon-man-web` (auto-deploys).

## 2026-10-18 — Phase 2: style sheet (awaiting approval)

- Branch `noobscrub-16bit/phase2-style-sheet`. Art is generated from code in `crazy-weapon-man-site/art-src/` (`pixel.py` palette + sprite fill maps with auto 1px outline, `font.py` 5x7 pixel font, `scene.py` builds the sheet). Run `python3 crazy-weapon-man-site/art-src/scene.py` (needs Pillow).
- Output in `docs/style-sheet/`: `mock-frame.png` (zone 1 at 480x270, shown 4x), `style-sheet.png` (palette, hero, Tactical Chicken, Prototype Sword Intern, gem, sword, asphalt + platform tiles, font, HUD).
- Sprite sizes match current hitboxes at 480/1280 scale (player 16x24 incl. outline), so gameplay feel is unchanged.
- Next: on approval, port the palette/font/sprite pipeline into the game renderer (low-res canvas, nearest-neighbour upscale), then redraw remaining enemies, bosses, zones and weapon types.

## 2026-10-18 — Phase 1: consolidation

**What changed**
- The live game used to be one 370 KB HTML file, gzipped + base64-split into 9 chunks, with 29 scripts string-injected into it at load and 14 more `<script>` tags after it. That is now readable source in `crazy-weapon-man-site/game-src/`, built by `node crazy-weapon-man-site/build.mjs` into `public/`. See `crazy-weapon-man-site/README.md`.
- Removed 31 files that were unused or dead: the 9 packed chunks, 6 extra chunk variants, the 2 `game-safe/` parts, 11 patch files the page never loaded, and 3 addons that crashed before doing anything. The other 40 patch files now live in `game-src/systems/` and `game-src/addons/`.
- Removed never-reachable hooks from 4 addons (they wrapped closure functions an addon cannot see, so they never ran). This also clears all 3 console errors the live page threw on every load.
- Replaced 12 per-patch CI workflows with `.github/workflows/game-check.yml`, which checks the build is up to date and runs every in-game self-test (`tests/smoke.sh`, 19 suites).

**How it was verified**
- All 19 in-game self-test suites give identical results on the old and new builds (same `data-cwm-*` proof attributes, same pass counts).
- Seeded-random screenshots: title screen pixel-identical; gameplay identical apart from frame timing.

**Found, not changed (decide in later phases)**
- **The global leaderboard has never received a score.** The addon that wires up online submission (`addons/03-online-leaderboard.js`) crashed at load because it referenced variables inside the game closure, and the core's `syncGlobalLeaderboard` / `submitGlobalWeapon` are offline stubs. `/api/leaderboard` returns an empty list. The fix is to move the online code into `game-src/systems/` (inside the closure). Its never-run online code was removed here; see git history for the original.
- **Two balance patches were never active**: `combat-balance-v12` (enemy damage +45–65% and rising per zone/wave) and `nightmare-balance-v18`. Both died on `hurt is not defined`. The game as players know it never had them, so they were removed, not revived.
- Version labels disagree: the page sends `v1.4-arsenal-chaos`, the API's current view is `v1.1-frenzy`, and a header pill still reads `v0.9.8`.
- `addons/` code only sees globals and the DOM. Anything that needs to change game behaviour belongs in `systems/`.

**Next session**
- Phase 2: draw the style sheet (palette, hero, enemy, tile strip, HUD frame, font) at 480×270 and send it for approval.
