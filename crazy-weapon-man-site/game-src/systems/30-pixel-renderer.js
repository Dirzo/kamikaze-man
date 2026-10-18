// 16-bit pixel renderer (phase 2 of the noobscrub update).
//
// Runs inside the game closure, after every other system, so its wrappers are outermost.
//   - The game canvas becomes 480x270. Game logic keeps its 1280x720 world units; every frame
//     starts from a fixed world->pixel scale (0.375) and CSS upscales with hard pixel edges.
//   - Soft glows are switched off, all canvas text is drawn in the noobscrub pixel font, and each
//     finished frame is snapped to the 32-colour palette so art that hasn't been redrawn yet
//     still matches.
//   - Pixel-art layers (assets/px/, exported by art-src/build_assets.py) replace the old drawing
//     where they exist: zone backdrops, platforms, the hero's body, and enemy bodies. Anything
//     without art yet falls back to the old procedural drawing.
// Escape hatch for comparison and for the legacy self-tests: add ?nopx to the URL.
(() => {
  if (globalThis.CWM_PX) return;
  const params = new URLSearchParams(location.search);
  if (params.has('nopx')) return;

  const PW = 480,
    PH = 270,
    S = PW / W;
  const ZONE_ART = { 0: 'graveyard' }; // zone index -> backdrop key (more zones as art lands)
  const SNAP = !params.has('nosnap');

  const PX = {
    active: true,
    ready: false,
    error: '',
    stats: { frames: 0, snapMs: 0, heroDraws: 0, enemyDraws: 0, textDraws: 0, textCulled: 0, bgDraws: 0 }
  };
  globalThis.CWM_PX = PX;
  PX.state = () => ({ x: pl.x, y: pl.y, w: pl.w, h: pl.h, on: pl.on, vy: pl.vy, G, zone: zoneI });

  // ---- canvas setup --------------------------------------------------------------------
  C.width = PW;
  C.height = PH;
  C.style.imageRendering = 'pixelated';
  X.imageSmoothingEnabled = false;
  Object.defineProperty(X, 'shadowBlur', { get: () => 0, set: () => {}, configurable: true });

  // ---- palette + snapping LUT ----------------------------------------------------------
  let PAL = [],
    LUT = null; // 15-bit rgb -> packed abgr palette colour
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function buildLut(hexes) {
    PAL = hexes.map(hexRgb);
    LUT = new Uint32Array(32768);
    for (let i = 0; i < 32768; i++) {
      const r = ((i & 31) << 3) | 4,
        g = (((i >> 5) & 31) << 3) | 4,
        b = (((i >> 10) & 31) << 3) | 4;
      let best = 0,
        bd = 1e9;
      for (let k = 0; k < PAL.length; k++) {
        const [pr, pg, pb] = PAL[k],
          dr = r - pr,
          dg = g - pg,
          db = b - pb,
          d = dr * dr * 3 + dg * dg * 4 + db * db * 2;
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      const [pr, pg, pb] = PAL[best];
      LUT[i] = 0xff000000 | (pb << 16) | (pg << 8) | pr;
    }
  }
  function snapFrame() {
    if (!SNAP || !LUT) return;
    const t0 = performance.now();
    const img = X.getImageData(0, 0, PW, PH),
      d = new Uint32Array(img.data.buffer);
    for (let i = 0; i < d.length; i++) {
      const c = d[i];
      d[i] = LUT[((c & 0xff) >> 3) | (((c >> 8) & 0xff) >> 3 << 5) | (((c >> 16) & 0xff) >> 3 << 10)];
    }
    X.putImageData(img, 0, 0);
    PX.stats.snapMs = PX.stats.snapMs * 0.9 + (performance.now() - t0) * 0.1;
  }

  // ---- colour helper (any CSS colour -> nearest palette hex) ----------------------------
  const probe = document.createElement('canvas').getContext('2d');
  const colourCache = new Map();
  function paletteHex(style) {
    if (typeof style !== 'string') return '#f4f1e8';
    let hit = colourCache.get(style);
    if (hit) return hit;
    probe.fillStyle = '#000';
    probe.fillStyle = style;
    probe.clearRect(0, 0, 1, 1);
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    hit = '#f4f1e8';
    if (LUT) {
      const c = LUT[(r >> 3) | ((g >> 3) << 5) | ((b >> 3) << 10)];
      hit = '#' + [c & 255, (c >> 8) & 255, (c >> 16) & 255].map(v => v.toString(16).padStart(2, '0')).join('');
    }
    if (colourCache.size > 400) colourCache.clear();
    colourCache.set(style, hit);
    return hit;
  }

  // ---- pixel font ----------------------------------------------------------------------
  let GLYPHS = null;
  const CHAR_MAP = { '•': '-', '✦': '*', '→': '>', '←': '<', '—': '-', '–': '-', '…': '.', '×': 'X', '’': "'" };
  const textCache = new Map();
  let textRects = [];
  const norm = s =>
    String(s)
      .toUpperCase()
      .split('')
      .map(ch => CHAR_MAP[ch] || ch)
      .filter(ch => GLYPHS[ch])
      .join('');
  function textWidth(s, k) {
    let w = 0;
    for (const ch of s) w += (GLYPHS[ch][0].length + 1) * k;
    return Math.max(0, w - k);
  }
  function textCanvas(s, col, k) {
    const key = s + '|' + col + '|' + k;
    let cv = textCache.get(key);
    if (cv) return cv;
    const w = textWidth(s, k) + 2,
      h = 7 * k + 3;
    cv = document.createElement('canvas');
    cv.width = Math.max(1, w);
    cv.height = h;
    const g = cv.getContext('2d'),
      img = g.createImageData(cv.width, h),
      d = new Uint32Array(img.data.buffer);
    const pts = [];
    let cx = 1;
    for (const ch of s) {
      const gl = GLYPHS[ch];
      for (let gy = 0; gy < 7; gy++)
        for (let gx = 0; gx < gl[gy].length; gx++)
          if (gl[gy][gx] === '#')
            for (let yy = 0; yy < k; yy++) for (let xx = 0; xx < k; xx++) pts.push(cx + gx * k + xx, 1 + gy * k + yy);
      cx += (gl[0].length + 1) * k;
    }
    const [ir, ig, ib] = PAL[0] || [26, 20, 40],
      ink = 0xff000000 | (ib << 16) | (ig << 8) | ir;
    const [fr, fg, fb] = hexRgb(col),
      fill = 0xff000000 | (fb << 16) | (fg << 8) | fr;
    const put = (x, y, c) => {
      if (x >= 0 && y >= 0 && x < cv.width && y < h) d[y * cv.width + x] = c;
    };
    for (let i = 0; i < pts.length; i += 2)
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2], [1, 2], [-1, 2]])
        put(pts[i] + dx, pts[i + 1] + dy, ink);
    for (let i = 0; i < pts.length; i += 2) put(pts[i], pts[i + 1], fill);
    g.putImageData(img, 0, 0);
    if (textCache.size > 700) textCache.clear();
    textCache.set(key, cv);
    return cv;
  }
  function fontPx() {
    const m = /(\d+(?:\.\d+)?)px/.exec(X.font);
    return m ? Number(m[1]) : 10;
  }
  function scaleOf(m) {
    return Math.hypot(m.a, m.b) || S;
  }
  function kFor(m) {
    const dev = fontPx() * scaleOf(m);
    return dev >= 18 ? 2 : 1; // world text >= 48px gets the big size, everything else the small one
  }
  const baseMeasure = X.measureText.bind(X);
  X.measureText = function (s) {
    if (!GLYPHS) return baseMeasure(s);
    const m = X.getTransform(),
      t = norm(s),
      k = kFor(m);
    return { width: textWidth(t, k) / scaleOf(m), actualBoundingBoxAscent: (7 * k) / scaleOf(m), actualBoundingBoxDescent: 0 };
  };
  X.strokeText = function () {}; // the pixel font carries its own outline
  const baseFillText = X.fillText.bind(X);
  X.fillText = function (s, x, y) {
    if (!GLYPHS) return baseFillText(s, x, y);
    const t = norm(s);
    if (!t) return;
    const m = X.getTransform(),
      k = kFor(m),
      col = paletteHex(X.fillStyle),
      cv = textCanvas(t, col, k),
      p = m.transformPoint(new DOMPoint(x, y));
    let dx = p.x,
      dy = p.y;
    const al = X.textAlign,
      bl = X.textBaseline;
    if (al === 'center') dx -= (cv.width - 2) / 2;
    else if (al === 'right' || al === 'end') dx -= cv.width - 2;
    if (bl === 'middle') dy -= (7 * k) / 2;
    else if (bl === 'top' || bl === 'hanging') dy -= 0;
    else dy -= 7 * k; // alphabetic / bottom
    // Readability rule until the phase-4 text budget: skip text that would land on text already
    // drawn this frame (earlier draws win: world labels, then the player, then floating text).
    if (X.globalAlpha < 0.35 || textRects.length >= 14) {
      PX.stats.textCulled++;
      return;
    }
    const rx = Math.round(dx) - 1,
      ry = Math.round(dy) - 1,
      rw = cv.width,
      rh = cv.height;
    for (const r of textRects) {
      const ox = Math.min(rx + rw, r[0] + r[2]) - Math.max(rx, r[0]),
        oy = Math.min(ry + rh, r[1] + r[3]) - Math.max(ry, r[1]);
      if (ox > 1 && oy > 1 && ox * oy > rw * rh * 0.08) {
        PX.stats.textCulled++;
        return;
      }
    }
    textRects.push([rx, ry, rw, rh]);
    X.save();
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.drawImage(cv, rx, ry);
    X.restore();
    PX.stats.textDraws++;
  };

  // ---- assets ----------------------------------------------------------------------------
  const ART = { hero: null, enemies: {}, bg: {}, slab: null, man: null };
  const loadImg = src =>
    new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('image ' + src));
      im.src = src;
    });
  function flipped(im) {
    const cv = document.createElement('canvas');
    cv.width = im.width;
    cv.height = im.height;
    const g = cv.getContext('2d');
    g.translate(im.width, 0);
    g.scale(-1, 1);
    g.drawImage(im, 0, 0);
    return cv;
  }
  (async () => {
    try {
      const base = '/assets/px/';
      const man = await (await fetch(base + 'manifest.json', { cache: 'no-cache' })).json();
      ART.man = man;
      buildLut(man.palette ? Object.values(man.palette) : []);
      GLYPHS = man.glyphs;
      const hero = await loadImg(base + 'hero.png');
      ART.hero = { im: hero, fl: flipped(hero), ...man.hero };
      for (const [type, info] of Object.entries(man.enemies)) {
        const im = await loadImg(base + 'enemy-' + type + '.png');
        ART.enemies[type] = { im, ...info };
      }
      for (const [key, file] of Object.entries(man.backgrounds)) ART.bg[key] = await loadImg(base + file);
      ART.slab = { im: await loadImg(base + 'slab.png'), ...man.slab };
      PX.ready = true;
      document.documentElement.dataset.cwmPx = 'ready';
    } catch (e) {
      PX.error = String(e);
      document.documentElement.dataset.cwmPx = 'error';
      console.error('Pixel renderer assets failed', e);
    }
  })();

  // device-pixel blit using the current transform's offset (keeps screen shake, stays crisp)
  function blit(im, sx, sy, sw, sh, wx, wy) {
    const m = X.getTransform();
    const dx = Math.round(m.e + m.a * wx),
      dy = Math.round(m.f + m.d * wy);
    X.save();
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.drawImage(im, sx, sy, sw, sh, dx, dy, sw, sh);
    X.restore();
  }

  // ---- backdrop + platforms ------------------------------------------------------------
  const drawBg0 = drawBg;
  drawBg = function () {
    const key = ZONE_ART[zoneI];
    const im = PX.ready && key && ART.bg[key];
    if (!im) return drawBg0();
    X.drawImage(im, 0, 0, W, H);
    if (mapScene && mapScene.water) {
      const wv = mapScene.water;
      X.fillStyle = PAL.length ? '#2f5fbf' : wv.col;
      X.fillRect(wv.x, G - 6, wv.w, H - G + 6);
      X.fillStyle = '#5aa6f0';
      X.fillRect(wv.x, G - 6, wv.w, 3);
    }
    if (chaosEvent === 'lava') {
      X.fillStyle = '#c4363e';
      X.fillRect(0, G + 8, W, H - G - 8);
    }
    const sl = ART.slab,
      cap = sl.cap,
      mid = sl.w - cap * 2;
    for (const p of platforms) {
      const m = X.getTransform();
      const x0 = Math.round(m.e + m.a * p.x) - 1,
        y0 = Math.round(m.f + m.d * p.y) - 1,
        w = Math.max(cap * 2, Math.round(m.a * p.w) + 2);
      X.save();
      X.setTransform(1, 0, 0, 1, 0, 0);
      X.drawImage(sl.im, 0, 0, cap, sl.h, x0, y0, cap, sl.h);
      for (let x = x0 + cap; x < x0 + w - cap; x += mid) {
        const seg = Math.min(mid, x0 + w - cap - x);
        X.drawImage(sl.im, cap, 0, seg, sl.h, x, y0, seg, sl.h);
      }
      X.drawImage(sl.im, sl.w - cap, 0, cap, sl.h, x0 + w - cap, y0, cap, sl.h);
      X.restore();
    }
    PX.stats.bgDraws++;
  };

  // ---- hero body (called from core playerDraw; arm + weapon stay procedural) -------------
  PX.heroBody = function (run, atk) {
    const a = ART.hero;
    if (!PX.ready || !a) return false;
    let f = 0;
    if (!pl.on) f = 3;
    else if (run > 0.15) f = 1 + (Math.floor(time * 10) % 2);
    const im = pl.dir < 0 ? a.fl : a.im,
      sx = pl.dir < 0 ? (a.frames.length - 1 - f) * a.w : f * a.w;
    const lean = atk ? pl.dir : 0;
    const alpha = X.globalAlpha;
    if (pl.inv > 0 && Math.floor(time * 18) % 2 === 0) X.globalAlpha = alpha * 0.45;
    // Anchor the sprite's feet to the fully transformed foot point (the animation system pivots
    // and squashes the player), but blit unrotated at whole pixels so the art stays crisp.
    const foot = X.getTransform().transformPoint(new DOMPoint(pl.x + pl.w / 2, pl.y + pl.h));
    X.save();
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.drawImage(im, sx, 0, a.w, a.h, Math.round(foot.x - a.w / 2 + lean), Math.round(foot.y) - a.h + 1, a.w, a.h);
    X.restore();
    X.globalAlpha = alpha;
    PX.stats.heroDraws++;
    return true;
  };

  // ---- enemy bodies (called from core creature() inside the enemy's local transform) ------
  PX.enemyBody = function (e, d, windP, atkP) {
    const a = PX.ready && ART.enemies[e.type];
    if (!a) return false;
    const moving = Math.abs(e.vx || 0) > 20;
    let f = moving ? Math.floor((time + (e.anim || 0)) * 8) % 2 : 0;
    if ((e.hitT || 0) > 0.06) f = 2;
    const sw = a.w / S,
      sh = a.h / S,
      lift = windP > 0 ? -windP * 2 / S : 0;
    X.drawImage(a.im, f * a.w, 0, a.w, a.h, -sw / 2, e.h / 2 - sh + 1 / S + lift, sw, sh);
    PX.stats.enemyDraws++;
    return true;
  };

  // ---- frame wrapper -------------------------------------------------------------------
  const draw0 = draw;
  draw = function () {
    textRects = [];
    X.setTransform(S, 0, 0, S, 0, 0);
    X.imageSmoothingEnabled = false;
    const r = draw0();
    X.setTransform(1, 0, 0, 1, 0, 0);
    snapFrame();
    PX.stats.frames++;
    return r;
  };
})();
