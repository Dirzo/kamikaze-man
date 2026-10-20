"""Backdrops and platforms for the weapon-themed zones.

Every zone is the home turf of one weapon, the way the Sword Graveyard belongs to the training
sword: a ranger's mushroom forest (bow), a turtle lagoon (nunchucks), a thieves' bazaar (dagger),
a sakura shrine (katana), a mountain monastery (staff) and a ninja castle (shuriken).
Clean and cute: soft banded gradients, rounded shapes, a dark outline only where it helps.

Each bg is 480x270: sky and scenery above GROUND (the game stretches rows 0..GROUND over the
screen) and a ground texture below it (rows GROUND+8.. tile the terrain blocks).
  python3 art-src/weapon_zones.py   writes bg-/slab- PNGs into public/assets/px and the manifest.
"""
import json
import math
import os
import random
from PIL import Image, ImageDraw

W, H, GROUND = 480, 270, 206


def hexc(h, a=255):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (a,)


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)


def gradient(img, y0, y1, top, bottom, steps=7):
    """Banded sky: a few flat steps with a one-row checker between them (clean pixel look)."""
    d = ImageDraw.Draw(img)
    a, b = hexc(top), hexc(bottom)
    band = (y1 - y0) / steps
    for i in range(steps):
        col = mix(a, b, i / max(1, steps - 1))
        ya, yb = round(y0 + i * band), round(y0 + (i + 1) * band)
        d.rectangle([0, ya, W - 1, yb], fill=col)
        if i:
            prev = mix(a, b, (i - 1) / max(1, steps - 1))
            for x in range(i % 2, W, 2):
                img.putpixel((x, ya), prev)


def hills(img, base, amp, col, seed, step=24, top=None):
    r = random.Random(seed)
    pts, x = [(0, H)], 0
    while x <= W + step:
        pts.append((x, base - r.randint(0, amp)))
        x += step
    pts.append((W, H))
    d = ImageDraw.Draw(img)
    # smooth with a cosine between the control points
    out = [(0, H)]
    for (x0, y0), (x1, y1) in zip(pts[1:-2], pts[2:-1]):
        for t in range(0, step):
            k = (1 - math.cos(math.pi * t / step)) / 2
            out.append((x0 + t, y0 + (y1 - y0) * k))
    out.append((W, H))
    d.polygon(out, fill=hexc(col))
    if top:
        for x, y in out[1:-1]:
            img.putpixel((int(x) % W, int(y)), hexc(top))


def ground(img, top_rows, body, specks, seed, pattern=None):
    """Ground band from GROUND-2 down: a few top rows, then a textured body."""
    r = random.Random(seed)
    d = ImageDraw.Draw(img)
    d.rectangle([0, GROUND - 2, W - 1, H - 1], fill=hexc(body))
    for i, col in enumerate(top_rows):
        d.rectangle([0, GROUND - 2 + i, W - 1, GROUND - 2 + i], fill=hexc(col))
    if pattern:
        pattern(img, d, r)
    for col, n in specks:
        for _ in range(n):
            x, y = r.randrange(W), r.randrange(GROUND + len(top_rows), H)
            img.putpixel((x, y), hexc(col))


def disc(d, x, y, rad, col, outline=None):
    d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=hexc(col), outline=hexc(outline) if outline else None)


