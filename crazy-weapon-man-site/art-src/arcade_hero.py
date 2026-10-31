"""Crazy Weapon Man, arcade cut: a 32-bit style hero sprite with deep colour ramps.

The teaser art is the reference: wild brown hair swept back, red headband with long tails,
goggles pushed up on the head, a big grin, a bare muscular chest crossed by a bandolier, a gold
buckle over a red sash, dark combat trousers and steel-toed boots. The body is armless: the arms are
separate hand-drawn sprites (arcade_arms.py) that the game picks per pose, see game-src/game/anim.js.

Frames are 26x30 after the 1px outline (the 20px-wide art plus PAD spare columns each side), facing
right, feet on the bottom row (y = 29).
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
    '.......23443........',
    '.....233444443......',
    '.....2344445543.....',
    '.....2344445543.....',
    '.....234444443......',
    '.....23322223.......',
    '......234434........',
    '......234343........',
    '.....SSSSgyGS.......',
    '.....rrrRqqrR.......',
]
SIDE = strap(_SIDE, col=11)
# wound up for a big swing the shoulders turn away and we see his back and the strap across it
_TWIST = [
    '.......23443........',
    '.....23344444432....',
    '....2344344443432...',
    '....2344344443432...',
    '....234434443432....',
    '.....2344344432.....',
    '.....234434432......',
    '......2344432.......',
    '.....SSSSSSSSS......',
    '.....rrrRrrrRr......',
]
TWIST = strap(_TWIST, col=13)
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


# Walk cycle, six frames (MapleStory walks in 4, Metal Slug runs in 12+): contact, down, passing for
# each leg. The near leg is drawn in the light trouser shades with the steel toe cap, the far leg in
# the dark ones, so you can always tell which leg is in front. 'down' frames also sink the upper
# body 1px (see FRAMES), so the head bobs low on the planted step and rises on the pass.
WALK = [
    [  # 0 contact: near leg reaching forward, far leg pushing off behind
        '....PppuuPpppu......',
        '...PpP...Ppuu.......',
        '..PpP.....Ppuu......',
        '..PpP......Ppu......',
        '.KkP........Kkkj....',
        '.KKkk.......Kkkkjn..',
        'KKKK........KKKKKK..',
    ],
    [  # 1 down: weight on the near leg, far heel lifts behind
        '....PppuuPpppu......',
        '...PpP...Ppuu.......',
        '..PpP.....Ppu.......',
        '.KKk......Ppu.......',
        'KKk.......Kkkj......',
        '..........Kkkkjn....',
        '..........KKKKKK....',
    ],
    [  # 2 passing: near leg straight under him, far foot swings through beside the shin
        '....PppuuPpppu......',
        '.....PpPPpuu........',
        '......PpPpu.........',
        '......KkPpu.........',
        '......KKkPpu........',
        '........Kkkkjn......',
        '........KKKKKK......',
    ],
    [  # 3 contact: far leg reaching forward, near leg pushing off behind
        '....PppuuPpppu......',
        '....PpuuPpP.........',
        '...Ppu....PpP.......',
        '..Ppu......PpP......',
        '.Kkkj.......KkP.....',
        '.Kkkkjn.....KKkk....',
        'KKKKKK......KKKKK...',
    ],
    [  # 4 down: weight on the far leg, near heel lifts behind
        '....PppuuPpppu......',
        '....PpuuPpP.........',
        '...Ppu...PpP........',
        '..Kkkj...PpP........',
        '.Kkkkjn..KKkk.......',
        '.........KKkkk......',
        '.........KKKKK......',
    ],
    [  # 5 passing: far leg straight under him, near foot swings through in front
        '....PppuuPpppu......',
        '.....PpPPpuu........',
        '.....PpP.Ppu........',
        '.....PpP.Kkkj.......',
        '.....PpP.Kkkkjn.....',
        '....KKkk............',
        '....KKKKK...........',
    ],
]


def shift(rows, dx):
    if dx > 0:
        return [('.' * dx + r)[:W] for r in rows]
    if dx < 0:
        return [(r[-dx:] + '.' * -dx) for r in rows]
    return list(rows)


def body(legs='stand', lean=0, dip=0, head=None, torso=None, nod=0):
    hd, to = (head or HEAD), (torso or SIDE)
    legs = LEGS[legs] if isinstance(legs, str) else legs
    up = shift(hd + to, lean)
    rows = up + legs
    if nod:  # only the head sinks onto the shoulders (the in-between of a breath)
        rows = ['.' * W] + shift(hd + to[1:], lean) + legs
    if dip:  # upper body sinks into the hips (breathing, the planted step): the hip row tucks under the sash
        rows = ['.' * W] * dip + up + legs[dip:]
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
    'hurt': body('fall', lean=-1, torso=TWIST),  # the face comes from arcade_faces.py ('ouch')
    'lean': body('run1', lean=2),
    'back': body('run2', lean=-1, torso=TWIST),
    'crouch': None,  # filled in below
    'wide': body('wide'),
    'idle1': body(nod=1),
}
for i, legs in enumerate(WALK):
    FRAMES['walk%d' % i] = body(legs, lean=1, dip=1 if i in (1, 4) else 0)
r1 = body('run1', lean=1)
FRAMES['run3'] = r1[:21] + [r[::-1] for r in LEGS['run1']]
FRAMES['run3'] = [r.ljust(W, '.')[:W] for r in FRAMES['run3']]
# crouch: head and torso drop 2px, knees bent wide
FRAMES['crouch'] = ['.' * W] * 2 + [r.ljust(W, '.') for r in HEAD + SIDE + CROUCH_LEGS]

# Sprint (full momentum, game-src/game/hero.js): Sonic / Dead Cells style, four frames. The upper body
# pitches forward (head 2px ahead of the hips, chest 1px), the hair is swept straight back off the
# goggles with loose locks trailing out behind his head, and the headband's two tails stream back
# from the knot, fluttering in a different spot each frame. The weapon rides sheathed on his back
# (anim.js) and the arms pump, so the legs get long strides: reach with the near leg, pass, reach
# with the far leg, pass. Near leg in the light trouser shades with the steel toe cap, far leg in
# the dark ones, as on the walk. Sprint frames use the PAD columns on the left for the hair.
PAD = 2  # every frame gets 2 spare columns each side (the sprint's streaming hair uses them)
SPRINT_HAIR = [
    [  # swept back, locks lifted
        '.........ee...ee........',
        '...eeedddddeedddde......',
        'eeddcccccdcccdcccde.....',
        '.dccebccccccGgLlgLlg....',
        '..ddabbcccccGLLgLLLGd...',
    ],
    [  # swept back, locks dropped and whipping
        '..........e...ee........',
        '.eeeedddddeeddde.e......',
        '..edcccccdcccdcccde.....',
        'edccebccccccGgLlgLlg....',
        '.dddabbcccccGLLgLLLGd...',
    ],
]
# the headband's tails out behind the knot (columns 0-4 of rows 5-8), one shape per frame
SPRINT_TAILS = [
    ['qrRRR', '..qRR', '.....', '.....'],
    ['.rRRR', 'qrqRR', '.....', '.....'],
    ['..RRR', 'qRrRR', 'q....', '.....'],
    ['q.RRR', '.rqRR', '.....', '.....'],
]
SPRINT_LEGS = [
    [  # 0 reach: near leg out in front on its heel, far leg kicked up behind
        '.....PppuuPpppuu....',
        '....PpP....Ppuu.....',
        '...PpP......Ppuu....',
        'KkPP.........Ppu....',
        'KKk...........Ppu...',
        '.............Kkkjn..',
        '.............KKKKKK.',
    ],
    [  # 1 pass: planted on the near leg, the far knee drives through high
        '.....PppuuPpppuu....',
        '......Ppuu.PpPPP....',
        '.......Ppu....PpP...',
        '.......Ppu...KkP....',
        '.......Ppu...KKk....',
        '.......Kkkjn........',
        '.......KKKKKK.......',
    ],
    [  # 2 reach: far leg out in front, near leg kicked up behind
        '.....PppuuPpppuu....',
        '....Ppuu....PpP.....',
        '...Ppu.......PpP....',
        'Kkju..........PpP...',
        'KKK............PpP..',
        '..............KkkK..',
        '.............KKKKKK.',
    ],
    [  # 3 pass: planted on the far leg, the near knee drives through high
        '.....PppuuPpppuu....',
        '......PpP..Ppuuu....',
        '.......PpP....Ppu...',
        '.......PpP...Kkkjn..',
        '.......PpP...KKKK...',
        '.......KkkK.........',
        '.......KKKKK........',
    ],
]


def sprint_head(hair, tails):
    """the head 2px forward on the padded canvas, hair swept back, tails streaming"""
    rows = [list('.' * (PAD + 2) + r + '.' * (PAD - 2)) for r in HEAD]
    for y, r in enumerate(SPRINT_HAIR[hair]):
        rows[y] = list(r)
    for y in (6, 7, 8):  # the tails no longer hang down the back of the head
        rows[y][PAD + 2] = '.'
    rows[7][PAD + 4] = 'R'
    for y, r in enumerate(SPRINT_TAILS[tails]):
        for x, ch in enumerate(r):
            if ch != '.':
                rows[5 + y][x] = ch
    return [''.join(r) for r in rows]


SPRINT = {}  # already padded: build() leaves these alone
pad = lambda rows: ['.' * PAD + r.ljust(W, '.')[:W] + '.' * PAD for r in rows]
for i, lg in enumerate(SPRINT_LEGS):
    SPRINT['sprint%d' % i] = sprint_head(i % 2, i) + pad(shift(SIDE, 1) + lg)
# a jump taken at full speed keeps the streaming hair
SPRINT['sjump'] = sprint_head(0, 0) + pad(shift(SIDE, 1) + shift(LEGS['jump'], 1))
SPRINT['sfall'] = sprint_head(1, 2) + pad(shift(SIDE, 1) + shift(LEGS['fall'], 1))
FRAMES.update(SPRINT)

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
    '.....23344443332....',
    '....2344444444443...',
    '....23444444444Sy...',
    '....2344444443Sy4...',
    '....234434443Sy43...',
    '.....23444444Sy32...',
    '.....2343444Sy432...',
    '......2343Sy4432....',
    '.....SSSSSSSSSS.....',
    '.....rrrRrrrRrrr....',
]
BACK_LEGS = [
    ['....PppuuPpppu......', '....Ppuu..Ppuu......', '....Ppu....Ppu......', '...Kkkj....Ppu......', '...Kkkj....Kkkj.....', '...KKKK....Kkkj.....', '...........KKKK.....'],
    ['....PppuuPpppu......', '....Ppuu..Ppuu......', '....Ppu....Ppu......', '....Ppu...Kkkj......', '...Kkkj...Kkkj......', '...Kkkj...KKKK......', '...KKKK.............'],
]
for i, legs in enumerate(BACK_LEGS):
    FRAMES['climb%d' % i] = [r.ljust(W, '.')[:W] for r in BACK_UP + legs]

# shoulder pixels (back, front) in the 20x28 art, before the outline
SH = {'idle': ((5, 13), (7, 13)), 'idle2': ((5, 14), (7, 14)), 'run1': ((6, 13), (8, 13)), 'run2': ((6, 13), (8, 13)),
      'run3': ((6, 13), (8, 13)), 'lean': ((7, 13), (9, 13)), 'back': ((5, 13), (8, 13)), 'hurt': ((5, 13), (8, 13)),
      'crouch': ((5, 15), (7, 15)), 'idle1': ((5, 13), (7, 13)),
      **{'walk%d' % i: ((6, 14 if i in (1, 4) else 13), (8, 14 if i in (1, 4) else 13)) for i in range(6)}, 'climb0': ((5, 12), (14, 12)), 'climb1': ((5, 12), (14, 12)),
      **{k: ((6, 13), (8, 13)) for k in ('sprint0', 'sprint1', 'sprint2', 'sprint3', 'sjump', 'sfall')}}
# (both sockets sit under the ear, the near one a step forward of the far one)


def frame_image(rows):
    im = Image.new('RGBA', (max(map(len, rows)), H), (0, 0, 0, 0))
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
    ims = [frame_image(FRAMES[k] if k in SPRINT else pad(FRAMES[k])) for k in names]
    fw, fh = ims[0].size
    strip = Image.new('RGBA', (fw * len(ims), fh), (0, 0, 0, 0))
    for i, im in enumerate(ims):
        assert im.size == (fw, fh), names[i]
        strip.alpha_composite(im, (i * fw, 0))
    sh = {k: [[b[0] + 1 + PAD, b[1] + 1], [f[0] + 1 + PAD, f[1] + 1]] for k, (b, f) in ((k, SH.get(k, SH['idle'])) for k in names)}
    return strip, {'w': fw, 'h': fh, 'feet': fh - 1, 'frames': names, 'shoulders': sh, 'arcade': True}


if __name__ == '__main__':
    import sys
    strip, man = build()
    k = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    strip.resize((strip.width * k, strip.height * k), Image.NEAREST).save(sys.argv[1] if len(sys.argv) > 1 else 'hero-preview.png')
    print(man['w'], man['h'], man['frames'])
