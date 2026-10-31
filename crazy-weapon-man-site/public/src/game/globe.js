// Planet Hoplon, seen from space: the world view (SHIFT on the map) is the whole overworld wrapped
// round a turning globe. The flat map is the planet's equatorial belt unrolled (it wraps east to
// west, so the sea past world 1 runs on round to world 10), with open ocean and polar ice beyond it.
// The globe is drawn by an inverse orthographic projection into a small canvas each frame, lit from
// the upper left, with a thin atmosphere round its rim.
import { W, H, C } from '../config.js';
import { X, rect, text } from '../engine/gfx.js';
import { REGIONS, MAP_W, MAP_H, SLOT_W, SLOT_H, slotX, slotY } from '../data/overworld.js';
import { regionArt, painted } from './owart.js';
import { cinema } from './world.js';

export const PLANET = 'HOPLON';
const TW = 512, TH = 256, RAD = 88, TILT = 0.32;
// the map's band of latitude: its width is the equator, so its height covers this many radians
const BAND = (MAP_H / MAP_W) * 2 * Math.PI;
let tex = null, texKey = '';
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// the planet's surface, unrolled: rebuilt when another island is painted or opened
function texture(isOpen) {
  const key = REGIONS.map(R => (painted(R) ? 1 : 0) + (isOpen(R) ? 2 : 0)).join('');
  if (tex && key === texKey) return tex;
  texKey = key;
  const cv = document.createElement('canvas');
  cv.width = TW;
  cv.height = TH;
  const g = cv.getContext('2d'), k = TW / MAP_W, top = TH / 2 - (MAP_H * k) / 2;
  g.fillStyle = C.blue;
  g.fillRect(0, 0, TW, TH);
  g.imageSmoothingEnabled = true;
  for (const R of REGIONS) {
    if (!painted(R)) continue;
    g.globalAlpha = isOpen(R) ? 1 : 0.45; // the worlds you haven't reached are still in shadow
    g.drawImage(regionArt(R), slotX(R) * k, top + slotY(R) * k, SLOT_W * k, SLOT_H * k);
  }
  g.globalAlpha = 1;
  const img = g.getImageData(0, 0, TW, TH), d = img.data, ice = hex(C.paper), iceD = hex(C.ice), deep = hex(C.navy);
  for (let y = 0; y < TH; y++) {
    const lat = Math.abs((0.5 - (y + 0.5) / TH) * Math.PI);
    for (let x = 0; x < TW; x++) {
      const i = (y * TW + x) * 4, wob = Math.sin(x * 0.11) * 0.03 + Math.sin(x * 0.037 + 2) * 0.05;
      if (lat > 1.18 + wob) { const c = (x + y) % 7 ? ice : iceD; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; } // the ice caps
      else if (lat > BAND / 2 + 0.06 && (x * 7 + y * 3) % 11 === 0) { d[i] = deep[0]; d[i + 1] = deep[1]; d[i + 2] = deep[2]; } // open ocean
    }
  }
  return (tex = { img, d });
}

// a few hundred stars, fixed
const STARS = Array.from({ length: 140 }, (_, i) => [(i * 97.3) % W, (i * 53.7 + (i % 7) * 13) % H, i % 9 === 0]);
let glob = null;

// draw the globe, alpha a, turned to longitude lon (radians); marks the hero at map point p
export function drawGlobe(a, lon, p, t, isOpen) {
  if (a <= 0) return;
  const T = texture(isOpen), cx = W / 2, cy = 100;
  X.globalAlpha = a;
  rect(0, 0, W, H, '#0b0820');
  for (const [x, y, big] of STARS) rect(x, y, big ? 2 : 1, 1, Math.sin(t * 2 + x) > 0.6 ? C.paper : C.fog);
  const size = RAD * 2 + 2;
  if (!glob) {
    glob = document.createElement('canvas');
    glob.width = glob.height = size;
  }
  const g = glob.getContext('2d'), out = g.createImageData(size, size), o = out.data;
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  for (let j = 0; j < size; j++) {
    const ny = (RAD - j) / RAD;
    for (let i = 0; i < size; i++) {
      const nx = (i - RAD) / RAD, r2 = nx * nx + ny * ny;
      if (r2 > 1) continue;
      const nz = Math.sqrt(1 - r2);
      // tip the planet towards us so its northern ice shows
      const y2 = ny * ct + nz * st, z2 = -ny * st + nz * ct;
      const la = Math.asin(Math.max(-1, Math.min(1, y2))), lo = lon + Math.atan2(nx, z2);
      const u = ((((lo / (2 * Math.PI)) % 1) + 1) % 1) * TW, v = (0.5 - la / Math.PI) * TH;
      const si = ((Math.min(TH - 1, Math.max(0, v | 0)) * TW) + (u | 0)) * 4;
      // lit from the upper left, darker towards the limb
      const lit = Math.max(0.28, Math.min(1.15, 0.35 + 0.75 * (-nx * 0.45 + ny * 0.55 + nz * 0.7)));
      const oi = (j * size + i) * 4;
      o[oi] = Math.min(255, T.d[si] * lit);
      o[oi + 1] = Math.min(255, T.d[si + 1] * lit);
      o[oi + 2] = Math.min(255, T.d[si + 2] * lit);
      o[oi + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  // the atmosphere: a soft blue rim
  X.fillStyle = 'rgba(90,166,240,0.25)';
  X.beginPath();
  X.arc(cx, cy, RAD + 5, 0, Math.PI * 2);
  X.fill();
  X.drawImage(glob, Math.round(cx - RAD), Math.round(cy - RAD));
  // each world's number where it faces us, and a blinking mark on you
  const proj = (mx, my) => {
    const lo = (mx / MAP_W) * 2 * Math.PI - lon, la = (0.5 - my / MAP_H) * BAND;
    const x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
    const y2 = y * ct - z * st, z2 = y * st + z * ct;
    return { x: cx + x * RAD, y: cy - y2 * RAD, front: z2 };
  };
  for (const R of REGIONS) {
    const q = proj(slotX(R) + SLOT_W / 2, slotY(R) + SLOT_H / 2);
    if (q.front > 0.35) text(String(R.id), q.x, q.y - 4, isOpen(R) ? C.gold : C.fog, { align: 'center' });
  }
  const q = proj(p.x, p.y);
  if (q.front > 0 && Math.floor(t * 4) % 2) { rect(q.x - 2, q.y - 2, 5, 5, C.ink); rect(q.x - 1, q.y - 1, 3, 3, C.red); }
  text('PLANET ' + PLANET, W / 2, 4, C.gold, { align: 'center', k: 2 });
  if (!cinema.on) text('ARROWS: TURN THE GLOBE    SHIFT: BACK TO THE MAP', W / 2, 196, C.mist, { align: 'center' });
  X.globalAlpha = 1;
}
// the longitude (radians) a point of the map sits at
export const lonOf = x => (x / MAP_W) * 2 * Math.PI;
