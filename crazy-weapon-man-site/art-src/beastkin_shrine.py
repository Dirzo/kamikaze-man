"""Zone 5, the Sakura Katana Shrine: the dog and fox family, samurai hounds in lacquered armour and
fox spirits among the petals, from a clumsy Shiba Pup to the Nine Tail Sage. Built on the cat
body from beastkin_bazaar.py (longer snouts, other ears and tails) and added to beastkin.py.
"""
import math
import beastkin as B
from beastkin import R, ramp, INK, WHITE, mix, smear, sword
from beastkin_bazaar import cat

R.update({
    'shiba': ramp('#3e1a08', '#6a2e10', '#9a4a1c', '#c8702c', '#e89a4a', '#ffc47c'),
    'cream': ramp('#5a4c3a', '#86745a', '#b2a07e', '#d8c8a4', '#f0e6cc', '#fffaf0'),
    'corgi': ramp('#3a1c08', '#663212', '#96501c', '#c27428', '#e49c40', '#fcc46a'),
    'akita': ramp('#2a1e16', '#463428', '#6c523e', '#947456', '#bc9a76', '#e0c49e'),
    'husky': ramp('#1a1e28', '#2e3442', '#4a5264', '#6e788a', '#98a2b2', '#c8d0dc'),
    'fox': ramp('#3e1206', '#6e200a', '#a43612', '#d4561e', '#f27e34', '#ffac5e'),
    'windfx': ramp('#0e2a2a', '#18443e', '#24645a', '#38887a', '#5aae9c', '#8cd4c2'),
    'tosa': ramp('#2a0c08', '#48160e', '#6e2618', '#963a24', '#ba5634', '#d87a4c'),
    'sage': ramp('#3a3020', '#5e5034', '#8c7a52', '#b8a474', '#dccc9c', '#fff6d4'),
    'lacq': ramp('#1a0408', '#36080e', '#5a1018', '#821c22', '#aa302e', '#d04c40'),
    'lacqb': ramp('#08080c', '#121218', '#1c1c26', '#282836', '#383848', '#4c4c60'),
    'sakura': ramp('#5a1e36', '#8a3054', '#b84a74', '#de7098', '#f49cbc', '#ffd0e0'),
})


def katana(c, x, y, ang, s=1.0, L=8.0, rp='steel', w=None):
    sword(c, x, y, ang, L * s, rp=rp, w=w or (2 if s >= 1.3 else 1), guard='gold', hilt='lacqb', gw=1.0, pommel=False)


def kat(s=1.0, L=8.0, rp='steel'):
    return lambda c, p, L_, x, y, ang: katana(c, x, y, ang, s, L, rp)


def hachimaki(col='paper'):
    """a headband, its tails flying behind"""
    def hat(c, hx, hy, s, p):
        rp = 'cream' if col == 'paper' else col
        c.line([(hx - 3.4 * s, hy - 2.4 * s), (hx + 2.6 * s, hy - 2.9 * s)], (rp, 4), w=2)
        c.line([(hx - 3.6 * s, hy - 2.0 * s), (hx - 6.0 * s, hy - 1.2 * s + p.bob)], (rp, 3))
    return hat


def kabuto(c, hx, hy, s, p, crest='gold'):
    c.ball(hx - 0.3 * s, hy - 2.1 * s, 3.9 * s, 2.7 * s, 'lacq', lift=0.1, clip=lambda x, y: y < hy - 1.7 * s)
    c.line([(hx - 4.0 * s, hy - 1.7 * s), (hx + 3.2 * s, hy - 2.0 * s)], ('lacqb', 2), w=2)
    c.poly([(hx - 0.8 * s, hy - 3.8 * s), (hx + 2.6 * s, hy - 6.4 * s), (hx + 0.8 * s, hy - 3.6 * s)], crest, base=4)  # the crest
    c.poly([(hx - 1.2 * s, hy - 3.8 * s), (hx - 3.8 * s, hy - 6.2 * s), (hx - 0.2 * s, hy - 3.8 * s)], crest, base=3)


