"""Zone 4, the Thieves' Night Bazaar: the cat and raccoon family, alley cats and masked raccoons
with daggers, from a scrappy Alley Kitten to the Fat Cat Fence who runs the market. Same arcade
cut and named frames as beastkin.py, which this file adds itself to.
"""
import math
import beastkin as B
from beastkin import R, ramp, INK, WHITE, mix, smear, sword, P

R.update({
    'ginger': ramp('#3a1606', '#66280c', '#984216', '#c86424', '#ec9040', '#ffc070'),
    'tabby': ramp('#1e1a18', '#38302a', '#584c40', '#7c6c58', '#a49078', '#ccb89c'),
    'blackc': ramp('#08070e', '#120f1c', '#1e1a2c', '#2c2840', '#403a58', '#5a5476'),
    'siam': ramp('#4a3a2a', '#7a6650', '#a89276', '#d0bc9c', '#ecdcc0', '#fff6e6'),
    'siampt': ramp('#120c0a', '#22180f', '#362618', '#4c3824', '#644c34', '#7e6448'),
    'racc': ramp('#16161c', '#2a2a32', '#44444e', '#64646e', '#8a8a92', '#b4b4ba'),
    'tom': ramp('#120e18', '#221a2c', '#382c46', '#504060', '#6c5880', '#8c76a0'),
    'prowl': ramp('#2a1c0c', '#463016', '#6a4a22', '#8e6630', '#b48a44', '#d8b062'),
    'fat': ramp('#3c3a40', '#5e5c64', '#86848c', '#acaab2', '#d2d0d6', '#f6f4fa'),
    'cloth': ramp('#1c0c1e', '#341634', '#54224e', '#7a346c', '#a24c8c', '#c870ae'),
    'teal': ramp('#062420', '#0c3e36', '#16604f', '#24846a', '#3aa888', '#64ccaa'),
    'poison': ramp('#0e2208', '#1c4010', '#2e661a', '#468e26', '#6cb43a', '#a2dc5a'),
})
CAT_EYE = (250, 214, 60)
GREEN_EYE = (120, 230, 110)
BLUE_EYE = (110, 190, 255)


def dagger(c, gx, gy, ang, s=1.0, rp='steel', guard='gold', hilt='leather', L=None):
    sword(c, gx, gy, ang, L or 4.6 * s, rp=rp, w=2 if s >= 1.1 else 1, guard=guard, hilt=hilt, gw=1.2, pommel=False)


def dpose(name):
    P_ = {'hand': (2.0, 2.6), 'ang': -0.7, 'smear': None, 'far': (-0.6, 3.0, 0.9)}
    if name == 'draw':
        P_.update(hand=(-1.4, -1.8), ang=-2.5, far=(-2.2, 1.6, 2.4))
    elif name == 'loose':
        P_.update(hand=(4.8, 0.6), ang=0.0, smear=(-1.5, 0.1), far=(-1.4, 2.6, 2.6))
    elif name == 'loose2':
        P_.update(hand=(1.2, 3.0), ang=1.0, far=(4.6, 0.2, 0.05), farsmear=(-1.2, 0.1))
    elif name == 'hit':
        P_.update(hand=(0.4, 3.0), ang=1.3, far=(-1.0, 2.4, 2.0))
    elif name == 'throw':
        P_.update(hand=(4.2, -2.6), ang=-0.6, bare=True, far=(-1.2, 2.4, 2.2))
    elif name == 'dash':
        P_.update(hand=(6.0, 1.6), ang=0.05, dx=1.6, dy=1.2, lean=0.6, smear=None)
    elif name == 'jump':
        P_.update(hand=(4.2, 3.0), ang=0.75, dy=-2.0, tuck=True)
    elif name == 'rally':
        P_.update(hand=(1.4, -4.4), ang=-1.6, bare=True)
    elif name == 'blink':
        P_.update(hand=(-0.8, 2.6), ang=1.6, dy=1.5)
    return P_


def cat_eye(c, x, y, col, hit, glow=False):
    x, y = int(round(x)), int(round(y))
    if hit:
        c.dot(x, y, INK); c.dot(x + 1, y + 1, INK); c.dot(x, y + 2, INK)
        return
    c.dot(x, y, col); c.dot(x, y + 1, col); c.dot(x + 1, y, INK); c.dot(x + 1, y + 1, INK)
    c.dot(x, y - 1, INK); c.dot(x + 1, y - 1, INK)
    if glow:
        c.dot(x, y, mix(col, WHITE, 0.5))


