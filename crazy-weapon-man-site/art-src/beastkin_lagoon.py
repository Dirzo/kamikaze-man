"""Zone 3, Nunchuck Turtle Lagoon: the turtle and frog family, a beach dojo where every student
swings nunchucks and wears its rank on its belt (white for the tadpoles, black for the Grand
Snapper). Same arcade cut and named frames as beastkin.py, which this file adds itself to.
"""
import math
import beastkin as B
from beastkin import R, ramp, INK, WHITE, mix, smear, P

R.update({
    'frog': ramp('#0c2a14', '#164a1e', '#25702a', '#3e9a32', '#6cc444', '#a8e66a'),
    'fbelly': ramp('#4a4420', '#7a7238', '#aaa25a', '#d2ca84', '#ece6b0', '#fffbe0'),
    'toad': ramp('#1e1a0e', '#3a3018', '#5a4a24', '#7e6834', '#a48a4a', '#c8ae6a'),
    'tad': ramp('#0e1220', '#1a2236', '#2a3652', '#3e5072', '#5a7096', '#8498be'),
    'newt': ramp('#3a1206', '#6a220a', '#a23c10', '#d4601a', '#f48a30', '#ffbc66'),
    'tskin': ramp('#142410', '#24401a', '#3a6226', '#588a36', '#80b04a', '#b0d474'),
    'shell': ramp('#1e160a', '#382a12', '#584220', '#7c5e2e', '#a07c3e', '#c49c56'),
    'plast': ramp('#4a3810', '#7a601c', '#ac8a2c', '#d4b046', '#f0d06e', '#fff0a6'),
    'snap': ramp('#141410', '#26261c', '#3c3c2a', '#56563c', '#747452', '#96966c'),
    'bull': ramp('#16200c', '#283818', '#3e5424', '#567030', '#728c40', '#94ac5a'),
    'blue': ramp('#0e1640', '#18286e', '#2840a2', '#3c62cc', '#6290ec', '#9ebcff'),
    'black': ramp('#08080e', '#121218', '#1e1e28', '#2e2e3a', '#44444e', '#62626e'),
    'beard': ramp('#5a5650', '#7e7a72', '#a6a298', '#cac6bc', '#e6e2d8', '#ffffff'),
})
GOLD_EYE = (250, 206, 70)


def chucks(c, gx, gy, ang, L, ang2, rp='wood', r=0.9, cap='gold', link=2.4):
    """Nunchucks held at (gx, gy): the held stick points along ang, the chain and the loose
    stick carry on along ang2 from its tip. Returns the loose stick's far end."""
    dx, dy = math.cos(ang), math.sin(ang)
    tx, ty = gx + dx * L, gy + dy * L
    c.capsule(gx - dx * 1.0, gy - dy * 1.0, tx, ty, r, r, rp, lift=0.15)
    c.put(gx - dx * 1.4, gy - dy * 1.4, (cap, 4))
    ex, ey = math.cos(ang2), math.sin(ang2)
    for i in range(1, int(link) + 1):  # the chain: bright and dark links
        c.put(tx + ex * i, ty + ey * i, ('steel', 5 if i % 2 else 2), thin=True)
    sx, sy = tx + ex * (link + 0.8), ty + ey * (link + 0.8)
    fx, fy = sx + ex * L, sy + ey * L
    c.capsule(sx, sy, fx, fy, r, r, rp, lift=0.05)
    c.put(fx + ex * 0.6, fy + ey * 0.6, (cap, 3))
    return fx, fy


def whirl_ring(c, cx_, cy_, rx, ry, col=(255, 250, 235)):
    """the blur of chucks spun over the head"""
    for i in range(28):
        a = i / 28 * math.pi * 2
        f = (math.sin(a * 0.5 + 0.6) + 1) / 2
        if f < 0.35:
            continue
        c.put(cx_ + math.cos(a) * rx, cy_ + math.sin(a) * ry, mix((110, 130, 190), col, f), thin=True, flat=True)


# where the chuck hand goes (from the shoulder, in units of the size), which way the held stick
# points and which way the loose one flies, per frame
def cpose(name):
    P_ = {'hand': (2.4, 2.0), 'ang': -0.55, 'ang2': 1.45, 'smear': None, 'ring': False}
    if name.startswith('walk'):
        P_.update(ang2=1.45 + [0.35, 0, -0.35, 0][int(name[-1])])
    if name == 'idle1':
        P_.update(ang2=1.3)
    if name == 'draw':
        P_.update(hand=(0.2, -3.6), ang=-1.75, ang2=-0.3, ring=True)
    elif name == 'loose':
        P_.update(hand=(4.4, 0.0), ang=0.05, ang2=0.1, smear=(-1.9, 0.1))
    elif name == 'loose2':  # the overhead smash
        P_.update(hand=(3.4, -1.6), ang=-0.4, ang2=0.75, smear=(-2.4, 0.8))
    elif name == 'loose3':  # the low sweep
        P_.update(hand=(4.0, 2.6), ang=0.55, ang2=0.3, smear=(-0.4, 1.4))
    elif name == 'loose4':  # the launcher, straight up
        P_.update(hand=(2.2, -3.2), ang=-1.3, ang2=-1.55, smear=(0.6, -1.5))
    elif name == 'hit':
        P_.update(hand=(0.6, 2.6), ang=1.1, ang2=2.2)
    return P_