def do_armour(c, p, L, rp='lacq'):
    """a lacquered chest plate laced in rows"""
    bx, by, brx, bry = L['bx'], L['by'], L['brx'], L['bry']
    c.ball(bx + 0.2, by - 0.2, brx * 0.98, bry * 0.85, rp, lift=0.0)
    for k in (-0.35, 0.05, 0.45):
        c.line([(bx - brx * 0.8, by + k * bry), (bx + brx * 0.85, by + k * bry - 0.4)], (rp, 1))
    c.line([(bx - brx * 0.7, by + bry * 0.7), (bx + brx * 0.8, by + bry * 0.6)], ('gold', 3))


def petals(c, p, L, n=5, r=8):
    k = {'idle0': 0, 'idle1': 1}.get(p.name, int(p.name[-1]) if p.walk else 2)
    for i in range(n):
        a = i * 1.3 + k * 0.4
        c.put(L['bx'] + math.cos(a) * r, L['by'] - 2 + math.sin(a) * r * 0.7, R['sakura'][3 + i % 3], flat=True, thin=True)


# ---- 1. Shiba Pup: an eager little shiba in a white headband with a bokken. Its lunge-slash
# overshoots and it trips over its own feet.
def shibapup(c, p):
    pose = {'trip': {'hand': (4.6, 3.6), 'ang': 0.9, 'dy': 1.6, 'lean': 1.4, 'hdy': 1.2}}.get(p.name)
    cat(c, p, 0.9, 'shiba', pose=pose, belly='cream', tail='curl', ears='cat', snout=0.6, nose=INK, eye=(40, 30, 30),
        hat=hachimaki(), weapon=kat(0.9, 6.5, 'wood'))


# ---- 2. Corgi Ashigaru: a corgi foot-soldier in a jingasa hat. Short legs, long reach: a low
# sweeping slash along the floor. Jump it.
def corgi(c, p):
    def jingasa(c, hx, hy, s, p):
        c.poly([(hx - 5.0 * s, hy - 2.6 * s), (hx - 0.2 * s, hy - 5.4 * s), (hx + 4.6 * s, hy - 2.6 * s)], 'lacqb', base=3)
        c.put(hx - 0.2 * s, hy - 4.4 * s, ('gold', 4), flat=True)
    pose = {'sweep': {'hand': (4.8, 3.6), 'ang': 0.25, 'dy': 1.2, 'smear': (0.9, 0.2), 'lean': 0.6}}.get(p.name)
    cat(c, p, 1.0, 'corgi', pose=pose, belly='cream', tail='stub', ears='cat', snout=0.8, nose=INK, eye=(40, 30, 30),
        hat=jingasa, wide=1.25, weapon=kat(1.0, 8.0))


# ---- 3. Akita Ronin: a big quiet akita with a straw hat pulled low. Stands with its hand on the
# hilt, then a quick-draw flash carries it right across the floor.
def akita(c, p):
    def hat(c, hx, hy, s, p):
        c.poly([(hx - 5.2 * s, hy - 0.6 * s), (hx + 0.2 * s, hy - 3.8 * s), (hx + 5.2 * s, hy - 0.8 * s)], 'twig', base=3)
        c.line([(hx - 5.0 * s, hy - 0.6 * s), (hx + 5.0 * s, hy - 0.8 * s)], ('twig', 1))
    stance = p.name == 'stance'
    pose = {'stance': {'hand': (0.6, 2.6), 'ang': 2.6, 'bare': True, 'dy': 0.8, 'lean': 0.4},
            'iaido': {'hand': (6.0, -0.4), 'ang': -0.2, 'dx': 2.4, 'lean': 0.8, 'smear': None}}.get(p.name)
    def wear(c, p, L):  # the scabbard at its hip, sword in it while it waits
        x, y = L['bx'] - 0.6, L['by'] + L['bry'] * 0.3
        c.line([(x - 5, y + 2.4), (x + 4, y - 1.2)], ('lacqb', 3), w=2)
        if stance:
            c.line([(x + 4, y - 1.2), (x + 7, y - 2.4)], ('lacqb', 1), w=2)
            c.put(x + 4, y - 1.4, ('gold', 4), flat=True)
    def flash(c, p, L):
        if p.name == 'iaido':
            for k in range(14):
                c.put(L['bx'] - 4 - k * 0.9, L['by'] - 2 + (k % 2) * 0.5, mix((120, 140, 200), WHITE, k / 14), thin=True, flat=True)
    cat(c, p, 1.15, 'akita', pose=pose, belly='cream', tail='curl', ears='cat', snout=0.9, nose=INK, eye=(30, 20, 20),
        hat=hat, wear=wear, front=flash, weapon=kat(1.15, 9.0))