def cat(c, p, s, fur, pose=None, *, belly='siam', eye=CAT_EYE, racc=False, stripes=None, tail='cat', points=None,
        back=None, front=None, wear=None, hat=None, hold=None, dual=False, blade='steel', glow=False, scar=False, wide=1.0):
    """The beastkin cat (or raccoon, racc=True): standing up on two legs, a big head with pointed
    ears (round ones for raccoons), a tail, and a dagger in the near paw. dual puts a second
    dagger in the far paw."""
    g = dict(dpose(p.name), **(pose or {}))
    base = c.h - 2
    lean = p.lean + g.get('lean', 0)
    bx = c.w * 0.42 + lean * s + g.get('dx', 0) * s
    by = base - 3.0 * s - 3.4 * s * (1 - p.sq * 0.3) + p.bob + g.get('dy', 0) * s
    brx, bry = 3.0 * s * wide * (1 + p.sq * 0.3), 3.8 * s * (1 - p.sq * 0.3)
    L = {'bx': bx, 'by': by, 's': s, 'g': g, 'base': base, 'brx': brx, 'bry': bry}
    if back:
        back(c, p, L)
    pts = points or fur
    # the tail, swishing
    sw = [0.8, 0, -0.8, 0][int(p.name[-1])] if p.walk else (0.5 if p.name == 'idle1' else 0)
    tx0, ty0 = bx - brx * 0.8, by + bry * 0.4
    if tail == 'racc':
        pts_ = [(tx0, ty0), (tx0 - 3.2 * s, ty0 - 0.6 * s + sw), (tx0 - 5.0 * s, ty0 - 3.2 * s + sw), (tx0 - 5.2 * s, ty0 - 6.0 * s + sw)]
        for i, ((ax, ay), (bx_, by_)) in enumerate(zip(pts_, pts_[1:])):
            c.capsule(ax, ay, bx_, by_, 1.9 * s, 1.8 * s, 'racc' if i % 2 == 0 else 'siampt', lift=-0.1)
    else:
        pts_ = [(tx0, ty0), (tx0 - 2.6 * s, ty0 - 1.0 * s + sw), (tx0 - 3.6 * s, ty0 - 4.0 * s + sw), (tx0 - 2.6 * s, ty0 - 6.4 * s + sw * 1.5)]
        for (ax, ay), (bx_, by_) in zip(pts_, pts_[1:]):
            c.capsule(ax, ay, bx_, by_, 1.0 * s, 0.9 * s, pts if tail == 'points' else fur, lift=-0.1)
    # the far arm (behind the body)
    far = g['far']
    fax, fay = bx + 0.4 * s + far[0] * s, by - bry * 0.4 + far[1] * s
    if dual:
        if g.get('farsmear'):
            smear(c, bx, by - bry * 0.4, far[0] * s + 6 * s, *g['farsmear'])
        dagger(c, fax, fay, far[2], s, rp=blade)
    c.capsule(bx + 0.2 * s, by - bry * 0.45, fax, fay, 1.1 * s, 0.9 * s, pts, lift=-0.5)
    c.ball(fax, fay, 0.9 * s, 0.9 * s, pts, lift=-0.3)
    # legs
    if g.get('tuck'):
        c.capsule(bx - 0.6 * s, by + bry * 0.6, bx - 3.4 * s, by + bry + 1.4 * s, 1.3 * s, 1.0 * s, pts, lift=-0.3)
        c.capsule(bx + 0.6 * s, by + bry * 0.6, bx + 2.4 * s, by + bry + 1.8 * s, 1.3 * s, 1.0 * s, pts, lift=0.0)
    else:
        for side, st, lift in ((-1, p.step, -0.35), (1, -p.step, 0.0)):
            lx = bx + side * 1.2 * s + st * 1.6 * s
            fl = max(0, -st) * 1.2
            c.capsule(bx + side * 1.0 * s, by + bry * 0.6, lx, base - 1.0 - fl, 1.3 * s, 1.1 * s, pts, lift=lift)
            c.ball(lx + 0.7 * s, base - 0.8 - fl, 1.5 * s, 0.9 * s, pts, lift=lift)
    # the body
    c.ball(bx, by, brx, bry, fur, lift=-0.05, under=0.3)
    if stripes:
        for k in (-0.5, 0.0, 0.5):
            c.line([(bx - brx * 0.9, by + k * bry), (bx - brx * 0.2, by + k * bry - 0.8)], (stripes, 1))
    c.ball(bx + brx * 0.45, by + bry * 0.15, brx * 0.5, bry * 0.7, belly, lift=0.1,
           clip=lambda x, y: (x + 0.5 - bx) ** 2 / brx ** 2 + (y + 0.5 - by) ** 2 / bry ** 2 < 0.9)
    if wear:  # vests, coats, spots: over the body, under the arm
        wear(c, p, L)
    # the head
    hx, hy = bx + 1.2 * s, by - bry - 2.4 * s + (0.6 if p.hit else 0) + g.get('hdy', 0) * s
    hrx, hry = 3.7 * s, 3.3 * s
    for ex_, lift in ((hx - 2.4 * s, -0.25), (hx + 1.4 * s, 0.1)):  # the ears
        if racc:
            c.ball(ex_ + 0.2 * s, hy - hry * 0.95, 1.3 * s, 1.2 * s, fur, lift=lift)
        else:
            c.poly([(ex_ - 1.3 * s, hy - hry * 0.5), (ex_ + 0.2 * s, hy - hry - 2.4 * s), (ex_ + 1.5 * s, hy - hry * 0.6)], pts, base=3 if lift > 0 else 2)
            c.put(ex_ + 0.2 * s, hy - hry - 0.6 * s, ('pink', 3), flat=True)
    c.ball(hx, hy, hrx, hry, fur, lift=0.1)
    if stripes and s >= 1:
        c.line([(hx - 0.8 * s, hy - hry + 0.4), (hx - 0.4 * s, hy - hry * 0.4)], (stripes, 1))
        c.line([(hx + 0.6 * s, hy - hry + 0.6), (hx + 0.6 * s, hy - hry * 0.45)], (stripes, 1))
    if racc:  # the bandit mask
        c.ball(hx + 0.9 * s, hy - 0.2 * s, 2.8 * s, 1.1 * s, 'siampt', lift=-0.2, contour=False)
    mz = 2.6 if racc else 2.1
    c.ball(hx + mz * s, hy + 1.1 * s, (1.5 if racc else 1.2) * s, 1.0 * s, belly if not points else pts, lift=0.3)  # the muzzle
    c.put(hx + (mz + 1.0) * s, hy + 0.5 * s, ('pink', 3) if not racc else INK, flat=True)  # the nose
    if points and not racc:  # a Siamese's dark mask
        c.ball(hx + 1.4 * s, hy + 0.2 * s, 2.2 * s, 1.6 * s, pts, lift=-0.1, contour=False)
    cat_eye(c, hx + 1.3 * s, hy - 0.7 * s, eye, p.hit, glow)
    cat_eye(c, hx - 1.3 * s, hy - 0.7 * s, mix(eye, INK, 0.2), p.hit, glow)
    if scar and not p.hit:
        c.line([(hx + 0.8 * s, hy - 2.4 * s), (hx + 2.2 * s, hy + 0.4 * s)], ('pink', 2), flat=True)
    if s >= 1.1:  # whiskers
        for k in (-1, 1):
            c.line([(hx + 3.0 * s, hy + 1.2 * s + k * 0.5), (hx + 4.4 * s, hy + 1.0 * s + k * 1.1)], (170, 166, 160), thin=True, flat=True)
    if hat:
        hat(c, hx, hy, s, p)
    L.update(hx=hx, hy=hy)
    # the near arm and its dagger
    shx, shy = bx + 0.8 * s, by - bry * 0.45
    h2x, h2y = shx + g['hand'][0] * s, shy + g['hand'][1] * s
    if g['smear']:
        smear(c, shx, shy, g['hand'][0] * s + 5.5 * s, *g['smear'])
    if hold:
        hold(c, p, L, h2x, h2y)
    elif not g.get('bare'):
        dagger(c, h2x, h2y, g['ang'], s, rp=blade)
    c.capsule(shx - 0.4 * s, shy, h2x, h2y, 1.3 * s, 1.0 * s, pts, lift=0.0)
    c.ball(h2x, h2y, 1.0 * s, 1.0 * s, pts, lift=0.25)
    L.update(h2x=h2x, h2y=h2y)
    if front:
        front(c, p, L)
    return L


