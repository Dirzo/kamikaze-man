"""Builds the phase-2 style sheet for approval:

  docs/style-sheet/mock-frame.png   a 480x270 in-game frame (zone 1) scaled 4x to 1920x1080
  docs/style-sheet/style-sheet.png  palette, sprites, tiles, font and HUD on one page

Run: python3 crazy-weapon-man-site/art-src/scene.py
"""
import os
import random
from PIL import Image, ImageDraw
from pixel import PAL, RGB, sprite, outlined, flip, scale, HERO, HERO_KEY, CHICKEN, CHICKEN_KEY, INTERN, INTERN_KEY, \
    GEM, GEM_KEY, SWORD, SWORD_KEY
from font import draw_text, text_width

W, H = 480, 270
GROUND = 206  # world ground line (550 of 720 in game units)
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'style-sheet')
rnd = random.Random(7)


def c(name, a=255):
    return RGB[name] + (a,)


def rect(img, x, y, w, h, col):
    ImageDraw.Draw(img).rectangle([x, y, x + w - 1, y + h - 1], fill=c(col))


def dither_band(img, y0, y1, top, bottom):
    """Flat band with a 2-row checker transition into the next colour (no gradients)."""
    rect(img, 0, y0, W, y1 - y0, top)
    px = img.load()
    for y in (y1 - 2, y1 - 1):
        for x in range(W):
            if (x + y) % 2 == 0:
                px[x, y] = c(bottom)


# ---- Tiles --------------------------------------------------------------------------
def tile_asphalt_top(line=False):
    t = Image.new('RGBA', (16, 16), c('slate'))
    px = t.load()
    for x in range(16):
        px[x, 0] = c('paper')
        px[x, 1] = c('mist')
        px[x, 2] = c('fog')
        px[x, 3] = c('stone')
        px[x, 4] = c('ink')
    for _ in range(9):
        px[rnd.randrange(16), rnd.randrange(6, 16)] = c('stone')
    for _ in range(4):
        px[rnd.randrange(16), rnd.randrange(6, 16)] = c('night')
    if line:
        for y in range(5, 16):
            for x in (6, 7, 8):
                px[x, y] = c('gold' if x < 8 else 'orange')
    return t


def tile_asphalt():
    t = Image.new('RGBA', (16, 16), c('slate'))
    px = t.load()
    for _ in range(10):
        px[rnd.randrange(16), rnd.randrange(16)] = c('stone')
    for _ in range(6):
        px[rnd.randrange(16), rnd.randrange(16)] = c('night')
    return t


