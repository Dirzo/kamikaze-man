# KAMIKAZE MAN — Four-Class Prototype

A keyboard-first 2D action roguelike prototype for Godot 4.

## Controls

- F2 — start a fresh class playtest immediately; choose 1–4. Works from the death screen too. Replaces the current run and resets run stats, but keeps your saved upgrades. Practice earns no permanent souls and disables permanent purchases; Enter on the practice death screen returns to a normal run.

- Left / Right Arrow — move
- Alt — jump
- Down + Alt — drop through a one-way platform
- Ctrl — attack
- Q — class ability; cooldown shown in HUD
- R — dedicated crowd-clearing ability, independent 8-second cooldown
- T — skill tree after choosing a class; 1 / 2 / 3 invest in a branch, T or Esc closes
- Shift — dash
- Z — interact with the slot machine
- K — kamikaze: sacrifice your life for an explosion
- 1 / 2 / 3 / 4 — select your class at the start of every run
- 1 / 2 / 3 — select upgrades or death-shop purchases
- Enter — start a new run from the death screen

No mouse controls are required.

## Sword, slot breakdowns, and classes

- Fighter carries a visible sword. Hold Ctrl for repeated slashes; the hit area extends 91 pixels in the facing direction, with a 42-pixel height.
- Each paid slot spin has an independent 30% chance to break the machine after its reward. Luck changes rewards, not breakdown odds. Every cleared map unlocks a fresh machine in the reward area; failed payment never breaks it.
- Choose your class with 1 / 2 / 3 / 4 before combat starts. Enemies wait during selection. Start with full class HP, three skill points, and both Q and E abilities.
- Fighter: sword cleave; +50 HP, +6 damage. Q: Whirlwind deals double damage within 140 pixels and guards for 0.5 seconds; 5-second cooldown.
- Mage: exploding staff orbs with 90-pixel splash; +14 damage, -15 HP, slower attacks. Q: Arcane Nova deals 2.5x damage within 220 pixels; 6-second cooldown.
- Shooter: rapid bullets stop at the first target; -8 damage, faster attacks, +30 speed. Q: Scattershot fires five bullets at 1.6x damage each; 3-second cooldown.
- Bowman: arrows pierce three enemies; +6 damage, +35 speed, +10 percentage points of crit. Q: Power Arrow deals triple damage and pierces six enemies; 4-second cooldown.
- Ranged weapons shoot in the facing direction and stop at solid ground. Jump to attack at different heights. No ammo or mana is required. Staff, gun, bow, and sword visuals distinguish the classes.
- Your class and run upgrades carry between maps. Every new run returns to class selection; bosses never ask you to choose again.

## Maps, kamikaze, and permanent progression

Defeat the boss and finish earned level-up choices to open the safe reward area. Buy items with 1/2/3, gamble with Z, and press Enter to start the next map. Ground length, platform positions and widths, enemy positions, and colors change. Core enemy health rises 32% of base per map and damage rises 16%. Enemies do not respawn until the next map. Platforms remain reachable from the continuous ground.

K ends your current life and deals 150 + 5 times weapon damage, plus permanent blast bonuses, to enemies within 300 pixels. A visible blast marks the radius. Killing the boss with the blast earns rewards but still ends the run.

Each normal kill earns 1 soul; bosses earn 5. Death banks earned souls once and opens the permanent upgrade shop. There is no reward for dying without kills.

- 1: Iron Heart — +10 starting HP per rank.
- 2: Sharp Steel — +3 starting weapon damage per rank.
- 3: Last Word — +50 kamikaze damage per rank.

Each starts at 3 souls and costs 2 more per existing rank, up to 100 ranks. Purchases apply to the next run. Enter returns to class selection at map 1 with zero gold and fresh run stats.

Soul balance and permanent ranks save locally to Godot's user data as `user://kamikaze_progress.cfg`. They survive closing the game; they do not sync through GitHub. In-progress runs are not saved.

## Automated checks

Run these from the project folder using Godot 4:

    godot --headless --path . --script res://tests/regression.gd
    godot --headless --path . --script res://tests/features.gd
    godot --headless --path . --script res://tests/run_loop.gd
    godot --headless --path . --script res://tests/classes.gd

## Prototype loop

1. Kill enemies.
2. Gain XP and gold.
3. Level up and choose one of three upgrades.
4. Fight the map boss at the far right. Every third map has a mega boss.
5. Spend gold at the post-boss item shop and optional slot machine.
6. Press Enter to enter the next, harder map.
7. On death, spend souls to strengthen the next run.

## Open in Godot

1. Install Godot 4.x.
2. Clone or download this repository.
3. Open Godot Project Manager.
4. Click **Import**.
5. Select `project.godot`.
6. Press F6/F5 to run.

## Current visuals

The prototype now uses original chibi fantasy character art, a painted forest background, grassy terrain, and simple motion. Combat balance still needs playtesting.

