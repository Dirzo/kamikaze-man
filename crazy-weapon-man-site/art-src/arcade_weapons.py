"""Arcade-cut held weapons: bigger, shaded, and every one with its own cut-out silhouette.

Same format as weapons.py (pointing right, grip at (gx, gy), A / M / Z are the tinted light / mid /
dark marker shades, other letters are fixed palette colours from weapons.KEY, 'w' is a paper glint)
so the in-game look pipeline (game-src/game/looks.js) recolours and decorates them unchanged.
They are drawn with a few small helpers instead of typed rows so every variant can carry its own
holes, notches, hooks and teeth:

  blade()   a shaded blade along x with a width profile, a fuller groove and a glint
  hole()    punch a cut-out (round, slot or diamond); the outline pass rings it in ink
  wrap()    a cord- or leather-wrapped grip; shaft() a long pole with metal bands

Lengths roughly match each type's melee reach in data/weapons.js, so what you see is what hits.
"""
import math


class Grid:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.c = [['.'] * w for _ in range(h)]

    def put(self, x, y, ch):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.c[y][x] = ch

    def get(self, x, y):
        return self.c[y][x] if 0 <= x < self.w and 0 <= y < self.h else '.'

    def rect(self, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, ch)

    def rows(self):
        return [''.join(r) for r in self.c]


def shade(top, bot, y):
    """light on the upper edge, dark on the lower edge, mid in between"""
    return 'A' if y == top else 'Z' if y == bot else 'M'


def blade(g, x0, x1, yc, prof, fuller=None, glint=True, edge_lit=True):
    """prof(t) -> (up, down) half heights at t in 0..1 from x0 to x1"""
    for x in range(x0, x1 + 1):
        t = (x - x0) / max(1, x1 - x0)
        up, dn = prof(t)
        top, bot = yc - up, yc + dn
        for y in range(top, bot + 1):
            g.put(x, y, shade(top, bot, y) if bot > top else 'A')
        if fuller and fuller[0] <= t <= fuller[1] and bot - top >= 3:
            g.put(x, yc, 'Z')
    if glint:  # a specular glint two thirds of the way up the blade
        gx = x0 + int((x1 - x0) * 0.72)
        up, _ = prof((gx - x0) / max(1, x1 - x0))
        g.put(gx, yc - up + 1, 'w')
        g.put(gx + 1, yc - up + 1, 'w')


def taper(base_up, base_dn, start=0.75, tip_up=0, tip_dn=0):
    """straight blade that narrows to a point after `start`"""
    def f(t):
        if t < start:
            return base_up, base_dn
        k = (t - start) / (1 - start)
        return round(base_up + (tip_up - base_up) * k), round(base_dn + (tip_dn - base_dn) * k)
    return f


def hole(g, cx, cy, kind='round', r=1):
    if kind == 'round':
        for y in range(-r, r + 1):
            for x in range(-r, r + 1):
                if x * x + y * y <= r * r + r * 0.6:
                    g.put(cx + x, cy + y, '.')
    elif kind == 'slot':  # horizontal slot of length r*2+1
        for x in range(-r, r + 1):
            g.put(cx + x, cy, '.')
    elif kind == 'diamond':
        for y in range(-r, r + 1):
            for x in range(-r, r + 1):
                if abs(x) + abs(y) <= r:
                    g.put(cx + x, cy + y, '.')
    elif kind == 'dot':
        g.put(cx, cy, '.')


def notch(g, x, y, d=1, depth=1):
    """bite out of an edge: d = +1 bites down from the top edge, -1 up from the bottom edge"""
    for i in range(depth):
        g.put(x, y + i * d, '.')


def wrap(g, x0, x1, yc, a='b', b='B', h=1):
    """diagonal cord wrap over a grip h pixels thick above and below yc"""
    for x in range(x0, x1 + 1):
        for y in range(yc - h + 1, yc + h + 1):
            g.put(x, y, a if (x + y) % 2 else b)