def belt(c, x0, x1, y, rp, p, tails=True):
    c.line([(x0, y), (x1, y)], (rp, 3), w=2)
    c.line([(x0, y), (x1, y)], (rp, 4))
    if tails:
        kx = x1 - 1.5
        c.put(kx, y + 2, (rp, 4))
        c.line([(kx, y + 2), (kx - 1 - (p.step > 0), y + 4)], (rp, 2))
        c.line([(kx + 1, y + 2), (kx + 1.5, y + 4 + (p.step < 0))], (rp, 3))


def frog_eye(c, x, y, r, rp, hit, col=GOLD_EYE, lid=False):
    c.ball(x, y, r, r, rp, lift=0.25)
    ex, ey = int(round(x - 0.2)), int(round(y - 0.4))
    if hit:
        c.dot(ex - 1, ey, INK); c.dot(ex, ey + 1, INK); c.dot(ex + 1, ey, INK)
        return
    c.dot(ex - 1, ey, col); c.dot(ex, ey, INK); c.dot(ex + 1, ey, INK); c.dot(ex + 2, ey, col) if r > 1.7 else None
    c.dot(ex, ey - 1, col); c.dot(ex + 1, ey - 1, col); c.dot(ex - 1, ey - 1, WHITE)
    c.dot(ex, ey + 1, mix(col, INK, 0.4)); c.dot(ex + 1, ey + 1, mix(col, INK, 0.4))
    if lid:  # a hooded, heavy lid
        c.dot(ex - 1, ey - 1, (rp, 1)); c.dot(ex, ey - 1, (rp, 1)); c.dot(ex + 1, ey - 1, (rp, 1))


