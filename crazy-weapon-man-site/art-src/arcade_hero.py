"""Crazy Weapon Man, arcade cut: a 32-bit style hero sprite with deep colour ramps.

The teaser art is the reference: wild brown hair swept back, red headband with long tails,
goggles pushed up on the head, a big grin, a bare muscular chest crossed by a bandolier, a gold
buckle over a red sash, dark combat trousers and steel-toed boots. The body is armless: the arms are
separate hand-drawn sprites (arcade_arms.py) that the game picks per pose, see game-src/game/anim.js.

Frames are 22x30 after the 1px outline, facing right, feet on the bottom row (y = 29).
"""
from PIL import Image

# 32-bit ramps: these are only used by the hero, so they live here instead of the shared palette
HEX = {
    # hair: deep brown -> sun-bleached rim light
    'a': '#22120c', 'b': '#3e2014', 'c': '#64351c', 'd': '#94582a', 'e': '#d09048',
    # headband and sash
    'R': '#6e0e1c', 'r': '#c41e2e', 'q': '#ff5a3e',
    # goggles: brass rim, teal lens, glint
    'G': '#7a4a0c', 'g': '#e8a828', 'L': '#14506e', 'l': '#4cc8ec', 'W': '#ffffff',
    # skin: five-step tan
    '1': '#5a2418', '2': '#94442e', '3': '#c86c48', '4': '#eea070', '5': '#ffd2a0',
    # eyes, mouth
    'x': '#160a10', 'w': '#fff6e8', 'm': '#4a0e14',
    # bandolier leather + brass shells
    'S': '#2e160c', 's': '#6a3a1a', 't': '#a8642c', 'y': '#ffd25a',
    # trousers: blue-black
    'P': '#141428', 'p': '#262848', 'u': '#3e4270',
    # boots: dark leather, steel toe cap
    'K': '#140a08', 'k': '#3a2216', 'j': '#6a4024', 'n': '#a8acc8',
}
RGBA = {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) + (255,) for k, v in HEX.items()}
INK = (0x1a, 0x14, 0x28, 255)
W, H = 20, 28  # art size before the outline

HEAD = [
    '...e...e...e........',
    '..ed..edd.edd.......',
    '.edcddcccdcccde.....',
    'ebccccccGgLlgLlg....',
    'abbcccccGLLgLLLGd...',
    'RRrrrrrrrrrrrrrrq...',
    'Rqabbbb2xxxx4xxxx...',
    'R.Rabb23wwx4wwx43...',
    'q..ab2344444444443..',
    '...ab23mwwwwwwm4....',
    '....b22333mmm332....',
]
_TORSO = [
    '......23344432......',
    '..23344445444443....',
    '.2344555544555443...',
    '.2344555544555443...',
    '.2332223332223332...',
    '..23443443443432....',
    '..23433433433432....',
    '...234434434432.....',
    '...SSSSSgyGSSSSS....',
    '...rrrRrqqrRrrrR....',
]


def strap(rows, top=1, col=14):
    """the bandolier: a leather strap of brass shells from the front shoulder to the back hip"""
    out = [list(r.ljust(W, '.')) for r in rows]
    for i in range(top, top + 7):
        c = col - (i - top)
        out[i][c] = 'S'
        out[i][c + 1] = 'y' if i % 2 else 't'
    return [''.join(r) for r in out]


