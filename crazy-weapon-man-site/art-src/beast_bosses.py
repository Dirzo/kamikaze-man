"""The bosses, remade as bigger, spicier beasts: every family head and every level's sibling is one
of its zone's beastkin (beastkin.py and its family modules), drawn again at boss size. The design
is re-rasterised on a bigger canvas (ZCanvas), never pixel-scaled, so the outlines stay one pixel
and the shading stays smooth. A head wears a crown; a sibling wears its own hat (the hat and hat
colour from hd_bosses.SIBLINGS) in its beast's own colours.

hd_bosses.build calls build_heads / build_siblings / build_giants.
"""
import colorsys
import os

import beastkin as B
from beastkin import R, ramp, P, INK, WHITE, mix

# family head -> the beast it is a bigger version of
HEAD_BEAST = {
    'bossgoose': 'gander', 'bossacorn': 'yeti', 'bossjr': 'grandsnapper', 'bosskingpin': 'fatcat', 'bossshogun': 'tosa',
    'bossman': 'yak', 'bosssr': 'grizzly', 'bossgrandma': 'hornedowl', 'bossceo': 'komodo', 'bossweapon': 'elder',
}
# each level's sibling -> its beast (game-src/data/families.js names them to match)
SIB_BEAST = {
    'sib11': 'gosling', 'sib12': 'gsquire', 'sib13': 'gtoss', 'sib14': 'whirl', 'sib1s': 'gosling', 'sib1f': 'berserker',
    'sib21': 'fuzzlet', 'sib22': 'moss', 'sib2s': 'puffshot', 'sib23': 'burrball', 'sib24': 'quillback', 'sib25': 'twintuft', 'sib2f': 'werewolf',
    'sib31': 'tadpole', 'sib32': 'toadmonk', 'sib33': 'lilylurker', 'sib34': 'spinturtle', 'sib3s': 'bubblenewt', 'sib35': 'shellback', 'sib3f': 'bullfrog',
    'sib41': 'alleykit', 'sib42': 'pickpocket', 'sib43': 'prowler', 'sib4s': 'shadowtom', 'sib44': 'juggler', 'sib4f': 'bandit',
    'sib51': 'shibapup', 'sib52': 'husky', 'sib53': 'corgi', 'sib54': 'petalfox', 'sib5s': 'windfox', 'sib55': 'twininu', 'sib5f': 'houndguard',
    'sib61': 'macaque', 'sib62': 'gibbon', 'sib63': 'goatmonk', 'sib64': 'snowsage', 'sib6s': 'langur', 'sib65': 'baboon', 'sib6f': 'cloudape',
    'sib71': 'cub', 'sib72': 'anviltoss', 'sib73': 'boarbellows', 'sib7s': 'badger', 'sib74': 'moltenboar', 'sib75': 'wolverine', 'sib7f': 'polarbear',
    'sib81': 'dustbunny', 'sib82': 'teahog', 'sib8s': 'hedgehog', 'sib83': 'polyhare', 'sib84': 'mirrorowl', 'sib85': 'hatrabbit', 'sib8f': 'broombat',
    'sib91': 'gecko', 'sib92': 'chameleon', 'sib93': 'wallgecko', 'sib9s': 'anole', 'sib94': 'frilled', 'sib95': 'basilisk', 'sib9f': 'skink',
    'sib101': 'whelp', 'sib102': 'ember', 'sib103': 'magpie', 'sib104': 'armadillo', 'sib10s': 'gemwyrm', 'sib105': 'wyrmling', 'sib10f': 'platedpango',
}
# the old swarm giants (data/enemies.js) are their heads, walking
GIANTS = {'mothergoose': 'bossgoose', 'acornking': 'bossacorn', 'kingpin': 'bosskingpin', 'shogun': 'bossshogun'}
# how tall each kind of boss stands, in pixels
HEIGHT = {'head': 92, 'giant': 66, 'level': 54, 'secret': 60, 'fort': 70}


