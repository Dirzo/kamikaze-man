"""Zone 9, the Shuriken Ninja Castle: the lizard family, every one a ninja, from a Gecko Genin who
poses after every throw to the Komodo Jonin. Built on the cat body from beastkin_bazaar.py (no ears,
a long snout and a lizard's tail) and added to beastkin.py.
"""
import math
import beastkin as B
from beastkin import R, ramp, INK, WHITE, mix
from beastkin_bazaar import cat
from beastkin_temple import both

R.update({
    'gecko': ramp('#1a2e0e', '#2a4a16', '#3e6a20', '#56902e', '#74b440', '#9ad85c'),
    'gbelly': ramp('#4a4a2a', '#6e6e40', '#949458', '#bcbc76', '#dede98', '#f8f8c0'),
    'draco': ramp('#2a1a0e', '#443018', '#624a24', '#866834', '#aa8a48', '#ccac62'),
    'sail': ramp('#4a1206', '#7a1e0a', '#ac3412', '#d8521e', '#f47c34', '#ffaa5a'),
    'tokay': ramp('#16203a', '#22325a', '#30487c', '#44629e', '#6080be', '#84a2da'),
    'cham': ramp('#0e2a22', '#164436', '#22604e', '#327e66', '#48a080', '#66c09e'),
    'frill': ramp('#3a2408', '#5e3a0e', '#865416', '#ae7220', '#d4942e', '#f2b84a'),
    'anole': ramp('#123012', '#1c4c1a', '#286a24', '#368a30', '#4aac40', '#68ca58'),
    'basil': ramp('#202a10', '#34441a', '#4a6024', '#627e30', '#7e9c40', '#9cba56'),
    'iguana': ramp('#1a2e24', '#284a3a', '#386852', '#4c886c', '#66a88a', '#86c6a8'),
    'skink': ramp('#1e1814', '#322820', '#4a3c2e', '#62523e', '#7c6a52', '#988468'),
    'skinkt': ramp('#0e1e4a', '#14307a', '#1c46aa', '#2c62d0', '#4a86ec', '#78acff'),
    'komodo': ramp('#1e1a14', '#322c22', '#4a4232', '#625a44', '#7c7258', '#988e70'),
    'ninja': ramp('#08080e', '#10101a', '#1a1a28', '#262638', '#34344a', '#46465e'),
    'ninjar': ramp('#2a0608', '#460a0e', '#661016', '#8a1a20', '#ae2a2c', '#d0443e'),
    'shur': ramp('#22242e', '#383c4a', '#545a6c', '#767e92', '#9ca4b8', '#c8d0e0'),
})


def shuriken(c, x, y, s=1.0, r=2.4, rp='shur', turn=0.0):
    for k in range(4):
        a = turn + k * math.pi / 2
        c.poly([(x + math.cos(a) * r * s, y + math.sin(a) * r * s), (x + math.cos(a + 0.6) * 0.8 * s, y + math.sin(a + 0.6) * 0.8 * s),
                (x + math.cos(a - 0.6) * 0.8 * s, y + math.sin(a - 0.6) * 0.8 * s)], rp, base=4, contour=False)
    c.put(x, y, INK, flat=True)


def held(r=2.4, rp='shur'):
    def hold(c, p, L, x, y):
        if not L['g'].get('bare'):
            shuriken(c, x + 1.2, y - 0.8, L['s'], r, rp, turn=0.3 if p.name == 'draw' else 0.0)
    return hold


def hood(col='ninja', band='ninjar', mask=True):
    """a ninja hood over the back of the head, a coloured band, and a mask over the snout"""
    def hat(c, hx, hy, s, p):
        c.ball(hx - 0.8 * s, hy - 0.4 * s, 3.4 * s, 3.2 * s, col, lift=0.05, clip=lambda x, y: x < hx + 0.4 * s or y < hy - 1.6 * s)
        c.line([(hx - 3.6 * s, hy - 1.6 * s), (hx + 2.8 * s, hy - 1.9 * s)], (band, 3), w=2)
        c.line([(hx - 3.8 * s, hy - 1.4 * s), (hx - 5.8 * s, hy - 0.4 * s + p.bob)], (band, 4))
        if mask:
            c.ball(hx + 2.4 * s, hy + 1.2 * s, 2.0 * s, 1.0 * s, col, lift=0.0, contour=False)
    return hat


def gi(col='ninja', belt='ninjar'):
    def wear(c, p, L):
        bx, by, brx, bry = L['bx'], L['by'], L['brx'], L['bry']
        c.ball(bx, by + 0.2, brx * 1.02, bry * 0.92, col, lift=0.0)
        c.line([(bx - brx * 0.9, by + bry * 0.25), (bx + brx * 0.9, by + bry * 0.2)], (belt, 3), w=2)
    return wear


