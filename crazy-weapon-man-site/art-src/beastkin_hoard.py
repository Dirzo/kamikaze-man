"""Zone 10, the Gold Vault: the dragon hoard family. Dragonkin hoarders with pangolins and
armadillos, and every one of them carries a different zone's weapon, from a Whelp Squire with a
sword to the Elder Hoard Dragon, who uses all nine. Built on the cat body from beastkin_bazaar.py
(no ears, a snout, a lizard's tail, horns and wings) and added to beastkin.py.
"""
import math
import beastkin as B
from beastkin import R, ramp, INK, WHITE, mix, bow, sword
from beastkin_bazaar import cat, dagger
from beastkin_temple import both, staff
from beastkin_shrine import katana
from beastkin_forge import hammer, apron
from beastkin_cottage import wand
from beastkin_castle import shuriken

R.update({
    'whelp': ramp('#3a0e0a', '#5e1810', '#8a2618', '#b43a22', '#da5a32', '#f48450'),
    'wbelly': ramp('#5a3a10', '#86581a', '#b07c28', '#d4a03c', '#ecc25a', '#fae08a'),
    'magpie': ramp('#08080e', '#121420', '#1e2234', '#2c324c', '#3e4868', '#566488'),
    'mwhite': ramp('#6a6e78', '#8e929c', '#b0b4bc', '#cfd2d8', '#e8eaee', '#ffffff'),
    'pango': ramp('#2a1a0c', '#422a14', '#5e3e1e', '#7e562a', '#a0703a', '#c08e50'),
    'pskin': ramp('#5a3a2a', '#7c5240', '#a06c56', '#c08a72', '#dcaa92', '#f2caae'),
    'dillo': ramp('#2e2620', '#463a30', '#625244', '#806e5c', '#a08c78', '#c0ae98'),
    'ember': ramp('#3a1404', '#622206', '#8e340a', '#bc4c10', '#e46c1c', '#ff9a3a'),
    'wyrm': ramp('#0a2a26', '#10423c', '#186058', '#228076', '#30a094', '#4cc2b2'),
    'gem': ramp('#24103e', '#381a60', '#502686', '#6c36ac', '#8c4ece', '#b072ec'),
    'crystal': ramp('#1e3a5a', '#2a5a86', '#3a7eb0', '#56a4d6', '#84c8f0', '#c2e8ff'),
    'kobold': ramp('#1e2430', '#2c3446', '#3e4a62', '#526282', '#6a7ea2', '#8ca0c4'),
    'hoard': ramp('#4a3004', '#74500a', '#a07412', '#c89a1e', '#e8c032', '#fce46a'),
    'scale': ramp('#3a1a04', '#5e2c08', '#86420e', '#ae5c16', '#d27c24', '#f0a03a'),
    'wing': ramp('#3a0e14', '#5a1820', '#7e2630', '#a03844', '#c0505a', '#de7076'),
    'coin': ramp('#5a3a04', '#86600a', '#b48a14', '#dcb424', '#f6d84a', '#fff6a8'),
})


def horns(rp='bone', n=2, big=1.0):
    """a dragon's swept-back horns (and a little crest ridge behind them)"""
    def hat(c, hx, hy, s, p):
        for k in range(n):
            x0 = hx - 1.6 * s + k * 1.8 * s
            c.poly([(x0 - 0.6 * s, hy - 2.4 * s), (x0 - 2.6 * s * big, hy - 4.8 * s * big), (x0 + 0.8 * s, hy - 2.8 * s)], rp, base=3 if k else 2)
    return hat


def wings(rp='wing', bone='whelp', size=1.0):
    """bat-like dragon wings off the back, flapping a little as it walks"""
    def back(c, p, L):
        bx, by, s = L['bx'], L['by'], L['s'] * size
        k = 1 if (p.name == 'idle1' or (p.walk and int(p.name[-1]) % 2)) else 0
        if p.name in ('draw', 'cast', 'breath', 'sky'):
            k = -2
        top = (bx - 3 * s, by - 9 * s - k)
        pts = [(bx - 0.5, by - 2), top, (bx - 9 * s, by - 6 * s - k), (bx - 8.4 * s, by - 1.4 * s), (bx - 5.2 * s, by - 2.6 * s), (bx - 3.4 * s, by + 0.6 * s)]
        c.poly(pts, rp, base=2)
        for q in pts[2:5]:
            c.line([top, q], (bone, 2), thin=True)
    return back


