"""One backdrop + ground + platform slab per zone, all from the shared 32-colour palette.

Each zone entry returns:
  bg(): 480x270 RGBA image (sky/walls, scenery, ground from y=GROUND-2 down)
  slab(w): outlined floating-platform image (exported 27px wide and 3-sliced in game)

Zone order matches Z[] in game-src/core/00-setup-world.js.
"""
import math
import random
from PIL import Image, ImageDraw
from pixel import RGB, outlined
import scene
from scene import W, H, GROUND, c, rect, dither_band, poly, ridge

# ---- shared helpers -----------------------------------------------------------------


def bands(img, spec, y_end=GROUND):
    for i, (y0, col) in enumerate(spec):
        y1 = spec[i + 1][0] if i + 1 < len(spec) else y_end
        nxt = spec[i + 1][1] if i + 1 < len(spec) else col
        dither_band(img, y0, y1, col, nxt)


def stars(img, r, n, y1, cols=('mist', 'paper')):
    for _ in range(n):
        img.putpixel((r.randrange(W), r.randrange(0, y1)), c(r.choice(cols)))


def tile_row(img, make, r, y=GROUND - 2):
    for x in range(0, W, 16):
        img.alpha_composite(make(r), (x, y))


def fill_below(img, make, r, y0=GROUND + 16):
    for y in range(y0, H, 16):
        for x in range(0, W, 16):
            img.alpha_composite(make(r), (x, y))


def top_tile(r, rows, fill, specks=(), blades=None):
    """16x18 ground-top tile: optional 2px blades, then the given top rows, then fill + specks."""
    t = Image.new('RGBA', (16, 18), (0, 0, 0, 0))
    px = t.load()
    for y in range(2, 18):
        for x in range(16):
            px[x, y] = c(fill)
    for i, row in enumerate(rows):
        for x in range(16):
            px[x, 2 + i] = c(row[x % len(row)] if isinstance(row, (list, tuple)) else row)
    if blades:
        for x in (1, 6, 11, 14):
            px[x, 1] = c(blades)
            if x % 2:
                px[x, 0] = c(blades)
    for col, n in specks:
        for _ in range(n):
            px[r.randrange(16), r.randrange(2 + len(rows) + 1, 18)] = c(col)
    return t


def fill_tile(r, fill, specks=()):
    t = Image.new('RGBA', (16, 16), c(fill))
    px = t.load()
    for col, n in specks:
        for _ in range(n):
            px[r.randrange(16), r.randrange(16)] = c(col)
    return t


def slab(w, top, body, under, seam, deco=None, h=9):
    p = Image.new('RGBA', (w, h + 4), (0, 0, 0, 0))
    px = p.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = c(top[min(y, len(top) - 1)] if y < len(top) else (under if y >= h - 2 else body))
    for x in range(0, w, 9):
        for y in range(len(top), h - 2):
            px[x, y] = c(seam)
    if deco:
        deco(px, w, h)
    return outlined(p)


