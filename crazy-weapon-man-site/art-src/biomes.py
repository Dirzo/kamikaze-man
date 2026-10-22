"""Living zone environments: every zone dressed for its beastkin family, MapleStory style.

Each zone gets
  bgl-<zone>-<n>.png   four parallax layers, 480x270, tileable left to right:
                       0 sky (never scrolls), 1 far, 2 mid, 3 near (scroll faster and faster)
  biome-<zone>.png     an atlas: the ground body tile, its top lip, the cave roof edge, the pit,
                       special surfaces (ice, conveyor belts) and the animated props that stand
                       along the route (frames side by side)
  slab-<zone>.png      the floating ledge 3-slice (replaces the old one)
  bg-<zone>.png        all layers flattened over a ground band, for the title, the overworld
                       thumbnails and anything else that still wants one picture
The game side (game-src/game/ambience.js, data/biomes.js) scrolls the layers, scatters the props,
animates them and adds the weather.

  python3 art-src/biomes.py      writes the files into public/assets/px and updates the manifest
"""
import json
import math
import os
import random
from PIL import Image, ImageDraw

W, H, GROUND = 480, 270, 206
TILE = 64  # ground body tile size
# points on the layers the game animates from (a chimney's smoke, a coin mountain's avalanche):
# zone -> {name: [layer, x, y, ...]}, filled in by the art modules as they draw
ANCHORS = {}


# ---------------------------------------------------------------- colour and drawing helpers
def C(h, a=255):
    if isinstance(h, tuple):
        return h if len(h) == 4 else h + (a,)
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (a,)


def mix(a, b, t):
    a, b = C(a), C(b)
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)


BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def sky(img, stops, y_end=H, steps_per=3):
    """Banded vertical gradient through (y, colour) stops, with a 4x4 ordered dither between bands."""
    px = img.load()
    stops = stops + [(y_end, stops[-1][1])]
    for (y0, a), (y1, b) in zip(stops, stops[1:]):
        for y in range(y0, min(y1, img.height)):
            t = (y - y0) / max(1, y1 - y0)
            # quantise to steps_per bands, dither the fraction between them
            f = t * steps_per
            lo = math.floor(f)
            frac = f - lo
            for x in range(img.width):
                k = lo + (1 if frac * 16 > BAYER[y % 4][x % 4] else 0)
                px[x, y] = mix(a, b, min(1, k / steps_per))


def wave(seed, amps, ks=None):
    """A smooth profile that wraps around the 480px width: sum of sines with whole periods."""
    r = random.Random(seed)
    ks = ks or [1, 2, 3, 5, 7][:len(amps)]
    ph = [r.random() * math.tau for _ in amps]
    return lambda x: sum(a * math.sin(math.tau * k * x / W + p) for a, k, p in zip(amps, ks, ph))


def profile(img, top, col, edge=None, edge2=None, shade=None, y_end=H):
    """Fill from top(x) down. edge: 1px highlight row, shade: (colour, every) vertical streaks."""
    d = ImageDraw.Draw(img)
    for x in range(img.width):
        y = round(top(x))
        if y >= y_end:
            continue
        d.line([(x, max(0, y)), (x, y_end - 1)], fill=C(col))
        if edge:
            img.putpixel((x, max(0, y)), C(edge))
        if edge2 and y + 1 < y_end:
            img.putpixel((x, max(0, y + 1)), C(edge2))
        if shade and x % shade[1] == 0 and y + 3 < y_end:
            d.line([(x, y + 3), (x, min(y_end - 1, y + 3 + shade[2]))], fill=C(shade[0]))


def wrap(fn, x, *a, **k):
    """Draw something at x and at x +- W, so it wraps seamlessly when the layer tiles."""
    for dx in (-W, 0, W):
        fn(x + dx, *a, **k)


def outline(im, col='#1a1428', diagonal=False):
    """1px outline around every opaque pixel (the image grows by 1 on each side)."""
    w, h = im.size
    out = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0))
    src, o = im.load(), out.load()
    nb = [(-1, 0), (1, 0), (0, -1), (0, 1)] + ([(-1, -1), (1, -1), (-1, 1), (1, 1)] if diagonal else [])
    for y in range(h):
        for x in range(w):
            if src[x, y][3]:
                for dx, dy in nb:
                    o[x + 1 + dx, y + 1 + dy] = C(col)
    for y in range(h):
        for x in range(w):
            if src[x, y][3]:
                o[x + 1, y + 1] = src[x, y]
    return out