def scales(rp, rows=3):
    """overlapping scale rows over the body (a pangolin's armour, an armadillo's bands)"""
    def wear(c, p, L):
        bx, by, brx, bry = L['bx'], L['by'], L['brx'], L['bry']
        for r in range(rows):
            y = by - bry * 0.7 + r * bry * 0.6
            for i in range(4):
                x = bx - brx * 0.9 + i * brx * 0.55 + (r % 2) * brx * 0.25
                c.ball(x, y, brx * 0.34, bry * 0.26, rp, lift=0.15 - r * 0.05, clip=lambda x_, y_: y_ < y + 0.6)
    return wear


def ball_form(rp, r=6.0, eye=True, roll=0):
    """curled up into an armoured ball (a pangolin rolling, an armadillo shelled up)"""
    def draw(c, p):
        x, y = c.w * 0.5, c.h - 2 - r
        c.ball(x, y, r, r, rp, lift=0.05)
        for i in range(5):
            a = roll * 0.6 + i * math.pi / 2.5
            c.line([(x + math.cos(a) * r * 0.35, y + math.sin(a) * r * 0.35), (x + math.cos(a) * r * 0.95, y + math.sin(a) * r * 0.95)], (rp, 1), thin=True)
        if eye:
            c.put(x + r * 0.55, y + r * 0.2, INK, flat=True)
    return draw


def dragon(c, p, s, skin, pose=None, belly='wbelly', **kw):
    kw.setdefault('eye', (250, 210, 60))
    return cat(c, p, s, skin, pose=pose, belly=belly, ears='none', tail='lizard', snout=kw.pop('snout', 1.1), nose=kw.pop('nose', INK), whisk=False, **kw)


def sw(s=1.0, L=7.0):
    return lambda c, p, L_, x, y, ang: sword(c, x, y, ang, L * s, w=2 if s >= 1.1 else 1, guard='gold', hilt='leather', gw=2.0, pommel=True)


def bw(s=1.0):
    def weapon(c, p, L_, x, y, ang):
        bow(c, x + 0.6, y, -0.15 if p.name != 'draw' else -0.2, 5.6 * s, 'wood', pull=0.9 if p.name == 'draw' else 0.0, arrow=p.name == 'draw', thick=2)
    return weapon


def ch(s=1.0):
    def weapon(c, p, L_, x, y, ang):
        from beastkin_lagoon import chucks  # imported late: beastkin_lagoon loads after this module
        chucks(c, x, y, ang, 3.2 * s, ang + (1.2 if p.name != 'loose' else 0.2), r=0.8 * s)
    return weapon


def dg(s=1.0):
    return lambda c, p, L_, x, y, ang: dagger(c, x, y, ang, s)


def kt(s=1.0):
    return lambda c, p, L_, x, y, ang: katana(c, x, y, ang, s, 8.0)


def st(s=1.0):
    return lambda c, p, L_, x, y, ang: staff(c, x, y, ang, 9.0 * s, 4.0 * s, w=2 if s >= 1.0 else 1)


def hm(s=1.0, rp='iron'):
    return lambda c, p, L_, x, y, ang: hammer(c, x, y, 1.0 if (p.walk or p.name in ('idle0', 'idle1')) else ang, s, 7.0, (3.0, 2.0), rp)


def wd(s=1.0, tip='crystal'):
    return lambda c, p, L_, x, y, ang: wand(c, x, y, ang, s, 6.0, tip, 'twig')


def sh(s=1.0):
    return lambda c, p, L_, x, y, ang: shuriken(c, x + 1.6, y - 1.0, s, 3.0)


SWING = {'hand': (4.8, 0.6), 'ang': 0.0}
THROW = {'hand': (4.4, -2.0), 'ang': -0.3, 'bare': True}
CAST = {'hand': (2.0, -5.0), 'ang': -1.5, 'lean': -0.2}


# ---- 1. Whelp Squire: a little red dragon whelp with a squire's sword, too big for it.
def whelp(c, p):
    dragon(c, p, 0.9, 'whelp', hat=horns('bone'), back=wings('wing', 'whelp', 0.8), weapon=sw(0.9, 7.0))


