"""Zone 8, the storybook cottage: the owl, bunny and hedgehog family, cozy woodland familiars with
wands, knitted caps and teapots (a picture book, not a haunted house), from a Dust Bunny to the
Grand Horned Owl. Built on the cat body from beastkin_bazaar.py and added to beastkin.py.
"""
import math
import beastkin as B
from beastkin import R, ramp, INK, WHITE, mix
from beastkin_bazaar import cat
from beastkin_temple import both

R.update({
    'dust': ramp('#4a4650', '#6c6876', '#928e9c', '#b6b2c0', '#d6d2de', '#f4f2f8'),
    'hare': ramp('#3a2414', '#5a3a20', '#7e5630', '#a27444', '#c4965e', '#e2b880'),
    'hedge': ramp('#2a1c12', '#44301e', '#62482e', '#826442', '#a2825a', '#c2a276'),
    'spine': ramp('#1a120c', '#2e2016', '#463222', '#5e4632', '#7a5e46', '#98785c'),
    'owl': ramp('#3a2a1a', '#5a4228', '#7e5e3a', '#a27c50', '#c49c6a', '#e2bc88'),
    'owlface': ramp('#7a6a58', '#a0907a', '#c4b49c', '#e0d2ba', '#f2e8d6', '#fffaf0'),
    'grey': ramp('#2e3036', '#464a52', '#62666e', '#80848c', '#a0a4ac', '#c4c8ce'),
    'moth': ramp('#5a4a3a', '#7e6a52', '#a28c6e', '#c4ae8c', '#e0ceac', '#f8ecd0'),
    'pig': ramp('#6a3a3a', '#94524e', '#ba6e66', '#d88c80', '#eeac9e', '#ffccbe'),
    'bat': ramp('#2a1a12', '#42281c', '#5e3a28', '#7c5036', '#9c6a48', '#bc865c'),
    'batwing': ramp('#2a1a20', '#3e2630', '#563442', '#6e4454', '#885668', '#a06a7c'),
    'knit': ramp('#3a1416', '#5e2024', '#8a3034', '#b24448', '#d6625e', '#f28a7c'),
    'knitb': ramp('#122a3a', '#1c4258', '#285e7a', '#3a7e9c', '#5aa0bc', '#86c2d8'),
    'honey': ramp('#4a2a04', '#7a4808', '#ac6c10', '#d8941a', '#f4bc34', '#ffde70'),
    'leafg': ramp('#14280e', '#203e16', '#30581e', '#447428', '#5e9234', '#82b04a'),
    'china': ramp('#5a6a8a', '#7c8cac', '#a0aec8', '#c4d0e2', '#e2e8f2', '#fbfcff'),
    'star': ramp('#4a3a08', '#7a600c', '#ac8a14', '#dab422', '#f8d84a', '#fff4a0'),
    'robeb': ramp('#121a3a', '#1c2858', '#283a7a', '#384e9c', '#5068bc', '#7088d8'),
})


def wand(c, x, y, ang, s=1.0, L=6.0, tip='star', rp='twig'):
    """a little wooden wand with a twinkle at its tip"""
    dx, dy = math.cos(ang), math.sin(ang)
    ex, ey = x + dx * L * s, y + dy * L * s
    c.line([(x - dx * s, y - dy * s), (ex, ey)], (rp, 3))
    c.put(ex, ey, (tip, 5), flat=True)
    for ox, oy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        c.put(ex + ox, ey + oy, (tip, 3), flat=True)


def wnd(s=1.0, L=6.0, tip='star', rp='twig'):
    return lambda c, p, L_, x, y, ang: wand(c, x, y, ang, s, L, tip, rp)


def beak(c, hx, hy, s, p):
    c.poly([(hx + 1.6 * s, hy + 0.2 * s), (hx + 3.2 * s, hy + 0.9 * s), (hx + 1.8 * s, hy + 2.2 * s)], 'honey', base=3)


def owlhead(extra=None):
    """an owl's face: a pale disc, big round eyes, a hooked beak"""
    def hat(c, hx, hy, s, p):
        beak(c, hx, hy, s, p)
        if extra:
            extra(c, hx, hy, s, p)
    return hat


