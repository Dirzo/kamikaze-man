// The overworld seen from above: every region is an island of its world's ground (graveyard grass,
// snowfields, lagoon ponds, bazaar cobbles, sakura meadows, mountain rock, forge basalt and lava,
// Grandma's meadow, ninja roof tiles, the dragon's gold), scattered with its own props and with its
// weapon stuck point-first in the ground all over: swords in the graveyard, arrows in the snow,
// hammers in the forge. One giant weapon stands in each region as its landmark. Each island is
// painted once into its own canvas (seeded, so it never changes) and the scene just blits it.
import { C } from '../config.js';
import { NODES, REGIONS, SLOT_W, SLOT_H, SCALE, slotX, slotY, roadPath } from '../data/overworld.js';

// ground: [base, light, dark], rim: the shore, props: what grows there, weapon: what's stuck in it
//   pond: share of the island under water (the lagoon)   lava: lava rivers (the forge)
//   tiles: a paved or tiled floor in this colour (the bazaar's cobbles, the castle's roofs)
const BIOME = [
  { g: ['#5e7a3c', '#7a9448', '#46602e'], rim: '#c9a66b', props: ['grave', 'grave', 'grave', 'bush', 'tuft'], weapon: 'sword' },
  { g: ['#dfe8f4', '#ffffff', '#a8c4e0'], rim: '#a8dcfd', props: ['pine', 'pine', 'drift', 'tuft'], weapon: 'arrow' },
  { g: ['#5f9c42', '#9ed06a', '#3f7a32'], rim: '#e8cf8e', props: ['reed', 'rock', 'bush'], weapon: 'nunchucks', pond: 0.42 },
  { g: ['#4a4466', '#625e82', '#2b2442'], rim: '#3e3a5c', props: ['lantern', 'crate', 'awning'], weapon: 'dagger', tiles: '#2b2442' },
  { g: ['#8fbf5a', '#b7e27a', '#5f8f3a'], rim: '#f8e08e', props: ['sakura', 'sakura', 'petals', 'lantern'], weapon: 'katana' },
  { g: ['#8a89a6', '#b3b4c8', '#5d5a7a'], rim: '#5d5a7a', props: ['rock', 'rock', 'pine', 'snow'], weapon: 'staff' },
  { g: ['#3a2c30', '#54403c', '#1f171c'], rim: '#1a1428', props: ['rock', 'anvil', 'ember'], weapon: 'hammer', lava: true },
  { g: ['#7cc254', '#a8d870', '#5fa244'], rim: '#e8cf8e', props: ['tree', 'tree', 'flower', 'flower', 'mushroom'], weapon: 'wand' },
  { g: ['#2e3460', '#3e467a', '#1d2246'], rim: '#1a1428', props: ['bamboo', 'lantern', 'rock'], weapon: 'shuriken', tiles: '#1d2246' },
  { g: ['#c9a66b', '#ffc15a', '#8a4f22'], rim: '#8a4f22', props: ['coins', 'coins', 'chest'], weapon: 'mixed' }
];
export const biomeOf = zone => BIOME[zone];

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
// smooth value noise in 0..1, for the coast, the ground's light and dark patches, ponds and lava
function noise(seed) {
  const r = rng(seed), G = 24, S = G + 2, grid = new Float32Array(S * S);
  for (let i = 0; i < grid.length; i++) grid[i] = r();
  return (x, y, cell) => {
    const fx = x / cell, fy = y / cell, i = Math.floor(fx), j = Math.floor(fy);
    let u = fx - i, v = fy - j;
    u = u * u * (3 - 2 * u);
    v = v * v * (3 - 2 * v);
    const i0 = i % (G + 1), i1 = (i + 1) % (G + 1), j0 = (j % (G + 1)) * S, j1 = ((j + 1) % (G + 1)) * S;
    const a = grid[j0 + i0] + (grid[j0 + i1] - grid[j0 + i0]) * u, b = grid[j1 + i0] + (grid[j1 + i1] - grid[j1 + i0]) * u;
    return a + (b - a) * v;
  };
}
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// how far every pixel of a region is from the nearest road or node (capped at 40), in its own
// pixels: ponds, lava and props keep off the roads, and the landmark stands well away from them
const DISC = [];
for (let y = -40; y <= 40; y++) for (let x = -40; x <= 40; x++) { const d = Math.hypot(x, y); if (d < 40) DISC.push(x, y, d); }
function roadField(R, w, h) {
  const ox = slotX(R), oy = slotY(R), F = new Uint8Array(w * h).fill(40);
  const stamp = (cx, cy) => {
    cx = Math.round(cx - ox); cy = Math.round(cy - oy);
    if (cx < -40 || cy < -40 || cx > w + 40 || cy > h + 40) return;
    for (let k = 0; k < DISC.length; k += 3) {
      const x = cx + DISC[k], y = cy + DISC[k + 1];
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = y * w + x;
      if (DISC[k + 2] < F[i]) F[i] = DISC[k + 2];
    }
  };
  for (const n of Object.values(NODES)) {
    if (n.region === R.id) stamp(n.x, n.y);
    for (const to of [...(n.next || []), ...(n.secret || [])]) {
      const m = NODES[to];
      if (!m || (n.region !== R.id && m.region !== R.id)) continue;
      const P = roadPath(n, m);
      for (let i = 0; i < P.length; i += 2) stamp(P[i].x, P[i].y);
    }
  }
  return F;
}
// where the land is: each island's mask, for bridges over the sea and critters that stay ashore
const lands = new Map();
export function landAt(x, y) {
  for (const R of REGIONS) {
    const lx = Math.floor(x - slotX(R)), ly = Math.floor(y - slotY(R));
    if (lx < 0 || ly < 0 || lx >= SLOT_W || ly >= SLOT_H) continue;
    const L = lands.get(R.id);
    return L ? L[ly * SLOT_W + lx] : 0; // 0 sea, 1 land, 2 inland water or lava
  }
  return 0;
}

