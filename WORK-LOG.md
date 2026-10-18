# Crazy Weapon Man — work log

Handoff notes so any session can pick up where the last one stopped. Newest first.

## Roadmap (16-bit noobscrub update)

1. **Consolidate the code** — done (2026-10-18), no visible change.
2. **16-bit art foundation** (done 2026-10-18) — 480×270 internal resolution, fixed palette, pixel font, sprite atlases; redraw player, enemies, bosses, 9 weapon types, tiles, parallax, VFX. Starts with a style sheet for approval. See `docs/STYLE.md`.
3. **UI/HUD** (done 2026-10-18) — framed pixel panels, compact edge HUD, restyled title / shop / level-up / death / leaderboard / Museum.
4. **Gameplay polish** — floating-text budget, one loot banner at a time, Dark-trait rework, hit-stop and screenshake tuning, chiptune SFX, balance via bot runs.
5. **Ship** each phase via a preview branch and PR into `crazy-weapon-man-web` (auto-deploys).

## 2026-10-18 — Phase 4 (part 1): names, Dark trait, game feel, chiptune

**Done** (branch `noobscrub-16bit/phase4-polish`, stacked on phase 3)
- **Fantasy text pass** — `crazy-weapon-man-site/tools/fantasy-text.cjs` rewrites modern objects/places/tech in player-visible strings (parking -> toll-bridge, forklift -> siege-ox, microwave -> dragon-oven, coffee -> potion, intern -> apprentice, OSHA -> guild-safety, plasma -> starfire, barcode scanner -> tally-rune reader, ...). Skips ids and CSS; case follows the surrounding text; safe to re-run. Corporate/bureaucratic satire (taxes, budgets, CEO, performance reviews) intentionally kept. `CWM_PX.sampleNames(n)` samples generated names for spot checks.
- **Dark trait** — no more near-black screen: wide lit pocket around the hero, two stepped dithered rings (never black), slim violet arcs, glowing eyes on enemies out in the dark.
- **Game feel** — `systems/32-game-feel.js`. Found: shake was set in ~40 places but `26-combat-readability` zeroed it every frame (live game never shook), while nearly every hit froze the game (hit-stop). Now: whole-pixel alternating rumble (max 4 px, ~0.4 s) only from real impacts, world layer only; small hit-stops capped at 40 ms / one per 140 ms, big moments unchanged. `?nofeel` disables.
- **Chiptune SFX** — `systems/33-chiptune.js` replaces every core sound effect (same names/args/gates): pulse waves 12.5/25/50%, triangle, 15-bit LFSR noise, pitch/volume stepped at 60 Hz. `CWM_CHIPTUNE.preview()` renders all effects to a WAV. `?nochip` keeps the old sounds.

**Phase 4 remaining**: floating-text budget (replace the overlap stopgap), dark boxes behind legacy text labels, balance via bot runs, global leaderboard submission bug, music to match the chiptune SFX (optional).

## 2026-10-18 — Phase 3: pixel HUD and themed screens

**Done** (branch `noobscrub-16bit/phase3-hud`, stacked on phase 2)
- `art-src/build_font.py` builds **Noobscrub 5x7**, a webfont from the same glyphs as the canvas font (`public/assets/fonts/noobscrub-5x7.woff2`; 8 font px per em, so use 16/24/32/48px for crisp 2x/3x/4x/6x). Reusable for other noobscrub games.
- `game-src/systems/31-pixel-hud.js`: canvas HUD drawn after each frame — framed bottom bar (HP, special cooldown, weapon icon + name + DPS, shards, level + XP), zone + wave + rift label top-left, kill count top-right, boss name + bar, "NEW WEAPON +x% DPS" toast and "LEVEL UP!" toast.
- `game-src/shell/pixel-theme.css` (only under `html.px`, so `?nopx` keeps the old UI): hides the HTML in-play HUD (weapon card, run status, wave line, shard bank, juice pop-ups, boss bar); pixel font everywhere snapped to 16px+; no rounded corners/blur/soft shadows; wood-and-gold framed panels and cards via `border-image` (`public/assets/px/ui/*.png` from `build_assets.py`); framed buttons (red "hot" for primary), inputs, bars; title, museum, leaderboard, black market, boon, death offer, shard forge, zone intro, banners, pause all themed.
- Renderer: screen-sized translucent overlays blend + palette-snap instead of stippling.