def wings(rp, spread=False, flap=0):
    def back(c, p, L):
        bx, by, s = L['bx'], L['by'], L['s']
        k = {'idle1': 1}.get(p.name, int(p.name[-1]) % 2 if p.walk else flap)
        if spread:
            up = -3.0 if k else 1.0
            c.poly([(bx - 1, by - 2), (bx - 9 * s, by - 3 * s + up * s), (bx - 7 * s, by + 1 * s + up * 0.5 * s), (bx - 1, by + 2)], rp, base=2)
        else:
            c.ball(bx - 1.6 * s, by + 0.2, 2.4 * s, 3.4 * s, rp, lift=-0.2)
    return back


def knitcap(col='knit', bobble='owlface'):
    def hat(c, hx, hy, s, p):
        c.ball(hx - 0.4 * s, hy - 2.0 * s, 3.8 * s, 2.4 * s, col, lift=0.1, clip=lambda x, y: y < hy - 1.6 * s)
        c.line([(hx - 4.0 * s, hy - 1.6 * s), (hx + 3.2 * s, hy - 1.9 * s)], (col, 1), w=2)
        c.ball(hx - 1.2 * s, hy - 4.6 * s, 1.1 * s, 1.1 * s, bobble, lift=0.2)
    return hat


def scarf(col='knitb'):
    def wear(c, p, L):
        bx, by, brx, bry = L['bx'], L['by'], L['brx'], L['bry']
        c.line([(bx - brx * 0.8, by - bry * 0.8), (bx + brx * 0.8, by - bry * 0.75)], (col, 3), w=2)
        c.line([(bx - brx * 0.7, by - bry * 0.7), (bx - brx * 1.3, by - bry * 0.1 + p.bob)], (col, 4), w=2)
    return wear


# ---- 1. Dust Bunny: a fluffball of a grey bunny with a twig wand. A sparkle zap, then it hops off.
def dustbunny(c, p):
    cat(c, p, 0.85, 'dust', belly='owlface', ears='bunny', tail='stub', nose=('pink', 3), eye=(60, 50, 70), whisk=False, weapon=wnd(0.85, 5.0))


# ---- 2. Hedgehog Hexer: a hedgehog in a knitted cap. Curls into a spiky ball (nothing gets
# through), then pops open in a ring of sparks.
def hedgehog(c, p):
    curl = p.name == 'curl'
    def spines(c, p, L):
        bx, by, s = L['bx'], L['by'], L['s']
        r = 6.0 * s if curl else 5.0 * s
        cy_ = by + (1.5 if curl else -1.0)
        for i in range(11 if curl else 8):
            a = math.pi * (0.55 + i / (10 if curl else 8) * (1.9 if curl else 0.9))
            c.line([(bx + math.cos(a) * r * 0.5, cy_ + math.sin(a) * r * 0.5), (bx + math.cos(a) * r * 1.15, cy_ + math.sin(a) * r * 1.05)], ('spine', 2 + i % 2))
        c.ball(bx - 0.6, cy_, r * 0.75, r * 0.7 if not curl else r * 0.75, 'spine', lift=-0.1)
    if curl:
        def ball(c, p):
            L = {'bx': c.w * 0.5, 'by': c.h - 2 - 6.0, 's': 1.0}
            spines(c, p, L)
            c.ball(L['bx'] + 1.6, L['by'] + 2.0, 2.0, 1.6, 'hedge', lift=0.2)
            c.put(L['bx'] + 3.2, L['by'] + 1.6, INK, flat=True)
        return ball(c, p)
    cat(c, p, 0.95, 'hedge', belly='owlface', ears='round', tail='stub', snout=0.8, nose=INK, eye=(30, 20, 20), whisk=False,
        back=spines, hat=knitcap('knitb', 'owlface'), weapon=wnd(0.95, 5.5, 'star'))


# ---- 3. Barn Owlet: a little barn owl that flies over you and drops slow glowing orbs.
def owlet(c, p):
    cat(c, p, 0.9, 'owl', belly='owlface', face='owlface', ears='none', tail='stub', nose=('honey', 4), eye=(30, 20, 20), whisk=False,
        back=wings('owl', spread=True), hat=owlhead(), weapon=wnd(0.9, 5.0, 'knitb'))


