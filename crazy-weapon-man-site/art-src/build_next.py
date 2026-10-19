"""Exports art that only the new game (public/next/) uses to public/next/assets/.

The new game reads everything else (enemies, bosses, weapons, zones, slabs, UI frames, font
glyphs, palette) from the shared /assets/px/ export (build_assets.py).

  hero.png  frames (17x25 each, facing right), see FRAMES below; grip = front-hand pixel per frame
  next.json frame list + grip points
"""
import json
import os

from PIL import Image

from pixel import HERO, HERO_KEY, sprite, outlined

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'hero')


def legs(rows, new):
    return rows[:-4] + new


def arms(rows, r15, r16, r17):
    out = list(rows)
    out[15], out[16], out[17] = r15, r16, r17
    return out


def shift(rows, dx, upto):
    """shift rows[0:upto] right by dx (lean)."""
    out = []
    for i, r in enumerate(rows):
        if i < upto and dx > 0:
            r = ('.' * dx + r)[: len(r)]
        out.append(r)
    return out


RUN1 = ['....pppqpppq...', '...ppq....ppq..', '..ppq......ppq.', '.BbbB.....BbbB.']
RUN2 = ['....pppqpppq...', '.....ppqppq....', '.....ppqpq.....', '....BbbBbbB....']
JUMP = ['....pppqpppq...', '...ppq...ppq...', '..BbbB..BbbB...', '...............']
FALL = ['....pppqpppq...', '....ppq.ppq....', '....ppq..ppq...', '...BbbB...BbbB.']
WIDE = ['...pppqpppqq...', '..ppq.....ppq..', '.ppq.......ppq.', 'BbbB.......BbbB']
HURT_EYES = ('hhsssssseEsseEe', 'hhssssssseesse.')
BLANK = '.' * 15

# The body is drawn without arms: the game draws both arms so the hands can hold each weapon in
# its own poses (src/game/anim.js). Shoulder pixels are exported per frame.
ARMLESS = HERO[:15] + ['...kkkkkbkkK...', '...KkkkkkbkK...', '....KkkkkkbK...'] + HERO[18:]


def legs(rows, new):
    return rows[:-4] + new


def mirror_legs(rows):
    return rows[:-4] + [r[::-1] for r in rows[-4:]]


def shift(rows, dx, upto):
    """shift rows[0:upto] horizontally by dx (lean)."""
    out = []
    for i, r in enumerate(rows):
        if i < upto and dx:
            r = ('.' * dx + r)[: len(r)] if dx > 0 else (r[-dx:] + '.' * -dx)
        out.append(r)
    return out


BODY = ARMLESS
FRAMES = {
    'idle': BODY,
    'idle2': [BLANK] + BODY[0:17] + BODY[18:],  # breathing: upper body dips a pixel
    'run1': legs(BODY, RUN1),
    'run2': legs(BODY, RUN2),
    'run3': mirror_legs(legs(BODY, RUN1)),
    'jump': legs(BODY, JUMP),
    'fall': legs(BODY, FALL),
    'hurt': (lambda r: r[:7] + list(HURT_EYES) + r[9:])(legs(BODY, FALL)),
    'lean': legs(shift(BODY, 1, 18), RUN1),  # lunge / dash: upper body forward
    'back': legs(shift(BODY, -1, 18), RUN2),  # wind-up: upper body back
    'crouch': [BLANK, BLANK] + BODY[0:19] + [WIDE[0], WIDE[3]],  # heavy landing / slam
    'wide': legs(BODY, WIDE),  # planted stance
}
# shoulder pixels in the 15x23 art (back, front), before the 1px outline
SH = {'idle': ((3, 15), (11, 15)), 'idle2': ((3, 16), (11, 16)), 'lean': ((4, 15), (12, 15)),
      'back': ((2, 15), (10, 15)), 'crouch': ((3, 17), (11, 17))}


def main():
    os.makedirs(OUT, exist_ok=True)
    ims = [outlined(sprite(FRAMES[k], HERO_KEY)) for k in FRAMES]
    w, h = ims[0].width, ims[0].height
    for im in ims:
        assert (im.width, im.height) == (w, h), 'all hero frames must be the same size'
    strip = Image.new('RGBA', (w * len(ims), h), (0, 0, 0, 0))
    for i, im in enumerate(ims):
        strip.alpha_composite(im, (i * w, 0))
    strip.save(os.path.join(OUT, 'hero.png'))
    sh = {k: [[b[0] + 1, b[1] + 1], [f[0] + 1, f[1] + 1]] for k, (b, f) in
          ((k, SH.get(k, SH['idle'])) for k in FRAMES)}
    man = {'hero': {'w': w, 'h': h, 'frames': list(FRAMES), 'shoulders': sh}}
    with open(os.path.join(OUT, 'next.json'), 'w') as f:
        json.dump(man, f, indent=1)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