def lizard(c, p, s, skin, pose=None, belly='gbelly', **kw):
    kw.setdefault('eye', (240, 200, 40))
    return cat(c, p, s, skin, pose=pose, belly=belly, ears='none', tail='lizard', snout=kw.pop('snout', 1.3), nose=kw.pop('nose', ('gecko', 0)), whisk=False, **kw)


THROW = {'hand': (4.4, -2.0), 'ang': -0.3, 'bare': True}
POSE = {'hand': (2.6, -4.6), 'ang': -1.4, 'lean': -0.4}


# ---- 1. Gecko Genin: a little green gecko in a too-big hood. Throws one slow shuriken, then
# strikes a dramatic pose.
def gecko(c, p):
    pose = {'throw': THROW, 'pose': POSE}.get(p.name)
    lizard(c, p, 0.9, 'gecko', pose, hat=hood('ninja', 'ninjar', False), wear=gi(), hold=held(2.0))


# ---- 2. Gliding Draco: a flying lizard with orange wing-flaps that glides over you dropping
# shuriken.
def draco(c, p):
    def sails(c, p, L):
        bx, by, s = L['bx'], L['by'], L['s']
        k = {'idle1': 1}.get(p.name, int(p.name[-1]) % 2 if p.walk else 0)
        c.poly([(bx - 1, by - 1), (bx - 8 * s, by - 2 * s - k), (bx - 7 * s, by + 3 * s), (bx - 1, by + 2)], 'sail', base=3)
        for i in range(3):
            c.line([(bx - 1, by), (bx - (4 + i * 1.6) * s, by - 1 * s + i * 1.4 * s - k * 0.5)], ('sail', 1), thin=True)
    lizard(c, p, 1.0, 'draco', {'throw': THROW}.get(p.name), back=sails, hat=hood('ninja', 'sail', False), hold=held(2.2))


# ---- 3. Wall Gecko: a blue spotted tokay that runs up walls and across ceilings and throws from
# wherever it sticks.
def wallgecko(c, p):
    def spots(c, p, L):
        for dx, dy in ((-1.8, -1.6), (0.4, -2.2), (-0.6, 0.8), (1.6, 0.0), (-2.4, 1.6)):
            c.put(L['bx'] + dx * L['s'], L['by'] + dy * L['s'], ('sail', 4), flat=True)
    pose = {'throw': THROW}.get(p.name)
    lizard(c, p, 1.0, 'tokay', pose, belly='gbelly', eye=(250, 220, 80), hat=hood('ninja', 'tokay'), wear=spots, hold=held(2.2))


# ---- 4. Chameleon Shade: a chameleon that fades into the castle walls. All you see is the
# shimmer of its shuriken.
def chameleon(c, p):
    def crest(c, hx, hy, s, p):
        c.poly([(hx - 2.8 * s, hy - 1.6 * s), (hx - 1.0 * s, hy - 4.6 * s), (hx + 1.6 * s, hy - 2.4 * s)], 'cham', base=2)
        c.line([(hx - 3.6 * s, hy - 1.0 * s), (hx + 2.6 * s, hy - 1.4 * s)], ('ninjar', 3), w=1)
    def curl(c, p, L):  # the curled-up tail tip
        x, y = L['bx'] - 8.2 * L['s'], L['base'] - 3.0
        c.ball(x, y, 1.6 * L['s'], 1.6 * L['s'], 'cham', lift=-0.1)
    lizard(c, p, 1.05, 'cham', {'throw': THROW}.get(p.name), belly='cham', snout=0.8, eye=(250, 120, 60), hat=crest, front=curl, hold=held(2.2))


# ---- 5. Frilled Spinner: a frilled lizard whose frill flares when it throws; its star ricochets
# off the floor.
def frilled(c, p):
    flare = p.name in ('draw', 'throw')
    def frillc(c, p, L):
        hx, hy, s = L['bx'] + 1.2 * L['s'], L['by'] - L['bry'] - 2.4 * L['s'], L['s']
        r = (5.2 if flare else 3.6) * s
        c.ball(hx - 0.6 * s, hy + 0.6 * s, r, r, 'sail' if flare else 'frill', lift=-0.1)
        for k in range(6):
            a = math.pi * (0.6 + k * 0.17)
            c.line([(hx - 0.6 * s, hy + 0.6 * s), (hx - 0.6 * s + math.cos(a) * r, hy + 0.6 * s - math.sin(a) * r * 0.9)], ('frill', 1), thin=True)
    lizard(c, p, 1.05, 'frill', {'throw': THROW}.get(p.name), back=frillc, hat=hood('ninja', 'ninjar', False), wear=gi('ninja', 'frill'), hold=held(2.6))


