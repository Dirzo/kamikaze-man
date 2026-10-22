"""Zone 7, the Storm Forge: the bear, badger and boar family, blacksmiths with hammers, from a Cub
Apprentice who falls over its own mallet to the Iron Polar Bear. Built on the cat body from
beastkin_bazaar.py (round bear ears, a boar's snout and tusks) and added to beastkin.py.
"""
import math
import beastkin as B
from beastkin import R, ramp, INK, WHITE, mix
from beastkin_bazaar import cat
from beastkin_temple import both

R.update({
    'bear': ramp('#1e0e06', '#34190c', '#4e2814', '#6c3c20', '#8c5430', '#ae7044'),
    'cubf': ramp('#2a1608', '#462610', '#663a1a', '#8a5226', '#ae6e36', '#d08e4c'),
    'muzzle': ramp('#4a3420', '#6e5032', '#94704a', '#b89262', '#d8b47e', '#f2d49e'),
    'badger': ramp('#121216', '#202026', '#32323a', '#484852', '#62626e', '#82828e'),
    'boar': ramp('#2a140c', '#442214', '#62341e', '#82482a', '#a2603a', '#c27c4e'),
    'snoutp': ramp('#5a2a2a', '#84403c', '#ac5a52', '#cc786a', '#e6988a', '#fcbcae'),
    'hbadger': ramp('#0a0a0c', '#141418', '#1e1e24', '#2a2a32', '#383842', '#4a4a56'),
    'wolverine': ramp('#1a0e08', '#2c180e', '#422416', '#5a3420', '#76462c', '#94603e'),
    'grizzly': ramp('#24160c', '#3c2614', '#583a20', '#78522e', '#9a6c40', '#bc8a56'),
    'polar': ramp('#5c6070', '#80869a', '#a6acbe', '#c8cede', '#e4e8f2', '#fbfcff'),
    'iron': ramp('#16181e', '#262a34', '#3a404e', '#525a6c', '#6e788c', '#929cb0'),
    'apron': ramp('#1a0e08', '#2e1a0e', '#462818', '#603a24', '#7c4e32', '#986644'),
    'lava': ramp('#3a0804', '#6e1406', '#a8280a', '#e24a10', '#ff8a1e', '#ffd25a'),
    'brass': ramp('#3a2406', '#5e3c0c', '#8a5c16', '#b88222', '#dca834', '#f8d060'),
})


def hammer(c, x, y, ang, s=1.0, L=7.0, head=(3.0, 2.0), rp='iron', shaft='wood', lava=False):
    """a smith's hammer: a short shaft from the paw and a heavy block head across its end"""
    dx, dy = math.cos(ang), math.sin(ang)
    hx, hy = x + dx * L * s, y + dy * L * s
    c.line([(x - dx * 1.2 * s, y - dy * 1.2 * s), (hx, hy)], (shaft, 3), w=2 if s >= 1.2 else 1)
    a, b = head[0] * s, head[1] * s  # the head: a block across the shaft (a along it, b across)
    pts = [(hx - dy * a - dx * b * 0.5, hy + dx * a - dy * b * 0.5), (hx + dy * a - dx * b * 0.5, hy - dx * a - dy * b * 0.5),
           (hx + dy * a + dx * b, hy - dx * a + dy * b), (hx - dy * a + dx * b, hy + dx * a + dy * b)]
    c.poly(pts, 'lava' if lava else rp, base=4 if lava else 3)
    c.put(hx + dy * a * 0.7 + dx * b * 0.2, hy - dx * a * 0.7 + dy * b * 0.2, (('lava' if lava else rp), 5), flat=True)


def ham(s=1.0, L=7.0, head=(3.0, 2.0), rp='iron', lava=False):
    # at rest a hammer hangs head-down by the leg, not up by the face
    rest = lambda p, ang: 1.0 if (p.walk or p.name in ('idle0', 'idle1')) else ang
    return lambda c, p, L_, x, y, ang: hammer(c, x, y, rest(p, ang), s, L, head, rp, lava=lava)


def apron(rp='apron', strap='brass'):
    def wear(c, p, L):
        bx, by, brx, bry = L['bx'], L['by'], L['brx'], L['bry']
        c.ball(bx + brx * 0.25, by + 0.8, brx * 0.8, bry * 0.85, rp, lift=0.0, clip=lambda x, y: x > bx - brx * 0.3 and y > by - bry * 0.6)
        c.line([(bx - brx * 0.4, by - bry * 0.7), (bx + brx * 0.6, by - bry * 0.6)], (strap, 3))
    return wear


