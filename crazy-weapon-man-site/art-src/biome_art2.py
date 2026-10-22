"""Zone environments 6-10 (see biomes.py for the layer and atlas conventions).

  6 the misty mountain temple   monkeys, goats and the yak: prayer flags, bells, mist and wind
  7 the forge                   bears, badgers and boars: lava, conveyors, steam and chains
  8 the storybook cottage       owls, bunnies and hedgehogs: honey, tree houses, warm sun
  9 the moonlit ninja castle    lizard ninjas: rooftops, paper walls and a huge moon
 10 the dragon's gold vault     the hoard: weapon racks, coin mountains and treasure
"""
import math
import random
from PIL import Image, ImageDraw
from biomes import (W, H, GROUND, TILE, C, mix, sky, wave, profile, wrap, outline, canvas, disc, box,
                    dots, tint, tileable, tile2d, strip, stones, strata)
from biomes import ANCHORS
from biome_art1 import INK, layer, sprite, frames, lip_from, pine as snow_pine, torii

# ======================================================================== 6 MISTY MOUNTAIN TEMPLE
def crag_pine(d, x, base, h, col='#2f5a4a', hi='#4f8a6a'):
    """A twisted mountain pine: a crooked trunk and flat cloud-like tiers of needles."""
    d.line([(x, base), (x + 2, base - h // 2), (x - 1, base - h)], fill=C('#5d3f30'), width=2)
    for k, (dx, dy, w) in enumerate(((-6, h, 9), (5, h * 3 // 4, 8), (-3, h // 2, 6))):
        d.ellipse([x + dx - w, base - dy - 3, x + dx + w, base - dy + 3], fill=C(col))
        d.line([(x + dx - w + 2, base - dy - 3), (x + dx + w - 3, base - dy - 3)], fill=C(hi))


def flagline(d, x0, y0, x1, y1, sag, cols, seed=0):
    r = random.Random(seed)
    n = int(abs(x1 - x0) // 6)
    for k in range(n + 1):
        t = k / max(1, n)
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t + sag * math.sin(math.pi * t)
        d.point([(x, y)], fill=C('#5d4a3a'))
        if k % 1 == 0 and 0 < k < n:
            d.rectangle([x - 1, y + 1, x + 2, y + 5], fill=C(cols[k % len(cols)]))


FLAGS = ['#2f5fbf', '#f4f1e8', '#c4363e', '#4f8a3a', '#ffc15a']


def z6_layers():
    s, d = layer()
    sky(s, [(0, '#7aa8e0'), (90, '#b8d4ec'), (170, '#e8f0f4')])
    disc(d, 380, 50, 12, '#fffaf0')
    far, d = layer()
    f = wave(61, [22, 10, 5], [1, 2, 4])
    profile(far, lambda x: 120 + f(x), '#9ab0d0', edge='#dce8f4')
    g = wave(62, [14, 7], [2, 3])
    profile(far, lambda x: 150 + g(x), '#8098be', edge='#b8cce4')
    mid, d = layer()
    m = wave(63, [6, 3])
    # rock pillars, the tallest crowned with the temple
    def pillar(x, top, w_):
        d.polygon([(x - w_, H), (x - w_ + 4, top + 10), (x - w_ // 2, top), (x + w_ // 2, top + 2), (x + w_ - 3, top + 12), (x + w_, H)], fill=C('#6a7a9a'))
        d.line([(x - w_ // 2, top), (x + w_ // 2, top + 2)], fill=C('#8a9aba'))
        for yy in range(top + 14, H, 12):
            d.line([(x - w_ + 6, yy), (x - w_ // 2, yy + 3)], fill=C('#5a6a8a'))
    for x, top, w_ in ((60, 150, 22), (150, 120, 30), (420, 140, 26)):
        wrap(pillar, x, top, w_)
    def temple(x):
        top = 120
        box(d, x - 20, top - 22, x + 20, top, '#c4363e', '#7a1f2b')
        for xx in range(x - 16, x + 18, 8):
            box(d, xx, top - 18, xx + 4, top - 4, '#ffc15a')
        d.polygon([(x - 30, top - 22), (x + 30, top - 22), (x + 20, top - 32), (x - 20, top - 32)], fill=C('#3a4a6a'))
        d.polygon([(x - 34, top - 21), (x - 30, top - 26), (x - 26, top - 22)], fill=C('#3a4a6a'))
        d.polygon([(x + 34, top - 21), (x + 30, top - 26), (x + 26, top - 22)], fill=C('#3a4a6a'))
        box(d, x - 12, top - 44, x + 12, top - 32, '#c4363e', '#7a1f2b')
        d.polygon([(x - 20, top - 44), (x + 20, top - 44), (x + 12, top - 52), (x - 12, top - 52)], fill=C('#3a4a6a'))
        d.line([(x, top - 52), (x, top - 60)], fill=C('#ffc15a'), width=2)
        # stairs winding down the pillar
        for k in range(8):
            box(d, x - 4 + (k % 2) * 6, top + k * 8, x + 4 + (k % 2) * 6, top + k * 8 + 2, '#a8b0c8')
    wrap(temple, 150)
    # prayer flags strung between the pillars
    wrap(lambda xx: flagline(d, xx - 90, 152, xx - 30, 130, 14, FLAGS, 1), 150)
    wrap(lambda xx: flagline(d, xx + 30, 128, xx + 270, 146, 26, FLAGS, 2), 150)
    near, d = layer()
    n = wave(64, [6, 4, 2])
    profile(near, lambda x: 194 + n(x), '#5a6a7e', edge='#8a9aae', edge2='#7a8a9e')
    for x in range(0, W, 3):  # moss on the rocks
        y = round(194 + n(x))
        if (x // 30) % 2 == 0:
            d.line([(x, y), (x, y + 1)], fill=C('#7cb860'))
    for x in (40, 190, 330, 440):
        wrap(lambda xx: crag_pine(d, xx, round(196 + n(x)), 34), x)
    return [s, far, mid, near]


def z6_sprites():
    def ground(big, d, s):
        box(d, s, s, 2 * s - 1, 2 * s - 1, '#4a5468')
        for row in range(4):  # big dressed temple stones
            off = (row % 2) * 16
            for x in range(s - 32 + off, 2 * s + 32, 32):
                d.rectangle([x + 1, s + row * 16 + 1, x + 30, s + row * 16 + 14], fill=C(('#6a7488', '#64708a', '#707a8e')[(x // 32 + row) % 3]))
                d.line([(x + 1, s + row * 16 + 1), (x + 30, s + row * 16 + 1)], fill=C('#8a94a8'))
        r = random.Random(17)
        for _ in range(10):
            x, y = r.randrange(s, 2 * s), r.randrange(s, 2 * s)
            d.line([(x, y), (x + 2, y)], fill=C('#7cb860'))
    g = tile2d(TILE, ground)
    lip = lip_from(['#b7e27a', '#7cb860', '#6a7488', '#8a94a8', '#6a7488'], seed=6, tufts=('#7cb860', '#b7e27a'), hang=('#5a9a4a', 2))
    ceil, d = canvas(64, 14)
    for x in range(64):
        d.line([(x, 0), (x, 3 + round(2 * math.sin(x * 0.3)) + (x % 11 == 0) * 4)], fill=C('#4a5468'))
    for x in range(0, 64, 4):
        d.point([(x, 4 + (x % 3))], fill=C('#7cb860'))
    pits = []
    for i in range(4):  # a sea of cloud
        p, d = canvas(32, 10)
        for k in range(5):
            x = (k * 8 + i * 2) % 40 - 4
            d.ellipse([x, 1 + (k % 2) * 2, x + 12, 10], fill=C('#f4f8ff'))
        d.line([(0, 9), (31, 9)], fill=C('#d8e4f0'))
        pits.append(p)
    props = {}
    def flags(im, d, i):
        d.line([(2, 4), (2, 40)], fill=C('#8a4f22'), width=2)
        for k in range(6):
            x = 4 + k * 5
            y = 6 + k * 2
            wv = round(math.sin(i * 1.57 + k) * 1.5)
            d.polygon([(x, y), (x + 4, y), (x + 4 + wv, y + 6), (x + wv, y + 6)], fill=C(FLAGS[k % 5]))
        d.line([(3, 5), (34, 16)], fill=C('#5d4a3a'))
    props['flags'] = frames(4, 36, 41, flags)
    def bell(im, d, i):
        d.line([(2, 4), (2, 30)], fill=C('#8a4f22'), width=2)
        d.line([(20, 4), (20, 30)], fill=C('#8a4f22'), width=2)
        d.line([(0, 3), (22, 3)], fill=C('#5d2f14'), width=3)
        sw = (0, 2, 0, -2)[i]
        d.line([(11, 5), (11 + sw // 2, 8)], fill=C('#5d4a3a'))
        d.polygon([(7 + sw, 9), (15 + sw, 9), (17 + sw, 21), (5 + sw, 21)], fill=C('#c8a040'))
        d.line([(7 + sw, 10), (6 + sw, 20)], fill=C('#f8e08e'))
        d.line([(5 + sw, 21), (17 + sw, 21)], fill=C('#8a6a2a'))
        disc(d, 11 + sw * 2, 22, 1, '#8a6a2a')
    props['bell'] = frames(4, 23, 31, bell)
    def wheel(im, d, i):  # a prayer wheel turning
        d.line([(9, 0), (9, 30)], fill=C('#5d4a3a'))
        box(d, 3, 6, 15, 22, '#c4363e', '#7a1f2b')
        for k in range(3):
            x = 4 + (k * 4 + i) % 12
            d.line([(x, 8), (x, 20)], fill=C('#ffc15a'))
        d.line([(3, 6), (15, 6)], fill=C('#ffc15a'))
        d.line([(3, 22), (15, 22)], fill=C('#ffc15a'))
        box(d, 5, 28, 13, 30, '#6a6a80')
    props['wheel'] = frames(4, 19, 31, wheel)
    def cairn(im, d, i):
        for k, (w_, col) in enumerate(((8, '#8a94a8'), (6, '#a8b0c8'), (5, '#8a94a8'), (3, '#b8c0d4'))):
            y = 18 - k * 5
            d.ellipse([9 - w_, y - 2, 9 + w_, y + 2], fill=C(col))
    props['cairn'] = frames(1, 19, 21, cairn)
    def incense(im, d, i):
        d.polygon([(2, 10), (16, 10), (13, 18), (5, 18)], fill=C('#8a6a2a'))
        d.line([(2, 10), (16, 10)], fill=C('#ffc15a'))
        for k, x in enumerate((7, 9, 11)):
            d.line([(x, 10), (x, 5)], fill=C('#c4501f'))
            for j in range(3):
                y = 3 - j * 3 - (i % 3)
                if y >= -8:
                    d.point([(x + round(math.sin(j + i + k) * 1.5), y + 8 - 8)], fill=C('#c3c4d6'))
    props['incense'] = frames(3, 19, 19, incense)
    return {'ground': g, 'lip': lip, 'ceil': ceil, 'pit': (strip(pits), 4), **props}


def z6_slab():
    im, d = canvas(27, 16)  # a wooden plank bridge with prayer flags hung under it
    box(d, 0, 0, 26, 4, '#a07040')
    for x in range(0, 27, 6):
        d.line([(x, 0), (x, 4)], fill=C('#7a5030'))
    d.line([(0, 0), (26, 0)], fill=C('#c89a60'))
    for k, x in enumerate(range(2, 26, 5)):
        box(d, x, 6, x + 3, 10, FLAGS[k % 5])
    d.line([(0, 6), (26, 6)], fill=C('#5d4a3a'))
    return outline(im, '#2a2a3a').crop((0, 0, 27, 14))


# ======================================================================== 7 FORGE
def gear(d, x, y, r, col, hole):
    for k in range(8):
        a = k * math.tau / 8
        disc(d, round(x + math.cos(a) * r), round(y + math.sin(a) * r), max(2, r // 4), col)
    disc(d, x, y, r, col)
    disc(d, x, y, r // 3, hole)


def chain(d, x, y0, y1, col='#5a5060', hi='#8a8090'):
    for y in range(y0, y1, 6):
        if (y - y0) // 6 % 2:
            d.line([(x, y), (x, y + 5)], fill=C(col), width=2)
        else:
            d.ellipse([x - 2, y, x + 2, y + 5], outline=C(col))
            d.point([(x - 1, y + 1)], fill=C(hi))


def z7_layers():
    s, d = layer()
    sky(s, [(0, '#1e1424'), (80, '#3a1e2a'), (150, '#7a2e2a'), (200, '#c8502a')])
    r = random.Random(71)
    dots(s, r, 40, ['#f08a2c', '#ffc15a'], 0, 150)  # drifting sparks high up
    far, d = layer()
    # the volcano and the smokestacks (their smoke rises in game)
    d.polygon([(250, 196), (320, 96), (346, 100), (420, 196)], fill=C('#3a2028'))
    d.polygon([(320, 96), (346, 100), (340, 108), (326, 106)], fill=C('#f06a2a'))
    d.line([(328, 108), (320, 140), (326, 170)], fill=C('#c4402a'), width=2)
    ANCHORS['storm-forge'] = {'smoke': [[1, 40, 112, 1], [1, 440, 92, 1], [1, 470, 122, 1], [1, 333, 98, 2]]}
    for x, h_ in ((40, 80), (440, 100), (470, 70)):
        wrap(lambda xx: (box(d, xx - 6, 196 - h_, xx + 6, H - 1, '#2e1e26'), box(d, xx - 8, 196 - h_ - 4, xx + 8, 196 - h_, '#3e2a30'),
                         d.line([(xx - 5, 196 - h_ + 8), (xx + 5, 196 - h_ + 8)], fill=C('#c4402a'))), x)
    f = wave(72, [6, 3])
    profile(far, lambda x: 186 + f(x), '#2a1a22', edge='#4a2a2a')
    mid, d = layer()
    # the great forge hall with glowing doors, a turning gear and chains hanging from the rafters
    def hall(x):
        box(d, x - 70, 110, x + 70, H - 1, '#3a2a30')
        for yy in range(116, H, 10):
            for xx in range(x - 70 + (yy // 10 % 2) * 10, x + 70, 20):
                d.rectangle([xx, yy, xx + 18, yy + 8], outline=C('#2e2028'))
        d.polygon([(x - 80, 112), (x, 82), (x + 80, 112)], fill=C('#2a1e24'))
        for k, dx in enumerate((-40, 0, 40)):
            d.rectangle([x + dx - 12, 150, x + dx + 12, 196], fill=C('#1e1418'))
            d.pieslice([x + dx - 12, 140, x + dx + 12, 160], 180, 360, fill=C('#1e1418'))
            d.rectangle([x + dx - 9, 156, x + dx + 9, 196], fill=C(('#f08a2c', '#ffc15a', '#f08a2c')[k]))
            d.pieslice([x + dx - 9, 146, x + dx + 9, 166], 180, 360, fill=C(('#f08a2c', '#ffc15a', '#f08a2c')[k]))
            d.rectangle([x + dx - 9, 180, x + dx + 9, 196], fill=C('#ffe8a0'))
        gear(d, x + 52, 124, 10, '#5a4a50', '#3a2a30')
    wrap(hall, 160)
    for x in range(250, 470, 26):
        chain(d, x, 0, 60 + (x * 7) % 60)
        box(d, x - 3, 60 + (x * 7) % 60, x + 3, 64 + (x * 7) % 60, '#5a5060')
    near, d = layer()
    # pipes along the bottom with valves and a glow from below
    box(d, 0, 186, W - 1, 191, '#5a4a50')
    d.line([(0, 186), (W - 1, 186)], fill=C('#8a7a80'))
    for x in range(20, W, 60):
        box(d, x, 184, x + 5, 193, '#4a3a40')
        d.line([(x + 2, 186), (x + 2, 200)], fill=C('#5a4a50'), width=3)
        disc(d, x + 2, 181, 3, '#c4363e')
    box(d, 0, 196, W - 1, H - 1, '#2a1a1e')
    for x in range(0, W, 2):
        if (x // 40) % 3 == 0:
            d.point([(x, 196 + (x // 2) % 2)], fill=C('#c4402a'))
    return [s, far, mid, near]


def z7_sprites():
    def ground(big, d, s):
        box(d, s, s, 2 * s - 1, 2 * s - 1, '#3a2a30')
        stones(d, s, 19, ('#4a3a40', '#5e4c52', '#261a1e'), 10, 3, 8, 0.5)
        r = random.Random(20)
        for _ in range(4):  # glowing magma cracks
            x, y = r.randrange(s, 2 * s), r.randrange(s, 2 * s)
            pts = [(x, y)]
            for _ in range(4):
                x, y = x + r.randrange(2, 6), y + r.randrange(-3, 4)
                pts.append((x, y))
            d.line(pts, fill=C('#c4402a'))
            d.point([pts[1], pts[2]], fill=C('#f08a2c'))
    g = tile2d(TILE, ground)
    lip, d = canvas(64, 10)  # riveted iron plate
    box(d, 0, 3, 63, 7, '#6a6070')
    d.line([(0, 3), (63, 3)], fill=C('#a898a8'))
    for x in range(0, 64, 16):
        d.line([(x, 3), (x, 7)], fill=C('#4a4050'))
        d.point([(x + 3, 5), (x + 12, 5)], fill=C('#c8bcc8'))
    d.line([(0, 8), (63, 8)], fill=C('#2a2028'))
    # a conveyor belt (4 frames; the game plays it forwards or backwards)
    belts = []
    for i in range(4):
        b, d = canvas(32, 10)
        box(d, 0, 2, 31, 8, '#3a3440')
        for x in range(-8, 32, 8):
            xx = x + i * 2
            d.line([(xx, 3), (xx + 3, 3)], fill=C('#ffc15a'))
            d.line([(xx + 1, 4), (xx + 4, 4)], fill=C('#c8a040'))
        d.line([(0, 2), (31, 2)], fill=C('#5a5464'))
        for x in range(2, 32, 8):
            disc(d, x + (i * 2) % 8 - 2, 7, 1, '#8a8090')
        d.line([(0, 9), (31, 9)], fill=C('#1e1418'))
        belts.append(b)
    ceil, d = canvas(64, 14)  # an iron girder with chain ends
    box(d, 0, 0, 63, 5, '#4a4050')
    for x in range(0, 64, 8):
        d.line([(x, 0), (x + 8, 5)], fill=C('#3a3040'))
        d.point([(x + 1, 1)], fill=C('#8a8090'))
    for x in (10, 41):
        chain(d, x, 5, 14)
    pits = []
    for i in range(4):  # lava, bubbling
        p, d = canvas(32, 8)
        box(d, 0, 1, 31, 7, '#e0502a')
        for x in range(32):
            if (x + i * 3) % 9 < 4:
                d.point([(x, 1)], fill=C('#ffc15a'))
        bx = (i * 9) % 30
        disc(d, bx + 1, 2, 1 + (i % 2), '#ffe08a')
        d.line([(0, 6), (31, 6)], fill=C('#a02a1e'))
        pits.append(p)
    props = {}
    def anvil(im, d, i):
        box(d, 6, 12, 16, 17, '#3a3440')
        d.polygon([(0, 6), (22, 6), (20, 11), (2, 11)], fill=C('#5a5464'))
        d.polygon([(0, 6), (-4, 6), (0, 9)], fill=C('#5a5464'))
        d.line([(1, 6), (21, 6)], fill=C('#a898a8'))
        box(d, 4, 17, 18, 19, '#3a3440')
        d.line([(16, 5), (20, -2)], fill=C('#8a4f22'), width=2)  # a hammer resting on it
        box(d, 17, -4, 23, -1, '#6a6070')
    props['anvil'] = (strip([outline(_shift(sprite_raw(24, 20, anvil), 4, 4), INK)]), 1)
    def brazier(im, d, i):
        d.line([(4, 12), (2, 22)], fill=C('#4a4050'), width=2)
        d.line([(14, 12), (16, 22)], fill=C('#4a4050'), width=2)
        d.pieslice([1, 4, 17, 16], 0, 180, fill=C('#5a5464'))
        fl = ((0, 0), (1, -2), (-1, -1))[i]
        d.polygon([(4, 10), (9 + fl[0], -1 + fl[1]), (14, 10)], fill=C('#f08a2c'))
        d.polygon([(6, 10), (9 - fl[0], 2 - fl[1]), (12, 10)], fill=C('#ffc15a'))
        d.point([(9, 7)], fill=C('#fff2c8'))
    props['brazier'] = frames(3, 19, 23, brazier)
    def vent(im, d, i):
        box(d, 4, 18, 14, 22, '#5a5464')
        d.line([(4, 18), (14, 18)], fill=C('#8a8090'))
        for k in range(i + 1):
            r_ = 3 + k
            disc(d, 9 + (k % 2) * 2 - 1, 15 - k * 5, r_, ('#f4f1e8', '#d8d4e0', '#b8b4c8', '#a8a4b8')[k])
    props['vent'] = frames(4, 19, 23, vent)
    def coal(im, d, i):
        d.ellipse([1, 2, 17, 20], fill=C('#6a4a3a'))
        d.line([(1, 8), (17, 8)], fill=C('#4a3a40'), width=2)
        d.line([(1, 15), (17, 15)], fill=C('#4a3a40'), width=2)
        for x, y in ((6, 3), (10, 2), (13, 4)):
            disc(d, x, y, 2, '#2a2028')
        if i:
            d.point([(10, 1)], fill=C('#f08a2c'))
    props['coal'] = frames(2, 19, 21, coal)
    def rack(im, d, i):
        d.line([(1, 4), (1, 28)], fill=C('#5d2f14'), width=2)
        d.line([(23, 4), (23, 28)], fill=C('#5d2f14'), width=2)
        d.line([(0, 6), (24, 6)], fill=C('#8a4f22'), width=2)
        for k, x in enumerate((6, 12, 18)):  # hammers hanging up
            d.line([(x, 7), (x, 24)], fill=C('#8a4f22'))
            box(d, x - 3 + (k % 2), 22, x + 3, 27, '#6a6070')
    props['rack'] = frames(1, 25, 29, rack)
    return {'ground': g, 'lip': lip, 'belt': (strip(belts), 4), 'ceil': ceil, 'pit': (strip(pits), 4), **props}


def sprite_raw(w, h, draw):
    im, d = canvas(w, h)
    draw(im, d, 0)
    return im


def _shift(im, dx, dy):
    out, _ = canvas(im.width + dx, im.height + dy)
    out.alpha_composite(im, (dx, dy))
    return out


def z7_slab():
    im, d = canvas(27, 12)  # an iron grate catwalk
    box(d, 0, 0, 26, 2, '#8a8090')
    d.line([(0, 0), (26, 0)], fill=C('#c8bcc8'))
    for x in range(0, 27, 3):
        d.line([(x, 3), (x, 6)], fill=C('#5a5464'))
    box(d, 0, 7, 26, 8, '#6a6070')
    for x in (1, 13, 25):
        d.point([(x, 1)], fill=C('#4a4050'))
    return outline(im, '#1e1418').crop((0, 0, 27, 12))


# ======================================================================== 8 STORYBOOK COTTAGE
def round_tree(d, x, base, h, r, leaf='#5aa04a', hi='#8ac860', trunk='#7a5030', apples=False):
    d.line([(x, base), (x, base - h)], fill=C(trunk), width=4)
    d.line([(x, base - h // 2), (x + r // 2, base - h)], fill=C(trunk), width=2)
    for dx, dy, rr in ((-r // 2, 0, r * 2 // 3), (r // 2, 2, r * 2 // 3), (0, -r // 2, r * 3 // 4), (0, 0, r * 3 // 4)):
        disc(d, x + dx, base - h + dy, rr, leaf)
    for dx, dy in ((-r // 2, -r // 3), (0, -r * 3 // 4), (r // 3, -r // 4)):
        disc(d, x + dx - 1, base - h + dy, max(2, r // 4), hi)
    if apples:
        for dx, dy in ((-r // 2, r // 4), (r // 3, -r // 3), (r // 2, r // 3)):
            disc(d, x + dx, base - h + dy, 1, '#e0402a')


def z8_layers():
    s, d = layer()
    sky(s, [(0, '#8ac8f0'), (90, '#c0e4f4'), (150, '#fff0c8'), (200, '#ffe0a0')])
    disc(d, 70, 60, 20, '#fff6d8')
    disc(d, 70, 60, 15, '#fffbec')
    far, d = layer()
    # a patchwork of fields over rolling hills, stitched by hedgerows
    f = wave(81, [10, 6, 3])
    profile(far, lambda x: 150 + f(x), '#9ad070', edge='#c8e890')
    cols = ['#b8d870', '#e8d080', '#8ac060', '#d8e090', '#a8c868']
    for k, x0 in enumerate(range(0, W, 60)):
        for x in range(x0, x0 + 60):
            top = round(150 + f(x)) + 1
            d.line([(x, top + 6 + (k % 2) * 6), (x, top + 18 + (k % 3) * 4)], fill=C(cols[k % len(cols)]))
        d.line([(x0, round(150 + f(x0))), (x0 + 8, H)], fill=C('#5a9a4a'))
    for x in range(0, W, 3):
        d.point([(x, round(150 + f(x)) + 6 + (x // 60 % 2) * 6)], fill=C('#5a9a4a'))
    mid, d = layer()
    g = wave(82, [5, 3])
    profile(mid, lambda x: 182 + g(x), '#6ab050', edge='#a8d870')
    # a big tree house with a round door and the honey-thatched cottage
    def treehouse(x):
        y = round(184 + g(x % W))
        d.rectangle([x - 12, y - 50, x + 12, y], fill=C('#8a5a3a'))
        d.line([(x - 12, y - 50), (x - 12, y)], fill=C('#6a4028'))
        for k in range(4):
            d.line([(x - 8 + k * 5, y - 46), (x - 9 + k * 5, y - 4)], fill=C('#7a4a30'))
        d.ellipse([x - 6, y - 18, x + 6, y], fill=C('#c4501f'))
        d.ellipse([x - 4, y - 16, x + 4, y - 2], fill=C('#e07030'))
        d.point([(x + 2, y - 8)], fill=C('#ffc15a'))
        disc(d, x, y - 34, 5, '#ffe8a0', '#5d2f14')
        d.line([(x - 5, y - 34), (x + 5, y - 34)], fill=C('#5d2f14'))
        for dx, dy, r_ in ((-22, -56, 18), (18, -58, 18), (0, -72, 20), (-8, -60, 16)):
            disc(d, x + dx, y + dy, r_, '#5aa04a')
        for dx, dy in ((-26, -64), (10, -78), (20, -60)):
            disc(d, x + dx, y + dy, 5, '#8ac860')
    wrap(treehouse, 120)
    def cottage(x):
        y = round(184 + g(x % W))
        if x == 330:
            ANCHORS['witch-cottage'] = {'smoke': [[2, x + 15, y - 53, 1]]}
        box(d, x - 26, y - 24, x + 26, y, '#f8ecd0', '#a07a50')
        for xx in (x - 26, x + 22):
            d.line([(xx, y - 24), (xx, y)], fill=C('#a07a50'), width=3)
        d.polygon([(x - 34, y - 22), (x, y - 50), (x + 34, y - 22)], fill=C('#f0c060'))
        for k in range(5):
            d.line([(x - 30 + k * 2, y - 23 - k * 5), (x + 30 - k * 2, y - 23 - k * 5)], fill=C('#d8a040'))
        d.line([(x - 34, y - 22), (x + 34, y - 22)], fill=C('#c08030'), width=2)
        box(d, x + 12, y - 52, x + 18, y - 34, '#b06a4a', '#7a4030')
        d.ellipse([x - 20, y - 18, x - 8, y - 6], fill=C('#ffe8a0'), outline=C('#7a4a30'))
        d.line([(x - 14, y - 18), (x - 14, y - 6)], fill=C('#7a4a30'))
        d.rectangle([x + 2, y - 18, x + 14, y], fill=C('#6aa0d0'), outline=C('#3a5a7a'))
        d.pieslice([x + 2, y - 24, x + 14, y - 12], 180, 360, fill=C('#6aa0d0'), outline=C('#3a5a7a'))
        disc(d, x + 11, y - 8, 1, '#ffc15a')
        for k, xx in enumerate(range(x - 24, x - 4, 4)):
            disc(d, xx, y - 2, 2, ('#ff8ab8', '#ffc15a', '#f4f1e8', '#c88af0', '#ff8ab8')[k])
    wrap(cottage, 330)
    near, d = layer()
    n = wave(83, [5, 3])
    profile(near, lambda x: 196 + n(x), '#4a9040', edge='#8ac860', edge2='#6ab050')
    for x, apples in ((30, True), (220, False), (430, True)):
        wrap(lambda xx: round_tree(d, xx, round(198 + n(x)), 40, 22, '#4a9040', '#7ab858', '#7a5030', apples), x)
    for x in range(0, W, 18):  # flower dots along the near hill
        y = round(197 + n(x))
        d.point([(x + 3, y), (x + 9, y + 1)], fill=C(('#ff8ab8', '#ffc15a', '#f4f1e8')[(x // 18) % 3]))
    # a picket fence
    for x in range(100, 190, 6):
        y = round(198 + n(x))
        wrap(lambda xx: (d.line([(xx, y - 10), (xx, y)], fill=C('#f4f1e8'), width=2), d.point([(xx, y - 11)], fill=C('#f4f1e8'))), x)
    wrap(lambda xx: d.line([(xx, round(193 + n(xx % W))), (xx + 90, round(193 + n((xx + 90) % W)))], fill=C('#f4f1e8')), 100)
    return [s, far, mid, near]


def z8_sprites():
    def ground(big, d, s):
        strata(d, s, 23, ['#8a5a3a', '#82543a', '#8a5a3a', '#7a4e34'], 16, 3)
        stones(d, s, 24, ('#a07a5a', '#c09a78', '#5a3a28'), 5, 2, 5)
        r = random.Random(25)
        for _ in range(4):  # little roots
            x, y = r.randrange(s, 2 * s), r.randrange(s, 2 * s)
            d.line([(x, y), (x + 4, y + 3), (x + 9, y + 2)], fill=C('#b07a50'))
    g = tile2d(TILE, ground)
    lip = lip_from(['#b7e27a', '#8ac860', '#6ab050', '#6ab050', '#4a9040'], seed=8, tufts=('#6ab050', '#b7e27a'),
                   flowers=(['#ff8ab8', '#ffc15a', '#f4f1e8', '#c88af0'], 8), hang=('#4a9040', 3))
    ceil, d = canvas(64, 18)  # root tunnel ceiling: earth, hanging roots and a little lantern
    for x in range(64):
        d.line([(x, 0), (x, 3 + round(1.5 * math.sin(x * 0.35)))], fill=C('#6a4028'))
    for x, l in ((6, 10), (20, 14), (35, 8), (50, 12), (60, 6)):
        d.line([(x, 3), (x + 1, 3 + l // 2), (x, 3 + l)], fill=C('#a07040'))
    d.line([(28, 3), (28, 9)], fill=C('#5d2f14'))
    box(d, 26, 9, 30, 14, '#ffd84a', '#8a4f22')
    pits = []
    for i in range(4):  # a pool of honey
        p, d = canvas(32, 8)
        box(d, 0, 1, 31, 7, '#f0a830')
        for x in range(32):
            if (x + i * 2) % 12 < 4:
                d.point([(x, 1)], fill=C('#ffe08a'))
        d.point([((i * 8 + 5) % 32, 3), ((i * 8 + 6) % 32, 3)], fill=C('#fff2c8'))
        d.line([(0, 6), (31, 6)], fill=C('#c07818'))
        pits.append(p)
    props = {}
    def honey(im, d, i):
        d.ellipse([1, 5, 17, 21], fill=C('#d89040'))
        box(d, 4, 3, 14, 7, '#e8a850')
        d.arc([1, 5, 17, 21], 200, 260, fill=C('#f0c070'))
        box(d, 3, 9, 15, 13, '#f4f1e8')
        d.text((5, 8), 'HUNY', fill=C('#c4363e')) if False else d.line([(5, 11), (13, 11)], fill=C('#c4363e'))
        drip = (0, 1, 2, 3)[i]
        d.line([(6, 7), (6, 8 + drip)], fill=C('#ffc15a'))
        d.ellipse([3, 2, 15, 5], fill=C('#ffc15a'))
    props['honey'] = frames(4, 19, 22, honey)
    def hive(im, d, i):
        d.line([(9, 18), (9, 34)], fill=C('#7a5030'), width=3)
        for k, (w_, y) in enumerate(((4, 2), (6, 5), (8, 8), (7, 12), (5, 15))):
            d.ellipse([9 - w_, y, 9 + w_, y + 4], fill=C(('#f0c060', '#e8b050')[k % 2]))
        disc(d, 9, 12, 1, '#3a2a1a')
        bx, by = ((15, 4), (17, 8), (14, 10), (16, 2))[i]
        d.point([(bx, by)], fill=C('#ffd84a'))
        d.point([(bx + 1, by)], fill=C('#1a1428'))
    props['hive'] = frames(4, 20, 35, hive)
    def mush(im, d, i):
        for x, y, r_, col in ((6, 10, 5, '#e0402a'), (14, 13, 4, '#f08a2c')):
            box(d, x - 1, y, x + 1, 18, '#f4f1e8')
            d.pieslice([x - r_, y - r_, x + r_, y + r_], 180, 360, fill=C(col))
            d.point([(x - 2, y - 2), (x + 1, y - 3)], fill=C('#f4f1e8'))
    props['mush'] = frames(1, 20, 19, mush)
    def lamp(im, d, i):
        d.line([(6, 8), (6, 40)], fill=C('#3a5a3a'), width=2)
        box(d, 2, 38, 10, 40, '#3a5a3a')
        d.polygon([(1, 2), (6, -2), (11, 2)], fill=C('#3a5a3a'))
        box(d, 2, 2, 10, 9, ('#ffe8a0', '#fff2c8')[i], '#3a5a3a')
        d.line([(6, 2), (6, 9)], fill=C('#3a5a3a'))
        d.line([(1, 9), (11, 9)], fill=C('#3a5a3a'))
    props['lamp'] = frames(2, 13, 41, lamp)
    def sign(im, d, i):
        d.line([(9, 4), (9, 26)], fill=C('#8a5a3a'), width=2)
        d.polygon([(0, 4), (16, 4), (19, 7), (16, 10), (0, 10)], fill=C('#c89a60'))
        d.line([(3, 7), (12, 7)], fill=C('#7a4a30'))
        d.polygon([(19, 12), (3, 12), (0, 15), (3, 18), (19, 18)], fill=C('#c89a60'))
        d.line([(6, 15), (16, 15)], fill=C('#7a4a30'))
    props['sign'] = frames(1, 20, 27, sign)
    def flowers(im, d, i):
        for k, (x, hh, col) in enumerate(((2, 8, '#ff8ab8'), (6, 12, '#ffc15a'), (10, 9, '#c88af0'), (13, 6, '#f4f1e8'))):
            sw = (i + k) % 2
            d.line([(x, 13), (x + sw, 13 - hh)], fill=C('#4a9040'))
            disc(d, x + sw, 13 - hh, 1, col)
    props['flowers'] = frames(2, 16, 14, flowers, '#2f5a2c')
    return {'ground': g, 'lip': lip, 'ceil': ceil, 'pit': (strip(pits), 4), **props}


def z8_slab():
    im, d = canvas(27, 14)  # a mossy log shelf with a mushroom
    box(d, 0, 2, 26, 9, '#a07040')
    for x in range(0, 27, 7):
        d.arc([x - 2, 3, x + 6, 9], 270, 90, fill=C('#7a5030'))
    d.line([(0, 2), (26, 2)], fill=C('#c89a60'))
    d.line([(0, 0), (26, 0)], fill=C('#8ac860'))
    d.line([(0, 1), (26, 1)], fill=C('#6ab050'))
    for x in (4, 15, 22):
        d.point([(x, 3), (x + 1, 3)], fill=C('#6ab050'))
    return outline(im, '#3a2a1a').crop((0, 0, 27, 13))


# ======================================================================== 9 MOONLIT NINJA CASTLE
def roof(d, x, y, w, col='#2a3a5e', ridge='#ffc15a', curl=4):
    d.polygon([(x - w // 2 - curl, y - curl), (x - w // 2, y), (x + w // 2, y), (x + w // 2 + curl, y - curl), (x + w // 2 - 6, y - 8), (x - w // 2 + 6, y - 8)], fill=C(col))
    d.line([(x - w // 2 + 6, y - 8), (x + w // 2 - 6, y - 8)], fill=C(ridge))
    for xx in range(x - w // 2 + 2, x + w // 2, 4):
        d.line([(xx, y - 6), (xx, y - 1)], fill=C('#3a4a70'))


def shoji(d, x0, y0, x1, y1, lit='#f8e8b8', frame='#5d3a2a'):
    box(d, x0, y0, x1, y1, lit, frame)
    for x in range(x0 + 5, x1, 5):
        d.line([(x, y0), (x, y1)], fill=C(frame))
    for y in range(y0 + 6, y1, 6):
        d.line([(x0, y), (x1, y)], fill=C(frame))


def z9_layers():
    s, d = layer()
    sky(s, [(0, '#0e0a2a'), (80, '#1e1a5a'), (160, '#3a2a7a'), (200, '#5a3a8a')])
    r = random.Random(91)
    dots(s, r, 110, ['#c3c4d6', '#f4f1e8', '#a8dcfd'], 0, 150)
    for rr, col in ((44, '#2e2a6e'), (38, '#fff0c8'), (34, '#fff8e0')):
        disc(d, 330, 92, rr, col)
    for x, y, rr in ((316, 80, 5), (344, 104, 4), (338, 76, 3)):
        disc(d, x, y, rr, '#f0e0b0')
    far, d = layer()
    # the castle keep on its hill
    f = wave(92, [8, 4])
    profile(far, lambda x: 176 + f(x), '#1e1a44', edge='#2e2a5e')
    def keep(x):
        y = round(172 + f(x % W))
        box(d, x - 26, y - 14, x + 26, y, '#2a2650')
        for k, (w_, h_) in enumerate(((44, 14), (34, 12), (24, 12))):
            yy = y - 14 - k * 16
            box(d, x - w_ // 2 + 4, yy - h_, x + w_ // 2 - 4, yy, '#3a3a6e')
            roof(d, x, yy - h_, w_, '#24204a', '#c8a040', 3)
            for wx in range(x - w_ // 2 + 8, x + w_ // 2 - 6, 6):
                box(d, wx, yy - h_ + 3, wx + 2, yy - h_ + 6, '#ffc15a')
        d.polygon([(x - 3, y - 64), (x, y - 70), (x + 3, y - 64)], fill=C('#ffc15a'))
    wrap(keep, 120)
    mid, d = layer()
    # rooftops and paper walls of the outer castle, some windows lit
    r = random.Random(93)
    x = 0
    while x < W:
        w_ = r.randrange(50, 80)
        top = r.randrange(150, 170)
        box(d, x, top, x + w_, H - 1, '#2a2a4e')
        if r.random() < 0.7:
            for k, wx in enumerate(range(x + 6, x + w_ - 14, 18)):
                shoji(d, wx, top + 8, wx + 14, top + 24, '#f8e0a0' if (k + x) % 3 else '#6a6a9a', '#3a2a2a')
        roof(d, x + w_ // 2, top, w_ + 8, '#1e2240', '#8a7a50', 5)
        x += w_ + r.randrange(4, 16)
    near, d = layer()
    # dark bamboo and pine silhouettes and a stone wall coping
    for x in range(0, W, 9):
        if (x // 45) % 3 == 0:
            hh = 50 + (x * 13) % 40
            d.line([(x, H), (x, H - hh)], fill=C('#16123a'), width=3)
            for y in range(H - 10, H - hh, -10):
                d.line([(x - 1, y), (x + 1, y)], fill=C('#24204e'))
            d.polygon([(x, H - hh + 6), (x + 10, H - hh + 2), (x + 8, H - hh + 7)], fill=C('#16123a'))
    box(d, 0, 198, W - 1, H - 1, '#24204a')
    d.line([(0, 198), (W - 1, 198)], fill=C('#3a3a6e'))
    return [s, far, mid, near]


def z9_sprites():
    def ground(big, d, s):
        box(d, s, s, 2 * s - 1, 2 * s - 1, '#2a2a4a')
        r = random.Random(29)
        for row in range(4):  # castle masonry: big uneven blocks
            x = s - r.randrange(0, 20)
            while x < 2 * s + 20:
                w_ = r.randrange(16, 30)
                d.rectangle([x + 1, s + row * 16 + 1, x + w_ - 1, s + row * 16 + 15], fill=C(r.choice(['#3e3e64', '#3a3a5e', '#444470'])))
                d.line([(x + 1, s + row * 16 + 1), (x + w_ - 1, s + row * 16 + 1)], fill=C('#5a5a88'))
                x += w_
    g = tile2d(TILE, ground)
    lip, d = canvas(64, 12)  # blue roof tiles with a gold ridge
    box(d, 0, 3, 63, 9, '#2e3a66')
    d.line([(0, 2), (63, 2)], fill=C('#c8a040'))
    d.line([(0, 3), (63, 3)], fill=C('#8a7030'))
    for x in range(0, 64, 4):
        d.arc([x, 5, x + 4, 11], 0, 180, fill=C('#4a5a8a'))
        d.line([(x, 4), (x, 9)], fill=C('#1e2648'))
    d.line([(0, 10), (63, 10)], fill=C('#1a1838'))
    ceil, d = canvas(64, 10)  # wooden beams
    box(d, 0, 0, 63, 5, '#5d3a2a')
    d.line([(0, 5), (63, 5)], fill=C('#3a2218'))
    for x in range(4, 64, 16):
        box(d, x, 0, x + 6, 8, '#6a4430', '#3a2218')
    pits = []
    for i in range(4):  # a dark moat with the moon's reflection
        p, d = canvas(32, 6)
        box(d, 0, 1, 31, 5, '#141040')
        for x in range(32):
            if (x + i) % 8 < 2:
                d.point([(x, 1)], fill=C('#3a3a7e'))
        d.line([(12 + (i % 2), 2), (19 - (i % 2), 2)], fill=C('#fff0c8'))
        d.line([(14, 3), (17, 3)], fill=C('#c8b888'))
        pits.append(p)
    props = {}
    def stone_lantern(im, d, i):
        box(d, 4, 22, 14, 24, '#5a5a7a')
        box(d, 7, 14, 11, 22, '#6a6a8a')
        box(d, 3, 12, 15, 14, '#5a5a7a')
        box(d, 5, 6, 13, 12, '#6a6a8a')
        box(d, 7, 7, 11, 11, ('#ffc15a', '#ffe08a')[i])
        d.polygon([(1, 6), (9, 0), (17, 6)], fill=C('#5a5a7a'))
    props['tourou'] = frames(2, 19, 25, stone_lantern)
    def chochin(im, d, i):  # a paper lantern hanging from a pole
        d.line([(3, 0), (3, 36)], fill=C('#5d3a2a'), width=2)
        d.line([(3, 2), (14, 2)], fill=C('#5d3a2a'))
        sw = (0, 1, 0, -1)[i]
        d.line([(13, 2), (13 + sw, 6)], fill=C('#1a1428'))
        d.ellipse([9 + sw, 6, 18 + sw, 18], fill=C('#e0402a'))
        d.ellipse([11 + sw, 7, 16 + sw, 17], fill=C('#f06a52'))
        for y in (9, 12, 15):
            d.line([(10 + sw, y), (17 + sw, y)], fill=C('#c4363e'))
        box(d, 11 + sw, 5, 16 + sw, 6, '#1a1428')
        box(d, 11 + sw, 18, 16 + sw, 19, '#1a1428')
    props['chochin'] = frames(4, 20, 37, chochin)
    def bamboo(im, d, i):
        for x, hh in ((4, 30), (9, 40)):
            d.line([(x, 41), (x, 41 - hh)], fill=C('#3a6a4a'), width=3)
            for y in range(36, 41 - hh, -8):
                d.line([(x - 1, y), (x + 1, y)], fill=C('#1e3a2a'))
        d.polygon([(9, 4), (17, 1), (14, 6)], fill=C('#2a5a3a'))
        d.polygon([(4, 14), (-3 + 3, 10), (1, 15)], fill=C('#2a5a3a'))
    props['bamboo'] = frames(1, 18, 42, bamboo)
    def target(im, d, i):
        d.line([(9, 18), (9, 28)], fill=C('#5d3a2a'), width=2)
        box(d, 1, 1, 17, 19, '#d8c8a0', '#5d3a2a')
        disc(d, 9, 10, 5, '#c4363e')
        disc(d, 9, 10, 2, '#f4f1e8')
        for x, y in ((5, 5), (13, 14), (10, 9)):  # shuriken stuck in it
            d.line([(x - 2, y), (x + 2, y)], fill=C('#a8b0c8'))
            d.line([(x, y - 2), (x, y + 2)], fill=C('#a8b0c8'))
    props['target'] = frames(1, 19, 29, target)
    def gong(im, d, i):
        d.line([(1, 2), (1, 26)], fill=C('#5d2f14'), width=2)
        d.line([(21, 2), (21, 26)], fill=C('#5d2f14'), width=2)
        d.line([(0, 2), (22, 2)], fill=C('#8a4f22'), width=2)
        disc(d, 11, 13, 8, '#c8a040')
        disc(d, 11, 13, 5, '#e0c060')
        disc(d, 11, 13, 2, '#c8a040')
        if i:
            d.point([(8, 9), (14, 16)], fill=C('#fff2c8'))
    props['gong'] = frames(2, 23, 27, gong)
    return {'ground': g, 'lip': lip, 'ceil': ceil, 'pit': (strip(pits), 4), **props}


def z9_slab():
    im, d = canvas(27, 12)  # a tiled roof eave with upturned corners
    box(d, 0, 2, 26, 7, '#2e3a66')
    d.line([(0, 1), (26, 1)], fill=C('#c8a040'))
    for x in range(0, 27, 3):
        d.line([(x, 3), (x, 7)], fill=C('#1e2648'))
    d.line([(0, 8), (26, 8)], fill=C('#5d3a2a'))
    d.point([(0, 0), (26, 0)], fill=C('#c8a040'))
    return outline(im, '#100c2a').crop((0, 0, 27, 12))


# ======================================================================== 10 DRAGON'S GOLD VAULT
def coin_pile(d, x, base, w, h, col='#ffc15a', hi='#fff2a8', dark='#c88a2a', seed=0):
    d.pieslice([x - w, base - h, x + w, base + h], 180, 360, fill=C(col))
    r = random.Random(seed + x)
    for _ in range(w * h // 18):
        a = r.random() * math.pi
        rr = r.random()
        cx_, cy_ = x - math.cos(a) * w * rr, base - math.sin(a) * h * rr
        d.ellipse([cx_ - 2, cy_ - 1, cx_ + 2, cy_ + 1], outline=C(dark))
        d.point([(cx_ - 1, cy_ - 1)], fill=C(hi))


def weapon_rack(d, x, y):
    box(d, x - 24, y - 2, x + 24, y + 1, '#6a4028')
    box(d, x - 24, y - 34, x + 24, y - 32, '#6a4028')
    for k, dx in enumerate(range(-20, 22, 8)):
        kind = k % 4
        xx = x + dx
        if kind == 0:  # sword
            d.line([(xx, y - 4), (xx, y - 30)], fill=C('#c8cee0'), width=2)
            d.line([(xx - 3, y - 26), (xx + 3, y - 26)], fill=C('#ffc15a'))
        elif kind == 1:  # axe
            d.line([(xx, y - 3), (xx, y - 31)], fill=C('#8a4f22'))
            d.pieslice([xx - 6, y - 32, xx + 2, y - 22], 90, 270, fill=C('#a8b0c8'))
        elif kind == 2:  # spear
            d.line([(xx, y - 3), (xx, y - 30)], fill=C('#8a4f22'))
            d.polygon([(xx - 2, y - 30), (xx, y - 37), (xx + 2, y - 30)], fill=C('#c8cee0'))
        else:  # hammer
            d.line([(xx, y - 3), (xx, y - 26)], fill=C('#8a4f22'))
            box(d, xx - 4, y - 31, xx + 4, y - 26, '#8a8aa0')


def z10_layers():
    s, d = layer()
    sky(s, [(0, '#120a10'), (90, '#2a1418'), (170, '#5a2a1a'), (205, '#8a4a20')])
    r = random.Random(101)
    dots(s, r, 50, ['#ffc15a', '#fff2a8'], 0, 180)  # glints of gold in the dark
    # the vault's back wall: great arches
    for x in range(0, W, 80):
        d.arc([x - 2, 30, x + 78, 190], 180, 360, fill=C('#3a2220'), width=4)
    far, d = layer()
    # mountains of coins (avalanches slide down them in game)
    ANCHORS['armory-vault'] = {'piles': [[1, x, 196, w_, h_] for x, w_, h_ in ((60, 90, 70), (250, 120, 90), (430, 80, 60))]}
    for x, w_, h_ in ((60, 90, 70), (250, 120, 90), (430, 80, 60)):
        wrap(lambda xx: coin_pile(d, xx, 196, w_, h_, '#c8902a', '#f0c060', '#8a5a1a', 3), x)
    box(d, 0, 190, W - 1, H - 1, '#a87020')
    mid, d = layer()
    # stone pillars with weapon racks between them
    for x in range(40, W, 160):
        wrap(lambda xx: (box(d, xx - 10, 60, xx + 10, H - 1, '#4a3030', '#2a1a1a'), box(d, xx - 14, 56, xx + 14, 62, '#5a3a38'),
                         box(d, xx - 14, 186, xx + 14, 192, '#5a3a38'), d.line([(xx - 8, 64), (xx - 8, 184)], fill=C('#6a4a48'))), x)
    for x in range(120, W + 120, 160):
        wrap(lambda xx: weapon_rack(d, xx, 190), x)
    # a round vault door
    def door(x):
        disc(d, x, 128, 30, '#8a8aa0', '#3a3a50')
        disc(d, x, 128, 22, '#a8a8b8')
        for k in range(8):
            a = k * math.tau / 8
            d.line([(x, 128), (x + math.cos(a) * 18, 128 + math.sin(a) * 18)], fill=C('#5a5a70'), width=2)
        disc(d, x, 128, 5, '#ffc15a', '#8a5a1a')
    wrap(door, 280)
    near, d = layer()
    for x, w_, h_ in ((20, 40, 18), (140, 30, 12), (300, 50, 22), (420, 36, 14)):
        wrap(lambda xx: coin_pile(d, xx, 202, w_, h_, seed=7), x)
    for x in (90, 360):  # an open chest
        wrap(lambda xx: (box(d, xx - 10, 186, xx + 10, 200, '#8a4f22', '#3a1a10'), box(d, xx - 10, 186, xx + 10, 189, '#ffc15a'),
                         d.polygon([(xx - 10, 186), (xx - 12, 176), (xx + 8, 176), (xx + 10, 186)], fill=C('#6a3a1a')),
                         disc(d, xx - 3, 185, 2, '#ff6fb5'), disc(d, xx + 4, 184, 2, '#3bb8a8')), x)
    box(d, 0, 202, W - 1, H - 1, '#c8902a')
    return [s, far, mid, near]


def z10_sprites():
    def ground(big, d, s):
        box(d, s, s, 2 * s - 1, 2 * s - 1, '#3a2424')
        r = random.Random(31)
        for row in range(4):
            off = (row % 2) * 16
            for x in range(s - 32 + off, 2 * s + 32, 32):
                d.rectangle([x + 1, s + row * 16 + 1, x + 30, s + row * 16 + 14], fill=C(('#4a3030', '#523634', '#46302e')[(x // 32 + row) % 3]))
                d.line([(x + 1, s + row * 16 + 1), (x + 30, s + row * 16 + 1)], fill=C('#6a4a48'))
        for _ in range(9):  # coins and gold veins in the mortar
            x, y = r.randrange(s, 2 * s), r.randrange(s, 2 * s)
            d.ellipse([x - 2, y - 1, x + 2, y + 1], fill=C('#ffc15a'))
            d.point([(x - 1, y - 1)], fill=C('#fff2a8'))
    g = tile2d(TILE, ground)
    lip, d = canvas(64, 10)  # a crust of coins
    box(d, 0, 3, 63, 7, '#c8902a')
    for x in range(0, 64, 3):
        y = 1 + (x * 5) % 3
        d.ellipse([x - 1, y, x + 3, y + 3], fill=C('#ffc15a'), outline=C('#a87020'))
        d.point([(x, y + 1)], fill=C('#fff2a8'))
    d.line([(0, 8), (63, 8)], fill=C('#5a3a20'))
    ceil, d = canvas(64, 18)  # vault stone with a hanging chain and a glinting gem
    box(d, 0, 0, 63, 4, '#3a2424')
    for x in range(0, 64, 16):
        d.line([(x, 0), (x, 4)], fill=C('#2a1a1a'))
    chain(d, 20, 4, 16, '#8a6a2a', '#ffc15a')
    disc(d, 46, 6, 2, '#ff6fb5')
    pits = []
    for i in range(4):  # a pit full of loose coins, sparkling
        p, d = canvas(32, 8)
        box(d, 0, 1, 31, 7, '#c8902a')
        for x in range(0, 32, 3):
            d.ellipse([x, 1 + (x % 2), x + 3, 3 + (x % 2)], fill=C('#ffc15a'))
        sx = (i * 11) % 30
        d.point([(sx, 1), (sx + 1, 0), (sx - 1, 0), (sx, -1)], fill=C('#ffffff'))
        pits.append(p)
    props = {}
    def chest(im, d, i):
        box(d, 1, 9, 21, 20, '#8a4f22', '#3a1a10')
        box(d, 1, 9, 21, 11, '#ffc15a')
        lid = (0, 1, 2, 1)[i]
        d.polygon([(1, 9 - lid), (3, 3 - lid), (19, 3 - lid), (21, 9 - lid)], fill=C('#a05a28'))
        d.line([(1, 9 - lid), (21, 9 - lid)], fill=C('#ffc15a'))
        box(d, 9, 9, 13, 14, '#ffc15a', '#8a5a1a')
        if lid:
            d.line([(4, 9), (18, 9)], fill=C('#fff2a8'))
            d.point([(8, 8 - lid), (14, 7 - lid)], fill=C('#ffffff'))
    props['chest'] = frames(4, 23, 21, chest)
    def pile(im, d, i):
        coin_pile(d, 13, 15, 12, 12, seed=i)
        d.line([(6, 6), (10, 3)], fill=C('#c8cee0'), width=2)  # a sword sticking out
        d.line([(5, 8), (8, 5)], fill=C('#ffc15a'))
    props['pile'] = frames(1, 27, 16, pile, '#5a3a1a')
    def gems(im, d, i):
        for x, hh, col in ((4, 8, '#ff6fb5'), (8, 13, '#3bb8a8'), (13, 9, '#7a4bc2')):
            d.polygon([(x - 2, 14), (x, 14 - hh), (x + 2, 14)], fill=C(col))
            d.line([(x - 1, 13), (x, 15 - hh)], fill=C('#ffffff'))
        sx, sy = ((8, 1), (4, 6), (13, 5))[i]
        for dx, dy in ((0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)):
            im.putpixel((sx + dx, sy + dy), C('#ffffff'))
    props['gems'] = frames(3, 17, 15, gems)
    def rack(im, d, i):
        weapon_rack(d, 25, 39)
    props['rack'] = frames(1, 51, 41, rack)
    def crown(im, d, i):
        d.polygon([(2, 12), (2, 4), (6, 8), (10, 2), (14, 8), (18, 4), (18, 12)], fill=C('#ffc15a'))
        d.line([(2, 12), (18, 12)], fill=C('#c88a2a'), width=2)
        disc(d, 10, 9, 1, '#c4363e')
        if i:
            d.point([(10, 1), (18, 3)], fill=C('#ffffff'))
    props['crown'] = frames(2, 21, 15, crown, '#5a3a1a')
    return {'ground': g, 'lip': lip, 'ceil': ceil, 'pit': (strip(pits), 4), **props}


def z10_slab():
    im, d = canvas(27, 12)  # a stack of gold bars
    for k, x in enumerate(range(0, 27, 9)):
        d.polygon([(x, 8), (x + 1, 2), (x + 8, 2), (x + 9, 8)], fill=C('#ffc15a'))
        d.line([(x + 1, 2), (x + 8, 2)], fill=C('#fff2a8'))
        d.line([(x + 2, 4), (x + 4, 4)], fill=C('#fff2a8'))
    d.line([(0, 8), (26, 8)], fill=C('#c88a2a'))
    d.line([(0, 9), (26, 9)], fill=C('#a87020'))
    return outline(im, '#3a2010').crop((0, 0, 27, 12))


ZONES = {
    'mountain-monastery': lambda: {'layers': z6_layers(), 'sprites': z6_sprites(), 'slab': z6_slab()},
    'storm-forge': lambda: {'layers': z7_layers(), 'sprites': z7_sprites(), 'slab': z7_slab()},
    'witch-cottage': lambda: {'layers': z8_layers(), 'sprites': z8_sprites(), 'slab': z8_slab()},
    'ninja-castle': lambda: {'layers': z9_layers(), 'sprites': z9_sprites(), 'slab': z9_slab()},
    'armory-vault': lambda: {'layers': z10_layers(), 'sprites': z10_sprites(), 'slab': z10_slab()},
}