def slab(w, rows, under, seam=None, seam_every=9, deco=None, h=11, outline='#2a2238'):
    """Floating one-way platform: coloured top rows, body, underside, dark outline."""
    p = Image.new('RGBA', (w, h + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(p)
    for y in range(h):
        col = rows[y] if y < len(rows) else under if y >= h - 2 else rows[-1]
        d.line([(0, y), (w - 1, y)], fill=hexc(col))
    if seam:
        for x in range(0, w, seam_every):
            d.line([(x, len(rows) // 2 + 1), (x, h - 3)], fill=hexc(seam))
    if deco:
        deco(p, d)
    # outline
    px = p.load()
    o = hexc(outline)
    edge = [(x, y) for y in range(h + 4) for x in range(w) if px[x, y][3] and any(
        not (0 <= x + dx < w and 0 <= y + dy < h + 4) or not px[x + dx, y + dy][3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    for x, y in edge:
        px[x, y] = o
    return p


# ---- 2 Ranger's Mushroom Forest (bow): the mushroom backdrop plus archery range props ----------
def target(d, x, y, r=9):
    for i, col in enumerate(('#f4f1e8', '#e0405a', '#f4f1e8', '#e0405a', '#ffd84a')):
        rr = r - i * 2
        if rr > 0:
            disc(d, x, y, rr, col, '#5d2f14' if i == 0 else None)
    d.line([(x - 3, y + r), (x - 6, GROUND - 2)], fill=hexc('#8a4f22'), width=2)
    d.line([(x + 3, y + r), (x + 6, GROUND - 2)], fill=hexc('#8a4f22'), width=2)


def arrow(d, x, y, ang):
    dx, dy = math.cos(ang) * 10, math.sin(ang) * 10
    d.line([(x, y), (x - dx, y - dy)], fill=hexc('#8a4f22'))
    d.point([(x - dx, y - dy), (x - dx * 0.9 + 1, y - dy * 0.9)], fill=hexc('#f4f1e8'))


def ranger_bg(base):
    img = base.copy()
    d = ImageDraw.Draw(img)
    for x in (70, 300, 420):
        target(d, x, GROUND - 28)
        arrow(d, x + 2, GROUND - 28, -0.3)
    # a ranger's banner: green cloth with a bow on it
    d.rectangle([186, 132, 210, 168], fill=hexc('#3f8a3a'), outline=hexc('#21401f'))
    d.line([(184, 130), (212, 130)], fill=hexc('#8a4f22'), width=2)
    d.arc([191, 138, 205, 162], 270, 90, fill=hexc('#ffd84a'), width=2)
    d.line([(198, 138), (198, 162)], fill=hexc('#f4f1e8'))
    d.line([(198, 168), (198, GROUND - 2)], fill=hexc('#8a4f22'), width=2)
    return img


def ranger_slab(w):
    def leaves(p, d):
        for x in range(2, w, 6):
            d.point([(x, 0), (x + 1, 0)], fill=hexc('#9be06a'))
    return slab(w, ['#7cc254', '#5aa040', '#a8743a', '#a8743a', '#8a5a2c'], '#6a4220', seam='#6a4220', deco=leaves)


# ---- 3 Turtle Lagoon (nunchucks) ----------------------------------------------------------------
def shell(d, x, y, rx, ry):
    d.chord([x - rx, y - ry, x + rx, y + ry], 180, 360, fill=hexc('#4f9a3a'), outline=hexc('#244a1c'))
    for i in range(-2, 3):
        cx = x + i * rx // 3
        d.polygon([(cx - rx // 7, y - ry // 3), (cx, y - ry * 2 // 3), (cx + rx // 7, y - ry // 3), (cx, y - 1)], outline=hexc('#7cc254'))
    d.rectangle([x - rx, y - 2, x + rx, y], fill=hexc('#e8d48a'))


def palm(d, x, base, h, lean):
    for i in range(h):
        t = i / h
        d.ellipse([x + lean * t * t - 3, base - i - 2, x + lean * t * t + 3, base - i + 2], fill=hexc('#a8743a' if i % 6 < 4 else '#8a5a2c'))
    tx, ty = x + lean, base - h
    for a in (-2.6, -2.0, -1.2, -0.5, 0.2):
        for k in range(18):
            px_, py_ = tx + math.cos(a) * k * 1.4, ty + math.sin(a) * k * 0.9 + (k * k) / 40
            d.ellipse([px_ - 2, py_ - 1, px_ + 2, py_ + 2], fill=hexc('#3fae5a' if k % 3 else '#2f8a48'))
    disc(d, tx - 2, ty + 2, 2, '#8a5a2c'); disc(d, tx + 3, ty + 3, 2, '#8a5a2c')


def lagoon_bg():
    img = Image.new('RGBA', (W, H))
    gradient(img, 0, 150, '#7fd6ff', '#d8f6ff', 6)
    d = ImageDraw.Draw(img)
    disc(d, 380, 46, 18, '#fff4b0'); disc(d, 380, 46, 14, '#ffe680')
    for cx, cy in ((80, 40), (220, 26), (300, 60)):
        for dx in (-12, 0, 12):
            disc(d, cx + dx, cy, 8 + (dx == 0) * 3, '#ffffff')
    gradient(img, 150, GROUND - 6, '#3fc4d0', '#2a8ab8', 4)
    for y in range(156, GROUND - 6, 7):
        for x in range((y * 7) % 23, W, 23):
            d.line([(x, y), (x + 6, y)], fill=hexc('#9be8f0'))
    hills(img, 162, 14, '#5aa86a', 33, step=40, top='#7cc254')
    # dojo hut with a nunchucks sign
    d.rectangle([250, 120, 310, GROUND - 6], fill=hexc('#e8c88a'), outline=hexc('#5d2f14'))
    d.polygon([(240, 122), (280, 98), (320, 122)], fill=hexc('#c0503a'), outline=hexc('#5d2f14'))
    d.rectangle([272, 150, 288, GROUND - 6], fill=hexc('#5d2f14'))
    d.rectangle([266, 126, 294, 142], fill=hexc('#f4f1e8'), outline=hexc('#5d2f14'))
    for sx in (273, 285):
        d.rectangle([sx - 2, 129, sx + 2, 139], fill=hexc('#ff9a2e'))
    d.line([(275, 131), (283, 131)], fill=hexc('#5d5a7a'))
    palm(d, 60, GROUND - 4, 70, 14)
    palm(d, 430, GROUND - 4, 60, -12)
    for x, rx in ((150, 26), (370, 20), (200, 14)):
        shell(d, x, GROUND - 4, rx, rx * 2 // 3)

    def pattern(img, d, r):
        for y in range(GROUND + 10, H, 12):
            for x in range((y // 12) % 2 * 10, W, 20):
                d.arc([x, y, x + 12, y + 6], 180, 360, fill=hexc('#c9a66b'))
    ground(img, ['#fff1c0', '#f4dc98', '#e8c88a'], '#dcb878', [('#c9a66b', 300), ('#fff1c0', 80)], 5, pattern)
    return img


def lagoon_slab(w):
    def knots(p, d):
        for x in range(4, w, 9):
            d.point([(x, 3), (x, 6)], fill=hexc('#5aa040'))
    return slab(w, ['#9be06a', '#7cc254', '#7cc254', '#5aa040', '#5aa040'], '#3e7a30', seam='#3e7a30', deco=knots)  # bamboo raft


# ---- 4 Thieves' Bazaar (dagger) -----------------------------------------------------------------
def tent(d, x, w, h, a, b):
    top = GROUND - 4 - h
    for i in range(0, w, 8):
        d.rectangle([x + i, top + 8, x + i + 7, GROUND - 6], fill=hexc(a if (i // 8) % 2 == 0 else b))
    d.polygon([(x - 4, top + 10), (x + w // 2, top - 6), (x + w + 4, top + 10)], fill=hexc(a), outline=hexc('#2a2238'))
    d.rectangle([x + w // 2 - 7, top + 22, x + w // 2 + 7, GROUND - 6], fill=hexc('#2a2238'))
    d.rectangle([x - 2, GROUND - 14, x + w + 2, GROUND - 6], fill=hexc('#8a5a2c'), outline=hexc('#2a2238'))


def lantern_string(d, x0, x1, y, sag, cols):
    pts = [(x, y + sag * math.sin(math.pi * (x - x0) / (x1 - x0))) for x in range(x0, x1 + 1, 2)]
    d.line(pts, fill=hexc('#3a2a4c'))
    for i, (x, yy) in enumerate(pts[3::8]):
        col = cols[i % len(cols)]
        disc(d, x, yy + 4, 3, col)
        d.point([(x - 1, yy + 3)], fill=hexc('#fff4b0'))


def bazaar_bg():
    img = Image.new('RGBA', (W, H))
    gradient(img, 0, GROUND, '#2a1f5c', '#8a4a8a', 7)
    d = ImageDraw.Draw(img)
    r = random.Random(9)
    for _ in range(70):
        x, y = r.randrange(W), r.randrange(0, 110)
        d.point([(x, y)], fill=hexc('#fff4d0' if r.random() < 0.7 else '#9ad0ff'))
    d.chord([40, 18, 72, 50], 0, 360, fill=hexc('#fff1c0'))
    d.chord([48, 14, 80, 46], 0, 360, fill=hexc('#2f2468'))  # crescent
    # rooftops skyline
    x = 0
    while x < W:
        w = r.randint(30, 60)
        h = r.randint(50, 100)
        d.rectangle([x, GROUND - h, x + w, GROUND], fill=hexc('#3a2a6c'))
        if r.random() < 0.5:
            d.ellipse([x + w // 2 - 10, GROUND - h - 14, x + w // 2 + 10, GROUND - h + 6], fill=hexc('#3a2a6c'))
            d.line([(x + w // 2, GROUND - h - 22), (x + w // 2, GROUND - h - 14)], fill=hexc('#3a2a6c'))
        for wy in range(GROUND - h + 10, GROUND - 30, 14):
            for wx in range(x + 6, x + w - 6, 12):
                if r.random() < 0.55:
                    d.rectangle([wx, wy, wx + 4, wy + 5], fill=hexc('#ffc96a'))
        x += w + r.randint(2, 8)
    tent(d, 40, 64, 60, '#e0405a', '#f4f1e8')
    tent(d, 190, 72, 70, '#3f6fe0', '#ffd84a')
    tent(d, 350, 64, 58, '#3fae5a', '#f4f1e8')
    # a dagger shop sign
    d.rectangle([292, 120, 318, 136], fill=hexc('#f4f1e8'), outline=hexc('#2a2238'))
    d.polygon([(296, 128), (310, 124), (316, 128), (310, 132)], fill=hexc('#c8d0e0'))
    d.rectangle([294, 125, 296, 131], fill=hexc('#ffc15a'))
    lantern_string(d, 0, 200, 70, 18, ['#ff6a3a', '#ffd84a', '#ff6fb5'])
    lantern_string(d, 180, W, 60, 22, ['#ffd84a', '#ff6a3a', '#7ad0ff'])
    for cx in (140, 175, 440):
        d.rectangle([cx, GROUND - 18, cx + 14, GROUND - 6], fill=hexc('#a8743a'), outline=hexc('#5d2f14'))
        d.line([(cx, GROUND - 12), (cx + 14, GROUND - 12)], fill=hexc('#5d2f14'))

    def pattern(img, d, r):
        for y in range(GROUND + 6, H, 8):
            off = (y // 8) % 2 * 8
            for x in range(-off, W, 16):
                d.rounded_rectangle([x + 1, y + 1, x + 14, y + 6], radius=2, fill=hexc('#6a5a7a'), outline=hexc('#3a2e4c'))
    ground(img, ['#c8b8d8', '#9a8ab0', '#7a6a90'], '#4a3e5c', [], 6, pattern)
    return img


def bazaar_slab(w):
    def stripes(p, d):
        for x in range(0, w, 6):
            d.rectangle([x, 0, x + 2, 2], fill=hexc('#f4f1e8'))
    return slab(w, ['#e0405a', '#e0405a', '#e0405a', '#a8743a', '#a8743a'], '#6a4220', seam='#6a4220', deco=stripes)  # awning crate


# ---- 5 Sakura Shrine (katana) -------------------------------------------------------------------
def blossom_tree(d, x, base, h, r):
    d.line([(x, base), (x - 4, base - h * 0.5), (x + 2, base - h)], fill=hexc('#6a3a3a'), width=5)
    d.line([(x - 3, base - h * 0.55), (x - 22, base - h * 0.8)], fill=hexc('#6a3a3a'), width=3)
    d.line([(x + 1, base - h * 0.7), (x + 22, base - h * 0.9)], fill=hexc('#6a3a3a'), width=3)
    for _ in range(26):
        cx, cy = x + r.randint(-34, 34), base - h + r.randint(-18, 16)
        rad = r.randint(6, 11)
        disc(d, cx, cy, rad, r.choice(['#ffb8d4', '#ff9ac4', '#ffd0e4']))
    for _ in range(18):
        d.point([(x + r.randint(-36, 36), base - h + r.randint(-18, 18))], fill=hexc('#ffffff'))


def torii(d, x, w, h):
    top = GROUND - 4 - h
    red, dark = hexc('#e0402a'), hexc('#2a2238')
    d.rectangle([x, top + 8, x + 5, GROUND - 4], fill=red, outline=dark)
    d.rectangle([x + w - 5, top + 8, x + w, GROUND - 4], fill=red, outline=dark)
    d.rectangle([x - 8, top, x + w + 8, top + 5], fill=hexc('#2a2238'))
    d.rectangle([x - 6, top + 5, x + w + 6, top + 8], fill=red)
    d.rectangle([x - 2, top + 16, x + w + 2, top + 19], fill=red, outline=dark)


def pagoda(d, x, base, tiers):
    y = base
    for i in range(tiers):
        w = 46 - i * 8
        d.rectangle([x - w // 2 + 6, y - 18, x + w // 2 - 6, y], fill=hexc('#f4e8d8'), outline=hexc('#2a2238'))
        d.polygon([(x - w // 2 - 4, y - 16), (x, y - 28), (x + w // 2 + 4, y - 16), (x + w // 2 - 2, y - 14), (x - w // 2 + 2, y - 14)], fill=hexc('#3a4a7a'), outline=hexc('#2a2238'))
        y -= 22
    d.line([(x, y - 6), (x, y - 16)], fill=hexc('#ffc15a'), width=2)


def sakura_bg():
    img = Image.new('RGBA', (W, H))
    gradient(img, 0, GROUND, '#ffd8c0', '#ffeef0', 6)
    d = ImageDraw.Draw(img)
    disc(d, 120, 60, 26, '#fff4e8'); disc(d, 120, 60, 22, '#ffe2d0')
    hills(img, 140, 30, '#b8c0e8', 51, step=60, top='#d0d8f4')
    hills(img, 170, 18, '#9ad08a', 52, step=50, top='#b8e8a0')
    r = random.Random(77)
    pagoda(d, 360, GROUND - 6, 4)
    torii(d, 190, 70, 64)
    blossom_tree(d, 50, GROUND - 4, 70, r)
    blossom_tree(d, 290, GROUND - 4, 62, r)
    blossom_tree(d, 450, GROUND - 4, 76, r)
    # a katana on a stand under the gate
    d.rectangle([214, GROUND - 16, 236, GROUND - 13], fill=hexc('#5d2f14'))
    d.line([(212, GROUND - 20), (240, GROUND - 24)], fill=hexc('#e8eef8'), width=2)
    d.line([(206, GROUND - 19), (213, GROUND - 20)], fill=hexc('#2a2238'), width=2)
    for _ in range(60):
        x, y = r.randrange(W), r.randrange(0, GROUND - 10)
        d.point([(x, y), (x + 1, y)], fill=hexc('#ff9ac4'))

    def pattern(img, d, r):
        for y in range(GROUND + 8, H, 10):
            for x in range((y // 10) % 2 * 7, W, 14):
                d.point([(x, y), (x + 1, y)], fill=hexc('#a8744a'))
    ground(img, ['#9ae07a', '#7cc254', '#5aa040', '#c08a5a'], '#b07a4a', [('#ff9ac4', 60), ('#8a5a3a', 200)], 8, pattern)
    return img


def sakura_slab(w):
    def petals(p, d):
        for x in range(3, w, 7):
            d.point([(x, 1)], fill=hexc('#ff9ac4'))
    return slab(w, ['#f4e8d8', '#e8d4b8', '#c0503a', '#c0503a', '#a03a2a'], '#7a2a1a', seam='#7a2a1a', deco=petals)  # shrine beam


# ---- 6 Mountain Monastery (staff) ----------------------------------------------------------------
def prayer_flags(d, x0, x1, y, sag):
    cols = ['#3f6fe0', '#f4f1e8', '#e0405a', '#3fae5a', '#ffd84a']
    pts = [(x, y + sag * math.sin(math.pi * (x - x0) / (x1 - x0))) for x in range(x0, x1 + 1, 2)]
    d.line(pts, fill=hexc('#5d5a7a'))
    for i, (x, yy) in enumerate(pts[2::5]):
        d.polygon([(x - 3, yy), (x + 3, yy), (x, yy + 7)], fill=hexc(cols[i % 5]))


def temple(d, x, base):
    d.rectangle([x - 34, base - 40, x + 34, base], fill=hexc('#f4e8d8'), outline=hexc('#2a2238'))
    for wx in (x - 22, x - 6, x + 10):
        d.rectangle([wx, base - 30, wx + 10, base - 14], fill=hexc('#c0503a'))
    for i, (w, y) in enumerate(((52, base - 40), (40, base - 58))):
        d.polygon([(x - w, y), (x, y - 16), (x + w, y), (x + w - 6, y + 4), (x - w + 6, y + 4)], fill=hexc('#ffc15a'), outline=hexc('#7a4a1a'))
        if i == 0:
            d.rectangle([x - 24, y - 18, x + 24, y], fill=hexc('#f4e8d8'), outline=hexc('#2a2238'))
    d.line([(x, base - 74), (x, base - 86)], fill=hexc('#ffc15a'), width=2)


def monastery_bg():
    img = Image.new('RGBA', (W, H))
    gradient(img, 0, GROUND, '#8ac8ff', '#e8f6ff', 6)
    d = ImageDraw.Draw(img)
    for cx, cy in ((90, 50), (330, 34)):
        for dx in (-14, 0, 14):
            disc(d, cx + dx, cy, 9 + (dx == 0) * 3, '#ffffff')
    r = random.Random(4)
    # snowy peaks
    for px_, h, w in ((70, 120, 110), (220, 150, 140), (400, 130, 120)):
        d.polygon([(px_ - w, GROUND), (px_, GROUND - h), (px_ + w, GROUND)], fill=hexc('#8a9ac8'))
        d.polygon([(px_ - w * 0.3, GROUND - h * 0.7), (px_, GROUND - h), (px_ + w * 0.3, GROUND - h * 0.7), (px_ + 8, GROUND - h * 0.62), (px_ - 6, GROUND - h * 0.66)], fill=hexc('#ffffff'))
    hills(img, 176, 14, '#c8d8f0', 61, step=50, top='#ffffff')
    temple(d, 300, GROUND - 22)
    d.rectangle([250, GROUND - 22, 350, GROUND - 6], fill=hexc('#9aa3b8'), outline=hexc('#5d5a7a'))  # stone terrace
    prayer_flags(d, 0, 230, 96, 20)
    prayer_flags(d, 340, W, 88, 16)
    # a rack of training staffs
    for i, sx in enumerate((110, 116, 122)):
        d.line([(sx, GROUND - 40), (sx + 2, GROUND - 6)], fill=hexc('#a8743a'), width=2)
        d.point([(sx, GROUND - 41)], fill=hexc('#ffc15a'))
    d.rectangle([104, GROUND - 22, 130, GROUND - 19], fill=hexc('#5d2f14'))
    for _ in range(50):
        x, y = r.randrange(W), r.randrange(0, GROUND - 10)
        d.point([(x, y)], fill=hexc('#ffffff'))

    def pattern(img, d, r):
        for y in range(GROUND + 6, H, 9):
            off = (y // 9) % 2 * 10
            for x in range(-off, W, 20):
                d.rounded_rectangle([x + 1, y + 1, x + 18, y + 7], radius=2, fill=hexc('#8a90a8'), outline=hexc('#5d5a7a'))
    ground(img, ['#ffffff', '#e8f0ff', '#c8d4ec'], '#6a708a', [], 10, pattern)
    return img


def monastery_slab(w):
    return slab(w, ['#ffffff', '#e8f0ff', '#b8c0d8', '#9aa3b8', '#9aa3b8'], '#6a708a', seam='#7a809a')  # snowy stone


# ---- 9 Ninja Castle (shuriken) -------------------------------------------------------------------
def castle(d, x, base):
    dark, roof, wall = hexc('#1c1838'), hexc('#2a2a5a'), hexc('#d8d4e8')
    d.polygon([(x - 70, base), (x - 58, base - 40), (x + 58, base - 40), (x + 70, base)], fill=hexc('#5a5a7a'))
    y = base - 40
    for i, w in enumerate((56, 44, 32, 22)):
        h = 18 - i * 2
        d.rectangle([x - w + 8, y - h, x + w - 8, y], fill=wall, outline=dark)
        for wx in range(x - w + 14, x + w - 14, 10):
            d.rectangle([wx, y - h + 5, wx + 3, y - h + 9], fill=hexc('#ffd84a'))
        d.polygon([(x - w - 4, y - h + 2), (x, y - h - 14), (x + w + 4, y - h + 2), (x + w - 4, y - h + 5), (x - w + 4, y - h + 5)], fill=roof, outline=dark)
        y -= h + 10
    d.polygon([(x - 6, y + 2), (x, y - 8), (x + 6, y + 2)], fill=hexc('#ffc15a'))


def bamboo(d, x, base, h, col='#2f6a4a', node='#1f4a34'):
    d.rectangle([x, base - h, x + 3, base], fill=hexc(col))
    for y in range(base - h + 6, base, 12):
        d.line([(x, y), (x + 3, y)], fill=hexc(node))
        d.polygon([(x + 3, y - 2), (x + 12, y - 6), (x + 4, y)], fill=hexc(col))


def shuriken(d, x, y, r=5, col='#c8d0e0'):
    for a in range(4):
        ang = a * math.pi / 2
        d.polygon([(x, y), (x + math.cos(ang) * r, y + math.sin(ang) * r), (x + math.cos(ang + 0.6) * r * 0.4, y + math.sin(ang + 0.6) * r * 0.4)], fill=hexc(col))
    d.point([(x, y)], fill=hexc('#2a2238'))


def ninja_bg():
    img = Image.new('RGBA', (W, H))
    gradient(img, 0, GROUND, '#151436', '#4a3a8a', 7)
    d = ImageDraw.Draw(img)
    r = random.Random(31)
    for _ in range(80):
        d.point([(r.randrange(W), r.randrange(0, 120))], fill=hexc('#e8e8ff'))
    disc(d, 300, 66, 34, '#fff4d8'); disc(d, 290, 58, 6, '#f0e2c0'); disc(d, 312, 76, 4, '#f0e2c0')
    hills(img, 168, 20, '#2a2a5a', 41, step=50)
    castle(d, 300, GROUND - 8)
    for x in range(0, W, 9):
        if not 220 < x < 380:
            bamboo(d, x + r.randint(0, 4), GROUND - 4, r.randint(90, 150))
    # a straw target full of shuriken
    disc(d, 120, GROUND - 26, 12, '#e8c88a', '#7a5a2c')
    disc(d, 120, GROUND - 26, 6, '#e0405a')
    for sx, sy in ((114, GROUND - 30), (125, GROUND - 22), (119, GROUND - 34)):
        shuriken(d, sx, sy, 4)
    d.line([(120, GROUND - 14), (120, GROUND - 4)], fill=hexc('#5d2f14'), width=2)

    def pattern(img, d, r):
        for y in range(GROUND + 6, H, 10):
            for x in range((y // 10) % 2 * 12, W, 24):
                d.rectangle([x + 1, y + 1, x + 22, y + 8], fill=hexc('#3a3a5a'), outline=hexc('#22223a'))
    ground(img, ['#6a6a9a', '#4a4a7a', '#3a3a5a'], '#2a2a44', [], 12, pattern)
    return img


def ninja_slab(w):
    def tiles(p, d):
        for x in range(0, w, 4):
            d.point([(x, 1)], fill=hexc('#6a6a9a'))
    return slab(w, ['#4a4a7a', '#3a3a6a', '#2a2a5a', '#d8d4e8', '#d8d4e8'], '#9a96b0', seam='#9a96b0', deco=tiles)  # tiled roof edge


ZONES = [
    # key, bg, slab
    ('ranger-forest', None, ranger_slab),   # bg = mushroom-hollow backdrop + archery props
    ('turtle-lagoon', lagoon_bg, lagoon_slab),
    ('thieves-bazaar', bazaar_bg, bazaar_slab),
    ('sakura-shrine', sakura_bg, sakura_slab),
    ('mountain-monastery', monastery_bg, monastery_slab),
    ('ninja-castle', ninja_bg, ninja_slab),
]


def build(out, man, mushroom_bg):
    for key, bg, sl in ZONES:
        im = ranger_bg(mushroom_bg) if bg is None else bg()
        im.save(os.path.join(out, f'bg-{key}.png'))
        man['backgrounds'][key] = f'bg-{key}.png'
        s = sl(25)
        s.save(os.path.join(out, f'slab-{key}.png'))
        man['slabs'][key] = {'file': f'slab-{key}.png', 'w': s.width, 'h': s.height, 'cap': 9}
        if key not in man['zones']:
            man['zones'].append(key)


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'px')
    path = os.path.join(root, 'manifest.json')
    man = json.load(open(path))
    build(root, man, Image.open(os.path.join(root, 'bg-mushroom-hollow.png')).convert('RGBA'))
    with open(path, 'w') as fh:
        json.dump(man, fh, separators=(',', ':'))
    print('wrote', len(ZONES), 'weapon zone backdrops')