# ---- 2. Pangolin Roller: a pangolin with nunchucks that curls up and bowls itself at you.
def pangolin(c, p):
    if p.name in ('roll0', 'roll1'):
        return ball_form('pango', 6.0, roll=int(p.name[-1]))(c, p)
    cat(c, p, 1.0, 'pango', belly='pskin', ears='none', tail='lizard', snout=1.6, nose=INK, eye=(30, 20, 16), whisk=False,
        wear=scales('wbelly', 3), weapon=ch(1.0))


# ---- 3. Magpie Dragon: a black and white little dragon with a bow and an eye for shiny things. It
# snatches your loot and shoots it back at you.
def magpie(c, p):
    def bib(c, hx, hy, s, p):
        horns('mwhite', 2, 0.8)(c, hx, hy, s, p)
        c.ball(hx + 1.6 * s, hy + 2.6 * s, 1.8 * s, 1.2 * s, 'mwhite', lift=0.2)
    def sack(c, p, L):  # the loot sack on its back
        c.ball(L['bx'] - L['brx'] - 0.4, L['by'] - 0.8, 2.2 * L['s'], 2.2 * L['s'], 'leather', lift=0.1)
        c.put(L['bx'] - L['brx'] - 0.4, L['by'] - 3.0 * L['s'], ('coin', 5), flat=True)
    pose = {'hand': (4.0, -0.4), 'ang': 0.0, 'smear': None} if p.name in ('draw', 'loose', 'idle0', 'idle1') or p.walk else None
    dragon(c, p, 1.0, 'magpie', pose, belly='mwhite', eye=(120, 220, 255), hat=bib, back=both(wings('magpie', 'mwhite', 0.9), sack), weapon=bw(1.0))


# ---- 4. Armadillo Duelist: an armadillo fencer with a dagger in each paw. Spins in, then shells up.
def armadillo(c, p):
    if p.name == 'shell':
        return ball_form('dillo', 6.5)(c, p)
    if p.name.startswith('spin'):
        return ball_form('dillo', 6.5, roll=int(p.name[-1]))(c, p) or _blades(c, p)
    cat(c, p, 1.05, 'dillo', belly='pskin', ears='round', tail='lizard', snout=1.4, nose=INK, eye=(40, 30, 20), whisk=False,
        wear=scales('dillo', 3), dual=True, weapon=dg(1.0))


def _blades(c, p):  # the two daggers flashing round the spinning ball
    k = int(p.name[-1])
    x, y = c.w * 0.5, c.h - 2 - 6.5
    for j in (0, 1):
        a = k * 2.1 + j * math.pi
        dagger(c, x + math.cos(a) * 7.5, y + math.sin(a) * 4.0, a + 1.6, 1.0)


# ---- 5. Ember Drake Ronin: an orange drake with a katana and a straw hat. Its quick-draw leaves a
# line of fire.
def ember(c, p):
    def kasa(c, hx, hy, s, p):
        horns('bone', 2, 0.9)(c, hx, hy, s, p)
        c.poly([(hx - 5.0 * s, hy - 1.8 * s), (hx + 0.2 * s, hy - 5.0 * s), (hx + 5.0 * s, hy - 1.8 * s)], 'tan', base=3)
    dragon(c, p, 1.1, 'ember', hat=kasa, back=wings('scale', 'ember', 0.8), weapon=kt(1.0), eye=(255, 230, 120), glow=True)


# ---- 6. Wyrmling Monk: a teal wyrmling in a monk's robe with a staff, and flame breath.
def wyrmling(c, p):
    from beastkin_temple import robe
    pose = {'breath': {'hand': (3.0, 1.4), 'ang': 0.3, 'hdy': -0.4, 'lean': 0.6}}.get(p.name)
    def flame(c, p, L):
        if p.name == 'breath':
            hx, hy, s = L['hx'], L['hy'], L['s']
            for i in range(5):
                c.ball(hx + (4.6 + i * 1.8) * s, hy + 1.2 * s + (i % 2) * 0.6, (0.9 + i * 0.35) * s, (0.8 + i * 0.3) * s, 'lava' if i < 2 else 'ember', lift=0.3)
    dragon(c, p, 1.1, 'wyrm', pose, hat=horns('bone', 2, 0.8), wear=robe('saffron', 'maroon', False), back=wings('wyrm', 'wyrm', 0.7), weapon=st(1.0), front=flame)


