# KAMIKAZE MAN — Prototype v0.1

A keyboard-first 2D action roguelike prototype for Godot 4.

## Controls

- Left / Right Arrow — move
- Alt — jump
- Down + Alt — drop through a one-way platform
- Ctrl — attack
- Shift — dash
- Z — interact with the slot machine
- K — kamikaze: sacrifice your life for an explosion
- 1 / 2 / 3 — select an upgrade, class, or death-shop purchase
- Enter — start a new run from the death screen

No mouse controls are required.

## Sword, slot breakdowns, and classes

- The starting Fighter carries a visible sword. Hold Ctrl for repeated slashes; the hit area extends 91 pixels in the facing direction, with a 42-pixel height.
- Each paid slot spin has an independent 30% chance to break the machine after its reward. Luck changes rewards, not breakdown odds. Every new map has a fresh machine; failed payment never breaks it.
- Defeat THE COLLECTOR for the first time to choose a class with 1 / 2 / 3. Enemies cannot damage you during selection. Any earned level-up choices follow afterward.
- Knight: +50 max HP and +6 damage.
- Berserker: +16 damage, 0.06 seconds faster attacks, -20 max HP.
- Duelist: +60 move speed, +15 percentage points of crit chance, 0.25 seconds shorter dash cooldown.
- Class selection occurs after the first boss in each run. Your class and run upgrades carry between maps, but a new run starts as a Fighter.

## Maps, kamikaze, and permanent progression

Defeat the boss and finish any class/level-up choices to move automatically to the next map. Ground length, platform positions and widths, enemy positions, and colors change. Enemy health rises 22% of base per map and damage rises 12%. Enemies do not respawn until the next map. Platforms remain reachable from the continuous ground.

K ends your current life and deals 150 + 5 times sword damage, plus permanent blast bonuses, to enemies within 300 pixels. A visible blast marks the radius. Killing the boss with the blast earns rewards but still ends the run.

Each normal kill earns 1 soul; bosses earn 5. Death banks earned souls once and opens the permanent upgrade shop. There is no reward for dying without kills.

- 1: Iron Heart — +10 starting HP per rank.
- 2: Sharp Steel — +3 starting sword damage per rank.
- 3: Last Word — +50 kamikaze damage per rank.

Each starts at 3 souls and costs 2 more per existing rank, up to 100 ranks. Purchases apply to the next run. Enter starts a new Fighter at map 1 with zero gold and fresh run stats.

Soul balance and permanent ranks save locally to Godot's user data as `user://kamikaze_progress.cfg`. They survive closing the game; they do not sync through GitHub. In-progress runs are not saved.

## Automated checks

Run these from the project folder using Godot 4:

    godot --headless --path . --script res://tests/regression.gd
    godot --headless --path . --script res://tests/features.gd
    godot --headless --path . --script res://tests/run_loop.gd

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
