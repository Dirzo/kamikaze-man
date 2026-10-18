# Crazy Weapon Man — next

The clean rebuild. Plain ES modules served as-is from `public/next/` (no bundler, no build step),
playable at `/next/`. Art comes from the shared export in `/assets/px/` (`art-src/build_assets.py`)
plus new-game-only art in `next/assets/` (`art-src/build_next.py`).

One fixed-step loop (60 Hz) in `src/main.js`; one shared state object (`src/game/world.js`).
Every system is written once — nothing wraps or patches anything else.

| file | what it does |
| --- | --- |
| `src/config.js` | resolution (480x270), ground line, palette, hero physics, key map |
| `src/engine/input.js` | keyboard + gamepad → actions, buffered presses |
| `src/engine/assets.js` | loads the manifests and every sprite |
| `src/engine/gfx.js` | pixel canvas, sprites, dither, pixel font, 9-slice panels, screenshake offset |
| `src/engine/audio.js` | chiptune voices, sound effects, 4-channel music sequencer |
| `src/data/*.js` | zones, enemies, weapons/rarities/elements, names, the damage curve |
| `src/game/hero.js` | movement, combos, ranged shots, 9 specials, held-weapon drawing |
| `src/game/enemy.js` | enemy state machine for all 17 types, enemy projectiles |
| `src/game/bosses.js` | 6 bosses: pattern queues, phases, hazards |
| `src/game/combat.js` | every hit (knockback, elements, death, loot) and every hurt |
| `src/game/looks.js` | weapon looks from their names (palette, details, particles, auras) |
| `src/game/loot.js` | weapon generation and damage numbers |
| `src/game/drops.js` | weapons on the ground (compare/swap), shards, hearts |
| `src/game/waves.js` | zone → waves → boss → forge → next zone |
| `src/game/forge.js` | spend shards between zones |
| `src/game/fx.js` | particles, hit sparks, stacked damage numbers, callouts, shake, hit-stop |
| `src/game/hud.js` | bottom bar, zone/wave line, boss bar, toasts, zone card |

Debug: `CWM_NEXT.jump(zone, { boss: true, type: 'hammer' })` in the console.
