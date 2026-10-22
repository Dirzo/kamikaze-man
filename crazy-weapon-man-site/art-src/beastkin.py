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


# ================================================================ zone 1: the goose family (swords)
R.update({
    'goose': ramp('#2e2e3e', '#5a5a6e', '#9a9aac', '#ccccd6', '#eeece6', '#ffffff'),
    'greyg': ramp('#1e1c24', '#36323a', '#565058', '#7e7676', '#a89e94', '#d0c6b6'),
    'gosl': ramp('#4a3010', '#8a6418', '#c8a028', '#ecc840', '#fce070', '#fff4b0'),
    'beak': ramp('#4a1a06', '#8a3410', '#c85a1c', '#f08a2c', '#ffb450', '#ffd890'),
    'canada': ramp('#1c120c', '#34241a', '#54402c', '#7a6042', '#a0845e', '#c4aa80'),
    'swan': ramp('#08070c', '#141019', '#221c2a', '#383046', '#544a64', '#7a7090'),
    'ghost': ramp('#1c3040', '#2e5068', '#4c7c94', '#7aaac0', '#b0d8e6', '#e6fbff'),
    'rust': ramp('#2a140a', '#4a2412', '#6e381c', '#94522a', '#b4703a', '#d0904e'),
    'plume': ramp('#2a0c34', '#4a1660', '#6e2a8c', '#9a48b8', '#c47ad8', '#ecb4f4'),
})


def sword(c, gx, gy, ang, L, rp='steel', w=2, guard='gold', hilt='leather', gw=2.5, pommel=True):
    """A sword gripped at (gx, gy), the blade pointing along ang; L is the blade's length."""
    dx, dy = math.cos(ang), math.sin(ang)
    nx, ny = -dy, dx
    part = c._new(True)
    for t in (-2.5, -1.5, -0.5, 0.5):  # the grip
        c.put(gx + dx * t, gy + dy * t, (hilt, 3 if t < 0 else 2), part)
    if pommel:
        c.put(gx - dx * 3.4, gy - dy * 3.4, (guard, 4), part)
    gp = c._new(True)
    for k in range(-int(gw * 2), int(gw * 2) + 1):  # the crossguard
        c.put(gx + dx * 1.5 + nx * k / 2, gy + dy * 1.5 + ny * k / 2, (guard, 4 if k < 0 else 3), gp)
    bp = c._new(True)
    t = 2.2
    while t <= L + 2:
        tip = t > L
        for k in range(w):
            off = k - (w - 1) / 2
            if tip and w > 1 and abs(off) > 0.6:
                continue
            c.put(gx + dx * t + nx * off, gy + dy * t + ny * off, (rp, 5 if (k == 0 or tip) else 2 if k == w - 1 else 4), bp)
        t += 0.5


def smear(c, cx_, cy_, r, a0, a1, col=(255, 250, 235)):
    """the swing's crescent: an arc of light that brightens toward the blade"""
    n = max(6, int(abs(a1 - a0) * r * 1.3))
    for i in range(n + 1):
        a, f = a0 + (a1 - a0) * i / n, i / n
        cc = mix((110, 130, 190), col, f)
        c.put(cx_ + math.cos(a) * r, cy_ + math.sin(a) * r, cc, thin=True, flat=True)
        if f > 0.4:
            c.put(cx_ + math.cos(a) * (r - 1), cy_ + math.sin(a) * (r - 1), mix(cc, (90, 110, 170), 0.45), thin=True, flat=True)


# a goose's pose for a frame: where the head goes, where the sword hand is (relative to the
# shoulder, in units of the goose's size) and which way the blade points
def gpose(name):
    P_ = {'neck': 'up', 'hand': (3.6, 2.6), 'ang': -1.05, 'smear': None}
    if name == 'draw':
        P_.update(neck='back', hand=(-1.5, -3.8), ang=-2.5)
    elif name == 'loose':
        P_.update(neck='strike', hand=(6.2, 2.4), ang=0.55, smear=(-2.1, 0.55))
    elif name == 'hit':
        P_.update(neck='recoil', hand=(0.5, 3.6), ang=1.25)
    elif name == 'honk':
        P_.update(neck='honk', hand=(2.4, 3.4), ang=0.9)
    return P_