def frog(c, p, s, skin, beltc, pose=None, *, belly='fbelly', warts=False, sac=None, hat=None, back=None,
         front=None, stick='wood', clen=4.2, legs='sit', mouth=None, brow=False, lid=False):
    """The frog body: a squat round body, a broad head with eyes on top, big folded back legs, a
    karate belt and one hand on the nunchucks."""
    g = dict(cpose(p.name), **(pose or {}))
    base = c.h - 2
    rx, ry = 5.8 * s * (1 + p.sq * 0.4), 4.2 * s * (1 - p.sq * 0.5)
    bx = c.w * 0.40 + p.lean * s + g.get('dx', 0) * s
    by = base - 1.6 * s - ry + p.bob + g.get('dy', 0) * s
    L = {'bx': bx, 'by': by, 'rx': rx, 'ry': ry, 's': s, 'g': g, 'base': base}
    if back:
        back(c, p, L)
    jump = legs == 'jump'
    # the far leg, then the body, then the near thigh in front
    if jump:
        c.capsule(bx - 2 * s, by + ry * 0.4, bx - 6.4 * s, by + ry + 2.6 * s, 2.0 * s, 1.0 * s, skin, lift=-0.3)
    else:
        c.ball(bx - 2.0 * s + p.step * 0.6, base - 2.4 * s, 3.0 * s, 2.3 * s, skin, lift=-0.35)
    c.ball(bx, by, rx, ry, skin, tex=3 if warts else 0, under=0.3, lift=-0.2)
    for wx, wy, wr in ((-2.6, -2.2, 1.3), (0.4, -3.0, 1.0), (-4.2, 0.2, 0.9)):  # darker back spots
        c.ball(bx + wx * s, by + wy * s, wr * s, wr * s * 0.8, skin, lift=-0.7, contour=False)
    c.ball(bx + 1.8 * s, by + ry * 0.35, rx * 0.55, ry * 0.6, belly, lift=0.1,
           clip=lambda x, y: (x + 0.5 - bx) ** 2 / rx ** 2 + (y + 0.5 - by) ** 2 / ry ** 2 < 0.92)
    if warts:
        for wx, wy in ((-3, -2), (-1, -3), (-4, 0), (0, -1)):
            c.put(bx + wx * s, by + wy * s, (skin, 4), flat=True)
    belt(c, bx - rx * 0.85, bx + rx * 0.9, by + ry * 0.15, beltc, p)
    if jump:
        c.capsule(bx - 1.4 * s, by + ry * 0.5, bx - 5.4 * s, by + ry + 3.4 * s, 2.4 * s, 1.1 * s, skin, lift=0.1)
        c.ball(bx - 6 * s, by + ry + 3.8 * s, 2.2 * s, 0.9 * s, skin, lift=-0.1)
    else:
        st = p.step
        c.ball(bx - 2.8 * s - st * 0.8, base - 2.6 * s - max(0, st) * 0.8, 3.3 * s, 2.5 * s, skin, lift=0.05)
        c.ball(bx - 0.6 * s - st * 0.8, base - 0.7 - max(0, st) * 0.8, 3.0 * s, 0.9 * s, skin, lift=-0.05)
        c.ball(bx + 3.4 * s + st * 0.6, base - 0.7 - max(0, -st) * 0.8, 1.6 * s, 0.8 * s, skin, lift=-0.05)  # the front foot
    # the head: broad and flat, eyes up top
    hx, hy = bx + rx * 0.5, by - ry * 0.62 - 0.6 * s + (1 if p.hit else 0)
    frog_eye(c, hx - 1.4 * s, hy - 2.3 * s, 1.6 * s, skin, p.hit, lid=lid)
    if sac:
        sac(c, p, L, hx, hy)
    c.ball(hx, hy, 4.2 * s, 2.7 * s, skin, lift=0.15)
    c.head = (hx, hy - 1.2 * s, 3.4 * s, 2.7 * s)  # between the eye bumps
    c.ball(hx + 1.2 * s, hy + 1.6 * s, 2.8 * s, 1.2 * s, belly, lift=0.25,
           clip=lambda x, y: y > hy + 1.0 * s)
    mo = mouth or g.get('mouth')
    if mo == 'open':
        c.poly([(hx - 1.2 * s, hy + 0.6 * s), (hx + 4.4 * s, hy - 0.2 * s), (hx + 4.4 * s, hy + 2.2 * s)], 'red', base=1)
        c.capsule(hx + 1 * s, hy + 1.4 * s, hx + 5.4 * s, hy + 1.2 * s, 0.8, 0.9, 'pink', lift=0.2)
    else:
        c.line([(hx - 2.2 * s, hy + 0.2 * s), (hx - 1.2 * s, hy + 1.0 * s), (hx + 4.0 * s, hy + 0.6 * s)], (skin, 0))  # the wide frog smile
    frog_eye(c, hx + 1.2 * s, hy - 2.3 * s, 1.8 * s, skin, p.hit, lid=lid)
    if brow and not p.hit:
        c.line([(hx - 0.2 * s, hy - 4.4 * s), (hx + 2.4 * s, hy - 3.6 * s)], INK)
    if hat:
        hat(c, hx, hy, s, p)
    L.update(hx=hx, hy=hy)
    # the nunchuck arm
    shx, shy = bx + 2.0 * s, by - ry * 0.2
    h2x, h2y = shx + g['hand'][0] * s, shy + g['hand'][1] * s
    if g['ring']:
        whirl_ring(c, h2x + 1, h2y - clen * s * 0.9, clen * s * 1.5, 1.8 * s)
    if g['smear']:
        smear(c, shx, shy, g['hand'][0] * s + clen * s * 1.9, *g['smear'])
    if not g.get('bare'):
        chucks(c, h2x, h2y, g['ang'], clen * s, g['ang2'], rp=stick, r=0.8 if s < 1.2 else 1.1)
    c.capsule(shx - 0.6 * s, shy, h2x, h2y, 1.6 * s, 1.1 * s, skin, lift=-0.05)
    c.ball(h2x, h2y, 1.2 * s, 1.1 * s, skin, lift=0.2)
    L.update(h2x=h2x, h2y=h2y, shx=shx, shy=shy)
    if front:
        front(c, p, L)
    return L


def scutes(c, cx_, cy_, rx, ry, rp, clip):
    """the hexagon plates of a shell, as darker seams"""
    for k in (-0.45, 0.05, 0.55):
        x = cx_ + k * rx
        c.line([(x - 0.5, cy_ - ry * 0.7), (x + 0.5, cy_ + ry * 0.55)], (rp, 1), part=None)
    c.line([(cx_ - rx * 0.85, cy_ + ry * 0.05), (cx_ + rx * 0.8, cy_ - ry * 0.05)], (rp, 1))


