// Life on the overworld, so the islands read as a big living world seen from high up: clouds that
// drift over at a height (they slide past faster than the ground, a parallax that says "altitude")
// with their shadows crawling across the land below, flocks of birds and their shadows, sailboats
// tacking along the sea lanes between the islands, each world's beastkin wandering about its island,
// and each world's weather (snow on the snowy woods, petals over the shrine, embers off the forge).
// Everything is in map pixels and only what is on screen gets drawn.
import { C } from '../config.js';
import { X, rect } from '../engine/gfx.js';
import { REGIONS, SLOT_W, SLOT_H, SEA, MAP_W, MAP_H, slotX, slotY } from '../data/overworld.js';
import { landAt, painted } from './owart.js';

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}
const L = { ready: false, clouds: [], birds: [], boats: [], critters: [], weather: new Map() };
const R0 = rng(4242);

// a puffy cloud seen from above, drawn once: a lit top, a shaded underside
function cloudArt(r, w) {
  const h = Math.round(w * 0.55), cv = document.createElement('canvas');
  cv.width = w + 8;
  cv.height = h + 8;
  const g = cv.getContext('2d'), puffs = [];
  for (let i = 0; i < 7; i++) puffs.push([4 + w * (0.15 + r() * 0.7), 4 + h * (0.3 + r() * 0.4), h * (0.22 + r() * 0.2)]);
  const blob = (cx, cy, rad, col) => {
    g.fillStyle = col;
    for (let y = -rad; y <= rad; y++) {
      const hw = Math.round(Math.sqrt(rad * rad - y * y));
      g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
    }
  };
  for (const [x, y, rad] of puffs) blob(x + 1, y + 3, rad, '#c3c4d6');
  for (const [x, y, rad] of puffs) blob(x, y, rad, '#f4f1e8');
  for (const [x, y, rad] of puffs) blob(x - rad * 0.25, y - rad * 0.3, rad * 0.55, '#ffffff');
  // its shadow on the ground: the same shape, flat and dark
  const sh = document.createElement('canvas');
  sh.width = cv.width;
  sh.height = cv.height;
  const s = sh.getContext('2d');
  s.fillStyle = '#1a1428';
  for (const [x, y, rad] of puffs)
    for (let yy = -rad; yy <= rad; yy++) {
      const hw = Math.round(Math.sqrt(rad * rad - yy * yy));
      s.fillRect(Math.round(x - hw), Math.round(y + yy), hw * 2, 1);
    }
  return { cv, sh };
}

// each world's residents, as seen from above: body, detail (beak, ears, shell), and a size
const FOLK = [
  { body: '#f4f1e8', det: C.orange, s: 3 }, // sword geese
  { body: '#8a4f22', det: C.paper, s: 3 }, // fuzzballs in the snow
  { body: C.leaf, det: C.lime, s: 3 }, // turtles and frogs
  { body: C.fog, det: C.gold, s: 3 }, // cats and raccoons
  { body: C.sand, det: C.red, s: 3 }, // samurai dogs and kitsune
  { body: C.wood, det: C.cream, s: 3 }, // monkey monks and goats
  { body: C.woodD, det: C.orange, s: 4 }, // blacksmith bears
  { body: C.paper, det: C.pink, s: 2 }, // bunnies and hedgehogs
  { body: C.grass, det: C.ink, s: 2 }, // lizard ninjas
  { body: C.red, det: C.gold, s: 4 } // dragonkin
];
// each world's weather: [kind, count per island]
const WEATHER = [['leaf', 26], ['snow', 90], ['fly', 24], ['lamp', 22], ['petal', 70], ['snow', 50], ['ember', 60], ['fluff', 34], ['firefly', 40], ['glint', 46]];

function setup() {
  L.ready = true;
  const r = R0;
  for (let i = 0; i < 44; i++) {
    const w = 60 + Math.floor(r() * 90);
    L.clouds.push({ x: r() * MAP_W, y: r() * MAP_H, v: 6 + r() * 6, w, ...cloudArt(r, w) });
  }
  for (let i = 0; i < 5; i++) L.birds.push(newFlock(r, true));
  // sailboats on the three sea lanes: above the top row, between the rows, under the bottom row
  const lanes = [SEA / 2, SEA + SLOT_H + SEA / 2, MAP_H - SEA / 2];
  for (let i = 0; i < 6; i++) L.boats.push({ x: r() * MAP_W, y: lanes[i % 3] + (r() - 0.5) * 16, v: (r() < 0.5 ? -1 : 1) * (8 + r() * 6), ph: r() * 6 });
  for (const R of REGIONS) {
    const [kind, n] = WEATHER[R.zone], parts = [];
    for (let i = 0; i < n; i++) parts.push({ x: r() * SLOT_W, y: r() * SLOT_H, ph: r() * 6, k: 0.6 + r() * 0.8 });
    L.weather.set(R.id, { kind, parts });
  }
}
// each world's residents move in once its island is painted (they need to know where the land is)
const housed = new Set();
function house(R) {
  housed.add(R.id);
  const r = R0;
  for (let i = 0; i < 22; i++) {
    for (let tries = 0; tries < 40; tries++) {
      const x = slotX(R) + 40 + r() * (SLOT_W - 80), y = slotY(R) + 40 + r() * (SLOT_H - 80);
      if (landAt(x, y) !== 1) continue;
      L.critters.push({ R, x, y, hx: x, hy: y, tx: x, ty: y, wait: r() * 3, face: 1, ph: r() * 6 });
      break;
    }
  }
}
function newFlock(r, anywhere) {
  const dir = r() < 0.5 ? -1 : 1, ang = (r() - 0.5) * 0.5;
  return {
    x: anywhere ? r() * MAP_W : dir > 0 ? -60 : MAP_W + 60, y: 40 + r() * (MAP_H - 80),
    vx: Math.cos(ang) * 46 * dir, vy: Math.sin(ang) * 46, n: 3 + Math.floor(r() * 4), ph: r() * 6, col: r() < 0.3 ? C.ink : C.paper
  };
}