def goose(c, p, s, body, pose=None, *, neck_rp=None, head_rp=None, cap=None, blade=None, belly=None, chin=None,
          wing_rp=None, eye_col=None, back=None, front=None, feet=True, tail=True, fur=0.12):
    """The goose body every member shares: webbed feet, a round body, an S-neck, a head with an
    orange beak and an angry brow, and the near wing holding a sword. back/front draw extras
    behind the body / over everything (shields, second swords, armour)."""
    g = dict(gpose(p.name), **(pose or {}))
    base = c.h - 2
    neck_rp, wing_rp = neck_rp or body, wing_rp or body
    head_rp = head_rp or neck_rp
    rx, ry = 6.6 * s * (1 + p.sq * 0.4), 5.0 * s * (1 - p.sq * 0.5)
    bx = c.w * 0.40 + p.lean * s + g.get('dx', 0) * s
    by = base - 2.6 * s - ry + p.bob + g.get('dy', 0) * s
    shx, shy = bx + 0.6 * s, by - ry * 0.35
    L = {'bx': bx, 'by': by, 'rx': rx, 'ry': ry, 'shx': shx, 'shy': shy, 's': s, 'g': g}
    if back:
        back(c, p, L)
    if feet and not g.get('tuck'):
        for side, st in ((-1, p.step), (1, -p.step)):
            fx = bx + side * 2.2 * s + st * 1.6 * s
            lift = max(0, -st) * 1.5
            c.line([(fx, by + ry - 1), (fx, base - 1 - lift)], ('beak', 2))
            c.ball(fx + 1.2 * s, base - 0.8 - lift, 1.9 * s, 0.9, 'beak', lift=0.2)
    elif g.get('tuck'):
        c.ball(bx - 1.5 * s, by + ry - 0.5, 1.8 * s, 1.0, 'beak'); c.ball(bx + 1.5 * s, by + ry, 1.8 * s, 1.0, 'beak')
    if tail:
        c.poly([(bx - rx - 2.4 * s, by - 3.2 * s), (bx - rx + 2 * s, by - 2 * s), (bx - rx + 2 * s, by + 1.6 * s)], body, base=3)
    c.ball(bx, by, rx, ry, body, fur=fur, tufts=16, tex=2, under=0.5)
    if belly:
        belly(c, p, L)
    # neck and head
    nk = g['neck']
    hx, hy = {
        'honk': (bx + rx + 4.6 * s, by - ry * 0.4),
        'back': (bx + rx * 0.3, by - ry - 5.2 * s),
        'strike': (bx + rx * 0.95 + 1.4 * s, by - ry - 3.6 * s),
        'recoil': (bx + rx * 0.15, by - ry - 4.4 * s),
        'low': (bx + rx + 2.6 * s, by - ry * 0.9),
    }.get(nk, (bx + rx * 0.62, by - ry - 5.4 * s))
    nx0, ny0 = bx + rx * 0.5, by - ry * 0.45
    mx, my = (nx0 + hx) / 2 - 1.3 * s, (ny0 + hy) / 2 + 0.6 * s
    c.capsule(nx0, ny0, mx, my, 2.1 * s, 1.8 * s, neck_rp)
    c.capsule(mx, my, hx, hy + 0.6 * s, 1.8 * s, 1.6 * s, neck_rp, lift=0.1)
    if chin:
        c.ball(hx - 0.3 * s, hy + 1.2 * s, 1.7 * s, 1.1 * s, chin, lift=0.35)
    c.ball(hx, hy, 2.7 * s, 2.5 * s, head_rp, lift=0.15)
    if nk == 'honk':  # beak wide open
        c.poly([(hx + 1.6 * s, hy - 1.3 * s), (hx + 6.6 * s, hy - 1.8 * s), (hx + 1.8 * s, hy + 0.1 * s)], 'beak', base=4)
        c.poly([(hx + 1.6 * s, hy + 0.9 * s), (hx + 5.8 * s, hy + 2.8 * s), (hx + 1.8 * s, hy + 1.9 * s)], 'beak', base=2)
        c.put(hx + 2.6 * s, hy + 0.5 * s, R['red'][1], flat=True)
    else:
        c.poly([(hx + 1.6 * s, hy - 1.1 * s), (hx + 6 * s, hy + 0.4 * s), (hx + 1.6 * s, hy + 1.5 * s)], 'beak', base=4)
        c.put(hx + 3.4 * s, hy + 0.3 * s, ('beak', 1), flat=True)
    ex, ey = int(round(hx + 0.4 * s)), int(round(hy - 0.8 * s))
    if p.hit:
        c.dot(ex, ey - 1, INK); c.dot(ex + 1, ey, INK); c.dot(ex, ey + 1, INK)
    elif eye_col:
        c.dot(ex, ey, eye_col); c.dot(ex + 1, ey, eye_col); c.dot(ex - 1, ey - 1, INK); c.dot(ex, ey - 1, INK)
    else:
        c.dot(ex, ey, INK); c.dot(ex + 1, ey, INK); c.dot(ex, ey - 1, WHITE)
        c.dot(ex - 1, ey - 2, INK); c.dot(ex, ey - 2, INK); c.dot(ex + 1, ey - 1, INK)  # the angry brow
    if cap:
        cap(c, hx, hy, s, p)
    L.update(hx=hx, hy=hy)
    # the sword wing
    hx2, hy2 = shx + g['hand'][0] * s, shy + g['hand'][1] * s
    if blade and not g.get('bare'):
        if g['smear']:
            smear(c, shx, shy, blade[1] + 3.5 * s, *g['smear'])
        sword(c, hx2, hy2, g['ang'], blade[1], rp=blade[0], **(blade[2] if len(blade) > 2 else {}))
    c.capsule(shx - 1.5 * s, shy, hx2, hy2, 2.6 * s, 1.4 * s, wing_rp, lift=-0.1)
    c.ball(hx2, hy2, 1.4 * s, 1.3 * s, wing_rp, lift=0.2)
    L.update(hx2=hx2, hy2=hy2)
    if front:
        front(c, p, L)
    return L


