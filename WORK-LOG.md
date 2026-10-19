# Crazy Weapon Man — work log

## 2026-10-18 — finite side-scrolling maps

- Replaced arena waves with ten finite maps, three to five screens wide, connected normal-jump ledges and an open ground route. Residents are distributed once across the route and distant packs wait for the player.
- Added a smoothed horizontal camera, parallax backdrop, scrolling ground, section signs, remaining-enemy markers and minimap. Physics, projectiles, weapon trails, loot and bosses now use map coordinates rather than screen bounds.
- Kill every resident and any end-chamber boss to unlock the right-edge portal. Reaching it opens the Forge/draft or wins on the final map. Summoned enemies count, and there are no timer respawns.
- Added map reachability/camera/bounds tests and real-browser checks for finite populations, locked exits, offscreen projectiles and distant-pack behaviour.

## 2026-10-18 — faster attacks and free attack movement

- Every weapon's attack interval and finisher recovery is divided by 1.25: 25% more attacks per second, including animation and projectile release timing.
- Removed the grounded attack movement penalty and facing lock. Movement accelerates normally during a swing; turning updates the pose and live hitbox, preserves the attack's hit set, and resets the old-facing blade trail.
- Added exact cadence checks and a real-browser regression for running and reversing during one attack.

## 2026-10-18 — crisp combat cleanup (PR #12)

- Promoted the existing modular rebuild from `/next/` to `/`; source now lives in `game-src/`, built to `public/src/`. The previous 42-patch runtime and addons are isolated in `legacy-src/` and `public/legacy/` for comparison.
- Fixed attack overwrite, held combo input, dash immunity, equipment changes during swings, stale Forge/death/effect state, and boss elemental status ticks. Shared contact geometry drives slash visuals and melee damage.
- Added a single introduction schedule for weapon types, rarity, elements, five gameplay mutations, and enemy counters. Guaranteed opening reward and seven-kill dry-drop protection. Free three-weapon drafts between zones.
- Added nine original awakened pixel weapon sprites in `art-src/awakening.py`, three slash frames, touch controls, viewport fitting, boss charge tells and platform pursuit.
- Node validation: six suites pass, including 20,000 random loot samples. Browser regression suite runs in GitHub Actions and covers actual asset rendering, held combos, per-swing hits, dash, auto-equip safety, all mutations, all six bosses, Forge/reset and all ten zone transitions.
- Compatibility: native game does not include the legacy armor/meta/Museum/leaderboard UI. Those remain at `/legacy/`; saves and API/database code are untouched. PR #12 is the review boundary before replacing production.

---


Handoff notes so any session can pick up where the last one stopped. Newest first.

## Roadmap (16-bit noobscrub update)

1. **Consolidate the code** — done (2026-10-18), no visible change.
2. **16-bit art foundation** (done 2026-10-18) — 480×270 internal resolution, fixed palette, pixel font, sprite atlases; redraw player, enemies, bosses, 9 weapon types, tiles, parallax, VFX. Starts with a style sheet for approval. See `docs/STYLE.md`.
3. **UI/HUD** (done 2026-10-18) — framed pixel panels, compact edge HUD, restyled title / shop / level-up / death / leaderboard / Museum.
4. **Gameplay polish** — floating-text budget, one loot banner at a time, Dark-trait rework, hit-stop and screenshake tuning, chiptune SFX, balance via bot runs.
5. **Ship** each phase via a preview branch and PR into `crazy-weapon-man-web` (auto-deploys).

## 2026-10-18 — next: weapon-integrated hero animation

- The hero body is now drawn without arms (`art-src/build_next.py`: armless frames + breathing, 3-step run, lean, wind-back, crouch, planted stance, shoulder points per frame). `src/game/anim.js` draws both arms from the shoulders to hands posed per weapon style, with the weapon in the front hand (two-handed styles put the back hand on the handle).
- Each style has its own idle, run, jump/fall, dash, hurt, combo and special poses: sword arcs, reverse-grip dagger jabs, two-handed katana (chudan guard, overhead cut, sweep), hammer (head-down rest, overhead lift, crouching slam), nunchuck twirls and shoulder spins, mid-shaft staff thrusts/sweeps/spin, bow draw (string pulled to the back hand, nocked arrow, release), shuriken throw from behind the head, wand flick.
- Ranged shots now leave at the release frame. Weapons are rotated with a RotSprite-style sampler cached at 32 angles; fast swings leave a pixel smear.

## 2026-10-18 — The rebuild: Crazy Weapon Man next (/next/)

Playtest verdict on the old build: "built in layers that are eating the game away". Decision: a clean
new game reusing the art and the core loop; the live game stays up until the new one is better.

**Done (v1 preview)**
- `public/next/`: plain ES modules, no build step, one 60 Hz fixed-step loop, one state object; see `public/next/README.md`.
- Everything native, nothing patched: hero (run, variable jump, coyote time, drop-through, dash), 9 weapon types with 3-hit combos or projectiles and a special each, 17 enemy behaviours (melee, ranged, bomb, shield, blink, summon, sniper, roller, mimic, flyers), geese, sleeper elites with speech bubbles, 10 elements with effects, 6 bosses with pattern queues/phases/hazards, 10 zones x 4 waves, XP/levels, shards and the Forge, weapon names/looks, standout drops, arcade knockback, hit sparks, stacked damage numbers, hit-stop, pixel screenshake, chiptune SFX and music, keyboard + gamepad.
- Damage curve designed in (`src/data/curve.js`): enemy health ~1.9x per zone; normal weapons 3-4 hits at home, standouts one-shot at home and take 2 hits next zone.
- New hero frames (wind-up, attack, hurt, dash, fall) from `art-src/build_next.py`.
- Bot playtest: 60 fps, no errors, ~75 s per zone, bosses beatable.
- `build.mjs` now leaves `public/next/` alone; CI syntax-checks the new modules.

