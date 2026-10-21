"""Exports art that only the new game uses to public/assets/hero/.

The new game reads everything else (enemies, bosses, weapons, zones, slabs, UI frames, font
glyphs, palette) from the shared /assets/px/ export (build_assets.py).

  hero.png  the arcade-cut hero (arcade_hero.py): 22x30 frames facing right, feet on y = 29,
            including the two back-view ladder frames climb0/climb1
  next.json frame list, feet row and shoulder points per frame (the game draws the arms)

The original 17x25 hero maps are kept in pixel.py (HERO) for the legacy build.
"""
import json
import os

from arcade_hero import build

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'hero')


def main():
    os.makedirs(OUT, exist_ok=True)
    strip, hero = build()
    strip.save(os.path.join(OUT, 'hero.png'))
    with open(os.path.join(OUT, 'next.json'), 'w') as f:
        json.dump({'hero': hero}, f, indent=1)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
