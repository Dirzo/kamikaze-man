// Drawing on the 480x270 pixel canvas. Everything is whole pixels and palette colours, so there is
// no per-frame colour fixing: art is palette-exact and code only draws with C.* colours.
import { W, H, C } from '../config.js';
import { A } from './assets.js';

export const canvas = document.getElementById('screen');
canvas.width = W;
canvas.height = H;
export const X = canvas.getContext('2d', { alpha: false });
X.imageSmoothingEnabled = false;

// Integer CSS scaling to fit the window.
function fit() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const room = Math.min((innerWidth - 8) / W, (innerHeight - (coarse ? 108 : 80)) / H);
  const k = room >= 1 ? Math.floor(room) : Math.max(0.25, room); // fit narrow phones, integer pixels on larger screens
  canvas.style.width = W * k + 'px';
  canvas.style.height = H * k + 'px';
}
addEventListener('resize', fit);
fit();

// ---- world offset (screenshake) ----
export const view = { ox: 0, oy: 0 };
export function worldLayer() {
  X.setTransform(1, 0, 0, 1, view.ox, view.oy);
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
  const cv = textCanvas(s, col, k, outline),
    w = cv.width - 2;
  const dx = align === 'center' ? x - Math.floor(w / 2) : align === 'right' ? x - w : x;
  X.drawImage(cv, Math.round(dx) - 1, Math.round(y) - 1);
  return w;
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
