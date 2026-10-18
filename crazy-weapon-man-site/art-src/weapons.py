"""Held-weapon sprites, one per weapon type, pointing right with the grip at (gx, gy).

Pixels marked A / M / Z are the tintable part (blade, head, orb): light / mid / dark. They are
exported as magenta marker colours and recoloured in game to three palette shades of the
weapon's rarity colour. Everything else is fixed palette colour.
"""
from PIL import Image
from pixel import RGB

MARK = {'A': (255, 128, 255), 'M': (255, 0, 255), 'Z': (128, 0, 128)}
KEY = {'b': 'woodD', 'B': 'wood', 'y': 'gold', 'Y': 'orange', 'k': 'night', 'K': 'slate', 'f': 'fog', 'm': 'mist',
       'w': 'paper', 'r': 'red', 'g': 'leaf', 'G': 'grass', 's': 'stone', 'R': 'wine', 'c': 'cream'}

WEAPONS = {
    'sword': ((1, 2), [
        '..y................',
        'bbyAAAAAAAAAAAAAAA.',
        'bbyMMMMMMMMMMMMMMMA',
        'bbyZZZZZZZZZZZZZZZ.',
        '..y................',
    ]),
    'dagger': ((1, 2), [
        '..y........',
        'byAAAAAAA..',
        'byMMMMMMMMA',
        'byZZZZZZZ..',
        '..y........',
    ]),
    'katana': ((2, 2), [
        '...............AAAAA..',
        'kKkKkyAAAAAAAAAMMMMMA.',
        'kKkKkyMMMMMMMMMZZZZ...',
        '.....yZZZZZZZZZ.......',
    ]),
    'nunchucks': ((1, 1), [
        'AAAAAA.........',
        'MMMMMMff.......',
        'ZZZZZZ..f......',
        '.........f.....',
        '.........AM....',
        '.........MM....',
        '.........MZ....',
        '.........ZZ....',
        '.........ZZ....',
    ]),
    'bow': ((3, 9), [
        'f.AM....',
        'f..AM...',
        'f...MZ..',
        'f...MZ..',
        'f....MZ.',
        'f....MZ.',
        'f....MZ.',
        'f...bbb.',
        'f...bbb.',
        'f...bbb.',
        'f....MZ.',
        'f....MZ.',
        'f....MZ.',
        'f...MZ..',
        'f...MZ..',
        'f..AM...',
        'f.AM....',
    ]),
    'wand': ((1, 1), [
        '.........AA.',
        'bbbbbbbbAMMA',
        'BBBBBBBBMMZZ',
        '.........ZZ.',
    ]),
    'staff': ((2, 2), [
        '..................AAA..',
        '.................AMMMA.',
        'bbbbbbbbbbbbbbbbyMMMMZ.',
        'BBBBBBBBBBBBBBBByMMMZZ.',
        '.................ZZZZ..',
    ]),
    'hammer': ((1, 5), [
        '............AAAAAA',
        '............AMMMMM',
        '............AMMMMM',
        '............MMMMMZ',
        'bbbbbbbbbbbyMMMMMZ',
        'BBBBBBBBBBByMMMMMZ',
        '............MMMMMZ',
        '............MMMMMZ',
        '............ZZZZZZ',
    ]),
    'shuriken': ((4, 4), [
        '....A....',
        '....AM...',
        '...AMZ...',
        'AMMMfMMMZ',
        '...MZZ...',
        '...ZZ....',
        '....Z....',
    ]),
    # loot drops (same tint pipeline): weapon gem and armour piece
    'drop-gem': ((3, 3), [
        '..wA...',
        '.wAAM..',
        'wAAMMMZ',
        'AAMMMMZ',
        'AMMMMZZ',
        '.MMMZZ.',
        '..MZZ..',
        '...Z...',
    ]),
    'drop-armor': ((4, 4), [
        '.AA...AA.',
        'AMMAAAMMZ',
        'AMMMMMMMZ',
        '.MMwMMMZ.',
        '.MMwMMMZ.',
        '.MMMMMMZ.',
        '.MMMMMMZ.',
        '..ZZZZZ..',
    ]),
}