# ---- 1. Gosling: a fluffy yellow gosling with a wooden practice sword. Waddles up and pokes.
def gosling(c, p):
    base = c.h - 2
    bx, by = 8 + p.lean, base - 5.4 + p.bob
    for side, st in ((-1, p.step), (1, -p.step)):
        fx = bx + side * 1.6 + st
        c.ball(fx + 0.8, base - 0.8 - max(0, -st), 1.5, 0.8, 'beak', lift=0.2)
    c.ball(bx, by, 5 * (1 + p.sq * 0.5), 4.3 * (1 - p.sq * 0.5), 'gosl', fur=0.35, tufts=12, tex=1, under=0.5)
    hx, hy = bx + 2.4 + (1 if p.name == 'loose' else 0), by - 5 + (1 if p.hit else 0)
    c.ball(hx, hy, 3.4, 3.1, 'gosl', fur=0.3, tufts=8, phase=0.3, lift=0.15)
    c.ball(hx - 1, hy - 3.2, 1, 1.2, 'gosl', fur=0.4, tufts=3, lift=0.3)
    c.poly([(hx + 2.4, hy - 0.4), (hx + 5, hy + 0.6), (hx + 2.4, hy + 1.6)], 'beak', base=4)
    if p.hit:
        eyes(c, int(hx), int(hy) - 1, 0, True)
    else:
        c.dot(int(hx) + 1, int(hy) - 1, INK); c.dot(int(hx) + 1, int(hy) - 2, WHITE)
    hand, ang = {'draw': ((-1, -3.5), -2.3), 'loose': ((5, 0.5), 0.15), 'hit': ((1, 2.5), 1.2)}.get(p.name, ((3, 1), -0.7))
    gx, gy = bx + 1 + hand[0], by - 0.5 + hand[1]
    if p.name == 'loose':
        smear(c, bx + 1, by - 0.5, 9, -1.8, 0.2)
    sword(c, gx, gy, ang, 5.5, rp='twig', w=2, guard='wood', hilt='leather', gw=1.5, pommel=False)
    c.capsule(bx - 0.5, by - 0.5, gx, gy, 1.6, 1.0, 'gosl', lift=-0.1)
    c.ball(gx, gy, 1.1, 1.1, 'gosl', lift=0.2)


