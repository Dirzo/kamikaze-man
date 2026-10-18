"""Boss sprites, built from hard-edged shapes (no anti-aliasing) on the shared palette.

Every function returns an un-outlined RGBA image facing LEFT; build_assets.py outlines it,
flips it to face right and exports idle1, idle2 (a 1px breathe) and a white hit frame.
Sizes follow the boss hitboxes in game-src/core/12-enemies-waves.js at the 0.375 pixel scale.
"""
from PIL import Image, ImageDraw
from pixel import RGB


def C(n):
    return RGB[n] + (255,)


class P:
    """Tiny pixel painter: rect / ellipse / poly / dot in palette colours."""

    def __init__(self, w, h):
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def r(self, x, y, w, h, col):
        self.d.rectangle([x, y, x + w - 1, y + h - 1], fill=C(col))

    def e(self, x, y, w, h, col):
        self.d.ellipse([x, y, x + w - 1, y + h - 1], fill=C(col))

    def p(self, pts, col):
        self.d.polygon(pts, fill=C(col))

    def dot(self, x, y, col):
        self.im.putpixel((x, y), C(col))

    def line(self, pts, col, w=1):
        self.d.line(pts, fill=C(col), width=w)


def face(pp, x, y, skin='skin', shade='skinM', w=10, h=9, angry=True):
    pp.r(x, y, w, h, skin)
    pp.r(x + w - 2, y, 2, h, shade)
    # eyes (facing left: features on the left half)
    pp.r(x + 1, y + 3, 2, 2, 'paper')
    pp.dot(x + 1, y + 4, 'ink')
    pp.r(x + 5, y + 3, 2, 2, 'paper')
    pp.dot(x + 5, y + 4, 'ink')
    if angry:
        pp.line([(x, y + 1), (x + 3, y + 2)], 'ink')
        pp.line([(x + 4, y + 2), (x + 7, y + 1)], 'ink')
    pp.r(x + 1, y + 7, 5, 1, 'wine')


def jr():
    # CRAZY WEAPON MAN JR.: pink mohawk, goggles, apprentice smock, oversized prototype blade.
    pp = P(40, 37)
    # prototype greatsword held forward (left)
    pp.r(0, 13, 18, 4, 'mist')
    pp.r(0, 13, 18, 1, 'paper')
    pp.r(0, 16, 18, 1, 'fog')
    pp.p([(0, 13), (-3, 15), (0, 16)], 'mist')
    pp.r(17, 10, 3, 10, 'pink')
    pp.r(20, 13, 4, 3, 'woodD')
    for x in range(2, 16, 4):
        pp.dot(x, 14, 'pink')
    # head
    pp.r(14, 6, 13, 11, 'skin')
    pp.r(25, 6, 2, 11, 'skinM')
    for i, x in enumerate(range(14, 28, 3)):  # mohawk spikes
        pp.p([(x, 6), (x + 2, 6 - 3 - (i % 2) * 2), (x + 3, 6)], 'pink')
    pp.r(14, 4, 13, 3, 'pink')
    pp.r(14, 8, 12, 3, 'slate')  # goggles strap
    pp.r(15, 8, 4, 3, 'teal')
    pp.r(20, 8, 4, 3, 'teal')
    pp.dot(16, 9, 'paper')
    pp.dot(21, 9, 'paper')
    pp.r(16, 13, 6, 2, 'wine')
    pp.r(17, 13, 4, 1, 'paper')  # gritted grin
    # body: pink smock with tool belt
    pp.r(13, 17, 16, 12, 'pink')
    pp.r(26, 17, 3, 12, 'coral')
    pp.r(13, 24, 16, 2, 'woodD')
    pp.r(16, 24, 2, 2, 'gold')
    pp.r(11, 18, 3, 7, 'skin')
    pp.r(28, 18, 3, 7, 'skin')
    # legs + boots
    pp.r(15, 29, 5, 5, 'slate')
    pp.r(22, 29, 5, 5, 'slate')
    pp.r(14, 33, 7, 3, 'night')
    pp.r(21, 33, 7, 3, 'night')
    return pp.im


