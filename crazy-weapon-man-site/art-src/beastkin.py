"""Beastkin residents, arcade cut: each zone's own family of furry archers, swordsmen and so on, in
the same 32-bit style as the hero (arcade_hero.py): deep six-step colour ramps lit from the top
left, ragged fur edges, a dark contour where one part sits in front of another and a 1px ink
outline round the whole silhouette.

Zone 2 (the Ranger's Mushroom Forest, the bow) is the fuzzball family: little brown fuzzballs with
twig bows at the start of the world that grow up, level by level, into yetis and werewolves.

Every type has the same named frames, facing right with the feet on the bottom row:
  idle0 idle1        a breathing loop
  walk0..walk3       the walk (fuzzballs bounce, the bigger beasts stride)
  draw               bow drawn, arrow nocked (the wind-up)
  loose              the arrow just left, string still humming
  hit                recoiling, eyes squeezed shut (flashed white in the export)
plus a type's own extras (EXTRA below): jump, roll0/roll1, flip, stomp, howl, sky.

  python3 art-src/beastkin.py [out.png]   writes public/assets/px/enemy-<type>.png and updates
                                          the manifest; with a path, also a zoomed preview sheet.
"""
import json
import math
import os
import sys
from PIL import Image

INK = (0x1a, 0x14, 0x28)
WHITE = (255, 255, 255)