# ---- 2. Honker: the classic white goose with a short sword. Its honk is a shockwave you can see
# that shoves you back; then it comes in swinging.
def honker(c, p):
    def knob(c, hx, hy, s, p):
        c.ball(hx + 1.9 * s, hy - 1.4 * s, 1.0, 0.9, 'beak', lift=0.2)
    goose(c, p, 1.0, 'goose', cap=knob, blade=('steel', 8))


# ---- 3. Gander Squire: a goose in a pot helm behind a round shield. Blocks hits from the front
# (go round it, or crit it) and bashes with the shield.
def gsquire(c, p):
    def helm(c, hx, hy, s, p):
        c.ball(hx - 0.3, hy - 1.4, 3.1, 2.4, 'steel', clip=lambda x, y: y <= hy - 0.6)
        c.line([(hx - 3.4, hy - 0.6), (hx + 2.8, hy - 0.6)], ('steel', 1))
    pose = {'bash': {'hand': (2, 3.4), 'ang': 1.0, 'neck': 'strike'}, 'draw': {'hand': (-1.6, -3.2), 'ang': -2.2, 'neck': 'up'}}.get(p.name)

    def shield(c, p, L):
        out = 4.6 if p.name == 'bash' else 2.8 if p.name != 'draw' else 2.2
        sx, sy = L['bx'] + L['rx'] * 0.6 + out, L['by'] - 0.5
        c.ball(sx, sy, 2.6, 5.4, 'wood', lift=0.1, tex=4)
        c.ball(sx + 0.3, sy, 1.4, 1.6, 'steel', lift=0.3)  # the boss
        c.line([(sx - 0.5, sy - 5.2), (sx + 1.6, sy - 4.2)], ('steel', 4))
    goose(c, p, 1.0, 'goose', pose=pose, cap=helm, blade=('steel', 7), front=shield)


# ---- 4. Goose Fencer: a grey goose in a plumed hat with a rapier. Lines up a long lunge across
# the floor (you can see the line coming): get out of the way, then punish it.
def fencer(c, p):
    def hat(c, hx, hy, s, p):
        c.ball(hx - 0.4, hy - 2.4, 4.6, 1.2, 'leather', lift=0.1)  # the brim
        c.ball(hx - 0.6, hy - 3.6, 2.4, 1.8, 'leather', lift=0.2, clip=lambda x, y: y <= hy - 2.4)
        c.capsule(hx - 1.6, hy - 4.2, hx - 5.4, hy - 6.4, 1.2, 0.6, 'plume', lift=0.2)
    pose = {'lunge': {'hand': (9.0, 0.8), 'ang': 0.02, 'neck': 'low', 'dx': 1.5, 'dy': 0.6},
            'draw': {'hand': (-2.6, 0.4), 'ang': 0.0, 'neck': 'up'},
            'loose': {'hand': (8.0, 1.0), 'ang': 0.05, 'neck': 'strike', 'smear': None}}.get(p.name)
    goose(c, p, 1.0, 'greyg', pose=pose, cap=hat, belly=lambda c, p, L: c.ball(L['bx'] + 1.6, L['by'] + 2, 4, 2.4, 'bone', lift=0.1),
          blade=('steel', 12, {'w': 1, 'gw': 1.5, 'guard': 'gold'}))


# ---- 5. Blade Tosser: a Canada goose that flings its broadsword like a boomerang and catches it
# on the way back. Without it, it's open.
def gtoss(c, p):
    bare = p.name in ('throw', 'bare0', 'bare1')
    pose = {'throw': {'hand': (6.4, -0.6), 'ang': 0, 'neck': 'strike', 'bare': True},
            'bare0': {'hand': (2.8, 3.2), 'ang': 0, 'bare': True},
            'bare1': {'hand': (2.8, 3.2), 'ang': 0, 'bare': True}}.get(p.name)
    goose(c, p, 1.0, 'canada', pose=pose, neck_rp='swan', chin='goose',
          belly=lambda c, p, L: c.ball(L['bx'] + 2, L['by'] + 1.8, 4.2, 2.6, 'bone', lift=0.05),
          blade=('steel', 8, {'w': 3, 'gw': 2.5}))