def platform(w):
    """Floating concrete slab with hazard-striped ends, 8px tall, outlined."""
    p = Image.new('RGBA', (w, 7), c('fog'))
    px = p.load()
    for x in range(w):
        px[x, 0] = c('paper')
        px[x, 1] = c('mist')
        px[x, 5] = c('stone')
        px[x, 6] = c('stone')
        if x % 7 == 3:
            px[x, 3] = c('stone')
    for x in list(range(0, 8)) + list(range(w - 8, w)):
        for y in range(2, 5):
            px[x, y] = c('gold' if (x + y) // 2 % 2 else 'ink')
    return outlined(p)


# ---- Background (zone 1: Municipal Sword Parking Lot, dusk) ---------------------------------
def background():
    bg = Image.new('RGBA', (W, H), c('indigo'))
    bands = [(0, 'indigo'), (46, 'violet'), (88, 'pink'), (118, 'coral'), (140, 'orange'), (156, 'gold')]
    for i, (y0, col) in enumerate(bands):
        y1 = bands[i + 1][0] if i + 1 < len(bands) else GROUND
        dither_band(bg, y0, y1, col, bands[i + 1][1] if i + 1 < len(bands) else col)
    d = ImageDraw.Draw(bg)
    # sun
    d.ellipse([300, 120, 372, 192], fill=c('cream'))
    d.ellipse([306, 126, 366, 186], fill=c('paper'))
    # stars
    for _ in range(26):
        x, y = rnd.randrange(W), rnd.randrange(0, 60)
        bg.putpixel((x, y), c('mist' if rnd.random() < .7 else 'paper'))
    # flat clouds (two tones, hard edges)
    for cx, cy, cw in ((40, 62, 70), (190, 74, 54), (330, 56, 90), (420, 92, 44), (110, 104, 50)):
        top, low = ('pink', 'violet') if cy < 88 else ('cream', 'coral')
        rect(bg, cx, cy, cw, 4, top)
        rect(bg, cx + 6, cy - 3, cw - 20, 3, top)
        rect(bg, cx + 14, cy - 5, cw // 3, 2, top)
        rect(bg, cx + 4, cy + 4, cw - 6, 2, low)
    # far skyline
    x = -4
    while x < W:
        bw, bh = rnd.randrange(18, 40), rnd.randrange(30, 78)
        top = 176 - bh
        rect(bg, x, top, bw, GROUND - top, 'night')
        if rnd.random() < .4:
            rect(bg, x + bw // 2 - 1, top - 8, 2, 8, 'night')
        for wy in range(top + 4, 172, 6):
            for wx in range(x + 3, x + bw - 3, 5):
                if rnd.random() < .22:
                    rect(bg, wx, wy, 2, 3, 'gold' if rnd.random() < .8 else 'cream')
        x += bw + rnd.randrange(1, 6)
    # near skyline band
    x = -10
    while x < W:
        bw, bh = rnd.randrange(24, 54), rnd.randrange(14, 36)
        rect(bg, x, 186 - bh, bw, GROUND - (186 - bh), 'ink')
        x += bw + rnd.randrange(0, 10)
    # chain-link fence along the lot
    for fx in range(0, W, 2):
        for fy in range(184, GROUND):
            if (fx + fy) % 6 == 0:
                bg.putpixel((fx, fy), c('stone'))
    for fx in range(0, W, 40):
        rect(bg, fx, 180, 2, GROUND - 180, 'slate')
    rect(bg, 0, 180, W, 1, 'slate')
    # lamp posts with warm light pools
    for lx in (60, 252, 436):
        rect(bg, lx, 128, 3, GROUND - 128, 'night')
        rect(bg, lx - 6, 126, 12, 3, 'night')
        rect(bg, lx - 5, 129, 10, 2, 'gold')
        for y in range(131, GROUND):
            half = (y - 131) // 3 + 4
            for x in range(lx + 1 - half, lx + 2 + half):
                if 0 <= x < W and x % 4 == (y // 2) % 4 and y % 2 == 0:
                    bg.putpixel((x, y), c('cream', 255))
    # parking sign
    rect(bg, 132, 150, 2, GROUND - 150, 'stone')
    sign = Image.new('RGBA', (14, 14), c('blue'))
    draw_text(sign, 4, 3, 'P', 'paper', shadow=False)
    bg.alpha_composite(outlined(sign), (125, 138))
    return bg


def ground(img):
    x = 0
    while x < W:
        img.alpha_composite(tile_asphalt_top(line=(x // 16) % 5 == 2), (x, GROUND))
        x += 16
    for y in range(GROUND + 16, H, 16):
        for x in range(0, W, 16):
            img.alpha_composite(tile_asphalt(), (x, y))


# ---- HUD ------------------------------------------------------------------------------
def icon_heart():
    return outlined(sprite(['.r.r.', 'rRrrr', 'rrrrr', '.rrr.', '..r..'], {'r': 'red', 'R': 'paper'}))


def icon_bolt():
    return outlined(sprite(['..y', '.yy', 'yyy', '.yy', 'yy.', 'y..'], {'y': 'teal'}))


def icon_gem():
    return outlined(sprite(['.ab.', 'aabb', 'abbc', '.bc.'], {'a': 'paper', 'b': 'ice', 'c': 'sky'}))


def bar(img, x, y, w, frac, col, colD):
    rect(img, x - 1, y - 1, w + 2, 6, 'ink')
    rect(img, x, y, w, 4, 'night')
    f = int(w * frac)
    rect(img, x, y, f, 4, col)
    rect(img, x, y + 3, f, 1, colD)
    rect(img, x, y, f, 1, 'paper' if col != 'paper' else 'mist')


def hud(img, hp=0.82, special=1.0, xp=0.45):
    y0, h = 247, 23
    # frame: dark wood border, gold inner rule, navy inset (ref 01, slimmed)
    rect(img, 0, y0, W, h, 'woodD')
    rect(img, 1, y0 + 1, W - 2, h - 2, 'wood')
    rect(img, 2, y0 + 2, W - 4, h - 4, 'gold')
    rect(img, 3, y0 + 3, W - 6, h - 6, 'night')
    slots = [(4, 112), (118, 92), (212, 186), (400, 76)]
    for sx, sw in slots[1:]:
        rect(img, sx - 3, y0 + 2, 3, h - 4, 'wood')
        rect(img, sx - 2, y0 + 2, 1, h - 4, 'gold')
        for k in (4, 10, 16):
            img.putpixel((sx - 2, y0 + k), c('cream'))
    # labels straddle the top rule like MAIL / ARMS / KEY / GOLD
    labels = ['HP', 'SPECIAL', 'WEAPON', 'SHARDS']
    for (sx, sw), lab in zip(slots, labels):
        lw = text_width(lab)
        rect(img, sx + 6, y0 - 1, lw + 4, 10, 'woodD')
        draw_text(img, sx + 8, y0 - 0, lab, 'cream', shadow=False)
    cy = y0 + 12
    # HP
    img.alpha_composite(icon_heart(), (8, cy - 1))
    bar(img, 18, cy + 1, 62, hp, 'red', 'wine')
    draw_text(img, 86, cy, '344', 'paper', shadow=False)
    # Special
    img.alpha_composite(icon_bolt(), (122, cy - 2))
    bar(img, 130, cy + 1, 36, special, 'teal', 'pine')
    draw_text(img, 171, cy, 'READY', 'lime', shadow=False)
    # Weapon
    sw = outlined(sprite(SWORD, SWORD_KEY))
    img.alpha_composite(sw, (216, cy - 1))
    draw_text(img, 236, cy, 'TRAINING SWORD', 'mist', shadow=False)
    draw_text(img, 340, cy, '87 DPS', 'gold', shadow=False)
    # Shards + level
    img.alpha_composite(icon_gem(), (404, cy))
    draw_text(img, 413, cy, '26', 'ice', shadow=False)
    draw_text(img, 430, cy, 'LV3', 'cream', shadow=False)
    bar(img, 450, cy + 1, 22, xp, 'gold', 'rust')


# ---- Effects ----------------------------------------------------------------------------
def slash(img, cx, cy, r=15):
    """Crescent swing arc: 3 rings of paper/ice/sky pixels on the front side."""
    import math
    for rr, col in ((r, 'paper'), (r - 1, 'paper'), (r - 2, 'ice'), (r - 3, 'sky')):
        for a in range(-70, 75, 3):
            t = math.radians(a)
            x, y = int(round(cx + rr * math.cos(t))), int(round(cy + rr * math.sin(t)))
            if 0 <= x < W and 0 <= y < H:
                img.putpixel((x, y), c(col))


def glow(img, spr, x, y, col):
    """1px coloured halo around a sprite instead of a blur."""
    a = spr.split()[3]
    halo = Image.new('RGBA', (spr.width + 4, spr.height + 4), (0, 0, 0, 0))
    px = halo.load()
    ap = a.load()
    for yy in range(spr.height):
        for xx in range(spr.width):
            if ap[xx, yy]:
                for dx in (-2, -1, 0, 1, 2):
                    for dy in (-2, -1, 0, 1, 2):
                        if abs(dx) + abs(dy) <= 2 and (xx + yy + dx + dy) % 2 == 0:
                            px[xx + 2 + dx, yy + 2 + dy] = c(col)
    img.alpha_composite(halo, (x - 2, y - 2))
    img.alpha_composite(spr, (x, y))


# ---- Compose the mock frame --------------------------------------------------------------
def mock_frame():
    img = background()
    ground(img)
    img.alpha_composite(platform(86), (96, 164))
    img.alpha_composite(platform(64), (360, 140))

    hero = outlined(sprite(HERO, HERO_KEY))
    chicken = outlined(sprite(CHICKEN, CHICKEN_KEY))
    intern = outlined(sprite(INTERN, INTERN_KEY))
    sword = outlined(sprite(SWORD, SWORD_KEY))
    gem = outlined(sprite(GEM, GEM_KEY))

    hx = 196
    img.alpha_composite(hero, (hx, GROUND - hero.height + 1))
    img.alpha_composite(sword, (hx + 13, GROUND - 11))
    slash(img, hx + 22, GROUND - 13)
    img.alpha_composite(chicken, (hx + 34, GROUND - chicken.height + 1))
    img.alpha_composite(chicken, (300, GROUND - chicken.height + 1))
    img.alpha_composite(intern, (330, GROUND - intern.height + 1))
    img.alpha_composite(intern, (395, 140 - intern.height + 1))
    img.alpha_composite(flip(chicken), (120, GROUND - chicken.height + 1))
    glow(img, gem, 166, GROUND - 16, 'ice')
    # enemy HP pips
    for ex, ey, f in ((hx + 34, GROUND - 22, .35), (300, GROUND - 22, 1), (330, GROUND - 24, .8), (395, 140 - 24, 1)):
        rect(img, ex + 1, ey, 16, 3, 'ink')
        rect(img, ex + 2, ey + 1, int(14 * f), 1, 'lime')
    # floating text: small numbers, big crits, short callouts
    draw_text(img, hx + 40, GROUND - 50, 'CRIT', 'gold')
    draw_text(img, hx + 40, GROUND - 41, '42', 'gold', k=2)
    draw_text(img, hx + 60, GROUND - 26, '21', 'paper')
    draw_text(img, 300, GROUND - 34, 'BOMB?', 'coral')
    draw_text(img, 154, GROUND - 30, 'RARE!', 'ice')
    # zone label (ref 03 'COURTYARD') + wave line
    draw_text(img, 6, 5, 'MUNICIPAL SWORD PARKING LOT', 'paper')
    draw_text(img, 6, 15, 'WAVE 1  12 LEFT', 'mist')
    hud(img)
    return img


# ---- Style sheet page -----------------------------------------------------------------
def style_sheet(frame):
    sw_, sh_ = 480, 330
    pg = Image.new('RGBA', (sw_, sh_), c('night'))
    draw_text(pg, 8, 6, 'NOOBSCRUB 16-BIT  STYLE SHEET', 'gold')
    draw_text(pg, 8, 16, 'CRAZY WEAPON MAN  PHASE 2', 'mist')
    # palette
    draw_text(pg, 8, 30, 'PALETTE  32', 'cream')
    names = list(PAL)
    for i, n in enumerate(names):
        x, y = 8 + (i % 16) * 29, 40 + (i // 16) * 24
        rect(pg, x, y, 26, 14, 'ink')
        rect(pg, x + 1, y + 1, 24, 12, n)
    # sprites at 2x
    draw_text(pg, 8, 94, 'CHARACTERS  1PX OUTLINE', 'cream')
    x = 8
    for spr in (sprite(HERO, HERO_KEY), sprite(CHICKEN, CHICKEN_KEY), sprite(INTERN, INTERN_KEY)):
        s = scale(outlined(spr), 3)
        rect(pg, x - 2, 104, s.width + 4, 78, 'slate')
        pg.alpha_composite(s, (x, 180 - s.height))
        x += s.width + 10
    for spr, col in ((sprite(GEM, GEM_KEY), 'ice'), (sprite(SWORD, SWORD_KEY), None)):
        s = scale(outlined(spr), 3)
        pg.alpha_composite(s, (x, 150 - s.height // 2))
        x += s.width + 10
    # tiles at 3x
    draw_text(pg, 260, 94, 'TILES', 'cream')
    tx = 260
    for t in (tile_asphalt_top(), tile_asphalt_top(True), tile_asphalt()):
        pg.alpha_composite(scale(t, 3), (tx, 104))
        tx += 50
    pg.alpha_composite(scale(platform(40), 3), (260, 158))
    # font
    draw_text(pg, 8, 192, 'FONT  5X7  TWO SIZES', 'cream')
    draw_text(pg, 8, 204, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 !?%+-/:', 'paper')
    draw_text(pg, 8, 216, 'MURDER STREAK!', 'coral', k=2)
    draw_text(pg, 170, 216, 'LEGENDARY', 'gold', k=2)
    draw_text(pg, 300, 216, '9999', 'ice', k=2)
    # HUD crop at 2x
    draw_text(pg, 8, 240, 'HUD  FRAMED BAR', 'cream')
    crop = frame.crop((0, 244, 480, 270))
    pg.alpha_composite(crop.resize((480, 26 * 2 // 2 * 1), Image.NEAREST), (0, 252))
    crop2 = scale(frame.crop((0, 244, 240, 270)), 2)
    pg.alpha_composite(crop2, (0, 280))
    return pg


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    f = mock_frame()
    f.save(os.path.join(OUT, 'mock-frame-1x.png'))
    scale(f, 4).save(os.path.join(OUT, 'mock-frame.png'))
    scale(style_sheet(f), 3).save(os.path.join(OUT, 'style-sheet.png'))
    print('wrote', os.path.abspath(OUT))