## Expanded encounters

The first Collector is now an introductory melee boss: 160 HP, 8 damage, 65 move speed, and no projectile spread. Later bosses retain stronger stats and ranged attacks. After taking damage, the player has 0.6 seconds of protection against repeated hits.

Class-playtest validation:

    godot --headless --path . --script res://tests/playtest.gd

Maps span 3400–4000 pixels with six platforms, woodland scenery, and eighteen enemies initially, growing to forty. Regions change after each mega boss: Sunleaf Woods, Frostfall Ruins, Ember Canyon, and Mooncap Grove.

Gunners and Hex Casters shoot dodgeable projectiles. Bosses fire three-shot spreads. Their bodies flash gold before firing. Projectiles pause during upgrade selection and are removed on map transitions. A new map resets Q's cooldown. Existing permanent-upgrade saves remain compatible and benefit all classes.

## Lifesteal and fighting-style trees

Every character starts with 5% lifesteal. Healing uses actual damage dealt (not overkill), carries fractional healing between hits, caps at max HP, and never revives a dead player. Green HP numbers show restored health. Vampiric Edge is a level-up option adding 3 percentage points of lifesteal. Healing works with melee, projectiles, area skills, and burns.

Press T after choosing a class. Each class has three mutually exclusive branches, each with three ranks:

| Class | Branch 1 | Branch 2 | Branch 3 |
| --- | --- | --- | --- |
| Fighter | Bloodblade: life-draining cleaves | Guardian: damage reduction, guard, slows | Cyclone: faster attacks and wide whirlwinds |
| Mage | Pyromancer: fire and damage over time | Cryomancer: slows and larger explosions | Siphon: draining magic |
| Shooter | Gunslinger: rapid fire and seven-shot fans | Sniper: heavy piercing precision shots | Demolitioner: exploding rounds |
| Bowman | Ranger: multi-arrow volleys | Marksman: heavy precision arrows | Thorn Warden: slows and lifesteal |

The first investment locks that branch for the current run. Ranks cost 1, 2, then 3 points. Class selection grants 3 points and each level grants 1 more. Unspent pre-class points remain available. The tree changes primary attacks, Q skills, or defenses as described in each node. Skills and status effects pause while choosing upgrades.

F2 starts a fresh class/style playtest with 6 points, enough to fully rank any branch. These are run upgrades, not permanent soul upgrades; starting a new run resets them.

## Fantasy art refresh

Original chibi heroes, slime/mushroom/imp monsters, an armored forest boss, a painted woodland background, and grassy terrain replace the rectangle-only look. The three regions are now Sunleaf Woods, Mushroom Hollow, and Thornwood Grove. Characters use basic idle/walk bobbing and weapon swings rather than full frame-by-frame animation.

Assets are in assets/characters.png and assets/forest.png. See assets/ART_NOTES.md for generation prompts and implementation notes. Existing permanent saves remain compatible.

Additional validation:

    godot --headless --path . --script res://tests/skill_tree.gd

## Forest music, extra abilities, and living enemies

Canopy Daydream replaces the first soundtrack. It is an original 65-second stereo
loop with soft electric-piano melody, plucked strings, rounded bass, sustained
harmony, and light brushed percussion. It contains no MapleStory samples or copied
melody. M mutes/resumes; mute survives fresh runs until the game closes. Music
continues across maps and class practice. Rebuild the Ogg with Python, numpy,
and soundfile using tools/compose_canopy.py.

After choosing a class, E activates a second ability alongside the existing Q skill.
Press T, then Tab, then 1/2/3 to equip an option. Tab returns to the style tree;
T or Escape returns to play. Abilities cost no points and work with any style.
Swapping preserves the remaining E cooldown, so healing cannot be refreshed by
opening the menu. E cooldown pauses during menus. F2 lets you test immediately.

| Class | Option 1 | Option 2 | Option 3 |
| --- | --- | --- | --- |
| Fighter | Crescent Wave: piercing sword wave | Second Wind: heal + guard | Blood Harvest: nearby damage + drain |
| Mage | Starfall: targeted area blast | Winter Bloom: wide damage + slow | Moonlit Ward: shield + healing |
| Shooter | Firecracker: explosive round | Flash Powder: nearby damage + slow | Parting Shots: guarded backward dash + shots |
| Bowman | Starling Volley: five piercing arrows | Bramble Snare: roots ahead | Forest Renewal: heal + brief guard |

Enemies patrol around their spawn, pause and turn at their patrol boundaries,
then chase when the player approaches. Ground probes prevent walking off ledges,
and enemies can stand on raised platforms. Slows also affect patrol speed.
Menus freeze enemy movement and animation. Existing introductory boss stats stay intact.

Basic animations use the existing original portraits: idle breathing, walking
bounce and tilt, facing direction, attack lunges, and hit reactions. The player
also stretches during jumps, recoils during attacks, and shows a glowing guard ring.
These are lightweight sprite transforms, not new frame-by-frame sprite sheets.