def canvas(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def disc(d, x, y, r, col, out=None):
    d.ellipse([x - r, y - r, x + r, y + r], fill=C(col), outline=C(out) if out else None)


def box(d, x0, y0, x1, y1, col, out=None):
    d.rectangle([x0, y0, x1, y1], fill=C(col), outline=C(out) if out else None)


def dots(img, r, n, cols, y0, y1, x0=0, x1=None):
    x1 = img.width if x1 is None else x1
    for _ in range(n):
        img.putpixel((r.randrange(x0, x1), r.randrange(y0, y1)), C(r.choice(cols)))


def tint(im, col, a):
    """Blend every opaque pixel toward col by a (aerial perspective for far layers)."""
    out = im.copy()
    px = out.load()
    c = C(col)
    for y in range(out.height):
        for x in range(out.width):
            p = px[x, y]
            if p[3]:
                px[x, y] = tuple(round(p[i] + (c[i] - p[i]) * a) for i in range(3)) + (p[3],)
    return out


def tileable(w, h, draw):
    """Draw into a 3x-wide canvas and keep the middle, so anything crossing an edge wraps."""
    big, d = canvas(w * 3, h)
    draw(big, d, w)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for k in range(3):
        out.alpha_composite(big.crop((k * w, 0, k * w + w, h)))
    return out


def tile2d(size, draw):
    """A tile that wraps both ways: draw on a 3x3 canvas and fold it back."""
    big, d = canvas(size * 3, size * 3)
    draw(big, d, size)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    for ky in range(3):
        for kx in range(3):
            out.alpha_composite(big.crop((kx * size, ky * size, kx * size + size, ky * size + size)))
    return out


def stones(d, s, seed, cols, n, rmin=2, rmax=6, flat=0.6):
    """Rounded stones for a ground tile (draw inside tile2d): fill, highlight on top, shadow under."""
    r = random.Random(seed)
    fill, light, dark = cols
    for _ in range(n):
        x, y, rx = r.randrange(s, 2 * s), r.randrange(s, 2 * s), r.randrange(rmin, rmax + 1)
        ry = max(1, round(rx * flat))
        d.ellipse([x - rx, y - ry + 1, x + rx, y + ry + 1], fill=C(dark))
        d.ellipse([x - rx, y - ry, x + rx, y + ry], fill=C(fill))
        d.arc([x - rx, y - ry, x + rx, y + ry], 190, 290, fill=C(light))


def strata(d, s, seed, cols, step=8, amp=2):
    """Wavy layered bands across a ground tile (whole periods, so it tiles)."""
    r = random.Random(seed)
    d.rectangle([s, s, 2 * s - 1, 2 * s - 1], fill=C(cols[-1]))
    for k, y0 in enumerate(range(0, s, step)):
        ph = r.random() * math.tau
        col = C(cols[k % len(cols)])
        for x in range(s, 2 * s):
            y = s + y0 + round(amp * math.sin(math.tau * 2 * x / s + ph))
            d.line([(x, y), (x, y + step)], fill=col)
            if y < s:  # the top band's crest wraps to the bottom of the tile
                d.line([(x, y + s), (x, 2 * s - 1)], fill=col)


def strip(frames):
    w = max(f.width for f in frames)
    h = max(f.height for f in frames)
    im = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        im.alpha_composite(f, (i * w + (w - f.width) // 2, h - f.height))
    return im


# ---------------------------------------------------------------- atlas packing
def pack(items):
    """Shelf-pack named images. items: {name: (image, frames)}. Returns atlas, {name: [x,y,w,h,n]}."""
    order = sorted(items, key=lambda k: -items[k][0].height)
    x = y = shelf = 0
    width = 512
    rects = {}
    for k in order:
        im, n = items[k]
        if x + im.width > width:
            x, y, shelf = 0, y + shelf + 1, 0
        rects[k] = (x, y)
        x += im.width + 1
        shelf = max(shelf, im.height)
    atlas = Image.new('RGBA', (width, y + shelf + 1), (0, 0, 0, 0))
    out = {}
    for k, (px_, py) in rects.items():
        im, n = items[k]
        atlas.alpha_composite(im, (px_, py))
        out[k] = [px_, py, im.width // n, im.height, n]
    return atlas, out


# ---------------------------------------------------------------- the build
def flatten(layers, ground_tile, lip):
    """One picture of the zone: layers over a ground band (rows GROUND-2.. hold the terrain)."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    for L in layers:
        im.alpha_composite(L)
    for y in range(GROUND, H, TILE):
        for x in range(0, W, TILE):
            im.alpha_composite(ground_tile, (x, y))
    for x in range(0, W, lip.width):
        im.alpha_composite(lip, (x, GROUND - 2))
    return im


def build(out, man):
    import biome_art1
    import biome_art2
    from biomes import ANCHORS as anchors  # the module the art filled in (not __main__'s copy)
    zones = {**biome_art1.ZONES, **biome_art2.ZONES}
    man.setdefault('biomes', {})
    for key, make in zones.items():
        z = make()  # draws the layers, which records the zone's anchors
        files = []
        for i, L in enumerate(z['layers']):
            f = f'bgl-{key}-{i}.png'
            L.save(os.path.join(out, f))
            files.append(f)
        items = {k: (v if isinstance(v, tuple) else (v, 1)) for k, v in z['sprites'].items()}
        atlas, rects = pack(items)
        atlas.save(os.path.join(out, f'biome-{key}.png'))
        sl = z['slab']
        sl.save(os.path.join(out, f'slab-{key}.png'))
        man['slabs'][key] = {'file': f'slab-{key}.png', 'w': sl.width, 'h': sl.height, 'cap': z.get('cap', 9)}
        flatten(z['layers'], z['sprites']['ground'], z['sprites']['lip']).save(os.path.join(out, f'bg-{key}.png'))
        man['backgrounds'][key] = f'bg-{key}.png'
        # the colour under each layer's lowest row, so a layer pushed down by the camera never
        # leaves a gap
        base = [L.getpixel((0, H - 1)) for L in z['layers']]
        man['biomes'][key] = {
            'layers': files, 'atlas': f'biome-{key}.png', 'sprites': rects,
            'under': ['#%02x%02x%02x' % b[:3] if b[3] else None for b in base],
            'anchors': anchors.get(key, {})
        }
    return man


if __name__ == '__main__':
    import sys
    sys.path.insert(0, os.path.dirname(__file__))
    root = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'px')
    path = os.path.join(root, 'manifest.json')
    man = json.load(open(path))
    build(root, man)
    with open(path, 'w') as fh:
        json.dump(man, fh, separators=(',', ':'))
    print('wrote', len(man['biomes']), 'zone environments')
