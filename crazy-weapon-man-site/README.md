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
| `game-src/game/waves.js`, `forge.js` | Finite map clears, gated exits, three-way weapon drafts and shard workshop |
| `game-src/data/maps.js`, `game-src/game/camera.js`, `map-view.js` | Multi-screen routes, solid terrain, ladders, two-axis camera, minimap and exit portals |
| `game-src/engine/` | Input, canvas, assets and chiptune audio |
| `art-src/` | Editable pixel sources and reproducible PNG exporters |
| `legacy-src/` | Historical patch stack; reference only |
| `src/index.js` | Existing Cloudflare API and database adapter |

Do not wrap or monkey-patch gameplay functions. Change the owning module and update its meaningful
regressions. New weapon powers belong in the mutation schedule, not a new script-injection layer.

## Progression

Each of the ten biomes is a finite side-scrolling map, growing from eight to twelve screens wide, with offset descending chambers, broad hunting ledges, small stepping shelves, side alcoves and short ladder connections. Geometry follows the Ant Tunnel cave-network structure while all ten original biome names, backgrounds and platform sprites remain intact. UP/DOWN climbs; jump plus direction dismounts onto shelves. Every map resident is
placed once on entry. Undiscovered packs wait for you, and the minimap marks all remaining enemies.
There are no timed waves or director respawns. Kill every resident (and the end-chamber boss on boss
maps), then walk into the unlocked portal for your weapon draft and the next map. A living enemy
anywhere on the route keeps the exit locked. Summoned enemies also count toward completion.

The opening map starts with sword/dagger/bow and introduces geese farther along its route. Subsequent
maps introduce heavy weapons, katana, shuriken and finally nunchucks/wand. Elements, rarity ceilings
and mutations follow the shared introduction schedule. Loot has seven-kill dry-drop protection.
Maps have 28–55 initial residents distributed across ground and ledges; only nearby packs engage.
Bosses stay in the last-screen chamber and their warnings/hazards use that chamber's world bounds.

| Earliest zone | Mutation | Behaviour |
| --- | --- | --- |
| 3 | Echo Cut | Finishers repeat their impact after a short delay |
| 4 | Hungry Steel | Primary impacts launch one seeking splinter |
| 5 | Faultline | Finishers erupt across nearby foes |
| 7 | Blade Halo | Three visible orbiting blades deal bounded chip damage |
| 9 | Moon Breaker | Every third attack marks then tears across a wide area |

All mutations have distinct awakened sprites, never trigger recursive procs, and reset between runs.
Bosses have warning frames, locked charges, three health phases and stronger late-fight patterns.
Map clears lead to a free choice of three weapons, followed by healing/reforging for shards.

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

## Mobile browser controls

Rotate your phone to landscape. The left thumb joystick moves and climbs; hold HIT on the right to chain attacks. JUMP, DASH and SKILL sit beside it. Both thumbs work independently. In the Forge, nudge the joystick to select, HIT to take or buy, and JUMP to keep the weapon or continue. The viewport fits between thumb gutters, responds to browser-bar and orientation changes, and respects safe-area insets. Fullscreen requests landscape rotation where the browser supports it; normal browser play works without fullscreen.
