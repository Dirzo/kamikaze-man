"""Held-weapon sprites, one per weapon type, pointing right with the grip at (gx, gy).

Pixels marked A / M / Z are the tintable part (blade, head, orb): light / mid / dark. They are
exported as magenta marker colours and recoloured in game to three palette shades of the
weapon's rarity colour. Everything else is fixed palette colour.
"""
from PIL import Image
from pixel import RGB

MARK = {'A': (255, 128, 255), 'M': (255, 0, 255), 'Z': (128, 0, 128)}
KEY = {'b': 'woodD', 'B': 'wood', 'y': 'gold', 'Y': 'orange', 'k': 'night', 'K': 'slate', 'f': 'fog', 'm': 'mist',
       'w': 'paper', 'r': 'red'}

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