# ---- 6. Smoke Anole: a green anole with a red throat fan and a belt of smoke bombs. Vanishes in a
# puff and throws from a new angle.
def anole(c, p):
    def dewlap(c, hx, hy, s, p):
        c.ball(hx + 0.6 * s, hy + 3.0 * s, 1.4 * s, 1.2 * s, 'ninjar', lift=0.3)
        hood('ninja', 'anole', False)(c, hx, hy, s, p)
    def bombs(c, p, L):
        for k in (-1.4, 0.8):
            c.ball(L['bx'] + k, L['by'] + 1.6, 1.0, 1.0, 'ninja', lift=0.3)
    lizard(c, p, 1.05, 'anole', {'throw': THROW}.get(p.name), hat=dewlap, wear=both(gi(), bombs), hold=held(2.2))


# ---- 7. Basilisk Runner: a crested basilisk that sprints across the floor on its hind legs,
# flinging stars as it goes.
def basilisk(c, p):
    def crest(c, hx, hy, s, p):
        for k in range(4):
            c.put(hx - 2.4 * s + k * 1.0 * s, hy - 3.6 * s - (k % 2) * 0.8 * s, ('basil', 4), flat=True)
        c.line([(hx - 3.6 * s, hy - 1.6 * s), (hx + 2.6 * s, hy - 1.9 * s)], ('ninjar', 3), w=2)
    pose = {'run': {'hand': (3.0, 1.0), 'ang': 0.3, 'lean': 2.0, 'dy': -0.4, 'tuck': True}, 'throw': THROW}.get(p.name)
    lizard(c, p, 1.1, 'basil', pose, hat=crest, wear=gi('ninja', 'basil'), hold=held(2.2))


# ---- 8. Boomerang Star Iguana: a big iguana with a giant shuriken on its back. Throws it out and
# catches it, and it cuts both ways.
def iguana(c, p):
    thrown = p.name in ('throw', 'loose')
    def bigstar(c, p, L):
        if not thrown:
            shuriken(c, L['bx'] - L['brx'] - 0.6, L['by'] - 2.4, L['s'], 4.4, 'shur', 0.4)
    def spikes(c, hx, hy, s, p):
        for k in range(5):
            c.put(hx - 3.0 * s - k * 1.2 * s, hy - 1.6 * s + k * 1.0 * s, ('iguana', 5), flat=True)
        c.ball(hx + 0.4 * s, hy + 2.8 * s, 1.4 * s, 1.0 * s, 'iguana', lift=0.2)
    lizard(c, p, 1.25, 'iguana', {'throw': THROW}.get(p.name), back=bigstar, hat=spikes, wear=gi('ninja', 'iguana'), hold=held(2.4), wide=1.15)


# ---- 9. Tail Clone Skink: a brown skink with a bright blue tail. Leaves decoys of itself behind;
# only the real one can be hurt.
def skink(c, p):
    lizard(c, p, 1.05, 'skink', {'throw': THROW}.get(p.name), tip='skinkt', snout=1.0, hat=hood('ninja', 'skinkt'), wear=gi('ninja', 'skinkt'), hold=held(2.2))


# ---- 10. Komodo Jonin: the castle's master, a huge komodo dragon in a jonin's armoured vest.
# Teleports, and fills the air with shuriken.
def komodo(c, p):
    def vest(c, p, L):
        gi('ninja', 'ninjar')(c, p, L)
        for i in range(4):
            c.line([(L['bx'] - L['brx'] * 0.7, L['by'] - L['bry'] * 0.5 + i * 1.6), (L['bx'] + L['brx'] * 0.6, L['by'] - L['bry'] * 0.6 + i * 1.6)], ('shur', 2))
    pose = {'throw': THROW, 'cast': {'hand': (1.6, -5.2), 'ang': -1.55, 'lean': -0.2}}.get(p.name)
    lizard(c, p, 1.65, 'komodo', pose, belly='komodo', snout=1.2, eye=(250, 200, 50), glow=True, hat=hood('ninja', 'ninjar', False), wear=vest, hold=held(2.8), wide=1.3)


DESIGNS = {
    'gecko': (32, 26, gecko, ['throw', 'pose']),
    'draco': (36, 30, draco, ['throw']),
    'wallgecko': (36, 30, wallgecko, ['throw']),
    'chameleon': (38, 32, chameleon, ['throw']),
    'frilled': (40, 34, frilled, ['throw']),
    'anole': (38, 32, anole, ['throw']),
    'basilisk': (40, 34, basilisk, ['run', 'throw']),
    'iguana': (44, 38, iguana, ['throw']),
    'skink': (38, 32, skink, ['throw']),
    'komodo': (62, 52, komodo, ['throw', 'cast']),
}
B.DESIGNS.update(DESIGNS)
