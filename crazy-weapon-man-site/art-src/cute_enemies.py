"""Cute, clean enemy sprites with soft 32-bit style shading.

Each resident is a round chibi creature with its own colour, silhouette and prop, so you can tell
them apart at a glance: big glossy eyes, blush, a light from the top left and a coloured outline
(a darker shade of each part, never flat black). Three frames, facing right: walk1, walk2 (a
little squash-and-hop) and hit (white flash, squeezed eyes).

  python3 art-src/cute_enemies.py   writes public/assets/px/enemy-<type>.png and updates the
                                    manifest's enemy sizes. build_assets.py uses the same code.
"""
import json
import os
from PIL import Image, ImageDraw

INK = (34, 26, 52)
WHITE = (255, 255, 255)
BLUSH = (255, 128, 150)


def hexc(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


class Sprite:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.parts = Image.new('L', (w, h), 0)  # which shape owns each pixel (for outlines)
        self.n = 0

    def _shape(self, draw_fn, col, box, shade=True):
        """Fill a shape with three-tone shading lit from the top left."""
        mask = Image.new('L', (self.w, self.h), 0)
        draw_fn(ImageDraw.Draw(mask))
        col = hexc(col) if isinstance(col, str) else col
        hi, lo = mix(col, WHITE, 0.35), mix(col, INK, 0.3)
        x0, y0, x1, y1 = box
        cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, max(1, (x1 - x0) / 2), max(1, (y1 - y0) / 2)
        self.n += 1
        px, mp, pp = self.im.load(), mask.load(), self.parts.load()
        for y in range(self.h):
            for x in range(self.w):
                if mp[x, y]:
                    c = col
                    if shade:
                        t = -0.55 * (x - cx) / rx - 0.8 * (y - cy) / ry
                        c = hi if t > 0.55 else lo if t < -0.5 else col
                    px[x, y] = c + (255,)
                    pp[x, y] = self.n

    def oval(self, x0, y0, x1, y1, col, shade=True):
        self._shape(lambda d: d.ellipse((x0, y0, x1, y1), fill=255), col, (x0, y0, x1, y1), shade)

    def box(self, x0, y0, x1, y1, col, shade=True, r=0):
        self._shape(lambda d: d.rounded_rectangle((x0, y0, x1, y1), radius=r, fill=255), col, (x0, y0, x1, y1), shade)

    def poly(self, pts, col, shade=True):
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        self._shape(lambda d: d.polygon(pts, fill=255), col, (min(xs), min(ys), max(xs), max(ys)), shade)

    def outline(self):
        """Darken every pixel on the edge of its shape: soft coloured outlines."""
        px, pp = self.im.load(), self.parts.load()
        edge = []
        for y in range(self.h):
            for x in range(self.w):
                if not px[x, y][3]:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    out = not (0 <= nx < self.w and 0 <= ny < self.h) or not px[nx, ny][3]
                    if out or pp[nx, ny] > pp[x, y] and dy <= 0:
                        edge.append((x, y, out))
                        break
        for x, y, out in edge:
            px[x, y] = mix(px[x, y][:3], INK, 0.62 if out else 0.35) + (255,)

    def dot(self, x, y, col):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.im.putpixel((x, y), (hexc(col) if isinstance(col, str) else col) + (255,))

    def eyes(self, x, y, gap, hit=False, big=True, col=INK):
        """Glossy chibi eyes (left eye at x, right at x+gap) with blush below."""
        for ex in (x, x + gap):
            if hit:  # >  <  squeezed shut
                self.dot(ex, y, col); self.dot(ex + 1, y + 1, col); self.dot(ex, y + 2, col)
            else:
                for dy in range(3 if big else 2):
                    self.dot(ex, y + dy, col); self.dot(ex + 1, y + dy, col)
                self.dot(ex, y, WHITE)
        self.dot(x - 1, y + 3, BLUSH); self.dot(x + gap + 2, y + 3, BLUSH)

    def mouth(self, x, y, open_=False):
        if open_:
            self.dot(x, y, INK); self.dot(x + 1, y, INK); self.dot(x, y + 1, '#ff6f8f'); self.dot(x + 1, y + 1, '#ff6f8f')
        else:
            self.dot(x, y, INK); self.dot(x + 1, y + 1, INK); self.dot(x + 2, y, INK)


# Every design draws one frame: f 0 = stand, 1 = hop/squash, 2 = hit.
# b is the body's vertical bob (1 on the hop frame).

def stalker(s, f):  # Graveyard Bandit: a purple-hooded bean with a mask and a little dagger
    b = f == 1
    s.oval(3, 3 + b, 15, 19, '#8a5cc8')                      # hood/body
    s.oval(5, 7 + b, 13, 14, '#ffd9b8')                      # face
    s.box(5, 8 + b, 13, 9 + b, '#3a2a5c', shade=False)        # bandit mask
    s.poly([(9, 0 + b), (12, 4 + b), (6, 4 + b)], '#8a5cc8')  # hood tip
    s.box(14, 12 + b, 17, 13 + b, '#d8e0f0')                  # dagger
    s.oval(5, 17, 8, 19, '#3a2a5c'); s.oval(10, 17 - (f == 1), 13, 19 - (f == 1), '#3a2a5c')
    s.outline()
    s.eyes(7, 9 + b, 3, f == 2, big=False, col=WHITE if f != 2 else INK)
    s.mouth(8, 12 + b)


def crawler(s, f):  # Pocket Gremlin: a lime blob with huge floppy ears
    b = f == 1
    s.poly([(1, 4 + b), (5, 7 + b), (3, 10 + b)], '#7cc254'); s.poly([(15, 4 + b), (11, 7 + b), (13, 10 + b)], '#7cc254')
    s.oval(2, 5 + b, 14, 16, '#9be06a')
    s.oval(4, 14, 7, 16, '#4f8a3a'); s.oval(9, 14 - b, 12, 16 - b, '#4f8a3a')
    s.outline()
    s.eyes(5, 8 + b, 4, f == 2)
    s.mouth(7, 12 + b, open_=f == 2)


def goose(s, f):  # War Goose: round white goose, orange beak, tiny dented helmet
    b = f == 1
    s.oval(2, 9 + b, 17, 19, '#f6f4ee')                      # body
    s.oval(9, 2 + b, 17, 11 + b, '#f6f4ee')                  # head
    s.poly([(16, 6 + b), (20, 7 + b), (16, 9 + b)], '#ff9a2e')  # beak
    s.oval(9, 1 + b, 16, 5 + b, '#9aa3b8')                   # helmet
    s.poly([(2, 12 + b), (0, 10 + b), (4, 11 + b)], '#e2e0d8')  # tail
    s.box(8, 18, 9, 20, '#ff9a2e', shade=False); s.box(12, 18 - b, 13, 20 - b, '#ff9a2e', shade=False)
    s.outline()
    s.eyes(12, 5 + b, 3, f == 2, big=False)


def bombchicken(s, f):  # Bomb Chicken: a round yellow chick with a lit fuse on its head
    b = f == 1
    s.oval(2, 5 + b, 15, 17, '#ffd84a')
    s.poly([(14, 10 + b), (17, 11 + b), (14, 12 + b)], '#ff8a2c')
    s.oval(3, 10 + b, 7, 14 + b, '#ffc12a')                  # wing
    s.box(8, 1 + b, 9, 5 + b, '#7a5a3a', shade=False)        # fuse
    s.box(6, 15, 7, 18, '#ff8a2c', shade=False); s.box(10, 15 - b, 11, 18 - b, '#ff8a2c', shade=False)
    s.outline()
    s.dot(8, 0 + b, '#ffef6a' if f != 1 else '#ff6a3a'); s.dot(9, 0 + b, '#ff6a3a')
    s.eyes(9, 8 + b, 3, f == 2, big=False)


def brute(s, f):  # Axe Ogre: a big round green ogre with tusks and a tiny axe
    b = f == 1
    s.oval(2, 3 + b, 21, 21, '#6fb36a')
    s.oval(6, 15 + b, 17, 20, '#8acb7d')                     # belly
    s.box(20, 5 + b, 21, 15 + b, '#8a4f22')                  # axe handle
    s.poly([(19, 4 + b), (24, 3 + b), (24, 9 + b), (19, 8 + b)], '#c8d0e0')
    s.oval(4, 20, 9, 23, '#3e6a38'); s.oval(14, 20 - b, 19, 23 - b, '#3e6a38')
    s.outline()
    s.eyes(8, 8 + b, 5, f == 2)
    s.dot(9, 14 + b, WHITE); s.dot(15, 14 + b, WHITE)        # tusks
    s.mouth(11, 13 + b, open_=f == 2)


def wraith(s, f):  # Casserole Spirit: a pale-blue teardrop ghost carrying a little pot
    b = f == 1
    s.oval(2, 1 + b, 14, 15 + b, '#bfe4ff')
    s.poly([(2, 9 + b), (14, 9 + b), (13, 19), (10, 16 + b), (8, 19), (6, 16 + b), (3, 19)], '#bfe4ff')
    s.box(9, 12 + b, 16, 15 + b, '#ff9a5a', r=1)             # casserole
    s.outline()
    s.eyes(5, 6 + b, 4, f == 2)
    s.mouth(7, 10 + b, open_=True)


def maw(s, f):  # Hungry Chest: a wooden treasure chest with a lolling tongue
    b = f == 1
    s.box(1, 7 + b, 21, 17, '#b8743a', r=2)
    s.box(1, 1 + b - (f == 1), 21, 7 + b, '#d08a48', r=3)     # lid opens on the hop
    s.box(1, 6 + b, 21, 7 + b, '#ffc15a', shade=False)        # gold band
    s.box(9, 8 + b, 12, 11 + b, '#ffc15a')                    # lock
    s.poly([(14, 8 + b), (19, 8 + b), (18, 12 + b)], '#ff6f8f')  # tongue
    s.outline()
    s.eyes(4, 2 + b, 4, f == 2, big=False)


def flyer(s, f):  # Toothy Sky Rat: a round bat with big ears and flappy wings
    up = f != 1
    s.poly([(6, 6), (0, 1 if up else 11), (3, 9)], '#7a5ad0'); s.poly([(14, 6), (20, 1 if up else 11), (17, 9)], '#7a5ad0')
    s.oval(5, 3, 15, 13, '#9a7ae8')
    s.poly([(6, 4), (7, 0), (9, 3)], '#9a7ae8'); s.poly([(11, 3), (13, 0), (14, 4)], '#9a7ae8')
    s.outline()
    s.eyes(7, 6, 4, f == 2, big=False)
    s.dot(9, 10, WHITE); s.dot(11, 10, WHITE)                # two little fangs


def wizard(s, f):  # Grumpy Wizard: a round blue mage, starry hat, fluffy white beard
    b = f == 1
    s.oval(3, 8 + b, 15, 21, '#3f6fe0')                      # robe
    s.oval(5, 7 + b, 13, 14 + b, '#ffd9b8')                  # face
    s.oval(5, 11 + b, 13, 18 + b, '#f4f1e8')                 # beard
    s.poly([(2, 8 + b), (16, 8 + b), (10, 0 + b), (8, 1 + b)], '#2a4fb8')  # hat
    s.box(15, 6 + b, 16, 21, '#8a4f22')                       # staff
    s.outline()
    s.dot(9, 4 + b, '#ffd84a')                                 # star on the hat
    s.dot(15, 5 + b, '#ff6fb5'); s.dot(16, 5 + b, '#ff6fb5')
    s.eyes(6, 9 + b, 4, f == 2, big=False)


def taxman(s, f):  # Cursed Scribe: a round owl-like scribe in round glasses with a quill
    b = f == 1
    s.oval(2, 3 + b, 15, 19, '#c9a66b')
    s.oval(5, 9 + b, 12, 18, '#f0dcae')                      # chest
    s.poly([(3, 4 + b), (5, 0 + b), (7, 4 + b)], '#a8854e'); s.poly([(10, 4 + b), (12, 0 + b), (14, 4 + b)], '#a8854e')
    s.poly([(15, 6 + b), (18, 2 + b), (16, 10 + b)], '#ff6fb5')  # quill
    s.outline()
    s.eyes(5, 6 + b, 5, f == 2)
    for ex in (4, 9):                                          # glasses
        s.dot(ex, 5 + b, '#5d5a7a'); s.dot(ex + 3, 5 + b, '#5d5a7a')
    s.dot(9, 10 + b, '#ff9a2e')                                # beak


def mimic(s, f):  # Suspicious Weapon Drop: a living sword with a cheeky face and little feet
    b = f == 1
    s.poly([(2, 7 + b), (16, 5 + b), (21, 8 + b), (16, 11 + b), (2, 10 + b)], '#dfe6f2')  # blade
    s.box(0, 4 + b, 3, 13 + b, '#ffc15a')                    # guard
    s.oval(10, 10 + b, 13, 13, '#8a4f22'); s.oval(15, 10 + b - b, 18, 13 - b, '#8a4f22')
    s.outline()
    s.eyes(9, 6 + b, 4, f == 2, big=False)


def eyeball(s, f):  # All-Seeing Orb: a pink floating orb with one huge eye and tiny wings
    up = f != 1
    s.poly([(3, 8), (0, 4 if up else 11), (4, 11)], '#ffffff'); s.poly([(15, 8), (18, 4 if up else 11), (14, 11)], '#ffffff')
    s.oval(2, 1, 16, 16, '#ff8ac4')
    s.oval(5, 4, 13, 12, '#ffffff', shade=False)
    s.outline()
    if f == 2:
        for x in range(6, 13):
            s.dot(x, 8, INK)
    else:
        s.oval(7, 6, 11, 10, '#3bb8a8', shade=False)
        s.dot(8, 7, INK); s.dot(9, 7, INK); s.dot(8, 8, INK); s.dot(9, 8, INK); s.dot(8, 6, WHITE)
    s.dot(3, 13, BLUSH); s.dot(14, 13, BLUSH)


def shieldbro(s, f):  # Shield Knight: a round little knight helmet with a big blue shield
    b = f == 1
    s.oval(2, 2 + b, 15, 19, '#b8c0d8')                      # helmet body
    s.box(4, 8 + b, 13, 11 + b, '#2b2442', shade=False)       # visor slit
    s.poly([(8, 0 + b), (11, 0 + b), (9, 3 + b)], '#e0405a')  # plume
    s.box(12, 7 + b, 19, 18 + b, '#3f6fe0', r=3)              # shield
    s.oval(4, 17, 7, 20, '#5d5a7a'); s.oval(9, 17 - b, 12, 20 - b, '#5d5a7a')
    s.outline()
    s.dot(15, 11 + b, '#ffd84a'); s.dot(16, 12 + b, '#ffd84a'); s.dot(15, 13 + b, '#ffd84a')
    s.eyes(5, 8 + b, 4, f == 2, big=False, col=WHITE if f != 2 else '#ffd84a')


def blinker(s, f):  # Blink Imp: a little violet imp with horns and a curly tail
    b = f == 1
    s.oval(2, 4 + b, 13, 16, '#c06ae0')
    s.poly([(3, 6 + b), (2, 1 + b), (6, 5 + b)], '#ffd84a'); s.poly([(12, 6 + b), (13, 1 + b), (9, 5 + b)], '#ffd84a')
    s.poly([(2, 13 + b), (0, 10 + b), (1, 15)], '#a04ac8')    # tail
    s.oval(4, 14, 7, 17, '#8a3ab0'); s.oval(9, 14 - b, 12, 17 - b, '#8a3ab0')
    s.outline()
    s.eyes(5, 7 + b, 4, f == 2)
    s.mouth(7, 11 + b)
    s.dot(14, 2 + b, '#ffef6a'); s.dot(15, 5 + b, '#ffffff')  # sparkles


def summoner(s, f):  # Bone-Summoning Necromancer: a hooded green spook with a skull lantern
    b = f == 1
    s.oval(2, 2 + b, 15, 20, '#3f8a5c')
    s.oval(5, 6 + b, 12, 13 + b, '#1f3a2c', shade=False)      # hood shadow
    s.box(16, 4 + b, 17, 13 + b, '#5d2f14')                   # lantern pole
    s.oval(14, 12 + b, 19, 17 + b, '#f4f1e8')                 # skull lantern
    s.outline()
    s.eyes(6, 8 + b, 3, f == 2, big=False, col='#b7ff7a')
    s.dot(15, 14 + b, INK); s.dot(17, 14 + b, INK)


def sniper(s, f):  # Steve, Who Never Misses: a mushroom-cap ranger with a crossbow
    b = f == 1
    s.oval(4, 9 + b, 14, 20, '#f2e2c4')                      # stem body
    s.oval(1, 2 + b, 17, 11 + b, '#e0405a')                  # cap
    s.box(13, 13 + b, 18, 14 + b, '#8a4f22'); s.box(17, 11 + b, 18, 16 + b, '#5d5a7a')  # crossbow
    s.outline()
    for x, y in ((4, 5), (9, 3), (13, 6)):
        s.dot(x + 0, y + b, WHITE); s.dot(x + 1, y + b, WHITE)
    s.eyes(7, 12 + b, 3, f == 2, big=False)


def roller(s, f):  # Runaway Barrel Knight: a barrel in a helmet, rolling on little feet
    b = f == 1
    s.oval(2, 3 + b, 17, 17, '#b8743a')
    for y in (6, 13):
        s.box(3, y + b, 16, y + 1 + b, '#5d5a7a', shade=False)
    s.oval(4, 0 + b, 15, 6 + b, '#9aa3b8')                    # helmet
    s.oval(4, 15, 8, 18, '#5d2f14'); s.oval(11, 15 - b, 15, 18 - b, '#5d2f14')
    s.outline()
    s.eyes(7, 8 + b, 4, f == 2, big=False)


# ---- weapon-zone residents ----------------------------------------------------------------------

def squirrel(s, f):  # Acorn Archer (Ranger's Forest): a brown squirrel in a green cap with a tiny bow
    b = f == 1
    s.oval(0, 2 + b, 8, 16 + b, '#c98a4a')                    # big fluffy tail
    s.oval(2, 4 + b, 6, 12 + b, '#e8b07a')
    s.oval(5, 7 + b, 16, 19, '#b8743a')                       # body
    s.oval(7, 11 + b, 13, 18, '#f2d7b0')                      # belly
    s.poly([(7, 3 + b), (15, 3 + b), (11, 0 + b)], '#4f9a3a')  # ranger cap
    s.poly([(14, 2 + b), (18, 0 + b), (15, 4 + b)], '#e0405a', shade=False)  # feather
    s.box(16, 8 + b, 17, 16 + b, '#8a4f22')                   # bow
    s.oval(6, 17, 9, 19, '#7a4a22'); s.oval(12, 17 - b, 15, 19 - b, '#7a4a22')
    s.outline()
    s.eyes(9, 8 + b, 3, f == 2, big=False)


def turtle(s, f):  # Nunchuck Turtle (Turtle Lagoon): a green shell kid in an orange mask, nunchucks out
    b = f == 1
    s.oval(1, 6 + b, 15, 18, '#4f8a3a')                       # shell
    for x in (4, 8):
        s.box(x, 9 + b, x + 2, 10 + b, '#8acb6a', shade=False)
    s.oval(9, 2 + b, 19, 12 + b, '#9be06a')                   # head
    s.box(9, 5 + b, 19, 7 + b, '#ff8a2c', shade=False)        # mask
    s.poly([(9, 5 + b), (6, 3 + b), (7, 7 + b)], '#ff8a2c', shade=False)  # mask tails
    s.box(17, 11 + b, 18, 14 + b, '#8a4f22'); s.box(19, 14 - b, 20, 17 - b, '#8a4f22')  # nunchucks
    s.oval(3, 16, 7, 20, '#7cc254'); s.oval(10, 16 - b, 14, 20 - b, '#7cc254')
    s.outline()
    s.eyes(12, 5 + b, 4, f == 2, big=False, col=WHITE if f != 2 else INK)
    s.mouth(14, 9 + b)


def raccoon(s, f):  # Bazaar Raccoon (Thieves' Bazaar): a grey pickpocket with a loot sack and a dagger
    b = f == 1
    s.oval(0, 8 + b, 6, 16 + b, '#b8a68a')                    # loot sack
    s.oval(3, 7 + b, 15, 19, '#9aa0aa')                       # body
    s.oval(5, 1 + b, 17, 11 + b, '#b8bec8')                   # head
    s.poly([(6, 3 + b), (6, 0 + b), (9, 2 + b)], '#7a808a'); s.poly([(16, 3 + b), (16, 0 + b), (13, 2 + b)], '#7a808a')
    s.box(6, 5 + b, 16, 7 + b, '#3a3a4a', shade=False)       # robber mask
    s.box(15, 13 + b, 19, 14 + b, '#d8e0f0')                  # dagger
    s.oval(5, 17, 8, 19, '#5d5a6a'); s.oval(11, 17 - b, 14, 19 - b, '#5d5a6a')
    s.outline()
    s.eyes(8, 5 + b, 5, f == 2, big=False, col=WHITE if f != 2 else INK)
    s.dot(11, 8 + b, INK)


def samurai(s, f):  # Tiny Samurai (Sakura Shrine): a red-armoured bean in a horned helmet with a katana
    b = f == 1
    s.oval(3, 9 + b, 16, 21, '#c83a3a')                       # armour
    s.box(4, 15 + b, 15, 16 + b, '#ffd84a', shade=False)      # belt
    s.oval(5, 4 + b, 15, 13 + b, '#ffe0c0')                   # face
    s.poly([(3, 6 + b), (10, 0 + b), (17, 6 + b)], '#3a3a5a')  # kabuto
    s.poly([(7, 2 + b), (5, -1 + b), (9, 1 + b)], '#ffd84a', shade=False)
    s.poly([(13, 2 + b), (15, -1 + b), (11, 1 + b)], '#ffd84a', shade=False)
    s.box(16, 4 + b, 17, 14 + b, '#e8eef8'); s.box(15, 13 + b, 18, 14 + b, '#3a3a5a')  # katana
    s.oval(5, 19, 8, 22, '#3a3a5a'); s.oval(11, 19 - b, 14, 22 - b, '#3a3a5a')
    s.outline()
    s.eyes(8, 7 + b, 3, f == 2, big=False)
    s.mouth(9, 10 + b)


def kitsune(s, f):  # Kitsune Spirit (Sakura Shrine): a white fox with red markings that blinks around
    b = f == 1
    s.oval(0, 6 + b, 7, 14 + b, '#fff4ea'); s.oval(0, 6 + b, 3, 9 + b, '#ff8a5a')  # tail with a red tip
    s.oval(4, 7 + b, 15, 18, '#fff4ea')                       # body
    s.oval(6, 1 + b, 17, 11 + b, '#fff4ea')                   # head
    s.poly([(7, 3 + b), (7, -1 + b), (10, 2 + b)], '#fff4ea'); s.poly([(16, 3 + b), (16, -1 + b), (13, 2 + b)], '#fff4ea')
    s.poly([(15, 7 + b), (18, 8 + b), (15, 9 + b)], '#fff4ea')  # snout
    s.oval(5, 16, 8, 18, '#e8d8c8'); s.oval(11, 16 - b, 14, 18 - b, '#e8d8c8')
    s.outline()
    s.dot(8, 1 + b, '#ff6f8f'); s.dot(15, 1 + b, '#ff6f8f')
    s.dot(11, 3 + b, '#e0405a'); s.dot(12, 3 + b, '#e0405a')  # forehead mark
    s.eyes(10, 5 + b, 3, f == 2, big=False)


def monk(s, f):  # Pebble Monk (Mountain Monastery): a bald little monk in saffron robes, staff held up
    b = f == 1
    s.box(16, 1 + b, 17, 20 + b, '#8a4f22')                   # staff
    s.oval(3, 9 + b, 16, 21, '#ff9a2e')                       # robe
    s.poly([(4, 11 + b), (14, 20), (4, 20)], '#c83a3a')       # sash
    s.oval(5, 1 + b, 15, 11 + b, '#ffd9b8')                   # head
    s.oval(14, 9 + b, 18, 12 + b, '#ffd9b8')                  # hand on the staff
    s.oval(5, 19, 8, 22, '#7a4a22'); s.oval(11, 19 - b, 14, 22 - b, '#7a4a22')
    s.outline()
    s.dot(9, 2 + b, WHITE); s.dot(10, 2 + b, WHITE)            # shiny head
    s.eyes(8, 5 + b, 3, f == 2, big=False)
    s.mouth(9, 8 + b)


def ninja(s, f):  # Pocket Ninja (Ninja Castle): a navy bean with a red headband who throws stars
    b = f == 1
    s.oval(3, 3 + b, 15, 18, '#2a3a6a')                       # body and hood
    s.box(5, 7 + b, 13, 10 + b, '#ffe0c0', shade=False, r=1)  # eye slit
    s.box(3, 4 + b, 15, 5 + b, '#e0405a', shade=False)        # headband
    s.poly([(3, 4 + b), (0, 2 + b), (1, 6 + b)], '#e0405a', shade=False)
    s.poly([(16, 10 + b), (18, 12 + b), (16, 14 + b), (14, 12 + b)], '#c8d0e0')  # shuriken
    s.oval(4, 16, 7, 19, '#1a2a4a'); s.oval(11, 16 - b, 14, 19 - b, '#1a2a4a')
    s.outline()
    s.eyes(7, 8 + b, 3, f == 2, big=False)


def anvil(s, f):  # Anvil Pup (Dad's Forge): a walking anvil with a glowing ember heart and stubby legs
    b = f == 1
    s.box(1, 3 + b, 20, 7 + b, '#6a7088', r=1)                # anvil face
    s.poly([(20, 3 + b), (24, 4 + b), (20, 6 + b)], '#6a7088')  # horn
    s.box(5, 7 + b, 16, 13 + b, '#585e74')                    # waist
    s.box(3, 12 + b, 18, 15 + b, '#6a7088', r=1)              # foot
    s.oval(9, 8 + b, 12, 11 + b, '#ff8a2c')                   # ember heart
    s.oval(4, 14, 8, 17, '#3a3e4e'); s.oval(13, 14 - b, 17, 17 - b, '#3a3e4e')
    s.outline()
    s.eyes(8, 4 + b, 5, f == 2, big=False, col=WHITE if f != 2 else INK)


DESIGNS = {
    'stalker': (18, 20, stalker), 'crawler': (16, 17, crawler), 'goose': (21, 21, goose),
    'bombchicken': (18, 19, bombchicken), 'brute': (25, 24, brute), 'wraith': (17, 20, wraith),
    'maw': (23, 18, maw), 'flyer': (21, 14, flyer), 'wizard': (18, 22, wizard), 'taxman': (19, 20, taxman),
    'mimic': (22, 14, mimic), 'eyeball': (19, 17, eyeball), 'shieldbro': (20, 21, shieldbro),
    'blinker': (16, 18, blinker), 'summoner': (20, 21, summoner), 'sniper': (19, 21, sniper), 'roller': (19, 19, roller),
    'squirrel': (19, 20, squirrel), 'turtle': (21, 21, turtle), 'raccoon': (20, 20, raccoon),
    'samurai': (19, 23, samurai), 'kitsune': (19, 19, kitsune), 'monk': (19, 23, monk), 'ninja': (19, 20, ninja),
    'anvil': (25, 18, anvil),
}


def frames(etype):
    w, h, draw = DESIGNS[etype]
    out = []
    for f in range(3):
        s = Sprite(w, h)
        draw(s, f)
        im = s.im
        if f == 2:  # hit: a bright flash over the squeezed face
            px = im.load()
            for y in range(h):
                for x in range(w):
                    r, g, b_, a = px[x, y]
                    if a:
                        px[x, y] = mix((r, g, b_), WHITE, 0.55) + (a,)
        out.append(im)
    return out


def strip(ims):
    w, h = ims[0].size
    sheet = Image.new('RGBA', (w * len(ims), h), (0, 0, 0, 0))
    for i, im in enumerate(ims):
        sheet.paste(im, (i * w, 0))
    return sheet


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'px')
    man_path = os.path.join(root, 'manifest.json')
    man = json.load(open(man_path))
    for etype in DESIGNS:
        ims = frames(etype)
        strip(ims).save(os.path.join(root, f'enemy-{etype}.png'))
        man['enemies'][etype] = {'w': ims[0].width, 'h': ims[0].height, 'frames': ['walk1', 'walk2', 'hit']}
    with open(man_path, 'w') as fh:
        json.dump(man, fh, separators=(',', ':'))
    print('wrote', len(DESIGNS), 'cute enemy sheets')
