// MapleStory-style depth for every stage: the painted parallax layers (ambience.js) stay at the back,
// and this adds the layering in front of them that makes a MapleStory map feel like a place:
//   far band   rolling hills with the world's big set pieces standing on them (pagodas, castle keeps,
//              giant swords, chimneys, snowy pines), hazy with distance, at 0.42 of the camera
//   haze       a veil of the sky's own colour between the bands, so each step back is paler
//   near band  a second, larger row of set pieces and hills at 0.66, more saturated, closer
//   rays       slow shafts of light through the day worlds
//   front      grass, reeds and bushes along the bottom of the screen, passing IN FRONT of the hero
//              at 1.3x
// Set pieces are placed along the whole stage once per map (seeded), so a long stage never shows the
// same skyline twice the way a tiled layer does. Everything is drawn into small canvases once.
import { W, H, GROUND, C } from '../config.js';
import { world } from './world.js';
import { X, rect, screenLayer } from '../engine/gfx.js';
import { cameraTargetY } from '../data/maps.js';

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const css = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const mix = (a, b, k) => css(hex(a).map((v, i) => v + (b[i] - v) * k));
const SCROLL = [0.42, 0.66], FRONT = 1.3;

// ---------------------------------------------------------------- set pieces
// each returns a canvas whose bottom centre stands on the band's ground; tone(c) hazes a colour
function canvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w);
  cv.height = Math.ceil(h);
  return [cv, cv.getContext('2d')];
}
function painter(g) {
  const r = (x, y, w, h, c) => ((g.fillStyle = c), g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)));
  const blob = (cx, cy, rad, c, sy = 1) => {
    g.fillStyle = c;
    for (let y = -rad; y <= rad; y++) {
      const hw = Math.round(Math.sqrt(rad * rad - y * y));
      g.fillRect(Math.round(cx - hw), Math.round(cy + y * sy), hw * 2, Math.max(1, Math.round(sy)));
    }
  };
  const tri = (cx, top, w, h, c) => { for (let y = 0; y < h; y++) r(cx - (w * y) / h / 2, top + y, (w * y) / h, 1, c); };
  return { r, blob, tri };
}
const PIECES = {
  // a round leafy tree (or sakura, or the cottage's storybook oak)
  tree(R, s, tone, o = {}) {
    const h = 60 * s, w = 52 * s, [cv, g] = canvas(w + 8, h), { r, blob } = painter(g);
    const leaf = o.leaf || [C.pine, C.leaf, C.grass];
    r(w / 2 - 3 * s, h - 26 * s, 6 * s, 26 * s, tone(C.woodD));
    r(w / 2 - 3 * s, h - 26 * s, 2 * s, 26 * s, tone(C.wood));
    const puffs = [];
    for (let i = 0; i < 6; i++) puffs.push([w / 2 + (R() - 0.5) * w * 0.55, h - 34 * s - R() * 16 * s, (12 + R() * 8) * s]);
    for (const [x, y, rad] of puffs) blob(x + 2, y + 3, rad, tone(leaf[0]));
    for (const [x, y, rad] of puffs) blob(x, y, rad - 1, tone(leaf[1]));
    for (const [x, y, rad] of puffs) blob(x - rad * 0.3, y - rad * 0.35, rad * 0.45, tone(leaf[2]));
    return cv;
  },
  pine(R, s, tone, o = {}) {
    const h = (70 + R() * 30) * s, w = 34 * s, [cv, g] = canvas(w, h), { r, tri } = painter(g);
    r(w / 2 - 2, h - 10 * s, 4, 10 * s, tone(C.woodD));
    for (let i = 0; i < 4; i++) {
      const top = (h - 10 * s) * (i / 4.4), ww = w * (0.45 + i * 0.18);
      tri(w / 2, top, ww, (h - 10 * s) * 0.36, tone(i % 2 ? C.pine : C.leaf));
      if (o.snow) tri(w / 2, top, ww * 0.5, (h - 10 * s) * 0.12, tone(C.paper));
    }
    return cv;
  },
  // a house, shop or hall: walls, a roof, glowing windows
  house(R, s, tone, o = {}) {
    const w = (44 + R() * 30) * s, wh = (30 + R() * 30) * s, rh = 18 * s, [cv, g] = canvas(w + 12 * s, wh + rh + 10 * s), { r, tri } = painter(g);
    const x0 = 6 * s, y0 = rh + 10 * s, wall = o.wall || [C.sand, C.wood], roof = o.roof || [C.wine, C.red];
    r(x0, y0, w, wh, tone(wall[0]));
    r(x0, y0, 3 * s, wh, tone(wall[1]));
    if (o.flat) { r(x0 - 3 * s, y0 - 5 * s, w + 6 * s, 5 * s, tone(roof[0])); r(x0 - 3 * s, y0 - 5 * s, w + 6 * s, 2 * s, tone(roof[1])); }
    else if (o.curve) {
      for (let y = 0; y < rh; y++) { const k = y / rh, ww = w * (0.5 + 0.7 * k * k); r(x0 + w / 2 - ww / 2, y0 - rh + y, ww, 1, tone(y > rh - 4 * s ? roof[1] : roof[0])); }
    } else { tri(x0 + w / 2, y0 - rh - 6 * s, w + 14 * s, rh + 6 * s, tone(roof[0])); r(x0 - 6 * s, y0 - 2 * s, w + 12 * s, 2 * s, tone(roof[1])); }
    if (o.chimney) r(x0 + w * 0.7, y0 - rh - 4 * s, 6 * s, rh, tone(wall[1]));
    const win = o.glow || C.gold, cols = Math.max(1, Math.floor(w / (14 * s))), rows = Math.max(1, Math.floor(wh / (16 * s)));
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (R() < 0.75) r(x0 + 6 * s + i * 14 * s, y0 + 5 * s + j * 16 * s, 5 * s, 7 * s, R() < 0.8 ? win : tone(C.ink));
    return cv;
  },
  // a tiered pagoda or castle keep
  pagoda(R, s, tone, o = {}) {
    const tiers = o.tiers || 3 + Math.floor(R() * 2), w = 60 * s, th = 18 * s, [cv, g] = canvas(w + 10 * s, tiers * th + 22 * s), { r } = painter(g);
    const wall = o.wall || [C.paper, C.mist], roof = o.roof || [C.slate, C.stone];
    for (let i = 0; i < tiers; i++) {
      const k = 1 - i * 0.16, ww = w * k * 0.62, y = cv.height - (i + 1) * th, cx = cv.width / 2;
      r(cx - ww / 2, y + 5 * s, ww, th - 5 * s, tone(wall[0]));
      r(cx - ww / 2, y + 5 * s, 2 * s, th - 5 * s, tone(wall[1]));
      if (R() < 0.8) r(cx - 3 * s, y + 8 * s, 6 * s, 5 * s, o.glow || tone(C.ink));
      const rw = w * k;
      r(cx - rw / 2, y + 2 * s, rw, 3 * s, tone(roof[0]));
      r(cx - rw / 2 - 2 * s, y + 1 * s, 4 * s, 2 * s, tone(roof[0]));
      r(cx + rw / 2 - 2 * s, y + 1 * s, 4 * s, 2 * s, tone(roof[0]));
      r(cx - rw / 2 + 4 * s, y, rw - 8 * s, 2 * s, tone(roof[1]));
    }
    r(cv.width / 2 - 1, 0, 2, cv.height - tiers * th + 2, tone(o.spire || C.gold));
    return cv;
  },
  // a rock spire, maybe with a little temple or snow on top
  spire(R, s, tone, o = {}) {
    const w = (26 + R() * 20) * s, h = (80 + R() * 50) * s, [cv, g] = canvas(w + 20 * s, h + 20 * s), { r } = painter(g);
    const rock = o.rock || [C.slate, C.stone, C.fog], cx = cv.width / 2;
    for (let y = 0; y < h; y++) {
      const k = y / h, ww = w * (0.55 + 0.45 * k) + Math.sin(y * 0.3) * 2 * s;
      r(cx - ww / 2, cv.height - h + y, ww, 1, tone(rock[1]));
      r(cx - ww / 2, cv.height - h + y, ww * 0.25, 1, tone(rock[2]));
      r(cx + ww / 2 - ww * 0.2, cv.height - h + y, ww * 0.2, 1, tone(rock[0]));
    }
    if (o.snow) r(cx - w * 0.28, cv.height - h, w * 0.56, 5 * s, tone(C.paper));
    if (o.temple) {
      const tw = w * 0.7, ty = cv.height - h - 12 * s;
      r(cx - tw / 2, ty + 4 * s, tw, 8 * s, tone(C.red));
      r(cx - tw / 2 - 4 * s, ty, tw + 8 * s, 4 * s, tone(C.slate));
      r(cx - 2 * s, ty + 6 * s, 4 * s, 4 * s, C.gold);
    }
    return cv;
  },
  // a giant weapon stuck in the hills (the graveyard's swords, the vault's whole armoury)
  blade(R, s, tone, o = {}) {
    const h = (70 + R() * 40) * s, [cv, g] = canvas(30 * s, h), { r } = painter(g), cx = 15 * s, lean = (R() - 0.5) * 10 * s;
    const kind = o.kinds ? o.kinds[Math.floor(R() * o.kinds.length)] : 'sword';
    for (let y = 0; y < h - 22 * s; y++) {
      const x = cx + (lean * (h - y)) / h;
      if (kind === 'spear') { r(x - 1 * s, h - y, 2 * s, 1, tone(C.wood)); continue; }
      r(x - 4 * s, h - y, 8 * s, 1, tone(C.mist));
      r(x - 4 * s, h - y, 2 * s, 1, tone(C.paper));
    }
    const tx = cx + lean * 0.22, ty = 22 * s;
    if (kind === 'spear') { r(tx - 4 * s, ty - 14 * s, 8 * s, 14 * s, tone(C.mist)); return cv; }
    r(tx - 12 * s, ty - 2 * s, 24 * s, 4 * s, tone(C.gold));
    r(tx - 2 * s, ty - 16 * s, 4 * s, 14 * s, tone(kind === 'katana' ? C.red : C.wood));
    r(tx - 3 * s, ty - 20 * s, 6 * s, 5 * s, tone(C.gold));
    return cv;
  },
  // a forge chimney or smelter stack
  stack(R, s, tone) {
    const w = (16 + R() * 10) * s, h = (80 + R() * 50) * s, [cv, g] = canvas(w + 8 * s, h), { r } = painter(g);
    r(4 * s, 6 * s, w, h - 6 * s, tone(C.night));
    r(4 * s, 6 * s, 3 * s, h - 6 * s, tone(C.slate));
    r(0, 0, w + 8 * s, 6 * s, tone(C.stone));
    for (let y = 16 * s; y < h; y += 14 * s) r(4 * s, y, w, 1 * s, tone(C.ink));
    r(4 * s + w / 2 - 2 * s, h * 0.5, 4 * s, 6 * s, C.orange);
    return cv;
  },
  bamboo(R, s, tone) {
    const h = (80 + R() * 40) * s, [cv, g] = canvas(30 * s, h), { r } = painter(g);
    for (let i = 0; i < 4; i++) {
      const x = 3 * s + i * 7 * s, hh = h * (0.7 + R() * 0.3);
      r(x, h - hh, 3 * s, hh, tone(i % 2 ? C.leaf : C.grass));
      for (let y = h - hh + 8 * s; y < h; y += 14 * s) r(x, y, 3 * s, 1 * s, tone(C.pine));
      r(x + 3 * s, h - hh + 10 * s, 6 * s, 2 * s, tone(C.lime));
    }
    return cv;
  },
  torii(R, s, tone) {
    const w = 54 * s, h = 52 * s, [cv, g] = canvas(w, h), { r } = painter(g);
    r(10 * s, 10 * s, 5 * s, h - 10 * s, tone(C.red));
    r(w - 15 * s, 10 * s, 5 * s, h - 10 * s, tone(C.red));
    r(0, 4 * s, w, 5 * s, tone(C.ink));
    r(3 * s, 9 * s, w - 6 * s, 3 * s, tone(C.red));
    r(6 * s, 18 * s, w - 12 * s, 3 * s, tone(C.red));
    return cv;
  },
  mushroom(R, s, tone) {
    const h = (40 + R() * 24) * s, w = 46 * s, [cv, g] = canvas(w, h), { r, blob } = painter(g);
    r(w / 2 - 5 * s, h * 0.4, 10 * s, h * 0.6, tone(C.paper));
    blob(w / 2, h * 0.4, 20 * s, tone(C.red), 0.55);
    for (let i = 0; i < 4; i++) r(w / 2 - 14 * s + R() * 26 * s, h * 0.4 - 8 * s + R() * 6 * s, 3 * s, 3 * s, tone(C.paper));
    r(w / 2 - 2 * s, h * 0.65, 4 * s, 6 * s, C.gold);
    return cv;
  },
  hoard(R, s, tone) {
    const w = (70 + R() * 50) * s, h = (36 + R() * 30) * s, [cv, g] = canvas(w, h), { r } = painter(g);
    for (let y = 0; y < h; y++) {
      const k = y / h, ww = w * Math.sqrt(k);
      r(w / 2 - ww / 2, y, ww, 1, tone(y % 4 ? C.gold : C.orange));
    }
    for (let i = 0; i < 12; i++) { const y = h * (0.3 + R() * 0.7), x = w / 2 + (R() - 0.5) * w * Math.sqrt(y / h) * 0.9; r(x, y, 2 * s, 1 * s, tone(C.cream)); }
    return cv;
  },
  arch(R, s, tone) {
    const w = 56 * s, h = 48 * s, [cv, g] = canvas(w, h), { r } = painter(g);
    r(0, 8 * s, 12 * s, h - 8 * s, tone(C.stone));
    r(w - 12 * s, 14 * s + R() * 10 * s, 12 * s, h, tone(C.stone));
    r(0, 0, w * (0.6 + R() * 0.4), 9 * s, tone(C.fog));
    r(0, 8 * s, 3 * s, h, tone(C.mist));
    return cv;
  }
};