def turtle(c, p, s, skin, beltc, pose=None, *, shell='shell', plast='plast', snout=False, beak=False, spikes=0,
           back=None, front=None, stick='wood', clen=4.4, band=True, beard=False, brow=True):
    """The turtle body, standing up like a dojo student: a domed shell on its back, the plastron in
    front with its plate seams, stubby legs, a head with the rank band tied round it."""
    g = dict(cpose(p.name), **(pose or {}))
    base = c.h - 2
    sq = p.sq
    bx = c.w * 0.44 + p.lean * s + g.get('dx', 0) * s
    by = base - 3.2 * s - 4.8 * s * (1 - sq * 0.3) + p.bob + g.get('dy', 0) * s
    L = {'bx': bx, 'by': by, 's': s, 'g': g, 'base': base}
    if back:
        back(c, p, L)
    # legs
    for side, st, lift in ((-1, p.step, -0.3), (1, -p.step, 0.05)):
        lx = bx + side * 1.6 * s + st * 1.4 * s
        fl = max(0, -st) * 1.2
        c.capsule(bx + side * 1.4 * s, by + 3.2 * s, lx, base - 1.2 - fl, 1.7 * s, 1.5 * s, skin, lift=lift)
        c.ball(lx + 0.8 * s, base - 0.9 - fl, 1.9 * s, 1.0 * s, skin, lift=lift)
    # the shell on its back
    srx, sry = 4.2 * s, 5.8 * s * (1 - sq * 0.3)
    sx, sy = bx - 2.4 * s, by - 0.4 * s
    c.ball(sx, sy, srx, sry, shell, lift=0.05, under=0.2)
    scutes(c, sx, sy, srx, sry, shell, None)
    c.capsule(sx + srx * 0.15, sy - sry * 0.92, sx + srx * 0.4, sy + sry * 0.95, 0.8, 0.8, shell, lift=0.4)  # the rim
    if spikes:
        for i in range(spikes):
            a = math.pi * (0.6 + i / max(1, spikes - 1) * 0.85)
            px_, py_ = sx + math.cos(a) * srx, sy - math.sin(a) * sry * 0.95
            ox, oy = math.cos(a), -math.sin(a)
            c.poly([(px_ - oy * 1.2, py_ + ox * 1.2), (px_ + ox * 3.0 * s, py_ + oy * 3.0 * s), (px_ + oy * 1.2, py_ - ox * 1.2)], 'bone', base=3)
    # the plastron (the belly plates)
    prx, pry = 3.0 * s, 5.0 * s * (1 - sq * 0.3)
    c.ball(bx + 0.9 * s, by + 0.2 * s, prx, pry, plast, lift=0.1)
    for k in (-0.4, 0.15, 0.65):
        c.line([(bx + 0.9 * s - prx * 0.75, by + k * pry), (bx + 0.9 * s + prx * 0.8, by + k * pry - 0.5)], (plast, 2))
    belt(c, bx - 1.8 * s, bx + 3.6 * s, by + 1.6 * s, beltc, p, tails=False) if not band else None
    # the head
    hx, hy = bx + 2.2 * s + (0.6 * s if g.get('reach') else 0), by - 6.6 * s + (0.8 if p.hit else 0)
    c.capsule(bx + 0.8 * s, by - 3.6 * s, hx - 0.4 * s, hy + 1.2 * s, 1.6 * s, 1.5 * s, skin, lift=-0.1)  # the neck
    c.ball(hx, hy, 2.9 * s, 2.5 * s, skin, lift=0.1)
    c.head = (hx, hy, 2.9 * s, 2.5 * s)
    if snout or beak:
        c.ball(hx + 2.2 * s, hy + 0.6 * s, 1.7 * s, 1.4 * s, skin, lift=0.2)
    if beak:  # the snapper's hooked jaw
        c.poly([(hx + 2.4 * s, hy - 0.4 * s), (hx + 4.6 * s, hy + 0.5 * s), (hx + 3.6 * s, hy + 1.8 * s), (hx + 2.6 * s, hy + 1.0 * s)], 'snap', base=1)
        c.line([(hx + 1.2 * s, hy + 1.4 * s), (hx + 3.6 * s, hy + 1.6 * s)], INK)
    else:
        c.line([(hx + 1.0 * s, hy + 1.3 * s), (hx + 3.4 * s, hy + 1.0 * s)], (skin, 0))
    if beard:
        c.poly([(hx + 0.4 * s, hy + 1.6 * s), (hx + 3.0 * s, hy + 1.8 * s), (hx + 0.6 * s + p.bob, hy + 6.4 * s)], 'beard', base=3)
    if band:  # the rank band, tied at the back with its tails flying
        c.line([(hx - 2.8 * s, hy - 0.7 * s), (hx + 2.4 * s, hy - 0.9 * s)], (beltc, 3), w=2)
        c.line([(hx - 2.8 * s, hy - 0.7 * s), (hx + 2.4 * s, hy - 0.9 * s)], (beltc, 4))
        fl = [0.5, -0.5, 0.5, -0.5][int(p.name[-1])] if p.walk else 0
        c.line([(hx - 3.0 * s, hy - 0.2 * s), (hx - 5.4 * s, hy + 0.8 * s + fl)], (beltc, 3))
        c.line([(hx - 3.0 * s, hy + 0.3 * s), (hx - 4.8 * s, hy + 2.2 * s - fl)], (beltc, 2))
    ex, ey = int(round(hx + 1.0 * s)), int(round(hy - 0.6 * s))
    if p.hit:
        c.dot(ex, ey - 1, INK); c.dot(ex + 1, ey, INK); c.dot(ex, ey + 1, INK)
    else:
        c.dot(ex, ey, WHITE); c.dot(ex + 1, ey, INK); c.dot(ex + 1, ey - 1 if s > 1.3 else ey, INK)
        if s > 1.3:
            c.dot(ex, ey - 1, WHITE)
        if brow:
            c.dot(ex - 1, ey - 1 - (1 if s > 1.3 else 0), INK); c.dot(ex + 2, ey - 1 - (1 if s > 1.3 else 0), INK)
    L.update(hx=hx, hy=hy, sx=sx, sy=sy, srx=srx, sry=sry)
    # the nunchuck arm
    shx, shy = bx + 1.6 * s, by - 2.6 * s
    h2x, h2y = shx + g['hand'][0] * s, shy + g['hand'][1] * s
    if g['ring']:
        whirl_ring(c, h2x + 1, h2y - clen * s * 0.9, clen * s * 1.5, 1.8 * s)
    if g['smear']:
        smear(c, shx, shy, g['hand'][0] * s + clen * s * 1.9, *g['smear'])
    if not g.get('bare'):
        chucks(c, h2x, h2y, g['ang'], clen * s, g['ang2'], rp=stick, r=0.8 if s < 1.3 else 1.1,
               cap='steel' if stick == 'steel' else 'gold')
    c.capsule(shx - 0.4 * s, shy, h2x, h2y, 1.5 * s, 1.2 * s, skin, lift=-0.05)
    c.ball(h2x, h2y, 1.2 * s, 1.1 * s, skin, lift=0.2)
    L.update(h2x=h2x, h2y=h2y, shx=shx, shy=shy)
    if front:
        front(c, p, L)
    return L