class ZCanvas(B.Canvas):
    """A canvas k times the design's size. The design draws in its own coordinates (c.w and c.h read
    as the design's size); every shape is rasterised again at the bigger size, and a single-pixel
    dot becomes a k x k block."""

    def __init__(self, w, h, k):
        self.k, self.vw, self.vh, self.raw = k, w, h, 0
        super().__init__(round(w * k), round(h * k))

    w = property(lambda s: s._W if s.raw else s.vw, lambda s, v: setattr(s, '_W', v))
    h = property(lambda s: s._H if s.raw else s.vh, lambda s, v: setattr(s, '_H', v))

    def _raw(self, fn, *a, **kw):
        self.raw += 1
        try:
            return fn(*a, **kw)
        finally:
            self.raw -= 1

    def put(self, x, y, c, part=None, thin=False, flat=False):
        if self.raw:
            return super().put(x, y, c, part, thin, flat)
        # the design's pixel round(x) covers [round(x), round(x) + 1): the block covers the same span zoomed,
        # so dots (eyes, noses) land where they sat on the small sprite, not half a pixel up and left
        k, x, y = self.k, round(x), round(y)
        part = part if part is not None else self._new(False)
        for yy in range(round(y * k), max(round(y * k) + 1, round((y + 1) * k))):
            for xx in range(round(x * k), max(round(x * k) + 1, round((x + 1) * k))):
                self._raw(super().put, xx, yy, c, part, thin, flat)

    def get(self, x, y):
        return self._raw(super().get, int(round(x * self.k)), int(round(y * self.k)))

    def ball(self, cx, cy, rx, ry, rp, *a, clip=None, **kw):
        k = self.k
        zclip = (lambda x, y: clip(x / k, y / k)) if clip else None
        return self._raw(super().ball, cx * k, cy * k, rx * k, ry * k, rp, *a, clip=zclip, **kw)

    def poly(self, pts, rp, *a, **kw):
        return self._raw(super().poly, [(x * self.k, y * self.k) for x, y in pts], rp, *a, **kw)

    def capsule(self, x0, y0, x1, y1, r0, r1, rp, *a, **kw):
        k = self.k
        return self._raw(super().capsule, x0 * k, y0 * k, x1 * k, y1 * k, r0 * k, r1 * k, rp, *a, **kw)

    def line(self, pts, c, thin=False, part=None, flat=False, w=1):
        k, n = self.k, max(1, round(self.k * w))
        part = part if part is not None else self._new(False)
        for o in range(n):
            m = (k - 1) / 2  # a small pixel's centre, zoomed
            q = [(x * k + m + o - (n - 1) / 2, y * k + m) for x, y in pts] if abs(pts[-1][1] - pts[0][1]) > abs(pts[-1][0] - pts[0][0]) else \
                [(x * k + m, y * k + m + o - (n - 1) / 2) for x, y in pts]
            self._raw(super().line, q, c, thin, part, flat, 1)
        return part

    def image(self, flash=0.0):
        return self._raw(super().image, flash)


# ---------------------------------------------------------------- colours
def ramp_of(hexcol):
    c = B.hexc(hexcol)
    return [mix(c, INK, 0.62), mix(c, INK, 0.42), mix(c, INK, 0.2), c, mix(c, WHITE, 0.3), mix(c, WHITE, 0.6)]


def turned(rp, deg):
    """a copy of ramp rp turned deg round the colour wheel (registered once)"""
    name = f'{rp}~{deg}'
    if name not in R:
        out = []
        for col in R[rp]:
            h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in col))
            out.append(tuple(round(v * 255) for v in colorsys.hls_to_rgb((h + deg / 360) % 1, l, s)))
        R[name] = out
    return name


def main_ramp(c):
    """the ramp that covers most of the sprite: its fur, feathers or scales"""
    count = {}
    for row in c.col:
        for v in row:
            if isinstance(v, tuple) and v and isinstance(v[0], str):
                count[v[0]] = count.get(v[0], 0) + 1
    return max(count, key=count.get) if count else None


def recolour(c, rp, to):
    for row in c.col:
        for x, v in enumerate(row):
            if isinstance(v, tuple) and v and v[0] == rp:
                row[x] = (to, v[1])