def bossman():
    # CRAZY BOSS MAN: guildmaster ogre-king. Crown, monocle, mustache, orange cape, ledger-scepter.
    pp = P(50, 52)
    pp.p([(18, 18), (46, 18), (49, 48), (14, 48)], 'rust')  # cape
    pp.r(18, 20, 26, 26, 'orange')
    pp.r(18, 20, 26, 2, 'gold')
    pp.r(22, 26, 18, 18, 'slate')  # plate
    pp.r(22, 26, 3, 18, 'stone')
    pp.r(30, 26, 2, 18, 'gold')  # tie-shaped gold trim
    pp.p([(28, 26), (34, 26), (31, 31)], 'gold')
    # head
    pp.r(20, 6, 20, 14, 'skin')
    pp.r(36, 6, 4, 14, 'skinM')
    pp.r(22, 10, 4, 2, 'ink')
    pp.r(29, 10, 4, 2, 'ink')
    pp.e(28, 8, 6, 6, 'gold')  # monocle ring
    pp.e(29, 9, 4, 4, 'ice')
    pp.dot(30, 11, 'ink')
    pp.r(21, 15, 14, 3, 'woodD')  # big mustache
    pp.r(19, 16, 3, 3, 'woodD')
    pp.r(34, 16, 3, 3, 'woodD')
    pp.line([(21, 8), (26, 9)], 'ink')
    # crown
    pp.r(20, 2, 20, 5, 'gold')
    for x in (20, 26, 32, 38):
        pp.p([(x, 2), (x + 1, -2), (x + 2, 2)], 'gold')
    pp.r(25, 3, 3, 3, 'red')
    pp.r(31, 3, 3, 3, 'blue')
    # ledger-scepter
    pp.r(8, 6, 3, 40, 'woodD')
    pp.r(3, 2, 13, 10, 'sand')
    pp.r(3, 2, 13, 2, 'wine')
    for y in (6, 8, 10):
        pp.r(5, y, 9, 1, 'stone')
    pp.r(12, 24, 8, 5, 'skin')  # fist on scepter
    # legs
    pp.r(22, 44, 8, 6, 'night')
    pp.r(32, 44, 8, 6, 'night')
    pp.r(20, 48, 11, 4, 'woodD')
    pp.r(31, 48, 11, 4, 'woodD')
    return pp.im


def sr():
    # CRAZY WEAPON MAN SR. (Dad): bearded smith, goggles on helmet, cyan apron, giant forge hammer.
    pp = P(48, 48)
    # hammer
    pp.r(10, 8, 3, 34, 'wood')
    pp.r(2, 2, 18, 10, 'stone')
    pp.r(2, 2, 18, 2, 'mist')
    pp.r(2, 10, 18, 2, 'slate')
    pp.r(9, 4, 4, 6, 'teal')
    # head + beard
    pp.r(18, 6, 18, 14, 'skin')
    pp.r(32, 6, 4, 14, 'skinM')
    pp.r(18, 2, 18, 6, 'slate')  # iron helmet
    pp.r(18, 2, 18, 1, 'fog')
    pp.r(20, 3, 6, 4, 'teal')  # goggles on helmet
    pp.r(28, 3, 6, 4, 'teal')
    pp.dot(21, 4, 'paper')
    pp.dot(29, 4, 'paper')
    pp.r(20, 11, 3, 2, 'ink')
    pp.r(26, 11, 3, 2, 'ink')
    pp.line([(19, 9), (23, 10)], 'ink')
    pp.line([(25, 10), (29, 9)], 'ink')
    pp.p([(17, 14), (37, 14), (34, 26), (20, 26)], 'woodD')  # beard
    pp.r(22, 15, 8, 2, 'wine')
    # body + cyan apron
    pp.r(16, 22, 24, 18, 'wine')
    pp.r(20, 24, 16, 16, 'teal')
    pp.r(20, 24, 16, 1, 'ice')
    pp.r(26, 30, 5, 4, 'pine')  # apron pocket
    pp.r(12, 22, 6, 12, 'skin')  # arm to hammer
    pp.r(12, 22, 6, 3, 'wine')
    pp.r(38, 24, 5, 12, 'skin')
    # legs + boots
    pp.r(20, 40, 7, 5, 'slate')
    pp.r(30, 40, 7, 5, 'slate')
    pp.r(18, 44, 10, 4, 'woodD')
    pp.r(29, 44, 10, 4, 'woodD')
    return pp.im


def grandma():
    # CRAZY WEAPON GRANDMA: witch hat with flowers, glasses, shawl, cookie tin, armed rolling pin.
    pp = P(46, 47)
    # rolling pin (spiked)
    pp.r(0, 18, 18, 5, 'sand')
    pp.r(0, 18, 18, 1, 'cream')
    pp.r(-2, 19, 3, 3, 'woodD')
    pp.r(17, 19, 4, 3, 'woodD')
    for x in range(2, 17, 4):
        pp.dot(x, 17, 'fog')
        pp.dot(x, 23, 'fog')
    # hat
    pp.p([(16, 13), (40, 13), (30, -1)], 'violet')
    pp.r(12, 12, 32, 3, 'violet')
    pp.r(18, 10, 20, 2, 'pink')
    pp.e(20, 8, 4, 4, 'red')
    pp.e(24, 8, 4, 4, 'gold')
    # head
    pp.r(18, 15, 18, 13, 'skin')
    pp.r(32, 15, 4, 13, 'skinM')
    pp.r(30, 13, 8, 10, 'mist')  # grey bun/hair side
    pp.r(19, 18, 5, 4, 'ink')  # glasses
    pp.r(20, 19, 3, 2, 'ice')
    pp.r(26, 18, 5, 4, 'ink')
    pp.r(27, 19, 3, 2, 'ice')
    pp.r(24, 19, 2, 1, 'ink')
    pp.r(21, 24, 7, 1, 'wine')
    pp.dot(20, 23, 'wine')
    pp.dot(28, 23, 'wine')
    # shawl + dress
    pp.p([(14, 27), (40, 27), (42, 36), (12, 36)], 'pink')
    pp.r(14, 27, 26, 2, 'coral')
    pp.r(16, 34, 22, 9, 'wine')
    pp.r(16, 34, 22, 1, 'red')
    pp.r(12, 20, 5, 9, 'skin')
    # cookie tin under the other arm
    pp.r(36, 28, 9, 7, 'blue')
    pp.r(36, 28, 9, 2, 'sky')
    pp.r(38, 31, 5, 2, 'gold')
    # feet
    pp.r(18, 43, 7, 4, 'night')
    pp.r(28, 43, 7, 4, 'night')
    return pp.im