# ---- 1. Alley Kitten: a scrappy ginger kitten with a too-big knife. A quick stab, and when it gets
# hurt it bolts.
def alleykit(c, p):
    cat(c, p, 0.85, 'ginger', stripes='ginger', belly='siam')


# ---- 2. Pickpocket Kit: a young raccoon with a sack. A hit from it lifts shards out of your
# pocket and it runs off with them; catch it and they spill back out, with interest.
def pickpocket(c, p):
    def sack(c, p, L):
        c.ball(L['bx'] - L['brx'] - 1.4, L['by'] - 1.0, 3.0, 3.2, 'leather', lift=0.1, tex=2)
        c.line([(L['bx'] - L['brx'] - 1.6, L['by'] - 4.2), (L['bx'] + 0.5, L['by'] - 1.5)], ('leather', 1))
        c.put(L['bx'] - L['brx'] - 1.0, L['by'] - 4.0, ('gold', 5), flat=True)
    cat(c, p, 0.95, 'racc', racc=True, tail='racc', belly='fat', back=sack, eye=(240, 240, 250))


# ---- 3. Tabby Cutpurse: a grey tabby in a hood. Crouches, then dashes straight through you with a
# stab and ends up behind you.
def cutpurse(c, p):
    def hood(c, hx, hy, s, p):
        c.ball(hx - 0.8, hy - 0.6, 4.2, 3.9, 'leather', lift=0.05, clip=lambda x, y: y < hy - 1.6 or x < hx - 1.6)
        c.line([(hx - 1.6, hy - 2.2), (hx + 2.8, hy - 3.0)], ('leather', 1))
    cat(c, p, 1.0, 'tabby', stripes='tabby', hat=hood, eye=GREEN_EYE)


