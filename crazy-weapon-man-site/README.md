# Crazy Weapon Man

The playable game is a native pixel-art combat roguelike at `/`. It builds from small ES modules,
with one 60 Hz simulation, one world state, one hit resolver and one sprite renderer. The previous
layered build is isolated at `/legacy/`; none of its patches load in the main game.

## Work on the game

```sh
node crazy-weapon-man-site/build.mjs
python3 -m http.server 8877 --directory crazy-weapon-man-site/public
node --test crazy-weapon-man-site/tests/*.test.mjs
node crazy-weapon-man-site/build.mjs --check
bash crazy-weapon-man-site/tests/smoke.sh  # needs Chrome/Chromium
```

Edit `game-src/`, never the generated `public/src/`. No framework or package install is needed.
The build copies the modules, fingerprints the entry point, checks for stale output and leaves assets
and the archived game alone. `?debug` exposes the explicit development helpers; `?smoke` loads the
browser regression suite. These are absent from normal runs.

## Ownership

| Source | Responsibility |
| --- | --- |
| `game-src/main.js` | Scenes, fixed-step loop, pause, transition and reset orchestration |
| `game-src/data/progression.js` | Weapon/element/mutation/enemy unlock gates and wave budgets |
| `game-src/data/curve.js` | Health, damage, XP and standout strength |
| `game-src/data/weapons.js` | Nine movesets, combo timings and specials |
| `game-src/game/attack-rules.js` | Shared contact frames and hit geometry |
| `game-src/game/hero.js` | Buffered controls, held combos, dash and specials |
| `game-src/game/combat.js` | Damage, stagger, elements, immunity, death and loot |
| `game-src/game/evolution.js` | Five bounded weapon mutation behaviours |
| `game-src/game/anim.js`, `slash.js`, `looks.js` | Pixel poses, slash frames and weapon silhouettes |
| `game-src/game/enemy.js`, `bosses.js` | Enemy state machines, bosses, tells and hazards |
| `game-src/game/waves.js`, `forge.js` | Run progression, three-way weapon drafts, shard workshop |
| `game-src/engine/` | Input, canvas, assets and chiptune audio |
| `art-src/` | Editable pixel sources and reproducible PNG exporters |
| `legacy-src/` | Historical patch stack; reference only |
| `src/index.js` | Existing Cloudflare API and database adapter |

Do not wrap or monkey-patch gameplay functions. Change the owning module and update its meaningful
regressions. New weapon powers belong in the mutation schedule, not a new script-injection layer.

## Progression

The first zone offers sword/dagger/bow, then introduces geese and bombs across waves. Heavy weapons
arrive in zone 2, katana in zone 3, shuriken in zone 4, then nunchucks/wand. Elements begin with fire
and ice, followed by poison/water, lightning/earth, wind, radiant, plasma and finally void. Rarity is
capped by zone even on boss rewards. New weapons are guaranteed after seven dry kills and after
the opening wave. There are never more than eight weapon drops or ten director-controlled mobs.

| Earliest zone | Mutation | Behaviour |
| --- | --- | --- |
| 3 | Echo Cut | Finishers repeat their impact after a short delay |
| 4 | Hungry Steel | Primary impacts launch one seeking splinter |
| 5 | Faultline | Finishers erupt across nearby foes |
| 7 | Blade Halo | Three visible orbiting blades deal bounded chip damage |
| 9 | Moon Breaker | Every third attack marks then tears across a wide area |

All mutations have distinct awakened sprites, never trigger recursive procs, and reset between runs.
Bosses have warning frames, locked charges, three health phases and stronger late-fight patterns.
Zone clears lead to a free choice of three weapons, followed by healing/reforging for shards.

Keyboard: arrows/AD move, X/Alt jump, Z/Ctrl attack (hold for combos), C/Space special,
Shift/V dash, Down swap, Down+Jump drop through platforms, Esc pause. Gamepad and touch are supported.

## Art

```sh
python3 crazy-weapon-man-site/art-src/build_assets.py
python3 crazy-weapon-man-site/art-src/build_next.py
```

480×270 canvas, nearest-neighbour sprites, fixed palette. The original nine awakened silhouettes
live in `art-src/awakening.py`. Slash frames share attack geometry instead of drawing on a second
legacy canvas. Larger screens use integer scaling; narrow phones fit their viewport.

## Compatibility

The legacy Museum, armor/meta features and leaderboard UI are available in `/legacy/`. The native
run does not yet submit scores to the old leaderboard. Existing saves and API/database code are
preserved; no storage migration or deletion is performed. This separation is intentional so the
main combat loop can be reviewed without the obsolete patch stack.