export function updateLife(dt) {
  if (!L.ready) {
    if (typeof document === 'undefined') return;
    setup();
  }
  for (const R of REGIONS) if (!housed.has(R.id) && painted(R)) house(R);
  for (const c of L.clouds) {
    c.x += c.v * dt;
    c.y += c.v * 0.25 * dt;
    if (c.x > MAP_W + 200) c.x = -200 - c.w;
    if (c.y > MAP_H + 200) c.y = -200;
  }
  L.birds.forEach((b, i) => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < -120 || b.x > MAP_W + 120 || b.y < -120 || b.y > MAP_H + 120) L.birds[i] = newFlock(R0, false);
  });
  for (const b of L.boats) {
    b.x += b.v * dt;
    if (b.x < 20 || b.x > MAP_W - 20) b.v = -b.v, (b.x = Math.max(20, Math.min(MAP_W - 20, b.x)));
  }
  for (const c of L.critters) {
    if (c.wait > 0) { c.wait -= dt; continue; }
    const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
    if (d < 1) {
      c.wait = 0.8 + R0() * 3;
      for (let tries = 0; tries < 6; tries++) {
        const tx = c.hx + (R0() - 0.5) * 120, ty = c.hy + (R0() - 0.5) * 80;
        if (landAt(tx, ty) === 1 && landAt((tx + c.x) / 2, (ty + c.y) / 2) === 1) { c.tx = tx; c.ty = ty; break; }
      }
      continue;
    }
    const v = Math.min(d, 16 * dt);
    c.x += (dx / d) * v;
    c.y += (dy / d) * v;
    if (Math.abs(dx) > 0.5) c.face = Math.sign(dx);
    c.ph += dt * 8;
  }
  for (const [id, w] of L.weather) {
    for (const p of w.parts) {
      const k = p.k;
      if (w.kind === 'snow') { p.y += 14 * k * dt; p.x += Math.sin(p.ph += dt) * 6 * dt + 4 * dt; }
      else if (w.kind === 'petal' || w.kind === 'leaf') { p.y += 10 * k * dt; p.x += 14 * k * dt + Math.sin(p.ph += dt * 2) * 10 * dt; }
      else if (w.kind === 'ember' || w.kind === 'lamp') { p.y -= (w.kind === 'lamp' ? 6 : 16) * k * dt; p.x += Math.sin(p.ph += dt * 1.5) * 8 * dt; }
      else { p.ph += dt; p.x += Math.cos(p.ph * 0.7 * k) * 10 * dt; p.y += Math.sin(p.ph * 1.1) * 8 * dt; }
      p.x = ((p.x % SLOT_W) + SLOT_W) % SLOT_W;
      p.y = ((p.y % SLOT_H) + SLOT_H) % SLOT_H;
    }
  }
}

const seen = (v, x, y, m = 40) => x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m;