// each world's skyline: [piece, weight, options] for the far and near bands; hill: the bands' ground;
// front: what passes in front of you; rays: shafts of light (day worlds)
const KITS = {
  graveyard: { hill: C.leaf, pieces: [['blade', 4], ['arch', 2], ['tree', 2, { leaf: [C.pine, C.leaf, C.lime] }]], front: { tuft: [C.pine, C.leaf] }, rays: true },
  'ranger-forest': { hill: C.paper, pieces: [['pine', 6, { snow: true }], ['house', 1, { wall: [C.wood, C.woodD], roof: [C.paper, C.mist], chimney: true }]], front: { tuft: [C.mist, C.paper] } },
  'turtle-lagoon': { hill: C.grass, pieces: [['bamboo', 4], ['house', 2, { wall: [C.sand, C.wood], roof: [C.leaf, C.pine], curve: true }], ['tree', 2, { leaf: [C.pine, C.teal, C.lime] }]], front: { tuft: [C.pine, C.leaf], reeds: true }, rays: true },
  'thieves-bazaar': { hill: C.slate, pieces: [['house', 6, { wall: [C.stone, C.slate], roof: [C.wine, C.red], glow: C.gold }], ['house', 2, { wall: [C.slate, C.night], roof: [C.violet, C.indigo], flat: true, glow: C.orange }]], front: { tuft: [C.night, C.slate] } },
  'sakura-shrine': { hill: C.lime, pieces: [['pagoda', 2, { wall: [C.paper, C.mist], roof: [C.wine, C.red] }], ['tree', 4, { leaf: [C.coral, C.pink, '#ffd1e6'] }], ['torii', 2]], front: { tuft: [C.coral, C.pink] }, rays: true },
  'mountain-monastery': { hill: C.fog, pieces: [['spire', 4, { snow: true }], ['spire', 2, { temple: true }], ['pine', 2, { snow: true }]], front: { tuft: [C.stone, C.fog] }, rays: true },
  'storm-forge': { hill: C.night, pieces: [['stack', 4], ['house', 2, { wall: [C.slate, C.night], roof: [C.stone, C.slate], flat: true, glow: C.orange }], ['spire', 1, { rock: [C.ink, C.night, C.slate] }]], front: { tuft: [C.ink, C.night] } },
  'witch-cottage': { hill: C.grass, pieces: [['tree', 4, { leaf: [C.leaf, C.grass, C.lime] }], ['house', 2, { wall: [C.cream, C.sand], roof: [C.wood, C.woodD], chimney: true, curve: true }], ['mushroom', 2]], front: { tuft: [C.leaf, C.grass], flowers: true }, rays: true },
  'ninja-castle': { hill: C.night, pieces: [['pagoda', 2, { wall: [C.mist, C.fog], roof: [C.night, C.slate], tiers: 4, glow: C.gold }], ['bamboo', 3], ['house', 2, { wall: [C.mist, C.fog], roof: [C.night, C.ink], curve: true, glow: C.gold }]], front: { tuft: [C.ink, C.night] } },
  'armory-vault': { hill: C.orange, pieces: [['hoard', 4], ['blade', 3, { kinds: ['sword', 'katana', 'spear'] }], ['pagoda', 1, { wall: [C.gold, C.orange], roof: [C.wine, C.red], tiers: 2 }]], front: { tuft: [C.woodD, C.wood], coins: true } }
};