def shell_only(c, s, shell, skin, k=None, *, spikes=0, peek=True, beltc=None, chuck=None, flipped=False, legs=0):
    """A turtle pulled into its shell (k None), spinning in it (k = 0..2: the frame of the spin,
    with the nunchucks out like blades), or flipped on its back (legs waving)."""
    base = c.h - 2
    bx = c.w * 0.5
    rx, ry = 6.6 * s, 4.6 * s
    if flipped:
        by = base - ry * 0.55
        for i, lx in enumerate((-3.6, -1.2, 1.2, 3.6)):
            w = (1 if (i + legs) % 2 else -1) * 0.9
            c.capsule(bx + lx * s, by - 1, bx + lx * s * 1.2 + w, by - ry - 1.6 * s, 1.2 * s, 1.0 * s, skin, lift=0.1)
        c.ball(bx, by, rx, ry, shell, lift=0.05, clip=lambda x, y: y + 0.5 >= by - 0.5)
        c.ball(bx, by - 0.4, rx * 0.86, ry * 0.36, 'plast', lift=0.3)
        c.ball(bx + rx + 0.8 * s, by - 0.8 * s, 2.2 * s, 1.9 * s, skin, lift=0.05)  # the head, upside down
        ex, ey = int(bx + rx + 1.2 * s), int(by)
        c.dot(ex, ey, INK); c.dot(ex + 1, ey - 1, INK)  # dizzy
        return
    by = base - ry + 0.5
    if k is not None and chuck:
        a = [0.0, 2.1, 4.2][k]
        for j in (0, math.pi):
            aa = a + j
            ox, oy = math.cos(aa) * (rx - 1), math.sin(aa) * 1.6
            ax = math.cos(aa)
            chucks(c, bx + ox, by - 1 + oy, aa * 0 + (0 if ax >= 0 else math.pi) + math.sin(aa) * 0.25, 3.6 * s,
                   (0 if ax >= 0 else math.pi) + math.sin(aa) * 0.6, rp=chuck, r=0.8)
    c.ball(bx, by, rx, ry, shell, lift=0.05, clip=lambda x, y: y + 0.5 <= by + ry * 0.55)
    c.line([(bx - rx + 1, by + ry * 0.5), (bx + rx - 1, by + ry * 0.5)], ('plast', 3), w=2)
    sh = (k or 0) * rx * 0.3
    for kk in (-0.5, 0.0, 0.5):
        x = bx + ((kk * rx + sh + rx) % (rx * 1.6)) - rx * 0.8
        c.line([(x, by - ry * 0.8), (x + 0.6, by + ry * 0.35)], (shell, 1))
    c.line([(bx - rx * 0.85, by - ry * 0.05), (bx + rx * 0.85, by - ry * 0.05)], (shell, 1))
    if spikes:
        for i in range(spikes):
            a = math.pi * (0.15 + i / max(1, spikes - 1) * 0.7)
            px_, py_ = bx + math.cos(a) * rx, by - math.sin(a) * ry
            ox, oy = math.cos(a), -math.sin(a)
            c.poly([(px_ - oy * 1.1, py_ + ox * 1.1), (px_ + ox * 2.6 * s, py_ + oy * 2.6 * s), (px_ + oy * 1.1, py_ - ox * 1.1)], 'bone', base=3)
    if beltc:
        c.line([(bx - rx * 0.9, by + ry * 0.2), (bx + rx * 0.9, by + ry * 0.2)], (beltc, 3))
    if peek and k is None:
        # eyes glinting from the dark front opening
        ox, oy = int(bx + rx * 0.7), int(by + ry * 0.2)
        c.dot(ox, oy, INK); c.dot(ox + 1, oy, INK); c.dot(ox, oy + 1, INK); c.dot(ox + 1, oy + 1, INK)
        c.dot(ox, oy, GOLD_EYE)
    if k is not None:  # speed lines
        for i, yy in enumerate((by - ry * 0.6, by, by + ry * 0.4)):
            c.line([(bx - rx - 2 - i, yy), (bx - rx - 4 - i * 2, yy)], (210, 230, 250), thin=True, flat=True)


