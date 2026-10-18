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

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'next', 'assets')


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
# front arm reaching forward (attack) and pulled back (wind-up)
ARM_FWD = ('..gkkkkkbkkKsss', '..gKkkkkkbkKGg.', '..gGKkkkkkbK...')
ARM_BACK = ('.sskkkkkbkkK...', '.gGKkkkkkbkK...', '..gGKkkkkkbK...')
HURT_EYES = ('hhsssssseEsseEe', 'hhssssssseesse.')

FRAMES = {
    'idle': HERO,
    'run1': legs(HERO, RUN1),
    'run2': legs(HERO, RUN2),
    'jump': legs(HERO, JUMP),
    'fall': legs(HERO, FALL),
    'windup': arms(HERO, *ARM_BACK),
    'attack': legs(shift(arms(HERO, *ARM_FWD), 1, 14), RUN1),
    'hurt': (lambda r: r[:7] + list(HURT_EYES) + r[9:])(HERO),
    'dash': legs(shift(arms(HERO, *ARM_FWD), 1, 18), RUN1),
}
# front-hand pixel (in the 15x23 art, before the 1px outline) the weapon is held from
GRIP = {'idle': (12, 15), 'run1': (12, 15), 'run2': (12, 15), 'jump': (12, 15), 'fall': (12, 15),
        'windup': (2, 15), 'attack': (14, 15), 'hurt': (12, 15), 'dash': (14, 15)}


def main():
    os.makedirs(OUT, exist_ok=True)
    ims = [outlined(sprite(FRAMES[k], HERO_KEY)) for k in FRAMES]
    w, h = ims[0].width, ims[0].height
    strip = Image.new('RGBA', (w * len(ims), h), (0, 0, 0, 0))
    for i, im in enumerate(ims):
        strip.alpha_composite(im, (i * w, 0))
    strip.save(os.path.join(OUT, 'hero.png'))
    man = {'hero': {'w': w, 'h': h, 'frames': list(FRAMES),
                    'grip': {k: [x + 1, y + 1] for k, (x, y) in GRIP.items()}}}
    with open(os.path.join(OUT, 'next.json'), 'w') as f:
        json.dump(man, f, indent=1)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