// ---------------------------------------------------------------- the weapons, stuck in the ground
// (x, y) is where it goes in; k scales it up for the landmark; lean tips the top over a pixel or two
function stuck(k, kind, x, y, lean, r) {
  const px = (a, b, w, h, col) => ((k.fillStyle = col), k.fillRect(Math.round(a), Math.round(b), w, h));
  const s = kind === 'mixed' ? ['sword', 'katana', 'hammer', 'staff', 'dagger', 'wand'][Math.floor(r() * 6)] : kind;
  // a shaft from the ground up, leaning as it rises
  const shaft = (len, w, col, edge) => {
    for (let i = 0; i < len; i++) {
      const dx = (lean * i) / len;
      px(x + dx, y - i, w, 1, col);
      if (edge) px(x + dx + w, y - i, 1, 1, edge);
    }
    return [x + lean, y - len];
  };
  px(x - 3, y, 8, 2, 'rgba(26,20,40,0.35)'); // its shadow
  px(x - 2, y - 1, 6, 1, 'rgba(26,20,40,0.25)'); // the scuffed earth where it went in
  if (s === 'sword' || s === 'katana' || s === 'dagger') {
    const len = s === 'dagger' ? 5 : s === 'katana' ? 10 : 9;
    const [tx, ty] = shaft(len, s === 'katana' ? 1 : 2, C.mist, C.paper);
    px(tx - (s === 'katana' ? 1 : 2), ty, s === 'katana' ? 3 : 6, 1, s === 'katana' ? C.ink : C.gold); // the guard
    for (let i = 1; i <= (s === 'dagger' ? 2 : 3); i++) px(tx, ty - i, 2, 1, s === 'katana' ? (i % 2 ? C.red : C.ink) : C.wood);
    px(tx, ty - (s === 'dagger' ? 3 : 4), 2, 1, s === 'katana' ? C.ink : C.gold); // the pommel
  } else if (s === 'arrow') {
    const [tx, ty] = shaft(8, 1, C.wood);
    px(tx - 1, ty, 1, 2, C.paper);
    px(tx + 1, ty, 1, 2, C.red);
  } else if (s === 'staff') {
    const [tx, ty] = shaft(14, 1, C.wood, C.woodD);
    px(tx - 1, ty - 2, 3, 3, C.teal);
    px(tx, ty - 2, 1, 1, C.paper);
  } else if (s === 'hammer') {
    px(x - 3, y - 3, 8, 4, C.stone); // the head, half buried
    px(x - 3, y - 3, 8, 1, C.mist);
    const [tx, ty] = shaft(7, 1, C.wood, C.woodD);
    px(tx, ty, 1, 1, C.rust);
  } else if (s === 'wand') {
    const [tx, ty] = shaft(7, 1, C.wood);
    px(tx - 1, ty - 1, 3, 1, C.gold);
    px(tx, ty - 2, 1, 3, C.gold);
    px(tx, ty - 1, 1, 1, C.paper);
  } else if (s === 'shuriken') {
    // thrown flat into the ground, one point up
    px(x, y - 5, 1, 3, C.mist);
    px(x - 2, y - 3, 5, 1, C.mist);
    px(x, y - 3, 1, 1, C.ink);
    px(x - 1, y - 4, 1, 1, C.fog);
    px(x + 1, y - 2, 1, 1, C.fog);
  } else if (s === 'nunchucks') {
    // one stick planted, the other lying on its chain
    shaft(5, 1, C.wood, C.woodD);
    px(x + lean, y - 6, 1, 1, C.fog);
    px(x + lean + 1, y - 5, 2, 1, C.fog);
    px(x + 2, y - 1, 5, 1, C.wood);
    px(x + 2, y, 5, 1, C.woodD);
  }
}

