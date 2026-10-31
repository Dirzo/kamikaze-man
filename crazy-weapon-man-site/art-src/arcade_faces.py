"""Crazy Weapon Man's faces: expression patches laid over the face of any body frame.

The hero's head (arcade_hero.py HEAD) is the same in every frame that shows his face, only moved
about (leaning, dipping, sprinting), so instead of drawing every frame once per mood the game draws
the body and then lays one of these patches over the face (game-src/game/faces.js picks the mood).

A patch covers HEAD columns 6-17, rows 6-11 of the 20x28 art: the brow row, the eyes, the cheeks,
the mouth, the chin and one row under the chin for a dropped jaw. '.' leaves the body's own pixel,
every other letter is a colour from arcade_hero.HEX. Row 11 is mostly '.', since it is the neck.

The face looks right (three-quarter view): the far eye is columns 8-10, the near eye 12-14, the
near brow 13-16, the nose and cheek out at 15-17.
"""
from PIL import Image

from arcade_hero import RGBA, HEAD, FRAMES, SPRINT, PAD, pad

PX, PY, PW, PH = 6, 6, 12, 6  # patch origin and size in the head's art

# the plain face as drawn (the big grin): every other face starts from these rows
BASE = [row[PX:PX + PW] for row in HEAD[PY:PY + 5]] + ['.' * PW]

# brows and eyes (rows 6-7) and mouths (rows 8-11); a face is one of each
EYES = {
    'open': BASE[0:2],
    # brows pulled down hard toward the nose, the eyes narrowed under them
    'fierce': ['b2xxx44xxxx.',
               '23wwxxxwx43.'],
    # brows knotted up in the middle, eyes wide: worried
    'worry': ['b24xx44xx44.',
              '23wwx4wwx43.'],
    # squeezed shut: > <
    'squeeze': ['b2xx4444xx4.',
                '234xx4xx443.'],
    # shut for a blink (lashes along the lower lid)
    'shut': ['b2xxxx4xxxx.',
             '234xx44xx43.'],
    # pupils glancing back over his shoulder
    'glance': ['b2xxxx4xxxx.',
               '23xww4xww43.'],
    # big round eyes, brows up out of the way
    'wide': ['b24xx444xx4.',
             '23wxw4wxw43.'],
    # beaming: ^ ^
    'happy': ['b24x444x444.',
              '23x4x4x4x43.'],
    # near eye winks
    'wink': ['b2xxxx44xxx.',
             '23wwx44xx43.'],
    # knocked out: X X (the bottom of each X is drawn by the 'ko' mouth row)
    'ko': ['b2x4x4x4x44.',
           '234x444x443.'],
}
MOUTHS = {
    'grin': BASE[2:6],
    # teeth clenched: gritted
    'grit': ['344444444443',
             '3mwmwmwmm4..',
             '23mmmmmm32..',
             '............'],
    # roaring: jaw dropped, tongue
    'roar': ['344444444443',
             '3mwwwwwwm4..',
             '2mxxrrxxm2..',
             '..2mmmm2....'],
    # small worried line, the corners down
    'frown': ['344444444443',
              '344mmmm44...',
              '23m3333m32..',
              '............'],
    # panting: open, a little round
    'pant': ['344444444443',
             '344mxxm44...',
             '2333mm3332..',
             '............'],
    # a little 'o' of surprise
    'oh': ['344444444443',
           '3444mxm444..',
           '2333mmm332..',
           '............'],
    # big open laugh
    'laugh': ['344444444443',
              '3mwwwwwwm4..',
              '23mxrrxm32..',
              '...2mm2.....'],
    # a one-sided smirk, up on the near side
    'smirk': ['344444444443',
              '34444mwwm4..',
              '23333mm332..',
              '............'],
    # out cold: the bottom of the X eyes, mouth hanging open
    'ko': ['34x4x4x4x443',
           '344mxxm4....',
           '2333mm3332..',
           '............'],
}
# mood -> (eyes, mouth). game-src/game/faces.js uses these names.
FACES = {
    'grin': ('open', 'grin'),         # his usual self
    'blink': ('shut', 'grin'),
    'glance': ('glance', 'grin'),     # idle: a look back over the shoulder
    'fierce': ('fierce', 'grin'),     # sprinting, dashing: grinning into the wind
    'focus': ('fierce', 'grit'),      # swinging
    'roar': ('fierce', 'roar'),       # specials, finishers, big slams
    'ouch': ('squeeze', 'grit'),      # taking a hit
    'shock': ('wide', 'oh'),          # long falls, springs, bubbles
    'worry': ('worry', 'frown'),      # low health
    'pant': ('worry', 'pant'),        # low health, between breaths
    'wow': ('wide', 'laugh'),         # picking up a new weapon
    'smirk': ('wink', 'smirk'),       # a kill
    'joy': ('happy', 'laugh'),        # level clear
    'ko': ('ko', 'ko'),               # down and out
}


def patch(name):
    e, m = FACES[name]
    rows = EYES[e] + MOUTHS[m]
    assert len(rows) == PH and all(len(r) == PW for r in rows), name
    return rows


def anchors():
    """frame name -> [x, y] of the patch's top-left in the exported frame (after padding and the
    1px outline), or None for frames with no face (the ladder frames, seen from behind)."""
    eye = HEAD[7][PX:PX + 11]  # the open eyes: found in every frame that shows the plain head
    out = {}
    for k, rows in FRAMES.items():
        rows = rows if k in SPRINT else pad(rows)
        hit = None
        for y, r in enumerate(rows):
            x = r.find(eye)
            if x >= 0:
                hit = [x + 1, y - 1 + 1]  # +1: the outline; the eye row is the patch's second row
                break
        out[k] = hit
    return out


def build():
    """-> (strip image of every face patch, manifest {'w','h','list','at'})."""
    names = list(FACES)
    im = Image.new('RGBA', (PW * len(names), PH), (0, 0, 0, 0))
    px = im.load()
    for i, n in enumerate(names):
        for y, row in enumerate(patch(n)):
            for x, ch in enumerate(row):
                if ch in RGBA:
                    px[i * PW + x, y] = RGBA[ch]
    return im, {'w': PW, 'h': PH, 'list': names, 'at': anchors()}


if __name__ == '__main__':
    import sys
    im, man = build()
    print(man['at'])
    k = 12
    im.resize((im.width * k, im.height * k), Image.NEAREST).save(sys.argv[1] if len(sys.argv) > 1 else 'faces-preview.png')