def flame(img, x, y, big=False):
    rows = ['..y..', '.yoy.', 'yoroy', '.rrr.'] if not big else ['...y...', '..yoy..', '.yooy.y', 'yoorooy', '.orrro.']
    for fy, row in enumerate(rows):
        for fx, ch in enumerate(row):
            if ch != '.':
                img.putpixel((x - len(row) // 2 + fx, y + fy), c({'y': 'gold', 'o': 'orange', 'r': 'red'}[ch]))


def light_dots(img, r, x, y, rad, col='cream', n=12):
    for _ in range(n):
        a, d = r.uniform(0, 6.28), r.randrange(3, rad)
        xx, yy = int(x + d * math.cos(a)), int(y + d * math.sin(a) * 0.7)
        if 0 <= xx < W and 0 <= yy < GROUND:
            img.putpixel((xx, yy), c(col))


def bricks(img, x0, y0, w, h, base, mortar, hi=None, bw=12, bh=6):
    rect(img, x0, y0, w, h, base)
    for row, y in enumerate(range(y0, y0 + h, bh)):
        rect(img, x0, y, w, 1, mortar)
        off = (bw // 2) * (row % 2)
        for x in range(x0 - off, x0 + w, bw):
            if x0 <= x < x0 + w:
                rect(img, x, y, 1, min(bh, y0 + h - y), mortar)
            if hi and x + 1 >= x0 and x + 1 < x0 + w:
                rect(img, x + 1, y + 1, min(bw - 2, x0 + w - x - 1), 1, hi)


def candle(img, x, y):
    rect(img, x, y, 2, 5, 'cream')
    img.putpixel((x, y - 1), c('gold'))
    img.putpixel((x + 1, y - 2), c('orange'))


def eye(img, x, y, big=3):
    d = ImageDraw.Draw(img)
    d.ellipse([x - big * 2, y - big, x + big * 2, y + big], fill=c('paper'), outline=c('ink'))
    d.ellipse([x - big + 1, y - big + 1, x + big - 1, y + big - 1], fill=c('red'))
    img.putpixel((x, y), c('ink'))


# ---- 0 The Sword Graveyard (template) --------------------------------------------------
def z0_bg():
    bg = scene.background()
    scene.ground(bg)
    return bg


def z0_slab(w):
    return scene.platform(w)


# ---- 1 Disco Crypt of Compliance ------------------------------------------------------
def z1_bg():
    r = random.Random(101)
    bg = Image.new('RGBA', (W, H), c('night'))
    bricks(bg, 0, 0, W, GROUND, 'night', 'ink', 'slate', 14, 7)
    # burial arches with tombs
    for ax in range(10, W, 96):
        poly(bg, [(ax, GROUND), (ax, 120), (ax + 10, 104), (ax + 30, 98), (ax + 50, 104), (ax + 60, 120), (ax + 60, GROUND)], 'ink')
        rect(bg, ax + 8, 150, 44, 56, 'slate')
        rect(bg, ax + 8, 150, 44, 2, 'stone')
        rect(bg, ax + 26, 158, 8, 2, 'fog')
        rect(bg, ax + 29, 155, 2, 9, 'fog')
        candle(bg, ax + 12, 144)
        candle(bg, ax + 46, 144)
    # light beams from the disco ball (dithered, three colours)
    cx, cy = 240, 44
    for k, col in enumerate(('pink', 'teal', 'violet', 'gold', 'pink', 'teal')):
        ang = math.radians(35 + k * 22)
        for t in range(18, 220, 1):
            for wdt in range(-2 - t // 40, 3 + t // 40):
                x = int(cx + math.cos(ang) * t + wdt * math.sin(ang))
                y = int(cy + math.sin(ang) * t)
                if 0 <= x < W and 0 <= y < GROUND and (x + y) % 3 == 0:
                    bg.putpixel((x, y), c(col))
    rect(bg, cx, 0, 1, cy - 14, 'stone')
    d = ImageDraw.Draw(bg)
    d.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], fill=c('fog'), outline=c('ink'))
    for yy in range(cy - 13, cy + 14, 4):
        for xx in range(cx - 13, cx + 14, 4):
            if (xx - cx) ** 2 + (yy - cy) ** 2 < 150:
                rect(bg, xx, yy, 2, 2, 'paper' if (xx + yy) % 8 == 0 else 'mist')
    # cobwebs
    for (wx, flipx) in ((0, 1), (W - 1, -1)):
        for i in range(0, 26, 5):
            for t in range(26 - i):
                bg.putpixel((wx + flipx * t, i), c('stone'))
                bg.putpixel((wx + flipx * i, t), c('stone'))
    # checkered dance floor
    def top(rr):
        t = Image.new('RGBA', (16, 18), (0, 0, 0, 0))
        px = t.load()
        for y in range(2, 18):
            for x in range(16):
                sq = ((x // 8) + ((y - 2) // 8)) % 2
                px[x, y] = c('violet' if sq else 'indigo')
        for x in range(16):
            px[x, 2] = c('mist')
            px[x, 3] = c('stone')
            px[x, 4] = c('ink')
        for _ in range(3):
            px[rr.randrange(16), rr.randrange(6, 18)] = c('pink')
        return t
    tile_row(bg, top, r)
    fill_below(bg, lambda rr: fill_tile(rr, 'indigo', (('violet', 30), ('pink', 2))), r)
    return bg


def z1_slab(w):
    def runes(px, w, h):
        for x in range(4, w - 2, 7):
            px[x, 4] = c('pink')
            px[x + 1, 5] = c('teal')
    return slab(w, ['mist', 'fog'], 'stone', 'slate', 'slate', runes)


# ---- 2 Tax Audit Volcano --------------------------------------------------------------
def z2_bg():
    r = random.Random(202)
    bg = Image.new('RGBA', (W, H), c('wine'))
    bands(bg, [(0, 'night'), (40, 'wine'), (96, 'red'), (140, 'coral'), (166, 'orange')])
    ridge(bg, 176, 26, 30, 'wine', 5)
    # the volcano
    poly(bg, [(150, GROUND), (250, 70), (290, 70), (390, GROUND)], 'night')
    poly(bg, [(250, 70), (290, 70), (282, 80), (258, 80)], 'orange')
    rect(bg, 254, 68, 32, 3, 'gold')
    for lx, drift in ((262, -30), (276, 26)):
        x = lx
        for y in range(80, GROUND):
            x += drift / (GROUND - 80)
            rect(bg, int(x), y, 3, 1, 'orange')
            bg.putpixel((int(x) + 1, y), c('gold'))
    # ash plume
    for i in range(60):
        x, y = 270 + r.randrange(-30, 30) + i // 3, 66 - r.randrange(0, 60)
        rect(bg, x, y, r.randrange(2, 5), 2, 'slate' if r.random() < .7 else 'stone')
    # drifting audit scrolls
    for _ in range(16):
        x, y = r.randrange(W), r.randrange(10, 170)
        rect(bg, x, y, 5, 3, 'cream')
        rect(bg, x + 1, y + 1, 3, 1, 'sand')
    ridge(bg, 196, 10, 24, 'ink', 9)
    # embers
    for _ in range(40):
        bg.putpixel((r.randrange(W), r.randrange(90, GROUND)), c(r.choice(('gold', 'orange'))))

    def top(rr):
        t = top_tile(rr, ['slate', 'night', 'ink'], 'ink', (('night', 8),))
        px = t.load()
        x = rr.randrange(2, 13)
        for y in range(6, 18):
            x = max(0, min(15, x + rr.choice((-1, 0, 1))))
            px[x, y] = c('orange' if y % 3 else 'gold')
        return t
    tile_row(bg, top, r)
    fill_below(bg, lambda rr: fill_tile(rr, 'ink', (('night', 14), ('wine', 4), ('orange', 1))), r)
    return bg


def z2_slab(w):
    def seams(px, w, h):
        for x in range(3, w - 1, 9):
            px[x, h - 3] = c('orange')
            px[x + 1, h - 3] = c('gold')
    return slab(w, ['stone', 'slate'], 'night', 'ink', 'ink', seams)


# ---- 3 Bone Dragon Feast Hall ---------------------------------------------------------
def z3_bg():
    r = random.Random(303)
    bg = Image.new('RGBA', (W, H), c('woodD'))
    # plank wall
    for x in range(0, W, 10):
        rect(bg, x, 0, 10, GROUND, 'woodD' if (x // 10) % 2 else 'wood')
        rect(bg, x, 0, 1, GROUND, 'ink')
    # roof beams
    for y in (18, 60):
        rect(bg, 0, y, W, 7, 'ink')
        rect(bg, 0, y + 1, W, 4, 'woodD')
        rect(bg, 0, y + 1, W, 1, 'wood')
    # hanging banners
    for bx in (40, 150, 330, 440):
        rect(bg, bx, 25, 22, 58, 'red')
        poly(bg, [(bx, 83), (bx + 11, 75), (bx + 22, 83), (bx + 22, 90), (bx + 11, 84), (bx, 90)], 'red')
        rect(bg, bx, 25, 22, 2, 'gold')
        rect(bg, bx + 7, 40, 8, 8, 'gold')
        rect(bg, bx + 9, 42, 4, 4, 'wine')
    # dragon skull trophy
    sk = [
        '.......mmmmmmm......',
        '....mmmppppppppm....',
        '..mmpppppppppppppm..',
        '.mppppppppppppppppm.',
        'mppppiiippppiiipppm.',
        'mpppiieeippiieeippm.',
        'mpppiiiipppiiiipppm.',
        '.mpppppppppppppppm..',
        '..mppfpppppppfppm...',
        '...mpfpfpfpfpfpm....',
        '....mppppppppppm....',
        '.....mfmfmfmfmm.....',
    ]
    for y, row in enumerate(sk):
        for x, ch in enumerate(row):
            if ch != '.':
                for dy in range(3):
                    for dx in range(3):
                        bg.putpixel((210 + x * 3 + dx, 70 + y * 3 + dy),
                                    c({'m': 'ink', 'p': 'paper', 'i': 'fog', 'e': 'red', 'f': 'mist'}[ch]))
    for hx, flipx in ((212, -1), (264, 1)):
        for i in range(20):
            rect(bg, hx + flipx * (i + 2), 72 - i, 4, 3, 'mist')
    # chandeliers
    for cx in (110, 370):
        rect(bg, cx, 25, 1, 30, 'ink')
        rect(bg, cx - 16, 55, 33, 3, 'ink')
        rect(bg, cx - 15, 55, 31, 1, 'gold')
        for k in range(-14, 16, 7):
            candle(bg, cx + k, 50)
        light_dots(bg, r, cx, 55, 24)
    # feast table silhouettes
    for tx in (20, 280):
        rect(bg, tx, 178, 170, 6, 'ink')
        rect(bg, tx + 6, 184, 4, 22, 'ink')
        rect(bg, tx + 160, 184, 4, 22, 'ink')
        for k in range(8):
            rect(bg, tx + 10 + k * 20, 172, 9, 6, r.choice(('coral', 'sand', 'paper', 'gold')))
            rect(bg, tx + 10 + k * 20, 177, 9, 1, 'ink')

    def top(rr):
        t = top_tile(rr, ['sand', 'wood', 'woodD'], 'wood', (('woodD', 10),))
        px = t.load()
        for y in range(5, 18):
            px[0, y] = c('ink')
            px[8, y] = c('woodD')
        px[rr.randrange(2, 7), rr.randrange(8, 16)] = c('ink')
        return t
    tile_row(bg, top, r)
    fill_below(bg, lambda rr: fill_tile(rr, 'woodD', (('wood', 10), ('ink', 6))), r)
    return bg


def z3_slab(w):
    def bones(px, w, h):
        for x in range(3, w - 4, 10):
            for k in range(4):
                px[x + k, 4] = c('paper')
            px[x, 3] = c('paper')
            px[x + 3, 5] = c('paper')
    return slab(w, ['sand', 'wood'], 'wood', 'woodD', 'woodD', bones)


# ---- 4 Cathedral of Bad Ideas ---------------------------------------------------------
def stained_window(img, x, y, w, h, r, with_eye=False):
    poly(img, [(x, y + h), (x, y + w // 2), (x + w // 2, y), (x + w, y + w // 2), (x + w, y + h)], 'ink')
    cols = ('teal', 'pink', 'gold', 'violet', 'blue', 'coral')
    for yy in range(y + 3, y + h - 2, 6):
        for xx in range(x + 2, x + w - 2, 5):
            inside = yy > y + w // 2 or abs(xx + 2 - (x + w // 2)) < (yy - y) * 0.9
            if inside:
                rect(img, xx, yy, 4, 5, r.choice(cols))
    if with_eye:
        eye(img, x + w // 2, y + h // 2, 4)


def z4_bg():
    r = random.Random(404)
    bg = Image.new('RGBA', (W, H), c('night'))
    bricks(bg, 0, 0, W, GROUND, 'slate', 'night', 'stone', 16, 8)
    for i, wx in enumerate((34, 134, 300, 400)):
        stained_window(bg, wx, 40, 44, 110, r, with_eye=(i % 2 == 1))
    # rose window with a giant eye
    d = ImageDraw.Draw(bg)
    d.ellipse([214, 30, 266, 82], fill=c('ink'))
    for k in range(12):
        a = k * math.pi / 6
        d.line([240, 56, 240 + 25 * math.cos(a), 56 + 25 * math.sin(a)], fill=c(('violet', 'teal', 'pink')[k % 3]), width=3)
    eye(bg, 240, 56, 6)
    # pillars
    for px_ in (0, 104, 196, 274, 370, 466):
        rect(bg, px_, 0, 14, GROUND, 'stone')
        rect(bg, px_ + 2, 0, 3, GROUND, 'fog')
        rect(bg, px_ + 11, 0, 3, GROUND, 'slate')
        rect(bg, px_ - 2, 150, 18, 4, 'fog')
    # pews
    for px_ in range(20, W, 70):
        rect(bg, px_, 182, 46, 4, 'woodD')
        rect(bg, px_, 186, 3, 20, 'woodD')
        rect(bg, px_ + 43, 186, 3, 20, 'woodD')
        rect(bg, px_, 182, 46, 1, 'wood')
    for cx in (60, 230, 420):
        candle(bg, cx, 196)
    tile_row(bg, lambda rr: top_tile(rr, ['paper', 'mist', 'fog'], 'fog', (('stone', 12), ('mist', 4))), r)
    fill_below(bg, lambda rr: fill_tile(rr, 'stone', (('fog', 12), ('slate', 8))), r)
    return bg


def z4_slab(w):
    def trim(px, w, h):
        for x in range(w):
            px[x, 2] = c('gold') if x % 3 else c('orange')
    return slab(w, ['paper', 'mist'], 'fog', 'stone', 'stone', trim)


# ---- 5 Frozen Meat Peaks --------------------------------------------------------------
def ham(img, x, y):
    rows = ['..cccc..', '.cccRRc.', 'cccccRRc', 'ccccccRc', '.cccccc.', '..cccc..', '...pp...', '...pp...', '..pppp..']
    for yy, row in enumerate(rows):
        for xx, ch in enumerate(row):
            if ch != '.':
                img.putpixel((x + xx, y + yy), c({'c': 'coral', 'R': 'paper', 'p': 'paper'}[ch]))
    for yy in range(len(rows)):
        img.putpixel((x - 1, y + yy), c('ice'))


def z5_bg():
    r = random.Random(505)
    bg = Image.new('RGBA', (W, H), c('sky'))
    bands(bg, [(0, 'blue'), (40, 'sky'), (100, 'ice'), (150, 'paper')])
    stars(bg, r, 12, 40, ('ice', 'paper'))
    ridge(bg, 150, 60, 34, 'mist', 12)
    ridge(bg, 176, 40, 26, 'ice', 15, rim='paper')
    # ice fortress
    for tx, th in ((330, 70), (352, 96), (378, 64)):
        rect(bg, tx, 180 - th, 20, th + 26, 'fog')
        rect(bg, tx, 180 - th, 3, th + 26, 'mist')
        for k in range(0, 20, 6):
            rect(bg, tx + k, 176 - th, 4, 4, 'fog')
        rect(bg, tx + 8, 190 - th, 4, 6, 'navy')
    # floating frozen hams on icy chains
    for hx, hy in ((60, 30), (150, 52), (250, 22), (440, 44), (200, 96)):
        rect(bg, hx + 3, 0, 1, hy, 'ice')
        ham(bg, hx, hy)
    # snow
    for _ in range(90):
        bg.putpixel((r.randrange(W), r.randrange(0, GROUND)), c('paper'))
    ridge(bg, 198, 10, 22, 'mist', 23)

    def top(rr):
        t = top_tile(rr, ['paper', 'paper', 'mist', 'ice'], 'ice', (('sky', 10), ('paper', 6)), blades='paper')
        return t
    tile_row(bg, top, r)
    fill_below(bg, lambda rr: fill_tile(rr, 'sky', (('ice', 18), ('blue', 6))), r)
    return bg


def z5_slab(w):
    def icicles(px, w, h):
        for x in range(2, w - 2, 5):
            for y in range(h, h + 1 + x % 3):
                px[x, y] = c('ice')
    return slab(w, ['paper', 'paper'], 'ice', 'sky', 'mist', icicles)


# ---- 6 Dad's Storm Forge --------------------------------------------------------------
def bolt(img, x, y, length, r):
    xx = x
    for yy in range(y, y + length):
        xx += r.choice((-1, 0, 0, 1))
        img.putpixel((xx, yy), c('paper'))
        img.putpixel((xx + 1, yy), c('ice'))


def z6_bg():
    r = random.Random(606)
    bg = Image.new('RGBA', (W, H), c('navy'))
    bands(bg, [(0, 'ink'), (34, 'navy'), (90, 'slate'), (150, 'stone')])
    for cx, cy, cw in ((20, 30, 120), (200, 18, 160), (380, 40, 110), (120, 70, 90)):
        rect(bg, cx, cy, cw, 8, 'night')
        rect(bg, cx + 10, cy - 5, cw - 30, 5, 'night')
        rect(bg, cx + 4, cy + 8, cw - 8, 2, 'slate')
    bolt(bg, 140, 36, 70, r)
    bolt(bg, 420, 48, 56, r)
    # rain
    for _ in range(140):
        x, y = r.randrange(W), r.randrange(0, GROUND)
        bg.putpixel((x, y), c('fog'))
        if x + 1 < W and y + 1 < H:
            bg.putpixel((x + 1, y + 1), c('stone'))
    # distant crags
    ridge(bg, 168, 30, 26, 'slate', 61, rim='fog')
    # the stone smithy: rough block walls, tall chimney stack, iron-banded doors, furnace mouth
    bricks(bg, 172, 112, 150, 94, 'stone', 'slate', 'fog', 14, 8)
    poly(bg, [(164, 114), (196, 92), (300, 92), (330, 114)], 'night')
    for x in range(168, 328, 6):
        rect(bg, x, 112, 4, 2, 'slate')
    bricks(bg, 276, 30, 24, 64, 'stone', 'slate', 'fog', 8, 6)
    rect(bg, 272, 26, 32, 6, 'slate')
    for k in range(5):
        rect(bg, 280 + r.randrange(-4, 6), 18 - k * 4, 12 + k * 2, 4, 'stone')
    # furnace mouth
    d = ImageDraw.Draw(bg)
    d.ellipse([224, 140, 276, 190], fill=c('ink'))
    rect(bg, 224, 165, 53, 41, 'ink')
    d.ellipse([230, 146, 270, 184], fill=c('orange'))
    rect(bg, 230, 165, 41, 41, 'orange')
    rect(bg, 238, 170, 25, 36, 'gold')
    rect(bg, 246, 180, 9, 26, 'cream')
    light_dots(bg, r, 250, 196, 40, 'gold', 26)
    # iron-banded side doors
    for dx in (184, 296):
        rect(bg, dx, 160, 16, 46, 'woodD')
        for y in (166, 182, 198):
            rect(bg, dx, y, 16, 2, 'slate')
        bg.putpixel((dx + 12, 184), c('gold'))
    # hanging anvil sign
    rect(bg, 212, 120, 1, 8, 'ink')
    rect(bg, 204, 128, 18, 4, 'slate')
    rect(bg, 200, 128, 6, 2, 'slate')
    rect(bg, 208, 132, 10, 4, 'night')
    # anvils and tool rack
    for ax in (70, 380):
        rect(bg, ax, 186, 26, 6, 'stone')
        rect(bg, ax - 6, 186, 8, 3, 'stone')
        rect(bg, ax + 8, 192, 10, 8, 'slate')
        rect(bg, ax + 2, 200, 22, 6, 'slate')
        rect(bg, ax, 186, 26, 1, 'fog')
    rect(bg, 120, 150, 40, 3, 'woodD')
    for k in range(5):
        rect(bg, 124 + k * 8, 153, 2, 16 + (k % 2) * 6, 'fog')

    def top(rr):
        t = top_tile(rr, ['fog', 'stone', 'slate'], 'slate', (('night', 10),))
        px = t.load()
        for x in (3, 12):
            px[x, 7] = c('mist')
            px[x, 14] = c('mist')
        return t
    tile_row(bg, top, r)
    fill_below(bg, lambda rr: fill_tile(rr, 'slate', (('night', 12), ('orange', 1))), r)
    return bg


def z6_slab(w):
    def rivets(px, w, h):
        for x in range(4, w - 2, 6):
            px[x, 4] = c('mist')
    return slab(w, ['mist', 'fog'], 'stone', 'slate', 'slate', rivets)


# ---- 7 Grandma's Armed Witch Cottage ---------------------------------------------------
def mushroom(img, x, h, cap):
    rect(img, x - 1, GROUND - h, 3, h, 'paper')
    d = ImageDraw.Draw(img)
    d.ellipse([x - cap, GROUND - h - cap // 2 - 2, x + cap, GROUND - h + cap // 2 - 2], fill=c('red'), outline=c('ink'))
    rect(img, x - cap, GROUND - h - 1, cap * 2 + 1, 2, 'ink')
    for k in range(-cap + 3, cap - 1, 4):
        img.putpixel((x + k, GROUND - h - cap // 3 - 1), c('paper'))


def z7_bg():
    r = random.Random(707)
    bg = Image.new('RGBA', (W, H), c('indigo'))
    bands(bg, [(0, 'night'), (50, 'indigo'), (120, 'violet')])
    stars(bg, r, 40, 120)
    d = ImageDraw.Draw(bg)
    d.ellipse([370, 20, 420, 70], fill=c('cream'))
    d.ellipse([382, 18, 428, 64], fill=c('night'))  # crescent
    # layered forest
    for base, col, step in ((150, 'night', 14), (176, 'ink', 18)):
        x = -6
        while x < W:
            hgt = r.randrange(30, 70)
            poly(bg, [(x, base + 30), (x + step // 2, base - hgt), (x + step, base + 30)], col)
            x += step - 2
        rect(bg, 0, base + 20, W, GROUND - base - 20, col)
    # the cottage
    rect(bg, 190, 130, 100, 76, 'woodD')
    for y in range(130, 206, 6):
        rect(bg, 190, y, 100, 1, 'ink')
    poly(bg, [(180, 132), (236, 80), (300, 132)], 'wine')
    poly(bg, [(236, 80), (246, 70), (250, 84)], 'wine')
    for y in range(90, 132, 6):
        rect(bg, 200 + (y - 90) // 2, y, 80 - (y - 90), 1, 'red')
    rect(bg, 262, 92, 10, 24, 'slate')
    for k in range(6):
        rect(bg, 262 + k * 3 + r.randrange(-2, 3), 86 - k * 9, 8, 5, 'stone')
    for wx in (200, 260):
        rect(bg, wx, 150, 18, 16, 'ink')
        rect(bg, wx + 1, 151, 16, 14, 'gold')
        rect(bg, wx + 8, 151, 2, 14, 'ink')
        rect(bg, wx + 1, 157, 16, 2, 'ink')
    rect(bg, 228, 170, 22, 36, 'ink')
    rect(bg, 230, 172, 18, 34, 'wood')
    bg.putpixel((244, 188), c('gold'))
    light_dots(bg, r, 210, 158, 26, 'gold', 14)
    # cauldron, pumpkins, mushrooms
    rect(bg, 330, 192, 26, 14, 'ink')
    rect(bg, 328, 190, 30, 3, 'slate')
    for k in range(6):
        rect(bg, 334 + k * 3, 186 - (k % 3) * 2, 3, 3, 'lime')
    flame(bg, 343, 202, big=True)
    for pxx in (120, 140, 400):
        d.ellipse([pxx, 196, pxx + 12, 206], fill=c('orange'), outline=c('ink'))
        rect(bg, pxx + 5, 193, 2, 4, 'pine')
    for mx, mh, cap in ((40, 18, 10), (74, 10, 6), (440, 22, 12), (300, 8, 5)):
        mushroom(bg, mx, mh, cap)
    # cookie tins on the porch
    for tx in (168, 304):
        rect(bg, tx, 198, 12, 8, 'blue')
        rect(bg, tx, 198, 12, 2, 'sky')
        rect(bg, tx + 3, 201, 6, 2, 'gold')

    def top(rr):
        t = top_tile(rr, ['grass', 'leaf', 'pine'], 'slate', (('stone', 14), ('pine', 6)), blades='grass')
        px = t.load()
        for y in range(7, 18, 5):
            for x in range(16):
                if (x + y) % 8 == 0:
                    px[x, y] = c('night')
        return t
    tile_row(bg, top, r)
    fill_below(bg, lambda rr: fill_tile(rr, 'slate', (('stone', 14), ('night', 8))), r)
    return bg


def z7_slab(w):
    def moss(px, w, h):
        for x in range(1, w - 1, 6):
            px[x, h - 1] = c('leaf')
            px[x, h] = c('leaf')
    return slab(w, ['lime', 'grass'], 'wood', 'woodD', 'woodD', moss)


# ---- 8 The Hostile Takeover Citadel ----------------------------------------------------
def z8_bg():
    r = random.Random(808)
    bg = Image.new('RGBA', (W, H), c('sky'))
    bands(bg, [(0, 'blue'), (60, 'sky'), (130, 'ice')])
    # cloud sea below the citadel
    for cx in range(-20, W, 44):
        cy = 150 + r.randrange(0, 18)
        rect(bg, cx, cy, 52, 8, 'paper')
        rect(bg, cx + 8, cy - 4, 34, 4, 'paper')
        rect(bg, cx, cy + 8, 52, 3, 'mist')
    # curtain wall + keep
    rect(bg, 0, 170, W, 36, 'fog')
    rect(bg, 0, 170, W, 2, 'paper')
    for x in range(0, W, 10):
        rect(bg, x, 165, 6, 5, 'fog')
    # castle towers: battlements, arrow slits, gold onion domes, pennants
    d = ImageDraw.Draw(bg)
    for tx, th, tw in ((24, 120, 34), (110, 158, 46), (300, 176, 52), (392, 128, 38), (448, 96, 28)):
        top = 200 - th
        rect(bg, tx, top, tw, th, 'mist')
        rect(bg, tx, top, 4, th, 'paper')
        rect(bg, tx + tw - 5, top, 5, th, 'fog')
        for y in range(top + 10, 200, 10):
            rect(bg, tx, y, tw, 1, 'fog')
        for k in range(0, tw, 8):
            rect(bg, tx + k - 1, top - 6, 5, 6, 'mist')
            rect(bg, tx + k - 1, top - 6, 5, 1, 'paper')
        dome_y = top - 6
        d.ellipse([tx + 4, dome_y - tw // 2, tx + tw - 4, dome_y + tw // 3], fill=c('gold'), outline=c('ink'))
        poly(bg, [(tx + tw // 2 - 3, dome_y - tw // 2 + 2), (tx + tw // 2, dome_y - tw // 2 - 8), (tx + tw // 2 + 3, dome_y - tw // 2 + 2)], 'gold')
        rect(bg, tx + 6, dome_y - 2, tw - 12, 2, 'orange')
        fx = tx + tw // 2
        rect(bg, fx, dome_y - tw // 2 - 18, 1, 10, 'ink')
        poly(bg, [(fx + 1, dome_y - tw // 2 - 18), (fx + 10, dome_y - tw // 2 - 15), (fx + 1, dome_y - tw // 2 - 12)], 'red')
        for wy in range(top + 14, 160, 34):
            sx = tx + tw // 2 - 1
            rect(bg, sx, wy, 3, 10, 'ink')
            bg.putpixel((sx + 1, wy - 1), c('ink'))
    # gate
    rect(bg, 214, 150, 52, 56, 'fog')
    d.ellipse([222, 156, 258, 186], fill=c('ink'))
    rect(bg, 222, 171, 37, 35, 'ink')
    for x in range(224, 258, 5):
        rect(bg, x, 160, 1, 46, 'gold')
    # floating staircases
    for sx, sy in ((170, 120), (220, 90)):
        for k in range(6):
            rect(bg, sx + k * 8, sy - k * 5, 10, 3, 'paper')
            rect(bg, sx + k * 8, sy - k * 5 + 3, 10, 1, 'fog')
    # coin banners
    for bx in (160, 250):
        rect(bg, bx, 150, 20, 40, 'wine')
        rect(bg, bx, 150, 20, 2, 'gold')
        d = ImageDraw.Draw(bg)
        d.ellipse([bx + 4, 160, bx + 15, 171], fill=c('gold'), outline=c('orange'))
        rect(bg, bx + 9, 162, 2, 7, 'orange')

    def top(rr):
        t = top_tile(rr, ['gold', 'orange', 'paper'], 'mist', (('fog', 6),))
        px = t.load()
        x, y = rr.randrange(16), 6
        while y < 18:
            px[x, y] = c('fog')
            x = (x + rr.choice((-1, 1))) % 16
            y += 1
        return t
    tile_row(bg, top, r)
    fill_below(bg, lambda rr: fill_tile(rr, 'mist', (('fog', 10), ('paper', 6))), r)
    return bg


def z8_slab(w):
    def gold_edge(px, w, h):
        for x in range(w):
            px[x, h - 3] = c('gold')
    return slab(w, ['paper', 'paper'], 'mist', 'fog', 'fog', gold_edge)


# ---- 9 The Sentient Armory Vault --------------------------------------------------------
def rack_weapon(img, x, y, kind, r):
    if kind == 0:  # sword
        rect(img, x, y, 2, 26, 'fog')
        rect(img, x, y, 1, 26, 'mist')
        rect(img, x - 3, y + 26, 8, 2, 'gold')
        rect(img, x, y + 28, 2, 6, 'wood')
    elif kind == 1:  # axe
        rect(img, x, y, 2, 34, 'wood')
        poly(img, [(x + 2, y + 2), (x + 11, y - 2), (x + 11, y + 12), (x + 2, y + 8)], 'fog')
        rect(img, x + 10, y - 2, 1, 14, 'mist')
    else:  # spear
        rect(img, x, y + 6, 2, 30, 'wood')
        poly(img, [(x - 2, y + 6), (x + 1, y - 2), (x + 4, y + 6)], 'mist')
    if r.random() < .3:  # it is watching you
        img.putpixel((x, y + 4), c('red'))
        img.putpixel((x + 2, y + 4), c('red'))


def z9_bg():
    r = random.Random(909)
    bg = Image.new('RGBA', (W, H), c('night'))
    for y in range(0, GROUND, 24):
        rect(bg, 0, y, W, 24, 'slate' if (y // 24) % 2 else 'night')
        rect(bg, 0, y, W, 1, 'ink')
        for x in range(6, W, 20):
            bg.putpixel((x, y + 3), c('fog'))
            bg.putpixel((x, y + 20), c('fog'))
    # weapon racks
    for rx in (14, 110, 330, 420):
        rect(bg, rx, 70, 64, 4, 'woodD')
        rect(bg, rx, 150, 64, 4, 'woodD')
        for k in range(6):
            rack_weapon(bg, rx + 5 + k * 10, 80 + (k % 2) * 4, (k + rx) % 3, r)
            rack_weapon(bg, rx + 5 + k * 10, 160 - 20 + (k % 2) * 4, (k + rx + 1) % 3, r)
    # giant round vault door
    d = ImageDraw.Draw(bg)
    d.ellipse([190, 60, 290, 160], fill=c('fog'), outline=c('ink'))
    d.ellipse([198, 68, 282, 152], fill=c('stone'), outline=c('slate'))
    d.ellipse([224, 94, 256, 126], fill=c('slate'), outline=c('ink'))
    for k in range(8):
        a = k * math.pi / 4
        d.line([240, 110, 240 + 26 * math.cos(a), 110 + 26 * math.sin(a)], fill=c('mist'), width=3)
        bx, by = 240 + 46 * math.cos(a + .39), 110 + 46 * math.sin(a + .39)
        rect(bg, int(bx) - 1, int(by) - 1, 3, 3, 'gold')
    eye(bg, 240, 110, 4)
    # chains from the ceiling
    for cx in (96, 180, 300, 392):
        for y in range(0, 40 + (cx % 3) * 10, 3):
            rect(bg, cx, y, 2, 2, 'stone' if (y // 3) % 2 else 'fog')
    # crates with teeth
    for kx in (60, 400):
        rect(bg, kx, 182, 24, 24, 'wood')
        rect(bg, kx, 182, 24, 2, 'sand')
        rect(bg, kx, 182, 2, 24, 'woodD')
        rect(bg, kx + 22, 182, 2, 24, 'woodD')
        for t in range(3, 22, 4):
            poly(bg, [(kx + t, 192), (kx + t + 2, 196), (kx + t + 4, 192)], 'paper')

    def top(rr):
        t = top_tile(rr, ['mist', 'fog', 'stone'], 'slate', ())
        px = t.load()
        for y in range(5, 18):
            for x in range(16):
                if x % 4 == 0 or (y - 5) % 4 == 0:
                    px[x, y] = c('ink')
        return t
    tile_row(bg, top, r)
    fill_below(bg, lambda rr: fill_tile(rr, 'slate', (('ink', 30), ('stone', 6))), r)
    return bg


def z9_slab(w):
    def bolts(px, w, h):
        for x in range(2, w - 1, 6):
            px[x, 3] = c('gold')
    return slab(w, ['mist', 'fog'], 'stone', 'slate', 'night', bolts)


ZONES = [
    ('graveyard', z0_bg, z0_slab),
    ('disco-crypt', z1_bg, z1_slab),
    ('volcano', z2_bg, z2_slab),
    ('feast-hall', z3_bg, z3_slab),
    ('cathedral', z4_bg, z4_slab),
    ('frozen-peaks', z5_bg, z5_slab),
    ('storm-forge', z6_bg, z6_slab),
    ('witch-cottage', z7_bg, z7_slab),
    ('citadel', z8_bg, z8_slab),
    ('armory-vault', z9_bg, z9_slab),
]
