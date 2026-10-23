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
    # drawing a bow: elbow out behind, forearm folded forward so the fist sits at the cheek. Only
    # picked when a pose asks for it (pull), never as the nearest match
    ('draw', 'near'): [
        '.5444444VVv',
        '54433334vFvv',
        '43......zzvz',
        '3444455O44',
        '.33333333',
    ],
    # sprinting: the arm pumps forward, elbow down and in, forearm up so the fist comes to the chin.
    # Only picked when the sprint pose asks for it
    ('pump', 'near'): [
        '.455....VVv',
        'O444...vvFv',
        '3344..54zvz',
        '.3445544...',
        '..34444....',
        '...333.....',
    ],
    # ladder arms, seen from behind: fists on the rungs straight above the shoulders, elbows just out.
    # 'chi' grips the rung by the top of the head, 'clo' the one at shoulder height; mirrored (L) below
    ('chi', 'near'): [
        'VVv',
        'vFv',
        'zvz',
        '544',
        '544',
        '544',
        '544',
        '5444',
        'O444',
        '3344',
        '.33.',
    ],
    ('clo', 'near'): [
        'VVv',
        'vFv',
        'zvz',
        '544',
        'O444',
        '3344',
        '.33.',
    ],
}
for _d in ('chi', 'clo'):
    ARMS[(_d + 'L', 'near')] = [r.rjust(max(map(len, ARMS[(_d, 'near')])), '.')[::-1] for r in ARMS[(_d, 'near')]]
ONLY = ('draw', 'chi', 'clo', 'chiL', 'cloL', 'pump')  # picked by name only, never as the nearest match
DIRS = {'pump': -20, 'chi': -70, 'clo': 0, 'chiL': -110, 'cloL': 180, 'draw': -45, 'fwd': 0, 'dfwd': 45, 'down': 90, 'dback': 135, 'back': 180, 'uback': -135, 'up': -90, 'ufwd': -45}
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
    line = Image.new('RGBA', im.size, (0, 0, 0, 0))
    o = line.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3]:
                continue
            if any(0 <= x + dx < im.width and 0 <= y + dy < im.height and px[x + dx, y + dy][3] for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1))):
                o[x, y] = INK
    return im, line, pts['O'], pts['F']


def build():
    """-> (strip image, manifest list). Each entry: dir, reach, x, w, h, shoulder, fist; the outline row
    starts at y = rowH, so the game can tuck the outline under the body and draw the colours on top."""
    cells, lines, meta = [], [], []
    for dark in (False, True):
        for (d, r), rows in ARMS.items():
            im, line, o, f = _image(rows, dark)
            cells.append(im)
            lines.append(line)
            meta.append({'dir': d, 'reach': r, 'back': dark, 'w': im.width, 'h': im.height, 'o': list(o), 'f': list(f),
                         'ang': round(math.degrees(math.atan2(f[1] - o[1], f[0] - o[0]))), 'len': round(math.hypot(f[0] - o[0], f[1] - o[1]), 1)})
    W = sum(c.width for c in cells)
    H = max(c.height for c in cells)
    strip = Image.new('RGBA', (W, H * 2), (0, 0, 0, 0))  # top row: colours, bottom row: ink outline
    x = 0
    for c, ln, m in zip(cells, lines, meta):
        strip.alpha_composite(c, (x, 0))
        strip.alpha_composite(ln, (x, H))
        m['x'] = x
        m['lineY'] = H
        x += c.width
    return strip, meta


if __name__ == '__main__':
    import sys
    strip, meta = build()
    strip.resize((strip.width * 8, strip.height * 8), Image.NEAREST).save(sys.argv[1] if len(sys.argv) > 1 else 'arms-preview.png')
    for m in meta[:16]:
        print(m['dir'], m['reach'], m['ang'], m['len'])