# ---------------------------------------------------------------- hats
def head_top(c):
    """(x, y, width) of the top of the head, in real pixels. The body records its head ball (c.head, in the
    design's coordinates); a hat the beast already wears (a top hat, a hood) is climbed so the crown sits on it.
    Beasts that are all head fall back to the highest row of the front half."""
    W, H = c._W, c._H
    if getattr(c, 'head', None):
        hx, hy, rx, ry = (v * c.k for v in c.head)
        x, y, w = hx, hy - ry, rx * 1.5
        band = range(max(0, int(x - w / 2)), min(W, int(x + w / 2) + 1))
        y = int(round(y))
        while y > 0 and sum(c.col[y - 1][bx] is not None for bx in band) >= len(band) * 0.6:
            y -= 1
        return x, y + max(1, ry * 0.18), w
    for y in range(H):
        xs = [x for x in range(int(W * 0.3), int(W * 0.95)) if c.col[y][x] is not None]
        if len(xs) >= 2:
            row = [x for x in range(int(W * 0.3), int(W * 0.95)) if c.col[min(H - 1, y + 3)][x] is not None]
            return (min(row) + max(row)) / 2, y, max(6, max(row) - min(row) + 1)
    return W / 2, 0, 8


def wear_hat(c, kind, col):
    rp = 'hat:' + col
    R.setdefault(rp, ramp_of(col))
    R.setdefault('hatgold', ramp_of('#f0c040'))
    R.setdefault('hat:#f4f1e8', ramp_of('#f4f1e8'))
    x, y, w = head_top(c)
    w = min(w, c._W * (0.24 if kind == 'crown' else 0.32))
    r = w * 0.5
    put = lambda f, *a, **kw: c._raw(f, *a, **kw)
    if kind == 'crown':
        base = y + 1
        pts = [(x - r, base + 2), (x - r, base - r * 0.7), (x - r * 0.5, base - r * 0.25), (x, base - r * 0.95), (x + r * 0.5, base - r * 0.25),
               (x + r, base - r * 0.7), (x + r, base + 2)]
        put(B.Canvas.poly, c, pts, rp, base=3)
        for gx in (x - r * 0.5, x, x + r * 0.5):
            put(B.Canvas.ball, c, gx, base - r * 0.05, max(1, r * 0.13), max(1, r * 0.13), 'ruby', lift=0.3)
    elif kind in ('helm', 'beanie', 'chef', 'tophat', 'party', 'hood', 'kasa', 'mushroom'):
        if kind == 'kasa' or kind == 'mushroom':
            put(B.Canvas.poly, c, [(x - r * 1.5, y + r * 0.35), (x, y - r * 0.75), (x + r * 1.5, y + r * 0.35)], rp, base=3)
            if kind == 'mushroom':
                for gx in (x - r * 0.6, x + r * 0.3):
                    put(B.Canvas.ball, c, gx, y - r * 0.05, max(1, r * 0.18), max(1, r * 0.14), 'hat:#f4f1e8', lift=0.3)
        elif kind == 'tophat':
            put(B.Canvas.poly, c, [(x - r * 1.1, y + r * 0.3), (x + r * 1.1, y + r * 0.3), (x + r * 1.1, y + r * 0.05), (x - r * 1.1, y + r * 0.05)], rp, base=2)
            put(B.Canvas.poly, c, [(x - r * 0.6, y + r * 0.1), (x - r * 0.6, y - r * 1.2), (x + r * 0.6, y - r * 1.2), (x + r * 0.6, y + r * 0.1)], rp, base=3)
        elif kind == 'party':
            put(B.Canvas.poly, c, [(x - r * 0.6, y + r * 0.25), (x + r * 0.1, y - r * 1.5), (x + r * 0.7, y + r * 0.25)], rp, base=3)
            put(B.Canvas.ball, c, x + r * 0.1, y - r * 1.5, max(1, r * 0.2), max(1, r * 0.2), 'hatgold', lift=0.3)
        elif kind == 'chef':
            put(B.Canvas.ball, c, x, y - r * 0.4, r * 0.9, r * 0.6, rp, lift=0.2)
            put(B.Canvas.poly, c, [(x - r * 0.75, y + r * 0.3), (x - r * 0.75, y - r * 0.2), (x + r * 0.75, y - r * 0.2), (x + r * 0.75, y + r * 0.3)], rp, base=4)
        else:  # helm, beanie, hood: a dome over the top of the head
            put(B.Canvas.ball, c, x, y + r * 0.45, r * 1.05, r * 0.75, rp, lift=0.1, clip=lambda px_, py_: py_ < y + r * 0.45)
            if kind == 'beanie':
                put(B.Canvas.ball, c, x, y - r * 0.35, max(1, r * 0.25), max(1, r * 0.25), rp, lift=0.4)
            if kind == 'helm':
                put(B.Canvas.poly, c, [(x - r * 0.1, y - r * 0.6), (x + r * 0.1, y - r * 0.6), (x + r * 0.1, y + r * 0.45), (x - r * 0.1, y + r * 0.45)], 'hatgold', base=4)
    elif kind in ('bandana', 'headband'):
        put(B.Canvas.poly, c, [(x - r * 1.0, y + r * 0.3), (x + r * 1.0, y + r * 0.2), (x + r * 1.0, y + r * 0.55), (x - r * 1.0, y + r * 0.65)], rp, base=3)
        put(B.Canvas.poly, c, [(x - r * 1.0, y + r * 0.35), (x - r * 1.6, y + r * 0.2), (x - r * 1.5, y + r * 0.8)], rp, base=2)
    elif kind == 'halo':
        for i in range(24):
            import math
            a = i / 24 * 6.2832
            put(B.Canvas.put, c, x + 0.9 * r * math.cos(a), y - r * 0.6 + 0.3 * r * math.sin(a), ('hatgold', 5), flat=True)
    else:  # flower, bow, feather, leaf: a little thing tucked on top
        if kind == 'feather' or kind == 'leaf':
            put(B.Canvas.poly, c, [(x - r * 0.2, y + r * 0.2), (x + r * 0.1, y - r * 1.2), (x + r * 0.4, y + r * 0.2)], rp, base=3)
        else:
            for dx, dy in ((-0.3, -0.1), (0.3, -0.1), (0, -0.4), (0, 0.2)) if kind == 'flower' else ((-0.4, -0.1), (0.4, -0.1)):
                put(B.Canvas.ball, c, x + r * 0.4 + dx * r, y + dy * r, max(1.2, r * 0.32), max(1.2, r * 0.28), rp, lift=0.2)
            put(B.Canvas.ball, c, x + r * 0.4, y - r * 0.1, max(1, r * 0.16), max(1, r * 0.16), 'hatgold', lift=0.3)


