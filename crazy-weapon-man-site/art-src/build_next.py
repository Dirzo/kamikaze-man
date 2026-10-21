"""Exports art that only the new game uses to public/assets/hero/.

The new game reads everything else (enemies, bosses, weapons, zones, slabs, UI frames, font
glyphs, palette) from the shared /assets/px/ export (build_assets.py).

  hero.png  the arcade-cut hero (arcade_hero.py): 22x30 frames facing right, feet on y = 29,
            including the two back-view ladder frames climb0/climb1
  arms.png  hand-drawn arms (arcade_arms.py): one strip, front arms then the darker far arms
  next.json frame list, feet row, shoulder points per frame and the arm table

The original 17x25 hero maps are kept in pixel.py (HERO) for the legacy build.
"""
import json
import os

from arcade_hero import build
from arcade_arms import build as build_arms

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'hero')


def main():
    os.makedirs(OUT, exist_ok=True)
    strip, hero = build()
    strip.save(os.path.join(OUT, 'hero.png'))
    arms, hero['arms'] = build_arms()
    arms.save(os.path.join(OUT, 'arms.png'))
    with open(os.path.join(OUT, 'next.json'), 'w') as f:
        json.dump({'hero': hero}, f, indent=1)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