# ---- 1. Tadpole Tot: a tadpole with stubby new legs and a toy pair of chucks. Flops along in
# little hops and flicks the chucks when it lands next to you. White belt.
def tadpole(c, p):
    base = c.h - 2
    jump = p.name == 'jump'
    bx, by = 9 + p.lean, base - 4.6 + p.bob - (2 if jump else 0)
    wag = {'walk0': 2, 'walk1': 0, 'walk2': -2, 'walk3': 0, 'idle1': 1, 'jump': -2, 'draw': 1}.get(p.name, 0)
    # the tail, waving
    c.capsule(bx - 3, by + 0.5, bx - 8.5, by - 0.5 + wag, 2.4, 0.6, 'tad', lift=0.1)
    c.capsule(bx - 6, by + wag * 0.4, bx - 9.5, by - 1 + wag, 0.9, 0.4, 'blue', lift=0.4, contour=False)
    for side in (-1, 1):  # two new little legs
        c.capsule(bx - 1 + side * 1.2, by + 2.5, bx - 1.5 + side * 1.6 + p.step * side * 0.6, base - 0.6, 0.9, 0.8, 'tad', lift=side * 0.1)
    c.ball(bx, by, 4.6 * (1 + p.sq * 0.4), 4.0 * (1 - p.sq * 0.4), 'tad', under=0.3)
    c.ball(bx + 1.5, by + 1.6, 2.4, 1.6, 'fbelly', lift=0.0, clip=lambda x, y: (x - bx) ** 2 / 20 + (y - by) ** 2 / 15 < 1)
    belt(c, bx - 4, bx + 4.2, by + 0.6, 'bone', p, tails=False)
    ex, ey = int(bx + 1.6), int(by - 2 + (1 if p.hit else 0))
    if p.hit:
        c.dot(ex, ey, INK); c.dot(ex + 1, ey + 1, INK); c.dot(ex, ey + 2, INK)
    else:
        c.dot(ex, ey, WHITE); c.dot(ex + 1, ey, INK); c.dot(ex, ey + 1, WHITE); c.dot(ex + 1, ey + 1, INK)
    c.line([(bx + 2.6, by + 0.4), (bx + 3.8, by + 0.2)], ('tad', 0))
    g = cpose(p.name)
    hx, hy = bx + 2 + g['hand'][0] * 0.55, by + 0.5 + g['hand'][1] * 0.55
    if g['smear']:
        smear(c, bx + 2, by + 0.5, 8, *g['smear'])
    chucks(c, hx, hy, g['ang'], 2.6, g['ang2'], rp='twig', r=0.6, link=1.4)
    c.capsule(bx + 1.5, by + 0.6, hx, hy, 0.9, 0.7, 'tad', lift=-0.05)
    c.dot(hx, hy, ('tad', 4))


# ---- 2. Pond Frog: a bright green frog, yellow belt. Hops in close, lashes its tongue out to
# reel you in, then whacks you with the chucks while you're stuck to it.
def pondfrog(c, p):
    pose = {'tongue': {'mouth': 'open', 'hand': (1.0, 2.2), 'ang': -0.4, 'ang2': 1.3},
            'jump': {'hand': (1.4, -2.6), 'ang': -1.2, 'ang2': 0.6}}.get(p.name)
    frog(c, p, 1.15, 'frog', 'gold', pose=pose, legs='jump' if p.name == 'jump' else 'sit')


# ---- 3. Snapper Shell: a snapping turtle with a hooked jaw and a ridged shell, orange belt.
# Pulls into its shell when you hit it from the front, then snaps out with a counter swing.
def snapper(c, p):
    if p.name == 'shell':
        return shell_only(c, 1.0, 'snap', 'snap', spikes=5, beltc='beak')
    pose = {'snap': {'hand': (4.6, 0.4), 'ang': 0.0, 'ang2': -0.05, 'smear': (-1.4, 0.0), 'reach': True, 'dx': 1.0}}.get(p.name)
    turtle(c, p, 1.0, 'snap', 'beak', pose=pose, shell='shell', beak=True, spikes=3, band=False)


# ---- 4. Spin Turtle: a green turtle in a blue band. Tucks in and spins across the floor with its
# chucks out like blades, ricochets off the ledge's edge, then ends up flipped on its back and
# wide open.
def spinturtle(c, p):
    if p.name.startswith('spin'):
        return shell_only(c, 1.0, 'shell', 'tskin', int(p.name[-1]), beltc='blue', chuck='wood')
    if p.name.startswith('flip'):
        return shell_only(c, 1.0, 'shell', 'tskin', flipped=True, legs=int(p.name[-1]))
    turtle(c, p, 1.0, 'tskin', 'blue', snout=True)