def shaft(g, x0, x1, yc, bands=(), band='f', top='B', bot='b'):
    for x in range(x0, x1 + 1):
        g.put(x, yc, top)
        g.put(x, yc + 1, bot)
    for bx in bands:
        g.put(bx, yc - 1, band)
        g.put(bx, yc, 'm')
        g.put(bx, yc + 1, band)
        g.put(bx, yc + 2, band)


def guard(g, x, yc, up, dn, ch='y', shade_ch='Y', w=1):
    for xx in range(x, x + w):
        for y in range(yc - up, yc + dn + 1):
            g.put(xx, y, ch if y <= yc else shade_ch)


def pommel(g, x, yc, ch='y'):
    g.put(x, yc, ch)
    g.put(x, yc + 1, 'Y')
    g.put(x - 1, yc, 'Y') if x > 0 else None


def out(g, grip):
    rows = [r.rstrip('.') or '.' for r in g.rows()]
    return (grip, rows)


# ------------------------------------------------------------------------------- swords
def sword(length=20, up=2, dn=2, guard_h=3, holes=(), notches=(), fuller=(0.05, 0.6), grip_len=4, tip=0.78, hook=False, lugs=False):
    W = grip_len + 2 + length + 1
    H = max(up, guard_h) + max(dn, guard_h) + 3
    yc = max(up, guard_h) + 1
    g = Grid(W, H)
    wrap(g, 1, grip_len, yc, h=1)
    pommel(g, 0, yc)
    gx0 = grip_len + 1
    guard(g, gx0, yc, guard_h, guard_h)
    if hook:  # forward-swept quillons
        g.put(gx0 + 1, yc - guard_h, 'y')
        g.put(gx0 + 1, yc + guard_h, 'Y')
    x0 = gx0 + 1
    blade(g, x0, x0 + length - 1, yc, taper(up, dn, tip), fuller=fuller)
    if lugs:  # ricasso lugs: little spikes past the guard
        g.put(x0 + 3, yc - up - 1, 'f')
        g.put(x0 + 3, yc + dn + 1, 'f')
    for (fx, kind, r) in holes:
        hole(g, x0 + int(length * fx), yc, kind, r)
    for (fx, d) in notches:
        x = x0 + int(length * fx)
        notch(g, x, yc - up if d > 0 else yc + dn, d)
    return out(g, (grip_len - 1, yc))


def dagger(length=10, up=2, dn=1, holes=(), serrate=False, clip=False, ring=False, wavy=False):
    W = length + 6
    H = 9
    yc = 4
    g = Grid(W, H)
    wrap(g, 1, 3, yc, h=1)
    pommel(g, 0, yc)
    guard(g, 4, yc, 2, 2)
    if ring:  # finger ring through the guard (a cut-out loop)
        for (x, y) in ((3, yc + 3), (4, yc + 4), (5, yc + 4), (6, yc + 3), (6, yc + 2)):
            g.put(x, y, 'y')
    x0 = 5
    if wavy:  # kris-style waves along the blade
        prof = lambda t: (up + (1 if math.sin(t * 9) > 0.3 else 0) - (2 if t > 0.85 else 0), dn - (1 if t > 0.9 else 0))
    elif clip:  # bowie: clipped spine toward the point
        prof = lambda t: (up if t < 0.6 else max(0, round(up - (t - 0.6) * 6)), dn if t < 0.85 else 0)
    else:
        prof = taper(up, dn, 0.55)
    blade(g, x0, x0 + length - 1, yc, prof, fuller=(0.05, 0.5) if up + dn >= 3 else None)
    for (fx, kind, r) in holes:
        hole(g, x0 + int(length * fx), yc, kind, r)
    if serrate:
        for x in range(x0 + 1, x0 + length - 3, 2):
            notch(g, x, yc - up, 1)
    return out(g, (2, yc))


