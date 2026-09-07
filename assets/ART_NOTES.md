# Artwork notes
Created using the built-in image-generation tool, not the CLI. Original chibi fantasy designs inspired by the feel of classic Korean side-scrolling RPGs.

## Saved game assets
- assets/characters.png — four heroes and four monsters, 4×2 sprite atlas.
- assets/forest.png — sunlit fantasy forest background.
- scripts/game_art.gd uses a chroma-key shader to render the magenta sprite background transparent. The image generator did not preserve actual alpha, so the final atlas deliberately uses a uniform key color.
- scripts/terrain_art.gd draws grassy terrain to match the background.
Character animation currently consists of idle/movement bobbing and existing weapon swings, not a full walk-cycle sprite sheet.

## Character generation prompt
Use case: stylized-concept. Asset type: game sprite atlas for an original 2D side-scrolling fantasy action RPG. Make one 1536x1024 PNG with a genuinely transparent background, arranged in EXACTLY 4 columns and 2 rows of equal 384x512 cells. Each cell contains ONE full-body isolated character centered at x=192 within its cell, feet baseline y=450 within cell. Keep every character inside its own cell with at least 35px padding. Top row left to right: blue-armored young sword fighter with brown spiky hair; purple-robed mage with oversized pointed hat; orange-clad goggles-wearing gunner with short coat; green-hooded archer. Bottom row left to right: cheerful teal slime monster; orange mushroom monster with little feet and eyes; purple imp caster with horns; imposing chibi armored forest bandit boss. All face slightly RIGHT in a readable side-view three-quarter idle pose, 2.5-head-tall chibi proportions, expressive eyes, crisp dark outlines, cel shading, bright pastel fantasy palette, polished hand-painted sprite style reminiscent of classic Korean side-scrolling MMORPGs. Original designs; no existing game characters, logos, labels, grid lines, shadows outside character, or text. Characters should not hold weapons: weapons are separate in-game overlays. Do not draw background scenery. This must be a usable uniform-grid sprite atlas, not a presentation sheet.

## Background-removal edit prompt
Edit this game sprite atlas. Preserve the eight character designs, their colors, and the exact 4-column by 2-row arrangement and 1536x1024 dimensions. REMOVE ALL of the colored gradient background and colored glows completely, replacing them with actual fully transparent pixels (alpha=0). This is not a presentation illustration: every character must be an isolated sprite cutout. No checkerboard drawn into image. No ground, no shadows, no halos. Keep each character fully within its own 384x512 cell with transparent padding, and feet within the cell. The background must truly have transparency. Do not change character appearances.

## Final character-atlas edit prompt
Edit this exact 1536x1024 4x2 sprite atlas. Keep all 8 character designs and cell positions unchanged. Replace the entire white/checkerboard background with ONE PERFECTLY UNIFORM FLAT PURE MAGENTA color, RGB 255,0,255 (#FF00FF). No checkerboard, gradient, glow, shadow, texture, color variation or white gaps behind or between characters. Fill the background around each character and inside gaps between arms/legs with pure #FF00FF. Keep original dark character outlines, no magenta tint on character bodies. This is a chroma-key atlas for a game engine. No text, no grid.

## Forest prompt
Use case: stylized-concept. Asset type: wide 1536x1024 background for a 2D side-scrolling chibi fantasy RPG, original cheerful hand-painted art inspired by classic Korean online platform RPGs. A whimsical sunlit forest with giant leafy trees framing left and right, distant blue mountains, fluffy clouds, small mushroom cottages and a winding woodland path. Bright mint greens, warm honey sunlight, pastel blue sky. Soft detailed background painting, strong readable depth, crisp charming storybook shapes. Empty central gameplay area; no people, no monsters, no words, no logos, no interface, no foreground platforms. The upper 60 percent is open sky and distant canopy; lower part is distant woodland landscape that will sit behind actual in-game grassy terrain. This should be a finished game background, not a mockup.