# ---- 4. Petal Kitsune: a slim orange fox in a shrine-maiden's red and white. Hit it and the fox
# you hit is a decoy of petals; the real one is already somewhere else.
def petalfox(c, p):
    def robe(c, p, L):
        c.ball(L['bx'], L['by'] + 0.6, L['brx'] * 1.05, L['bry'] * 0.85, 'cream', lift=0.05)
        c.ball(L['bx'], L['by'] + L['bry'] * 0.55, L['brx'] * 1.1, L['bry'] * 0.5, 'red', lift=0.0, clip=lambda x, y: y > L['by'] + 0.8)
    cat(c, p, 1.0, 'fox', belly='cream', tail='bush', ears='tall', tip='cream', snout=1.0, nose=INK, eye=(250, 200, 60),
        wear=robe, front=lambda c, p, L: petals(c, p, L), weapon=kat(1.0, 7.0))


# ---- 5. Husky Sentry: a husky in full lacquered armour that guards high and low. Hitting its
# guard is hopeless; it parries, counters, and is open just after.
def husky(c, p):
    pose = {'guard': {'hand': (3.0, -1.6), 'ang': -1.75, 'lean': -0.3}}.get(p.name)
    cat(c, p, 1.15, 'husky', pose=pose, belly='cream', tail='curl', ears='cat', snout=0.8, nose=INK, eye=(110, 190, 255),
        hat=lambda c, hx, hy, s, p: kabuto(c, hx, hy, s, p), wear=do_armour, weapon=kat(1.15, 9.0))


# ---- 6. Twin Blade Inu: a lean grey hound with a katana in each paw, spinning one way and then
# the other as it comes at you.
def twininu(c, p):
    spin = p.name.startswith('spin')
    k = int(p.name[-1]) if spin else 0
    pose = None
    if spin:
        a = [0.2, 2.3, 4.4][k]
        pose = {'hand': (math.cos(a) * 4.6, math.sin(a) * 2.4 + 0.5), 'ang': a, 'far': (math.cos(a + math.pi) * 4, math.sin(a + math.pi) * 2.4 + 0.5, a + math.pi),
                'smear': (a - 2.6, a)}
    cat(c, p, 1.05, 'husky', pose=pose, belly='cream', tail='cat', ears='flop', snout=1.1, nose=INK, eye=(250, 200, 60),
        hat=hachimaki('red'), dual=True, weapon=kat(1.05, 7.5), wide=0.9)


# ---- 7. Wind Fox: a teal fox spirit whose cuts send crescents of wind rolling along the floor.
def windfox(c, p):
    def swirl(c, p, L):
        if p.name in ('draw', 'loose'):
            for i in range(10):
                a = i * 0.6
                c.put(L['h2x'] + math.cos(a) * (2 + i * 0.4), L['h2y'] - 3 + math.sin(a) * (2 + i * 0.4), R['windfx'][5 - i % 3], flat=True, thin=True)
    cat(c, p, 1.05, 'windfx', belly='cream', tail='bush', tails=2, ears='tall', tip='cream', snout=1.0, nose=INK, eye=(255, 240, 150),
        front=swirl, weapon=kat(1.05, 8.0))