def hexc(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def ramp(*hs):
    return [hexc(h) for h in hs]


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


# six steps, darkest first
R = {
    'brown': ramp('#24120c', '#3e2014', '#5e3418', '#86502a', '#b07440', '#d8a066'),
    'tan': ramp('#3a2010', '#5c3418', '#86522a', '#b27a44', '#d8a46a', '#f4cc96'),
    'burr': ramp('#1a0e0a', '#2e1a10', '#48281a', '#6a3c24', '#8e5634', '#b0764a'),
    'moss': ramp('#101c0c', '#1e3216', '#345222', '#52782e', '#7ea03c', '#b4cc5a'),
    'wolf': ramp('#16141c', '#2a2630', '#443c46', '#685c62', '#94847e', '#c4b2a0'),
    'snow': ramp('#2a3250', '#4a5878', '#7a8cae', '#aec2dc', '#dceaf6', '#ffffff'),
    'yskin': ramp('#141c38', '#22305c', '#344c8a', '#4c6cb4', '#7092d4', '#9cbcec'),
    'were': ramp('#100a12', '#1e141c', '#33212a', '#4e3436', '#704c44', '#946a54'),
    'chest': ramp('#3a2a20', '#5a4232', '#80604a', '#a8805e', '#ccA67c', '#ead0a4'),
    'wood': ramp('#200e06', '#3a1c0c', '#5e3216', '#8a5024', '#b87438', '#e0a05a'),
    'twig': ramp('#1e140a', '#382612', '#5a3e1c', '#7e5a2a', '#a47c3c', '#c8a05a'),
    'bone': ramp('#3a3028', '#5e5040', '#8c7c64', '#b8a888', '#e0d4b8', '#fff8e8'),
    'ice': ramp('#10304e', '#1c5480', '#2e80b2', '#56b0dc', '#9adcf4', '#e2faff'),
    'moon': ramp('#22243e', '#3a4068', '#5c6a9c', '#8ea2cc', '#c4d4ee', '#f4f8ff'),
    'leaf': ramp('#0e2010', '#1a3a18', '#2a5a20', '#3e8028', '#62a838', '#9ad05a'),
    'steel': ramp('#2a2e3e', '#464c64', '#6a728e', '#9aa2bc', '#cad0e2', '#f4f6ff'),
    'red': ramp('#3e0a12', '#6e0e1c', '#a01828', '#cc2e34', '#f05a46', '#ff9a70'),
    'gold': ramp('#3e2406', '#6e4410', '#a8701c', '#d8a028', '#f8d050', '#fff0a0'),
    'leather': ramp('#1c0e0a', '#301a12', '#4a2a1a', '#6a4026', '#8e5a36', '#b07a4c'),
    'pink': ramp('#4a1828', '#7a2a40', '#a8445a', '#d06a7a', '#f0949c', '#ffc4c4'),
}
# light comes from the top left and a little toward the viewer
_L = (-0.55, -0.7, 0.55)
_n = math.sqrt(sum(v * v for v in _L))
LIGHT = tuple(v / _n for v in _L)


def lvl(d, n=6, lift=0.0):
    """a light amount (-1..1) to a ramp step"""
    t = (d + 0.42 + lift) / 1.32
    return max(0, min(n - 1, int(t * n)))


class Canvas:
    """A sprite being painted. Each pixel remembers its ramp and step, and which shape put it there,
    so the finish can draw contours between parts and the ink outline round the silhouette."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.col = [[None] * w for _ in range(h)]  # (ramp name, step) or an rgb tuple
        self.part = [[0] * w for _ in range(h)]
        self.thin = [[False] * w for _ in range(h)]  # strings and whiskers: no outline round them
        self.flat = [[False] * w for _ in range(h)]  # eyes and glints: never contoured
        self.n = 0

    def _new(self, contour=True):
        self.n += 1
        return self.n if contour else -self.n

    def put(self, x, y, c, part=None, thin=False, flat=False):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.col[y][x] = c
            self.part[y][x] = part if part is not None else self._new(False)
            self.thin[y][x] = thin
            self.flat[y][x] = flat

    def get(self, x, y):
        return self.col[y][x] if 0 <= x < self.w and 0 <= y < self.h else None

    # ---------------------------------------------------------------- shapes
    def ball(self, cx, cy, rx, ry, rp, fur=0.0, tufts=10, phase=0.0, lift=0.0, tex=0, under=0.0, contour=True, clip=None):
        """A shaded ellipse. fur > 0 ruffles the edge into tufts (points sweep down the sides the way
        fur falls); tex adds strands of the next darker step; under > 0 darkens the belly."""
        part = self._new(contour)
        n = len(R[rp])
        x0, x1 = int(cx - rx * (1 + fur) - 2), int(cx + rx * (1 + fur) + 2)
        y0, y1 = int(cy - ry * (1 + fur) - 2), int(cy + ry * (1 + fur) + 2)
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if clip and not clip(x, y):
                    continue
                u, v = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                rr = math.hypot(u, v)
                if fur:
                    a = math.atan2(v, u)
                    s = (a / (2 * math.pi) * tufts + phase) % 1
                    tip = (1 - abs(s - 0.5) * 2) ** 2  # 1 on the tuft, 0 between
                    lim = 1 - fur * 0.55 + fur * tip * (0.6 + 0.4 * max(0, math.sin(a)))
                else:
                    lim = 1
                if rr > lim:
                    continue
                k = min(1, rr)
                nz = math.sqrt(max(0, 1 - k * k))
                d = u * LIGHT[0] + v * LIGHT[1] + nz * LIGHT[2]
                if under and v > 0.35:
                    d -= under * (v - 0.35)
                L = lvl(d, n, lift)
                if tex and 0 < L < n - 1 and rr < lim - 0.12:
                    # strands: short diagonal dashes of the next step down
                    if (x * 2 + y * 3 + tex) % 7 == 0 or (x * 2 + y * 3 + tex) % 7 == 1 and (y % 3 == 0):
                        L -= 1
                self.put(x, y, (rp, L), part)
        return part

    def poly(self, pts, rp, base=3, grad=1.0, contour=True, thin=False):
        """A filled polygon, shaded by how far each pixel sits toward the light."""
        part = self._new(contour)
        n = len(R[rp])
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
        sx, sy = max(1, (max(xs) - min(xs)) / 2), max(1, (max(ys) - min(ys)) / 2)
        for y in range(int(min(ys)) - 1, int(max(ys)) + 2):
            for x in range(int(min(xs)) - 1, int(max(xs)) + 2):
                if not _inside(x + 0.5, y + 0.5, pts):
                    continue
                d = ((x + 0.5 - cx) / sx * LIGHT[0] + (y + 0.5 - cy) / sy * LIGHT[1]) * grad
                L = max(0, min(n - 1, base + int(round(d * 1.6))))
                self.put(x, y, (rp, L), part, thin=thin)
        return part

    def capsule(self, x0, y0, x1, y1, r0, r1, rp, lift=0.0, contour=True):
        """A limb: a tapered capsule, lit on the side facing the light."""
        part = self._new(contour)
        n = len(R[rp])
        dx, dy = x1 - x0, y1 - y0
        ln = max(0.001, math.hypot(dx, dy))
        nx, ny = -dy / ln, dx / ln  # one side of the limb
        for y in range(int(min(y0, y1) - max(r0, r1) - 1), int(max(y0, y1) + max(r0, r1) + 2)):
            for x in range(int(min(x0, x1) - max(r0, r1) - 1), int(max(x0, x1) + max(r0, r1) + 2)):
                px_, py_ = x + 0.5, y + 0.5
                t = max(0, min(1, ((px_ - x0) * dx + (py_ - y0) * dy) / (ln * ln)))
                qx, qy = x0 + dx * t, y0 + dy * t
                r = r0 + (r1 - r0) * t
                dist = math.hypot(px_ - qx, py_ - qy)
                if dist > r:
                    continue
                # pseudo normal: across the limb, plus the cap ends
                ax, ay = (px_ - qx) / max(r, 0.01), (py_ - qy) / max(r, 0.01)
                nz = math.sqrt(max(0, 1 - min(1, ax * ax + ay * ay)))
                d = ax * LIGHT[0] + ay * LIGHT[1] + nz * LIGHT[2]
                self.put(x, y, (rp, lvl(d, n, lift)), part)
        return part

    def line(self, pts, c, thin=False, part=None, flat=False, w=1):
        """a 1px polyline (Bresenham), in a ramp step or an rgb colour"""
        if part is None:
            part = self._new(False)
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            ax, ay, bx, by = int(round(ax)), int(round(ay)), int(round(bx)), int(round(by))
            dx, dy = abs(bx - ax), -abs(by - ay)
            sx, sy = (1 if ax < bx else -1), (1 if ay < by else -1)
            err = dx + dy
            while True:
                self.put(ax, ay, c, part, thin=thin, flat=flat)
                if w > 1:
                    self.put(ax, ay + 1, c, part, thin=thin, flat=flat)
                if ax == bx and ay == by:
                    break
                e2 = 2 * err
                if e2 >= dy:
                    err += dy
                    ax += sx
                if e2 <= dx:
                    err += dx
                    ay += sy
        return part

    def dot(self, x, y, c):
        self.put(x, y, c, flat=True)

    # ---------------------------------------------------------------- finish
    def image(self, flash=0.0):
        w, h = self.w, self.h
        rgb = [[None] * w for _ in range(h)]
        for y in range(h):
            for x in range(w):
                c = self.col[y][x]
                if c is None:
                    continue
                if isinstance(c[0], str):
                    rp, L = c
                    # contour: a pixel with a part in front of it right next to it takes two steps darker
                    p = self.part[y][x]
                    if p > 0 and not self.flat[y][x]:
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            nx, ny = x + dx, y + dy
                            if 0 <= nx < w and 0 <= ny < h and self.col[ny][nx] is not None:
                                q = self.part[ny][nx]
                                if q > p and not self.thin[ny][nx] and not self.flat[ny][nx]:
                                    L = max(0, L - 2)
                                    break
                    rgb[y][x] = R[rp][L]
                else:
                    rgb[y][x] = c
        im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        px = im.load()
        for y in range(h):
            for x in range(w):
                if rgb[y][x] is not None:
                    c = rgb[y][x]
                    if flash and not (self.flat[y][x] and c == INK):
                        c = mix(c, WHITE, flash)
                    px[x, y] = c + (255,)
                    continue
                # ink outline round the silhouette (thin strings don't get one)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and rgb[ny][nx] is not None and not self.thin[ny][nx]:
                        px[x, y] = INK + (255,)
                        break
        return im


def _inside(x, y, pts):
    c = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi:
            c = not c
        j = i
    return c


# ---------------------------------------------------------------- shared parts
def bow(c, gx, gy, aim, size, rp, pull=0.0, arrow=True, hum=0, recurve=0.0, string=None, head='steel',
        fletch='red', heads=1, thick=2):
    """A bow held at (gx, gy), pointing at angle aim (0 = straight ahead, negative = up). size is
    the limb length; pull 0..1 draws the string back. Returns the nock point (where the back hand
    goes). heads > 1 nocks a fan of arrows."""
    dx, dy = math.cos(aim), math.sin(aim)
    nx, ny = -dy, dx  # along the bow, top limb is -n
    bend = 0.42 + pull * 0.2
    pts = []
    for i in range(-10, 11):
        s = i / 10
        back = bend * size * s * s - recurve * size * max(0, abs(s) - 0.75) * 2.5
        pts.append((gx + nx * s * size - dx * back, gy + ny * s * size - dy * back))
    part = c._new(True)
    for k, (x, y) in enumerate(pts):
        s = abs(k - 10) / 10
        L = 4 if k < 10 else 3
        if s < 0.18:
            c.put(x, y, ('leather', 3), part)  # the grip wrap
            if thick > 1:
                c.put(x - dx, y - dy, ('leather', 2), part)
            continue
        c.put(x, y, (rp, L + (1 if s > 0.85 else 0)), part)
        if thick > 1 and s < 0.8:
            c.put(x - dx * 0.9, y - dy * 0.9, (rp, max(0, L - 2)), part)
    top, bot = pts[0], pts[-1]
    nock = (gx - dx * (size * 0.22 + pull * size * 0.62), gy - dy * (size * 0.22 + pull * size * 0.62))
    sc = string or mix(R['bone'][4], WHITE, 0.3)
    if pull > 0 or arrow:
        c.line([top, nock, bot], sc, thin=True)
    else:
        o = hum  # just loosed: the string still wobbles
        c.line([top, (nock[0] + dx * (size * 0.18 - o), nock[1] + dy * (size * 0.18 - o)), bot], sc, thin=True)
    if arrow:
        for j in range(heads):
            a2 = aim + (j - (heads - 1) / 2) * 0.32
            ex, ey = math.cos(a2), math.sin(a2)
            ln = size * 1.25 + pull * size * 0.3
            tip = (nock[0] + ex * ln, nock[1] + ey * ln)
            p = c._new(False)
            c.line([nock, tip], ('wood', 4), part=p)
            hd = R[head] if head in R else R['steel']
            c.put(tip[0], tip[1], head and (head, 5) if head in R else hd[5], p)
            c.put(tip[0] - ex, tip[1] - ey, (head, 3) if head in R else hd[3], p)
            c.put(tip[0] - ex - ey, tip[1] - ey + ex, (head, 2) if head in R else hd[2], p)
            c.put(tip[0] - ex + ey, tip[1] - ey - ex, (head, 2) if head in R else hd[2], p)
            # fletching
            c.put(nock[0] + ex - ey, nock[1] + ey + ex, (fletch, 4), p)
            c.put(nock[0] + ex + ey, nock[1] + ey - ex, (fletch, 4), p)
            c.put(nock[0] + 2 * ex - ey, nock[1] + 2 * ey + ex, (fletch, 3), p)
            c.put(nock[0] + 2 * ex + ey, nock[1] + 2 * ey - ex, (fletch, 3), p)
    return nock


def eyes(c, x, y, gap, hit=False, size=2, iris=None, glow=False, brow=0, white=True):
    """Arcade eyes: a dark socket, a coloured iris and a glint; squeezed into > < when hit.
    brow > 0 slants an angry brow over them."""
    for i, ex in enumerate((x, x + gap)):
        if hit:
            c.dot(ex, y, INK); c.dot(ex + 1, y + 1, INK); c.dot(ex, y + 2, INK)
            continue
        if glow:
            c.dot(ex, y, iris); c.dot(ex + 1, y, iris)
            if size > 1:
                c.dot(ex, y + 1, mix(iris, INK, 0.3)); c.dot(ex + 1, y + 1, mix(iris, WHITE, 0.4))
            continue
        for dy in range(size + 1):
            for dx in range(2):
                c.dot(ex + dx, y + dy, WHITE if white and dx == 0 and dy < size else iris or INK)
        c.dot(ex + 1, y + size, INK)
        c.dot(ex + 1, y, iris or INK)
        c.dot(ex, y, WHITE)
        if brow:
            c.dot(ex - (1 if i == 0 else 0), y - 1, INK); c.dot(ex + (1 if i == 0 else 2), y - 1 - (brow if i else 0) + (brow if i == 0 else 0), INK)


def paw(c, x, y, rp, r=1.6):
    return c.ball(x, y, r, r, rp, lift=0.15)


# ---------------------------------------------------------------- poses
FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'draw', 'loose', 'hit']


class P:
    """What a frame asks of a design: body bob, squash, step phase, bow pull, hit."""

    def __init__(self, name):
        self.name = name
        self.bob = 0
        self.sq = 0.0       # + squashes (wider, shorter), - stretches
        self.step = 0.0     # -1..1 leg phase
        self.walk = name.startswith('walk')
        self.pull = 0.0
        self.arrow = True
        self.hit = name == 'hit'
        self.lean = 0.0
        if name == 'idle1':
            self.bob, self.sq = 1, 0.08
        if self.walk:
            i = int(name[-1])
            self.step = [1, 0, -1, 0][i]
            self.bob = [0, -1, 0, -1][i]
            self.sq = [0.12, -0.1, 0.12, -0.1][i]
        if name == 'draw':
            self.pull, self.sq = 1.0, 0.05
        if name == 'loose':
            self.arrow, self.lean, self.sq = False, -0.6, -0.04
        if name == 'hit':
            self.lean, self.sq, self.arrow = -1.2, -0.06, False
        self.hum = 1 if name == 'loose' else 0


def feet(c, x, y, gap, rp, step, s=2.2):
    # two stubby feet, the stepping one lifted
    c.ball(x - gap / 2 - step * 1.2, y - 1.2 - max(0, step) * 1.3, s, s * 0.7, rp, lift=0.1)
    c.ball(x + gap / 2 + step * 1.2, y - 1.2 - max(0, -step) * 1.3, s, s * 0.7, rp, lift=0.1)


# ---- 1. Fuzzlet: a tiny brown fuzzball with a twig bow. Hops, and looses at the top of the hop.
def fuzzlet(c, p):
    W, H = c.w, c.h
    base = H - 2
    sq = p.sq + (-0.25 if p.name == 'jump' else 0)
    rx, ry = 5.2 * (1 + sq * 0.6), 4.8 * (1 - sq)
    cx, cy = 8.5 + p.lean, base - 1.5 - ry + p.bob - (2 if p.name == 'jump' else 0)
    if p.name == 'jump':
        c.ball(cx - 2.2, cy + ry + 0.8, 1.8, 1.3, 'brown')
        c.ball(cx + 2.2, cy + ry + 0.4, 1.8, 1.3, 'brown')
    else:
        feet(c, cx, base, 4, 'brown', p.step, 1.9)
    c.ball(cx, cy, rx, ry, 'brown', fur=0.35, tufts=11, phase=0.2, tex=1, under=0.6)
    c.ball(cx - 1, cy - ry + 0.6, 1.6, 1.8, 'brown', fur=0.5, tufts=3, lift=0.3)  # top tuft
    eyes(c, int(cx) - 1, int(cy) - 2, 3, p.hit, size=2, iris=(30, 20, 26))
    if not p.hit:
        c.dot(int(cx) + 1, int(cy) + 2, R['pink'][2])
    aim = -0.5 if p.name == 'jump' else (-0.15 if p.pull else 0)
    if p.name == 'jump':
        aim = 0.55
    gx, gy = cx + rx + 1.5, cy + 0.5
    nock = bow(c, gx, gy, aim, 4.5, 'twig', pull=p.pull, arrow=p.arrow, hum=p.hum, thick=1)
    paw(c, gx, gy, 'brown', 1.3)
    if p.pull:
        paw(c, nock[0], nock[1], 'brown', 1.2)


# ---- 2. Burr Ball: a dark burr-covered ball with old arrows stuck in its fur. Curls up and rolls
# at you, then shakes the stuck arrows out in a spray.
def burrball(c, p):
    base = c.h - 2
    roll = p.name.startswith('roll')
    rx, ry = 6.6 * (1 + p.sq * 0.5), 6.2 * (1 - p.sq * 0.6)
    cx, cy = 10 + p.lean, base - 0.5 - ry + p.bob
    if not roll:
        feet(c, cx, base, 6, 'burr', p.step, 2.2)
    spin = 0 if not roll else (0.0 if p.name == 'roll0' else 0.7)
    # stuck arrows behind (back half)
    for a in (-2.4 + spin, -1.6 + spin):
        ex, ey = math.cos(a), math.sin(a)
        c.line([(cx + ex * 3, cy + ey * 3), (cx + ex * (rx + 4), cy + ey * (ry + 4))], ('wood', 3))
        c.put(cx + ex * (rx + 4) - ey, cy + ey * (ry + 4) + ex, ('red', 4))
        c.put(cx + ex * (rx + 4) + ey, cy + ey * (ry + 4) - ex, ('red', 3))
    c.ball(cx, cy, rx, ry, 'burr', fur=0.4, tufts=14, phase=spin * 2, tex=3, under=0.5)
    # burrs: little green spiky seeds caught in the fur
    for i, a in enumerate((-2.0, -0.9, 0.3, 1.5, 2.6, -2.9)):
        a += spin
        bx, by = cx + math.cos(a) * rx * 0.62, cy + math.sin(a) * ry * 0.62
        c.put(bx, by, ('leaf', 3)); c.put(bx + 1, by, ('leaf', 2)); c.put(bx, by - 1, ('leaf', 4))
    a = -0.8 + spin
    ex, ey = math.cos(a), math.sin(a)
    c.line([(cx + ex * 2, cy + ey * 2), (cx + ex * (rx + 5), cy + ey * (ry + 5))], ('wood', 4))
    c.put(cx + ex * (rx + 5) - ey, cy + ey * (ry + 5) + ex, ('red', 4))
    c.put(cx + ex * (rx + 5) + ey, cy + ey * (ry + 5) - ex, ('red', 4))
    if roll:
        return
    eyes(c, int(cx) + 1, int(cy) - 2, 3, p.hit, size=1, iris=(255, 210, 90), glow=True)
    c.dot(int(cx) + 2, int(cy) + 2, INK); c.dot(int(cx) + 3, int(cy) + 2, INK)
    gx, gy = cx + rx + 1, cy + 2
    nock = bow(c, gx, gy, -0.1, 5, 'wood', pull=p.pull, arrow=p.arrow, hum=p.hum, thick=1)
    paw(c, gx, gy, 'burr', 1.4)
    if p.pull:
        paw(c, nock[0], nock[1], 'burr', 1.3)


# ---- 3. Puff Archer: a fluffy tan puff in an acorn cap who lobs arrows up and over in an arc.
def puffshot(c, p):
    base = c.h - 2
    rx, ry = 6.4 * (1 + p.sq * 0.6), 6.0 * (1 - p.sq)
    cx, cy = 9.5 + p.lean, base - 1.6 - ry + p.bob
    feet(c, cx, base, 5, 'tan', p.step, 2.1)
    c.ball(cx, cy, rx, ry, 'tan', fur=0.45, tufts=13, phase=0.4, tex=2, under=0.5)
    # acorn cap with a stalk
    c.ball(cx - 0.5, cy - ry + 1.2, 4.6, 2.6, 'wood', fur=0.15, tufts=9, tex=5, clip=lambda x, y: y <= cy - ry + 1.8)
    c.line([(cx, cy - ry - 1.6), (cx + 1, cy - ry - 2.6)], ('wood', 2))
    eyes(c, int(cx), int(cy) - 1, 3, p.hit, size=2, iris=(60, 34, 20))
    if not p.hit:
        c.dot(int(cx) - 1, int(cy) + 3, R['pink'][3]); c.dot(int(cx) + 5, int(cy) + 3, R['pink'][3])
    aim = -0.85 if p.pull else -0.55
    gx, gy = cx + rx + 0.5, cy + 0.5
    nock = bow(c, gx, gy, aim, 5.5, 'wood', pull=p.pull, arrow=p.arrow, hum=p.hum, recurve=0.1)
    paw(c, gx, gy, 'tan', 1.5)
    if p.pull or p.arrow:
        paw(c, nock[0], nock[1], 'tan', 1.4)


# ---- 4. Twin Tuft: two fuzzballs stuck together sharing one bow. They loose two arrows at once
# and, knocked apart, become two Fuzzlets.
def twintuft(c, p):
    base = c.h - 2
    sq = p.sq
    r1x, r1y = 5.6 * (1 + sq * 0.6), 5.2 * (1 - sq)
    bx, by = 8 + p.lean, base - 1.4 - r1y + p.bob
    fx, fy = bx + 7.5 + p.lean * 0.5, base - 1.2 - r1y * 0.95 + (p.bob if p.walk and p.step else -p.bob)
    feet(c, bx, base, 4, 'brown', p.step, 1.9)
    c.ball(bx, by, r1x, r1y, 'brown', fur=0.38, tufts=11, phase=0.1, tex=1, under=0.6)
    c.ball(bx - 1.5, by - r1y + 0.4, 1.5, 1.8, 'brown', fur=0.5, tufts=3, lift=0.3)
    eyes(c, int(bx) - 1, int(by) - 2, 3, p.hit, size=2, iris=(30, 20, 26))
    feet(c, fx, base, 4, 'tan', -p.step, 1.9)
    c.ball(fx, fy, r1x * 0.95, r1y * 0.95, 'tan', fur=0.38, tufts=11, phase=0.6, tex=4, under=0.6)
    c.ball(fx + 1, fy - r1y + 0.6, 1.4, 1.7, 'tan', fur=0.5, tufts=3, lift=0.3)
    eyes(c, int(fx), int(fy) - 2, 3, p.hit, size=2, iris=(60, 34, 20))
    if not p.hit:
        c.dot(int(fx) + 1, int(fy) + 2, R['pink'][2]); c.dot(int(bx) + 0, int(by) + 2, R['pink'][2])
    gx, gy = fx + r1x + 1.2, fy + 0.5
    nock = bow(c, gx, gy, -0.05, 6, 'wood', pull=p.pull, arrow=p.arrow, hum=p.hum, heads=2 if p.arrow else 1)
    paw(c, gx, gy, 'tan', 1.4)
    if p.pull or p.arrow:
        paw(c, nock[0], nock[1], 'brown', 1.4)  # the back twin pulls the string


# ---- 5. Quillback: a hedgehog-ish fuzzball with a fan of red-tipped quills. Looses three arrows
# in a fan, and bristles (quills all round) when you hit it too many times.
def quillback(c, p):
    base = c.h - 2
    rx, ry = 7.4 * (1 + p.sq * 0.5), 6.0 * (1 - p.sq)
    cx, cy = 10.5 + p.lean, base - 1.6 - ry + p.bob
    bristle = p.hit or p.name == 'draw'
    # the quills fan out over the back
    for i in range(9):
        a = math.pi * (0.62 + i * 0.105) + (0.0 if not bristle else (i - 4) * 0.02)
        ln = (4.6 if bristle else 3.2) + (i % 2) * 1.2
        ex, ey = math.cos(a) * 1.15, math.sin(a) * -1
        sx_, sy_ = cx + ex * rx * 0.5, cy + ey * ry * 0.5
        tx, ty = cx + ex * (rx + ln), cy + ey * (ry + ln)
        px_, py_ = -ey * 1.1, ex * 1.1
        c.poly([(sx_ + px_, sy_ + py_), (sx_ - px_, sy_ - py_), (tx, ty)], 'bone', base=4 if i % 2 else 3)
        c.put(tx, ty, ('red', 3)); c.put(tx - ex * 0.8, ty - ey * 0.8, ('red', 4))
    feet(c, cx, base, 6, 'brown', p.step, 2.2)
    c.ball(cx, cy, rx, ry, 'brown', fur=0.3, tufts=12, phase=0.3, tex=6, under=0.6)
    # face patch and snout
    c.ball(cx + 3.6, cy + 1, 3.8, 3.4, 'tan', lift=0.2)
    c.ball(cx + 6.8, cy + 1.8, 1.8, 1.4, 'tan', lift=0.25)
    c.dot(int(cx + 8.2), int(cy + 1.2), INK)
    eyes(c, int(cx) + 3, int(cy) - 1, 3, p.hit, size=1, iris=(40, 20, 24), brow=1)
    gx, gy = cx + rx + 2.6, cy + 3
    nock = bow(c, gx, gy, -0.1, 6, 'bone', pull=p.pull, arrow=p.arrow, hum=p.hum, heads=3 if p.pull else 1)
    paw(c, gx, gy, 'tan', 1.4)
    if p.pull or p.arrow:
        paw(c, nock[0], nock[1], 'tan', 1.4)


# ---- bipeds: the grown-up fuzz. A torso ball, a head, legs that stride and arms that draw.
def legs(c, hx, hy, base, rp, step, gap, thick=2.2, foot=None, walk=True):
    for side, s in ((-1, step), (1, -step)):
        fx = hx + side * gap / 2 + s * (3.5 if walk else 0)
        lift = max(0, -s) * 2 if walk else 0
        c.capsule(hx + side * gap / 3, hy, fx, base - 1.5 - lift, thick, thick * 0.8, rp)
        c.ball(fx + 1, base - 1.2 - lift, thick * 1.1, thick * 0.65, foot or rp, lift=0.1)


def arm(c, sx, sy, hx, hy, rp, r=1.8, elbow=0.0, fist=None):
    """shoulder to hand, bent at the elbow (elbow > 0 bends down/out)"""
    mx, my = (sx + hx) / 2, (sy + hy) / 2
    dx, dy = hx - sx, hy - sy
    ln = max(0.01, math.hypot(dx, dy))
    ex, ey = mx - dy / ln * elbow, my + dx / ln * elbow
    c.capsule(sx, sy, ex, ey, r, r * 0.9, rp)
    c.capsule(ex, ey, hx, hy, r * 0.9, r * 0.8, rp)
    c.ball(hx, hy, r * 1.05, r * 1.05, fist or rp, lift=0.15)


# ---- 6. Moss Stalker: a shaggy fuzz in a ghillie of hanging moss with a longbow taller than it is.
# Blends into the forest until it draws; one long, aimed shot, then it slips to a new spot.
def moss(c, p):
    base = c.h - 2
    hx, hy = 11 + p.lean, base - 7 + p.bob
    legs(c, hx, hy, base, 'burr', p.step, 4, 1.8)
    # far arm (draw hand) first, behind the body
    aim = -0.12 if p.pull else 0.0
    gx, gy = hx + 9 + (1 if p.pull else 0), hy - 6
    c.ball(hx, hy - 5, 6.4 * (1 + p.sq * 0.4), 6.6 * (1 - p.sq * 0.6), 'brown', fur=0.3, tufts=12, tex=2, under=0.4)
    # the moss ghillie: a shaggy green mantle over the shoulders and head
    c.ball(hx - 0.5, hy - 9, 6.8, 5.4, 'moss', fur=0.55, tufts=15, phase=0.3, tex=3, clip=lambda x, y: y < hy - 3 + (x % 3 == 0) * 2)
    # hood shadow with eyes glinting out of it
    c.ball(hx + 2.4, hy - 9.4, 3.4, 2.8, 'burr', lift=-0.5)
    if p.hit:
        eyes(c, int(hx) + 2, int(hy) - 11, 3, True)
    else:
        eyes(c, int(hx) + 2, int(hy) - 10, 3, False, size=1, iris=(214, 255, 120), glow=True)
    nock = bow(c, gx, gy, aim, 10, 'wood', pull=p.pull, arrow=p.arrow, hum=p.hum, recurve=0.15)
    arm(c, hx + 1, hy - 6, gx, gy, 'brown', 1.5, elbow=0.6)
    if p.pull or p.arrow:
        arm(c, hx - 1, hy - 6, nock[0], nock[1], 'moss', 1.5, elbow=-1.2, fist='brown')
    # loose moss strands hanging over the arms
    for i, x in enumerate(range(int(hx) - 5, int(hx) + 4, 2)):
        c.line([(x, hy - 5), (x + (i % 2), hy - 2 + (i % 3))], ('moss', 2 + i % 2))


# ---- 7. Wolf Pup: a scrappy young wolf with a recurve bow. Runs in, bashes you with the bow,
# backflips away and shoots on the way down.
def wolfpup(c, p):
    base = c.h - 2
    flip = p.name == 'flip'
    hx, hy = 11 + p.lean, base - 7 + p.bob
    if flip:
        # curled up mid backflip: a ball of fur, tail wrapped round, bow tucked
        cx, cy = 12, base - 11
        c.ball(cx, cy, 6.5, 6, 'wolf', fur=0.3, tufts=12, tex=2)
        c.capsule(cx - 6, cy + 2, cx - 2, cy + 6, 2, 1.4, 'wolf')
        c.ball(cx + 3, cy - 3, 3.6, 3.2, 'wolf', lift=0.2)
        c.ball(cx + 5.4, cy - 1.6, 2, 1.4, 'chest')
        eyes(c, int(cx) + 2, int(cy) - 4, 3, False, size=1, iris=(255, 200, 60), glow=True)
        bow(c, cx - 2, cy + 3, 1.6, 6, 'wood', arrow=False, recurve=0.25)
        return
    # tail
    c.capsule(hx - 5, hy - 3, hx - 10, hy - 7 + p.bob, 2.2, 1.2, 'wolf')
    legs(c, hx, hy, base, 'wolf', p.step, 4, 2.0)
    c.ball(hx, hy - 4, 5.2 * (1 + p.sq * 0.4), 5.6 * (1 - p.sq * 0.5), 'wolf', fur=0.3, tufts=10, tex=1, under=0.5)
    c.ball(hx + 1.2, hy - 3, 2.8, 3.4, 'chest', fur=0.25, tufts=6, lift=0.1)
    # head: ears, muzzle
    kx, ky = hx + 3, hy - 11
    c.poly([(kx - 3, ky - 2), (kx - 2, ky - 7), (kx, ky - 3)], 'wolf', base=3)
    c.poly([(kx + 1, ky - 3), (kx + 3, ky - 7), (kx + 4, ky - 2)], 'wolf', base=4)
    c.ball(kx, ky, 4.2, 3.8, 'wolf', fur=0.25, tufts=9, lift=0.1)
    c.ball(kx - 0.5, ky + 2.2, 3, 1.8, 'chest', fur=0.4, tufts=6)  # cheek ruff
    c.capsule(kx + 2, ky + 0.8, kx + 7, ky + 1.6, 2.1, 1.4, 'wolf', lift=0.25)
    c.capsule(kx + 2.5, ky + 2.2, kx + 6.2, ky + 2.4, 1.1, 0.8, 'chest')
    c.dot(int(kx + 8), int(ky + 0.6), INK); c.dot(int(kx + 8), int(ky + 1.6), INK)
    if not p.hit:
        c.dot(int(kx + 5), int(ky + 3), WHITE)
    eyes(c, int(kx) + 1, int(ky) - 1, 0, p.hit, size=1, iris=(255, 196, 56), glow=True)
    if not p.hit:
        c.dot(int(kx) + 1, int(ky) - 2, INK); c.dot(int(kx) + 2, int(ky) - 2, INK)
    aim = -0.1 if p.pull else 0.1
    gx, gy = hx + 11, hy - 1
    nock = bow(c, gx, gy, aim, 6, 'wood', pull=p.pull, arrow=p.arrow, hum=p.hum, recurve=0.3)
    arm(c, hx + 1, hy - 6, gx, gy, 'wolf', 1.5, elbow=0.8)
    if p.pull or p.arrow:
        arm(c, hx - 1, hy - 6, nock[0], nock[1], 'wolf', 1.4, elbow=-1.0)


# ---- 8. Frost Cub: a yeti cub, a ball of white fluff with a blue face and an icicle bow. Its frost
# arrows chill you (you move slower for a moment).
def yeticub(c, p):
    base = c.h - 2
    hx, hy = 11 + p.lean, base - 6 + p.bob
    legs(c, hx, hy, base, 'snow', p.step, 5, 2.4, foot='yskin')
    c.ball(hx, hy - 5, 7.2 * (1 + p.sq * 0.5), 7 * (1 - p.sq * 0.6), 'snow', fur=0.4, tufts=14, phase=0.5, tex=3, under=0.5)
    # face: a blue patch with a little snout and tiny horns
    fx, fy = hx + 2.5, hy - 7
    c.capsule(fx - 3, fy - 3, fx - 4.5, fy - 7, 1.3, 0.7, 'bone')
    c.capsule(fx + 2.5, fy - 3.5, fx + 3.5, fy - 7.5, 1.3, 0.7, 'bone')
    c.ball(fx, fy, 3.6, 3.2, 'yskin', lift=0.1)
    c.ball(fx + 2.6, fy + 1.6, 1.8, 1.2, 'yskin', lift=0.35)
    eyes(c, int(fx) - 1, int(fy) - 1, 3, p.hit, size=1, iris=(120, 230, 255), glow=True)
    aim = -0.12 if p.pull else 0.0
    gx, gy = hx + 9.5, hy - 4
    nock = bow(c, gx, gy, aim, 6.5, 'ice', pull=p.pull, arrow=p.arrow, hum=p.hum, head='ice', fletch='snow', recurve=0.2)
    arm(c, hx + 2, hy - 5, gx, gy, 'snow', 1.9, elbow=0.6, fist='yskin')
    if p.pull or p.arrow:
        arm(c, hx, hy - 5, nock[0], nock[1], 'snow', 1.8, elbow=-1.0, fist='yskin')


# ---- 9. Greatbow Yeti: a hulking yeti with a greatbow made from a whole antler. Braces it on the
# ground and looses a heavy arrow that bowls you over; shrugs off light hits; stomps if you get in
# close, sending a shockwave along the floor.
def yeti(c, p):
    base = c.h - 2
    stomp = p.name == 'stomp'
    hx, hy = 15 + p.lean, base - 9 + p.bob + (2 if stomp else 0)
    # legs: short and massive
    if stomp:
        c.capsule(hx - 4, hy, hx - 6, base - 2, 3.4, 3, 'snow')
        c.ball(hx - 5, base - 1.6, 4, 2, 'yskin', lift=0.1)
        c.capsule(hx + 4, hy, hx + 7, base - 2, 3.4, 3, 'snow')
        c.ball(hx + 8, base - 1.6, 4, 2, 'yskin', lift=0.1)
    else:
        legs(c, hx, hy, base, 'snow', p.step * 0.6, 8, 3.4, foot='yskin')
    # the greatbow stands planted in front, nearly as tall as the yeti
    aim = -0.08 if p.pull else 0.0
    gx, gy = hx + 13, hy - 9
    if stomp:
        gx, gy = hx + 13, hy - 8
    if stomp:  # the greatbow slung across the back
        bow(c, hx - 4, hy - 10, -2.3, 13, 'bone', arrow=False, recurve=0.3, string=(200, 210, 230))
    # body: a huge shaggy mound
    c.ball(hx - 1, hy - 9, 11 * (1 + p.sq * 0.3), 11.5 * (1 - p.sq * 0.4), 'snow', fur=0.32, tufts=18, phase=0.2, tex=4, under=0.55)
    # far arm reaching for the string (behind the bow, in front of the body)
    nock = bow(c, gx, gy, aim, 14, 'bone', pull=p.pull, arrow=p.arrow, hum=p.hum, recurve=0.3, head='steel',
               fletch='snow', thick=2, string=(200, 210, 230)) if not stomp else None
    # head: small for the body, sunk between the shoulders, horns curling forward
    fx, fy = hx + 4, hy - 17 + (1 if stomp else 0)
    c.ball(fx, fy, 5.6, 5, 'snow', fur=0.35, tufts=11, phase=0.7, tex=5)
    c.capsule(fx - 2, fy - 4, fx - 6, fy - 6, 1.8, 1.5, 'bone')
    c.capsule(fx - 6, fy - 6, fx - 8.5, fy - 3, 1.5, 1.2, 'bone')
    c.capsule(fx - 8.5, fy - 3, fx - 6.5, fy + 0.5, 1.2, 0.8, 'bone')
    c.ball(fx + 2.5, fy + 1, 3.8, 3.4, 'yskin', lift=0.05)
    c.ball(fx + 5, fy + 2.6, 2, 1.4, 'yskin', lift=0.3)
    c.dot(int(fx) + 3, int(fy) + 4, WHITE); c.dot(int(fx) + 5, int(fy) + 4, WHITE)  # tusk-y teeth
    eyes(c, int(fx) + 1, int(fy) - 1, 3, p.hit, size=1, iris=(120, 230, 255), glow=True)
    if not p.hit:
        c.dot(int(fx), int(fy) - 2, INK); c.dot(int(fx) + 1, int(fy) - 2, INK); c.dot(int(fx) + 4, int(fy) - 2, INK); c.dot(int(fx) + 5, int(fy) - 2, INK)
    if stomp:
        # both fists raised high over the head, about to come down
        arm(c, hx - 5, hy - 13, hx - 1, hy - 26, 'snow', 3.2, elbow=2.0, fist='yskin')
        arm(c, hx + 6, hy - 13, hx + 7, hy - 26, 'snow', 3.4, elbow=-2.0, fist='yskin')
        return
    arm(c, hx + 5, hy - 12, gx, gy, 'snow', 2.6, elbow=1.2, fist='yskin')
    if nock and (p.pull or p.arrow):
        arm(c, hx - 3, hy - 12, nock[0], nock[1], 'snow', 2.5, elbow=-1.6, fist='yskin')


# ---- 10. Moonfang: the werewolf at the top of the family, with a crescent moon bow. Howls to rile
# up every fuzz nearby, looses a volley into the sky that rains down where you stand, and claws you
# with the bow's bladed tips up close.
def werewolf(c, p):
    base = c.h - 2
    howl, sky = p.name == 'howl', p.name == 'sky'
    hx, hy = 15 + p.lean, base - 11 + p.bob
    # tail
    c.capsule(hx - 6, hy - 2, hx - 12, hy - 6 + p.bob, 2.6, 1.4, 'were')
    # digitigrade legs
    for side, s in ((-1, p.step), (1, -p.step)):
        kx, ky = hx + side * 2 + s * 2 + 2, hy + 5
        fx = hx + side * 3 + s * 4
        lift = max(0, -s) * 2
        c.capsule(hx + side * 2, hy - 1, kx, ky, 3, 2.2, 'were')
        c.capsule(kx, ky, fx - 1, base - 1.5 - lift, 2.2, 1.6, 'were')
        c.ball(fx + 1, base - 1.2 - lift, 2.6, 1.4, 'were', lift=0.1)
    # torso: hunched, broad shoulders, lighter chest
    c.ball(hx, hy - 9, 8 * (1 + p.sq * 0.3), 9.5 * (1 - p.sq * 0.4), 'were', fur=0.28, tufts=14, phase=0.1, tex=5, under=0.5)
    c.ball(hx + 2.5, hy - 7, 4.2, 5.4, 'chest', fur=0.22, tufts=8, lift=0.05, tex=2)
    # the mane over the shoulders
    c.ball(hx - 1, hy - 15, 7, 4.2, 'were', fur=0.6, tufts=12, phase=0.4, tex=1)
    # head
    up = howl or sky
    kx, ky = hx + 4, hy - 19 + (0 if not howl else -1)
    snout_dx, snout_dy = (3.6, -5.2) if howl else (7, 1.4)
    c.poly([(kx - 4, ky - 1), (kx - 4, ky - 8), (kx - 0.5, ky - 3)], 'were', base=3)
    c.poly([(kx - 1, ky - 3), (kx + 1, ky - 8.5), (kx + 2.5, ky - 2)], 'were', base=4)
    c.ball(kx, ky, 4.6, 4.2, 'were', fur=0.25, tufts=10, lift=0.15)
    c.capsule(kx + 1, ky + 0.6, kx + snout_dx, ky + snout_dy, 2.4, 1.7, 'were', lift=0.2)
    c.dot(int(kx + snout_dx + 1), int(ky + snout_dy - 1), INK)
    if howl:
        c.line([(kx + 2, ky + 2), (kx + snout_dx + 1, ky + snout_dy + 1.5)], R['red'][1], flat=True)
        c.dot(int(kx + 3), int(ky + 1), WHITE)
    elif not p.hit:
        c.dot(int(kx + 3), int(ky + 2.6), WHITE); c.dot(int(kx + 5), int(ky + 2.6), WHITE)  # fangs
    if howl:
        c.dot(int(kx), int(ky) - 2, INK); c.dot(int(kx) + 1, int(ky) - 1, INK)
    else:
        eyes(c, int(kx) - 1, int(ky) - 2, 3, p.hit, size=1, iris=(255, 214, 64), glow=True, brow=1)
    # the moon bow: a pale crescent with bladed tips
    if howl:
        bow(c, hx + 9, hy - 5, 1.2, 9, 'moon', arrow=False, recurve=0.35, string=(220, 230, 255))
        arm(c, hx + 3, hy - 13, hx + 9, hy - 5, 'were', 2.1, elbow=0.8, fist='were')
        arm(c, hx - 4, hy - 13, hx - 8, hy - 18, 'were', 2.0, elbow=-1.0, fist='were')
        return
    aim = -1.45 if sky else (-0.1 if p.pull else 0.0)
    gx, gy = (hx + 6, hy - 22) if sky else (hx + 12, hy - 11)
    nock = bow(c, gx, gy, aim, 9, 'moon', pull=p.pull or (1.0 if sky else 0), arrow=p.arrow or sky, hum=p.hum, recurve=0.4,
               string=(220, 230, 255), head='moon', fletch='moon', heads=3 if sky else 1)
    arm(c, hx + 3, hy - 13, gx, gy, 'were', 2.1, elbow=0.9 if not sky else -0.6, fist='were')
    if p.pull or p.arrow or sky:
        arm(c, hx - 3, hy - 13, nock[0], nock[1], 'were', 2.0, elbow=-1.4 if not sky else 1.2, fist='were')


# (canvas w, h, draw, extra frames) per type. Sizes include the 1px outline margin.
DESIGNS = {
    'fuzzlet': (22, 16, fuzzlet, ['jump']),
    'burrball': (28, 22, burrball, ['roll0', 'roll1']),
    'puffshot': (26, 24, puffshot, []),
    'twintuft': (32, 20, twintuft, []),
    'quillback': (32, 24, quillback, []),
    'moss': (34, 30, moss, []),
    'wolfpup': (34, 30, wolfpup, ['flip']),
    'yeticub': (32, 30, yeticub, []),
    'yeti': (46, 46, yeti, ['stomp']),
    'werewolf': (44, 46, werewolf, ['howl', 'sky']),
}
FAMILY = list(DESIGNS)


def frame_names(etype):
    return FRAMES + DESIGNS[etype][3]


def frames(etype):
    w, h, draw, extra = DESIGNS[etype]
    out = []
    for name in frame_names(etype):
        c = Canvas(w, h)
        draw(c, P(name))
        out.append(c.image(flash=0.5 if name == 'hit' else 0.0))
    return out


def strip(ims):
    w, h = ims[0].size
    sheet = Image.new('RGBA', (w * len(ims), h), (0, 0, 0, 0))
    for i, im in enumerate(ims):
        sheet.paste(im, (i * w, 0))
    return sheet


def build(out, man):
    for etype in DESIGNS:
        ims = frames(etype)
        strip(ims).save(os.path.join(out, f'enemy-{etype}.png'))
        man['enemies'][etype] = {'w': ims[0].width, 'h': ims[0].height, 'frames': frame_names(etype)}


def preview(path, zoom=6):
    rows = [(t, frames(t)) for t in DESIGNS]
    cw = max(im.width for _, ims in rows for im in ims) + 4
    ch = [max(im.height for im in ims) + 4 for _, ims in rows]
    cols = max(len(ims) for _, ims in rows)
    sheet = Image.new('RGBA', (cw * cols, sum(ch)), (38, 34, 60, 255))
    y = 0
    for (t, ims), hh in zip(rows, ch):
        for i, im in enumerate(ims):
            sheet.alpha_composite(im, (i * cw + 2, y + hh - 2 - im.height))
        y += hh
    sheet.resize((sheet.width * zoom, sheet.height * zoom), Image.NEAREST).save(path)


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'px')
    if len(sys.argv) > 1:
        preview(sys.argv[1])
        print('preview', sys.argv[1])
    else:
        man_path = os.path.join(root, 'manifest.json')
        man = json.load(open(man_path))
        build(root, man)
        with open(man_path, 'w') as fh:
            json.dump(man, fh, separators=(',', ':'))
        print('wrote', len(DESIGNS), 'beastkin sheets')