# ---- 4. Lantern Cat: a black cat you can only see by the light, only its eyes glow in the dark.
# It waits out of the light and strikes from it.
def lanterncat(c, p):
    def lamp(c, p, L):  # a paper lantern hanging from its tail (unlit: it doesn't want you to see)
        x, y = L['bx'] - L['brx'] - 3.2, L['by'] - 7.6
        c.line([(x, y - 2), (x, y)], ('leather', 2), thin=True)
        c.ball(x, y + 2, 1.7, 2.2, 'red', lift=-0.3)
        c.line([(x - 1.4, y + 2), (x + 1.4, y + 2)], ('red', 0))
    cat(c, p, 1.0, 'blackc', belly='blackc', eye=CAT_EYE, glow=True, back=lamp, blade='steel')


# ---- 5. Knife Juggler: a raccoon in a street performer's vest who lobs daggers in arcs.
def juggler(c, p):
    def vest(c, p, L):
        c.ball(L['bx'] + 0.2, L['by'] - 0.4, L['brx'] * 0.95, L['bry'] * 0.8, 'teal', lift=0.0, clip=lambda x, y: x < L['bx'] + 1.5)
        for k in (-1, 1):
            c.put(L['bx'] - 1, L['by'] + k * 1.6, ('gold', 5), flat=True)
    def juggle(c, p, L):  # daggers in the air over its head
        if p.name in ('idle0', 'idle1', 'draw') or p.walk:
            k = {'idle0': 0, 'idle1': 1, 'draw': 2}.get(p.name, int(p.name[-1]) if p.walk else 0)
            for i in range(2):
                a = (k + i * 1.5) * 1.1
                dagger(c, L['hx'] + math.cos(a) * 3, L['hy'] - 6 - abs(math.sin(a)) * 2, a * 2, 0.7, L=3)
    cat(c, p, 1.0, 'racc', racc=True, tail='racc', belly='fat', wear=vest, front=juggle, eye=(240, 240, 250))


# ---- 6. Shadow Tom: a big scarred tomcat with an eyepatch that blinks out in a puff and appears
# behind you to stab you in the back. Turn round in time and he's caught flat-footed.
def shadowtom(c, p):
    def patch(c, hx, hy, s, p):
        c.line([(hx - 3.0 * s, hy - 2.4 * s), (hx + 3.0 * s, hy + 0.2 * s)], INK)
    def wisps(c, p, L):
        if p.name == 'blink':
            for i in range(6):
                a = i * 1.1
                c.put(L['bx'] + math.cos(a) * 6, L['by'] + math.sin(a) * 6, R['plume'][3 + i % 3], flat=True, thin=True)
    cat(c, p, 1.15, 'tom', scar=True, hat=patch, front=wisps, eye=(230, 70, 90), belly='tom')


# ---- 7. Twin Fang Siamese: sleek and fast with a dagger in each paw; a four-cut flurry.
def siamese(c, p):
    cat(c, p, 1.0, 'siam', points='siampt', tail='points', belly='siam', eye=BLUE_EYE, dual=True)


