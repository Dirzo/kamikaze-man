"""Exports the in-game pixel art to crazy-weapon-man-site/public/assets/px/.

  python3 crazy-weapon-man-site/art-src/build_assets.py

Files:
  hero.png             frames (17x25 each, facing right): idle, run1, run2, jump
  enemy-<type>.png     frames facing right: walk1, walk2, hit (white flash)
  slab.png             floating-platform 3-slice: left cap | middle | right cap
  bg-<zone>.png        480x270 zone backdrop including the ground line
  manifest.json        frame sizes and counts, read by game-src/systems/30-pixel-renderer.js
"""
import json
import os
from PIL import Image
from pixel import sprite, outlined, flip, RGB, HERO, HERO_KEY, CHICKEN, CHICKEN_KEY, GREMLIN, GREMLIN_KEY
import scene
from pixel import PAL
from font import G as GLYPHS

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'px')


def legs(base, rows):
    return base[:len(base) - len(rows)] + rows


HERO_FRAMES = {
    'idle': HERO,
    'run1': legs(HERO, ['....pppqpppq...', '...ppq....ppq..', '..ppq......ppq.', '.BbbB.....BbbB.']),
    'run2': legs(HERO, ['....pppqpppq...', '.....ppqppq....', '.....ppqpq.....', '....BbbBbbB....']),
    'jump': legs(HERO, ['....pppqpppq...', '...ppq...ppq...', '..BbbB..BbbB...', '...............']),
}

ENEMIES = {
    # game enemy type -> (fill map facing LEFT, key, alternate leg rows for walk2)
    'bombchicken': (CHICKEN, CHICKEN_KEY, ['......y..y.....', '.....yy.yy.....']),
    'crawler': (GREMLIN, GREMLIN_KEY, ['...hh..hh.....', '..hhh..hhh....']),
}


def strip(frames):
    w, h = frames[0].width, frames[0].height
    im = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        im.alpha_composite(f, (i * w, 0))
    return im


def white(im):
    """Hit-flash variant: every opaque pixel becomes paper, outline kept as ink."""
    out = im.copy()
    px = out.load()
    ink = RGB['ink'] + (255,)
    for y in range(out.height):
        for x in range(out.width):
            if px[x, y][3] and px[x, y] != ink:
                px[x, y] = RGB['paper'] + (255,)
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    man = {'scale': 480 / 1280, 'palette': PAL, 'glyphs': GLYPHS, 'hero': {}, 'enemies': {}, 'backgrounds': {}}

    hero = [outlined(sprite(HERO_FRAMES[k], HERO_KEY)) for k in HERO_FRAMES]
    strip(hero).save(os.path.join(OUT, 'hero.png'))
    man['hero'] = {'w': hero[0].width, 'h': hero[0].height, 'frames': list(HERO_FRAMES)}

    for etype, (rows, key, alt) in ENEMIES.items():
        f1 = flip(outlined(sprite(rows, key)))
        f2 = flip(outlined(sprite(legs(rows, alt), key)))
        frames = [f1, f2, white(f1)]
        strip(frames).save(os.path.join(OUT, f'enemy-{etype}.png'))
        man['enemies'][etype] = {'w': f1.width, 'h': f1.height, 'frames': ['walk1', 'walk2', 'hit']}

    slab = scene.platform(25)  # 27px wide with outline: 9 | 9 | 9
    slab.save(os.path.join(OUT, 'slab.png'))
    man['slab'] = {'w': slab.width, 'h': slab.height, 'cap': 9}

    bg = scene.background()
    scene.ground(bg)
    bg.save(os.path.join(OUT, 'bg-graveyard.png'))
    man['backgrounds']['graveyard'] = 'bg-graveyard.png'

    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(man, f, indent=1)
        f.write('\n')
    print('wrote', os.path.abspath(OUT))


if __name__ == '__main__':
    main()