**Not verified by screenshot** (themed by selector, need a real trigger): boon cards with content, death offer / D20, shard forge, pause panel.

**Next — phase 4 (gameplay polish)**: floating-text budget (replace the overlap stopgap), dark label boxes behind legacy text, modern-sounding weapon/trait name parts, Dark-trait rework, hit-stop/screenshake tuning, chiptune SFX, balance via bot runs; also the leaderboard submission bug.

## 2026-10-18 — Phase 2: pixel renderer in the game

**Approved direction:** palette as-is; mean hero (heavy brow, flat scowl, scar, dark tank); fantasy settings only, never modern/suburban; keep the jokes with a fantasy twist. The Sword Graveyard is the template style. See `docs/STYLE.md`.

**Done**
- Zones, boss crews and enemy aliases renamed to fantasy versions with the same jokes (e.g. The Sword Graveyard, Disco Crypt of Compliance, Bone Dragon Feast Hall, Dad's Storm Forge, Grandma's Armed Witch Cottage, The Hostile Takeover Citadel, The Sentient Armory Vault).
- `game-src/systems/30-pixel-renderer.js` (last system, outermost): canvas is 480x270 with a fixed 0.375 world->pixel scale, CSS `image-rendering: pixelated`; shadows off; all canvas text drawn in the pixel font; every frame snapped to the 32-colour palette; in-world text that would overlap other text is skipped (stopgap until the phase-4 text budget). `?nopx` turns it all off.
- Hooks in core: `playerDraw` calls `CWM_PX.heroBody()` (body sprite; arm + weapon stay procedural), `creature()` calls `CWM_PX.enemyBody()` (sprite where one exists, else legacy). Pixel art exists for: zone 1 backdrop, platforms (3-slice mossy slab), hero (idle/run/jump), Tactical Bomb Chicken (`bombchicken`), Loose Ammo Gremlin (`crawler`).
- Art pipeline: `python3 crazy-weapon-man-site/art-src/build_assets.py` writes `public/assets/px/` (PNGs + `manifest.json` with palette and font glyphs; the game reads both from there). `scene.py` still renders the style sheet.
- `tests/smoke.sh`: legacy self-tests run with `nopx`; new check that the pixel renderer reports ready.

**Art pass done (same day)**
- All 10 zones: backdrop + ground + platform slab each (`art-src/zones.py`); citadel and forge redone as castle/smithy to keep everything fantasy.
- All 16 regular enemies (`art-src/enemies.py`, shared colour key; walk1/walk2/white hit frame).
- All 6 bosses (`art-src/bosses.py`; breathe frame, hit frame, enraged flicker); core `drawBoss` defers to `CWM_PX.bossBody`.
- 9 held weapon types + 2 loot-drop icons (`art-src/weapons.py`): magenta marker pixels recoloured in game to 3 palette shades of the rarity colour; higher rarities scale in whole-pixel steps (1x/2x/3x). Hooks: `CWM_PX.weaponBody`, `CWM_PX.dropBody`.
- Translucent effects (fill/stroke with alpha) draw as a 4x4 Bayer stipple in the nearest palette colour instead of blending, so every legacy glow/ring/trail stays on-palette. `?nodither` turns this off.
- Preview hooks for screenshots: `CWM_PX.previewZone(n)`, `previewBoss(kind)`, `previewWeapon(type, rank)`.

**Next**
- Phase 3: replace the HTML HUD panels with the framed pixel bar; restyle title/shop/level-up/death/leaderboard/Museum screens.
- Phase 4: floating-text budget (the stopgap overlap rule is in the renderer), the dark boxes behind legacy text labels, trait/weapon-name jokes that are still modern (e.g. "Parking Enforcement", "Forklift").
- Check the per-frame palette snap on a real device (~0.5 ms readback alone in headless Chrome).

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
