// Drawing on the 480x270 pixel canvas. Everything is whole pixels and palette colours, so there is
// no per-frame colour fixing: art is palette-exact and code only draws with C.* colours.
import { W, H, C } from '../config.js';
import { world } from '../game/world.js';
import { A } from './assets.js';

export const canvas = document.getElementById('screen');
canvas.width = W;
canvas.height = H;
export const X = canvas.getContext('2d', { alpha: false });
X.imageSmoothingEnabled = false;

// CSS scaling to fit the window: whole steps on a desktop; on a phone (html.touch, touch-controls.js)
// the playfield fills the screen edge to edge in landscape with the controls floating over it, and
// sits on top with the controls below it in portrait.
function fit() {
  const touch = document.documentElement.classList.contains('touch');
  const vw = window.visualViewport?.width || innerWidth, vh = window.visualViewport?.height || innerHeight;
  const landscape = vw > vh;
  const room = touch ? (landscape ? Math.min(vw / W, vh / H) : Math.min(vw / W, (vh - 300) / H))
    : Math.min((vw - 8) / W, (vh - 80) / H);
  const k = touch ? Math.max(0.2, room) : room >= 1 ? Math.floor(room) : Math.max(0.25, room);
  canvas.style.width = W * k + 'px';
  canvas.style.height = H * k + 'px';
}
addEventListener('resize', fit);
window.visualViewport?.addEventListener('resize', fit);
fit();

// ---- world offset (screenshake) ----
export const view = { ox: 0, oy: 0, zoom: 1 };
export function worldLayer() {
  const z = view.zoom || 1, ex = view.ox - Math.round(world.cameraX || 0), ey = view.oy - Math.round(world.cameraY || 0);
  if (z === 1) X.setTransform(1, 0, 0, 1, ex, ey);
  else X.setTransform(z, 0, 0, z, (W * (1 - z)) / 2 + ex * z, (H * (1 - z)) / 2 + ey * z); // a zoom punch, about the screen centre
}
export function screenLayer() {
  X.setTransform(1, 0, 0, 1, 0, 0);
}

