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
from cute_enemies import DESIGNS as CUTE, frames as cute_frames, strip as cute_strip
import weapon_zones
import hd_bosses
import mounts
from weapons import WEAPONS, VARIANTS, weapon_image
from arcade_weapons import ARCADE, ARCADE_VARIANTS, ARCADE_AWAKENED
from awakening import AWAKENED


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

    # residents: cute shaded chibi sprites (cute_enemies.py); the old palette rows in enemies.py stay
    # for reference only
    for etype in CUTE:
        frames = cute_frames(etype)
        cute_strip(frames).save(os.path.join(OUT, f'enemy-{etype}.png'))
        man['enemies'][etype] = {'w': frames[0].width, 'h': frames[0].height, 'frames': ['walk1', 'walk2', 'hit']}

    # beastkin families: arcade-cut residents with named frames (beastkin.py)
    import beastkin
    beastkin.build(OUT, man)

    # bosses: full-size 32-bit style art (hd_bosses.py): the story bosses and the swarm giants
    hd_bosses.build(OUT, man)
    # the War Goose mount and its egg (mounts.py)
    mounts.build(OUT, man)

    # held weapons: outlined, magenta markers recoloured in game; grip offset +1 for the outline.
    # The arcade-cut sprites (arcade_weapons.py) replace the old 16-bit ones; loot drops keep theirs.
    man['weapons'] = {}
    for wtype, ((gx, gy), rows) in {**WEAPONS, **VARIANTS, **ARCADE, **ARCADE_VARIANTS, **AWAKENED, **ARCADE_AWAKENED}.items():
        im = outlined(weapon_image(rows))
        im.save(os.path.join(OUT, f'weapon-{wtype}.png'))
        man['weapons'][wtype] = {'w': im.width, 'h': im.height, 'gx': gx + 1, 'gy': gy + 1}

    # UI frames for CSS border-image (art pixels doubled so they stay crisp at 2x text size)
    os.makedirs(os.path.join(OUT, 'ui'), exist_ok=True)
    def ui_frame(name, rings, fill, hi=None):
        n = len(rings) * 2 + 8  # roomy middle so border-image slices never overlap
        im = Image.new('RGBA', (n, n), RGB[fill] + (255,))
        px = im.load()
        for i, col in enumerate(rings):
            for k in range(i, n - i):
                for (x, y) in ((k, i), (k, n - 1 - i), (i, k), (n - 1 - i, k)):
                    px[x, y] = RGB[col] + (255,)
        if hi:
            for k in range(len(rings), n - len(rings)):
                px[k, len(rings)] = RGB[hi] + (255,)
        im.resize((n * 2, n * 2), Image.NEAREST).save(os.path.join(OUT, 'ui', name + '.png'))
        man.setdefault('ui', {})[name] = {'slice': (len(rings) + (1 if hi else 0)) * 2, 'size': n * 2}
    ui_frame('panel', ['ink', 'woodD', 'wood', 'gold'], 'night')
    ui_frame('card', ['ink', 'slate', 'stone'], 'night', hi='slate')
    ui_frame('btn', ['ink', 'gold'], 'slate', hi='stone')
    ui_frame('btn-hot', ['ink', 'cream'], 'red', hi='coral')
    ui_frame('btn-down', ['ink', 'gold'], 'night')
    ui_frame('input', ['ink', 'stone'], 'night')

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
    # weapon-themed zones (weapon_zones.py); the ranger forest dresses up the mushroom backdrop
    weapon_zones.build(OUT, man, Image.open(os.path.join(OUT, 'bg-mushroom-hollow.png')).convert('RGBA'))

    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(man, f, separators=(',', ':'))  # compact, like the committed manifest
    print('wrote', os.path.abspath(OUT))


if __name__ == '__main__':
    main()