function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// the sky's colour down near the horizon, from the zone's own sky layer: everything far away fades to it
function hazeOf(sky) {
  try {
    const [cv, g] = canvas(1, 1);
    g.drawImage(sky, 240, 170, 1, 1, 0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  } catch (_) {
    return hex(C.sky);
  }
}

// one map's depth, set up the first time it is drawn
export function depthOf(amb, id, sky) {
  if (amb.depth) return amb.depth;
  const K = KITS[id], map = world.map;
  if (!K || typeof document === 'undefined') return (amb.depth = null);
  const R = seeded(map.width * 3 + map.platforms.length * 17 + id.length), haze = sky ? hazeOf(sky) : hex(C.sky);
  const total = K.pieces.reduce((s, p) => s + p[1], 0);
  const bands = SCROLL.map((k, b) => {
    const tone = c => mix(c, haze, b ? 0.3 : 0.58), s = b ? 1.25 : 0.8, items = [];
    // the band's own run: how far it scrolls over the whole stage, and a little either side
    for (let x = -60; x < map.width * k + W + 60; x += (b ? 150 : 95) + R() * (b ? 220 : 150)) {
      let n = R() * total, P = K.pieces[0];
      for (P of K.pieces) if ((n -= P[1]) < 0) break;
      items.push({ x, im: PIECES[P[0]](R, s * (0.85 + R() * 0.3), tone, P[2] || {}) });
    }
    // the band's rolling hills, one strip as long as its run
    const hw = Math.ceil(map.width * k + W + 120), [hill, g] = canvas(hw, 40);
    const hc = [tone(K.hill), mix(K.hill, haze, b ? 0.42 : 0.66)], ph = R() * 9, amp = b ? 9 : 6;
    for (let x = 0; x < hw; x++) {
      const y = 12 + Math.round(Math.sin(x / (b ? 70 : 50) + ph) * amp + Math.sin(x / 23 + ph * 2) * 3);
      g.fillStyle = hc[0];
      g.fillRect(x, y, 1, 40 - y);
      g.fillStyle = hc[1];
      g.fillRect(x, y, 1, 2);
    }
    return { k, items, hill, veil: css(haze) };
  });
  // in front: a strip of tufts along the bottom of the screen (the tall poles, trunks and chains that
  // used to sweep past were cut at Cam's ask, 2026-10-31)
  const fw = Math.ceil(map.width * FRONT + W * 2);
  const tufts = [];
  for (let x = 0; x < fw; x += 30 + R() * 110) tufts.push({ x, h: 14 + R() * 20, w: 16 + R() * 34, f: R() < 0.3 });
  return (amb.depth = { K, bands, tufts, rays: K.rays && !map.dark, haze });
}

function baseLift() {
  const map = world.map;
  return Math.max(-60, Math.min(160, cameraTargetY(map.startY, map.floorY) - (world.cameraY || 0)));
}

// behind the terrain: the far band, the haze veil, the near band, the light
export function drawDepthBack(D, t) {
  if (!D) return;
  screenLayer();
  const cam = world.cameraX || 0, lift = baseLift();
  D.bands.forEach((B, b) => {
    const ox = Math.round(cam * B.k), base = GROUND - (b ? 30 : 58) + Math.round(lift * (b ? 0.3 : 0.18));
    for (const it of B.items) {
      const x = Math.round(it.x - ox - it.im.width / 2);
      if (x > W || x + it.im.width < 0) continue;
      X.drawImage(it.im, x, base - it.im.height + 14);
    }
    X.drawImage(B.hill, ox, 0, Math.min(W, B.hill.width - ox), 40, 0, base, Math.min(W, B.hill.width - ox), 40);
    rect(0, base + 40, W, H - base - 40, hillBottom(B.hill));
    if (!b) {
      // the veil: the far band sinks into the sky's haze
      X.globalAlpha = 0.22;
      rect(0, 0, W, H, B.veil);
      X.globalAlpha = 1;
    }
  });
  if (D.rays) {
    X.globalAlpha = 0.07;
    X.fillStyle = '#fff8e0';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 157 - cam * 0.2 + Math.sin(t * 0.3 + i) * 12) % (W + 200) + W + 200) % (W + 200) - 100, w = 18 + (i % 2) * 14;
      X.beginPath();
      X.moveTo(x, 0); X.lineTo(x + w, 0); X.lineTo(x + w - 90, H); X.lineTo(x - 90 - w * 0.6, H);
      X.fill();
    }
    X.globalAlpha = 1;
  }
}
const fills = new WeakMap();
function hillBottom(cv) {
  if (!fills.has(cv)) {
    const d = cv.getContext('2d').getImageData(0, 39, 1, 1).data;
    fills.set(cv, `rgb(${d[0]},${d[1]},${d[2]})`);
  }
  return fills.get(cv);
}

