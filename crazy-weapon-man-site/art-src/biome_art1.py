"""Zone environments 1-5 (see biomes.py for the layer and atlas conventions).

  1 the Sword Graveyard     sword geese: a golden-hour meadow of old swords, graves and banners
  2 the snowy fuzz woods     fuzzballs, yetis and wolves: snowfall, pines, aurora, ice
  3 the turtle lagoon        turtles and frogs: lily ponds, bamboo and a dojo on stilts
  4 the night bazaar         cats and raccoons: lanterns, awnings and pools of darkness
  5 the sakura shrine        samurai dogs and foxes: torii, red bridges and falling petals
"""
import math
import random
from PIL import Image, ImageDraw
from biomes import (W, H, GROUND, TILE, C, mix, sky, wave, profile, wrap, outline, canvas, disc, box,
                    dots, tint, tileable, tile2d, strip, stones, strata)

INK = '#1a1428'


def layer():
    return canvas(W, H)


def sprite(w, h, draw, col=INK, diag=False):
    im, d = canvas(w, h)
    draw(im, d)
    return outline(im, col, diag)


def frames(n, w, h, draw, col=INK):
    return strip([sprite(w, h, lambda im, d, i=i: draw(im, d, i), col) for i in range(n)]), n


def lip_from(rows, w=64, seed=0, tufts=None, flowers=None, hang=None):
    """A ground top: rows[k] is the colour of row k (row 3 is the walking surface)."""
    r = random.Random(seed)
    im, d = canvas(w, len(rows) + 6)
    for y, col in enumerate(rows):
        if col:
            d.line([(0, y), (w - 1, y)], fill=C(col))
    if hang:  # scalloped edge hanging into the soil
        col, depth = hang
        for x in range(w):
            dy = round(depth * (0.5 + 0.5 * math.sin(x / w * math.tau * 4)))
            d.line([(x, len(rows)), (x, len(rows) + dy)], fill=C(col))
    if tufts:
        col, hi = tufts
        for x in range(1, w, 5):
            hgt = r.choice([1, 2, 3])
            d.line([(x, 3 - hgt), (x, 2)], fill=C(col))
            if hgt > 1:
                im.putpixel((x + (1 if x % 2 else -1) if 0 < x < w - 1 else x, 3 - hgt), C(hi))
    if flowers:
        for _ in range(flowers[1]):
            x = r.randrange(1, w - 1)
            col = r.choice(flowers[0])
            im.putpixel((x, 1), C(col))
            im.putpixel((x, 2), C('#4f8a3a'))
    return im