# ---- 5. Toad Monk: a warty brown toad with a green belt and a calm, hooded look. Its four-hit
# chain ends in a rising swing that launches you.
def toadmonk(c, p):
    frog(c, p, 1.12, 'toad', 'leaf', warts=True, belly='chest', lid=True, stick='leather')


# ---- 6. Lily Lurker: a frog wearing a lily pad. It waits flat under the pad with its eyes out,
# looking like part of the lagoon, then springs up with a rising swing when you walk over it.
LILY_P = None


def lilylurker(c, p):
    def pad(c, hx, hy, s, p):
        c.ball(hx - 0.6, hy - 4.6, 6.2, 1.5, 'leaf', lift=0.25)
        c.line([(hx - 0.6, hy - 4.6), (hx + 5.0, hy - 5.2)], ('leaf', 1))  # the pad's notch
        c.ball(hx - 3.2, hy - 6.4, 1.3, 1.1, 'pink', lift=0.3)  # a lotus flower
        c.put(hx - 3.2, hy - 7.6, ('pink', 5), flat=True)
    if p.name == 'hide':
        base = c.h - 2
        bx = c.w * 0.5
        c.ball(bx - 1, base - 3.4, 2.0, 1.8, 'frog', lift=0.2)  # eyes just over the water line
        c.ball(bx + 2, base - 3.4, 2.0, 1.8, 'frog', lift=0.2)
        for ex in (bx - 1, bx + 2):
            c.dot(int(ex), int(base - 3.8), GOLD_EYE); c.dot(int(ex) + 1, int(base - 3.8), INK)
        c.ball(bx, base - 0.8, 8.4, 1.6, 'leaf', lift=0.2)
        c.line([(bx, base - 1), (bx + 7.4, base - 1.8)], ('leaf', 1))
        c.put(bx - 5, base - 2, ('pink', 4)); c.put(bx - 4, base - 2.6, ('pink', 5)); c.put(bx - 3.4, base - 2, ('pink', 3))
        return
    pose = {'rise': {'hand': (2.6, -3.0), 'ang': -1.2, 'ang2': -1.5, 'smear': (0.8, -1.6), 'dy': -1.5}}.get(p.name)
    frog(c, p, 1.0, 'frog', 'plume', pose=pose, hat=pad, legs='jump' if p.name == 'rise' else 'sit')


# ---- 7. Bubble Newt: an orange newt with a long tail and a cyan belt. Whirls its chucks to blow
# big slow bubbles; one that catches you floats you helplessly for a moment.
def bubblenewt(c, p):
    base = c.h - 2
    g = cpose(p.name)
    if p.name == 'blow':
        g.update(hand=(1.8, -2.2), ang=-1.4, ang2=0.2, ring=True)
    bx, by = c.w * 0.42 + p.lean, base - 4.6 + p.bob
    wag = [1, 0, -1, 0][int(p.name[-1])] if p.walk else 0
    c.capsule(bx - 3.6, by + 0.6, bx - 10, by + 2.4 + wag, 2.6, 1.0, 'newt', lift=-0.05)
    c.capsule(bx - 9.6, by + 2.4 + wag, bx - 13, by - 0.2 + wag, 1.0, 0.4, 'newt', lift=0.1)
    for side, st in ((-1, p.step), (1, -p.step)):  # four little legs
        for fx in (-2.6, 3.0):
            lx = bx + fx + st * 1.2 * (1 if fx > 0 else -1)
            c.capsule(bx + fx * 0.8, by + 2.2, lx, base - 0.6 - max(0, side * st) * 0.6, 1.0, 0.9, 'newt', lift=side * 0.15 - 0.1)
    c.ball(bx, by, 6.0 * (1 + p.sq * 0.3), 3.4 * (1 - p.sq * 0.3), 'newt', under=0.4)
    for sx_ in (-3, 0, 3):  # the newt's spots
        c.put(bx + sx_, by - 2, ('red', 1), flat=True)
    c.ball(bx + 1.4, by + 2.0, 4.0, 1.2, 'gold', lift=-0.1, clip=lambda x, y: y > by + 1)
    belt(c, bx - 5, bx + 5.2, by + 0.4, 'ice', p, tails=True)
    hx, hy = bx + 6.2, by - 2.6 + (1 if p.hit else 0)
    c.ball(hx, hy, 3.4, 2.6, 'newt', lift=0.1)
    if p.name == 'blow':
        c.ball(hx + 3.6, hy + 0.4, 1.4, 1.4, 'ice', lift=0.4)
    else:
        c.line([(hx + 0.6, hy + 1.3), (hx + 3.2, hy + 1.0)], ('newt', 0))
    ex, ey = int(hx + 0.8), int(hy - 1)
    if p.hit:
        c.dot(ex, ey - 1, INK); c.dot(ex + 1, ey, INK); c.dot(ex, ey + 1, INK)
    else:
        c.dot(ex, ey, WHITE); c.dot(ex + 1, ey, INK); c.dot(ex + 1, ey - 1, INK)
    shx, shy = bx + 3.4, by - 0.6
    h2x, h2y = shx + g['hand'][0], shy + g['hand'][1]
    if g['ring']:
        whirl_ring(c, h2x + 1, h2y - 3.6, 6, 1.8)
    if g['smear']:
        smear(c, shx, shy, g['hand'][0] + 7.5, *g['smear'])
    chucks(c, h2x, h2y, g['ang'], 3.8, g['ang2'], rp='wood', r=0.8, link=2)
    c.capsule(shx, shy, h2x, h2y, 1.4, 1.0, 'newt', lift=-0.05)
    c.ball(h2x, h2y, 1.1, 1.0, 'newt', lift=0.2)