def katana(length=24, grip_len=6, curve=2.5, wrap_a='k', wrap_b='K', wide=0, flare=False):
    W = grip_len + 2 + length + 1
    H = 11 + wide
    yc = 7 + wide
    g = Grid(W, H)
    wrap(g, 0, grip_len - 1, yc, wrap_a, wrap_b, h=1)
    g.put(0, yc, 'f')
    g.put(0, yc + 1, 'f')
    # round tsuba with a cut-out
    gx = grip_len
    for y in range(yc - 2, yc + 4):
        g.put(gx, y, 'y' if y < yc + 1 else 'Y')
    g.put(gx + 1, yc - 2, 'y')
    g.put(gx + 1, yc + 3, 'Y')
    g.put(gx, yc + 2, '.')  # sukashi window
    x0 = gx + 1
    for x in range(x0, x0 + length):
        t = (x - x0) / (length - 1)
        lift = round(curve * t * t * 2)  # the blade bows upward toward the tip
        up = 2 + wide + (1 if flare and t > 0.7 else 0) - (1 if t > 0.9 else 0)
        dn = 0 if t > 0.94 else 1
        top, bot = yc - lift - up, yc - lift + dn
        for y in range(top, bot + 1):
            g.put(x, y, 'A' if y == bot else 'Z' if y == top else 'M')  # the edge (bottom) catches the light: hamon
        if 0.3 < t < 0.75 and bot - top >= 2 and (x % 5 == 0):
            g.put(x, bot - 1, 'w')  # hamon line
    g.put(x0 + 1, yc, 'y')  # habaki collar
    g.put(x0 + 1, yc - 1, 'y')
    return out(g, (grip_len - 2, yc))


