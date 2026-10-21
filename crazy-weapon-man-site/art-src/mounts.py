"""The War Goose mount and its armoured egg, in the same cute shaded style as cute_enemies.py.

  python3 art-src/mounts.py   writes public/assets/px/mount-<name>.png and the manifest's
                              `mounts` entry. build_assets.py calls build() too.

War Goose frames (facing right): walk1, walk2, flap (wings up, for jumps and ladders), hit.
Egg frames: whole, cracked, about to hatch.
"""
import json
import os
from cute_enemies import Sprite, mix, WHITE, strip


def war_goose(s, f):
    b = f == 1
    up = f == 2
    s.oval(3, 12 + b, 24, 25, '#f6f4ee')                          # body
    s.box(9, 13 + b, 20, 17 + b, '#c4363e', r=1)                  # saddle blanket
    s.box(10, 12 + b, 19, 13 + b, '#ffc15a', shade=False)          # gold trim
    s.box(12, 10 + b, 17, 13 + b, '#8a4f22', r=1)                 # saddle
    s.box(4, 17 + b, 22, 19 + b, '#9aa3b8')                       # armour band
    if up:
        s.poly([(6, 14), (1, 4), (12, 12)], '#e2e0d8')              # wing up
    else:
        s.oval(5, 15 + b, 13, 21 + b, '#e2e0d8')                  # wing folded
    s.oval(19, 3 + b, 28, 14 + b, '#f6f4ee')                      # head
    s.box(19, 9 + b, 23, 15 + b, '#f6f4ee', shade=False)          # neck
    s.poly([(27, 7 + b), (30, 9 + b), (27, 11 + b)], '#ff9a2e')     # beak
    s.oval(19, 1 + b, 27, 6 + b, '#9aa3b8')                       # war helmet
    s.box(22, 0 + b, 23, 2 + b, '#c4363e', shade=False)            # plume
    s.poly([(3, 15 + b), (0, 12 + b), (5, 14 + b)], '#e2e0d8')       # tail
    s.box(10, 24, 11, 26, '#ff9a2e', shade=False)
    s.box(16, 24 - b, 17, 26 - b, '#ff9a2e', shade=False)
    s.outline()
    s.eyes(23, 6 + b, 2, f == 3, big=False)


def egg(s, f):
    s.oval(1, 2, 12, 15, '#f8e08e')
    s.box(1, 7, 12, 9, '#9aa3b8', shade=False)                    # armour band
    s.dot(4, 8, '#ffc15a'); s.dot(9, 8, '#ffc15a')                 # rivets
    s.oval(4, 3, 6, 5, '#fff6d0', shade=False)                    # shine
    s.outline()
    if f >= 1:
        for x, y in ((6, 2), (7, 3), (6, 4), (7, 5), (8, 6)):
            s.dot(x, y, '#5d2f14')
    if f >= 2:
        for x, y in ((4, 10), (5, 11), (4, 12), (8, 11), (9, 12), (10, 11)):
            s.dot(x, y, '#5d2f14')


DESIGNS = {'wargoose': (31, 27, war_goose, 4), 'egg': (14, 17, egg, 3)}


def frames(name):
    w, h, draw, n = DESIGNS[name]
    out = []
    for f in range(n):
        s = Sprite(w, h)
        draw(s, f)
        if name == 'wargoose' and f == 3:  # hit: a bright flash
            px = s.im.load()
            for y in range(h):
                for x in range(w):
                    r, g, b_, a = px[x, y]
                    if a:
                        px[x, y] = mix((r, g, b_), WHITE, 0.55) + (a,)
        out.append(s.im)
    return out


def build(root, man):
    man['mounts'] = {}
    for name in DESIGNS:
        ims = frames(name)
        strip(ims).save(os.path.join(root, f'mount-{name}.png'))
        man['mounts'][name] = {'w': ims[0].width, 'h': ims[0].height, 'n': len(ims)}


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'px')
    man_path = os.path.join(root, 'manifest.json')
    man = json.load(open(man_path))
    build(root, man)
    with open(man_path, 'w') as fh:
        json.dump(man, fh, separators=(',', ':'))
    print('wrote', len(DESIGNS), 'mount sheets')