# ---- 6. Whirlwind Goose: spins with its longsword out and comes across the floor like a
# buzzsaw, then staggers about dizzy. Jump it, then hit it while it's seeing stars.
def whirl(c, p):
    spin = p.name.startswith('spin')
    k = int(p.name[-1]) if spin else 0
    def sash(c, p, L):
        c.capsule(L['bx'] - L['rx'] * 0.6, L['by'] - 1.5, L['bx'] + L['rx'] * 0.7, L['by'] + 1, 1.2, 1.2, 'red', lift=0.1)
    if spin:
        a = [0.2, 2.3, 4.4][k]
        pose = {'hand': (math.cos(a) * 4, math.sin(a) * 2.5 + 0.5), 'ang': a, 'neck': 'up', 'smear': (a - 2.6, a)}
        q = P('idle1')
        q.name = p.name
        p = q
    else:
        pose = None
    goose(c, p, 1.0, 'greyg', pose=pose, belly=sash, blade=('steel', 10))


# ---- 7. Grave Goose: the ghost of a goose that guarded a sword grave, with its cracked old blade.
# Your hits pass straight through it while it drifts; it is only solid when it attacks.
def ggrave(c, p):
    def wisps(c, p, L):
        b, s = L['by'] + L['ry'] - 1, L['s']
        for i, x in enumerate((-4, -1, 2)):
            c.capsule(L['bx'] + x, b - 1, L['bx'] + x - 1 - (i + p.step) % 2, b + 3 + i % 2, 1.4, 0.5, 'ghost', lift=-0.2)
    goose(c, p, 1.0, 'ghost', back=wisps, feet=False, eye_col=(120, 255, 220), blade=('rust', 9, {'guard': 'rust', 'hilt': 'rust'}))


# ---- 8. Goose Berserker: war paint, a red headband and a sword under each wing. Comes in with a
# three-hit flurry, and goes faster when it's hurt.
def berserker(c, p):
    def band(c, hx, hy, s, p):
        c.line([(hx - 2.6, hy - 1.6), (hx + 2.2, hy - 1.8)], ('red', 3), w=2)
        c.line([(hx - 2.6, hy - 1.2), (hx - 5, hy + 0.2 + p.bob)], ('red', 2))
        c.line([(hx + 0.4, hy - 0.2), (hx + 1.6, hy + 0.6)], R['red'][3], flat=True)  # war paint
    far = {'loose': (5.4, -2.4, -0.5), 'loose2': (6.6, 1.8, 0.6), 'loose3': (3, -5, -1.6), 'draw': (-2, -2, -2.0), 'hit': (0, 3, 1.4)}.get(p.name, (-0.6, 2.6, -0.6))
    def second(c, p, L):  # the far wing's sword, behind the body
        sword(c, L['shx'] + far[0], L['shy'] + far[1] - 1, far[2], 8)
    pose = {'loose2': {'hand': (5.8, -2.6), 'ang': -0.7, 'neck': 'strike', 'smear': (1.2, -0.7)},
            'loose3': {'hand': (7.0, 3.6), 'ang': 1.1, 'neck': 'strike', 'smear': (-2.6, 1.1), 'dy': 0.6}}.get(p.name)
    goose(c, p, 1.05, 'goose', pose=pose, cap=band, back=second, blade=('steel', 8))