# ---- 8. Rooftop Prowler: a lean spotted cat in a bandana that leaps high off the stalls and
# pounces down on you.
def prowler(c, p):
    def band(c, hx, hy, s, p):
        c.line([(hx - 3.2, hy - 1.6), (hx + 2.8, hy - 2.2)], ('red', 3), w=2)
        c.line([(hx - 3.4, hy - 1.2), (hx - 5.4, hy - 0.4 + p.bob)], ('red', 2))
    def spots(c, p, L):
        for dx, dy in ((-1.6, -1.6), (0.2, -2.6), (-2.2, 0.8), (0, 0.6)):
            c.put(L['bx'] + dx, L['by'] + dy, ('prowl', 1), flat=True)
    cat(c, p, 1.05, 'prowl', hat=band, wear=spots, eye=GREEN_EYE, wide=0.9)


# ---- 9. Masked Bandit: a raccoon in a bandit's kerchief with a belt of smoke bombs. Throws one,
# then fights from inside the cloud where your swings keep missing.
def bandit(c, p):
    def kerchief(c, hx, hy, s, p):
        c.poly([(hx + 0.6 * s, hy + 0.4 * s), (hx + 4.4 * s, hy + 0.6 * s), (hx + 2.6 * s, hy + 3.4 * s), (hx - 1.6 * s, hy + 2.0 * s)], 'red', base=2)
    def bombs(c, p, L):
        for k in (-1.4, 0.8):
            c.ball(L['bx'] + k, L['by'] + 1.8, 1.1, 1.1, 'blackc', lift=0.3)
    def hold(c, p, L, x, y):
        if p.name == 'throw':
            c.ball(x + 1, y - 1, 1.6, 1.6, 'blackc', lift=0.3)
            c.put(x + 1.6, y - 3, ('gold', 5), flat=True)
        else:
            dagger(c, x, y, L['g']['ang'], 1.05)
    cat(c, p, 1.05, 'racc', racc=True, tail='racc', belly='fat', hat=kerchief, wear=bombs, hold=hold, eye=(240, 240, 250))


# ---- 10. Fat Cat Fence: the big white cat who runs the bazaar, in a velvet coat and a gold chain.
# Rallies the thieves around it (faster, angrier) and throws a fan of poisoned daggers.
def fatcat(c, p):
    def coat(c, p, L):
        c.ball(L['bx'] - 0.6, L['by'] + 0.4, L['brx'] * 1.0, L['bry'] * 0.95, 'cloth', lift=0.0, clip=lambda x, y: x < L['bx'] + 0.6)
        for i in range(7):  # the gold chain
            a = 0.3 + i * 0.36
            c.put(L['bx'] + math.cos(a) * L['brx'] * 0.6 + 0.5, L['by'] - L['bry'] * 0.4 + math.sin(a) * 2.2, ('gold', 4 + i % 2), flat=True)
    def hat(c, hx, hy, s, p):
        c.ball(hx - 0.4, hy - 3.0 * s, 3.6 * s, 0.9 * s, 'blackc', lift=0.2)
        c.ball(hx - 0.4, hy - 4.2 * s, 2.2 * s, 1.6 * s, 'blackc', lift=0.25, clip=lambda x, y: y < hy - 3.0 * s)
        c.line([(hx - 2.6 * s, hy - 3.4 * s), (hx + 1.8 * s, hy - 3.4 * s)], ('gold', 4))
    def hold(c, p, L, x, y):
        if p.name == 'rally':
            c.ball(x, y - 1.6, 1.4, 1.4, 'gold', lift=0.4)  # a gold coin held up
        elif p.name == 'throw':
            for k in (-0.5, 0, 0.5):
                dagger(c, x, y, -0.4 + k, 1.0, rp='poison')
        else:
            dagger(c, x, y, L['g']['ang'], 1.4, rp='poison')
    cat(c, p, 1.6, 'fat', belly='fat', eye=(250, 200, 60), wear=coat, hat=hat, hold=hold, wide=1.35)


DESIGNS = {
    'alleykit': (24, 24, alleykit, []),
    'pickpocket': (30, 28, pickpocket, []),
    'cutpurse': (34, 28, cutpurse, ['dash']),
    'lanterncat': (32, 30, lanterncat, []),
    'juggler': (30, 34, juggler, ['throw']),
    'shadowtom': (34, 34, shadowtom, ['blink']),
    'siamese': (32, 28, siamese, ['loose2']),
    'prowler': (34, 30, prowler, ['jump']),
    'bandit': (32, 30, bandit, ['throw']),
    'fatcat': (46, 46, fatcat, ['throw', 'rally']),
}
B.DESIGNS.update(DESIGNS)
