"""Full-size 32-bit style boss sprites.

Bosses are drawn at their real size (no scaled-up residents) with five-tone shading, a rim of
light on the top-left edges, soft contact shadows and coloured outlines, in the same cute style as
the residents (cute_enemies.py). Three frames, facing right: idle1, idle2 (a 1px breathe) and hit
(white flash).

  STORY    the six story bosses -> boss-<kind>.png (manifest 'bosses')
  SWARM    the giant swarm bosses of zones without a story boss -> enemy-<type>.png (manifest
           'enemies'; their stats live in game-src/data/enemies.js)

  python3 art-src/hd_bosses.py   writes them all and updates the manifest. build_assets.py uses
                                 the same code.
"""
import json
import os
from PIL import Image

from cute_enemies import Sprite, mix, hexc, INK, WHITE, BLUSH, strip


class HD(Sprite):
    """Five tones per shape instead of three, so big shapes read as smooth, rounded volumes."""

    def _shape(self, draw_fn, col, box, shade=True):
        from PIL import ImageDraw
        mask = Image.new('L', (self.w, self.h), 0)
        draw_fn(ImageDraw.Draw(mask))
        col = hexc(col) if isinstance(col, str) else col
        tones = (mix(col, WHITE, 0.5), mix(col, WHITE, 0.24), col, mix(col, INK, 0.2), mix(col, INK, 0.42))
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
                        c = tones[0] if t > 0.95 else tones[1] if t > 0.4 else tones[4] if t < -0.95 else tones[3] if t < -0.35 else col
                    px[x, y] = c + (255,)
                    pp[x, y] = self.n

    def line(self, pts, col):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(abs(x1 - x0), abs(y1 - y0), 1)
            for i in range(n + 1):
                self.dot(round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n), col)

    def finish(self):
        """Outline, then a rim of light along the top-left edge of every part."""
        self.outline()
        px = self.im.load()
        for y in range(1, self.h):
            for x in range(1, self.w):
                p = px[x, y]
                if p[3] and not px[x - 1, y][3] and not px[x, y - 1][3]:
                    continue
                if p[3] and px[x - 1, y - 1][3] == 0 and px[x, y - 1][3] and px[x - 1, y][3]:
                    px[x, y] = mix(p[:3], WHITE, 0.3) + (255,)

    def glossy_eye(self, x, y, w=3, h=4, iris='#3a2a5c', hit=False, angry=False):
        if hit:
            self.line([(x, y), (x + w - 1, y + h // 2), (x, y + h - 1)], INK)
            return
        for dy in range(h):
            for dx in range(w):
                self.dot(x + dx, y + dy, iris)
        self.dot(x, y, WHITE)
        if w > 2:
            self.dot(x + 1, y, WHITE)
        self.dot(x + w - 1, y + h - 1, mix(hexc(iris), WHITE, 0.4) if isinstance(iris, str) else iris)
        if angry:
            self.line([(x - 1, y - 2), (x + w, y - 1)], INK)


# ---------------------------------------------------------------- story bosses

def jr(s, f):  # Crazy Weapon Man Jr.: pink spiky hair, goggles, board shorts and the big sword
    b = f == 1
    s.poly([(37, 31 + b), (41, 33 + b), (53, 4 + b), (51, 1 + b), (49, 2 + b)], '#dfe7f5')        # big sword
    s.poly([(49, 2 + b), (53, 4 + b), (53, 0 + b)], '#ffffff', shade=False)
    s.box(33, 29 + b, 44, 32 + b, '#ffd84a', r=1)                                               # guard
    s.box(10, 49, 22, 54, '#ff6f8f', r=2); s.box(26, 49, 38, 54, '#ff6f8f', r=2)                 # sneakers
    s.box(16, 43, 21, 50, '#ffd9b8'); s.box(27, 43, 32, 50, '#ffd9b8')                           # legs
    s.box(13, 35 + b, 35, 46, '#2fb5b0', r=3)                                                   # board shorts
    for x in (17, 24, 31):
        s.box(x, 37 + b, x + 1, 44, '#ffd84a', shade=False)
    s.box(13, 24 + b, 35, 38 + b, '#ff6f8f', r=4)                                               # tank top
    s.oval(6, 25 + b, 15, 37 + b, '#ffd9b8')                                                    # back arm
    s.oval(31, 25 + b, 42, 34 + b, '#ffd9b8')                                                   # sword arm
    s.oval(11, 5 + b, 37, 29 + b, '#ffd9b8')                                                    # head
    s.poly([(10, 14 + b), (12, 1 + b), (17, 7 + b), (20, -1 + b), (25, 6 + b), (30, 0 + b), (32, 8 + b), (38, 3 + b), (38, 15 + b), (24, 9 + b)], '#ff5fa2')  # spiky hair
    s.box(11, 11 + b, 37, 13 + b, '#2a6a8a', shade=False)                                       # goggle strap
    s.oval(15, 9 + b, 23, 16 + b, '#5fe0d8'); s.oval(25, 9 + b, 33, 16 + b, '#5fe0d8')          # goggles
    s.finish()
    s.glossy_eye(17, 18 + b, hit=f == 2); s.glossy_eye(27, 18 + b, hit=f == 2)
    s.dot(15, 23 + b, BLUSH); s.dot(16, 23 + b, BLUSH); s.dot(32, 23 + b, BLUSH); s.dot(33, 23 + b, BLUSH)
    s.line([(21, 24 + b), (24, 26 + b), (28, 24 + b)], INK)                                     # grin
    s.dot(24, 25 + b, WHITE)


def ogre_monk(s, f):  # Ogre King Grumblefoot: a huge green ogre monk, saffron robes, beads and a ringed staff
    b = f == 1
    s.box(60, 8, 63, 71, '#8a5a2a')                                                             # staff
    s.oval(54, 0, 69, 14, '#ffd84a'); s.oval(57, 3, 66, 11, '#ffd84a')                           # ringed head
    for rx in (54, 66):
        s.oval(rx, 8, rx + 4, 14, '#ffe680')
    s.box(10, 66, 26, 71, '#7a4a22', r=2); s.box(40, 66, 56, 71, '#7a4a22', r=2)                # sandals
    s.poly([(14, 30 + b), (54, 30 + b), (64, 68), (4, 68)], '#ff9a2e')                          # robe
    s.poly([(4, 68), (64, 68), (62, 63), (6, 63)], '#e07a1e')                                    # hem
    s.poly([(14, 30 + b), (24, 30 + b), (52, 64), (42, 64)], '#c83a3a')                         # sash
    s.oval(20, 40 + b, 48, 62, '#ff9a2e')                                                       # round belly under the robe
    s.oval(2, 32 + b, 18, 54 + b, '#7cc26a'); s.oval(2, 48 + b, 14, 58 + b, '#7cc26a')          # arm resting on the belly
    s.oval(48, 30 + b, 62, 44 + b, '#7cc26a'); s.oval(54, 36 + b, 64, 46 + b, '#7cc26a')        # hand on the staff
    s.oval(10, 18 + b, 16, 28 + b, '#6fb35a'); s.oval(52, 18 + b, 58, 28 + b, '#6fb35a')        # ears
    s.oval(14, 2 + b, 54, 36 + b, '#8ad07a')                                                    # big bald head
    for i, bx in enumerate(range(16, 54, 5)):                                                   # prayer beads
        by = 34 + b + round(4 * (1 - ((bx - 34) / 19) ** 2))
        s.oval(bx, by, bx + 4, by + 4, '#7a3a1a' if i % 3 else '#ffd84a')
    s.finish()
    s.oval(24, 4 + b, 30, 8 + b, '#d8f5c8', shade=False)                                        # head shine
    s.oval(32, 10 + b, 36, 14 + b, '#ff4a4a', shade=False)                                      # forehead mark
    if f == 2:
        s.glossy_eye(23, 17 + b, hit=True); s.glossy_eye(40, 17 + b, hit=True)
    else:                                                                                       # serene closed eyes, stern brows
        s.line([(22, 19 + b), (24, 20 + b), (27, 19 + b)], INK); s.line([(39, 19 + b), (42, 20 + b), (44, 19 + b)], INK)
        s.line([(21, 15 + b), (28, 16 + b)], INK); s.line([(38, 16 + b), (45, 15 + b)], INK)
    s.oval(29, 19 + b, 37, 26 + b, '#6fb35a')                                                   # nose
    s.line([(26, 30 + b), (41, 30 + b)], INK)                                                   # mouth
    s.poly([(27, 30 + b), (29, 30 + b), (28, 26 + b)], WHITE, shade=False); s.poly([(38, 30 + b), (40, 30 + b), (39, 26 + b)], WHITE, shade=False)  # tusks


def dad(s, f):  # Crazy Weapon Man Sr.: beard, forge goggles, apron, rolled sleeves and a sledgehammer
    b = f == 1
    s.box(50, 12, 53, 64, '#8a5a2a')                                                            # handle
    s.box(40, 1, 62, 14, '#8a92a8', r=2); s.box(40, 1, 44, 14, '#6a7088')                       # hammer head
    s.box(12, 58, 28, 65, '#3a2e2a', r=2); s.box(32, 58, 48, 65, '#3a2e2a', r=2)                # boots
    s.box(15, 46, 27, 60, '#6a4a32'); s.box(33, 46, 45, 60, '#6a4a32')                          # trousers
    s.box(12, 26 + b, 48, 50, '#8a2a3a', r=4)                                                   # shirt
    s.box(17, 30 + b, 43, 54, '#2fa59a', r=2)                                                   # apron
    s.box(25, 38 + b, 35, 45 + b, '#24857c', r=1)                                               # pocket
    s.oval(4, 28 + b, 16, 48 + b, '#f2c9a0')                                                    # forearm
    s.oval(42, 26 + b, 56, 40 + b, '#f2c9a0')                                                   # fist on the handle
    s.oval(14, 2 + b, 46, 32 + b, '#f2c9a0')                                                    # head
    s.poly([(14, 10 + b), (20, 2 + b), (40, 1 + b), (46, 10 + b), (44, 7 + b), (16, 7 + b)], '#6a4a2a')  # hair
    s.poly([(14, 18 + b), (46, 18 + b), (42, 36 + b), (30, 40 + b), (18, 36 + b)], '#7a5032')   # big beard
    s.finish()
    s.box(15, 8 + b, 45, 10 + b, '#2a3a4a', shade=False)                                        # goggle strap
    s.oval(18, 6 + b, 27, 12 + b, '#5fe0d8', shade=False); s.oval(33, 6 + b, 42, 12 + b, '#5fe0d8', shade=False)
    s.glossy_eye(21, 14 + b, hit=f == 2, angry=True); s.glossy_eye(36, 14 + b, hit=f == 2, angry=True)
    s.oval(26, 18 + b, 34, 23 + b, '#e8b088')                                                   # nose
    s.line([(22, 25 + b), (30, 23 + b), (38, 25 + b)], '#5a3a22')                               # mustache


def grandma(s, f):  # Grandma, Armed: witch hat, round glasses, pink cardigan, a wand and a casserole
    b = f == 1
    s.box(14, 56, 24, 61, '#5a2a3a', r=2); s.box(30, 56, 40, 61, '#5a2a3a', r=2)                # shoes
    s.poly([(12, 46 + b), (44, 46 + b), (48, 58), (8, 58)], '#8a2a4a')                          # skirt
    s.box(12, 32 + b, 44, 50, '#ff8ab0', r=5)                                                   # cardigan
    for y in (37, 42, 47):
        s.oval(27, y + b, 29, y + 2 + b, '#ffe0f0', shade=False)                                 # buttons
    s.box(0, 38 + b, 16, 45 + b, '#4a7ad8', r=2); s.box(2, 34 + b, 14, 39 + b, '#e8eef8', r=2)  # casserole and lid
    s.oval(42, 34 + b, 50, 42 + b, '#ffe0c8')                                                   # wand hand
    s.line([(47, 36 + b), (55, 20 + b)], '#7a4a22'); s.line([(48, 36 + b), (56, 20 + b)], '#7a4a22')  # wand
    s.oval(12, 16 + b, 22, 30 + b, '#dfe3ee'); s.oval(34, 16 + b, 44, 30 + b, '#dfe3ee')        # grey curls
    s.oval(15, 14 + b, 41, 38 + b, '#ffe0c8')                                                   # face
    s.oval(6, 12 + b, 50, 20 + b, '#6a3ab8')                                                    # hat brim
    s.poly([(14, 15 + b), (42, 15 + b), (38, 4 + b), (30, -1 + b), (24, 2 + b)], '#7a4bc2')     # hat
    s.finish()
    s.box(15, 12 + b, 41, 13 + b, '#ffd84a', shade=False)                                       # hat band
    s.poly([(53, 16 + b), (56, 20 + b), (59, 17 + b), (57, 21 + b), (59, 24 + b), (56, 22 + b), (53, 24 + b), (55, 21 + b)], '#ffe680', shade=False)  # wand star
    for ex in (19, 31):                                                                         # round glasses
        s.line([(ex, 21 + b), (ex + 5, 21 + b), (ex + 6, 23 + b), (ex + 5, 26 + b), (ex, 26 + b), (ex - 1, 23 + b), (ex, 21 + b)], '#5a5a7a')
    s.line([(26, 22 + b), (30, 22 + b)], '#5a5a7a')
    s.glossy_eye(21, 22 + b, w=2, h=3, hit=f == 2); s.glossy_eye(33, 22 + b, w=2, h=3, hit=f == 2)
    s.dot(18, 29 + b, BLUSH); s.dot(19, 29 + b, BLUSH); s.dot(37, 29 + b, BLUSH); s.dot(38, 29 + b, BLUSH)
    s.line([(24, 31 + b), (28, 33 + b), (32, 31 + b)], INK)


def usurper(s, f):  # The Usurper Ninja Lord: a hooded ninja in navy with a crown, red headband and a giant shuriken
    b = f == 1
    s.poly([(14, 10 + b), (2, 4 + b), (4, 8 + b), (14, 14 + b)], '#e0405a')                    # headband tails
    s.poly([(12, 16 + b), (0, 16 + b), (3, 19 + b), (12, 19 + b)], '#e0405a')
    s.box(14, 62, 28, 70, '#1a1a3a', r=2); s.box(34, 62, 48, 70, '#1a1a3a', r=2)                # tabi
    s.poly([(15, 50), (29, 50), (28, 63), (16, 63)], '#2a3466'); s.poly([(33, 50), (47, 50), (46, 63), (34, 63)], '#2a3466')  # legs
    s.box(12, 30 + b, 50, 54, '#2a3466', r=5)                                                   # ninja suit
    s.poly([(12, 34 + b), (31, 54), (24, 54), (12, 42 + b)], '#3a4a8a')                         # wrap fold
    s.box(12, 46, 50, 50, '#c8282e', r=1); s.box(28, 45, 34, 51, '#ffd84a', r=1)                # sash and gold buckle
    s.box(4, 30 + b, 16, 46 + b, '#2a3466', r=4)                                                # back arm
    s.oval(46, 22 + b, 58, 34 + b, '#2a3466')                                                   # arm raised with the star
    s.poly([(58, 2 + b), (62, 12 + b), (72, 16 + b), (62, 20 + b), (58, 30 + b), (54, 20 + b), (44, 16 + b), (54, 12 + b)], '#c8d0e0')  # giant shuriken
    s.oval(54, 12 + b, 62, 20 + b, '#6a7088')
    s.oval(14, 6 + b, 48, 36 + b, '#2a3466')                                                    # hood
    s.box(18, 17 + b, 44, 26 + b, '#ffe0c0', r=3)                                               # eye slit
    s.box(14, 10 + b, 48, 14 + b, '#e0405a', r=1)                                               # headband
    s.poly([(22, 7 + b), (23, -1 + b), (27, 4 + b), (31, -3 + b), (35, 4 + b), (39, -1 + b), (40, 7 + b)], '#ffd84a')  # stolen crown
    s.finish()
    s.oval(29, 2 + b, 33, 6 + b, '#5fe0d8', shade=False)                                        # crown gem
    s.glossy_eye(23, 20 + b, hit=f == 2, angry=True); s.glossy_eye(36, 20 + b, hit=f == 2, angry=True)
    s.line([(20, 18 + b), (27, 20 + b)], INK); s.line([(35, 20 + b), (42, 18 + b)], INK)        # sharp scowl


def armory(s, f):  # The Sentient Armory: a giant living sword with an angry eye and chained weapons
    b = f == 1
    s.line([(9, 18 + b), (9, 40 + b)], '#6a6a8a'); s.line([(61, 18 + b), (61, 44 + b)], '#6a6a8a')  # chains
    for y in range(20, 40, 4):
        s.dot(8, y + b, '#9a9ab8'); s.dot(60, y + 2 + b, '#9a9ab8')
    s.poly([(5, 40 + b), (13, 40 + b), (9, 52 + b)], '#c8d0e0')                                 # dangling dagger
    s.box(55, 44 + b, 67, 50 + b, '#8a92a8', r=1); s.box(60, 50 + b, 62, 56 + b, '#8a5a2a')     # dangling hammer
    s.poly([(28, 18 + b), (42, 18 + b), (40, 66 + b), (35, 75), (30, 66 + b)], '#dfe7f5')       # blade
    s.poly([(35, 20 + b), (37, 20 + b), (36, 70 + b)], '#a8b4c8', shade=False)                  # fuller
    s.box(31, 0 + b, 39, 10 + b, '#5a3a8a', r=2)                                                # grip
    s.oval(30, -1 + b, 40, 5 + b, '#ffd84a')                                                    # pommel
    s.poly([(4, 12 + b), (66, 12 + b), (62, 20 + b), (8, 20 + b)], '#f0c040')                  # crossguard
    s.oval(0, 8 + b, 9, 17 + b, '#ffd84a'); s.oval(61, 8 + b, 70, 17 + b, '#ffd84a')            # curled ends
    s.oval(26, 8 + b, 44, 26 + b, '#ffd84a')                                                    # eye socket
    s.finish()
    for y in (32, 42, 52, 60):
        s.box(34, y + b, 37, y + 2 + b, '#b07ae8', shade=False)                                 # glowing runes
    if f == 2:
        s.line([(31, 15 + b), (39, 17 + b), (31, 19 + b)], INK)
    else:
        s.oval(29, 11 + b, 41, 23 + b, WHITE, shade=False)
        s.oval(32, 13 + b, 39, 21 + b, '#e0303a', shade=False)
        s.oval(34, 15 + b, 37, 19 + b, INK, shade=False)
        s.dot(33, 14 + b, WHITE); s.dot(34, 14 + b, WHITE)
        s.line([(27, 9 + b), (43, 12 + b)], INK); s.line([(27, 10 + b), (43, 13 + b)], INK)     # furious lid


STORY = {
    'bossjr': (55, 55, jr), 'bossman': (70, 72, ogre_monk), 'bosssr': (63, 66, dad),
    'bossgrandma': (60, 62, grandma), 'bossceo': (73, 71, usurper), 'bossweapon': (71, 76, armory),
}


# ---------------------------------------------------------------- swarm bosses

def mother_goose(s, f):  # Mother Goose of the Graves: a towering goose queen with a crown helm and a sword
    b = f == 1
    s.poly([(42, 30 + b), (45, 31 + b), (56, 6 + b), (53, 5 + b)], '#dfe7f5')                   # sword under the wing
    s.box(38, 28 + b, 48, 31 + b, '#ffd84a', r=1)
    s.box(18, 52, 21, 58, '#ff9a2e'); s.box(30, 52 - b, 33, 58 - b, '#ff9a2e')                  # legs
    s.oval(13, 55, 24, 58, '#ff9a2e'); s.oval(26, 55 - b, 37, 58 - b, '#ff9a2e')                 # feet
    s.poly([(2, 30 + b), (0, 22 + b), (10, 28 + b)], '#e8e4da')                                 # tail
    s.oval(2, 24 + b, 46, 56, '#f6f4ee')                                                        # body
    s.oval(8, 32 + b, 34, 48 + b, '#e6e2d8')                                                    # wing
    s.box(28, 10 + b, 38, 32 + b, '#f6f4ee', r=4)                                               # neck
    s.oval(24, 2 + b, 46, 20 + b, '#f6f4ee')                                                    # head
    s.poly([(44, 10 + b), (56, 12 + b), (55, 15 + b), (44, 16 + b)], '#ff9a2e')                 # beak
    s.oval(25, 3 + b, 43, 9 + b, '#9aa3b8')                                                     # helm
    s.poly([(26, 5 + b), (26, 0 + b), (30, 3 + b), (34, 0 + b), (38, 3 + b), (42, 0 + b), (42, 5 + b)], '#ffd84a')  # crown
    s.finish()
    s.glossy_eye(36, 10 + b, hit=f == 2, angry=True)
    s.line([(45, 14 + b), (54, 13 + b)], '#c86a1e')
    s.dot(33, 15 + b, BLUSH); s.dot(34, 15 + b, BLUSH)


def acorn_king(s, f):  # The Acorn Archer King: a big squirrel ranger with a leaf crown and a longbow
    b = f == 1
    s.oval(0, 6 + b, 22, 44 + b, '#c9874a'); s.oval(4, 10 + b, 16, 38 + b, '#e8b07a')          # fluffy tail
    for y in (14, 22, 30):
        s.line([(4, y + b), (16, y + 3 + b)], '#a8642a')
    s.box(10, 6 + b, 16, 30 + b, '#7a4a22', r=2)                                                # quiver
    for x in (11, 13, 15):
        s.line([(x, 2 + b), (x, 6 + b)], '#e8eef8'); s.dot(x, 1 + b, '#e0405a')
    s.oval(14, 52, 26, 58, '#7a4a22'); s.oval(32, 52 - b, 44, 58 - b, '#7a4a22')               # feet
    s.oval(12, 20 + b, 46, 56, '#b8743a')                                                       # body
    s.oval(20, 30 + b, 40, 54, '#f2d7b0')                                                       # belly
    s.poly([(12, 22 + b), (46, 22 + b), (48, 44 + b), (10, 44 + b)], '#3f8a3a')                 # ranger cape
    s.oval(16, 2 + b, 46, 28 + b, '#c9874a')                                                    # head
    s.poly([(18, 6 + b), (18, -2 + b) if b else (18, 0), (24, 4 + b)], '#c9874a'); s.poly([(44, 6 + b), (44, 0 + b), (38, 4 + b)], '#c9874a')  # ears
    s.oval(30, 14 + b, 44, 24 + b, '#f2d7b0')                                                   # muzzle
    s.poly([(18, 6 + b), (22, 0 + b), (27, 5 + b), (31, -1 + b), (35, 5 + b), (40, 0 + b), (44, 6 + b)], '#7cc254')  # leaf crown
    s.poly([(50, 4 + b), (55, 26 + b), (50, 50 + b), (52, 50 + b), (57, 26 + b), (52, 4 + b)], '#8a4f22')  # longbow
    s.line([(51, 5 + b), (51, 49 + b)], '#f2e2c4')
    s.oval(44, 24 + b, 52, 32 + b, '#c9874a')                                                   # paw on the bow
    s.finish()
    s.glossy_eye(27, 11 + b, hit=f == 2, angry=True); s.glossy_eye(37, 11 + b, hit=f == 2, angry=True)
    s.oval(39, 15 + b, 43, 18 + b, INK, shade=False)
    s.line([(34, 21 + b), (37, 22 + b), (40, 21 + b)], INK)
    s.box(36, 22 + b, 37, 24 + b, WHITE, shade=False)                                           # buck teeth


def kingpin(s, f):  # The Raccoon Kingpin: a fat raccoon boss with a top hat, gold chain and a loot sack
    b = f == 1
    s.oval(0, 14 + b, 18, 36 + b, '#c8b08a'); s.box(6, 12 + b, 12, 16 + b, '#8a6a4a')           # loot sack
    s.oval(2, 20 + b, 4, 22 + b, '#ffd84a', shade=False)
    s.oval(12, 50, 24, 56, '#4a4a5a'); s.oval(32, 50 - b, 44, 56 - b, '#4a4a5a')                # feet
    for x, y in ((46, 30), (49, 36), (51, 43)):                                                 # striped tail
        s.oval(x, y + b, x + 7, y + 7 + b, '#5a5a6a' if (x // 3) % 2 else '#b8bec8')
    s.oval(8, 20 + b, 50, 55, '#9aa0aa')                                                        # round body
    s.oval(18, 30 + b, 40, 53, '#d0d4dc')                                                       # belly
    s.oval(12, 6 + b, 44, 30 + b, '#b8bec8')                                                    # head
    s.poly([(13, 10 + b), (14, 2 + b), (20, 8 + b)], '#7a808a'); s.poly([(43, 10 + b), (42, 2 + b), (36, 8 + b)], '#7a808a')  # ears
    s.box(19, 0, 37, 9 + b, '#2a2a3a', r=1); s.box(14, 8 + b, 42, 11 + b, '#2a2a3a', r=1)        # tall top hat
    s.box(19, 6 + b, 37, 7 + b, '#c83a3a', shade=False)                                         # hat band
    s.oval(40, 34 + b, 48, 42 + b, '#9aa0aa')                                                   # paw
    s.poly([(46, 38 + b), (55, 32 + b), (56, 34 + b), (47, 40 + b)], '#dfe7f5')                 # dagger
    s.finish()
    s.box(14, 13 + b, 42, 18 + b, '#2a2a3a', shade=False)                                       # robber mask
    s.glossy_eye(20, 14 + b, iris='#ffffff', hit=f == 2, angry=True); s.glossy_eye(33, 14 + b, iris='#ffffff', hit=f == 2, angry=True)
    s.line([(32, 12 + b), (37, 12 + b), (38, 17 + b), (32, 18 + b), (31, 13 + b)], '#ffd84a')   # monocle
    s.oval(26, 19 + b, 30, 22 + b, INK, shade=False)                                            # nose
    s.line([(22, 25 + b), (28, 27 + b), (34, 25 + b)], INK)
    s.dot(30, 26 + b, '#ffd84a')                                                                # gold tooth
    s.line([(16, 30 + b), (22, 36 + b), (28, 38 + b), (34, 36 + b), (40, 30 + b)], '#ffd84a')   # gold chain
    s.oval(26, 36 + b, 31, 41 + b, '#ffd84a', shade=False)


def shogun(s, f):  # The Petal Shogun: broad armoured warlord, demon mask, a nodachi longer than he is
    b = f == 1
    y = 8 + b
    s.poly([(36, y + 18), (40, y + 20), (51, y - 6), (49, y - 8), (47, y - 8)], '#e8eef8')       # nodachi
    s.poly([(47, y - 8), (51, y - 6), (51, y - 9)], '#ffffff', shade=False)
    s.box(32, y + 17, 40, y + 19, '#ffd84a')                                                    # tsuba
    s.poly([(30, y + 25), (33, y + 26), (36, y + 19), (33, y + 18)], '#3a2a5c')                  # grip
    s.poly([(12, y + 26), (32, y + 26), (37, 47), (7, 47)], '#3a2a5c')                          # hakama
    s.oval(7, 44, 15, 48, '#22183a'); s.oval(28, 44 - b, 36, 48 - b, '#22183a')
    s.poly([(12, y + 4), (32, y + 4), (37, y + 13), (7, y + 13)], '#3a3a5a')                    # neck guard
    s.box(12, y + 14, 32, y + 28, '#b8282e', r=2)                                               # chest armour
    for ly in (y + 18, y + 22, y + 26):
        s.box(13, ly, 31, ly, '#ffd84a', shade=False)
    s.box(3, y + 12, 14, y + 25, '#8a1c22', r=1); s.box(30, y + 12, 41, y + 25, '#8a1c22', r=1)  # shoulder plates
    for ly in (y + 16, y + 20):
        s.box(4, ly, 13, ly, '#ffd84a', shade=False); s.box(31, ly, 40, ly, '#ffd84a', shade=False)
    s.oval(32, y + 20, 37, y + 25, '#ffe0c0')                                                   # fist
    s.oval(14, y + 1, 30, y + 16, '#ffe0c0')                                                    # face
    s.poly([(13, y + 4), (31, y + 4), (28, y - 2), (16, y - 2)], '#2a2a4a')                     # helmet
    s.box(12, y + 3, 32, y + 4, '#ffd84a', shade=False)
    s.poly([(22, y - 1), (9, y - 9), (13, y - 9), (22, y - 4), (31, y - 9), (35, y - 9)], '#ffd84a')  # crescent crest
    s.oval(20, y - 3, 24, y + 1, '#ff3a3a')
    s.poly([(15, y + 11), (29, y + 11), (27, y + 17), (17, y + 17)], '#c8282e')                 # demon mask
    s.finish()
    for i in range(5):                                                                          # furious brows
        s.dot(15 + i, y + 5 + i // 2, INK); s.dot(29 - i, y + 5 + i // 2, INK)
    if f == 2:
        for ex in (17, 25):
            s.dot(ex, y + 8, INK); s.dot(ex + 1, y + 9, INK); s.dot(ex, y + 10, INK)
    else:
        for ex in (17, 25):
            s.dot(ex, y + 8, '#ff3a3a'); s.dot(ex + 1, y + 8, '#ff3a3a'); s.dot(ex, y + 9, '#ffd84a'); s.dot(ex + 1, y + 9, '#ff3a3a')
    for x in range(18, 27):
        s.dot(x, y + 14, INK)
    for x in (18, 20, 24, 26):
        s.dot(x, y + 13, WHITE)
    s.dot(19, y + 15, WHITE); s.dot(25, y + 15, WHITE)


SWARM = {
    'mothergoose': (58, 59, mother_goose), 'acornking': (59, 59, acorn_king),
    'kingpin': (59, 57, kingpin), 'shogun': (52, 49, shogun),
}


def frames(draw, w, h):
    out = []
    for f in range(3):
        s = HD(w, h)
        draw(s, f)
        im = s.im
        if f == 2:
            px = im.load()
            for y in range(h):
                for x in range(w):
                    r, g, b_, a = px[x, y]
                    if a:
                        px[x, y] = mix((r, g, b_), WHITE, 0.6) + (a,)
        out.append(im)
    return out


def build(out, man):
    man.setdefault('bosses', {})
    for kind, (w, h, draw) in STORY.items():
        ims = frames(draw, w, h)
        strip(ims).save(os.path.join(out, f'boss-{kind}.png'))
        man['bosses'][kind] = {'w': w, 'h': h, 'frames': ['idle1', 'idle2', 'hit']}
    for etype, (w, h, draw) in SWARM.items():
        ims = frames(draw, w, h)
        strip(ims).save(os.path.join(out, f'enemy-{etype}.png'))
        man['enemies'][etype] = {'w': w, 'h': h, 'frames': ['walk1', 'walk2', 'hit']}


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'px')
    path = os.path.join(root, 'manifest.json')
    man = json.load(open(path))
    build(root, man)
    with open(path, 'w') as fh:
        json.dump(man, fh, separators=(',', ':'))
    print('wrote', len(STORY), 'story bosses and', len(SWARM), 'swarm bosses')