R.setdefault('ruby', ramp('#3a0610', '#600a18', '#8e1424', '#bc2232', '#e04450', '#ff8088'))


# ---------------------------------------------------------------- drawing
def draw(beast, height, frames, hat=None, hue=0):
    """the beast's frames at boss size: [image per frame name]"""
    w, h, fn, extra = B.DESIGNS[beast]
    k = height / h
    out = []
    for name in frames:
        c = ZCanvas(w, h, k)
        fn(c, P(name))
        c.raw += 1
        if hue:
            rp = main_ramp(c)
            if rp:
                recolour(c, rp, turned(rp, hue))
        if hat:
            wear_hat(c, *hat)
        c.raw -= 1
        out.append(c.image(flash=0.5 if name == 'hit' else 0.0))
    return out


def save(ims, path):
    B.strip(ims).save(path)
    return ims[0].size


def build_heads(out, man):
    for kind, beast in HEAD_BEAST.items():
        w, h = save(draw(beast, HEIGHT['head'], ['idle0', 'idle1', 'hit'], ('crown', '#f0c040')), os.path.join(out, f'boss-{kind}.png'))
        man['bosses'][kind] = {'w': w, 'h': h, 'frames': ['idle1', 'idle2', 'hit']}


def build_giants(out, man):
    for etype, head in GIANTS.items():
        w, h = save(draw(HEAD_BEAST[head], HEIGHT['giant'], ['walk0', 'walk2', 'hit'], ('crown', '#f0c040')), os.path.join(out, f'enemy-{etype}.png'))
        man['enemies'][etype] = {'w': w, 'h': h, 'frames': ['walk1', 'walk2', 'hit']}


def build_siblings(out, man, looks):
    """looks: sibling kind -> (its head, role, hat kind, hat colour) from hd_bosses.SIBLINGS"""
    for kind, beast in SIB_BEAST.items():
        head, role, hat, hatcol = looks[kind]
        # the beasts keep their own colours (turned fur read as sickly); the hat tells siblings apart
        # a sibling never rivals its head: a wide beast (a long tail, a long bow) is drawn shorter
        bw, bh = B.DESIGNS[beast][:2]
        height = min(HEIGHT[role], 0.85 * man['bosses'][head]['w'] * bh / bw)
        w, h = save(draw(beast, height, ['idle0', 'idle1', 'hit'], (hat, hatcol)), os.path.join(out, f'boss-{kind}.png'))
        man['bosses'][kind] = {'w': w, 'h': h, 'frames': ['idle1', 'idle2', 'hit']}
