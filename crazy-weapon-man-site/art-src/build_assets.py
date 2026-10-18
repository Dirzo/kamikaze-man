"""Exports the in-game pixel art to crazy-weapon-man-site/public/assets/px/.

  python3 crazy-weapon-man-site/art-src/build_assets.py

Files:
  hero.png             frames (17x25 each, facing right): idle, run1, run2, jump
  enemy-<type>.png     frames facing right: walk1, walk2, hit (white flash)
  slab-<zone>.png      floating-platform 3-slice per zone: left cap | middle | right cap
  bg-<zone>.png        480x270 zone backdrop including the ground line (zones.py)
  manifest.json        frame sizes and counts, read by game-src/systems/30-pixel-renderer.js
"""
import json
import os
from PIL import Image
from pixel import sprite, outlined, flip, RGB, HERO, HERO_KEY
import scene
from zones import ZONES
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

from enemies import ENEMIES, ENEMY_KEY
from bosses import BOSSES


def frame2(rows, alt):
    if 'bob' in alt:
        return ['.' * len(rows[0])] * alt['bob'] + rows
    out = list(rows)
    for i, row in alt.get('rows', {}).items():
        out[i] = row
    return out


def _pad_top(im):
    out = Image.new('RGBA', (im.width, im.height + 1), (0, 0, 0, 0))
    out.alpha_composite(im, (0, 0))
    return out


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

    for etype, (rows, alt) in ENEMIES.items():
        f1 = flip(outlined(sprite(rows + (['.' * len(rows[0])] if 'bob' in alt else []), ENEMY_KEY)))
        f2 = flip(outlined(sprite(frame2(rows, alt), ENEMY_KEY)))
        frames = [f1, f2, white(f1)]
        strip(frames).save(os.path.join(OUT, f'enemy-{etype}.png'))
        man['enemies'][etype] = {'w': f1.width, 'h': f1.height, 'frames': ['walk1', 'walk2', 'hit']}

    # bosses: idle1, idle2 (1px breathe), white hit frame
    man['bosses'] = {}
    for btype, fn in BOSSES.items():
        base = fn()
        f1 = flip(outlined(base))
        shifted = Image.new('RGBA', (base.width, base.height + 1), (0, 0, 0, 0))
        shifted.alpha_composite(base, (0, 1))
        f1 = flip(outlined(Image.alpha_composite(Image.new('RGBA', shifted.size, (0, 0, 0, 0)),
                                                 _pad_top(base))))
        f2 = flip(outlined(shifted))
        strip([f1, f2, white(f1)]).save(os.path.join(OUT, f'boss-{btype}.png'))
        man['bosses'][btype] = {'w': f1.width, 'h': f1.height, 'frames': ['idle1', 'idle2', 'hit']}

    # zone backdrops + per-zone platform slabs (3-slice: 9 | 9 | 9)
    man['zones'] = []
    man['slabs'] = {}
    for key, bg_fn, slab_fn in ZONES:
        bg_fn().save(os.path.join(OUT, f'bg-{key}.png'))
        man['backgrounds'][key] = f'bg-{key}.png'
        sl = slab_fn(25)
        sl.save(os.path.join(OUT, f'slab-{key}.png'))
        man['slabs'][key] = {'file': f'slab-{key}.png', 'w': sl.width, 'h': sl.height, 'cap': 9}
        man['zones'].append(key)

    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(man, f, indent=1)
        f.write('\n')
    print('wrote', os.path.abspath(OUT))


if __name__ == '__main__':
    main()