// ---------------------------------------------------------------- props, seen from above
function prop(k, kind, x, y, r) {
  const px = (a, b, w, h, col) => ((k.fillStyle = col), k.fillRect(Math.round(a), Math.round(b), w, h));
  const blob = (cx, cy, rad, col) => {
    for (let dy = -rad; dy <= rad; dy++) {
      const w = Math.round(Math.sqrt(rad * rad - dy * dy));
      px(cx - w, cy + dy, w * 2 + 1, 1, col);
    }
  };
  const shadow = (w, h = 2) => px(x - w / 2 + 2, y + 1, w, h, 'rgba(26,20,40,0.3)');
  if (kind === 'grave') {
    shadow(8);
    px(x - 3, y - 7, 6, 8, C.stone);
    px(x - 2, y - 8, 4, 1, C.stone);
    px(x - 3, y - 7, 1, 8, C.mist);
    px(x - 1, y - 5, 2, 1, C.slate);
  } else if (kind === 'bush' || kind === 'tree' || kind === 'sakura') {
    const rad = kind === 'bush' ? 3 : 5, top = kind === 'sakura' ? [C.coral, C.pink, '#ffd1e6'] : kind === 'tree' ? [C.pine, C.leaf, C.grass] : [C.pine, C.leaf, C.lime];
    shadow(rad * 2 + 2, 3);
    if (kind !== 'bush') px(x, y - 2, 2, 3, C.woodD);
    blob(x + 1, y - rad - 1, rad, top[0]);
    blob(x, y - rad - 2, rad - 1, top[1]);
    blob(x - 1, y - rad - 3, Math.max(1, rad - 3), top[2]);
    if (kind === 'tree' && r() < 0.5) px(x + 1, y - rad - 1, 1, 1, C.red); // an apple
  } else if (kind === 'pine') {
    shadow(8, 3);
    for (let i = 0; i < 4; i++) px(x - 4 + i, y - 2 - i * 3, 9 - i * 2, 3, i % 2 ? C.leaf : C.pine);
    px(x - 2, y - 11, 5, 1, C.paper); // snow on its top
    px(x - 3, y - 5, 2, 1, C.paper);
  } else if (kind === 'tuft') {
    px(x, y - 2, 1, 3, C.lime);
    px(x - 2, y - 1, 1, 2, C.grass);
    px(x + 2, y - 1, 1, 2, C.grass);
  } else if (kind === 'drift') {
    px(x - 5, y - 1, 11, 2, C.paper);
    px(x - 3, y - 2, 7, 1, C.paper);
    px(x - 5, y + 1, 11, 1, C.ice);
  } else if (kind === 'reed') {
    for (let i = -2; i <= 2; i += 2) px(x + i, y - 5 - Math.abs(i), 1, 5 + Math.abs(i), C.leaf);
    px(x, y - 7, 1, 2, C.wood);
  } else if (kind === 'rock' || kind === 'snow') {
    shadow(9);
    blob(x, y - 3, 4, C.stone);
    blob(x - 1, y - 4, 2, C.fog);
    if (kind === 'snow') px(x - 2, y - 7, 4, 2, C.paper);
  } else if (kind === 'lantern') {
    px(x, y - 8, 1, 8, C.woodD);
    px(x - 2, y - 11, 5, 4, C.red);
    px(x - 1, y - 10, 3, 2, C.gold);
    k.fillStyle = 'rgba(255,193,90,0.18)';
    k.fillRect(x - 6, y - 15, 13, 13); // its glow
  } else if (kind === 'crate') {
    shadow(8);
    px(x - 3, y - 6, 7, 6, C.wood);
    px(x - 3, y - 6, 7, 1, C.sand);
    px(x - 3, y - 3, 7, 1, C.woodD);
  } else if (kind === 'awning') {
    shadow(14, 3);
    for (let i = 0; i < 12; i += 2) px(x - 6 + i, y - 8, 2, 6, i % 4 ? C.paper : C.red);
    px(x - 6, y - 2, 12, 1, C.ink);
  } else if (kind === 'petals') {
    for (let i = 0; i < 5; i++) px(x + Math.floor(r() * 9) - 4, y + Math.floor(r() * 5) - 2, 1, 1, C.pink);
  } else if (kind === 'anvil') {
    shadow(10);
    px(x - 4, y - 5, 9, 2, C.slate);
    px(x - 2, y - 3, 5, 3, C.slate);
    px(x - 4, y - 5, 9, 1, C.fog);
  } else if (kind === 'ember') {
    px(x, y, 1, 1, C.orange);
    px(x + 2, y - 2, 1, 1, C.gold);
  } else if (kind === 'flower') {
    const col = [C.pink, C.gold, C.paper, C.violet][Math.floor(r() * 4)];
    px(x - 1, y - 1, 3, 1, col);
    px(x, y - 2, 1, 3, col);
    px(x, y - 1, 1, 1, C.gold);
  } else if (kind === 'mushroom') {
    px(x, y - 2, 1, 2, C.paper);
    px(x - 2, y - 4, 5, 2, C.red);
    px(x - 1, y - 4, 1, 1, C.paper);
  } else if (kind === 'bamboo') {
    for (const dx of [-2, 1, 3]) for (let i = 0; i < 14; i++) px(x + dx, y - i, 1, 1, i % 5 ? C.leaf : C.pine);
  } else if (kind === 'coins') {
    shadow(10);
    blob(x, y - 2, 4, C.orange);
    blob(x, y - 3, 3, C.gold);
    px(x - 1, y - 5, 2, 1, C.cream);
  } else if (kind === 'chest') {
    shadow(10);
    px(x - 4, y - 6, 9, 6, C.wood);
    px(x - 4, y - 6, 9, 2, C.woodD);
    px(x, y - 4, 1, 2, C.gold);
  }
}