export function rect(x, y, w, h, col) {
  X.fillStyle = col;
  X.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export function px(x, y, col) {
  X.fillStyle = col;
  X.fillRect(Math.round(x), Math.round(y), 1, 1);
}

// ---- ordered dither: 16-bit style translucency (level 0..16) ----
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const pats = new Map();
export function dither(x, y, w, h, col, level) {
  level = Math.max(0, Math.min(16, Math.round(level)));
  if (!level) return;
  if (level >= 16) return rect(x, y, w, h, col);
  const key = col + level;
  let p = pats.get(key);
  if (!p) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 4;
    const g = cv.getContext('2d');
    g.fillStyle = col;
    for (let i = 0; i < 16; i++) if (BAYER[i] < level) g.fillRect(i % 4, i >> 2, 1, 1);
    p = X.createPattern(cv, 'repeat');
    pats.set(key, p);
  }
  X.fillStyle = p;
  X.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ---- sprites ----
const flipped = new WeakMap();
function flipOf(im) {
  let f = flipped.get(im);
  if (!f) {
    f = document.createElement('canvas');
    f.width = im.width;
    f.height = im.height;
    const g = f.getContext('2d');
    g.translate(im.width, 0);
    g.scale(-1, 1);
    g.drawImage(im, 0, 0);
    flipped.set(im, f);
  }
  return f;
}
// draw frame `fi` of a horizontal strip (frame width fw) at x,y (top-left), optionally flipped
export function frame(im, fi, fw, fh, x, y, flip = false) {
  x = Math.round(x);
  y = Math.round(y);
  if (!flip) X.drawImage(im, fi * fw, 0, fw, fh, x, y, fw, fh);
  else {
    const f = flipOf(im),
      n = Math.round(im.width / fw);
    X.drawImage(f, (n - 1 - fi) * fw, 0, fw, fh, x, y, fw, fh);
  }
}
// scale2x (EPX): doubles a pixel buffer, rounding off stair-step diagonals instead of blocking them
export function scale2x(src, w, h) {
  const out = new Uint32Array(w * 2 * h * 2),
    W2 = w * 2;
  const at = (x, y) => src[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const P = src[y * w + x],
        A_ = at(x, y - 1),
        B = at(x + 1, y),
        Cc = at(x - 1, y),
        D = at(x, y + 1);
      let e0 = P,
        e1 = P,
        e2 = P,
        e3 = P;
      if (Cc === A_ && Cc !== D && A_ !== B) e0 = A_;
      if (A_ === B && A_ !== Cc && B !== D) e1 = B;
      if (D === Cc && D !== B && Cc !== A_) e2 = Cc;
      if (B === D && B !== A_ && D !== Cc) e3 = D;
      const o = y * 2 * W2 + x * 2;
      out[o] = e0;
      out[o + 1] = e1;
      out[o + W2] = e2;
      out[o + W2 + 1] = e3;
    }
  return out;
}
// a sprite strip ({ im, w, h, ... }) grown k times, made once: each frame goes up 4x with scale2x
// (twice) and is sampled back down to k, so a 1.25x sprite keeps clean edges instead of doubling
// every fourth row and column (and it is drawn at whole pixels, so it doesn't shimmer as it walks)
const grown = new WeakMap();
export function upscaled(art, k) {
  let u = grown.get(art);
  if (u) return u;
  const n = Math.round(art.im.width / art.w), w = Math.round(art.w * k), h = Math.round(art.h * k);
  const src = document.createElement('canvas');
  src.width = art.im.width;
  src.height = art.h;
  const sg = src.getContext('2d');
  sg.drawImage(art.im, 0, 0);
  const all = new Uint32Array(sg.getImageData(0, 0, src.width, art.h).data.buffer);
  const cv = document.createElement('canvas');
  cv.width = n * w;
  cv.height = h;
  const g = cv.getContext('2d'),
    img = g.createImageData(cv.width, h),
    d = new Uint32Array(img.data.buffer),
    W4 = art.w * 4;
  for (let f = 0; f < n; f++) {
    const one = new Uint32Array(art.w * art.h);
    for (let y = 0; y < art.h; y++) one.set(all.subarray(y * src.width + f * art.w, y * src.width + (f + 1) * art.w), y * art.w);
    const up = scale2x(scale2x(one, art.w, art.h), art.w * 2, art.h * 2);
    for (let y = 0; y < h; y++) {
      const y4 = Math.min(art.h * 4 - 1, Math.floor(((y + 0.5) / k) * 4));
      for (let x = 0; x < w; x++) d[y * cv.width + f * w + x] = up[y4 * W4 + Math.min(W4 - 1, Math.floor(((x + 0.5) / k) * 4))];
    }
  }
  g.putImageData(img, 0, 0);
  grown.set(art, (u = { ...art, im: cv, w, h }));
  return u;
}
// a one-colour cut-out of a sprite strip (a hit's white flash), made once per image and colour
const tints = new Map();
export function tinted(im, col) {
  let m = tints.get(col);
  if (!m) tints.set(col, (m = new WeakMap()));
  if (m.has(im)) return m.get(im);
  const cv = document.createElement('canvas');
  cv.width = im.width;
  cv.height = im.height;
  const g = cv.getContext('2d');
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = col;
  g.fillRect(0, 0, cv.width, cv.height);
  m.set(im, cv);
  return cv;
}
export function image(im, x, y, flip = false) {
  X.drawImage(flip ? flipOf(im) : im, Math.round(x), Math.round(y));
}
// rotated sprite around its pivot (px, py in sprite pixels), whole-pixel scale k
export function rotated(im, x, y, ang, pivX, pivY, k = 1, flipY = false) {
  X.save();
  X.translate(Math.round(x), Math.round(y));
  X.rotate(ang);
  if (flipY) X.scale(1, -1);
  X.drawImage(im, -pivX * k, -pivY * k, im.width * k, im.height * k);
  X.restore();
}

// ---- pixel font (5x7 glyphs from the shared manifest, ink outline baked in) ----
const MAP = { '•': '-', '✦': '*', '→': '>', '←': '<', '—': '-', '–': '-', '…': '.', '×': 'X', '’': "'", '!': '!' };
const textCache = new Map();
export function norm(s) {
  let out = '';
  for (const ch of String(s).toUpperCase()) {
    const c = MAP[ch] || ch;
    if (A.glyphs[c]) out += c;
  }
  return out;
}
export function textWidth(s, k = 1) {
  s = norm(s);
  let w = 0;
  for (const ch of s) w += (A.glyphs[ch][0].length + 1) * k;
  return Math.max(0, w - k);
}
function hexRgb(h) {
  return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
}
function textCanvas(s, col, k, outline) {
  const key = s + '|' + col + '|' + k + '|' + outline;
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
    const gl = A.glyphs[ch];
    for (let gy = 0; gy < 7; gy++)
      for (let gx = 0; gx < gl[gy].length; gx++)
        if (gl[gy][gx] === '#') for (let yy = 0; yy < k; yy++) for (let xx = 0; xx < k; xx++) pts.push(cx + gx * k + xx, 1 + gy * k + yy);
    cx += (gl[0].length + 1) * k;
  }
  const pack = hex => {
    const [r, g2, b] = hexRgb(hex);
    return 0xff000000 | (b << 16) | (g2 << 8) | r;
  };
  const ink = pack(C.ink),
    fill = pack(col);
  const put = (x, y, c) => {
    if (x >= 0 && y >= 0 && x < cv.width && y < h) d[y * cv.width + x] = c;
  };
  if (outline)
    for (let i = 0; i < pts.length; i += 2)
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2], [1, 2], [-1, 2]])
        put(pts[i] + dx, pts[i + 1] + dy, ink);
  for (let i = 0; i < pts.length; i += 2) put(pts[i], pts[i + 1], fill);
  g.putImageData(img, 0, 0);
  if (textCache.size > 900) textCache.clear();
  textCache.set(key, cv);
  return cv;
}
// draw text; returns width. align: 'left' | 'center' | 'right'. y = top of the glyphs.
export function text(s, x, y, col = C.paper, { k = 1, align = 'left', outline = true } = {}) {
  s = norm(s);
  if (!s) return 0;
  // text with numbers in it (the run clock, damage numbers, counters) changes every frame: building a
  // canvas for each new string is what costs on a phone, so it is stamped glyph by glyph from one
  // sheet per colour instead. The glyphs' outlines only ever overlap in the gap between letters,
  // ink on ink, so it looks exactly the same.
  if (/[0-9]/.test(s)) {
    const sheet = glyphSheet(col, k, outline), w = textWidth(s, k);
    let gx = Math.round(align === 'center' ? x - Math.floor(w / 2) : align === 'right' ? x - w : x) - 1;
    const gy = Math.round(y) - 1;
    for (const ch of s) {
      const g = sheet.at[ch];
      if (ch !== ' ') X.drawImage(sheet.cv, g.x, 0, g.w, sheet.cv.height, gx, gy, g.w, sheet.cv.height);
      gx += g.w - 2 + k;
    }
    return w;
  }
  const cv = textCanvas(s, col, k, outline),
    w = cv.width - 2;
  const dx = align === 'center' ? x - Math.floor(w / 2) : align === 'right' ? x - w : x;
  X.drawImage(cv, Math.round(dx) - 1, Math.round(y) - 1);
  return w;
}
// every glyph of the font in one colour, side by side (each with its outline margin) for text() above
const sheets = new Map();
function glyphSheet(col, k, outline) {
  const key = col + '|' + k + '|' + outline;
  let sh = sheets.get(key);
  if (sh) return sh;
  const chars = Object.keys(A.glyphs).filter(c => c !== ' ');
  const at = {}, parts = [];
  let x = 0;
  for (const ch of chars) {
    const cv = textCanvas(ch, col, k, outline); // (one glyph, with its outline, from the same maker)
    at[ch] = { x, w: cv.width };
    parts.push([cv, x]);
    x += cv.width + 1;
  }
  if (A.glyphs[' ']) at[' '] = { x: 0, w: A.glyphs[' '][0].length * k + 2 };
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, x);
  cv.height = 7 * k + 3;
  const g = cv.getContext('2d');
  for (const [p, px] of parts) g.drawImage(p, px, 0);
  sh = { cv, at };
  sheets.set(key, sh);
  return sh;
}
// shorten to fit a width (adds '..')
export function fitText(s, maxW, k = 1) {
  let t = norm(s);
  if (textWidth(t, k) <= maxW) return t;
  while (t.length > 1 && textWidth(t + '..', k) > maxW) t = t.slice(0, -1);
  return t.replace(/\s+$/, '') + '..';
}

// ---- 9-slice UI frame from /assets/px/ui ----
export function panel(name, x, y, w, h) {
  const f = A.ui[name];
  if (!f) return rect(x, y, w, h, C.night);
  const s = f.slice,
    n = f.im.width;
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  const m = n - 2 * s;
  const d = (sx, sy, sw, sh, dx, dy, dw, dh) => dw > 0 && dh > 0 && X.drawImage(f.im, sx, sy, sw, sh, dx, dy, dw, dh);
  d(0, 0, s, s, x, y, s, s);
  d(n - s, 0, s, s, x + w - s, y, s, s);
  d(0, n - s, s, s, x, y + h - s, s, s);
  d(n - s, n - s, s, s, x + w - s, y + h - s, s, s);
  d(s, 0, m, s, x + s, y, w - 2 * s, s);
  d(s, n - s, m, s, x + s, y + h - s, w - 2 * s, s);
  d(0, s, s, m, x, y + s, s, h - 2 * s);
  d(n - s, s, s, m, x + w - s, y + s, s, h - 2 * s);
  d(s, s, m, m, x + s, y + s, w - 2 * s, h - 2 * s);
}