// on the ground: cloud shadows, the residents, boats on the sea, and the weather (drawn under the
// roads and nodes, so the route always reads)
export function drawLifeGround(v, t) {
  if (!L.ready) return;
  for (const b of L.boats) {
    if (!seen(v, b.x, b.y)) continue;
    const x = Math.round(b.x), y = Math.round(b.y + Math.sin(t * 1.4 + b.ph)), d = Math.sign(b.v);
    // its wake, then the hull from above and the sail leaning with the wind
    for (let i = 1; i < 5; i++) rect(x - d * (6 + i * 4), y + ((i % 2) ? -1 : 1) * Math.min(i, 3), 2, 1, C.ice);
    rect(x - 5, y - 1, 11, 4, C.ink);
    rect(x - 4, y, 9, 2, C.wood);
    rect(x + d * 4, y, 2, 2, C.woodD);
    rect(x - 1, y - 6, 1, 6, C.woodD);
    rect(x - (d > 0 ? 4 : 0), y - 6, 4, 4, C.paper);
  }
  for (const c of L.critters) {
    if (!seen(v, c.x, c.y)) continue;
    const F = FOLK[c.R.zone], x = Math.round(c.x), y = Math.round(c.y), hop = c.wait > 0 ? 0 : Math.abs(Math.sin(c.ph)) > 0.6 ? 1 : 0, s = F.s;
    rect(x - s, y + 1, s * 2 + 1, 1, 'rgba(26,20,40,0.35)');
    rect(x - s, y - s - hop, s * 2, s + 1, F.body);
    rect(x + (c.face > 0 ? s - 1 : -s - 1), y - s - 1 - hop, 2, 2, F.body);
    rect(x + (c.face > 0 ? s + 1 : -s - 2), y - s - hop, 1, 1, F.det);
  }
  for (const R of REGIONS) {
    const ox = slotX(R), oy = slotY(R);
    if (ox > v.x1 || ox + SLOT_W < v.x0 || oy > v.y1 || oy + SLOT_H < v.y0) continue;
    const w = L.weather.get(R.id);
    for (const p of w.parts) {
      const x = Math.round(ox + p.x), y = Math.round(oy + p.y);
      if (!seen(v, x, y, 4)) continue;
      const tw = Math.sin(t * 3 + p.ph * 5);
      if (w.kind === 'snow') rect(x, y, p.k > 1.1 ? 2 : 1, p.k > 1.1 ? 2 : 1, C.paper);
      else if (w.kind === 'petal') rect(x, y, 2, 1, tw > 0 ? C.pink : '#ffd1e6');
      else if (w.kind === 'leaf') rect(x, y, 2, 1, tw > 0 ? C.orange : C.gold);
      else if (w.kind === 'ember') { if (tw > -0.6) rect(x, y, 1, 1, tw > 0.3 ? C.gold : C.orange); }
      else if (w.kind === 'lamp') { rect(x - 1, y - 1, 3, 3, 'rgba(255,193,90,0.25)'); rect(x, y, 1, 2, C.gold); }
      else if (w.kind === 'firefly' || w.kind === 'fly') { if (tw > 0) { rect(x - 1, y - 1, 3, 3, w.kind === 'fly' ? 'rgba(183,226,122,0.3)' : 'rgba(248,224,142,0.3)'); rect(x, y, 1, 1, w.kind === 'fly' ? C.lime : C.cream); } }
      else if (w.kind === 'fluff') rect(x, y, 1, 1, C.paper);
      else if (w.kind === 'glint') { if (tw > 0.7) { rect(x - 1, y, 3, 1, C.paper); rect(x, y - 1, 1, 3, C.paper); } }
    }
  }
  // cloud shadows: the sun is high to the south-west, so a shadow lies a little down and left
  X.globalAlpha = 0.16;
  for (const c of L.clouds) {
    const x = Math.round(c.x - 30), y = Math.round(c.y + 70);
    if (x > v.x1 || x + c.sh.width < v.x0 || y > v.y1 || y + c.sh.height < v.y0) continue;
    X.drawImage(c.sh, x, y);
  }
  X.globalAlpha = 1;
}

// up in the sky, over everything: birds and the clouds themselves. They sit higher than the ground,
// so they slide past faster when the camera moves (and part to let you see when you zoom out)
export function drawLifeSky(v, t, z) {
  if (!L.ready) return;
  const cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2;
  for (const b of L.birds) {
    for (let i = 0; i < b.n; i++) {
      const side = i % 2 ? 1 : -1, row = Math.ceil(i / 2), d = Math.sign(b.vx) || 1;
      const x = b.x - d * row * 7, y = b.y + side * row * 5, flap = Math.sin(t * 9 + b.ph + i) > 0;
      if (!seen(v, x, y)) continue;
      rect(x - 14, y + 26, 3, 1, 'rgba(26,20,40,0.25)'); // its shadow, far below
      const px = x + (x - cx) * 0.15, py = y + (y - cy) * 0.15;
      rect(px - 2, py - (flap ? 1 : 0), 2, 1, b.col);
      rect(px + 1, py - (flap ? 1 : 0), 2, 1, b.col);
      rect(px, py, 1, 1, b.col);
    }
  }
  X.globalAlpha = 0.85 * Math.max(0, Math.min(1, (z - 0.35) / 0.4));
  if (X.globalAlpha > 0.02)
    for (const c of L.clouds) {
      const x = Math.round(c.x + (c.x - cx) * 0.35), y = Math.round(c.y + (c.y - cy) * 0.35);
      if (x > v.x1 + 60 || x + c.cv.width < v.x0 - 60 || y > v.y1 + 60 || y + c.cv.height < v.y0 - 60) continue;
      X.drawImage(c.cv, x, y);
    }
  X.globalAlpha = 1;
}