# ======================================================================== 1 SWORD GRAVEYARD
def blade(d, x, base, h, w=3, steel='#c8cee0', hi='#f4f1e8', guard='#e0a43a', grip='#6a3a2a', tilt=0, out=None):
    """A sword stuck point-down in the ground, tilted by tilt px over its height."""
    for i in range(h):
        xx = x + round(tilt * i / h)
        d.line([(xx - w // 2, base - i), (xx + w // 2, base - i)], fill=C(steel))
        d.point([(xx - w // 2, base - i)], fill=C(hi))
    top = x + tilt
    d.line([(top - w - 2, base - h), (top + w + 2, base - h)], fill=C(guard), width=2)
    d.line([(top, base - h - 1), (top, base - h - 6)], fill=C(grip), width=2)
    disc(d, top, base - h - 7, 1, guard)


def z1_layers():
    s, _ = layer()
    sky(s, [(0, '#6a78e0'), (50, '#9c86e6'), (105, '#f0a0c8'), (150, '#ffc89c'), (200, '#ffe6ae')])
    d = ImageDraw.Draw(s)
    # a big soft sun with a dithered halo, low over the hills
    for r_, col in ((30, '#ffe6ae'), (22, '#fff2c8'), (17, '#fff8e0')):
        disc(d, 340, 150, r_, col)
    for y in range(110, 190):
        for x in range(296, 386):
            dd = math.hypot(x - 340, y - 150)
            if 30 < dd < 38 and (x + y) % 2 == 0:
                s.putpixel((x, y), C('#ffe0b0'))
    far, d = layer()
    f = wave(11, [9, 6, 3])
    profile(far, lambda x: 160 + f(x), '#9a7cc8', edge='#b59ae0')
    # giant swords of old battles stuck in the far hills
    for x, h, t in ((60, 70, -6), (205, 52, 4), (420, 64, 8)):
        wrap(lambda xx: blade(d, xx, round(164 + f(xx % W)), h, 5, '#8a6fc0', '#b8a2e8', '#7a5fb0', '#6a52a0', t), x)
    # a little castle on the far hill
    def castle(x):
        y = round(156 + f(x % W))
        box(d, x - 10, y - 14, x + 10, y, '#8466b8')
        box(d, x - 14, y - 22, x - 8, y, '#8466b8')
        box(d, x + 8, y - 26, x + 14, y, '#8466b8')
        d.polygon([(x + 7, y - 26), (x + 11, y - 34), (x + 15, y - 26)], fill=C('#7a5aa8'))
        d.line([(x + 11, y - 34), (x + 11, y - 40)], fill=C('#7a5aa8'))
        d.polygon([(x + 11, y - 40), (x + 16, y - 38), (x + 11, y - 36)], fill=C('#f06a52'))
    wrap(castle, 300)
    mid, d = layer()
    g = wave(12, [7, 4, 2])
    profile(mid, lambda x: 182 + g(x), '#6a9a74', edge='#9cc98a', edge2='#86b880')
    r = random.Random(4)
    for x in range(8, W, 26):
        y = round(184 + g(x))
        k = r.random()
        if k < 0.35:   # a little cross
            wrap(lambda xx: (d.line([(xx, y - 9), (xx, y)], fill=C('#c8c0b0')), d.line([(xx - 3, y - 6), (xx + 3, y - 6)], fill=C('#c8c0b0'))), x)
        elif k < 0.6:  # a tombstone
            wrap(lambda xx: (box(d, xx - 3, y - 8, xx + 3, y, '#a8a4b8'), d.pieslice([xx - 3, y - 11, xx + 3, y - 5], 180, 360, fill=C('#a8a4b8'))), x)
        else:          # a sword
            wrap(lambda xx: blade(d, xx, y + 1, 9, 1, '#d8dcec', '#ffffff', '#e0a43a', '#7a4a3a', r.choice([-2, 2])), x)
    # a ruined arch with a tattered banner
    def arch(x):
        y = round(186 + g(x % W))
        for xx in (x - 18, x + 12):
            box(d, xx, y - 40, xx + 6, y, '#b8b0c8', '#8a82a0')
        d.arc([x - 18, y - 58, x + 18, y - 26], 180, 360, fill=C('#b8b0c8'), width=6)
        d.polygon([(x - 6, y - 38), (x + 6, y - 38), (x + 6, y - 20), (x, y - 24), (x - 6, y - 20)], fill=C('#c4363e'))
        blade(d, x, y - 27, 0, 1, '#ffc15a', '#ffffff', '#ffc15a', '#ffc15a')
    wrap(arch, 140)
    near, d = layer()
    n = wave(13, [6, 4, 2])
    profile(near, lambda x: 198 + n(x), '#3f7a4a', edge='#7cc254', edge2='#5fa046')
    r = random.Random(5)
    for x in range(0, W, 40):  # round bushes along the near hills
        y = round(200 + n(x))
        wrap(lambda xx: (disc(d, xx, y - 6, 9, '#2f6a3a'), disc(d, xx + 8, y - 4, 7, '#2f6a3a'),
                         disc(d, xx - 2, y - 9, 5, '#4f8a3a'), d.point([(xx - 3, y - 11), (xx + 7, y - 7)], fill=C('#b7e27a'))), x + r.randrange(-6, 6))
    for x, h, t in ((90, 40, -10), (250, 34, 7), (395, 46, -5)):
        y = round(204 + n(x))
        wrap(lambda xx: blade(d, xx, y, h, 4, '#c8cee0', '#ffffff', '#ffc15a', '#7a3a2a', t), x)
    return [s, far, mid, near]


def z1_sprites():
    def ground(big, d, s):
        strata(d, s, 1, ['#6b4a3a', '#644335', '#6b4a3a', '#5e3f31'], 16, 3)
        stones(d, s, 2, ('#8a6a5a', '#a88a78', '#4a3028'), 9, 3, 6)
        stones(d, s, 3, ('#7a5a4a', '#94786a', '#4a3028'), 14, 1, 2)
        r = random.Random(1)
        for _ in range(3):  # buried rusty blades
            x, y = r.randrange(s, 2 * s), r.randrange(s + 6, 2 * s - 6)
            d.line([(x, y), (x + 7, y + 3)], fill=C('#9a6a4a'), width=2)
            d.point([(x + 1, y)], fill=C('#c8a080'))
    g = tile2d(TILE, ground)
    lip = lip_from(['#b7e27a', '#7cc254', '#7cc254', '#7cc254', '#5fa046', '#4f8a3a'], seed=2,
                   tufts=('#7cc254', '#b7e27a'), flowers=(['#f4f1e8', '#ffc15a', '#ff6fb5'], 5), hang=('#4f8a3a', 3))
    ceil, d = canvas(64, 16)
    for x in range(64):
        hgt = 3 + round(2 * math.sin(x * 0.4)) + (x % 7 == 0) * 3
        d.line([(x, 0), (x, hgt)], fill=C('#54382c'))
    for x in (5, 23, 41, 57):
        d.line([(x, 3), (x + 1, 12)], fill=C('#8a6a48'))
        d.point([(x + 1, 13)], fill=C('#7cc254'))
    for x in range(2, 64, 9):
        d.line([(x, 4), (x, 7)], fill=C('#4f8a3a'))
    # the pit: a bed of sword points
    pit, d = canvas(32, 16)
    for i, x in enumerate(range(2, 32, 6)):
        hh = 10 + (i % 2) * 3
        d.polygon([(x, 16), (x + 2, 16 - hh), (x + 4, 16)], fill=C('#c8cee0'))
        d.line([(x + 2, 16 - hh), (x + 2, 15)], fill=C('#ffffff'))
    props = {}
    props['sword'] = (strip([sprite(14, 34, lambda im, d, t=t, h=h: blade(d, 7, 33, h, 3, tilt=t)) for t, h in ((0, 22), (-3, 18), (3, 25))]), 3)
    def grave(im, d, i):
        if i == 0:
            box(d, 3, 6, 13, 21, '#b8b4c8')
            d.pieslice([3, 1, 13, 11], 180, 360, fill=C('#b8b4c8'))
            d.line([(5, 6), (11, 6)], fill=C('#8a86a0'))
            d.line([(8, 9), (8, 15)], fill=C('#8a86a0'))
            d.line([(6, 11), (10, 11)], fill=C('#8a86a0'))
            disc(d, 3, 19, 2, '#7cc254')
        else:  # a knight's helmet hung on a cross
            d.line([(8, 4), (8, 21)], fill=C('#8a5a3a'), width=2)
            d.line([(3, 9), (13, 9)], fill=C('#8a5a3a'), width=2)
            d.pieslice([4, 1, 12, 11], 180, 360, fill=C('#a8b0c8'))
            box(d, 4, 6, 12, 9, '#a8b0c8')
            d.line([(5, 7), (11, 7)], fill=C('#1a1428'))
            d.line([(8, 1), (8, -2)], fill=C('#c4363e'))
    props['grave'] = frames(2, 17, 22, grave)
    def tuft(im, d, i):
        sway = (-1, 0, 1, 0)[i]
        for k, x in enumerate((2, 4, 6, 8, 10)):
            top = 3 + (k % 2) * 3
            d.line([(x, 13), (x + sway * (1 + k % 2), top)], fill=C('#5fa046' if k % 2 else '#7cc254'))
        d.point([(4 + sway, 3)], fill=C('#b7e27a'))
    props['tuft'] = frames(4, 13, 14, tuft, '#2f5a2c')
    def banner(im, d, i):
        d.line([(3, 6), (3, 40)], fill=C('#8a4f22'), width=2)
        d.polygon([(2, 0), (4, 0), (3, 5)], fill=C('#c8cee0'))
        wv = [0, 1, 2, 1][i]
        pts = [(5, 7)] + [(5 + k * 4, 7 + round(math.sin(i * 1.6 + k) * 1.5)) for k in range(1, 5)]
        bottom = [(5 + k * 4, 17 + round(math.sin(i * 1.6 + k + 1) * 1.5)) for k in range(4, 0, -1)] + [(5, 17)]
        d.polygon(pts + [(22 + wv, 12)] + bottom, fill=C('#c4363e'))
        d.line(pts, fill=C('#f06a52'))
        blade(d, 11, 15, 5, 1, '#ffc15a', '#fff2c8', '#ffc15a', '#ffc15a', 0)
    props['banner'] = frames(4, 26, 41, banner)
    def nest(im, d, i):
        d.ellipse([1, 7, 21, 14], fill=C('#a07040'))
        for x in range(2, 21, 3):
            d.line([(x, 8), (x + 2, 13)], fill=C('#7a4f2a'))
        wob = (0, -1, 0, 1)[i]
        disc(d, 8 + wob, 6, 3, '#f4f1e8')
        disc(d, 13, 6, 3, '#f4f1e8')
        d.point([(7 + wob, 5), (12, 5)], fill=C('#ffffff'))
        d.point([(14, 7), (9 + wob, 7)], fill=C('#c3c4d6'))
    props['nest'] = frames(4, 23, 15, nest)
    def daisy(im, d, i):
        for k, (x, hh) in enumerate(((3, 9), (8, 12), (12, 8))):
            sw = (i + k) % 2
            d.line([(x, 14), (x + sw, 14 - hh)], fill=C('#4f8a3a'))
            col = ('#f4f1e8', '#ff6fb5', '#f4f1e8')[k]
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                im.putpixel((x + sw + dx, 14 - hh + dy), C(col))
            im.putpixel((x + sw, 14 - hh), C('#ffc15a'))
    props['daisy'] = frames(2, 16, 15, daisy, '#2f5a2c')
    return {'ground': g, 'lip': lip, 'ceil': ceil, 'pit': pit, **props}


def z1_slab():
    im, d = canvas(27, 14)
    box(d, 0, 2, 26, 11, '#a8a4b8')
    for x in range(0, 27, 9):
        d.line([(x, 3), (x, 11)], fill=C('#8a86a0'))
    d.line([(0, 9), (26, 9)], fill=C('#8a86a0'))
    d.line([(0, 0), (26, 0)], fill=C('#b7e27a'))
    d.line([(0, 1), (26, 2)], fill=C('#7cc254'))
    for x in (3, 11, 18, 24):
        d.line([(x, 3), (x, 4 + x % 3)], fill=C('#5fa046'))
    d.line([(0, 12), (26, 12)], fill=C('#5d5a7a'))
    return outline(im, '#2a2238').crop((0, 0, 27, 16))


# ======================================================================== 2 SNOWY FUZZ WOODS
def pine(d, x, base, h, w, dark, light, snow='#f4f8ff'):
    """A snowy pine: stacked triangles with snow on each tier."""
    tiers = max(2, h // 9)
    for k in range(tiers):
        ty = base - h + k * (h // tiers)
        hw = round(w * (k + 1) / tiers / 2) + 1
        d.polygon([(x, ty), (x - hw, ty + h // tiers + 3), (x + hw, ty + h // tiers + 3)], fill=C(dark))
        d.line([(x - hw + 1, ty + h // tiers + 3), (x + hw - 1, ty + h // tiers + 3)], fill=C(snow))
        d.line([(x - hw // 2, ty + h // tiers // 2 + 2), (x, ty)], fill=C(light))
        d.point([(x, ty)], fill=C(snow))
    d.line([(x, base - 2), (x, base)], fill=C('#5d3f30'), width=2)


def z2_layers():
    s, d = layer()
    sky(s, [(0, '#1e1f52'), (60, '#2f3f86'), (120, '#5a7ec4'), (175, '#a6c8ec'), (205, '#d6e8f8')])
    r = random.Random(21)
    dots(s, r, 90, ['#c3c4d6', '#f4f1e8', '#a8dcfd'], 0, 110)
    disc(d, 92, 46, 9, '#eef4ff')
    disc(d, 96, 43, 8, '#2a3570')  # a crescent moon
    far, d = layer()
    f = wave(21, [16, 8, 4], [1, 3, 5])
    profile(far, lambda x: 150 + f(x) - 12 * abs(math.sin(x / W * math.tau * 2)), '#7f98c8', edge='#e8f0ff', edge2='#c6d6f0')
    for x in range(W):  # snow caps on the peaks, with a ragged lower edge
        y = round(150 + f(x) - 12 * abs(math.sin(x / W * math.tau * 2)))
        if y < 140:
            d.line([(x, y + 2), (x, y + 2 + (140 - y) // 2 + (x * 7 % 5 == 0) * 2 - (x % 3 == 0))], fill=C('#dce8fa'))
    mid, d = layer()
    g = wave(22, [5, 3])
    profile(mid, lambda x: 184 + g(x), '#c2d4ee', edge='#f4f8ff')
    r = random.Random(23)
    xs = sorted(r.randrange(W) for _ in range(28))
    for x in xs:
        h = r.randrange(26, 44)
        wrap(lambda xx: pine(d, xx, round(186 + g(x)), h, h // 2 + 6, '#4a6a9a', '#6a8aba', '#eef4ff'), x)
    # an igloo and a frozen archery target
    def igloo(x):
        y = round(186 + g(x % W))
        d.pieslice([x - 16, y - 16, x + 16, y + 16], 180, 360, fill=C('#f4f8ff'), outline=C('#a8c0e0'))
        for yy in (y - 5, y - 10):
            d.line([(x - 14, yy), (x + 14, yy)], fill=C('#c6d6f0'))
        d.pieslice([x + 4, y - 9, x + 16, y + 9], 180, 360, fill=C('#2f3f6a'))
    wrap(igloo, 330)
    near, d = layer()
    n = wave(24, [6, 3, 2])
    profile(near, lambda x: 196 + n(x), '#e6f0fc', edge='#ffffff', shade=('#c6d6f0', 7, 2))
    r = random.Random(25)
    for x in (30, 150, 270, 410):
        h = r.randrange(48, 64)
        wrap(lambda xx: pine(d, xx, round(199 + n(x)), h, h // 2 + 10, '#2f5a6a', '#4a7a8a'), x)
    for x in (100, 220, 360):  # snow drifts
        y = round(200 + n(x))
        wrap(lambda xx: (d.ellipse([xx - 16, y - 7, xx + 16, y + 6], fill=C('#ffffff')),
                         d.arc([xx - 16, y - 7, xx + 16, y + 6], 200, 340, fill=C('#c6d6f0'))), x)
    return [s, far, mid, near]


def z2_sprites():
    def ground(big, d, s):
        strata(d, s, 7, ['#b8cce8', '#accae6', '#a4c0e2', '#b0c8e8'], 16, 3)
        stones(d, s, 8, ('#d0e4f8', '#ffffff', '#8aa8d0'), 7, 3, 6, 0.5)
        r = random.Random(7)
        for _ in range(26):
            x, y = r.randrange(s, 2 * s), r.randrange(s, 2 * s)
            d.line([(x, y), (x + r.randrange(3, 8), y)], fill=C(r.choice(['#d6e4f6', '#94b0d8'])))
        for _ in range(6):
            x, y = r.randrange(s, 2 * s), r.randrange(s, 2 * s)
            d.point([(x, y)], fill=C('#ffffff'))
    g = tile2d(TILE, ground)
    lip, d = canvas(64, 12)
    for x in range(64):
        bump = round(1.5 + 1.5 * math.sin(x / 64 * math.tau * 3))
        d.line([(x, 3 - bump // 2), (x, 7 + bump)], fill=C('#ffffff'))
        im_y = 7 + bump
        d.point([(x, im_y)], fill=C('#c6d6f0'))
    for x in range(3, 64, 11):
        d.point([(x, 3), (x + 1, 4)], fill=C('#a8dcfd'))
    # an ice sheet: glassy blue with shine streaks (slippery)
    ice, d = canvas(64, 12)
    box(d, 0, 2, 63, 8, '#a8dcfd')
    d.line([(0, 2), (63, 2)], fill=C('#ffffff'))
    d.line([(0, 3), (63, 3)], fill=C('#d8f0ff'))
    for x in (6, 30, 47):
        d.line([(x, 5), (x + 5, 3)], fill=C('#ffffff'))
        d.line([(x + 2, 6), (x + 5, 5)], fill=C('#ffffff'))
    d.line([(0, 9), (63, 9)], fill=C('#7ab8e8'))
    ceil, d = canvas(64, 16)
    for x in range(0, 64, 5):  # icicles
        hh = 4 + (x * 7) % 9
        d.polygon([(x, 0), (x + 4, 0), (x + 2, hh)], fill=C('#c6e6ff'))
        d.line([(x + 1, 0), (x + 2, hh - 1)], fill=C('#ffffff'))
    pit, d = canvas(32, 16)  # an icy crevasse: blue shards
    for i, x in enumerate(range(0, 32, 8)):
        d.polygon([(x, 16), (x + 3, 6 + (i % 2) * 3), (x + 7, 16)], fill=C('#7ab8e8'))
        d.line([(x + 3, 7 + (i % 2) * 3), (x + 3, 15)], fill=C('#d8f0ff'))
    props = {}
    props['pine'] = (strip([sprite(22, 34, lambda im, d, h=h: pine(d, 11, 33, h, 18 + h // 6, '#2f5a6a', '#4a8a8a')) for h in (26, 32)]), 2)
    def snowman(im, d, i):
        disc(d, 9, 21, 7, '#ffffff')
        disc(d, 9, 10, 5, '#ffffff')
        d.arc([2, 14, 16, 28], 20, 160, fill=C('#c6d6f0'))
        d.point([(7, 9), (11, 9)] if i != 2 else [(7, 10), (11, 10)], fill=C('#1a1428'))
        d.line([(9, 11), (13, 12)], fill=C('#f08a2c'))
        box(d, 4, 14, 14, 15, '#c4363e')
        d.line([(13, 15), (15, 19)], fill=C('#c4363e'))
        d.line([(3, 17), (-1 + i % 2, 13)], fill=C('#8a4f22'))
        d.line([(15, 17), (19, 13 + i % 2)], fill=C('#8a4f22'))
        box(d, 5, 3, 13, 5, '#2b2442')  # a little hat
        box(d, 7, 0, 11, 4, '#2b2442')
    props['snowman'] = frames(4, 20, 29, snowman, '#5a6a9a')
    def crystal(im, d, i):
        for x, hh, col in ((4, 10, '#a8dcfd'), (8, 15, '#d8f0ff'), (12, 9, '#a8dcfd')):
            d.polygon([(x - 2, 16), (x, 16 - hh), (x + 2, 16)], fill=C(col))
        sx, sy = ((8, 2), (4, 7), (12, 8), (9, 9))[i]
        im.putpixel((sx, sy), C('#ffffff'))
        if i == 0:
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                im.putpixel((sx + dx, sy + dy), C('#ffffff'))
    props['crystal'] = frames(4, 16, 17, crystal, '#3a5a9a')
    def target(im, d, i):
        d.line([(6, 10), (3, 24)], fill=C('#8a4f22'), width=2)
        d.line([(12, 10), (15, 24)], fill=C('#8a4f22'), width=2)
        for k, col in enumerate(('#f4f1e8', '#5aa6f0', '#f4f1e8', '#5aa6f0', '#ffc15a')):
            disc(d, 9, 10, 8 - k * 2, col)
        d.pieslice([1, 1, 17, 12], 180, 360, fill=C('#ffffff'))
        d.line([(9, 9), (16, 6)], fill=C('#8a4f22'))
        d.point([(16, 5), (17, 6)], fill=C('#f4f1e8'))
    props['target'] = frames(1, 19, 25, target, '#2f3f6a')
    def drift(im, d, i):
        d.ellipse([0, 4, 24, 14], fill=C('#ffffff'))
        d.ellipse([5, 0, 17, 10], fill=C('#ffffff'))
        d.arc([0, 4, 24, 14], 20, 160, fill=C('#c6d6f0'))
        if i:
            d.point([(8, 6), (15, 6)], fill=C('#1a1428'))  # something blinks inside
    props['drift'] = frames(2, 25, 14, drift, '#a8c0e0')
    return {'ground': g, 'lip': lip, 'ice': ice, 'ceil': ceil, 'pit': pit, **props}


def z2_slab():
    im, d = canvas(27, 16)
    box(d, 0, 2, 26, 10, '#a8dcfd')
    for x in range(0, 27, 9):
        d.line([(x + 2, 4), (x + 6, 9)], fill=C('#d8f0ff'))
    for x in range(27):
        d.line([(x, 0), (x, 2 + (x % 9 in (3, 4)))], fill=C('#ffffff'))
    for x in (2, 8, 14, 20, 25):  # icicles under
        d.polygon([(x - 1, 10), (x + 1, 10), (x, 10 + 2 + x % 4)], fill=C('#c6e6ff'))
    return outline(im, '#3a5a9a').crop((0, 0, 27, 17))


# ======================================================================== 3 TURTLE LAGOON
def bamboo(d, x, base, h, col='#5aa04a', node='#2f6a3a', hi='#9ad070'):
    d.line([(x, base), (x, base - h)], fill=C(col), width=3)
    d.line([(x - 1, base), (x - 1, base - h)], fill=C(hi))
    for y in range(base - 8, base - h, -9):
        d.line([(x - 1, y), (x + 1, y)], fill=C(node))
    for k, y in enumerate(range(base - h + 4, base - h // 2, 10)):
        sd = 1 if k % 2 else -1
        d.polygon([(x, y), (x + sd * 9, y - 3), (x + sd * 7, y + 1)], fill=C(node))


def lilypad(d, x, y, r, col='#4fa04a', hi='#9ad070'):
    d.ellipse([x - r, y - r // 2, x + r, y + r // 2], fill=C(col))
    d.polygon([(x, y), (x + r, y - 1), (x + r, y + 1)], fill=(0, 0, 0, 0))
    d.arc([x - r, y - r // 2, x + r, y + r // 2], 190, 300, fill=C(hi))


def z3_layers():
    s, d = layer()
    sky(s, [(0, '#3aa6e8'), (90, '#7ccdf4'), (150, '#c8ecfa')])
    disc(d, 70, 44, 14, '#fff6c8')
    disc(d, 70, 44, 11, '#fffbe6')
    far, d = layer()
    # the sea, a horizon of islands and sparkles
    box(d, 0, 150, W - 1, H - 1, '#3bb8c8')
    for y in range(150, 175, 3):
        for x in range((y * 7) % 11, W, 13):
            d.line([(x, y), (x + 3, y)], fill=C('#8ae0e8'))
    for x, w_, h_ in ((120, 60, 18), (380, 90, 26)):
        def isl(xx, w_=w_, h_=h_):
            d.ellipse([xx - w_ // 2, 150 - h_, xx + w_ // 2, 150 + h_ // 3], fill=C('#5aa070'))
            d.ellipse([xx - w_ // 3, 150 - h_ - 4, xx + w_ // 6, 150 - h_ + 10], fill=C('#4a9060'))
        wrap(isl, x)
    mid, d = layer()
    g = wave(31, [4, 2])
    profile(mid, lambda x: 178 + g(x), '#58b060', edge='#a6e070')
    r = random.Random(32)
    for x in range(0, W, 6):
        if (x // 60) % 2 == 0 and r.random() < 0.5 and not 200 < x < 300:
            wrap(lambda xx, h=r.randrange(24, 60): bamboo(d, xx, round(180 + g(x)), h, '#6ab058', '#3f8040', '#a6e070'), x)
    # the bamboo dojo on stilts, with a nunchuck sign
    def dojo(x):
        y = round(178 + g(x % W))
        for xx in (x - 26, x - 8, x + 8, x + 26):
            d.line([(xx, y - 22), (xx, y + 2)], fill=C('#8a6a3a'), width=2)
        box(d, x - 30, y - 24, x + 30, y - 20, '#a07a40')
        box(d, x - 24, y - 46, x + 24, y - 24, '#e8d8a8', '#8a6a3a')
        for xx in range(x - 22, x + 24, 8):
            d.line([(xx, y - 45), (xx, y - 25)], fill=C('#c8b888'))
        d.polygon([(x - 36, y - 44), (x, y - 64), (x + 36, y - 44)], fill=C('#3a8a5a'))
        d.line([(x - 36, y - 44), (x + 36, y - 44)], fill=C('#2a6a4a'), width=2)
        d.polygon([(x - 40, y - 42), (x - 34, y - 46), (x - 32, y - 43)], fill=C('#3a8a5a'))
        d.polygon([(x + 40, y - 42), (x + 34, y - 46), (x + 32, y - 43)], fill=C('#3a8a5a'))
        box(d, x - 7, y - 40, x + 7, y - 30, '#c4363e')
        disc(d, x - 3, y - 35, 2, '#ffc15a')
        disc(d, x + 3, y - 35, 2, '#ffc15a')
        d.line([(x - 1, y - 35), (x + 1, y - 35)], fill=C('#1a1428'))
    wrap(dojo, 250)
    near, d = layer()
    n = wave(33, [3, 2])
    box(d, 0, 192, W - 1, H - 1, '#2f9a9a')  # the pond
    for y in range(193, H, 4):
        for x in range((y * 5) % 17, W, 19):
            d.line([(x, y), (x + 4, y)], fill=C('#5ac8c0'))
    r = random.Random(34)
    for x in range(10, W, 34):
        wrap(lambda xx, y=196 + r.randrange(0, 8), rr=r.randrange(6, 10): lilypad(d, xx, y, rr), x)
    for x in (60, 200, 330, 450):  # reed clumps on the near bank
        for k in range(5):
            wrap(lambda xx, k=k: (d.line([(xx + k * 2, 200), (xx + k * 2 + (k % 2), 176 + k * 3)], fill=C('#3f8040')),
                                  box(d, xx + k * 2, 176 + k * 3, xx + k * 2 + 1, 181 + k * 3, '#8a5a3a') if k % 2 == 0 else None), x)
    for x in (130, 280):  # a big lily flower
        wrap(lambda xx: (lilypad(d, xx, 202, 12), disc(d, xx, 198, 4, '#ff9ac8'), disc(d, xx, 197, 2, '#fff6c8')), x)
    return [s, far, mid, near]


def z3_sprites():
    def ground(big, d, s):
        strata(d, s, 9, ['#d8bc84', '#d0b47a', '#d8bc84', '#c8aa70'], 16, 3)
        stones(d, s, 10, ('#b0a090', '#d0c0b0', '#8a7a6a'), 5, 2, 5)
        r = random.Random(9)
        for _ in range(40):
            x, y = r.randrange(s, 2 * s), r.randrange(s, 2 * s)
            d.point([(x, y)], fill=C(r.choice(['#c8a86e', '#e8d0a0', '#b8985e'])))
        for _ in range(4):  # shells
            x, y = r.randrange(s, 2 * s), r.randrange(s + 4, 2 * s - 4)
            d.pieslice([x - 3, y - 2, x + 3, y + 4], 180, 360, fill=C('#f4c8b8'))
            d.line([(x, y - 2), (x, y + 1)], fill=C('#d89a8a'))
        for k in range(4):
            d.line([(0, s + 14 + k * 14), (3 * s, s + 16 + k * 14)], fill=C('#c8a86e'))
    g = tile2d(TILE, ground)
    lip = lip_from(['#a6e070', '#6ab058', '#6ab058', '#58a050', '#3f8040'], seed=3, tufts=('#58a050', '#a6e070'),
                   flowers=(['#ff9ac8', '#f4f1e8'], 3), hang=('#8a7a50', 2))
    ceil, d = canvas(64, 18)  # sea cave: dripping stalactites with moss
    for x in range(64):
        d.line([(x, 0), (x, 3 + round(1.5 * math.sin(x * 0.5)))], fill=C('#4a6a7a'))
    for x in (4, 18, 33, 47, 58):
        hh = 8 + (x % 5) * 2
        d.polygon([(x - 3, 2), (x + 3, 2), (x, hh)], fill=C('#5a7a8a'))
        d.line([(x - 1, 3), (x, hh - 2)], fill=C('#7a9aaa'))
    for x in range(0, 64, 3):
        d.point([(x, 4 + x % 2)], fill=C('#58a050'))
    # the pit is water: a surface strip in 4 frames (lily pads drift on it in game)
    pits = []
    for i in range(4):
        p, d = canvas(32, 6)
        box(d, 0, 1, 31, 5, '#2f9a9a')
        for x in range(32):
            if (x + i * 2) % 8 < 3:
                d.point([(x, 0 + (x + i) % 2)], fill=C('#8ae0e8'))
        d.line([((i * 8) % 32, 3), ((i * 8) % 32 + 3, 3)], fill=C('#c8f4f0'))
        pits.append(p)
    props = {}
    def cattail(im, d, i):
        sw = (0, 1, 0, -1)[i]
        for k, x in enumerate((3, 7, 11)):
            top = 4 + (k % 2) * 5
            d.line([(x, 28), (x + sw, top)], fill=C('#4f8a3a'))
            box(d, x + sw - 1, top + 2, x + sw + 1, top + 7, '#8a5a3a')
        d.line([(1, 28), (0 + sw, 14)], fill=C('#7cc254'))
        d.line([(13, 28), (15 + sw, 16)], fill=C('#7cc254'))
    props['cattail'] = frames(4, 17, 29, cattail, '#2f5a2c')
    def bamboo_s(im, d, i):
        for x, hh in ((4, 36), (9, 44), (14, 30)):
            bamboo(d, x, 45, hh, '#6ab058', '#3f8040', '#a6e070')
    props['bamboo'] = frames(1, 26, 46, bamboo_s, '#2a5a2a')
    def frogstatue(im, d, i):
        box(d, 2, 16, 18, 20, '#8a8aa0')
        d.ellipse([3, 6, 17, 17], fill=C('#5aa070'))
        disc(d, 6, 6, 3, '#5aa070')
        disc(d, 14, 6, 3, '#5aa070')
        d.point([(6, 5), (14, 5)], fill=C('#1a1428'))
        d.arc([6, 9, 14, 13], 20, 160, fill=C('#2f5a3a'))
        box(d, 4, 12, 16, 13, '#c4363e')  # a dojo belt
        if i:
            d.line([(17, 10), (20, 7)], fill=C('#ff9ac8'))  # tongue flick
    props['frog'] = frames(2, 21, 21, frogstatue, '#2a3a4a')
    def lantern(im, d, i):
        d.line([(6, 8), (6, 30)], fill=C('#8a6a3a'), width=2)
        box(d, 2, 2, 10, 10, '#f4e0a0' if i else '#f8e8b8', '#8a4f22')
        d.line([(2, 6), (10, 6)], fill=C('#c4501f'))
        d.polygon([(0, 2), (6, -2), (12, 2)], fill=C('#3a8a5a'))
        box(d, 4, 28, 8, 30, '#6a6a80')
    props['lantern'] = frames(2, 13, 31, lantern, '#2a2a3a')
    def lily(im, d, i):
        lilypad(d, 9, 9, 8)
        o = i % 2
        disc(d, 9, 5 - o, 3, '#ff9ac8')
        d.point([(9, 4 - o)], fill=C('#fff6c8'))
    props['lily'] = frames(2, 19, 12, lily, '#2f5a3a')
    return {'ground': g, 'lip': lip, 'ceil': ceil, 'pit': (strip(pits), 4), **props}


def z3_slab():
    im, d = canvas(27, 14)  # a bamboo raft with a lily pad on it
    for k, y in enumerate((2, 5, 8)):
        box(d, 0, y, 26, y + 2, ('#8ac060', '#6ab058', '#5aa04a')[k])
        d.line([(0, y), (26, y)], fill=C('#b8e080'))
    for x in (4, 13, 22):
        d.line([(x, 2), (x, 10)], fill=C('#8a5a3a'))
    d.line([(0, 11), (26, 11)], fill=C('#2f9a9a'))
    return outline(im, '#2a4a3a').crop((0, 0, 27, 14))


# ======================================================================== 4 NIGHT BAZAAR
def stall(d, x, base, w, h, a, b):
    box(d, x - w // 2 + 2, base - h, x + w // 2 - 2, base, '#5a3a5a')
    box(d, x - w // 2 + 4, base - h + 10, x + w // 2 - 4, base - 6, '#3a2442')
    for k, xx in enumerate(range(x - w // 2, x + w // 2, 6)):
        d.rectangle([xx, base - h - 8, xx + 5, base - h + 2], fill=C(a if k % 2 else b))
        d.pieslice([xx, base - h, xx + 5, base - h + 6], 0, 180, fill=C(a if k % 2 else b))
    box(d, x - w // 2 + 4, base - 9, x + w // 2 - 4, base - 6, '#8a4f22')


def z4_layers():
    s, d = layer()
    sky(s, [(0, '#120c2e'), (80, '#2a1a5a'), (150, '#5a2a7a'), (200, '#8a3a7a')])
    r = random.Random(41)
    dots(s, r, 120, ['#c3c4d6', '#f4f1e8', '#ffc15a'], 0, 140)
    disc(d, 390, 50, 18, '#fff2c8')
    disc(d, 384, 46, 4, '#f0e0b0')
    disc(d, 396, 56, 3, '#f0e0b0')
    far, d = layer()
    # the city roofs: towers, domes and chimneys with lit windows
    r = random.Random(42)
    x = 0
    while x < W:
        w_ = r.randrange(18, 40)
        h_ = r.randrange(40, 90)
        col = r.choice(['#2a1e4a', '#30224f', '#261a44'])
        box(d, x, 196 - h_, x + w_, H - 1, col)
        if r.random() < 0.3:
            d.pieslice([x, 196 - h_ - w_ // 2, x + w_, 196 - h_ + w_ // 2], 180, 360, fill=C(col))
            d.line([(x + w_ // 2, 196 - h_ - w_ // 2), (x + w_ // 2, 196 - h_ - w_ // 2 - 6)], fill=C(col))
        for wy in range(196 - h_ + 6, 190, 9):
            for wx in range(x + 3, x + w_ - 3, 7):
                if r.random() < 0.35:
                    box(d, wx, wy, wx + 2, wy + 3, r.choice(['#ffc15a', '#f08a2c', '#f8e08e']))
        x += w_ + r.randrange(0, 6)
    mid, d = layer()
    for x, a, b in ((60, '#c4363e', '#f4f1e8'), (180, '#2f5fbf', '#ffc15a'), (300, '#3bb8a8', '#f4f1e8'), (420, '#7a4bc2', '#ff6fb5')):
        wrap(lambda xx: stall(d, xx, 196, 64, 44, a, b), x)
    # strings of lights between the stalls (they twinkle in game)
    for x in range(0, W, 120):
        for k in range(0, 120, 2):
            y = 142 + round(16 * math.sin(math.pi * k / 120))
            wrap(lambda xx: d.point([(xx, y)], fill=C('#5a3a5a')), x + k)
    box(d, 0, 196, W - 1, H - 1, '#2a1e3a')
    near, d = layer()
    n = wave(43, [2])
    box(d, 0, 202, W - 1, H - 1, '#3a2a48')
    for x in range(0, W, 12):
        d.line([(x, 202), (x + 10, 202)], fill=C('#5a4a6a'))
    for x in (40, 160, 290, 440):  # crates and barrels stacked by the road
        wrap(lambda xx: (box(d, xx, 186, xx + 16, 202, '#8a5a3a', '#4a2a2a'), d.line([(xx, 186), (xx + 16, 202)], fill=C('#5d3a2a')),
                         d.ellipse([xx + 18, 188, xx + 30, 202], fill=C('#7a4a3a'), outline=C('#4a2a2a')),
                         d.line([(xx + 18, 194), (xx + 30, 194)], fill=C('#c8a060'))), x)
    return [s, far, mid, near]


def z4_sprites():
    def ground(big, d, s):
        box(d, 0, s, 3 * s, 2 * s, '#3a2e4a')
        for row in range(8):
            off = (row % 2) * 8
            for x in range(-16 + off, 3 * s, 16):
                d.rounded_rectangle([x + 1, s + row * 8 + 1, x + 14, s + row * 8 + 7], 2, fill=C(('#4a3e5e', '#463a58', '#50446a')[(x // 16 + row) % 3]))
    g = tile2d(TILE, ground)
    lip, d = canvas(64, 10)
    box(d, 0, 3, 63, 7, '#6a5a7e')
    d.line([(0, 3), (63, 3)], fill=C('#8a7a9e'))
    for x in range(0, 64, 8):
        d.line([(x, 4), (x, 7)], fill=C('#4a3e5e'))
    d.line([(0, 8), (63, 8)], fill=C('#2a1e3a'))
    ceil, d = canvas(64, 12)  # awnings hang off the rooftops
    for k, x in enumerate(range(0, 64, 8)):
        box(d, x, 0, x + 7, 5, '#c4363e' if k % 2 else '#f4f1e8')
        d.pieslice([x, 2, x + 7, 9], 0, 180, fill=C('#c4363e' if k % 2 else '#f4f1e8'))
    pit, d = canvas(32, 10)  # a dark gutter with a glint of water
    box(d, 0, 2, 31, 9, '#120c2e')
    d.line([(4, 3), (9, 3)], fill=C('#5a3a7a'))
    d.line([(20, 4), (23, 4)], fill=C('#5a3a7a'))
    props = {}
    def lamp(im, d, i):
        d.line([(7, 10), (7, 40)], fill=C('#3a2e4a'), width=2)
        box(d, 4, 38, 10, 40, '#3a2e4a')
        d.line([(7, 10), (12, 7)], fill=C('#3a2e4a'))
        glow = ('#ffd84a', '#ffc15a', '#ffe88a')[i]
        d.ellipse([9, 6, 17, 16], fill=C('#e0402a'))
        d.ellipse([10, 8, 16, 14], fill=C(glow))
        d.line([(9, 11), (17, 11)], fill=C('#c4363e'))
        d.line([(13, 16), (13, 19)], fill=C('#ffc15a'))
    props['lamp'] = frames(3, 19, 41, lamp)
    def eyes(im, d, i):
        # a pair of cat eyes peeking out of the dark: open, half, shut (blink), open
        o = (2, 1, 0, 2)[i]
        for x in (1, 7):
            if o == 2:
                box(d, x, 1, x + 2, 3, '#ffe86a')
                d.point([(x + 1, 2)], fill=C('#1a1428'))
            elif o == 1:
                d.line([(x, 2), (x + 2, 2)], fill=C('#ffe86a'))
    props['eyes'] = (strip([(lambda i: (lambda im_d: (eyes(*im_d, i), im_d[0])[1])(canvas(11, 5)))(i) for i in range(4)]), 4)
    def crate(im, d, i):
        box(d, 0, 8, 15, 23, '#8a5a3a', '#4a2a2a')
        d.line([(0, 8), (15, 23)], fill=C('#5d3a2a'))
        box(d, 2, 0, 13, 8, '#c4a060', '#6a4a2a')
        for k, col in enumerate(('#f06a52', '#ffc15a', '#7cc254')):
            disc(d, 4 + k * 4, 1, 2, col)  # a crate of fruit
    props['crate'] = frames(1, 16, 24, crate)
    def fish(im, d, i):
        d.line([(2, 0), (2, 24)], fill=C('#5d3a2a'))
        d.line([(16, 0), (16, 24)], fill=C('#5d3a2a'))
        d.line([(2, 2), (16, 2)], fill=C('#8a6a4a'))
        sw = (0, 1, 0, -1)[i]
        for k, x in enumerate((5, 9, 13)):
            d.line([(x, 2), (x + sw * (k % 2), 6)], fill=C('#8a6a4a'))
            d.ellipse([x - 2 + sw * (k % 2), 6, x + 2 + sw * (k % 2), 13], fill=C(('#a8b0c8', '#c3c4d6', '#a8b0c8')[k]))
            d.polygon([(x - 2 + sw * (k % 2), 15), (x + 2 + sw * (k % 2), 15), (x + sw * (k % 2), 12)], fill=C('#8a89a6'))
    props['fish'] = frames(4, 19, 25, fish)
    def pot(im, d, i):
        d.ellipse([1, 8, 17, 20], fill=C('#5a4a6a'))
        box(d, 3, 6, 15, 9, '#7a6a8a')
        for k in range(3):  # steam
            y = 4 - ((i + k) % 3) * 2
            d.point([(5 + k * 4, y), (6 + k * 4, y - 1)], fill=C('#c3c4d6'))
        box(d, 4, 20, 14, 22, '#3a2e4a')
        d.point([(8, 22), (10, 22)], fill=C('#f08a2c'))
    props['pot'] = frames(3, 19, 23, pot)
    return {'ground': g, 'lip': lip, 'ceil': ceil, 'pit': pit, **props}


def z4_slab():
    im, d = canvas(27, 14)  # a striped awning with a scalloped hem
    for k, x in enumerate(range(0, 27, 5)):
        box(d, x, 0, x + 4, 7, '#c4363e' if k % 2 else '#f4e8d8')
        d.pieslice([x, 4, x + 4, 11], 0, 180, fill=C('#c4363e' if k % 2 else '#f4e8d8'))
    d.line([(0, 0), (26, 0)], fill=C('#8a4f22'))
    d.line([(0, 1), (26, 1)], fill=C('#5d2f14'))
    return outline(im, '#2a1e3a').crop((0, 0, 27, 14))


# ======================================================================== 5 SAKURA SHRINE
def blossom(d, x, base, h, r, trunk='#6a3a3a', cols=('#ffb0d0', '#ff8ab8', '#ffd0e4')):
    d.line([(x, base), (x - 2, base - h)], fill=C(trunk), width=3)
    d.line([(x - 2, base - h + 6), (x + r // 2, base - h - 2)], fill=C(trunk), width=2)
    d.line([(x - 2, base - h + 10), (x - r // 2, base - h + 2)], fill=C(trunk), width=2)
    rr = random.Random(x * 13 + h)
    for _ in range(14):
        disc(d, x - 2 + rr.randrange(-r, r), base - h + rr.randrange(-r // 2, r // 3), rr.randrange(r // 3, r // 2 + 2), rr.choice(cols))


def torii(d, x, base, w, h, col='#d8302a', dark='#8a1a1a'):
    d.line([(x - w // 3, base), (x - w // 3, base - h)], fill=C(col), width=3)
    d.line([(x + w // 3, base), (x + w // 3, base - h)], fill=C(col), width=3)
    box(d, x - w // 2, base - h - 5, x + w // 2, base - h - 2, dark)
    d.polygon([(x - w // 2 - 3, base - h - 6), (x + w // 2 + 3, base - h - 6), (x + w // 2, base - h - 3), (x - w // 2, base - h - 3)], fill=C(dark))
    box(d, x - w // 2 + 3, base - h + 4, x + w // 2 - 3, base - h + 6, col)
    box(d, x - 2, base - h - 2, x + 2, base - h + 4, col)


def z5_layers():
    s, d = layer()
    sky(s, [(0, '#8ab8f0'), (70, '#c8c8f0'), (130, '#ffd0d8'), (190, '#ffe8d8')])
    disc(d, 110, 70, 16, '#fff0e8')
    far, d = layer()
    # a snowy cone mountain over misty ridges
    d.polygon([(300, 70), (200, 175), (400, 175)], fill=C('#9aa0d0'))
    d.polygon([(300, 70), (282, 90), (290, 96), (300, 88), (310, 98), (318, 90)], fill=C('#f4f1f8'))
    f = wave(51, [8, 5])
    profile(far, lambda x: 166 + f(x), '#b0a8d8', edge='#d0c8ec')
    mid, d = layer()
    g = wave(52, [5, 3])
    profile(mid, lambda x: 182 + g(x), '#c890b8', edge='#e8b8d0')
    # a pagoda and blossoms on the mid hills
    def pagoda(x):
        y = round(182 + g(x % W))
        for k in range(4):
            w_ = 30 - k * 6
            box(d, x - w_ // 2 + 3, y - 14 - k * 14, x + w_ // 2 - 3, y - k * 14, '#f4e8e0', '#8a5a6a')
            d.polygon([(x - w_ // 2 - 4, y - 14 - k * 14), (x + w_ // 2 + 4, y - 14 - k * 14), (x + w_ // 2, y - 19 - k * 14), (x - w_ // 2, y - 19 - k * 14)], fill=C('#5a3a5a'))
        d.line([(x, y - 70), (x, y - 80)], fill=C('#ffc15a'))
    wrap(pagoda, 380)
    for x in (40, 120, 200, 290, 450):
        wrap(lambda xx: blossom(d, xx, round(184 + g(x)), 20, 12, '#7a4a5a', ('#f0a0c8', '#e890b8', '#f8c0d8')), x)
    near, d = layer()
    n = wave(53, [4, 2])
    profile(near, lambda x: 198 + n(x), '#7cb860', edge='#b7e27a', edge2='#9ad070')
    for x in (20, 250):
        wrap(lambda xx: torii(d, xx, round(200 + n(x)), 56, 46), x)
    for x in (110, 180, 330, 420):
        wrap(lambda xx: blossom(d, xx, round(200 + n(x)), 34, 18), x)
    # stone path steps
    for x in range(0, W, 14):
        y = round(201 + n(x))
        d.ellipse([x, y - 1, x + 9, y + 2], fill=C('#c8c0b8'))
    return [s, far, mid, near]


def z5_sprites():
    def ground(big, d, s):
        strata(d, s, 13, ['#8a6a5a', '#82614f', '#8a6a5a', '#7a5a4c'], 16, 3)
        stones(d, s, 14, ('#b0a0a8', '#d0c4cc', '#5a4a4a'), 4, 3, 7, 0.55)
        r = random.Random(13)
        for _ in range(12):  # fallen petals worked into the earth
            x, y = r.randrange(s, 2 * s), r.randrange(s, 2 * s)
            d.point([(x, y)], fill=C('#e890b8'))
    g = tile2d(TILE, ground)
    lip = lip_from(['#b7e27a', '#9ad070', '#7cb860', '#7cb860', '#5a9a4a'], seed=5, tufts=('#7cb860', '#b7e27a'),
                   flowers=(['#ffb0d0', '#ff8ab8', '#ffffff'], 9), hang=('#5a9a4a', 2))
    ceil, d = canvas(64, 12)  # temple eaves
    box(d, 0, 0, 63, 4, '#5a3a5a')
    for x in range(0, 64, 4):
        box(d, x, 4, x + 2, 7, '#7a5a7a')
    d.line([(0, 0), (63, 0)], fill=C('#8a6a8a'))
    pits = []
    for i in range(4):  # a koi pond
        p, d = canvas(32, 6)
        box(d, 0, 1, 31, 5, '#4a8ac8')
        for x in range(32):
            if (x + i * 2) % 10 < 3:
                d.point([(x, 1)], fill=C('#a8dcfd'))
        kx = (i * 6) % 32
        d.line([(kx, 3), (kx + 3, 3)], fill=C('#f08a2c'))
        d.point([(kx + 1, 3)], fill=C('#ffffff'))
        pits.append(p)
    props = {}
    def tourou(im, d, i):  # stone lantern
        box(d, 4, 26, 14, 28, '#8a8aa0')
        box(d, 7, 16, 11, 26, '#a8a8b8')
        box(d, 3, 14, 15, 16, '#8a8aa0')
        box(d, 5, 8, 13, 14, '#a8a8b8')
        box(d, 7, 9, 11, 13, ('#ffd84a', '#ffc15a')[i])
        d.polygon([(1, 8), (9, 2), (17, 8)], fill=C('#8a8aa0'))
        disc(d, 9, 2, 1, '#8a8aa0')
    props['tourou'] = frames(2, 19, 29, tourou)
    def mini_torii(im, d, i):
        torii(d, 13, 33, 26, 26)
    props['torii'] = frames(1, 30, 34, mini_torii)
    def sapling(im, d, i):
        blossom(d, 12, 30, 18, 9)
        if i:
            d.point([(4, 26), (20, 22)], fill=C('#ffb0d0'))
    props['sapling'] = frames(2, 26, 31, sapling, '#6a3a4a')
    def kitsune(im, d, i):
        box(d, 2, 20, 16, 23, '#8a8aa0')
        d.ellipse([4, 9, 14, 21], fill=C('#f4f1e8'))
        d.polygon([(5, 10), (6, 3), (9, 9)], fill=C('#f4f1e8'))
        d.polygon([(13, 10), (12, 3), (9, 9)], fill=C('#f4f1e8'))
        d.polygon([(6, 13), (12, 13), (9, 19)], fill=C('#c4363e'))  # a red bib
        d.point([(7, 11), (11, 11)], fill=C('#c4363e'))
        d.ellipse([12, 13, 19, 20], fill=C('#f4f1e8'))  # the tail curls round
        if i:
            d.point([(9, 6)], fill=C('#ffd84a'))  # a spirit spark
    props['kitsune'] = frames(2, 20, 24, kitsune)
    def fountain(im, d, i):  # a shishi-odoshi: the bamboo tips, empties and knocks
        box(d, 2, 22, 22, 25, '#8a8aa0')
        d.ellipse([3, 18, 21, 25], fill=C('#4a8ac8'))
        d.line([(12, 22), (12, 10)], fill=C('#6a4a3a'), width=2)
        ang = (0.5, 0.25, 0.0, -0.45)[i]
        x0, y0 = 12 - 9 * math.cos(ang), 10 + 9 * math.sin(ang)
        x1, y1 = 12 + 9 * math.cos(ang), 10 - 9 * math.sin(ang)
        d.line([(x0, y0), (x1, y1)], fill=C('#8ac060'), width=3)
        if i == 3:
            d.point([(x0 - 1, y0 + 2), (x0, y0 + 4)], fill=C('#a8dcfd'))
    props['fountain'] = frames(4, 24, 26, fountain)
    return {'ground': g, 'lip': lip, 'ceil': ceil, 'pit': (strip(pits), 4), **props}


def z5_slab():
    im, d = canvas(27, 15)  # a red lacquer bridge with a railing
    box(d, 0, 6, 26, 10, '#d8302a')
    d.line([(0, 6), (26, 6)], fill=C('#f06a52'))
    d.line([(0, 0), (26, 0)], fill=C('#d8302a'))
    for x in (0, 9, 18):
        d.line([(x + 1, 0), (x + 1, 6)], fill=C('#d8302a'))
        d.point([(x + 1, 0)], fill=C('#ffc15a'))
    d.line([(0, 11), (26, 11)], fill=C('#8a1a1a'))
    return outline(im, '#3a1a2a').crop((0, 0, 27, 15))


ZONES = {
    'graveyard': lambda: {'layers': z1_layers(), 'sprites': z1_sprites(), 'slab': z1_slab()},
    'ranger-forest': lambda: {'layers': z2_layers(), 'sprites': z2_sprites(), 'slab': z2_slab()},
    'turtle-lagoon': lambda: {'layers': z3_layers(), 'sprites': z3_sprites(), 'slab': z3_slab()},
    'thieves-bazaar': lambda: {'layers': z4_layers(), 'sprites': z4_sprites(), 'slab': z4_slab()},
    'sakura-shrine': lambda: {'layers': z5_layers(), 'sprites': z5_sprites(), 'slab': z5_slab()},
}
