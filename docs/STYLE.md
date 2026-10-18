# noobscrub 16-bit house style — working brief

Source images are in `docs/style-refs/`. This brief is the starting point for the Crazy Weapon Man art
pass (phase 2). The first deliverable of phase 2 is a one-page style sheet (palette swatches, one hero,
one enemy, one tile strip, one HUD frame, the font) for approval before any bulk art is drawn.

## What the references have in common

| Ref | Take from it |
| --- | --- |
| 01 framed HUD, treehouse | Ornate framed status bar along one screen edge; labelled slots (MAIL / ARMS / KEY / GOLD) with a bar + number + icon each. Warm wood browns, deep shadows. |
| 02 outlined heroes + gems | Chibi characters about 2 heads tall, solid 1px dark outline (navy-black, not pure black), 2–3 shades per material. Pickups float with a soft coloured glow. Short floating callouts ("Ice!", "Fire?") in a rounded pixel font with a dark outline. |
| 03 castle courtyard | Bright daytime palette: sky gradient in 3–4 flat bands, distant hills as one flat silhouette, crisp brick and grass tiles, tiny UI label at top. |
| 04 champion codex | Roster of ~16×24 px heroes on a navy panel: each readable by silhouette + 1 accent colour; names in small pixel text underneath; highlighted entries go gold. |
| 05 night forest camp | Moody night palette (indigo → violet → cyan accents), layered parallax trees, warm light sources (fire, lanterns) as the focal colour. Minimal corner HUD: hearts top-left, currency below, item slot top-right. |

## Rules (proposed)

- **Resolution:** render the game at 480×270 internal pixels, integer-scaled with nearest-neighbour (4× at 1080p). No sub-pixel positions on sprites; no blur or soft shadows on game sprites.
- **Characters:** chibi, ~2–2.5 heads tall. Player about 16×24 px, regular enemies 14–24 px, bosses 32–64 px. 1px outline in the darkest palette colour. Weapons are separate small sprites so the arsenal (9 types × rarities × elements) can be recoloured rather than redrawn.
- **Palette:** one fixed palette of ~32 colours shared by every sprite, tile and UI element, with a day ramp (greens, sky blues, sandstone, wood) and a night ramp (indigo, violet, teal) so zones can shift mood. Rarity and element colours are picked from the same palette.
- **Font:** one pixel font with a dark outline for all in-world text and HUD numbers. Two sizes only.
- **HUD:** slim framed bar on one edge (ref 01) or minimal corner icons (ref 05) — the arena stays clear. No glass, gradients, or blur.
- **Effects:** pixel particles and 2–4 frame flashes; glow is a 1px coloured halo, not a blur.
- **Floating text:** short pixel-font callouts with a strict on-screen budget; damage numbers small, kills/crits/loot bigger.

## Colours sampled from the references

Dominant colours (median cut, most common first). The final palette will be chosen from these, not used wholesale.

- 01: `#6d3d0f` `#84632a` `#b48943` `#e7c55e` `#5d1004` `#2a301b` `#240706`
- 02: `#6d9749` `#8ca56c` `#b99460` `#473c45` `#6a8547`
- 03: `#a8dcfd` `#d3e4e9` `#6bc654` `#83d498` `#c4b28a` `#a08d6a` `#4d4a56`
- 04: `#222c5a` `#1c1f48` `#585b6d` `#7c8385` `#4d415d`
- 05: `#170d25` `#1a1053` `#22107f` `#2248bb` `#3663ae` `#412a77` `#93c4bb`
