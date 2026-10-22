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
| `game-src/game/waves.js` | Finite map clears, survival swarm and gated exits |
| `game-src/game/inventory.js`, `quirks.js`, `lust.js` | Bag/equipment windows, weapon quirks, Weapon Lust |
| `game-src/game/speedrun.js`, `data/speedrun.js` | Run clock, splits, damage log, results screen |
| `game-src/data/proficiency.js`, `quirks.js`, `lust.js` | Weapon mastery (saved), quirk table and rates, Weapon Lust numbers |
| `game-src/data/maps.js`, `game-src/game/camera.js`, `map-view.js` | Multi-screen routes, solid terrain, ladders, two-axis camera, minimap and exit portals |
| `game-src/game/ambience.js`, `data/biomes.js` | Living zone environments: parallax layers, weather, animated props, ice, belts, wind, dark |
| `game-src/engine/` | Input, canvas, assets and chiptune audio |
| `art-src/` | Editable pixel sources and reproducible PNG exporters |
| `legacy-src/` | Historical patch stack; reference only |
| `src/index.js` | Existing Cloudflare API and database adapter |

Do not wrap or monkey-patch gameplay functions. Change the owning module and update its meaningful
regressions. New weapon powers belong in the mutation schedule, not a new script-injection layer.

## Zone environments

Every zone is dressed for its beastkin family, whimsical like MapleStory: a golden-hour sword
graveyard, snowy woods under an aurora, a lily-pad lagoon with a bamboo dojo, a lantern-lit night
bazaar, a sakura shrine, a misty mountain temple, a lava forge, a storybook cottage, a moonlit ninja
castle and the dragon's gold vault. `art-src/biomes.py` (with `biome_art1.py`, `biome_art2.py`)
exports four tileable parallax layers per zone plus an atlas of ground, lip, cave-roof, pit and
animated prop sprites; `game/ambience.js` scrolls the layers, scatters the props along the route
(seeded, so a map always looks the same), runs the weather and the sky's critters, and adds a few
terrain touches that never change a layout: ice sheets in zone 2 (slippery), wind gusts in zone 6
(they push), conveyor belts in zone 7 (they carry you) and pools of darkness in zone 4 that only the
lamps light. `?capture=walk1`..`walk10` leaves a zone running for recordings.

## Progression

Each of the ten biomes is a finite map. Map 1 and the root and vault tunnels keep the offset descending chambers of Ant Tunnel; the others are MapleStory-style fields with wide ground, long one-way platforms stacked in tiers and a ladder hanging from each platform. Each field zone tunes the recipe (hills, a cave roof, a downhill run, a climb to a peak). Ladders end level with their platform, so climbing to the top stands you on it. Residents wander their platform peacefully until you come close or hit them. Their art (`art-src/cute_enemies.py`) gives each type its own colour, silhouette and prop. Layouts are seeded per zone, so routes are identical every run. `tests/map-reach.mjs` plays every map with the real collision code to prove every surface can be reached and left again; `node tools/map-overview.mjs out/` draws each whole layout to a PNG and `?capture=tour1`..`tour10` screenshots each zone in game. UP/DOWN climbs; jump plus direction dismounts onto shelves. Every map resident is
placed once on entry. Undiscovered packs wait for you, and the minimap marks all remaining enemies.
There are no timed waves or director respawns. Kill every resident, then head into the arena on the
last screen: it locks and the swarm (the bullet hell) pours in. A few seconds in, at a moment with no
countdown, a themed warning rumbles and the zone's boss crashes into the swarm: the story boss on
boss zones, a giant named resident elsewhere. The swarm keeps coming at half pace until the boss falls.
Every boss fights with its zone's theme (`castMove` in `bosses.js`: sword graves, arrow storms, tides
and skidding shells, smoke-bomb decoys, iai slashes you jump, avalanches, molten forge floors, cookie
rain, wand-sparkle and shuriken rings) and pulls a themed surprise at each phase change (story bosses)
or at half health (swarm bosses). `?capture=boss1`..`boss10` screenshots each one mid-surprise. Swarm hits build a combo (+1% damage per 5 hits, up to +30%) that
drops when you go about two seconds without hitting anything; the best combo pays out shards. Walk into the unlocked portal for the next map. A living enemy
anywhere on the route keeps the exit locked. Summoned enemies also count toward completion.

The opening map starts with sword/dagger/bow and introduces geese farther along its route. Subsequent
maps introduce heavy weapons, katana, shuriken and finally nunchucks/wand. Elements, rarity ceilings
and mutations follow the shared introduction schedule. Loot has seven-kill dry-drop protection.
Maps have 28–55 initial residents distributed across ground and ledges; only nearby packs engage.
Bosses stay in the last-screen arena and their warnings/hazards use that arena's world bounds.