Additional validation:

    godot --headless --path . --script res://tests/abilities_movement.gd

## Ground loot

Monsters drop their gold as bouncing coins instead of immediately crediting your
wallet. Walk nearby to attract and collect them. Normal monsters have a 35% chance
to drop one item; bosses always drop one. Items improve the current run:

- Forest Tonic: restores 30 HP. Stays on the ground while your health is full.
- Sharp Fang: +3 weapon damage.
- Heartstone: +8 maximum HP and heals 8 HP.
- Vampire Ruby: +1 percentage point of lifesteal (base capped at 50%).

Map clears gather remaining usable loot before generating the next map, including
the boss's drops. Dead players cannot collect loot. Gold, items, and their bonuses
reset on a new run or F2 practice restart; saved soul upgrades remain unchanged.

    godot --headless --path . --script res://tests/start_loot.gd

## Mega bosses and post-boss rewards

Maps 3, 6, 9, and every third map thereafter contain a Mega Forest Colossus.
It has 1.9 times the normally scaled boss HP, 1.25 times contact damage, a larger
body, and five-shot projectile fans. Its orange circle warns for 1.1 seconds
before a 230-pixel ground slam. Below half health it shoots and slams more often.
Mega bosses award twice the normal map boss gold. Normal map 1 stays introductory.

Maps start with eighteen enemies and add four per map, up to forty total. Enemy HP and damage
increase while gold rewards rise to help fund upgrades.

There is no usable or visible slot machine during combat or at run start. Each
boss victory unlocks one fresh slot machine and a safe item shop after earned
level-up choices. Remaining enemies are removed without additional kill rewards.
Combat hotkeys are disabled during this break; slots remain optional. Enter starts
the next map and cannot interrupt a paid spin. A broken machine stays broken until
the next map clear.

Shop stock refreshes after each boss. Each item can be purchased once per visit:

- 1: Forest Tonic, heal 50 HP, starts at 30 gold. Full health blocks the purchase.
- 2: Honed Weapon, +6 damage for this run, starts at 60 gold.
- 3: Heart Charm, +20 max HP and heal 20, starts at 50 gold.

Prices increase by 5 gold per completed-map index above map 1. These purchases
use run gold, not permanent souls. F2 resets practice as before.

    godot --headless --path . --script res://tests/mega_shop.gd

## Mobbing and regional journeys

All four classes start with a dedicated R mobbing skill alongside Q and E. R costs
no skill points, has an independent eight-second cooldown, and resets on map change.
It benefits from weapon damage, lifesteal, and the chosen style's hit effects.

- Fighter / Earthshatter: 250% damage in a 260-radius circle and brief guard.
- Mage / Arcane Storm: 230% damage in a 330-radius circle.
- Shooter / Bullet Tempest: 350% damage in a 280-radius area ahead.
- Bowman / Rain of Arrows: 240% damage in a 310-radius area ahead, plus a two-second slow.

Regions stay consistent for three maps, including their mega boss and reward shop.
Entering the next map after that shop changes the scenery, ground palette, enemy
portraits, enemy names, and boss appearance:

| Maps | Region | Monsters |
| --- | --- | --- |
| 1–3 | Sunleaf Woods | Slimes, mushrooms, forest imps, Forest Colossus |
| 4–6 | Frostfall Ruins | Snow puffs, frost wolves, ice imps, Glacier Golem |
| 7–9 | Ember Canyon | Ember slimes, lava beetles, cinder mages, Basalt Titan |
| 10–12 | Mooncap Grove | Mooncaps, dusk bats, spore wizards, Mushroom Monarch |

The four-region cycle repeats from map 13 with continuing difficulty scaling.
Ice casters fire paired shots; ember shots travel slower and hit harder; moon
casters fire slow three-shot fans. Mega bosses retain their five-shot fan and slam.
Ordinary nameplates are hidden in combat and their health bars appear when damaged
to keep large crowds readable; bosses retain labels and bars.

The new artwork was generated with the built-in image-generation tool. See
assets/REGION_ART_NOTES.md for exact prompts and saved asset paths.

    godot --headless --path . --script res://tests/regions_mobs.gd

## Combat sounds and larger packs

Weapon attacks have distinct original sword, magic, gun, and bow effects. Q, E,
and R play stronger class cast sounds; recovery abilities have a healing chime.
Hits and player damage have short impact sounds. Effects use eight pooled voices
and repeated crowd-hit sounds are throttled to keep large fights controlled.

N mutes/unmutes combat sounds independently of M (music). The choice persists
across fresh runs until closing the game. No external sound samples are used;
effects are synthesized and cached in memory by scripts/combat_audio.gd.

Maps now contain 18 enemies initially and add four per map, capped at 40 total.
Most additional monsters are melee; one in three is a ranged caster.

    godot --headless --path . --script res://tests/combat_sounds.gd