# ---- 8. Shellback Brawler: a big tortoise with a spiked shell and a red band. Turns its spiked
# back on you to block (and hitting the spikes hurts); from the front it brawls with a heavy
# two-hit haymaker.
def shellback(c, p):
    pose = {'guard': {'hand': (0.4, 2.4), 'ang': 1.0, 'ang2': 1.7, 'dy': 0.8}}.get(p.name)
    turtle(c, p, 1.3, 'tskin', 'red', pose=pose, shell='shell', spikes=6, snout=True, stick='steel', clen=4.0)
    if p.name == 'guard':  # turned round: the spiked shell faces you
        for grid in (c.col, c.part, c.thin, c.flat):
            for row in grid:
                row.reverse()


# ---- 9. Bullfrog Bouncer: a huge bullfrog in a brown belt. Bounces after you in big body slams
# that send a ripple along the floor each time it lands, and croaks a blast that shoves you away.
def bullfrog(c, p):
    def sac(c, p, L, hx, hy):
        big = p.name == 'croak'
        c.ball(hx + 1.0 * L['s'], hy + (3.0 if big else 2.0) * L['s'], (3.8 if big else 2.4) * L['s'], (3.0 if big else 1.6) * L['s'], 'fbelly', lift=0.35)
    pose = {'croak': {'mouth': 'shut', 'hand': (0.6, 2.4), 'ang': 0.9, 'ang2': 1.8},
            'jump': {'hand': (1.4, -3.2), 'ang': -1.2, 'ang2': 0.6}}.get(p.name)
    frog(c, p, 1.6, 'bull', 'leather', pose=pose, sac=sac, warts=True, brow=True, legs='jump' if p.name == 'jump' else 'sit', clen=3.8)


# ---- 10. Grand Snapper: the lagoon's old master, a huge snapping turtle with a white beard, a
# black belt and iron chucks. Spins them into a wall that knocks shots away, pulls into his shell
# to counter, and slams them into the shallows to send a wave both ways.
def grandsnapper(c, p):
    if p.name.startswith('spin'):
        k = int(p.name[-1])
        a = [0.2, 2.3, 4.4][k]
        pose = {'hand': (math.cos(a) * 3.2, math.sin(a) * 2.0 - 0.8), 'ang': a, 'ang2': a + 0.2, 'smear': (a - 2.6, a)}
        q = P('idle1')
        q.name = p.name
        return turtle(c, q, 1.75, 'snap', 'black', pose=pose, shell='shell', beak=True, spikes=5, beard=True, stick='steel', clen=4.0)
    if p.name == 'shell':
        return shell_only(c, 1.6, 'shell', 'snap', spikes=6, beltc='black')
    pose = {'slam': {'hand': (4.2, 3.4), 'ang': 1.2, 'ang2': 1.5, 'smear': (-2.2, 1.4), 'dy': 0.6}}.get(p.name)
    turtle(c, p, 1.75, 'snap', 'black', pose=pose, shell='shell', beak=True, spikes=5, beard=True, stick='steel', clen=4.0)


DESIGNS = {
    'tadpole': (24, 16, tadpole, ['jump']),
    'pondfrog': (34, 28, pondfrog, ['tongue', 'jump']),
    'snapper': (34, 28, snapper, ['shell', 'snap']),
    'spinturtle': (34, 28, spinturtle, ['spin0', 'spin1', 'spin2', 'flip0', 'flip1']),
    'toadmonk': (36, 28, toadmonk, ['loose2', 'loose3', 'loose4']),
    'lilylurker': (34, 30, lilylurker, ['hide', 'rise']),
    'bubblenewt': (38, 22, bubblenewt, ['blow']),
    'shellback': (42, 36, shellback, ['guard', 'loose2']),
    'bullfrog': (50, 40, bullfrog, ['croak', 'jump']),
    'grandsnapper': (58, 50, grandsnapper, ['spin0', 'spin1', 'spin2', 'shell', 'slam']),
}
B.DESIGNS.update(DESIGNS)