// ---------------------------------------------------------------- the continents of Hoplon
// Every world is its own continent with its own outline: the graveyard's boot, the snowy crescent,
// the lagoon's atoll round its inner sea, the bazaar's ragged coast, the shrine's five petals, the
// monastery's mountain spine, the forge's volcano with its crater lake, the cottage's soft teardrop,
// the ninja castle's four-point star and the dragon's hoard with its scatter of islets. A shape is a
// union of ellipses (minus a few bites), measured in pixels inland (negative out to sea).
const ell = (u, v, ru, rv, sub = false) => ({ u, v, ru, rv, sub });
const SHAPES = {
  1: { parts: [ell(0.52, 0.5, 0.36, 0.33), ell(0.14, 0.72, 0.13, 0.14), ell(0.86, 0.28, 0.13, 0.22), ell(0.3, 0.22, 0.16, 0.12)], rough: 40 },
  2: { parts: [ell(0.5, 0.56, 0.42, 0.37), ell(0.16, 0.28, 0.12, 0.2), ell(0.6, 0.06, 0.24, 0.2, true)], rough: 30 },
  3: { parts: [ell(0.5, 0.5, 0.44, 0.42), ell(0.52, 0.47, 0.17, 0.12, true)], rough: 26 },
  4: { parts: [ell(0.5, 0.5, 0.42, 0.4), ell(0.48, 1.0, 0.1, 0.2, true), ell(0.0, 0.42, 0.1, 0.1, true), ell(1, 0.75, 0.08, 0.14, true)], rough: 70 },
  5: { parts: [ell(0.5, 0.5, 0.13, 0.16), ...[0, 1, 2, 3, 4].map(k => ell(0.5 + Math.cos(k * 1.2566 - 1.57) * 0.29, 0.5 + Math.sin(k * 1.2566 - 1.57) * 0.3, 0.15, 0.17))], rough: 10 },
  6: { parts: [ell(0.5, 0.5, 0.44, 0.24), ell(0.28, 0.3, 0.16, 0.24), ell(0.72, 0.72, 0.16, 0.24), ell(0.88, 0.32, 0.1, 0.14)], rough: 34 },
  7: { parts: [ell(0.5, 0.5, 0.38, 0.41), ell(0.12, 0.62, 0.12, 0.1), ell(0.88, 0.4, 0.12, 0.12), ell(0.56, 0.42, 0.07, 0.07, true)], rough: 22 },
  8: { parts: [ell(0.44, 0.52, 0.4, 0.42), ell(0.74, 0.42, 0.2, 0.28)], rough: 14 },
  9: { parts: [ell(0.5, 0.5, 0.47, 0.09), ell(0.5, 0.5, 0.08, 0.46), ell(0.5, 0.5, 0.19, 0.21), ell(0.24, 0.22, 0.07, 0.07), ell(0.76, 0.78, 0.07, 0.07)], rough: 8 },
  10: { parts: [ell(0.46, 0.5, 0.36, 0.38), ell(0.85, 0.2, 0.08, 0.1), ell(0.88, 0.62, 0.07, 0.08), ell(0.12, 0.15, 0.07, 0.07), ell(0.7, 0.9, 0.06, 0.06), ell(0.1, 0.86, 0.08, 0.07), ell(0.9, 0.86, 0.05, 0.05)], rough: 24 }
};
function continent(R, w, h, F) {
  const S = SHAPES[R.id] || SHAPES[1], add = S.parts.filter(p => !p.sub), sub = S.parts.filter(p => p.sub);
  const sd = (p, x, y) => {
    const rx = p.ru * w, ry = p.rv * h;
    return (1 - Math.hypot((x - p.u * w) / rx, (y - p.v * h) / ry)) * Math.min(rx, ry);
  };
  return (x, y, n1, n3) => {
    let d = -1e9;
    for (const p of add) d = Math.max(d, sd(p, x, y));
    for (const p of sub) d = Math.min(d, -sd(p, x, y));
    d += (n1(x, y, 44) - 0.5) * S.rough * 2 + (n3(x, y, 13) - 0.5) * 12;
    d = Math.min(d, Math.min(x, y, w - 1 - x, h - 1 - y) - 6);
    return Math.max(d, 9 - F[y * w + x]);
  };
}

