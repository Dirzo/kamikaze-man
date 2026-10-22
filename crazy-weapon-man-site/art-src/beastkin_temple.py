"""Zone 6, the Mountain Staff Monastery: the monkey, goat and yak family, monastery monks with
staves, from a Novice Macaque tripping on its robe to the Cloud Ape Master. Built on the cat body
from beastkin_bazaar.py (monkey faces and ears, goat horns) and added to beastkin.py.
"""
import math
import beastkin as B
from beastkin import R, ramp, INK, WHITE, mix
from beastkin_bazaar import cat

R.update({
    'macaque': ramp('#2e1e14', '#4a3222', '#6a4a34', '#8c664a', '#ae8664', '#d0aa86'),
    'mface': ramp('#7a3a34', '#a4544a', '#c87262', '#e4927e', '#f6b49e', '#ffd6c2'),
    'gibbon': ramp('#0e0c10', '#1c181e', '#2c2630', '#3e3644', '#544a5a', '#6e6474'),
    'gface': ramp('#3a2e28', '#5a4a40', '#7e6a5c', '#a28c7a', '#c4ae9a', '#e4d0bc'),
    'snowm': ramp('#3a3a40', '#5a5a62', '#7e7e88', '#a4a4ae', '#cacad2', '#f0f0f6'),
    'baboon': ramp('#2a2a14', '#44421e', '#62602c', '#82803e', '#a4a256', '#c6c474'),
    'golden': ramp('#4a2a04', '#7a4808', '#ae6c10', '#dc9418', '#f6bc30', '#ffe070'),
    'goat': ramp('#4a4438', '#6e6656', '#968e7a', '#bcb4a0', '#ddd6c4', '#fbf8ee'),
    'ibex': ramp('#2e1e0e', '#4c3418', '#6e4e24', '#926c34', '#b48c4a', '#d6ae68'),
    'horn': ramp('#1e1810', '#3a3020', '#5a4c34', '#7e6c4c', '#a48e68', '#c8b48c'),
    'yak': ramp('#140c08', '#24160e', '#382416', '#4e3620', '#684a2e', '#866440'),
    'ape': ramp('#141a2a', '#222c44', '#344262', '#4a5c84', '#6678a6', '#8a9cc6'),
    'saffron': ramp('#4a1e04', '#7a3008', '#ae4a0e', '#dc6c18', '#f6942c', '#ffbe5a'),
    'maroon': ramp('#1e0408', '#36080e', '#560e16', '#781a20', '#9a2a2c', '#bc423c'),
    'cloud': ramp('#7c84a0', '#9aa2bc', '#b8c0d6', '#d4dae8', '#ecf0f8', '#ffffff'),
    'jade': ramp('#062a1e', '#0c4632', '#14664a', '#208a62', '#38ae7e', '#64d0a0'),
})


def staff(c, x, y, ang, L=10.0, back=5.0, rp='wood', cap='gold', w=2):
    """a quarterstaff gripped near the middle: `back` behind the hand, `L` in front, capped at both ends"""
    dx, dy = math.cos(ang), math.sin(ang)
    a, b = (x - dx * back, y - dy * back), (x + dx * L, y + dy * L)
    c.line([a, b], (rp, 3), w=w)
    c.line([(a[0] - dy * 0.4, a[1] + dx * 0.4), (b[0] - dy * 0.4, b[1] + dx * 0.4)], (rp, 4), thin=True)
    if cap:
        for ex, ey in (a, b):
            c.put(ex, ey, (cap, 4), flat=True)
            c.put(ex - dx * (1 if (ex, ey) == b else -1), ey - dy * (1 if (ex, ey) == b else -1), (cap, 3), flat=True)


def stf(s=1.0, L=9.0, back=5.0, rp='wood', cap='gold'):
    return lambda c, p, L_, x, y, ang: staff(c, x, y, ang, L * s, back * s, rp, cap, w=2 if s >= 1.0 else 1)


def robe(rp='saffron', sash='maroon', long=True):
    """a monk's robe over one shoulder, with a sash, down to the knees"""
    def wear(c, p, L):
        bx, by, brx, bry = L['bx'], L['by'], L['brx'], L['bry']
        c.ball(bx, by + 0.6, brx * 1.04, bry * (0.95 if long else 0.8), rp, lift=0.0, clip=lambda x, y: y > by - bry * 0.5 or x < bx)
        c.line([(bx - brx * 0.9, by - bry * 0.5), (bx + brx * 0.8, by + bry * 0.4)], (sash, 3), w=2)
    return wear