TORSO = strap(_TORSO)  # square-on chest: kept for the title-card pose
# In fights he turns side-on like every side-scroller hero (MapleStory, Metal Slug, Street Fighter
# draw the torso in profile or three-quarter and layer the near arm over it): only the near pec
# shows, so the near arm can cross the body without a second chest showing through.
_SIDE = [
    '.......2344432......',
    '.....2334444443.....',
    '....23344455554.....',
    '....233444555543....',
    '....23344455543.....',
    '....2333422223......',
    '.....234434432......',
    '.....23434343.......',
    '....SSSSgyGSS.......',
    '....rrrRqqrRr.......',
]
SIDE = strap(_SIDE, col=12)
# wound up for a big swing the shoulders turn away and we see his back and the strap across it
_TWIST = [
    '.......2344432......',
    '....233444444432....',
    '...23443444434432...',
    '...23443444434432...',
    '...2344344443432....',
    '....234434443432....',
    '....23443443432.....',
    '.....234434432......',
    '....SSSSSSSSSS......',
    '....rrrRrrrRrr......',
]
TWIST = strap(_TWIST, col=14)
LEGS = {
    'stand': [
        '....PppuuPpppu......',
        '....Ppuu..Ppuu......',
        '....Ppu....Ppu......',
        '....Ppu....Ppu......',
        '...Kkkj....Kkkj.....',
        '...Kkkkjn..Kkkkjn...',
        '...KKKKKK..KKKKKK...',
    ],
    'run1': [
        '....PppuuPpppu......',
        '...Ppuu....Ppuu.....',
        '..Ppu.......Ppu.....',
        '.Kkj.........Kkkj...',
        'Kkkj.........Kkkkjn.',
        'KKK..........KKKKKK.',
        '....................',
    ],
    'run2': [
        '....PppuuPpppu......',
        '.....Ppupuu.........',
        '.....PpuPpu.........',
        '.....PpuKkkj........',
        '....KkkjKkkkjn......',
        '....KkkkjKKKKK......',
        '....KKKKKK..........',
    ],
    'jump': [
        '....PppuuPpppu......',
        '...Ppuu...Ppuu......',
        '..Kkkj....Kkkkjn....',
        '..KkkkjnK.KKKKKK....',
        '..KKKKKK............',
        '....................',
        '....................',
    ],
    'fall': [
        '....PppuuPpppu......',
        '....Ppuu..Ppuu......',
        '....Ppu....Ppuu.....',
        '...Kkkj.....Kkkj....',
        '...Kkkkjn...Kkkkjn..',
        '...KKKKKK...KKKKKK..',
        '....................',
    ],
    'wide': [
        '...PppuuuPpppuu.....',
        '..Ppuu.....Ppuu.....',
        '.Ppu........Ppu.....',
        '.Ppu.........Ppu....',
        'Kkkj.........Kkkj...',
        'Kkkkjn.......Kkkkjn.',
        'KKKKKK.......KKKKKK.',
    ],
}


def shift(rows, dx):
    if dx > 0:
        return [('.' * dx + r)[:W] for r in rows]
    if dx < 0:
        return [(r[-dx:] + '.' * -dx) for r in rows]
    return list(rows)


def body(legs='stand', lean=0, dip=0, head=None, torso=None):
    up = shift((head or HEAD) + (torso or SIDE), lean)
    rows = up + LEGS[legs]
    if dip:  # upper body sinks into the hips (breathing, crouch)
        rows = ['.' * W] * dip + up[:len(up) - dip] + LEGS[legs]
    assert len(rows) == H, (legs, len(rows))
    return [r.ljust(W, '.')[:W] for r in rows]


HURT_HEAD = HEAD[:6] + ['Rqabbbb24xx44xx4....', 'R.Rabb23xwx4xwx43...', 'q..ab2344444444443..', '...ab234mmmmm34.....'] + HEAD[10:]
CROUCH_LEGS = ['...PppuuuPpppuu.....', '..PpuKkkj..Ppuu.....', '.PpuKkkkjn..PKkkj...', 'KkkjKKKKKK..Kkkkjn..', 'KKKKKK......KKKKKK..']

FRAMES = {
    'idle': body(),
    'idle2': body(dip=1),
    'run1': body('run1', lean=1),
    'run2': body('run2', lean=1),
    'run3': None,  # mirrored legs of run1 (filled in below)
    'jump': body('jump'),
    'fall': body('fall'),
    'hurt': body('fall', lean=-1, head=HURT_HEAD, torso=TWIST),
    'lean': body('run1', lean=2),
    'back': body('run2', lean=-1, torso=TWIST),
    'crouch': None,  # filled in below
    'wide': body('wide'),
}
r1 = body('run1', lean=1)
FRAMES['run3'] = r1[:21] + [r[::-1] for r in LEGS['run1']]
FRAMES['run3'] = [r.ljust(W, '.')[:W] for r in FRAMES['run3']]
# crouch: head and torso drop 2px, knees bent wide
FRAMES['crouch'] = ['.' * W] * 2 + [r.ljust(W, '.') for r in HEAD + SIDE + CROUCH_LEGS]