# ---- 4. Hat Rabbit: a white rabbit in a top hat. Pulls something out of it: doves, a little bomb,
# or a carrot that heals.
def hatrabbit(c, p):
    def tophat(c, hx, hy, s, p):
        c.ball(hx - 0.2 * s, hy - 3.0 * s, 3.6 * s, 0.8 * s, 'grey', lift=-0.3)
        c.poly([(hx - 2.2 * s, hy - 3.0 * s), (hx - 1.8 * s, hy - 7.4 * s), (hx + 1.8 * s, hy - 7.4 * s), (hx + 2.0 * s, hy - 3.0 * s)], 'grey', base=1)
        c.line([(hx - 2.0 * s, hy - 3.8 * s), (hx + 1.9 * s, hy - 3.8 * s)], ('knit', 3))
    def hold(c, p, L, x, y):
        if p.name == 'pull':
            c.ball(x + 1, y - 1.2, 1.4, 1.2, 'owlface', lift=0.3)  # a dove's head peeking out
            c.put(x + 2.4, y - 1.4, ('honey', 4), flat=True)
        else:
            wand(c, x, y, L['g']['ang'], 1.0, 6.0, 'owlface', 'grey')
    pose = {'pull': {'hand': (3.6, -3.4), 'ang': -1.2, 'bare': True}}.get(p.name)
    cat(c, p, 1.0, 'owlface', pose=pose, belly='owlface', ears='bunny', tail='stub', nose=('pink', 3), eye=(200, 60, 80), whisk=False,
        hat=tophat, wear=scarf('knit'), hold=hold)


# ---- 5. Moth Weaver: a fuzzy cream moth in a shawl. Scatters clouds of wing-dust that blur
# your view.
def moth(c, p):
    def mwings(c, p, L):
        bx, by, s = L['bx'], L['by'], L['s']
        k = {'idle1': 1}.get(p.name, int(p.name[-1]) % 2 if p.walk else 0)
        for side, lift in ((1, -0.2), (0, 0.0)):
            up = 1.5 if k else 0
            c.poly([(bx - 1, by - 3), (bx - 8 * s, by - 7 * s - up), (bx - 9 * s, by - 1 * s), (bx - 1, by + 1)], 'moth', base=2 + side)
            c.put(bx - 6 * s, by - 4 * s - up * 0.5, ('honey', 4), flat=True)
    def antennae(c, hx, hy, s, p):
        for k in (-0.6, 0.8):
            c.line([(hx + k * s, hy - 2.8 * s), (hx + (k + 1.0) * s, hy - 5.6 * s)], ('moth', 1), thin=True)
            c.put(hx + (k + 1.0) * s, hy - 5.8 * s, ('moth', 4), flat=True)
    cat(c, p, 1.05, 'moth', belly='owlface', ears='none', tail='stub', snout=0.0, nose=('moth', 1), eye=(40, 30, 60), whisk=False,
        back=mwings, hat=antennae, wear=scarf('knit'), weapon=wnd(1.05, 6.0, 'honey'))


# ---- 6. Polymorph Hare: a brown hare in spectacles with a big acorn wand. Its spell turns you
# into a bunny for a few seconds.
def polyhare(c, p):
    def specs(c, hx, hy, s, p):
        for x in (hx + 1.3 * s, hx - 1.3 * s):
            c.line([(x - 0.9 * s, hy - 1.6 * s), (x + 0.9 * s, hy - 1.6 * s)], ('honey', 4), thin=True)
        c.line([(hx - 0.4 * s, hy - 1.6 * s), (hx + 0.4 * s, hy - 1.6 * s)], ('honey', 3), thin=True)
    cat(c, p, 1.1, 'hare', belly='owlface', ears='bunny', tail='stub', nose=('pink', 3), eye=(40, 30, 20), whisk=False,
        hat=specs, wear=scarf('leafg'), weapon=wnd(1.1, 7.0, 'leafg', 'wood'))


# ---- 7. Tea Kettle Hog: a round pink pig in a tea cosy hat with a teapot. Teacups circle it, then
# fly at you.
def teahog(c, p):
    def cosy(c, hx, hy, s, p):
        c.ball(hx - 0.4 * s, hy - 2.2 * s, 4.0 * s, 2.8 * s, 'knitb', lift=0.1, clip=lambda x, y: y < hy - 1.6 * s)
        for k in range(4):
            c.put(hx - 3.0 * s + k * 1.8 * s, hy - 2.4 * s, ('owlface', 5), flat=True)
        c.ball(hx - 0.4 * s, hy - 5.0 * s, 1.0 * s, 1.0 * s, 'knit', lift=0.2)
    def hold(c, p, L, x, y):  # the teapot, spout out
        c.ball(x + 1.4, y + 0.4, 2.6, 2.2, 'china', lift=0.2)
        c.line([(x + 3.6, y), (x + 5.4, y - 1.6)], ('china', 3), w=2)
        c.put(x + 1.4, y - 1.6, ('knitb', 4), flat=True)
    pose = {'pour': {'hand': (3.6, 0.4), 'ang': 0.6, 'bare': True}}.get(p.name)
    cat(c, p, 1.25, 'pig', pose=pose, belly='pig', ears='flop', tail='stub', snout=0.5, nose=('pig', 4), eye=(40, 20, 20), whisk=False,
        hat=cosy, wear=scarf('knit'), hold=hold, wide=1.3)


