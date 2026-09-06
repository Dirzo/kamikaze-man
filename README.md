# KAMIKAZE MAN — Four-Class Prototype

A keyboard-first 2D action roguelike prototype for Godot 4.

## Controls

- Left / Right Arrow — move
- Alt — jump
- Down + Alt — drop through a one-way platform
- Ctrl — attack
- Q — class ability; cooldown shown in HUD
- Shift — dash
- Z — interact with the slot machine
- K — kamikaze: sacrifice your life for an explosion
- 1 / 2 / 3 / 4 — select a class after the first boss
- 1 / 2 / 3 — select upgrades or death-shop purchases
- Enter — start a new run from the death screen

No mouse controls are required.

## Sword, slot breakdowns, and classes

- The starting Recruit carries a visible sword. Hold Ctrl for repeated slashes; the hit area extends 91 pixels in the facing direction, with a 42-pixel height.
- Each paid slot spin has an independent 30% chance to break the machine after its reward. Luck changes rewards, not breakdown odds. Every new map has a fresh machine; failed payment never breaks it.
- Defeat THE COLLECTOR for the first time to choose a class with 1 / 2 / 3 / 4. Enemies cannot damage you during selection. Any earned level-up choices follow afterward.
- Fighter: sword cleave; +50 HP, +6 damage. Q: Whirlwind deals double damage within 140 pixels and guards for 0.5 seconds; 5-second cooldown.
- Mage: exploding staff orbs with 90-pixel splash; +14 damage, -15 HP, slower attacks. Q: Arcane Nova deals 2.5x damage within 220 pixels; 6-second cooldown.
- Shooter: rapid bullets stop at the first target; -8 damage, faster attacks, +30 speed. Q: Scattershot fires five bullets at 1.6x damage each; 3-second cooldown.
- Bowman: arrows pierce three enemies; +6 damage, +35 speed, +10 percentage points of crit. Q: Power Arrow deals triple damage and pierces six enemies; 4-second cooldown.
- Ranged weapons shoot in the facing direction and stop at solid ground. Jump to attack at different heights. No ammo or mana is required. Staff, gun, bow, and sword visuals distinguish the classes.
- Recruits also have Whirlwind before class selection.
- Class selection occurs after the first boss in each run. Your class and run upgrades carry between maps, but a new run starts as a Recruit.

## Maps, kamikaze, and permanent progression

Defeat the boss and finish any class/level-up choices to move automatically to the next map. Ground length, platform positions and widths, enemy positions, and colors change. Enemy health rises 22% of base per map and damage rises 12%. Enemies do not respawn until the next map. Platforms remain reachable from the continuous ground.

K ends your current life and deals 150 + 5 times weapon damage, plus permanent blast bonuses, to enemies within 300 pixels. A visible blast marks the radius. Killing the boss with the blast earns rewards but still ends the run.

Each normal kill earns 1 soul; bosses earn 5. Death banks earned souls once and opens the permanent upgrade shop. There is no reward for dying without kills.

- 1: Iron Heart — +10 starting HP per rank.
- 2: Sharp Steel — +3 starting weapon damage per rank.
- 3: Last Word — +50 kamikaze damage per rank.

Each starts at 3 souls and costs 2 more per existing rank, up to 100 ranks. Purchases apply to the next run. Enter starts a new Recruit at map 1 with zero gold and fresh run stats.

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
4. Spend gold at the slot machine.
5. Gamble for permanent run buffs, jackpots, or risky curse upgrades.
6. Fight THE COLLECTOR at the far right side of the level.
7. Advance to a new map, or die and spend souls to strengthen your next run.

## Open in Godot

1. Install Godot 4.x.
2. Clone or download this repository.
3. Open Godot Project Manager.
4. Click **Import**.
5. Select `project.godot`.
6. Press F6/F5 to run.

## Current visuals

Everything is intentionally primitive. The goal of v0.1 is to prove the movement → combat → XP → gambling loop before spending time on sprites and animation.

## Expanded encounters

Maps span 3400–4000 pixels with six platforms, randomized skyline scenery, and seven enemies initially, growing to eleven. Neon Outskirts, Hex District, and Iron Barricade cycle through colors and boss names.

Gunners and Hex Casters shoot dodgeable projectiles. Bosses fire three-shot spreads. Their bodies flash gold before firing. Projectiles pause during upgrade selection and are removed on map transitions. A new map resets Q's cooldown. Existing permanent-upgrade saves remain compatible and benefit all classes.