def ceo():
    # CRAZY CEO MAN: sorcerer-king in gold plate, tall crown, purple cape, coin-orb staff.
    pp = P(54, 56)
    pp.p([(18, 18), (50, 18), (54, 54), (14, 54)], 'indigo')  # cape
    pp.r(20, 20, 28, 28, 'gold')
    pp.r(20, 20, 28, 2, 'cream')
    pp.r(44, 20, 4, 28, 'orange')
    pp.r(26, 26, 16, 14, 'cream')
    pp.e(30, 28, 8, 8, 'gold')
    pp.r(33, 30, 2, 4, 'orange')  # coin crest
    pp.r(20, 40, 28, 3, 'wine')
    # head
    pp.r(24, 7, 18, 14, 'skin')
    pp.r(38, 7, 4, 14, 'skinM')
    pp.r(26, 11, 4, 2, 'ink')
    pp.r(33, 11, 4, 2, 'ink')
    pp.line([(25, 9), (30, 10)], 'ink')
    pp.line([(32, 10), (37, 9)], 'ink')
    pp.r(27, 16, 9, 1, 'wine')
    pp.dot(36, 15, 'wine')  # smug smirk
    pp.r(24, 18, 18, 3, 'mist')  # neat beard
    # tall crown
    pp.r(23, 1, 20, 7, 'gold')
    for x in (23, 29, 35, 41):
        pp.p([(x, 1), (x + 1, -5), (x + 2, 1)], 'gold')
    pp.r(31, 2, 4, 4, 'teal')
    # coin-orb staff
    pp.r(10, 10, 3, 44, 'gold')
    pp.e(4, 0, 15, 15, 'orange')
    pp.e(6, 2, 11, 11, 'gold')
    pp.r(10, 4, 3, 7, 'orange')
    pp.r(14, 24, 8, 6, 'gold')  # gauntlet
    # legs
    pp.r(24, 48, 8, 5, 'orange')
    pp.r(36, 48, 8, 5, 'orange')
    pp.r(22, 52, 11, 4, 'woodD')
    pp.r(35, 52, 11, 4, 'woodD')
    return pp.im


def weapon():
    # THE WEAPON ITSELF: a giant floating sentient sword with an eye in the crossguard, in chains.
    pp = P(56, 58)
    # blade (point down)
    pp.p([(24, 18), (32, 18), (32, 50), (28, 57), (24, 50)], 'mist')
    pp.r(24, 18, 2, 32, 'paper')
    pp.r(30, 18, 2, 32, 'fog')
    pp.r(27, 20, 2, 28, 'stone')  # fuller
    for y in (26, 34, 42):
        pp.r(26, y, 4, 1, 'violet')  # runes
    # crossguard with the eye
    pp.r(8, 12, 40, 7, 'gold')
    pp.r(8, 12, 40, 2, 'cream')
    pp.p([(8, 12), (2, 9), (4, 16), (8, 18)], 'gold')
    pp.p([(48, 12), (54, 9), (52, 16), (48, 18)], 'gold')
    pp.e(22, 8, 12, 14, 'paper')
    pp.e(24, 10, 8, 10, 'red')
    pp.r(27, 12, 2, 6, 'ink')
    # grip + pommel
    pp.r(25, 0, 6, 10, 'woodD')
    for y in (1, 4, 7):
        pp.r(25, y, 6, 1, 'wood')
    # chains hanging off the guard
    for cx in (10, 44):
        for y in range(19, 40, 3):
            pp.r(cx, y, 2, 2, 'stone' if (y // 3) % 2 else 'fog')
    return pp.im


BOSSES = {
    'bossjr': jr,
    'bossman': bossman,
    'bosssr': sr,
    'bossgrandma': grandma,
    'bossceo': ceo,
    'bossweapon': weapon,
}