# ---- 8. Hound Guard: a shrine guard dog with a quiver of petal kunai. Throws a volley,
# then closes in with the katana.
def houndguard(c, p):
    def quiver(c, p, L):
        x, y = L['bx'] - L['brx'] - 0.6, L['by'] - 2
        c.capsule(x, y + 3, x - 1.2, y - 5, 1.4, 1.2, 'leather', lift=0.0)
        for k in (-1, 0, 1):
            c.put(x - 1.2 + k, y - 6.4, ('sakura', 4), flat=True)
    pose = {'throw': {'hand': (4.6, -2.4), 'ang': -0.4, 'bare': True}}.get(p.name)
    cat(c, p, 1.1, 'akita', pose=pose, belly='cream', tail='cat', ears='flop', snout=1.0, nose=INK, eye=(40, 30, 20),
        back=quiver, hat=hachimaki('lacq'), wear=lambda c, p, L: do_armour(c, p, L, 'lacqb'), weapon=kat(1.1, 8.0))


# ---- 9. Tosa Champion: a huge armoured fighting dog. Its charge can't be stopped and leaves you
# dazed; light hits barely move it.
def tosa(c, p):
    pose = {'charge': {'hand': (3.6, 2.4), 'ang': 0.3, 'lean': 1.6, 'dy': 0.8, 'hdy': 1.0}}.get(p.name)
    cat(c, p, 1.6, 'tosa', pose=pose, belly='akita', tail='cat', ears='flop', snout=0.8, nose=INK, eye=(40, 20, 20),
        hat=lambda c, hx, hy, s, p: kabuto(c, hx, hy, s, p, 'gold'), wear=lambda c, p, L: do_armour(c, p, L, 'lacqb'), weapon=kat(1.6, 10.0), wide=1.35)


# ---- 10. Nine Tail Sage: the shrine's ancient fox, nine tails fanned out behind it. Blinks from
# place to place and calls down storms of razor petals.
def ninetail(c, p):
    def robe(c, p, L):
        c.ball(L['bx'], L['by'] + 0.6, L['brx'] * 1.1, L['bry'] * 0.9, 'lacq', lift=0.05)
        c.line([(L['bx'] + L['brx'] * 0.5, L['by'] - L['bry'] * 0.7), (L['bx'] - L['brx'] * 0.2, L['by'] + L['bry'] * 0.8)], ('gold', 4), w=2)
    pose = {'storm': {'hand': (1.6, -5.2), 'ang': -1.55, 'lean': -0.2}}.get(p.name)
    front = (lambda c, p, L: petals(c, p, L, 12, 14)) if p.name in ('storm', 'draw') else (lambda c, p, L: petals(c, p, L, 4, 10))
    cat(c, p, 1.55, 'sage', pose=pose, belly='cream', tail='bush', tails=9, ears='tall', tip='cream', snout=1.1, nose=INK,
        eye=(240, 120, 255), glow=True, wear=robe, front=front, weapon=kat(1.55, 9.0, 'steel'))


DESIGNS = {
    'shibapup': (28, 26, shibapup, ['trip']),
    'corgi': (36, 28, corgi, ['sweep']),
    'akita': (40, 34, akita, ['stance', 'iaido']),
    'petalfox': (36, 32, petalfox, []),
    'husky': (36, 36, husky, ['guard']),
    'twininu': (36, 30, twininu, ['spin0', 'spin1', 'spin2']),
    'windfox': (38, 32, windfox, []),
    'houndguard': (36, 34, houndguard, ['throw']),
    'tosa': (54, 50, tosa, ['charge']),
    'ninetail': (56, 50, ninetail, ['storm']),
}
B.DESIGNS.update(DESIGNS)
