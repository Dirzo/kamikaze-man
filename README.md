# KAMIKAZE MAN — Prototype v0.1

A keyboard-first 2D action roguelike prototype for Godot 4.

## Controls

- Left / Right Arrow — move
- Space — jump
- Down + Space — drop through a one-way platform
- Ctrl — attack
- Shift — dash
- Z — interact with the slot machine
- 1 / 2 / 3 — select a level-up upgrade

No mouse controls are required.

## Sword, slot breakdowns, and classes

- The starting Fighter carries a visible sword. Hold Ctrl for repeated slashes; the hit area extends 91 pixels in the facing direction, with a 42-pixel height.
- Each paid slot spin has an independent 30% chance to break the machine after its reward. Luck changes rewards, not breakdown odds. A broken machine stays out of service until the game restarts; failed payment never breaks it.
- Defeat THE COLLECTOR for the first time to choose a class with 1 / 2 / 3. Enemies cannot damage you during selection. Any earned level-up choices follow afterward.
- Knight: +50 max HP and +6 damage.
- Berserker: +16 damage, 0.06 seconds faster attacks, -20 max HP.
- Duelist: +60 move speed, +15 percentage points of crit chance, 0.25 seconds shorter dash cooldown.
- Class selection occurs once per game session and survives player death. Restarting starts a new Fighter.

## Automated checks

Run these from the project folder using Godot 4:

    godot --headless --path . --script res://tests/regression.gd
    godot --headless --path . --script res://tests/features.gd

## Prototype loop

1. Kill enemies.
2. Gain XP and gold.
3. Level up and choose one of three upgrades.
4. Spend gold at the slot machine.
5. Gamble for permanent run buffs, jackpots, or risky curse upgrades.
6. Fight THE COLLECTOR at the far right side of the level.

## Open in Godot

1. Install Godot 4.x.
2. Clone or download this repository.
3. Open Godot Project Manager.
4. Click **Import**.
5. Select `project.godot`.
6. Press F6/F5 to run.

## Current visuals

Everything is intentionally primitive. The goal of v0.1 is to prove the movement → combat → XP → gambling loop before spending time on sprites and animation.