# ---- 9. Black Swan Duelist: tall, elegant and very good. Takes a guard stance; hit it from the
# front while it's on guard and it parries and ripostes. Wait it out, or get behind it.
def swan(c, p):
    def crest(c, hx, hy, s, p):
        c.put(hx + 2.6 * s, hy - 0.6 * s, ('red', 4), flat=True)
    pose = {'guard': {'hand': (5.2, -1.2), 'ang': -1.6, 'neck': 'back'}}.get(p.name)
    goose(c, p, 1.25, 'swan', pose=pose, cap=crest, blade=('steel', 13, {'guard': 'steel', 'gw': 2.0}))
    # the swan's red beak: recolour the goose's orange
    for y in range(c.h):
        for x in range(c.w):
            col = c.col[y][x]
            if isinstance(col, tuple) and col and col[0] == 'beak' and y < c.h * 0.55:
                c.col[y][x] = ('red', min(5, col[1] + 1))


# ---- 10. War Gander: a huge goose in plate with a gold crown helm and a claymore. Leaps across
# and crashes down where you stand, and plunges its sword into the graveyard to raise a ring of
# old blades out of the ground. Light hits barely move it.
def gander(c, p):
    def crown(c, hx, hy, s, p):
        c.ball(hx - 0.2, hy - 1.6 * s, 3.2 * s, 2.2 * s, 'steel', clip=lambda x, y: y <= hy - 1.1 * s, lift=0.1)
        for k in (-2, 0, 2):
            c.poly([(hx + k * s - 0.9, hy - 3.2 * s), (hx + k * s, hy - 5.2 * s), (hx + k * s + 0.9, hy - 3.2 * s)], 'gold', base=4)
        c.line([(hx - 3 * s, hy - 3.1 * s), (hx + 2.6 * s, hy - 3.1 * s)], ('gold', 3))
    def plate(c, p, L):
        c.ball(L['bx'] + 1.2 * L['s'], L['by'] - 0.4, L['rx'] * 0.72, L['ry'] * 0.82, 'steel', lift=-0.15, tex=0)
        for k in (-1, 1):  # the plates' rivets
            c.put(L['bx'] + 1.2 * L['s'] + k * 3, L['by'] - L['ry'] * 0.4, ('gold', 4), flat=True)
        c.line([(L['bx'] + 1.2 * L['s'], L['by'] - L['ry'] * 0.7), (L['bx'] + 1.2 * L['s'], L['by'] + L['ry'] * 0.6)], ('gold', 3))
    pose = {'leap': {'hand': (-1, -4.4), 'ang': -2.0, 'neck': 'up', 'tuck': True, 'dy': -3},
            'plunge': {'hand': (5.0, 3.0), 'ang': 1.45, 'neck': 'strike', 'dy': 0.4}}.get(p.name)
    goose(c, p, 1.65, 'goose', pose=pose, cap=crown, belly=plate, blade=('steel', 17, {'w': 3, 'gw': 3.5}))


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
    # zone 1, the goose family (swords)
    'gosling': (24, 18, gosling, []),
    'honker': (34, 30, honker, ['honk']),
    'gsquire': (34, 30, gsquire, ['bash']),
    'fencer': (40, 32, fencer, ['lunge']),
    'gtoss': (34, 30, gtoss, ['throw', 'bare0', 'bare1']),
    'whirl': (40, 32, whirl, ['spin0', 'spin1', 'spin2']),
    'ggrave': (34, 30, ggrave, []),
    'berserker': (38, 32, berserker, ['loose2', 'loose3']),
    'swan': (44, 40, swan, ['guard']),
    'gander': (58, 52, gander, ['leap', 'plunge']),
}


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


def preview(path, zoom=6, only=None):
    rows = [(t, frames(t)) for t in DESIGNS if not only or t in only]
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


def cli():
    root = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'px')
    if len(sys.argv) > 1:
        only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
        preview(sys.argv[1], only=only)
        print('preview', sys.argv[1])
    else:
        man_path = os.path.join(root, 'manifest.json')
        man = json.load(open(man_path))
        build(root, man)
        with open(man_path, 'w') as fh:
            json.dump(man, fh, separators=(',', ':'))
        print('wrote', len(DESIGNS), 'beastkin sheets')


# the other zones' families live in their own files and add themselves to R and DESIGNS
import beastkin_lagoon  # noqa: E402,F401  zone 3, turtles and frogs (nunchucks)

if __name__ == '__main__':
    import beastkin  # run as the module itself, so the families above register into one DESIGNS
    beastkin.cli()
