"""Builds the noobscrub pixel webfont from the same 5x7 glyphs the canvas renderer uses.

  python3 crazy-weapon-man-site/art-src/build_font.py   (needs fonttools + brotli)

Output: public/assets/fonts/noobscrub-5x7.woff2
Metrics: 8 font pixels per em, so CSS font-size 8px = 1 screen pixel per font pixel; use 16px,
24px or 32px for crisp 2x/3x/4x text. Lowercase letters reuse the capitals.
"""
import os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from font import G

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'fonts')
UPM = 1000
PX = 125  # 8 pixels per em
ASC = 8 * PX  # 7 rows of glyph + 1 row headroom
DESC = 2 * PX

EXTRA = {'•': '-', '✦': '*', '→': '>', '←': '<', '—': '-', '–': '-', '…': '.', '×': 'X', '’': "'", '/': '/'}


def glyph_from(rows):
    pen = TTGlyphPen(None)
    for gy, row in enumerate(rows):
        for gx, ch in enumerate(row):
            if ch == '#':
                x0, y0 = gx * PX, (6 - gy) * PX
                pen.moveTo((x0, y0))
                pen.lineTo((x0, y0 + PX))
                pen.lineTo((x0 + PX, y0 + PX))
                pen.lineTo((x0 + PX, y0))
                pen.closePath()
    return pen.glyph(), (len(rows[0]) + 1) * PX


def main():
    os.makedirs(OUT, exist_ok=True)
    names = ['.notdef']
    glyphs, metrics, cmap = {}, {}, {}
    g, adv = glyph_from(G['?'])
    glyphs['.notdef'], metrics['.notdef'] = g, (adv, 0)
    for ch, rows in G.items():
        name = 'g%04X' % ord(ch)
        names.append(name)
        glyphs[name], adv = glyph_from(rows)
        metrics[name] = (adv, 0)
        cmap[ord(ch)] = name
        if ch.isalpha():
            cmap[ord(ch.lower())] = name
    for ch, base in EXTRA.items():
        if base in G and ord(ch) not in cmap:
            cmap[ord(ch)] = 'g%04X' % ord(base)
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(names)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC, descent=-DESC)
    fb.setupNameTable({'familyName': 'Noobscrub 5x7', 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=ASC, sTypoDescender=-DESC, usWinAscent=ASC, usWinDescent=DESC, sCapHeight=7 * PX, sxHeight=7 * PX)
    fb.setupPost()
    fb.font.flavor = 'woff2'
    path = os.path.join(OUT, 'noobscrub-5x7.woff2')
    fb.save(path)
    print('wrote', os.path.abspath(path), len(cmap), 'codepoints')


if __name__ == '__main__':
    main()
