"""Builds the phase-2 style sheet for approval:

  docs/style-sheet/mock-frame.png   a 480x270 in-game frame (zone 1 proposal) scaled 4x to 1920x1080
  docs/style-sheet/style-sheet.png  palette, sprites, tiles, font and HUD on one page

Run: python3 crazy-weapon-man-site/art-src/scene.py
"""
import os
import random
from PIL import Image, ImageDraw
from pixel import PAL, RGB, sprite, outlined, flip, scale, HERO, HERO_KEY, CHICKEN, CHICKEN_KEY, GREMLIN, GREMLIN_KEY, \
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
def tile_grass_top(sword=False):
    """Grass lip over dark earth with stones (ref 05). Blades poke 2px above the tile."""
    t = Image.new('RGBA', (16, 18), (0, 0, 0, 0))
    px = t.load()
    for y in range(2, 18):
        for x in range(16):
            px[x, y] = c('night')
    for x in range(16):
        px[x, 2] = c('lime')
        px[x, 3] = c('grass')
        px[x, 4] = c('grass' if x % 5 else 'leaf')
        px[x, 5] = c('leaf')
        if x % 3 != 1:
            px[x, 6] = c('pine')
    for x in (1, 6, 11, 14):
        px[x, 1] = c('lime')
        if x % 2:
            px[x, 0] = c('lime')
    for _ in range(3):
        sx, sy = rnd.randrange(1, 14), rnd.randrange(9, 16)
        px[sx, sy] = c('stone')
        px[sx + 1, sy] = c('slate')
    for _ in range(5):
        px[rnd.randrange(16), rnd.randrange(8, 18)] = c('woodD')
    return t


def tile_earth():
    t = Image.new('RGBA', (16, 16), c('night'))
    px = t.load()
    for _ in range(4):
        sx, sy = rnd.randrange(15), rnd.randrange(16)
        px[sx, sy] = c('slate')
        px[sx + 1, sy] = c('ink')
    for _ in range(6):
        px[rnd.randrange(16), rnd.randrange(16)] = c('woodD')
    return t


def platform(w):
    """Floating ruin slab: mossy top, cut stone blocks, hanging vines."""
    h = 9
    p = Image.new('RGBA', (w, h + 4), (0, 0, 0, 0))
    px = p.load()
    for y in range(2, h):
        for x in range(w):
            px[x, y] = c('fog' if y < 5 else 'stone')
    for x in range(w):
        px[x, 0] = c('lime') if x % 4 else c('grass')
        px[x, 1] = c('grass') if x % 3 else c('leaf')
        px[x, h - 1] = c('slate')
    for x in range(0, w, 8):
        for y in range(2, h - 1):
            px[x, y] = c('slate')
    for x in range(4, w, 8):
        px[x, 5] = c('slate')
    for vx in range(3, w - 2, 11):
        for vy in range(h, h + 2 + vx % 3):
            px[vx, vy] = c('leaf')
    return outlined(p)


# ---- Background (zone 1 proposal: the Sword Graveyard at dusk) ---------------------------------
def poly(img, pts, col):
    ImageDraw.Draw(img).polygon(pts, fill=c(col))