def beads(c, p, L):
    for i in range(7):
        a = 0.2 + i * 0.42
        c.put(L['bx'] + math.cos(a) * L['brx'] * 0.6 + 0.4, L['by'] - L['bry'] * 0.55 + math.sin(a) * 2.0, ('jade', 4 - i % 2), flat=True)


def horns(rp='horn', kind='goat'):
    def hat(c, hx, hy, s, p):
        if kind == 'goat':  # swept back
            c.capsule(hx - 0.4 * s, hy - 2.6 * s, hx - 3.6 * s, hy - 4.6 * s, 0.9 * s, 0.5 * s, rp, lift=0.1)
            c.capsule(hx - 3.6 * s, hy - 4.6 * s, hx - 5.0 * s, hy - 3.0 * s, 0.5 * s, 0.3 * s, rp, lift=0.1)
        elif kind == 'ibex':  # long ridged scimitars
            pts = [(hx - 0.2 * s, hy - 2.8 * s), (hx - 2.6 * s, hy - 5.8 * s), (hx - 5.6 * s, hy - 6.6 * s), (hx - 7.4 * s, hy - 5.0 * s)]
            for i, ((ax, ay), (bx_, by_)) in enumerate(zip(pts, pts[1:])):
                c.capsule(ax, ay, bx_, by_, 1.0 * s - i * 0.25 * s, 0.8 * s - i * 0.25 * s, rp, lift=0.1)
            for k in range(4):
                x, y = pts[0][0] - k * 1.4 * s, pts[0][1] - k * 0.9 * s - 0.4 * s
                c.put(x, y, (rp, 1), flat=True)
        else:  # a yak's: out to the sides and up
            for side in (-1, 1):
                x0 = hx + side * 2.0 * s - 0.4 * s
                c.capsule(x0, hy - 2.2 * s, x0 + side * 2.8 * s, hy - 3.0 * s, 1.0 * s, 0.7 * s, rp, lift=0.1 if side > 0 else -0.1)
                c.capsule(x0 + side * 2.8 * s, hy - 3.0 * s, x0 + side * 3.4 * s, hy - 5.4 * s, 0.7 * s, 0.35 * s, rp, lift=0.1 if side > 0 else -0.1)
    return hat


def beard(rp='goat', n=3.0):
    def f(c, p, L):
        x, y, s = L['hx'] + 2.0 * L['s'], L['hy'] + 2.2 * L['s'], L['s']
        c.poly([(x - 1.4 * s, y - 0.4 * s), (x + 0.8 * s, y - 0.4 * s), (x - 0.4 * s, y + n * s)], rp, base=4)
    return f


def both(*fs):
    def f(*a):
        for g in fs:
            if g:
                g(*a)
    return f


# ---- 1. Novice Macaque: a little macaque in a robe too long for it. A wobbly staff poke, and every
# so often it trips on the hem.
def macaque(c, p):
    pose = {'trip': {'hand': (4.6, 3.6), 'ang': 0.7, 'dy': 1.6, 'lean': 1.4, 'hdy': 1.2}}.get(p.name)
    cat(c, p, 0.9, 'macaque', pose=pose, belly='mface', face='mface', ears='monkey', tail='cat', nose=('mface', 1), eye=(236, 176, 64),
        wear=robe(), weapon=stf(0.9, 8.0, 4.0, 'twig', None))


# ---- 2. Pole Vault Monkey: plants its staff and vaults high over the floor to land on you.
def vaultmonkey(c, p):
    def band(c, hx, hy, s, p):
        c.line([(hx - 3.2 * s, hy - 2.2 * s), (hx + 2.6 * s, hy - 2.7 * s)], ('saffron', 4), w=2)
    pose = {'vault': {'hand': (1.4, 4.0), 'ang': 1.45, 'dy': -1.4, 'lean': 1.0, 'tuck': True},
            'jump': {'hand': (3.6, 2.4), 'ang': 0.9, 'dy': -1.6, 'tuck': True}}.get(p.name)
    cat(c, p, 1.0, 'macaque', pose=pose, belly='mface', face='mface', ears='monkey', tail='cat', nose=('mface', 1), eye=(236, 176, 64),
        hat=band, wear=robe('saffron', 'maroon', False), weapon=stf(1.0, 11.0, 6.0))