# ------------------------------------------------------------------------------- blunt
def hammer(shaft_len=17, head_w=8, head_h=12, kind='war'):
    W = shaft_len + head_w + 3
    H = head_h + 2
    yc = H // 2 - 1
    g = Grid(W, H)
    shaft(g, 1, shaft_len, yc, bands=(5, shaft_len - 4))
    g.put(0, yc, 'y')
    g.put(0, yc + 1, 'Y')
    wrap(g, 1, 4, yc, h=1)
    hx = shaft_len + 1
    top, bot = yc - head_h // 2 + 1, yc + head_h // 2
    if kind == 'war':  # steel block with bevelled faces, rivets, a lightening window and a back spike
        for x in range(hx, hx + head_w):
            for y in range(top, bot + 1):
                g.put(x, y, 'A' if y == top or x == hx + head_w - 1 else 'Z' if y == bot or x == hx else 'M')
        g.rect(hx + 2, yc, hx + head_w - 3, yc + 1, '.')  # window
        for y in (top + 1, bot - 1):
            g.put(hx + 1, y, 'w')
            g.put(hx + head_w - 2, y, 'w')
        g.put(hx + head_w, top + 1, 'A')
        g.put(hx + head_w, bot - 1, 'Z')
    elif kind == 'maul':  # brick of iron, chunky corner chips
        for x in range(hx, hx + head_w):
            for y in range(top, bot + 1):
                g.put(x, y, 'A' if y <= top + 1 else 'Z' if y >= bot - 1 else 'M')
        for (x, y) in ((hx, top), (hx + head_w - 1, top), (hx, bot), (hx + head_w - 1, bot)):
            g.put(x, y, '.')
        for y in range(top + 3, bot - 2, 3):
            hole(g, hx + head_w // 2, y, 'slot', 1)
    elif kind == 'mallet':  # wooden barrel bound in tinted hoops
        for x in range(hx, hx + head_w):
            for y in range(top + 1, bot):
                g.put(x, y, 'B' if y < yc else 'b')
        for x in (hx, hx + head_w - 1):
            for y in range(top, bot + 1):
                g.put(x, y, 'M' if y < yc else 'Z')
        for y in range(top + 1, bot):
            g.put(hx + head_w // 2, y, 'A')
    elif kind == 'bonker':  # cartoon round head with a star punched through
        cx, cy, r = hx + head_w // 2, yc, head_w // 2 + 1
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                d = math.hypot(x - cx, y - cy)
                if d <= r + 0.3:
                    g.put(x, y, 'A' if y - cy < -r * 0.4 else 'Z' if y - cy > r * 0.4 else 'M')
        for (dx, dy) in ((0, -2), (0, -1), (-2, 0), (-1, 0), (0, 0), (1, 0), (2, 0), (0, 1), (-1, 2), (1, 2)):
            g.put(cx + dx, cy + dy, '.')
        g.put(cx - 2, cy - 3, 'w')
    return out(g, (3, yc))


def bit(g, xc, yc, length, back, front, d=1, bulge=2, eye=1):
    """axe bit hanging off the side of the haft (d = +1 below it, -1 above it), the way a real axe
    head sits: narrow at the eye, flaring to a long honed edge parallel to the haft. back / front
    are how far the edge reaches toward the hand / past the head; the edge bows out by `bulge`."""
    for k in range(1, length + 1):
        t = k / length
        l = xc - round(eye + (back - eye) * t ** 1.5)
        r = xc + round(eye + (front - eye) * t ** 1.5)
        for x in range(l, r + 1):
            g.put(x, yc + d * k, 'Z' if x == l else 'A' if x == r else 'M')
    # the edge row(s): bowed out in the middle, bright, glinting
    l, r = xc - back, xc + front
    for x in range(l, r + 1):
        m = 1 - abs((x - (l + r) / 2) / ((r - l) / 2 + 0.01))
        e = length + round(bulge * m)
        for k in range(length, e + 1):
            g.put(x, yc + d * k, 'M')
        g.put(x, yc + d * e, 'A')
        if (x - l) % 4 == 2:
            g.put(x, yc + d * (e - 1), 'w')


def axe(shaft_len=17, kind='crescent'):
    W = shaft_len + 9
    H = 21
    yc = 9
    g = Grid(W, H)
    shaft(g, 1, shaft_len + 2, yc)
    g.put(0, yc, 'y')
    g.put(0, yc + 1, 'Y')
    wrap(g, 1, 4, yc, h=1)
    xc = shaft_len - 1
    # the eye: a steel collar round the haft
    for x in range(xc - 1, xc + 2):
        g.put(x, yc - 1, 'f')
        g.put(x, yc + 2, 'f')
    if kind == 'crescent':  # bearded bit below the haft, a round cut-out and a top spike
        bit(g, xc, yc + 1, 9, back=7, front=3, d=1, bulge=2)
        hole(g, xc - 1, yc + 6, 'round', 1)
        for k in range(1, 4):
            g.put(xc, yc - k, 'f' if k < 3 else 'm')  # spike above the haft
    elif kind == 'cleaver':  # butcher's cleaver: a broad square blade with a hanging hole
        for y in range(yc + 2, yc + 10):
            for x in range(xc - 7, xc + 3):
                g.put(x, y, 'Z' if x == xc - 7 else 'A' if x == xc + 2 else 'M')
        for x in range(xc - 7, xc + 3):
            g.put(x, yc + 10, 'A')
            if x % 3 == 0:
                g.put(x, yc + 9, 'w')
        hole(g, xc, yc + 4, 'round', 1)
    elif kind == 'double':  # labrys: matching bits above and below, pierced
        bit(g, xc, yc + 1, 7, back=4, front=4, d=1, bulge=1)
        bit(g, xc, yc, 7, back=4, front=4, d=-1, bulge=1)
        hole(g, xc, yc + 5, 'dot')
        hole(g, xc, yc - 4, 'dot')
    return out(g, (3, yc))


def scythe(shaft_len=24, reach=11, sickle=False):
    W = shaft_len + 6
    H = reach + 4
    yc = 2
    g = Grid(W, H)
    shaft(g, 0 if not sickle else 1, shaft_len, yc, bands=() if sickle else (shaft_len - 6,))
    if sickle:
        wrap(g, 1, 4, yc, h=1)
        g.put(0, yc, 'y')
    else:
        g.put(6, yc - 1, 'B')  # snath grip peg
        g.put(6, yc - 2, 'b')
    # the blade sweeps down and back from the top of the shaft: a crescent, widest at the tang,
    # with the cutting edge on the inside curve, a round cut-out and a notched spine
    hx = shaft_len
    R = reach
    cx, cy = hx + 2 - R, yc
    base = 3 if sickle else 4
    for y in range(yc - 1, H):
        for x in range(0, W):
            r = math.hypot(x - cx, y - cy)
            th = math.degrees(math.atan2(y - cy, x - cx))
            if th < -8 or th > 105:
                continue
            k = max(0.0, th) / 105
            wdt = base * (1 - k) ** 0.8 + 0.6
            if R + 1 - wdt <= r <= R + 1:
                g.put(x, y, 'Z' if r > R + 0.3 else 'A' if r < R + 1.6 - wdt else 'M')
    tx = cx + round((R - 1) * math.cos(math.radians(22)))
    ty = cy + round((R - 1) * math.sin(math.radians(22)))
    hole(g, tx, ty, 'round', 1 if not sickle else 0)
    for th in (45, 65):
        g.put(cx + round((R + 1) * math.cos(math.radians(th))), cy + round((R + 1) * math.sin(math.radians(th))), '.')
    g.put(hx + 1, yc, 'y')
    g.put(hx + 1, yc + 1, 'Y')
    return out(g, (3 if sickle else 2, yc))


def nunchucks(stick=8, kind='sticks'):
    W = stick + 6
    H = stick + 8
    g = Grid(W, H)
    # stick 1 horizontal (the one in the hand), chain, stick 2 hanging
    for x in range(0, stick):
        g.put(x, 1, 'A' if x not in (0, stick - 1) else 'f')
        g.put(x, 2, 'M' if x not in (0, stick - 1) else 'f')
        g.put(x, 3, 'Z' if x not in (0, stick - 1) else 'f')
    g.put(stick // 2, 2, 'w')
    for i in range(3):
        g.put(stick + i, 2 + i, 'f')
    cx = stick + 2
    if kind == 'sticks':
        for y in range(5, 5 + stick):
            g.put(cx, y, 'A' if y not in (5, 4 + stick) else 'f')
            g.put(cx + 1, y, 'M' if y not in (5, 4 + stick) else 'f')
            g.put(cx + 2, y, 'Z' if y not in (5, 4 + stick) else 'f')
        g.put(cx + 1, 5 + stick // 2, 'w')
    elif kind == 'flail':  # spiked ball on the chain
        for y in range(5, 8):
            g.put(cx, y, 'f')
        cy = 10
        for y in range(cy - 2, cy + 3):
            for x in range(cx - 2, cx + 3):
                if abs(x - cx) + abs(y - cy) <= 3:
                    g.put(x, y, 'A' if y < cy else 'Z' if y > cy else 'M')
        for (dx, dy) in ((0, -4), (-4, 0), (4, 0), (0, 4), (-3, -3), (3, 3), (3, -3), (-3, 3)):
            g.put(cx + dx, cy + dy, 'f')
        g.put(cx, cy, '.')
    elif kind == 'whackers':  # clubs that swell at the end, with a band
        for y in range(5, 5 + stick):
            w = 1 if y < 5 + stick // 2 else 2
            for x in range(cx - w + 1, cx + w + 2):
                g.put(x, y, 'A' if x == cx - w + 1 else 'Z' if x == cx + w + 1 else 'M')
        for x in range(cx - 1, cx + 4):
            g.put(x, 5 + stick // 2, 'y')
    return out(g, (1, 2))


# ------------------------------------------------------------------------------- poles
def staff(length=34, head='orb'):
    W = length + 8
    H = 11
    yc = 5
    g = Grid(W, H)
    shaft(g, 0, length, yc, bands=(1, length // 2, length - 2))
    hx = length + 1
    if head == 'orb':  # brass ring cradling a floating orb: the ring is a cut-out
        cx, cy = hx + 3, yc
        for a in range(0, 360, 12):
            x = cx + round(math.cos(math.radians(a)) * 3.6)
            y = cy + round(math.sin(math.radians(a)) * 4)
            g.put(x, y, 'y' if y <= cy else 'Y')
        for (x, y) in ((cx, cy - 1), (cx + 1, cy - 1), (cx - 1, cy), (cx, cy), (cx + 1, cy), (cx, cy + 1), (cx + 1, cy + 1)):
            g.put(x, y, 'M')
        g.put(cx, cy - 1, 'A')
        g.put(cx - 1, cy, 'A')
        g.put(cx + 1, cy + 1, 'Z')
        g.put(cx, cy, 'w')
    elif head == 'bands':  # fighting stave: iron-shod, tinted caps both ends, cord-wrapped middle
        wrap(g, length // 2 - 4, length // 2 + 4, yc, 'R', 'r', h=1)
        for x in (0, 1, length - 1, length):
            g.put(x, yc - 1, 'A')
            g.put(x, yc, 'M')
            g.put(x, yc + 1, 'M')
            g.put(x, yc + 2, 'Z')
    elif head == 'wings':  # scepter: gold wings around a jewel
        for i in range(4):
            g.put(hx + i, yc - 1 - i, 'y')
            g.put(hx + i, yc + 2 + i, 'Y')
            g.put(hx + i + 1, yc - 1 - i, 'y')
            g.put(hx + i + 1, yc + 2 + i, 'Y')
        g.rect(hx + 2, yc - 1, hx + 5, yc + 2, 'M')
        g.put(hx + 2, yc - 1, 'A')
        g.put(hx + 3, yc - 1, 'A')
        g.put(hx + 5, yc + 2, 'Z')
        g.put(hx + 3, yc, 'w')
        hole(g, hx + 1, yc + 4, 'dot')
    elif head == 'crook':  # walking stick curling back with a hanging charm
        for a in range(-90, 200, 15):
            for rr in (2.5, 3.5):
                x = hx + 1 + round(math.cos(math.radians(a)) * rr)
                y = yc - 1 + round(math.sin(math.radians(a)) * rr)
                g.put(x, y, 'B' if rr < 3 else 'b')
        g.put(hx - 2, yc + 3, 'A')
        g.put(hx - 2, yc + 4, 'M')
        g.put(hx - 1, yc + 4, 'M')
        g.put(hx - 2, yc + 5, 'Z')
    return out(g, (2, yc))


def spear(length=30, head='leaf'):
    W = length + 14
    H = 11
    yc = 5
    g = Grid(W, H)
    shaft(g, 0, length, yc, bands=(length - 1,))
    g.put(0, yc, 'f')
    g.put(0, yc + 1, 'f')
    hx = length + 1
    if head == 'leaf':  # leaf blade with a window cut-out and a red tassel
        blade(g, hx, hx + 11, yc, lambda t: (round(3.2 * math.sin(math.pi * min(1, t * 1.1)) ** 0.8), round(3.2 * math.sin(math.pi * min(1, t * 1.1)) ** 0.8)), glint=False)
        hole(g, hx + 5, yc, 'slot', 1)
        g.put(hx + 1, yc - 1, 'y')
        g.put(hx + 1, yc + 1, 'Y')
        g.put(hx + 2, yc - 2, 'w')
        for (x, y) in ((length - 2, yc + 2), (length - 3, yc + 3), (length - 1, yc + 3), (length - 2, yc + 4)):
            g.put(x, y, 'r')
    elif head == 'trident':
        for dy in (-3, 0, 3):
            for x in range(hx, hx + 7 + (2 if dy == 0 else 0)):
                g.put(x, yc + dy, 'A' if dy < 0 else 'M' if dy == 0 else 'Z')
            g.put(hx + 7 + (2 if dy == 0 else 0), yc + dy, 'A')
            g.put(hx + 6 + (2 if dy == 0 else 0), yc + dy - 1, 'A')  # barbs
        for y in range(yc - 3, yc + 4):
            g.put(hx, y, 'y' if y < yc else 'Y')
    elif head == 'lance':  # long cone behind a round vamplate
        for y in range(yc - 3, yc + 5):
            g.put(hx - 6, y, 'y' if y <= yc else 'Y')
            g.put(hx - 5, y, 'Y')
        blade(g, hx - 4, hx + 9, yc, lambda t: (round(2 * (1 - t)), round(2 * (1 - t)) + 1 if t < 0.95 else 0), glint=True)
        for x in range(hx - 3, hx + 7, 3):
            g.put(x, yc, 'Z')  # spiral grooves
    return out(g, (3, yc))


# ------------------------------------------------------------------------------- ranged
def bow(h=25, depth=4, tips='curl', riser_hole=True, spikes=False):
    w = depth + 7
    g = Grid(w, h)
    mid = (h - 1) / 2
    for y in range(h):
        t = y / (h - 1)
        bend = math.sin(math.pi * t)
        recurve = -1.4 * math.sin(math.pi * t * 2) ** 8 if tips == 'curl' else 0
        x = 2 + round(depth * bend + recurve)
        g.put(0, y, 'f')
        if abs(y - mid) <= 2.01:
            g.rect(x - 1, y, x + 1, y, 'b')
            g.put(x + 2, y, 'B')
        else:
            near = y < 2 or y > h - 3
            g.put(x, y, 'A' if near else 'M')
            g.put(x + 1, y, 'M' if near else 'Z')
            if abs(y - mid) < h * 0.3:
                g.put(x + 2, y, 'Z')
            if spikes and y % 5 == 0 and not near:
                g.put(x + 3, y, 'f')
    if riser_hole:  # arrow shelf window through the riser
        g.put(2 + depth, round(mid) - 3, '.')
        g.put(2 + depth, round(mid) + 3, '.')
    if tips == 'curl':
        g.put(1, 0, 'y')
        g.put(1, h - 1, 'y')
    rows = [r.rstrip('.') or '.' for r in g.rows()]
    return ((3, h // 2), rows)


def wand(length=13, head='star'):
    W = length + 6
    H = 9
    yc = 4
    g = Grid(W, H)
    for x in range(length):
        g.put(x, yc, 'B' if x % 4 else 'y')
        g.put(x, yc + 1, 'b' if x % 4 else 'Y')
    hx = length + 2
    if head == 'star':  # a star with its heart punched out
        for (dx, dy) in ((0, -3), (0, -2), (-1, -1), (0, -1), (1, -1), (-3, 0), (-2, 0), (-1, 0), (1, 0), (2, 0), (3, 0), (-1, 1), (0, 1), (1, 1), (-2, 2), (2, 2), (0, 2)):
            g.put(hx + dx, yc + dy, 'A' if dy < 0 else 'M' if dy == 0 else 'Z')
        g.put(hx, yc + 2, '.')
    elif head == 'twig':
        for (dx, dy) in ((-2, -1), (-1, -2), (0, -2), (1, -1), (1, 0), (-1, 1)):
            g.put(hx + dx, yc + dy, 'g' if dy < 0 else 'G')
        g.put(hx, yc, 'A')
        g.put(hx + 1, yc + 1, 'M')
    elif head == 'crystal':
        for dy in range(-3, 4):
            for dx in range(0, 4 - abs(dy) // 2):
                g.put(hx - 1 + dx, yc + dy, 'A' if dx == 0 else 'M' if dy < 1 else 'Z')
        g.put(hx, yc - 1, 'w')
    elif head == 'baton':
        g.rect(hx - 2, yc - 1, hx + 1, yc + 2, 'M')
        g.put(hx - 2, yc - 1, 'A')
        g.put(hx + 1, yc + 2, 'Z')
        hole(g, hx - 1, yc + 1, 'dot')
    return out(g, (1, yc))


def star(points=4, r=5, hole_r=1):
    n = r * 2 + 1
    g = Grid(n, n)
    c = r
    for y in range(n):
        for x in range(n):
            dx, dy = x - c, y - c
            d = math.hypot(dx, dy)
            a = math.atan2(dy, dx)
            lim = r * (0.38 + 0.62 * abs(math.cos(a * points / 2)) ** 3)
            if d <= lim:
                g.put(x, y, 'A' if dy < -0.5 else 'Z' if dy > 0.5 else 'M')
    hole(g, c, c, 'round' if hole_r > 0 else 'dot', hole_r)
    if hole_r == 0:
        g.put(c, c, 'f')
    return out(g, (c, c))


def disc(r=4):
    n = r * 2 + 1
    g = Grid(n, n)
    for y in range(n):
        for x in range(n):
            d = math.hypot(x - r, y - r)
            if r - 1.7 <= d <= r + 0.3:
                a = math.degrees(math.atan2(y - r, x - r)) % 90
                if a > 75:
                    continue  # four gaps cut in the ring
                g.put(x, y, 'A' if y < r else 'Z')
    return out(g, (1, r))


def boomerang(arm=7, holes=True, wing=False):
    n = arm + 3
    g = Grid(n + 1, n)
    for i in range(arm):
        g.put(i // 2 if not wing else 0, i, 'A')
        g.put(i // 2 + 1 if not wing else 1, i, 'M')
    for i in range(arm + 1):
        g.put(arm // 2 + i, arm - 1, 'M')
        g.put(arm // 2 + i, arm, 'Z')
    if holes:
        g.put(arm // 2 + arm // 2 + 1, arm - 1, '.')
        g.put(1, 2, '.') if not wing else None
    if wing:
        for i in range(arm):
            g.put(2 + i // 2, i + 1, 'M')
        g.put(3, arm - 2, 'f')
    return out(g, (arm // 2, arm - 1))


ARCADE = {
    'sword': sword(20, 2, 2, 3, holes=[(0.16, 'diamond', 1)]),
    'dagger': dagger(10, 2, 1, ring=True, holes=[(0.25, 'dot', 0)]),
    'katana': katana(24),
    'nunchucks': nunchucks(8),
    'bow': bow(25, 4),
    'wand': wand(13, 'star'),
    'staff': staff(32, 'orb'),
    'hammer': hammer(17, 10, 15, 'war'),
    'shuriken': star(4, 5, 1),
    'spear': spear(30, 'leaf'),
    'axe': axe(17, 'crescent'),
    'scythe': scythe(24, 11),
    'boomerang': boomerang(7),
}
ARCADE_VARIANTS = {
    'sword-blade': sword(18, 1, 1, 2, notches=[(0.3, 1), (0.45, 1), (0.6, 1)], fuller=None, tip=0.85),
    'sword-broadsword': sword(19, 3, 3, 4, holes=[(0.2, 'round', 1), (0.42, 'round', 1), (0.64, 'round', 1)], fuller=None, tip=0.85),
    'sword-longsword': sword(25, 2, 2, 3, hook=True, fuller=(0.05, 0.75), tip=0.82),
    'sword-claymore': sword(28, 3, 3, 5, grip_len=6, holes=[(0.12, 'diamond', 2)], lugs=True, fuller=(0.25, 0.7), tip=0.85),
    'dagger-shiv': dagger(8, 1, 1, serrate=True),
    'dagger-dirk': dagger(11, 2, 2, holes=[(0.3, 'slot', 1)]),
    'dagger-stiletto': dagger(13, 1, 1, holes=[(0.2, 'dot', 0), (0.4, 'dot', 0)]),
    'dagger-knife': dagger(11, 2, 1, clip=True, serrate=True),
    'katana-nodachi': katana(31, 7, 3),
    'katana-curved-blade': katana(19, 5, 4, wide=1, flare=True),
    'katana-odachi': katana(31, 8, 2.5, 'R', 'r'),
    'nunchucks-flails': nunchucks(8, 'flail'),
    'nunchucks-chain-sticks': nunchucks(6),
    'nunchucks-whackers': nunchucks(9, 'whackers'),
    'shuriken-throwing-star': star(6, 4, 0),
    'shuriken-star': star(4, 6, 1),
    'shuriken-disc': disc(4),
    'bow-longbow': bow(31, 4, riser_hole=True),
    'bow-shortbow': bow(17, 3, tips='plain', riser_hole=False),
    'bow-warbow': bow(27, 5, spikes=True),
    'wand-twig': wand(13, 'twig'),
    'wand-rod': wand(14, 'crystal'),
    'wand-baton': wand(10, 'baton'),
    'staff-stave': staff(34, 'bands'),
    'staff-scepter': staff(30, 'wings'),
    'staff-walking-stick': staff(32, 'crook'),
    'hammer-maul': hammer(18, 12, 16, 'maul'),
    'hammer-mallet': hammer(16, 10, 12, 'mallet'),
    'hammer-bonker': hammer(17, 10, 13, 'bonker'),
    'spear-trident': spear(29, 'trident'),
    'spear-lance': spear(28, 'lance'),
    'axe-cleaver': axe(17, 'cleaver'),
    'axe-battleaxe': axe(18, 'double'),
    'scythe-sickle': scythe(9, 8, sickle=True),
    'boomerang-wingblade': boomerang(8, wing=True),
}