def ridge(img, base, amp, step, col, seed, rim=None):
    r = random.Random(seed)
    pts, x, y = [(0, GROUND)], 0, base
    while x <= W + step:
        y = base - r.randrange(0, amp)
        pts.append((x, y))
        x += step + r.randrange(-step // 3, step // 3 + 1)
    pts.append((W, GROUND))
    poly(img, pts, col)
    if rim:  # 1px rim light on the left-facing slopes
        px = img.load()
        for i in range(1, len(pts) - 2):
            (x0, y0), (x1, y1) = pts[i], pts[i + 1]
            if y1 < y0:
                continue
            for xx in range(int(x0), int(x1)):
                yy = int(y0 + (y1 - y0) * (xx - x0) / max(1, x1 - x0))
                if 0 <= xx < W and 0 <= yy < H:
                    px[xx, yy] = c(rim)


def big_sword(img, x, tip_y, length, lean=0):
    """Giant sword buried point-down: 9px blade with fuller, crossguard, grip, pommel."""
    px = img.load()
    for i in range(length):
        y = tip_y - i
        half = min(4, 1 + i // 3)  # tapered tip at the bottom
        for dx in range(-half, half + 1):
            xx = x + dx
            if 0 <= xx < W and 0 <= y < H:
                col = 'ink' if abs(dx) == half else ('mist' if dx == -half + 1 else ('stone' if dx == 0 else 'fog'))
                px[xx, y] = c(col)
    top = tip_y - length
    rect(img, x - 12, top - 4, 25, 5, 'ink')
    rect(img, x - 11, top - 3, 23, 3, 'gold')
    rect(img, x - 11, top - 1, 23, 1, 'orange')
    rect(img, x - 2, top - 17, 5, 13, 'ink')
    rect(img, x - 1, top - 16, 3, 12, 'wood')
    for gy in range(top - 15, top - 4, 3):
        rect(img, x - 1, gy, 3, 1, 'woodD')
    rect(img, x - 3, top - 22, 7, 6, 'ink')
    rect(img, x - 2, top - 21, 5, 4, 'red')
    img.putpixel((x - 1, top - 20), c('coral'))


def brazier(img, x):
    rect(img, x - 1, GROUND - 22, 3, 22, 'night')
    rect(img, x - 6, GROUND - 25, 13, 4, 'stone')
    rect(img, x - 5, GROUND - 21, 11, 1, 'slate')
    flame = ['..y....', '.yoy.y.', '.yoooy.', 'yoorooy', '.orrro.']
    for fy, row in enumerate(flame):
        for fx, ch in enumerate(row):
            if ch != '.':
                img.putpixel((x - 3 + fx, GROUND - 30 + fy), c({'y': 'gold', 'o': 'orange', 'r': 'red'}[ch]))
    for _ in range(14):
        a, d = rnd.uniform(0, 6.28), rnd.randrange(8, 22)
        import math
        xx, yy = int(x + d * math.cos(a)), int(GROUND - 26 + d * math.sin(a) * .7)
        if 0 <= xx < W and yy < GROUND:
            img.putpixel((xx, yy), c('cream' if d < 14 else 'gold'))


def crystals(img, x):
    for dx, h in ((0, 9), (3, 13), (6, 7)):
        for i in range(h):
            for w_ in range(3 - (i * 3 // h)):
                xx = x + dx + w_
                img.putpixel((xx, GROUND - 1 - i), c('teal' if w_ else 'ice'))


def ruin_arch(img, x):
    for px_ in (x, x + 34):
        rect(img, px_, GROUND - 46, 9, 46, 'slate')
        for y in range(GROUND - 46, GROUND, 6):
            rect(img, px_, y, 9, 1, 'night')
        rect(img, px_ + 1, GROUND - 46, 2, 46, 'stone')
    rect(img, x - 2, GROUND - 52, 26, 7, 'slate')
    rect(img, x - 2, GROUND - 52, 26, 1, 'stone')
    rect(img, x, GROUND - 47, 4, 3, 'leaf')
    rect(img, x + 30, GROUND - 47, 13, 2, 'leaf')


def background():
    bg = Image.new('RGBA', (W, H), c('indigo'))
    bands = [(0, 'indigo'), (46, 'violet'), (88, 'pink'), (118, 'coral'), (140, 'orange'), (156, 'gold')]
    for i, (y0, col) in enumerate(bands):
        y1 = bands[i + 1][0] if i + 1 < len(bands) else GROUND
        dither_band(bg, y0, y1, col, bands[i + 1][1] if i + 1 < len(bands) else col)
    d = ImageDraw.Draw(bg)
    for _ in range(26):
        x, y = rnd.randrange(W), rnd.randrange(0, 60)
        bg.putpixel((x, y), c('mist' if rnd.random() < .7 else 'paper'))
    for cx, cy, cw in ((40, 62, 70), (190, 74, 54), (330, 56, 90), (110, 104, 50)):
        top, low = ('pink', 'violet') if cy < 88 else ('cream', 'coral')
        rect(bg, cx, cy, cw, 4, top)
        rect(bg, cx + 6, cy - 3, cw - 20, 3, top)
        rect(bg, cx + 14, cy - 5, cw // 3, 2, top)
        rect(bg, cx + 4, cy + 4, cw - 6, 2, low)
    d.ellipse([290, 118, 362, 190], fill=c('cream'))
    d.ellipse([296, 124, 356, 184], fill=c('paper'))
    # floating island with a ruined tower (far right)
    poly(bg, [(392, 74), (452, 74), (444, 84), (430, 96), (418, 100), (404, 90)], 'night')
    rect(bg, 392, 72, 61, 2, 'leaf')
    rect(bg, 412, 44, 14, 30, 'night')
    rect(bg, 410, 40, 18, 5, 'night')
    for tx in (410, 416, 422):
        rect(bg, tx, 36, 3, 4, 'night')
    rect(bg, 411, 45, 1, 28, 'stone')
    rect(bg, 417, 54, 3, 4, 'gold')
    # mountain ranges: far (violet), mid (night, rim lit), near hills (ink)
    ridge(bg, 160, 34, 26, 'violet', 3)
    ridge(bg, 180, 28, 22, 'night', 11, rim='stone')
    big_sword(bg, 92, GROUND - 14, 74)
    big_sword(bg, 372, GROUND - 18, 60)
    ridge(bg, 190, 14, 30, 'ink', 21)
    ruin_arch(bg, 214)
    brazier(bg, 52)
    brazier(bg, 448)
    crystals(bg, 300)
    crystals(bg, 140)
    # small swords stuck in the field
    for sx, sh, lean in ((178, 14, 1), (262, 11, -1), (412, 16, 2)):
        for i in range(sh):
            xx = sx + lean * i // sh
            bg.putpixel((xx, GROUND - 1 - i), c('mist'))
            bg.putpixel((xx + 1, GROUND - 1 - i), c('fog'))
        rect(bg, sx + lean - 2, GROUND - sh - 1, 6, 1, 'gold')
        rect(bg, sx + lean, GROUND - sh - 4, 2, 3, 'wood')
    return bg


def ground(img):
    for x in range(0, W, 16):
        img.alpha_composite(tile_grass_top(), (x, GROUND - 2))
    for y in range(GROUND + 16, H, 16):
        for x in range(0, W, 16):
            img.alpha_composite(tile_earth(), (x, y))


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
    gremlin = outlined(sprite(GREMLIN, GREMLIN_KEY))
    sword = outlined(sprite(SWORD, SWORD_KEY))
    gem = outlined(sprite(GEM, GEM_KEY))

    hx = 196
    img.alpha_composite(hero, (hx, GROUND - hero.height + 1))
    img.alpha_composite(sword, (hx + 13, GROUND - 11))
    slash(img, hx + 22, GROUND - 13)
    img.alpha_composite(chicken, (hx + 34, GROUND - chicken.height + 1))
    img.alpha_composite(chicken, (300, GROUND - chicken.height + 1))
    img.alpha_composite(gremlin, (330, GROUND - gremlin.height + 1))
    img.alpha_composite(gremlin, (395, 140 - gremlin.height + 1))
    img.alpha_composite(flip(chicken), (120, GROUND - chicken.height + 1))
    glow(img, gem, 166, GROUND - 16, 'ice')
    # enemy HP pips
    for ex, ey, f in ((hx + 34, GROUND - 22, .35), (300, GROUND - 22, 1), (330, GROUND - 21, .8), (395, 140 - 21, 1)):
        rect(img, ex + 1, ey, 16, 3, 'ink')
        rect(img, ex + 2, ey + 1, int(14 * f), 1, 'lime')
    # floating text: small numbers, big crits, short callouts
    draw_text(img, hx + 40, GROUND - 50, 'CRIT', 'gold')
    draw_text(img, hx + 40, GROUND - 41, '42', 'gold', k=2)
    draw_text(img, hx + 60, GROUND - 26, '21', 'paper')
    draw_text(img, 300, GROUND - 34, 'BOMB?', 'coral')
    draw_text(img, 154, GROUND - 30, 'RARE!', 'ice')
    # zone label (ref 03 'COURTYARD') + wave line
    draw_text(img, 6, 5, 'THE SWORD GRAVEYARD', 'paper')
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
    for spr in (sprite(HERO, HERO_KEY), sprite(CHICKEN, CHICKEN_KEY), sprite(GREMLIN, GREMLIN_KEY)):
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
    for t in (tile_grass_top(), tile_grass_top(), tile_earth()):
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