# ---- 3. Mountain Goat Acolyte: a white goat in a maroon robe. Lowers its horns and charges, then
# follows it with a sweep of the staff along the floor.
def goatmonk(c, p):
    pose = {'ram': {'hand': (-1.4, 1.6), 'ang': 2.8, 'lean': 1.8, 'dy': 0.8, 'hdy': 1.8},
            'sweep': {'hand': (4.8, 3.6), 'ang': 0.25, 'dy': 1.2, 'smear': (0.9, 0.2), 'lean': 0.6}}.get(p.name)
    cat(c, p, 1.05, 'goat', pose=pose, belly='goat', ears='goat', tail='stub', snout=1.0, nose=('horn', 1), eye=(200, 160, 40),
        hat=horns('horn', 'goat'), wear=robe('maroon', 'saffron'), front=beard('goat', 2.4), weapon=stf(1.05, 9.0))


# ---- 4. Spinning Gibbon: long-armed and black-furred; it whirls its staff so fast that arrows
# bounce off it.
def gibbon(c, p):
    spin = p.name.startswith('spin')
    k = int(p.name[-1]) if spin else 0
    pose = None
    if spin:
        a = [0.3, 2.4, 4.5][k]
        pose = {'hand': (math.cos(a) * 3.0 + 1.4, -1.0), 'ang': a, 'smear': (a - 2.8, a), 'lean': 0.2}
    def blur(c, p, L):
        if spin:
            for i in range(16):
                a = i / 16 * math.pi * 2 + k * 0.7
                c.put(L['h2x'] + math.cos(a) * 9, L['h2y'] + math.sin(a) * 9, R['cloud'][3 + i % 3], flat=True, thin=True)
    cat(c, p, 1.0, 'gibbon', pose=pose, belly='gface', face='gface', ears='monkey', tail='stub', nose=('gface', 1), eye=(240, 190, 60),
        wear=robe('saffron', 'maroon', False), front=blur, weapon=stf(1.0, 9.0, 9.0))


# ---- 5. Snow Monkey Sage: an old snow monkey with a white beard. Sits and meditates to heal the
# monks around it.
def snowsage(c, p):
    med = p.name == 'meditate'
    pose = {'meditate': {'hand': (1.8, 1.4), 'ang': -1.57, 'dy': 1.8, 'tuck': True}}.get(p.name)
    def aura(c, p, L):
        if med:
            for i in range(14):
                a = i / 14 * math.pi * 2
                c.put(L['bx'] + math.cos(a) * 9, L['by'] - 1 + math.sin(a) * 9, R['jade'][3 + i % 3], flat=True, thin=True)
    cat(c, p, 1.1, 'snowm', pose=pose, belly='mface', face='mface', ears='monkey', tail='stub', nose=('mface', 1), eye=(236, 176, 64),
        wear=both(robe('saffron', 'maroon'), beads), front=both(beard('snowm', 2.6), aura), weapon=stf(1.1, 10.0, 3.0, 'wood', 'jade'))


# ---- 6. Extending Staff Baboon: a big baboon with a magic staff that shoots out across the screen.
def baboon(c, p):
    pose = {'extend': {'hand': (5.6, 0.0), 'ang': 0.0, 'lean': 1.0, 'smear': None}}.get(p.name)
    cat(c, p, 1.15, 'baboon', pose=pose, belly='mface', face='mface', ears='monkey', tail='cat', snout=1.0, nose=('mface', 1), eye=(240, 180, 40),
        wear=robe('maroon', 'gold', False), weapon=stf(1.15, 9.0, 5.0, 'red', 'gold'), wide=1.15)


# ---- 7. Cliff Ibex: a sure-footed ibex with great curved horns. Leaps high and comes straight down
# on you staff-first.
def ibex(c, p):
    pose = {'jump': {'hand': (3.0, -2.0), 'ang': -1.2, 'dy': -1.8, 'tuck': True},
            'plunge': {'hand': (2.4, 3.6), 'ang': 1.45, 'dy': -0.6, 'tuck': True}}.get(p.name)
    cat(c, p, 1.1, 'ibex', pose=pose, belly='goat', ears='goat', tail='stub', snout=1.1, nose=('horn', 1), eye=(220, 170, 40),
        hat=horns('horn', 'ibex'), wear=robe('saffron', 'maroon', False), front=beard('ibex', 1.8), weapon=stf(1.1, 10.0))