// in front of everything: the tufts along the bottom
export function drawDepthFront(D, t) {
  if (!D) return;
  screenLayer();
  const ox = (world.cameraX || 0) * FRONT;
  const bottom = H - 24; // (standing on the HUD's bottom bar)
  for (const u of D.tufts) {
    const x = Math.round(u.x - ox);
    if (x > W + 30 || x + u.w < -30) continue;
    const im = tuftArt(D, u);
    X.drawImage(im, x + Math.round(Math.sin(t * 1.4 + u.x * 0.05)), bottom - im.height + 4);
  }
}
// a foreground bush (or reed bed, or coin spill) in the world's darkest shade, lit along its top
function tuftArt(D, u) {
  if (u.im) return u.im;
  const F = D.K.front, ink = [26, 20, 40], dark = mix(F.tuft[0], ink, 0.55), lit = mix(F.tuft[1], ink, 0.35);
  const w = Math.round(u.w), h = Math.round(u.h), [cv, g] = canvas(w + 4, h + 6), { r, blob } = painter(g);
  if (F.coins) {
    for (let y = 0; y < h * 0.6; y++) { const k = y / (h * 0.6), ww = w * Math.sqrt(k); r(w / 2 - ww / 2 + 2, h * 0.4 + y + 2, ww, 1, y < 2 ? mix(C.gold, ink, 0.3) : mix(C.orange, ink, 0.55)); }
  } else if (F.reeds) {
    for (let i = 0; i < w; i += 3) { const hh = h * (0.6 + 0.4 * Math.sin((i / w) * Math.PI)) + (i % 2) * 4; r(i + 2, h + 6 - hh, 2, hh, i % 6 ? dark : lit); if (i % 9 === 0) r(i + 1, h + 6 - hh - 3, 3, 5, mix(C.wood, ink, 0.4)); }
  } else {
    const n = Math.max(2, Math.round(w / 9));
    for (let i = 0; i < n; i++) { const cx = 2 + ((i + 0.5) * w) / n, rad = Math.min(h * 0.6, w / n + 2); blob(cx, h + 6 - rad * 0.8, rad, lit); }
    for (let i = 0; i < n; i++) { const cx = 3 + ((i + 0.5) * w) / n, rad = Math.min(h * 0.6, w / n + 2); blob(cx, h + 7 - rad * 0.7, rad - 1, dark); }
    if (u.f && F.flowers) for (let i = 0; i < 3; i++) r(4 + (i * w) / 3, h * 0.4 + 6, 2, 2, C.pink);
  }
  return (u.im = cv);
}
