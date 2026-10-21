"""Hand-drawn arms for the arcade hero, in the chunky 32-bit brawler style: a round shoulder cap,
a thick upper arm, a slightly narrower forearm and a big gloved fist, all with a full ink outline.

The game no longer builds arms from lines. Each pose asks for a hand position, and the game picks
the drawn arm whose direction and reach are closest, puts its shoulder on the body's shoulder point
and locks the weapon to the drawn fist (see game-src/game/anim.js, pickArm).

Every arm faces right. 'O' marks the shoulder anchor (drawn as skin) and 'F' the middle of the fist
(drawn as glove). Directions are screen angles from the shoulder to the fist: 0 forward, 90 down,
180 back, -90 up. 'near' arms bend at the elbow, 'far' arms are close to straight.
"""
import math

from PIL import Image

from arcade_hero import HEX, INK

ARM_HEX = {**HEX, 'V': '#6a6a88', 'v': '#34344a', 'z': '#1c1c28'}
ARM_HEX['O'] = ARM_HEX['4']
ARM_HEX['F'] = ARM_HEX['v']

ARMS = {
    # forward: straight punch / thrust
    ('fwd', 'far'): [
        '.455.',
        'O444455544445VVv',
        '3344444433344vFvv',
        '.22233332222zzvz',
    ],
    # forward, bent: upper arm hangs, forearm level (the two-handed carry)
    ('fwd', 'near'): [
        '.455',
        'O444',
        '3444',
        '3344',
        '.3445544VVv',
        '.334444vFvv',
        '..22333zvz',
    ],
    ('dfwd', 'far'): [
        '.455',
        'O4445',
        '33444',
        '.33445',
        '..33444',
        '...33445',
        '....334VVv',
        '.....3vFvv',
        '......zzvz',
    ],
    ('dfwd', 'near'): [
        '.455',
        'O444',
        '3444',
        '33445',
        '.33444',
        '..334VVv',
        '...3vFvv',
        '....zzvz',
    ],
    ('down', 'far'): [
        '.455',
        'O444',
        '3444',
        '3344',
        '3344',
        '.344',
        '.344',
        '.344',
        '.VVv',
        '.vFv',
        '.zvz',
    ],
    ('down', 'near'): [
        '.455',
        'O444',
        '3444',
        '3344',
        '.3445',
        '.334VV',
        '..vvFv',
        '..zzvz',
    ],
    ('dback', 'far'): [
        '....455',
        '....O444',
        '...3344',
        '..3344',
        '.3344',
        '3344',
        'VVv',
        'vFv',
        'zvz',
    ],
    ('dback', 'near'): [
        '..455',
        '..O444',
        '..3444',
        '..3344',
        '.3344',
        'VVv4',
        'vFv',
        'zvz',
    ],
    ('back', 'far'): [
        '..........455',
        'VVv5444455O444',
        'vFv44444333444',
        'zvz3322222333',
    ],
    ('back', 'near'): [
        '....455',
        '....O444',
        '....3444',
        '....3344',
        'VVv54444',
        'vFv44433',
        'zvz3322',
    ],
    ('uback', 'far'): [
        'VVv',
        'vFv5',
        'zv544',
        '..5444',
        '...5444',
        '....5444',
        '.....5444',
        '......5444',
        '.......O444',
        '.......3344',
    ],
    ('uback', 'near'): [
        '.VVv',
        '.vFv',
        '.zv54',
        '...544',
        '...5444',
        '....O444',
        '....3344',
    ],
    ('up', 'far'): [
        'VVv',
        'vFv',
        'z54z',
        '.544',
        '.544',
        '.544',
        '.544',
        '.544',
        '.444',
        '.444',
        '.O44',
        '3344',
    ],
    ('up', 'near'): [
        '.VVv',
        '.vFv',
        '.z54',
        '.544',
        '.O44',
        '3344',
    ],
    ('ufwd', 'far'): [
        '.......VVv',
        '.......vFv',
        '......54vz',
        '.....5445',
        '....5445',
        '...5445',
        '..5445',
        '.O445',
        '33344',
    ],
    ('ufwd', 'near'): [
        '....VVv',
        '....vFv',
        '...54vz',
        '..5445',
        '.O445',
        '33344',
    ],
}
DIRS = {'fwd': 0, 'dfwd': 45, 'down': 90, 'dback': 135, 'back': 180, 'uback': -135, 'up': -90, 'ufwd': -45}
# the far arm is the same drawing one shade darker, so it sits back in depth
DARKER = {'5': '4', '4': '3', '3': '2', '2': '1', 'O': '3', 'V': 'v', 'v': 'z', 'F': 'z', 'z': 'z'}


def _image(rows, dark=False):
    w = max(len(r) for r in rows)
    im = Image.new('RGBA', (w + 2, len(rows) + 2), (0, 0, 0, 0))
    px = im.load()
    pts = {}
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            if ch in 'OF':
                pts[ch] = (x + 1, y + 1)
            c = DARKER.get(ch, ch) if dark else ch
            hx = ARM_HEX[c]
            px[x + 1, y + 1] = tuple(int(hx[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    out = im.copy()
    o = out.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3]:
                continue
            if any(0 <= x + dx < im.width and 0 <= y + dy < im.height and px[x + dx, y + dy][3] for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1))):
                o[x, y] = INK
    return out, pts['O'], pts['F']


def build():
    """-> (strip image, manifest list). Each entry: name, dir (deg), reach (px), x, w, h, shoulder, fist."""
    cells, meta = [], []
    for dark in (False, True):
        for (d, r), rows in ARMS.items():
            im, o, f = _image(rows, dark)
            cells.append(im)
            meta.append({'dir': d, 'reach': r, 'back': dark, 'w': im.width, 'h': im.height, 'o': list(o), 'f': list(f),
                         'ang': round(math.degrees(math.atan2(f[1] - o[1], f[0] - o[0]))), 'len': round(math.hypot(f[0] - o[0], f[1] - o[1]), 1)})
    W = sum(c.width for c in cells)
    H = max(c.height for c in cells)
    strip = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    x = 0
    for c, m in zip(cells, meta):
        strip.alpha_composite(c, (x, 0))
        m['x'] = x
        x += c.width
    return strip, meta


if __name__ == '__main__':
    import sys
    strip, meta = build()
    strip.resize((strip.width * 8, strip.height * 8), Image.NEAREST).save(sys.argv[1] if len(sys.argv) > 1 else 'arms-preview.png')
    for m in meta[:16]:
        print(m['dir'], m['reach'], m['ang'], m['len'])