// ---------------------------------------------------------------- one island
const cache = new Map();
// paint one island that hasn't been painted yet (the scene calls this every frame, so the whole map
// is ready a moment after it opens without one long stall)
export function paintAhead() {
  const R = REGIONS.find(R => !cache.has(R.id));
  if (R) regionArt(R);
}
export const painted = R => cache.has(R.id);
export function regionArt(R) {
  if (cache.has(R.id)) return cache.get(R.id);
  if (typeof document === 'undefined') return null;
  const B = BIOME[R.zone], w = SLOT_W, h = SLOT_H, cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const k = cv.getContext('2d'), img = k.createImageData(w, h), d = img.data;
  const n1 = noise(R.id * 101), n2 = noise(R.id * 211 + 7), n3 = noise(R.id * 307 + 3), r = rng(R.id * 977);
  const [base, light, dark] = B.g.map(hex), rim = hex(B.rim), water = hex('#2f5fbf'), shallow = hex('#5aa6f0'), lava = hex('#f08a2c'), lavaD = hex('#c4501f'), ink = hex(C.ink);
  const tile = B.tiles && hex(B.tiles);
  const F = roadField(R, w, h), L = new Uint8Array(w * h), n4 = noise(R.id * 401 + 11), E = new Uint8Array(w * h);
  lands.set(R.id, L);
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { // (smooth enough to sample every other pixel)
    const b = Math.floor(n4(x, y, 70) * 7);
    E[y * w + x] = E[y * w + x + 1] = E[(y + 1) * w + x] = E[(y + 1) * w + x + 1] = b;
  }
  const depthAt = continent(R, w, h, F);
  const band = (x, y) => E[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    // how far inland this pixel is: the continent's own shape, a ragged coast, never past the slot's
    // edge, and the land always reaches the roads (they run out on piers to their bridges)
    const edge = depthAt(x, y, n1, n3), coast = 0;
    if (edge < coast) continue; // the sea
    L[y * w + x] = 1;
    let col = base;
    const v = n2(x, y, 22) + ((x + y) % 2 ? 0.04 : -0.04); // (a checker dither on the patch edges)
    if (v > 0.7) col = light;
    else if (v < 0.3) col = dark;
    else if (((x * 7 + y * 13) ^ (x * y)) % 23 === 0) col = (x + y) % 3 ? light : dark; // a fleck of texture
    if (tile && (y % 8 === 0 || (x + (Math.floor(y / 8) % 2) * 6) % 12 === 0)) col = col.map((c, j) => Math.round((c + tile[j]) / 2)); // cobbles / roof tiles, faint
    // rolling hills: contour lines on the high ground, a lit side and a shadowed side
    const b = E[y * w + x];
    if (b >= 4) {
      if (band(x - 2, y - 2) < b) col = col.map(c => Math.min(255, c + 22)); // the lit lip of a rise
      else if (band(x + 2, y + 2) < b) col = col.map(c => Math.round(c * 0.72)); // its shaded face
    }
    const nearRoad = F[y * w + x] < 14;
    if (B.pond && !nearRoad && n3(x, y, 46) < B.pond) { col = n3(x, y, 46) > B.pond - 0.03 ? shallow : water; L[y * w + x] = 2; }
    if (B.lava && !nearRoad && Math.abs(n3(x, y, 52) - 0.5) < 0.03) { col = Math.abs(n3(x, y, 52) - 0.5) < 0.012 ? lava : lavaD; L[y * w + x] = 2; }
    if (edge < coast + 5) { col = rim; L[y * w + x] = 1; } // the shore
    if (edge < coast + 1) col = ink; // inked
    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  k.putImageData(img, 0, 0);
  const free = (x, y, room) => {
    if (x < 4 || y < 4 || x >= w - 4 || y >= h - 4) return false;
    for (const [dx, dy] of [[0, 0], [-6, 0], [6, 0], [0, -8], [0, 3]]) {
      const i = ((y + dy) * w + (x + dx)) * 4;
      if (!d[i + 3] || (d[i] === water[0] && d[i + 1] === water[1] && d[i + 2] === water[2]) || (d[i] === lava[0] && d[i + 1] === lava[1])) return false;
    }
    return F[y * w + x] >= room && y > 30; // (clear of the region's name tag)
  };
  // things get drawn top to bottom, so nearer ones overlap the ones behind
  const things = [];
  for (let n = 0; n < 7000 && things.length < 520; n++) {
    const x = 8 + Math.floor(r() * (w - 16)), y = 8 + Math.floor(r() * (h - 16));
    if (!free(x, y, 14) || things.some(t => Math.abs(t.x - x) < 9 && Math.abs(t.y - y) < 7)) continue;
    // the weapons come in little clusters, the rest is the world's own stuff
    if (r() < 0.38) for (let j = 0, m = 1 + Math.floor(r() * 3); j < m; j++) things.push({ x: x + j * 5 - 4, y: y + (j % 2) * 3, weapon: true, lean: Math.round((r() - 0.5) * 4) });
    else things.push({ x, y, kind: B.props[Math.floor(r() * B.props.length)] });
  }
  // the landmark: the giant weapon, where it's furthest from every road
  let best = null;
  for (let n = 0; n < 400; n++) {
    const x = 50 + Math.floor(r() * (w - 100)), y = 90 + Math.floor(r() * (h - 140));
    if (!free(x, y, 0)) continue;
    const dist = F[y * w + x] + r();
    if (dist > 34 && (!best || dist > best.dist)) best = { x, y, dist };
  }
  things.sort((a, b) => a.y - b.y);
  for (const t of things) t.weapon ? stuck(k, B.weapon, t.x, t.y, t.lean, r) : prop(k, t.kind, t.x, t.y, r);
  if (best) {
    k.save();
    k.translate(best.x, best.y);
    k.scale(5, 5);
    stuck(k, B.weapon === 'arrow' ? 'arrow' : B.weapon, 0, 0, 1, () => 0);
    k.restore();
  }
  cache.set(R.id, cv);
  return cv;
}