**Next**
- Human playtest, then tune; leaderboard; replace the live game at `/` when it's better.

## 2026-10-18 — Phase 4 (part 3): weapons look like their names

**Done**
- `systems/36-weapon-names.js` records the words each name used (`w.__look`); element weapons now usually say so even at low tiers ("Rusty Blazing Sword"), so the effects match the name.
- 28 new held-weapon sprites, one per base word (Longsword, Claymore, Shiv, Stiletto, Nodachi, Odachi, Flails, Chain Sticks, Disc, Longbow, Warbow, Twig, Scepter, Walking Stick, Maul, Mallet, Bonker, ...) in `art-src/weapons.py` `VARIANTS`.
- `systems/40-weapon-looks.js`: palette by word (element > grand word > adjective > condition > rarity), baked details (rust, chips, cracks, dents, bends, goo, price tags, teeth, spikes, grumpy eyes, sunglasses, chains, moss, jewels, goose beak), motion (Wobbly, Loose, Jittery, Rowdy, Sad), pixel particles (embers, frost, sparks, bubbles, drips, ghosts, curse smoke, steam, rain, notes, confetti), relic auras, orbiting runes on numbered relics, rainbow top tier, gold sparkle on standouts. Slashes and projectiles take the weapon's colour and leave its particles. Drops show the weapon itself; the HUD icon uses the look. Legacy aura circles are skipped while the pixel art is up.
- Debug: `CWM_PX.looks.equip({type, base, cond|adj|grand|family, ...})`, `CWM_PX.looks.sheet(specs)`.

## 2026-10-18 — Phase 4 (part 2): music, names, text budget, geese, balance

**Done**
- Chiptune music (`systems/34-chipmusic.js`): 4-channel sequencer (pulse lead, pulse arpeggio, triangle bass, noise drums), a seeded 16-bar song per zone with its own key/mode/tempo, faster harmonic-minor boss tracks.
- Weapon names (`systems/36-weapon-names.js`): one name per weapon, built from its rarity, 22–40 characters (was median 100, max 210). Tiers: "Wobbly Longsword" → "Bitey Katana of Late Fees" → "Faultline Star of Endless Audits" → "Bonkreaver, the Unreasonable" → "Glumbane III, the Very Loud" → "THE LAST INVOICE (A SWORD)". The HUD scrolls names that don't fit.
- Text budget (`systems/37-text-budget.js`): compact numbers (12.3K, 4.5M … GAZILLION), hits on one enemy merge into one number, at most 8 numbers and 2 stacked callouts. Enemy labels only for elites/mutators; nameplates rare; one short trait tag instead of the full list.
- War Goose enemy (new sprite) and sleeper elites (`systems/38-geese-sleepers.js`): ~1 in 10 ground spawns is a goose that honks on wind-up; ~1 in 4 ground elites spawns asleep, wakes when hit or approached, and talks in speech bubbles.
- Balance (`systems/00-damage-budget.js`, `systems/39-weapon-curve.js`): every swing has a damage budget against each non-boss enemy, measured against the zone the weapon was found in. Normal weapons take 3–5 swings in their zone and fade after. 1 in 5 drops is a standout: one-shots at home, 2 swings in the next zone, ~4 after. Measured with `CWM_BUDGET.arena()` (standouts at home: ~60–70% one-swing kills; next zone: 2–3 swings, no one-swing kills). The HUD DPS and auto-equip follow the budget. "ONE-SHOT" now means a kill from full health.

**Next**
- Bosses still take the raw (inflated) damage under their own caps; check boss fight length in a full run.
- Leaderboard submission bug (logged in phase 1).

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

## 2026-10-19 — Larger hunting maps and expressive combat

- Expanded all ten maps to 8–12 screens with three hunting tiers, ladders, solid tunnel floors and ceilings, canyon terraces, vertical camera tracking and a two-dimensional minimap.
- Retained finite map clears and boss chambers; projectiles stop against rock.
- Added cycling goofy hit faces, BONK/OOF/PLOP callouts, low thuds and a persistent full weapon-name banner.
- Added collision and route checks plus browser ladder, camera, hit-reaction and all-zone transition scenarios.

## 2026-10-19 — Correct map structure and add mobile browser play

- Reviewed Ant Tunnel I reference geometry after user clarified the request was structural. Restored the ten original biome identities and authored backgrounds/platform art. Replaced repeated storeys with offset descending chambers, overhangs, broad hunting shelves, side alcoves, stepping ledges and short return ladders.
- Added a left thumb joystick and right HIT/JUMP/DASH/SKILL controls, independent pointer ownership, cancellation and focus cleanup, landscape thumb gutters, safe-area layout and portrait rotation handling. Forge and restart remain touch playable.
- Added reachability and theme checks, joystick tests, two-thumb browser regression and Chrome device-emulation layout/rotation screenshots.