def tusks(c, hx, hy, s, p):
    c.ball(hx + 3.2 * s, hy + 1.0 * s, 0.9 * s, 1.0 * s, 'snoutp', lift=0.2)  # the flat pig nose
    x, y = hx + 2.8 * s, hy + 2.0 * s  # one curved tusk
    c.put(x, y, ('polar', 5), flat=True)
    c.put(x + 0.6 * s, y - 0.9 * s, ('polar', 4), flat=True)


def goggles(col='brass'):
    def hat(c, hx, hy, s, p):
        c.line([(hx - 3.6 * s, hy - 1.8 * s), (hx + 2.8 * s, hy - 2.2 * s)], ('leather', 2), w=2)
        c.ball(hx + 1.2 * s, hy - 2.3 * s, 1.1 * s, 0.9 * s, col, lift=0.3)
        c.put(hx + 1.4 * s, hy - 2.5 * s, (180, 230, 255), flat=True)
    return hat


def stripe(c, hx, hy, s, p):  # a badger's white face stripe
    c.line([(hx - 2.6 * s, hy - 2.6 * s), (hx + 0.6 * s, hy - 2.8 * s), (hx + 2.8 * s, hy - 0.6 * s)], ('polar', 5), w=2)


# ---- 1. Cub Apprentice: a bear cub in a too-big apron with a wooden mallet. Bonks, and the mallet
# pulls it over.
def cub(c, p):
    pose = {'trip': {'hand': (4.6, 3.6), 'ang': 0.9, 'dy': 1.6, 'lean': 1.4, 'hdy': 1.2}}.get(p.name)
    cat(c, p, 0.95, 'cubf', pose=pose, belly='muzzle', ears='round', tail='stub', snout=0.5, nose=INK, eye=(244, 214, 150), whisk=False,
        wear=apron(), weapon=ham(0.9, 6.0, (2.4, 2.2), 'wood'))


# ---- 2. Badger Tinker: a badger in goggles with a tack hammer. Burrows under the floor and pops
# up beneath you with an uppercut.
def badger(c, p):
    pose = {'hide': {'hand': (2.0, 3.0), 'ang': -1.5, 'dy': 4.0, 'tuck': True},
            'rise': {'hand': (3.0, -3.6), 'ang': -1.4, 'dy': -1.0, 'smear': (0.8, -1.4)}}.get(p.name)
    def dirt(c, p, L):
        if p.name == 'hide':
            for i in range(12):
                c.put(L['bx'] - 6 + i * 1.1, L['base'] - 1 - (i % 3 == 0), ('cubf', 1 + i % 3), flat=True)
    def hat(c, hx, hy, s, p):
        stripe(c, hx, hy, s, p)
        goggles()(c, hx, hy, s, p)
    cat(c, p, 1.0, 'badger', pose=pose, belly='polar', ears='round', tail='stub', snout=0.8, nose=INK, eye=(244, 214, 150), whisk=False,
        hat=hat, wear=apron('leather'), front=dirt, weapon=ham(1.0, 6.0, (2.2, 1.8)))


# ---- 3. Boar Bellows: a bristly boar who pumps the forge bellows. Charges with its hammer down,
# leaving a trail of fire.
def boarbellows(c, p):
    pose = {'charge': {'hand': (3.6, 2.4), 'ang': 0.3, 'lean': 1.6, 'dy': 0.8, 'hdy': 1.0}}.get(p.name)
    def bristles(c, p, L):
        for k in range(5):
            c.put(L['bx'] - L['brx'] * 0.6 + k * 1.1, L['by'] - L['bry'] - 0.4 - (k % 2), ('boar', 1), flat=True)
    cat(c, p, 1.05, 'boar', pose=pose, belly='boar', ears='flop', tail='stub', snout=0.9, nose=('snoutp', 3), eye=(240, 140, 40), whisk=False,
        hat=tusks, back=bristles, wear=apron(), weapon=ham(1.05, 7.0, (2.6, 2.0), 'iron', lava=True))


# ---- 4. Brown Bear Smith: a big brown bear in a leather apron. Its overhead slam cracks the
# floor both ways.
def bearsmith(c, p):
    pose = {'slam': {'hand': (5.0, 3.0), 'ang': 1.15, 'lean': 1.2, 'dy': 0.6, 'smear': (-1.4, 1.1)}}.get(p.name)
    cat(c, p, 1.25, 'bear', pose=pose, belly='muzzle', ears='round', tail='stub', snout=0.6, nose=INK, eye=(244, 214, 150), whisk=False,
        wear=apron(), weapon=ham(1.25, 8.0, (3.2, 2.4)), wide=1.2)