| Earliest zone | Mutation | Behaviour |
| --- | --- | --- |
| 3 | Echo Cut | Finishers repeat their impact after a short delay |
| 4 | Hungry Steel | Primary impacts launch one seeking splinter |
| 5 | Faultline | Finishers erupt across nearby foes |
| 7 | Blade Halo | Three visible orbiting blades deal bounded chip damage |
| 9 | Moon Breaker | Every third attack marks then tears across a wide area |

All mutations have distinct awakened sprites, never trigger recursive procs, and reset between runs.
Bosses have warning frames, locked charges, three health phases and stronger late-fight patterns.
Their health is sized to the weapon you bring (at least ~10 seconds of its steady damage) and no
single hit takes more than 5% of it, so a lucky drop no longer deletes them; they shake loose two
hearts at each phase change. Thirteen weapon types (spear, axe, scythe and boomerang joined the
original nine), each with its own special; Rare and better weapons often carry a named ability
(meteors, double jump, bubble guard...) that shows up at the end of the name. Every resident type
has its own trick once it notices you (game/traits.js), and every map hides one easter egg on its
highest ledge (game/secrets.js).
Map clears lead to the arena swarm and its boss, then straight on to the next map. There is no
free weapon draft and no auto-equip. Drops hover where they land and fly into the bag (E / B / Tab).
Nothing is salvaged until all 24 slots are full; after that a better drop replaces the weakest
unlocked weapon of its type (or the weakest unlocked weapon overall), and a worse one is salvaged.
Locked weapons are never replaced or salvaged. Press DOWN right after looting an upgrade to equip it. Equipping a weapon you
have never held fills the Weapon Lust meter (+15% damage at full, draining) and gives a short NEW
TOY rush (+10%). Residents hold their platforms: they never walk off ledges, only get knocked off.
Climbing a ladder sheathes the weapon on your back and draws it again when you step off.

Every run is a speedrun: the clock (top centre) only stops for the pause menu, each exit portal
records a split against your best for that zone, and the end screen animates the clear time, splits,
damage dealt by each weapon and mastery gained. Bests are kept in localStorage
(`crazyWeaponMan.speedrun.v1`).

Every weapon has a quirk taken from its name (Rusty gives tetanus, Loose heads fly off, Bent weapons
boomerang, Sad ones make foes weep, Rowdy ones pop confetti, Feral ones grow huge). Common weapons go off
about every other hit and rarer ones still fire a third of the time, harder (`quirkPower`). A new drop
is never weaker than the weapon in your hand: weaker rolls are boosted to match it (`noWeaker`).
Each zone is the home of one weapon (`weapon` in `data/zones.js`): 40% of its drops and its map-clear
gift are that weapon, and its residents and backdrop (`art-src/weapon_zones.py`) carry the theme.
Weapon mastery is tracked per type, earned by kills and saved across runs: +1.5% damage per level, 20 levels.

Keyboard: arrows/AD move, X/Alt jump, Z/Ctrl attack (hold for combos), C/Space special,
Shift/V dash, Down equip a just-looted upgrade, E/B/Tab bag, Down+Jump drop through platforms, Esc pause. Gamepad and touch are supported.

## Art

```sh
python3 crazy-weapon-man-site/art-src/build_assets.py
python3 crazy-weapon-man-site/art-src/build_next.py
```

480×270 canvas, nearest-neighbour sprites, fixed palette. The hero is the 32-bit "arcade cut"
(`art-src/arcade_hero.py`, 22×30 frames with their own deeper colour ramps): goggles, red headband,
bare chest and bandolier, with hand-drawn gloved arms (`art-src/arcade_arms.py`: eight directions, bent and straight) that
`game/anim.js` picks per pose, locking the weapon to the drawn fist. Held weapons come
from `art-src/arcade_weapons.py`, built from small helpers so every variant has its own cut-outs,
notches, hooks or teeth. Each weapon class fights in its own way in `anim.js` STYLES: hammers swing
a full-body windmill, staves are held two-handed and twirl, spears lunge, axes chop and spin, scythes
reap. Hitboxes and timing (`attack-rules.js`) are unchanged. `CWM.animSheet()` (with `?debug`)
renders a contact sheet of every style's poses. The original nine awakened silhouettes
live in `art-src/awakening.py`. Slash frames share attack geometry instead of drawing on a second
legacy canvas. Larger screens use integer scaling; narrow phones fit their viewport.

## Compatibility

The legacy Museum, armor/meta features and leaderboard UI are available in `/legacy/`. The native
run does not yet submit scores to the old leaderboard. Existing saves and API/database code are
preserved; no storage migration or deletion is performed. This separation is intentional so the
main combat loop can be reviewed without the obsolete patch stack.

## Mobile browser controls

Rotate your phone to landscape. The left thumb joystick moves and climbs; hold HIT on the right to chain attacks. JUMP, DASH and SKILL sit beside it. Both thumbs work independently. The viewport fits between thumb gutters, responds to browser-bar and orientation changes, and respects safe-area insets. Fullscreen requests landscape rotation where the browser supports it; normal browser play works without fullscreen.