# ---- 8. Golden Langur: a golden monkey that strings five quick strikes together and launches you
# with the last.
def langur(c, p):
    pose = {'launch': {'hand': (3.0, -3.6), 'ang': -1.3, 'smear': (0.8, -1.4), 'dy': -0.6}}.get(p.name)
    def crest(c, hx, hy, s, p):
        for k in range(4):
            c.put(hx - 1.2 * s + k * 0.8 * s, hy - 3.6 * s - (k % 2) * 0.6, ('golden', 5), flat=True)
    cat(c, p, 1.05, 'golden', pose=pose, belly='gface', face='gface', ears='monkey', tail='cat', nose=('gface', 0), eye=(236, 120, 40),
        hat=crest, wear=robe('maroon', 'gold', False), weapon=stf(1.05, 9.0, 5.0, 'red', 'gold'))


# ---- 9. Temple Yak: the monastery's huge shaggy guardian. Slow, and its slam raises rock spikes
# out of the floor.
def yak(c, p):
    pose = {'slam': {'hand': (5.0, 3.0), 'ang': 1.15, 'lean': 1.2, 'dy': 0.6, 'smear': (-1.4, 1.1)}}.get(p.name)
    def shag(c, p, L):
        for k in range(9):
            x = L['bx'] - L['brx'] * 0.9 + k * L['brx'] * 0.22
            c.line([(x, L['by'] + L['bry'] * 0.5), (x - 0.4, L['by'] + L['bry'] * 0.95 + (k % 2))], ('yak', 1 + k % 2))
        robe('maroon', 'saffron', False)(c, p, L)
    cat(c, p, 1.65, 'yak', pose=pose, belly='goat', ears='goat', tail='stub', snout=0.5, nose=('horn', 1), eye=(250, 196, 70), whisk=False,
        hat=horns('cloud', 'yak'), wear=shag, weapon=stf(1.65, 9.0, 5.0, 'wood', 'gold'), wide=1.4)


# ---- 10. Cloud Ape Master: the old master on its flying cloud. Sends clones of itself at you and
# spins its great staff in a ring.
def cloudape(c, p):
    spin = p.name.startswith('spin')
    k = int(p.name[-1]) if spin else 0
    pose = {'cast': {'hand': (1.4, -4.6), 'ang': -1.57, 'lean': -0.2}}.get(p.name)
    if spin:
        a = [0.3, 2.4, 4.5][k]
        pose = {'hand': (math.cos(a) * 2.4 + 1.0, -0.6), 'ang': a, 'smear': (a - 2.8, a)}
    def cloudseat(c, p, L):
        base, sw = L['base'], {'idle1': 0.6}.get(p.name, 0)
        for i, (dx, r) in enumerate(((-9, 4.0), (-3, 5.2), (4, 4.8), (10, 3.6))):
            c.ball(L['bx'] + dx, base - 2.6 + sw + (i % 2) * 0.6, r, 2.8, 'cloud', lift=0.2)
        if spin:
            for i in range(20):
                a = i / 20 * math.pi * 2 + k * 0.7
                c.put(L['h2x'] + math.cos(a) * 14, L['h2y'] + math.sin(a) * 12, R['gold'][3 + i % 3], flat=True, thin=True)
    def crown(c, hx, hy, s, p):
        c.line([(hx - 3.4 * s, hy - 2.4 * s), (hx + 2.6 * s, hy - 2.8 * s)], ('gold', 4), w=2)
        c.put(hx - 0.4 * s, hy - 3.2 * s, ('jade', 4), flat=True)
    cat(c, p, 1.6, 'ape', pose=pose, belly='gface', face='gface', ears='monkey', tail='cat', nose=('gface', 1), eye=(250, 210, 60), glow=True,
        hat=crown, wear=robe('saffron', 'gold'), front=cloudseat, weapon=stf(1.6, 11.0, 8.0, 'red', 'gold'), wide=1.2)


DESIGNS = {
    'macaque': (28, 26, macaque, ['trip']),
    'vaultmonkey': (34, 34, vaultmonkey, ['vault', 'jump']),
    'goatmonk': (36, 34, goatmonk, ['ram', 'sweep']),
    'gibbon': (40, 34, gibbon, ['spin0', 'spin1', 'spin2']),
    'snowsage': (34, 34, snowsage, ['meditate']),
    'baboon': (40, 34, baboon, ['extend']),
    'ibex': (38, 40, ibex, ['jump', 'plunge']),
    'langur': (38, 32, langur, ['loose2', 'loose3', 'launch']),
    'yak': (60, 54, yak, ['slam']),
    'cloudape': (64, 58, cloudape, ['spin0', 'spin1', 'spin2', 'cast']),
}
B.DESIGNS.update(DESIGNS)