# ---- 5. Honey Badger Brute: small and furious. Every hit makes it angrier and faster.
def honeybadger(c, p):
    def mantle(c, p, L):  # the honey badger's grey-white back
        c.ball(L['bx'] - 0.6, L['by'] - L['bry'] * 0.55, L['brx'] * 1.0, L['bry'] * 0.5, 'polar', lift=-0.1, clip=lambda x, y: y < L['by'] - L['bry'] * 0.2)
    def hat(c, hx, hy, s, p):
        c.ball(hx - 0.6 * s, hy - 1.8 * s, 3.4 * s, 1.6 * s, 'polar', lift=0.0, clip=lambda x, y: y < hy - 1.2 * s, contour=False)
        c.line([(hx + 0.4 * s, hy - 1.6 * s), (hx + 2.6 * s, hy - 0.8 * s)], INK)  # the scowl
    cat(c, p, 1.0, 'hbadger', belly='hbadger', ears='round', tail='stub', snout=0.6, nose=INK, eye=(230, 60, 40), whisk=False,
        hat=hat, wear=mantle, weapon=ham(1.0, 6.5, (2.6, 2.2), 'iron'), wide=1.1)


# ---- 6. Anvil Tosser: a stocky boar who throws anvils. Up they go, and down they come where you
# stand.
def anviltoss(c, p):
    pose = {'throw': {'hand': (2.6, -4.6), 'ang': -1.4, 'bare': True}}.get(p.name)
    def hold(c, p, L, x, y):
        if p.name in ('throw', 'draw'):
            c.poly([(x - 3, y - 4), (x + 3, y - 4), (x + 2, y - 2), (x + 4, y), (x - 4, y), (x - 2, y - 2)], 'iron', base=3)
        else:
            hammer(c, x, y, L['g']['ang'], 1.1, 7.0, (2.6, 2.2))
    cat(c, p, 1.1, 'boar', pose=pose, belly='boar', ears='flop', tail='stub', snout=0.9, nose=('snoutp', 3), eye=(240, 140, 40), whisk=False,
        hat=tusks, wear=apron(), hold=hold, wide=1.2)


# ---- 7. Wolverine Riveter: a wolverine with a hammer in each paw. Spins into a tornado of iron.
def wolverine(c, p):
    spin = p.name.startswith('spin')
    k = int(p.name[-1]) if spin else 0
    pose = None
    if spin:
        a = [0.2, 2.3, 4.4][k]
        pose = {'hand': (math.cos(a) * 4.6, math.sin(a) * 2.4 + 0.5), 'ang': a, 'far': (math.cos(a + math.pi) * 4, math.sin(a + math.pi) * 2.4 + 0.5, a + math.pi),
                'smear': (a - 2.6, a)}
    def band(c, p, L):
        c.line([(L['bx'] - L['brx'] * 0.9, L['by'] - 0.4), (L['bx'] + L['brx'] * 0.6, L['by'] + 0.2)], ('muzzle', 4), w=2)
    cat(c, p, 1.05, 'wolverine', pose=pose, belly='muzzle', ears='round', tail='bush', tip='wolverine', snout=0.7, nose=INK, eye=(240, 200, 60), whisk=False,
        hat=goggles(), wear=band, dual=True, weapon=ham(1.05, 6.0, (2.4, 1.8)), wide=1.05)


# ---- 8. Molten Boar: a boar whose hammer glows white-hot. Its slams leave pools of lava, until it
# overheats and has to cool down.
def moltenboar(c, p):
    pose = {'slam': {'hand': (5.0, 3.0), 'ang': 1.15, 'lean': 1.2, 'dy': 0.6, 'smear': (-1.4, 1.1)},
            'cool': {'hand': (3.0, 3.6), 'ang': 1.4, 'dy': 1.4, 'lean': -0.4, 'hdy': 1.0}}.get(p.name)
    def glow(c, p, L):
        for k in range(5):
            c.put(L['bx'] - L['brx'] * 0.6 + k * 1.2, L['by'] - L['bry'] * 0.2 + (k % 2), ('lava', 4 + k % 2), flat=True)
    def steam(c, p, L):
        if p.name == 'cool':
            for i in range(8):
                c.put(L['hx'] - 3 + i, L['hy'] - 6 - (i % 3) * 1.5, (220, 220, 230), flat=True, thin=True)
    cat(c, p, 1.25, 'boar', pose=pose, belly='lava', front=steam, ears='flop', tail='stub', snout=0.9, nose=('snoutp', 3), eye=(255, 200, 60), glow=True, whisk=False,
        hat=tusks, wear=both(apron('iron', 'lava'), glow), weapon=ham(1.25, 8.0, (3.0, 2.4), lava=True), wide=1.25)