# Back view for ladders: hair and the band's knot, broad back with the bandolier, both boots.
BACK_UP = [
    '.....e...e...e......',
    '....ed..edd.edd.....',
    '...dcddcccdcccdd....',
    '...bcccdcccdcccc....',
    '...bbccccccccccb....',
    '...rrrrrrrrrrrrr....',
    '...bbcccRqRcccbb....',
    '...abbbbRrRbbbba....',
    '....abbbRrRbbba.....',
    '.....abbRrRbba......',
    '......2rR3rR2.......',
    '....233344433332....',
    '..23344444444443y...',
    '..234444444444Sy3...',
    '..23443444443Sy43...',
    '..2344344443Sy343...',
    '...2344444Sy4432....',
    '...234344Sy43432....',
    '....2343Sy43432.....',
    '....SSSSSSSSSSS.....',
    '....rrrRrrrRrrrR....',
]
BACK_LEGS = [
    ['....PppuuPpppu......', '....Ppuu..Ppuu......', '....Ppu....Ppu......', '...Kkkj....Ppu......', '...Kkkj....Kkkj.....', '...KKKK....Kkkj.....', '...........KKKK.....'],
    ['....PppuuPpppu......', '....Ppuu..Ppuu......', '....Ppu....Ppu......', '....Ppu...Kkkj......', '...Kkkj...Kkkj......', '...Kkkj...KKKK......', '...KKKK.............'],
]
for i, legs in enumerate(BACK_LEGS):
    FRAMES['climb%d' % i] = [r.ljust(W, '.')[:W] for r in BACK_UP + legs]

# shoulder pixels (back, front) in the 20x28 art, before the outline
SH = {'idle': ((6, 12), (13, 12)), 'idle2': ((6, 13), (13, 13)), 'run1': ((7, 12), (14, 12)), 'run2': ((7, 12), (14, 12)),
      'run3': ((7, 12), (14, 12)), 'lean': ((8, 12), (15, 12)), 'back': ((3, 12), (13, 12)), 'hurt': ((3, 12), (13, 12)),
      'crouch': ((6, 14), (13, 14)), 'climb0': ((3, 12), (15, 12)), 'climb1': ((3, 12), (15, 12))}
# (the near shoulder sits on the front of the turned chest and the far one behind it, so the far
# arm passes behind the body and the near arm is never outlined across the chest)


def frame_image(rows):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in RGBA:
                px[x, y] = RGBA[ch]
    return outline(im)


def outline(im):
    """1px ink outline (like pixel.outlined), but the outline takes a dark tint of the colour
    it wraps on the lit (upper) side, the 32-bit 'selective outline' look."""
    w, h = im.size
    out = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0))
    src, o = im.load(), out.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3]:
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    o[x + 1 + dx, y + 1 + dy] = INK
    for y in range(h):
        for x in range(w):
            if src[x, y][3]:
                o[x + 1, y + 1] = src[x, y]
    return out


def build():
    """-> (strip image, manifest dict) in the format build_next.py writes."""
    names = list(FRAMES)
    ims = [frame_image(FRAMES[k]) for k in names]
    fw, fh = ims[0].size
    strip = Image.new('RGBA', (fw * len(ims), fh), (0, 0, 0, 0))
    for i, im in enumerate(ims):
        assert im.size == (fw, fh), names[i]
        strip.alpha_composite(im, (i * fw, 0))
    sh = {k: [[b[0] + 1, b[1] + 1], [f[0] + 1, f[1] + 1]] for k, (b, f) in ((k, SH.get(k, SH['idle'])) for k in names)}
    return strip, {'w': fw, 'h': fh, 'feet': fh - 1, 'frames': names, 'shoulders': sh, 'arcade': True}


if __name__ == '__main__':
    import sys
    strip, man = build()
    k = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    strip.resize((strip.width * k, strip.height * k), Image.NEAREST).save(sys.argv[1] if len(sys.argv) > 1 else 'hero-preview.png')
    print(man['w'], man['h'], man['frames'])