def _bow(h, depth=3, thick=False, tips=False, grip='bbb'):
    """Bow facing right: string on column 0, limbs bending out to `depth`, grip in the middle."""
    import math
    w = depth + 5
    rows = []
    mid = (h - 1) / 2
    for y in range(h):
        t = y / (h - 1)
        x = 2 + round(depth * math.sin(math.pi * t))
        row = ['.'] * w
        row[0] = 'f'
        if abs(y - mid) <= 1.01:
            for i, ch in enumerate(grip):
                row[x - 1 + i] = ch
        else:
            near_end = y < 2 or y > h - 3
            row[x] = 'A' if near_end else 'M'
            row[x + 1] = 'M' if near_end else 'Z'
            if thick and not near_end:
                row[x + 2] = 'Z'
            if tips and (y == 0 or y == h - 1):
                row[x] = 'y'
                row[x + 1] = 'y'
        rows.append(''.join(row).rstrip('.') or '.')
    return ((3, h // 2), rows)


# Variants by the base word in the weapon's name (systems/36-weapon-names.js BASE). The first base
# of each type ("Sword", "Dagger", ...) uses the WEAPONS sprite above. Keys are 'type-slug'.
VARIANTS = {
    'sword-blade': ((1, 1), [
        '..y..............',
        'bbyAAAAAAAAAAAAA.',
        'bbyMMMMMMMMMMMMMA',
        '..y..............',
    ]),
    'sword-broadsword': ((1, 3), [
        '...y...............',
        '...yAAAAAAAAAAAAA..',
        'bbbyAMMMMMMMMMMMMA.',
        'bbbyMMMMMMMMMMMMMMA',
        'bbbyZZZZZZZZZZZZZZ.',
        '...yZZZZZZZZZZZZZ..',
        '...y...............',
    ]),
    'sword-longsword': ((1, 2), [
        '...y.....................',
        'bbbyAAAAAAAAAAAAAAAAAAAA.',
        'bbbyMMMMMMMMMMMMMMMMMMMMA',
        'bbbyZZZZZZZZZZZZZZZZZZZZ.',
        '...y.....................',
    ]),
    'sword-claymore': ((1, 3), [
        '....yy.......................',
        '.....yAAAAAAAAAAAAAAAAAAAA...',
        'bbbbbyMMMMMMMMMMMMMMMMMMMMMA.',
        'Kbbbbyw.MMMMMMMMMMMMMMMMMMMMA',
        'bbbbbyZZZZZZZZZZZZZZZZZZZZZZ.',
        '.....yZZZZZZZZZZZZZZZZZZZZ...',
        '....yy.......................',
    ]),
    'dagger-shiv': ((1, 1), [
        'fbfAAAA..',
        'bfbMMMMMA',
        'fbfZZZ...',
    ]),
    'dagger-dirk': ((1, 2), [
        '..Y.........',
        'bbYAAAAAAA..',
        'bbYMMMMMMMMA',
        'bbYZZZZZZZ..',
        '..Y.........',
    ]),
    'dagger-stiletto': ((1, 1), [
        '.y...........',
        'byAAAAAAAAA..',
        'byMMMMMMMMMMA',
        '.y...........',
    ]),
    'dagger-knife': ((1, 1), [
        'bbbAAAAAA.',
        'bbbMMMMMMA',
        '...ZZZZZ..',
    ]),
    'katana-nodachi': ((2, 2), [
        '.......................AAAAAA..',
        'kKkKkKkyAAAAAAAAAAAAAAAMMMMMMA.',
        'kKkKkKkyMMMMMMMMMMMMMMMZZZZZ...',
        '.......yZZZZZZZZZZZZZZZ........',
    ]),
    'katana-curved-blade': ((1, 3), [
        '.............AAA.',
        '...........AAMMMA',
        '...yAAAAAAAMMMZZ.',
        'kKkyMMMMMMMZZZ...',
        'kKkyZZZZZZZ......',
    ]),
    'katana-odachi': ((2, 2), [
        '..........................AAAA.',
        'RrRrRrRryAAAAAAAAAAAAAAAAAMMMMA',
        'RrRrRrRryMMMMMMMMMMMMMMMMMZZZ..',
        '.........ZZZZZZZZZZZZZZZZZ.....',
    ]),
    'nunchucks-flails': ((2, 0), [
        'bbbbbbbf.......',
        'BBBBBBB.f......',
        '.........f.....',
        '..........f.A..',
        '.........AMMMA.',
        '..........MMZ..',
        '.........A.Z.Z.',
    ]),
    'nunchucks-chain-sticks': ((1, 1), [
        'AAAAA......AAAAA',
        'MMMMMff..ffMMMMM',
        'ZZZZZ..ff..ZZZZZ',
    ]),
    'nunchucks-whackers': ((1, 1), [
        'AAAA...........',
        'MMMMf..........',
        'MMMM.f.........',
        'ZZZZ..f.AAAA...',
        '.......fMMMMA..',
        '........MMMMZ..',
        '........ZZZZ...',
    ]),
    'shuriken-throwing-star': ((3, 2), [
        '.A...A.',
        '..AMZ..',
        'AMMfMMZ',
        '..MZZ..',
        '.M...Z.',
    ]),
    'shuriken-star': ((4, 3), [
        '....A....',
        '...AMZ...',
        'AAAMMMZZZ',
        '.AMMfMZZ.',
        '..MMZZZ..',
        '.MZ...ZZ.',
        'MZ.....Z.',
    ]),
    'shuriken-disc': ((1, 3), [
        '..AAAA..',
        '.AM..MZ.',
        'AM....MZ',
        'AM....MZ',
        '.MZ..ZZ.',
        '..ZZZZ..',
    ]),
    'bow-longbow': _bow(23, depth=3),
    'bow-shortbow': _bow(11, depth=2),
    'bow-warbow': _bow(19, depth=4, thick=True, tips=True),
    'wand-twig': ((1, 2), [
        '.........g..',
        '......bb.gA.',
        'bbbbbb..bMMA',
        'BBBB......Z.',
    ]),
    'wand-rod': ((1, 1), [
        '..........AA.',
        'KKKKKKKKKyMMA',
        'kkkkkkkkkyMZZ',
        '..........ZZ.',
    ]),
    'wand-baton': ((1, 1), [
        '.......AA.',
        'yBBBByAMMA',
        'ybbbbyMMZZ',
        '.......ZZ.',
    ]),
    'staff-stave': ((2, 1), [
        '.....................A.',
        'bbbbbbbbBbbbbbbbbbbbAMZ',
        'BBBBBBBBbBBBBBBBBBBBMZ.',
    ]),
    'staff-scepter': ((2, 2), [
        '...............y.AAA.',
        '...............yAMMMA',
        'yyyyyyyyyyyyyyyyMMMMZ',
        'YYYYYYYYYYYYYYYyMMMZZ',
        '...............y.ZZ..',
    ]),
    'staff-walking-stick': ((2, 1), [
        '...................bbb.',
        'bbbbbbbbbbbbbbbbbbb...b',
        'BBBBBBBBBBBBBBBBBBBA..b',
        '..................AMZ.b',
        '...................Z...',
    ]),
    'hammer-maul': ((1, 4), [
        '.............AAAAAAAA',
        '.............AMMMMMMZ',
        '.............AMMMMMMZ',
        'bbbbbbbbbbbbyMMMMMMMZ',
        'BBBBBBBBBBBByMMMMMMMZ',
        '.............MMMMMMMZ',
        '.............MMMMMMMZ',
        '.............ZZZZZZZZ',
    ]),
    'hammer-mallet': ((1, 3), [
        '..........BBBBB',
        '..........MBBBM',
        'bbbbbbbbbbMBBBM',
        'BBBBBBBBBBMbbbM',
        '..........MbbbM',
        '..........bbbbb',
    ]),
    'hammer-bonker': ((1, 4), [
        '...........AAAA..',
        '..........AMMMMA.',
        '.........AMMMMMMZ',
        'bbbbbbbbbyMMwMMMZ',
        'BBBBBBBBByMMMMMMZ',
        '.........ZMMMMMZZ',
        '..........ZZZZZZ.',
    ]),
}


def weapon_image(rows):
    h, w = len(rows), max(len(r) for r in rows)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in MARK:
                px[x, y] = MARK[ch] + (255,)
            elif ch in KEY:
                px[x, y] = RGB[KEY[ch]] + (255,)
    return im