# ---- 9. Grizzly Foreman: the forge foreman with a brass bell and a sledgehammer. Rings the bell
# to rally the smiths, and its ground pound stuns.
def grizzly(c, p):
    pose = {'rally': {'hand': (1.4, -4.4), 'ang': -1.6, 'bare': True},
            'slam': {'hand': (5.0, 3.0), 'ang': 1.15, 'lean': 1.2, 'dy': 0.6, 'smear': (-1.4, 1.1)}}.get(p.name)
    def hold(c, p, L, x, y):
        if p.name == 'rally':
            c.ball(x, y - 2.2, 2.0, 2.2, 'brass', lift=0.3)
            c.put(x, y - 0.2, ('brass', 1), flat=True)
        else:
            hammer(c, x, y, L['g']['ang'], 1.6, 9.0, (3.6, 2.8))
    def hat(c, hx, hy, s, p):  # a foreman's flat cap
        c.ball(hx - 0.2 * s, hy - 2.6 * s, 3.8 * s, 1.4 * s, 'apron', lift=0.1, clip=lambda x, y: y < hy - 2.0 * s)
        c.line([(hx + 1.0 * s, hy - 2.2 * s), (hx + 4.2 * s, hy - 2.0 * s)], ('apron', 2), w=2)
    cat(c, p, 1.6, 'grizzly', pose=pose, belly='muzzle', ears='round', tail='stub', snout=0.6, nose=INK, eye=(244, 214, 150), whisk=False,
        hat=hat, wear=apron('leather', 'brass'), hold=hold, wide=1.35)


# ---- 10. Iron Polar Bear: a huge polar bear in riveted iron plate. Light hits ring off the armour;
# its giant hammer spins in a ring.
def polarbear(c, p):
    spin = p.name.startswith('spin')
    k = int(p.name[-1]) if spin else 0
    pose = None
    if spin:
        a = [0.3, 2.4, 4.5][k]
        pose = {'hand': (math.cos(a) * 2.4 + 1.0, -0.6), 'ang': a, 'smear': (a - 2.8, a)}
    def plate(c, p, L):
        bx, by, brx, bry = L['bx'], L['by'], L['brx'], L['bry']
        c.ball(bx + 0.2, by - 0.2, brx * 0.98, bry * 0.85, 'iron', lift=0.1)
        for i in range(5):
            c.put(bx - brx * 0.6 + i * brx * 0.32, by - bry * 0.5, ('iron', 5), flat=True)
            c.put(bx - brx * 0.6 + i * brx * 0.32, by + bry * 0.4, ('iron', 5), flat=True)
    def helm(c, hx, hy, s, p):
        c.ball(hx - 0.3 * s, hy - 2.0 * s, 3.8 * s, 2.4 * s, 'iron', lift=0.2, clip=lambda x, y: y < hy - 1.5 * s)
        c.line([(hx - 3.6 * s, hy - 1.5 * s), (hx + 3.2 * s, hy - 1.7 * s)], ('iron', 1), w=2)
    cat(c, p, 1.7, 'polar', pose=pose, belly='polar', ears='round', tail='stub', snout=0.7, nose=INK, eye=(244, 214, 150), whisk=False,
        hat=helm, wear=plate, weapon=ham(1.7, 10.0, (4.0, 3.0), 'iron'), wide=1.35)


DESIGNS = {
    'cub': (28, 26, cub, ['trip']),
    'badger': (32, 30, badger, ['hide', 'rise']),
    'boarbellows': (36, 30, boarbellows, ['charge']),
    'bearsmith': (42, 38, bearsmith, ['slam']),
    'honeybadger': (32, 30, honeybadger, []),
    'anviltoss': (36, 36, anviltoss, ['throw']),
    'wolverine': (36, 32, wolverine, ['spin0', 'spin1', 'spin2']),
    'moltenboar': (44, 38, moltenboar, ['slam', 'cool']),
    'grizzly': (58, 54, grizzly, ['rally', 'slam']),
    'polarbear': (62, 56, polarbear, ['spin0', 'spin1', 'spin2']),
}
B.DESIGNS.update(DESIGNS)