# ---- 7. Plated Pangolin Smith: a big pangolin in a smith's apron. Its hammer blows scatter hot
# coins.
def platedpango(c, p):
    cat(c, p, 1.3, 'pango', belly='pskin', ears='none', tail='lizard', snout=1.6, nose=INK, eye=(30, 20, 16), whisk=False, wide=1.15,
        wear=both(scales('wbelly', 3), apron('apron', 'brass')), weapon=hm(1.2, 'coin'), pose={'slam': {'hand': (4.6, 1.8), 'ang': 1.1, 'lean': 0.8}}.get(p.name))


# ---- 8. Gem Wyrm Mage: a purple wyrm studded with crystals, a crystal-tipped wand. Throws shards.
def gemwyrm(c, p):
    def gems(c, p, L):
        for dx, dy in ((-2.0, -2.0), (0.6, -2.8), (-0.8, 0.6)):
            x, y, s = L['bx'] + dx * L['s'], L['by'] + dy * L['s'], L['s']
            c.poly([(x, y - 1.4 * s), (x + 0.9 * s, y), (x, y + 1.0 * s), (x - 0.9 * s, y)], 'crystal', base=4)
    dragon(c, p, 1.15, 'gem', {'cast': CAST}.get(p.name), belly='crystal', eye=(200, 250, 255), glow=True, hat=horns('crystal', 3, 0.9),
           back=wings('gem', 'crystal', 0.8), wear=gems, weapon=wd(1.1, 'crystal'))


# ---- 9. Shadow Kobold: a little slate-grey kobold, sneaky, with a pouch of shuriken.
def kobold(c, p):
    def mask(c, hx, hy, s, p):
        horns('bone', 2, 0.6)(c, hx, hy, s, p)
        c.line([(hx - 3.6 * s, hy - 1.0 * s), (hx + 3.0 * s, hy - 1.2 * s)], ('ninjar', 3), w=2)
    dragon(c, p, 0.95, 'kobold', {'throw': THROW}.get(p.name), belly='kobold', eye=(255, 80, 60), glow=True, hat=mask, weapon=sh(1.0))


# ---- 10. Elder Hoard Dragon: the vault's great gold dragon, sitting on the hoard. It fights with
# every weapon in turn: a frame for each.
ELDER = {
    'w_sword': (sw(1.4, 9.0), SWING), 'w_bow': (bw(1.5), {'hand': (4.0, -0.6), 'ang': 0.0}), 'w_chucks': (ch(1.4), SWING),
    'w_dagger': (dg(1.4), SWING), 'w_katana': (kt(1.4), SWING), 'w_staff': (st(1.4), SWING), 'w_hammer': (hm(1.6, 'coin'), {'hand': (4.2, -1.0), 'ang': 0.4}),
    'w_wand': (wd(1.4, 'coin'), CAST), 'w_star': (sh(1.6), {'hand': (4.4, -2.0), 'ang': -0.3}),
}


def elder(c, p):
    w, pose = ELDER.get(p.name, (sw(1.4, 9.0), {'cast': CAST}.get(p.name)))
    def crown(c, hx, hy, s, p):
        horns('hoard', 3, 1.1)(c, hx, hy, s, p)
        for i in range(3):
            c.put(hx - 1.2 * s + i * 1.2 * s, hy - 3.2 * s - (i % 2), ('coin', 5), flat=True)
    def hoard(c, p, L):  # a heap of coins round its feet
        base = L['base']
        for i in range(9):
            c.ball(L['bx'] - 8 + i * 2.4, base - 0.6 - (i % 3) * 0.6, 1.4, 0.8, 'coin', lift=0.3 - (i % 2) * 0.2)
    dragon(c, p, 1.75, 'hoard', pose, belly='wbelly', eye=(255, 90, 40), glow=True, snout=1.3, hat=crown, back=wings('wing', 'hoard', 1.15),
           wear=scales('scale', 2), weapon=w, front=hoard, wide=1.25)


DESIGNS = {
    'whelp': (34, 30, whelp, []),
    'pangolin': (38, 30, pangolin, ['roll0', 'roll1']),
    'magpie': (38, 32, magpie, []),
    'armadillo': (40, 32, armadillo, ['spin0', 'spin1', 'spin2', 'shell']),
    'ember': (42, 36, ember, []),
    'wyrmling': (42, 36, wyrmling, ['breath']),
    'platedpango': (48, 40, platedpango, ['slam']),
    'gemwyrm': (44, 38, gemwyrm, ['cast']),
    'kobold': (34, 30, kobold, ['throw']),
    'elder': (70, 60, elder, ['cast'] + list(ELDER)),
}
B.DESIGNS.update(DESIGNS)