# ---- 8. Mirror Owl: a grey owl holding up a silver hand mirror. Whatever you just did to it, it
# does back to you.
def mirrorowl(c, p):
    def hold(c, p, L, x, y):
        c.line([(x, y + 1), (x + 1, y - 2)], ('honey', 3), w=2)
        c.ball(x + 1.6, y - 4.0, 2.2, 2.6, 'china', lift=0.4)
        c.put(x + 1.0, y - 4.8, WHITE, flat=True)
    pose = {'mirror': {'hand': (3.0, -2.4), 'ang': -1.3, 'bare': True}}.get(p.name)
    cat(c, p, 1.15, 'grey', pose=pose, belly='owlface', face='owlface', ears='tufts', tail='stub', nose=('honey', 4), eye=(240, 190, 50), whisk=False,
        back=wings('grey'), hat=owlhead(), hold=hold)


# ---- 9. Broom Bat Witch: a friendly fruit bat in a patchwork scarf, riding a broom. Swoops past
# and sprinkles star bolts.
def broombat(c, p):
    def broom(c, p, L):
        bx, base = L['bx'], L['by'] + L['bry'] + 0.4
        c.line([(bx - 9, base + 0.6), (bx + 9, base - 0.8)], ('wood', 3), w=2)
        for k in range(5):
            c.line([(bx - 9, base + 0.6), (bx - 13, base - 1.4 + k)], ('honey', 2 + k % 2))
    def ears(c, hx, hy, s, p):
        for k, lift in ((-1.6, 2), (1.0, 3)):
            c.poly([(hx + k * s - 1.0 * s, hy - 2.6 * s), (hx + k * s, hy - 5.4 * s), (hx + k * s + 1.2 * s, hy - 2.8 * s)], 'bat', base=lift)
    pose = {'cast': {'hand': (3.0, -3.0), 'ang': -1.0}}.get(p.name)
    cat(c, p, 1.05, 'bat', pose=pose, belly='hare', ears='none', tail='stub', snout=0.4, nose=('pig', 2), eye=(240, 190, 60), whisk=False,
        back=wings('batwing', spread=True), hat=ears, wear=both(scarf('knit'), lambda c, p, L: None), front=broom,
        weapon=wnd(1.05, 6.0, 'star'))


# ---- 10. Grand Horned Owl: the cottage's old archmage in a starry robe. A shield bubble keeps it
# safe until a combo breaks it, and it calls down a meteor.
def hornedowl(c, p):
    def robe(c, p, L):
        c.ball(L['bx'], L['by'] + 0.6, L['brx'] * 1.1, L['bry'] * 0.95, 'robeb', lift=0.05)
        for dx, dy in ((-2, -1), (1, 2), (-1, 3), (2, -2)):
            c.put(L['bx'] + dx, L['by'] + dy, ('star', 5), flat=True)
    pose = {'cast': {'hand': (1.6, -5.2), 'ang': -1.55, 'lean': -0.2}}.get(p.name)
    cat(c, p, 1.6, 'owl', pose=pose, belly='owlface', face='owlface', ears='tufts', tail='stub', nose=('honey', 4), eye=(250, 170, 40), glow=True, whisk=False,
        back=wings('owl'), hat=owlhead(), wear=robe, weapon=wnd(1.6, 9.0, 'star', 'wood'), wide=1.2)


DESIGNS = {
    'dustbunny': (26, 30, dustbunny, []),
    'hedgehog': (30, 28, hedgehog, ['curl']),
    'owlet': (34, 28, owlet, []),
    'hatrabbit': (32, 38, hatrabbit, ['pull']),
    'moth': (36, 34, moth, []),
    'polyhare': (34, 40, polyhare, []),
    'teahog': (42, 40, teahog, ['pour']),
    'mirrorowl': (36, 36, mirrorowl, ['mirror']),
    'broombat': (42, 36, broombat, ['cast']),
    'hornedowl': (54, 54, hornedowl, ['cast']),
}
B.DESIGNS.update(DESIGNS)
