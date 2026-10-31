// The living world around a level: every zone dressed for its beastkin family (data/biomes.js says
// what each zone has, art-src/biomes.py draws it).
//   backdrop  four parallax layers that follow the camera at their own depth, with animated extras
//             painted between them: drifting clouds, the aurora, fireworks, geese, coin avalanches
//   terrain   the zone's ground texture, its top lip (grass, snow, roof tiles, coins), ice sheets,
//             conveyor belts, cave-roof edges and pits (spikes, or water, lava and honey you sink in)
//   props     swords, lanterns, bells and honey pots along the route that sway, flicker and steam
//   weather   snow, petals, embers, fireflies, bees and the rest, drifting at different depths
//   touches   ice you slide on (zone 2), wind gusts that push you (zone 6), conveyor belts that carry
//             you (zone 7) and pools of darkness only the lamps light up (zone 4)
// Everything is set up the first time a map is drawn (world.amb.map), so new maps and secret rooms
// dress themselves.
import { W, H, GROUND, C } from '../config.js';
import { world } from './world.js';
import { A } from '../engine/assets.js';
import { X, rect, dither, screenLayer, worldLayer } from '../engine/gfx.js';
import { ZONES } from '../data/zones.js';
import { BIOMES, touchedGrounds } from '../data/biomes.js';
import { cameraTargetY } from '../data/maps.js';
import { overlap, worldWidth } from './physics.js';
import { callout } from './fx.js';
import { depthOf, drawDepthBack, drawDepthFront } from './depth.js';

const art = () => A.biome?.[ZONES[world.zone]?.id];
export const biome = () => BIOMES[ZONES[world.zone]?.id] || null;
// the zone's ground tile and lip strip, for terrain drawn elsewhere (a loop, gadgets.js)
export const terrainArt = () => { const a = art(); return a?.sprites?.ground ? { atlas: a.atlas, ground: a.sprites.ground, lip: a.sprites.lip } : null; };
const visible = (x, y, w, h) => x + w >= world.cameraX && x <= world.cameraX + W && y + h >= world.cameraY && y <= world.cameraY + H;

// a small seeded random, so a map dresses the same way every time
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- setting up a map
export function ambience() {
  const map = world.map;
  if (!map) return null;
  if (world.amb?.map === map) return world.amb;
  const B = biome(), R = seeded(world.zone * 977 + Math.round(map.width) * 7 + map.platforms.length);
  const amb = (world.amb = { map, B, R, t: 0, props: [], parts: [], sky: [], smoke: [], camX: world.cameraX || 0, camY: world.cameraY || 0, wind: null, clouds: [] });
  if (!B) return amb;
  // terrain touches (never the runway or the arena)
  if (B.surface?.ice) for (const p of touchedGrounds(map, B.surface.ice)) p.ice = true;
  if (B.surface?.belt) touchedGrounds(map, B.surface.belt).forEach((p, k) => (p.belt = (k % 3 === 1 ? -1 : 1) * B.surface.speed));
  if (B.wind) amb.wind = { phase: 'calm', t: 3, dir: 1, v: 0, told: false };
  // props along every stretch of ground, kept clear of the start and the exit
  const list = B.props.list, total = list.reduce((s, p) => s + p[1], 0);
  for (const p of map.platforms) {
    if (!p.ground || p.belt) continue;
    for (let x = p.x + 10 + R() * B.props.gap[0]; x < p.x + p.w - 10; x += B.props.gap[0] + R() * (B.props.gap[1] - B.props.gap[0])) {
      if (Math.abs(x - map.startX) < 34 || Math.abs(x - map.exitX) < 34) continue;
      if (map.solids.some(s => s.cliff && x > s.x - 8 && x < s.x + s.w + 8 && s.y < p.y && s.y + s.h > p.y - 64)) continue; // no trees in a tunnel
      let k = R() * total, it = list[0];
      for (it of list) if ((k -= it[1]) < 0) break;
      amb.props.push({ s: it[0], x: Math.round(x), y: p.y, fps: it[2], opt: it[3] || {}, ph: R() * 10, v: Math.floor(R() * 8), ice: p.ice });
    }
  }
  // weather: each kind keeps its particles on screen, at its own depth
  for (const [kind, n] of B.weather || []) for (let i = 0; i < n; i++) amb.parts.push(spawn(kind, R, true));
  if (B.clouds) {
    const [n, col, shade, speed, y0, y1] = B.clouds;
    for (let i = 0; i < n; i++) amb.clouds.push({ x: R() * (W + 120), y: y0 + R() * (y1 - y0), im: cloud(R, col, shade, 24 + R() * 30), v: speed * (0.6 + R() * 0.8) });
  }
  if (B.sky?.includes('moonClouds')) for (let i = 0; i < 3; i++) amb.clouds.push({ x: R() * (W + 120), y: 60 + i * 26 + R() * 10, im: cloud(R, '#2e2a6e', '#221e58', 40 + R() * 24), v: 4 + R() * 3, dark: true });
  if (B.sky?.includes('mist')) amb.mist = [mist(R, 150), mist(R, 186)];
  return amb;
}

// a puffy pixel cloud, drawn once
function cloud(R, col, shade, w) {
  const cv = document.createElement('canvas'), h = Math.round(w * 0.42);
  cv.width = Math.ceil(w) + 4;
  cv.height = h + 4;
  const g = cv.getContext('2d');
  const blob = (cx, cy, r, c) => {
    g.fillStyle = c;
    for (let y = -r; y <= r; y++) {
      const hw = Math.round(Math.sqrt(r * r - y * y));
      g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
    }
  };
  const puffs = [];
  for (let x = h * 0.5; x < w - h * 0.4; x += h * 0.45) puffs.push([x + 2, h * 0.62 - R() * h * 0.25 + 2, h * (0.32 + R() * 0.16)]);
  for (const [x, y, r] of puffs) blob(x, y + 2, r, shade);
  for (const [x, y, r] of puffs) blob(x, y, r, col);
  g.fillStyle = shade;
  g.fillRect(Math.round(h * 0.3), h + 1, Math.round(w - h * 0.6), 1);
  return cv;
}
// a band of drifting mist: soft dithered blobs that tile left to right
function mist(R, y) {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = 28;
  const g = cv.getContext('2d');
  for (let i = 0; i < 9; i++) {
    const cx = R() * W, w = 50 + R() * 70, h = 6 + R() * 8;
    for (let yy = -h; yy <= h; yy++) {
      const hw = Math.round(w * Math.sqrt(1 - (yy * yy) / (h * h)));
      for (let x = -hw; x < hw; x++) {
        const dens = 1 - Math.abs(yy) / h;
        if (((x + yy * 2) & 3) === 0 || (dens > 0.5 && ((x + yy) & 1) === 0)) {
          g.fillStyle = dens > 0.6 ? '#ffffff' : '#e8f0fa';
          g.fillRect(((Math.round(cx + x) % W) + W) % W, Math.round(14 + yy), 1, 1);
        }
      }
    }
  }
  return { cv, y, x: R() * W };
}

// ---------------------------------------------------------------- weather particles
const WEATHER = {
  snow: { cols: ['#f4f1e8', '#c3c4d6', '#ffffff'], s: 1, vy: [12, 26], vx: [-4, 4], sway: 5, z: [0.5, 1] },
  snowBig: { cols: ['#ffffff'], s: 2, vy: [20, 34], vx: [-6, 2], sway: 8, z: [1.2, 1.5] },
  petal: { cols: ['#ffb0d0', '#ff8ab8', '#ffd0e4'], s: 2, vy: [10, 20], vx: [-14, -4], sway: 10, z: [0.6, 1.2], flip: true },
  petalBig: { cols: ['#ff8ab8', '#ffb0d0'], s: 3, vy: [16, 26], vx: [-20, -8], sway: 12, z: [1.3, 1.6], flip: true },
  leaf: { cols: ['#7cc254', '#ffc15a', '#f08a2c', '#b7e27a'], s: 2, vy: [8, 16], vx: [-10, -2], sway: 12, z: [0.6, 1.3], flip: true },
  fluff: { cols: ['#f4f1e8'], s: 1, vy: [-3, 3], vx: [4, 10], sway: 6, z: [0.6, 1.2], stem: true },
  firefly: { cols: ['#e8ff8a', '#ffe86a'], s: 1, vy: [-3, 3], vx: [-3, 3], sway: 8, z: [0.7, 1.2], glow: true, low: 0.35 },
  ember: { cols: ['#f08a2c', '#ffc15a', '#c4501f'], s: 1, vy: [-36, -16], vx: [-4, 8], sway: 4, z: [0.6, 1.3], rise: true, flicker: true },
  bubble: { cols: ['#a8dcfd'], s: 2, vy: [-12, -6], vx: [-2, 2], sway: 3, z: [0.8, 1.1], rise: true, ring: true, low: 0.6 },
  dragonfly: { cols: ['#3bb8a8'], s: 3, vy: [-6, 6], vx: [-30, 30], sway: 4, z: [0.9, 1.1], dart: true, low: 0.4 },
  bee: { cols: ['#ffd84a'], s: 2, vy: [-8, 8], vx: [-16, 16], sway: 6, z: [0.9, 1.1], dart: true, bee: true, low: 0.4 },
  butterfly: { cols: ['#ff8ab8', '#c88af0', '#f4f1e8', '#ffc15a'], s: 2, vy: [-6, 4], vx: [-10, 10], sway: 10, z: [0.8, 1.2], wings: true, low: 0.3 },
  glint: { cols: ['#fff2a8', '#ffffff'], s: 1, vy: [0, 0], vx: [0, 0], sway: 0, z: [0.4, 1], twinkle: true, low: 0.2 },
  coin: { cols: ['#ffc15a'], s: 2, vy: [40, 70], vx: [-3, 3], sway: 0, z: [0.6, 1.1], coin: true },
  moth: null // moths circle the lamps instead (drawProps)
};
function spawn(kind, R = Math.random, anywhere = false) {
  const K = WEATHER[kind];
  if (!K) return { kind, skip: true };
  const rnd = ([a, b]) => a + R() * (b - a);
  const p = { kind, K, z: rnd(K.z), vx: rnd(K.vx), vy: rnd(K.vy), col: K.cols[Math.floor(R() * K.cols.length)], ph: R() * 10, life: 4 + R() * 6 };
  const top = (K.low || 0) * H;
  p.x = R() * W;
  p.y = anywhere || K.dart || K.twinkle || K.glow ? top + R() * (H - top) : K.rise ? H + 4 : -4;
  return p;
}
function updateParts(amb, dt, dcx, dcy) {
  const wind = amb.wind ? amb.wind.v * amb.wind.dir * 60 : 0;
  for (let i = 0; i < amb.parts.length; i++) {
    const p = amb.parts[i];
    if (p.skip) continue;
    const K = p.K;
    p.ph += dt;
    p.life -= dt;
    p.x += (p.vx + Math.sin(p.ph * 2) * K.sway * 0.5 + wind * p.z * (K.dart ? 0.3 : 1)) * dt - dcx * p.z;
    p.y += p.vy * dt - dcy * p.z * 0.6;
    if (K.dart && R01(p) < dt * 0.8) (p.vx = (Math.random() - 0.5) * 60), (p.vy = (Math.random() - 0.5) * 16);
    const off = p.x < -12 || p.x > W + 12 || p.y < -12 || p.y > H + 12;
    if (off && (K.dart || K.glow || K.twinkle || K.wings)) {
      // wanderers wrap round instead of being replaced
      p.x = ((p.x + 12) % (W + 24) + W + 24) % (W + 24) - 12;
      p.y = Math.max((K.low || 0) * H, Math.min(H - 4, p.y < -12 ? H - 4 : p.y > H + 12 ? (K.low || 0) * H : p.y));
    } else if (off || (K.twinkle && p.life <= 0)) amb.parts[i] = spawn(p.kind, Math.random, K.twinkle || dcx * p.z > 0.5);
  }
}
const R01 = () => Math.random();
function drawParts(amb, front) {
  for (const p of amb.parts) {
    if (p.skip || (p.z > 1.15) !== front) continue;
    const K = p.K, x = Math.round(p.x), y = Math.round(p.y);
    if (K.twinkle) {
      const k = Math.sin(p.ph * 3);
      if (k < 0.2) continue;
      rect(x, y, 1, 1, '#ffffff');
      if (k > 0.75) rect(x - 1, y, 3, 1, p.col), rect(x, y - 1, 1, 3, p.col);
      continue;
    }
    if (K.glow) {
      if (Math.sin(p.ph * 2.2) < -0.3) continue;
      dither(x - 1, y - 1, 3, 3, p.col, 5);
      rect(x, y, 1, 1, p.col);
      continue;
    }
    if (K.flicker && Math.sin(p.ph * 9) < -0.6) continue;
    if (K.ring) {
      rect(x, y - 1, 1, 1, p.col), rect(x - 1, y, 1, 1, p.col), rect(x + 1, y, 1, 1, p.col), rect(x, y + 1, 1, 1, p.col);
      continue;
    }
    if (K.bee) {
      rect(x, y, 2, 1, '#ffd84a'), rect(x + 1, y, 1, 1, '#1a1428');
      if (Math.sin(p.ph * 40) > 0) rect(x, y - 1, 1, 1, '#f4f1e8');
      continue;
    }
    if (K.wings) {
      const up = Math.sin(p.ph * 14) > 0;
      rect(x, y, 1, 2, '#1a1428');
      rect(x - 2, y - (up ? 1 : 0), 2, up ? 2 : 1, p.col), rect(x + 1, y - (up ? 1 : 0), 2, up ? 2 : 1, p.col);
      continue;
    }
    if (K.dart) {
      rect(x, y, 3, 1, p.col), rect(x + (p.vx > 0 ? 2 : 0), y, 1, 1, '#1a1428');
      if (Math.sin(p.ph * 50) > 0) rect(x, y - 1, 3, 1, '#c8f4f0');
      continue;
    }
    if (K.coin) {
      const w = Math.abs(Math.sin(p.ph * 6)) > 0.5 ? 2 : 1;
      rect(x, y, w, 2, p.col), rect(x, y, 1, 1, '#fff2a8');
      continue;
    }
    const s = K.s, flip = K.flip && Math.sin(p.ph * 4) > 0;
    rect(x, y, flip ? Math.max(1, s - 1) : s, flip ? s : Math.max(1, s - 1), p.col);
    if (K.stem) rect(x, y + 1, 1, 1, '#c3c4d6');
  }
}

// ---------------------------------------------------------------- per-frame update
export function updateAmbience(dt) {
  const amb = ambience();
  if (!amb || !amb.B) return;
  amb.t += dt;
  const cx = world.cameraX || 0, cy = world.cameraY || 0, dcx = cx - amb.camX, dcy = cy - amb.camY;
  amb.camX = cx;
  amb.camY = cy;
  // a big jump (a new map, a secret room) doesn't sweep the weather off the screen
  updateParts(amb, dt, Math.abs(dcx) > 60 ? 0 : dcx, Math.abs(dcy) > 60 ? 0 : dcy);
  updateSky(amb, dt);
  const h = world.hero;
  if (!h || h.ladder) return;
  // a conveyor belt carries whoever stands on it
  if (h.onGround && h.platform?.belt) nudge(h, h.platform.belt * dt);
  // the mountain wind: calm, a warning whistle and streaks, then a gust that shoves you about
  const w = amb.wind;
  if (w) {
    w.t -= dt;
    if (w.t <= 0) {
      if (w.phase === 'calm') (w.phase = 'warn'), (w.t = amb.B.wind.warn), (w.dir = -w.dir);
      else if (w.phase === 'warn') {
        w.phase = 'gust';
        w.t = amb.B.wind.gust;
        if (!w.told) (w.told = true), callout('WIND!', h.x + h.w / 2, h.y - 14, C.ice);
      } else (w.phase = 'calm'), (w.t = amb.B.wind.calm[0] + Math.random() * (amb.B.wind.calm[1] - amb.B.wind.calm[0]));
    }
    const want = w.phase === 'gust' ? 1 : w.phase === 'warn' ? 0.25 : 0;
    w.v += (want - w.v) * Math.min(1, dt * 3);
    if (w.phase !== 'calm' && Math.random() < dt * (w.phase === 'gust' ? 26 : 8)) amb.sky.push({ k: 'streak', x: w.dir > 0 ? -30 : W + 30, y: Math.random() * (H - 40), v: w.dir * (260 + Math.random() * 160), len: 12 + Math.random() * 26 });
    if (w.v > 0.05 && !(h.dashT > 0) && !world.lock) nudge(h, w.dir * w.v * (h.onGround ? amb.B.wind.push : amb.B.wind.air) * dt);
  }
}
// slide a body sideways without walking it into a wall
function nudge(b, dx) {
  const x = Math.max(2, Math.min(worldWidth() - 2 - b.w, b.x + dx));
  const probe = { x, y: b.y, w: b.w, h: b.h - 1 };
  for (const s of world.map.solids) if (overlap(probe, s)) return;
  b.x = x;
}

// ---------------------------------------------------------------- the sky's moving parts
function updateSky(amb, dt) {
  const B = amb.B, sky = B.sky || [], R = Math.random, t = amb.t;
  for (const c of amb.clouds) c.x -= c.v * dt;
  for (const m of amb.mist || []) m.x += (6 + (amb.wind ? amb.wind.v * amb.wind.dir * 70 : 0)) * dt;
  const every = (k, s) => !amb.sky.some(e => e.k === k) && (amb[k + 'T'] = (amb[k + 'T'] ?? s * 0.4) - dt) <= 0 && ((amb[k + 'T'] = s * (0.7 + R() * 0.6)), true);
  if (sky.includes('geese') && every('geese', 16)) amb.sky.push({ k: 'geese', x: -40, y: 30 + R() * 50, v: 22 + R() * 8, n: 5 });
  if (sky.includes('birds') && every('birds', 11)) amb.sky.push({ k: 'birds', x: W + 20, y: 26 + R() * 60, v: -26, n: 3 + Math.floor(R() * 3) });
  if (sky.includes('eagle') && every('eagle', 14)) amb.sky.push({ k: 'eagle', x: -30, y: 40 + R() * 30, v: 18 });
  if (sky.includes('fireworks') && every('fireworks', 2.6)) amb.sky.push({ k: 'rocket', x: 40 + R() * (W - 80), y: 196, top: 30 + R() * 60, col: ['#ff6fb5', '#ffc15a', '#3bb8a8', '#b7e27a', '#a8dcfd'][Math.floor(R() * 5)] });
  if (sky.includes('leapingFish') && every('fish', 5)) amb.sky.push({ k: 'fish', x: R() * W, y: 156 + R() * 12, t: 0 });
  if (sky.includes('ninja') && every('ninja', 7)) amb.sky.push({ k: 'ninja', x: R() * W, y: 150 + R() * 16, t: 0, dir: R() < 0.5 ? 1 : -1 });
  if (sky.includes('avalanche') && every('avalanche', 3.5)) {
    const piles = art()?.anchors?.piles || [], p = piles[Math.floor(R() * piles.length)];
    if (p) {
      const side = R() < 0.5 ? -1 : 1;
      for (let i = 0; i < 26; i++) amb.sky.push({ k: 'coinslide', pile: p, a: Math.PI / 2 - side * (0.05 + R() * 0.25), da: side * (0.6 + R() * 0.7), delay: i * 0.05, bounce: R() * 6.28 });
      amb.sky.push({ k: 'avalanche' });
    }
  }
  for (const [layer, x, y, size] of art()?.anchors?.smoke || []) {
    if (R() < dt * (size > 1 ? 5 : 3)) amb.smoke.push({ layer, x: x + (R() - 0.5) * 3, y, r: size, t: 0, life: 2.5 + R() * 1.5 });
  }
  for (let i = amb.smoke.length - 1; i >= 0; i--) {
    const s = amb.smoke[i];
    s.t += dt;
    s.y -= 9 * dt;
    s.x += (5 + Math.sin(s.t * 2) * 3) * dt;
    if (s.t > s.life) amb.smoke.splice(i, 1);
  }
  for (let i = amb.sky.length - 1; i >= 0; i--) {
    const e = amb.sky[i];
    let done = false;
    if (e.k === 'geese' || e.k === 'birds' || e.k === 'eagle') (e.x += e.v * dt), (done = e.x < -80 || e.x > W + 80);
    else if (e.k === 'streak') (e.x += e.v * dt), (done = e.x < -60 || e.x > W + 60);
    else if (e.k === 'rocket') {
      e.y -= 120 * dt;
      if (e.y <= e.top) {
        for (let k = 0; k < 18; k++) {
          const a = (k / 18) * Math.PI * 2;
          amb.sky.push({ k: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * 46, vy: Math.sin(a) * 46, col: e.col, t: 0 });
        }
        done = true;
      }
    } else if (e.k === 'spark') {
      e.t += dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy += 30 * dt;
      e.vx *= 1 - dt * 1.5;
      done = e.t > 1.3;
    } else if (e.k === 'fish' || e.k === 'ninja') (e.t += dt), (done = e.t > (e.k === 'ninja' ? 2.2 : 1.1));
    else if (e.k === 'coinslide') {
      if ((e.delay -= dt) > 0) continue;
      e.a += e.da * dt;
      e.da *= 1 + dt * 1.6;
      done = e.a < 0.02 || e.a > Math.PI - 0.02;
    } else if (e.k === 'avalanche') done = !amb.sky.some(o => o.k === 'coinslide');
    if (done) amb.sky.splice(i, 1);
  }
}

// layer i's offset on screen: how far it has scrolled and how far the camera's height pushes it down
function layerShift(amb, i) {
  const B = amb.B, map = world.map;
  const base = cameraTargetY(map.startY, map.floorY);
  const lift = Math.max(-60, Math.min(160, base - (world.cameraY || 0)));
  return [((Math.round((world.cameraX || 0) * B.scroll[i]) % W) + W) % W, Math.round(lift * B.lift[i])];
}
const onLayer = (amb, i, x, y) => {
  const [ox, oy] = layerShift(amb, i);
  return [((Math.round(x - ox) % W) + W) % W, y + oy];
};

function drawSkyExtras(amb, after) {
  const B = amb.B, sky = B.sky || [], t = amb.t;
  if (after === 0) {
    if (sky.includes('aurora')) aurora(t);
    for (const c of amb.clouds) {
      const span = W + c.im.width + 20, x = ((c.x - (world.cameraX || 0) * 0.02) % span + span) % span - c.im.width;
      if (c.dark) X.globalAlpha = 0.9;
      X.drawImage(c.im, Math.round(x), Math.round(c.y));
      X.globalAlpha = 1;
    }
    for (const e of amb.sky) {
      if (e.k === 'geese') for (let i = 0; i < e.n; i++) goose(e.x - Math.abs(i - 2) * 9, e.y + Math.abs(i - 2) * 5 - (i < 2 ? 0 : 0), t + i * 0.3);
      else if (e.k === 'birds') for (let i = 0; i < e.n; i++) bird(e.x + i * 10, e.y + Math.sin(i * 2) * 4, t + i, C.night);
      else if (e.k === 'eagle') eagle(e.x, e.y + Math.sin(t * 0.8) * 6, t);
      else if (e.k === 'rocket') rect(e.x, e.y, 1, 3, '#fff2c8'), rect(e.x, e.y + 3, 1, 2, e.col);
      else if (e.k === 'spark' && (e.t < 0.9 || (Math.floor(e.t * 20) & 1))) rect(e.x, e.y, e.t < 0.3 ? 2 : 1, 1, e.t < 0.2 ? '#ffffff' : e.col);
    }
  } else if (after === 1) {
    for (const s of amb.smoke) if (s.layer === 1) puff(amb, s);
    if (sky.includes('seaGlints')) {
      for (let k = 0; k < 34; k++) {
        if (Math.sin(t * 2.4 + k * 1.7) < 0.55) continue;
        const [x, y] = onLayer(amb, 1, (k * 97) % W, 152 + ((k * 13) % 22));
        rect(x, y, 3, 1, '#ffffff');
      }
    }
    for (const e of amb.sky) {
      if (e.k === 'fish') {
        const [x, y] = onLayer(amb, 1, e.x + e.t * 20, e.y - Math.sin((e.t / 1.1) * Math.PI) * 18);
        rect(x, y, 3, 2, '#f08a2c'), rect(x + 3, y + 1, 1, 1, '#f08a2c'), rect(x, y, 1, 1, '#1a1428');
        if (e.t < 0.15 || e.t > 0.95) rect(x - 2, e.y + layerShift(amb, 1)[1] - 2, 1, 2, '#ffffff'), rect(x + 4, e.y + layerShift(amb, 1)[1] - 2, 1, 2, '#ffffff');
      } else if (e.k === 'coinslide' && e.delay <= 0) {
        const [px, base, w, h] = e.pile.slice(1);
        const bump = Math.abs(Math.sin(e.a * 9 + e.bounce)) * 2;
        const [x, y] = onLayer(amb, 1, px + Math.cos(e.a) * w * 0.98, base - Math.sin(e.a) * h * 0.98 - 1 - bump);
        rect(x, y, 2, 1, '#ffc15a'), rect(x, y - 1, 1, 1, '#fff2a8');
      }
    }
    if (amb.mist) mistBand(amb, amb.mist[0], 1);
  } else if (after === 2) {
    for (const s of amb.smoke) if (s.layer === 2) puff(amb, s);
    if (sky.includes('stringLights')) {
      const cols = ['#ff6fb5', '#ffc15a', '#3bb8a8', '#b7e27a', '#a8dcfd'];
      for (let x0 = 0; x0 < W; x0 += 120)
        for (let k = 4; k < 120; k += 8) {
          const [x, y] = onLayer(amb, 2, x0 + k, 143 + Math.round(16 * Math.sin((Math.PI * k) / 120)));
          const on = Math.sin(t * 3 + (x0 + k) * 0.7) > -0.4;
          rect(x, y, 2, 2, on ? cols[(k / 8 + x0 / 120) % 5 | 0] : '#5a3a5a');
          if (on && Math.sin(t * 3 + (x0 + k) * 0.7) > 0.7) dither(x - 1, y - 1, 4, 4, cols[(k / 8) % 5 | 0], 4);
        }
    }
    for (const e of amb.sky) if (e.k === 'ninja') ninja(amb, e);
    if (amb.mist) mistBand(amb, amb.mist[1], 2);
  } else if (after === 3 && sky.includes('sunbeams')) {
    // warm afternoon light slanting through the trees, behind everyone
    for (const [bx, bw, ph] of [[60, 26, 0], [170, 16, 2], [300, 34, 4]]) {
      const lv = 2 + Math.round(Math.sin(t * 0.7 + ph));
      if (lv > 0) for (let y = 0; y < H; y += 3) dither(bx + y * 0.45 + Math.sin(t * 0.3 + ph) * 6, y, bw, 3, C.cream, lv);
    }
  }
}
function aurora(t) {
  const bands = [[50, '#3bb8a8', 5], [64, '#b7e27a', 4], [80, '#7a4bc2', 3]];
  for (const [base, col, lv] of bands)
    for (let x = 0; x < W; x += 2) {
      const y = base + Math.sin(x * 0.018 + t * 0.4 + base) * 12 + Math.sin(x * 0.051 - t * 0.9) * 4;
      const len = 16 + Math.sin(x * 0.03 + t) * 8;
      dither(x, y, 2, len, col, lv + Math.round(Math.sin(x * 0.02 + t * 1.3) * 2));
    }
}
function goose(x, y, t) {
  const up = Math.sin(t * 8) > 0;
  rect(x, y, 4, 2, '#f4f1e8'), rect(x + 4, y - 1, 2, 1, '#f4f1e8'), rect(x + 6, y - 1, 1, 1, '#f08a2c');
  rect(x + 1, y + (up ? -2 : 2), 2, 2, '#c3c4d6');
}
function bird(x, y, t, col) {
  const up = Math.sin(t * 9) > 0;
  rect(x, y, 1, 1, col);
  rect(x - 2, y + (up ? -1 : 1), 2, 1, col), rect(x + 1, y + (up ? -1 : 1), 2, 1, col);
}
function eagle(x, y, t) {
  const up = Math.sin(t * 2) > 0.6;
  rect(x, y, 6, 2, '#5d2f14'), rect(x + 6, y - 1, 2, 2, '#f4f1e8'), rect(x + 8, y, 1, 1, '#ffc15a');
  rect(x - 1, y + 1, 2, 1, '#5d2f14');
  for (let k = 0; k < 7; k++) rect(x + 1 + k, y - (up ? 2 + (k > 2 && k < 5 ? 1 : 0) : 0) + (up ? 0 : Math.abs(k - 3) - 2), 1, 1, '#8a4f22');
}
function ninja(amb, e) {
  // a lizard ninja hops along the rooftops and vanishes in a puff of smoke
  const hop = e.t % 0.7, n = Math.floor(e.t / 0.7);
  const [x, y] = onLayer(amb, 2, e.x + e.dir * (n * 26 + hop * 37), e.y - Math.sin((hop / 0.7) * Math.PI) * 12);
  if (e.t > 2.0) return dither(x - 3, y - 4, 7, 7, '#c3c4d6', 8 - (e.t - 2) * 30);
  rect(x - 1, y - 6, 3, 3, '#0a0820'), rect(x - 1, y - 3, 3, 4, '#0a0820'), rect(x - 2 * e.dir - 1, y - 5, 2, 1, '#c4363e');
  rect(x - 1, y + 1, 1, 2, '#0a0820'), rect(x + 1, y + 1, 1, 2, '#0a0820');
  rect(x + (e.dir > 0 ? 1 : -1), y - 5, 1, 1, '#ffe86a');
}
function puff(amb, s) {
  const [x, y] = onLayer(amb, s.layer, s.x, s.y);
  const r = Math.round(2 + s.t * 2.2 * s.r), lv = Math.max(1, Math.round(9 - (s.t / s.life) * 9));
  for (let yy = -r; yy <= r; yy += 1) {
    const hw = Math.round(Math.sqrt(r * r - yy * yy));
    dither(x - hw, y + yy, hw * 2, 1, s.r > 1 ? '#5a4a50' : '#8a8090', lv);
  }
}
function mistBand(amb, m, layer) {
  const [ox, oy] = layerShift(amb, layer), x = ((Math.round(m.x - ox) % W) + W) % W;
  X.globalAlpha = 0.75;
  X.drawImage(m.cv, x - W, m.y + oy);
  X.drawImage(m.cv, x, m.y + oy);
  X.globalAlpha = 1;
}

// ---------------------------------------------------------------- drawing: backdrop and terrain
// The backdrop: returns false when this zone has no environment art (the old painting is used).
export function drawBiomeBackdrop() {
  const amb = ambience(), a = art();
  if (!amb?.B || !a?.layers) return false;
  screenLayer();
  for (let i = 0; i < a.layers.length; i++) {
    const [ox, oy] = layerShift(amb, i), im = a.layers[i];
    X.drawImage(im, -ox, oy);
    X.drawImage(im, W - ox, oy);
    if (oy < 0 && a.under[i]) rect(0, H + oy, W, -oy, a.under[i]);
    drawSkyExtras(amb, i);
  }
  drawDepthBack(depthOf(amb, ZONES[world.zone].id, a.layers[0]), amb.t); // MapleStory depth (depth.js)
  drawParts(amb, false);
  return true;
}

const spr = name => art()?.sprites?.[name];
function drawSprite(name, fi, x, y) {
  const s = spr(name), a = art();
  if (!s) return;
  const [sx, sy, w, h, n] = s;
  X.drawImage(a.atlas, sx + (fi % n) * w, sy, w, h, Math.round(x), Math.round(y), w, h);
}
// a horizontal run of a tileable strip, aligned to the world grid so neighbours line up
function runStrip(name, fi, x0, x1, y) {
  const s = spr(name), a = art();
  if (!s) return;
  const [sx, sy, w, h, n] = s, f = ((fi % n) + n) % n;
  for (let x = Math.floor(x0 / w) * w; x < x1; x += w) {
    const l = Math.max(x, x0), r = Math.min(x + w, x1);
    if (r > l) X.drawImage(a.atlas, sx + f * w + (l - x), sy, r - l, h, l, y, r - l, h);
  }
}

export function drawBiomeTerrain() {
  const amb = ambience(), a = art(), map = world.map;
  if (!amb?.B || !a) return false;
  worldLayer();
  const g = spr('ground'), cam = world.cameraX || 0, camY = world.cameraY || 0, t = amb.t;
  for (const p of map.solids) {
    if (p.wall || !visible(p.x, p.y - 8, p.w, p.h + 24)) continue; // breakable walls draw themselves (walls.js)
    const left = Math.max(p.x, cam - 2), right = Math.min(p.x + p.w, cam + W + 2);
    const top = Math.max(p.y, camY - 2), bottom = Math.min(p.y + p.h, camY + H + 2);
    // the body: the zone's ground tile, anchored to the world so stretches line up
    for (let y = Math.floor((top - p.y) / g[3]) * g[3] + p.y; y < bottom; y += g[3])
      for (let x = Math.floor(left / g[2]) * g[2]; x < right; x += g[2]) {
        const l = Math.max(x, left), r = Math.min(x + g[2], right), tp = Math.max(y, top), bt = Math.min(y + g[3], bottom);
        if (r > l && bt > tp) X.drawImage(a.atlas, g[0] + (l - x), g[1] + (tp - y), r - l, bt - tp, l, tp, r - l, bt - tp);
      }
    if (p.under) {
      if (bottom > p.y + 44) dither(left, Math.max(top, p.y + 44), right - left, Math.min(bottom, p.y + 96) - Math.max(top, p.y + 44), C.ink, 3);
      if (bottom > p.y + 96) dither(left, Math.max(top, p.y + 96), right - left, bottom - Math.max(top, p.y + 96), C.ink, 6);
    } else if (p.ground) {
      // deeper earth darkens, so the eye stays on the surface you run along
      if (bottom > p.y + 44) dither(left, Math.max(top, p.y + 44), right - left, Math.min(bottom, p.y + 96) - Math.max(top, p.y + 44), C.ink, 3);
      if (bottom > p.y + 96) dither(left, Math.max(top, p.y + 96), right - left, bottom - Math.max(top, p.y + 96), C.ink, 6);
      // the rims of a step or a pit
      X.globalAlpha = 0.35;
      rect(p.x, p.y + 4, 2, Math.min(bottom, p.y + 70) - p.y - 4, C.ink);
      rect(p.x + p.w - 2, p.y + 4, 2, Math.min(bottom, p.y + 70) - p.y - 4, C.ink);
      X.globalAlpha = 1;
      if (p.ice) runStrip('ice', 0, p.x, p.x + p.w, p.y - 2);
      else if (p.belt) {
        runStrip('belt', Math.floor(t * Math.abs(p.belt) * 0.35) * Math.sign(p.belt), p.x, p.x + p.w, p.y - 2);
        // arrows show which way it runs
        for (let x = p.x + 12; x < p.x + p.w - 12; x += 40) chevron(x + ((t * p.belt) % 40 + 40) % 40 - 20, p.y + 10, Math.sign(p.belt));
      } else runStrip('lip', 0, p.x, p.x + p.w, p.y - 3);
      // a cliff's tunnel: dark inside, with the rock's ragged underside for its roof (maps.js cliff)
      if (p.cliff) {
        const floor = p.y + p.h + 28;
        dither(left, p.y + p.h, right - left, floor - p.y - p.h, C.ink, 7);
        runStrip('ceil', 0, p.x, p.x + p.w, p.y + p.h - 2);
      }
    } else if (p.ceiling) {
      dither(left, top, right - left, bottom - top, C.ink, 3);
      runStrip('ceil', 0, p.x, p.x + p.w, p.y + p.h - 2);
    }
  }
  for (const s of map.slopes || []) drawSlope(s, g, a, cam);
  for (const p of map.platforms) if (!p.solid && !p.crumble && visible(p.x, p.y - 4, p.w, 24)) drawLedge(p, g, a, cam);
  drawPits(amb, false);
  return true;
}
// a floating ledge: a chunk of the zone's own ground (its tile, its grass or snow or tiles on top)
// with a tapered underside, so the high road looks like it belongs to the world it floats in
const LEDGE = [[0, 8], [2, 2], [5, 2]]; // rows: inset from each side, height
function drawLedge(p, g, a, cam) {
  let y = p.y;
  for (const [inset, h] of LEDGE) {
    const l = Math.max(p.x + inset, cam - 2), r = Math.min(p.x + p.w - inset, cam + W + 2);
    if (r > l) {
      for (let x = Math.floor(l / g[2]) * g[2]; x < r; x += g[2]) {
        const x0 = Math.max(x, l), x1 = Math.min(x + g[2], r), ty = ((y % g[3]) + g[3]) % g[3], n = Math.min(h, g[3] - ty);
        X.drawImage(a.atlas, g[0] + (x0 - x), g[1] + ty, x1 - x0, n, x0, y, x1 - x0, n);
        if (n < h) X.drawImage(a.atlas, g[0] + (x0 - x), g[1], x1 - x0, h - n, x0, y + n, x1 - x0, h - n);
      }
      if (inset) dither(l, y, r - l, h, C.ink, inset > 3 ? 6 : 4);
      rect(l, y + h - 1, r - l, 1, C.ink); // its underside, inked
      rect(p.x + inset, y, 1, h, C.ink);
      rect(p.x + p.w - inset - 1, y, 1, h, C.ink);
    }
    y += h;
  }
  runStrip('lip', 0, p.x, p.x + p.w, p.y - 3);
}
// a ramp (maps.js slope): the ground tile filled in column by column from its surface line down to
// the solid under it, and the zone's lip strip following the surface
function drawSlope(s, g, a, cam) {
  if (!visible(s.x, s.y - 8, s.w, Math.abs(s.y1 - s.y0) + 16)) return;
  const lip = spr('lip'), base = Math.max(s.y0, s.y1) + 1;
  for (let x = Math.max(s.x, Math.floor(cam) - 2); x < Math.min(s.x + s.w, cam + W + 2); x++) {
    const y = Math.round(s.y0 + (x + 0.5 - s.x) * s.k), tx = ((x % g[2]) + g[2]) % g[2];
    for (let yy = y; yy < base; ) {
      const ty = (((yy - base) % g[3]) + g[3]) % g[3], n = Math.min(g[3] - ty, base - yy);
      X.drawImage(a.atlas, g[0] + tx, g[1] + ty, 1, n, x, yy, 1, n);
      yy += n;
    }
    if (lip) X.drawImage(a.atlas, lip[0] + (((x % lip[2]) + lip[2]) % lip[2]), lip[1], 1, lip[3], x, y - 3, 1, lip[3]);
  }
}
function chevron(x, y, dir) {
  x = Math.round(x);
  for (let k = 0; k < 3; k++) rect(x + dir * k, y - 2 + k, 1, 1, C.gold), rect(x + dir * k, y + 2 - k, 1, 1, C.gold);
}

function pitRims(map, q) {
  let l = null, r = null;
  for (const s of map.solids) {
    if (!s.ground) continue;
    if (Math.abs(s.x + s.w - q.x) < 1) l = s;
    if (Math.abs(s.x - (q.x + q.w)) < 1) r = s;
  }
  return Math.max(l?.y ?? map.floorY - 80, r?.y ?? map.floorY - 80);
}
function drawPits(amb, front) {
  const P = amb.B.pit, map = world.map;
  if (!P || !map.pits) return;
  for (const q of map.pits) {
    if (P.kind === 'spikes') {
      if (front || !visible(q.x, map.floorY - 120, q.w, 150)) continue;
      const s = spr('pit'), rim = pitRims(map, q);
      // the drop darkens on the way down to the bed of spikes
      dither(q.x, rim + 16, q.w, map.floorY - rim - 16, C.ink, 4);
      dither(q.x, rim + 44, q.w, map.floorY - rim - 44, C.ink, 8);
      rect(q.x, map.floorY, q.w, map.height - map.floorY, C.ink);
      if (s) runStrip('pit', 0, q.x, q.x + q.w, map.floorY - s[3] + 2);
      continue;
    }
    const y = (q.surf ??= pitRims(map, q) + P.rise);
    if (!visible(q.x, y - 4, q.w, map.height - y)) continue;
    // the liquid is drawn in front of whoever falls in, so they sink out of sight
    if (!front) {
      if (P.glow) dither(q.x, y - 14, q.w, 14, C.orange, 3 + Math.round(Math.sin(amb.t * 3) * 1.5));
      continue;
    }
    rect(q.x, y + 3, q.w, map.height - y - 3, P.fill);
    dither(q.x, y + 14, q.w, map.height - y - 14, P.deep, 8);
    runStrip('pit', P.fps ? Math.floor(amb.t * P.fps) : 0, q.x, q.x + q.w, y);
  }
}

// ---------------------------------------------------------------- props along the route
export function drawBiomeProps() {
  const amb = ambience();
  if (!amb?.B) return;
  worldLayer();
  const t = amb.t, night = amb.B.dark || amb.B.sky?.includes('ninja') || amb.B.sky?.includes('smoke');
  const gust = amb.wind ? amb.wind.v : 0, moths = amb.B.weather?.some(w => w[0] === 'moth');
  for (const p of amb.props) {
    const s = spr(p.s);
    if (!s || !visible(p.x - s[2], p.y - s[3] - 8, s[2] * 2, s[3] + 10)) continue;
    const [, , w, h, n] = s;
    let f = 0;
    if (p.fps === 'pick') f = p.v % n;
    else if (p.fps === 'wind') f = gust > 0.2 ? Math.floor(t * 8 + p.ph) % n : Math.floor(t * 1.5 + p.ph) % 2 ? 0 : 0;
    else if (p.fps === 'blink') {
      const k = (t + p.ph) % 4.5;
      f = k < 0.08 ? 1 : k < 0.18 ? 2 : k < 0.26 ? 1 : 0;
    } else if (p.fps) f = Math.floor((t + p.ph) * p.fps * (amb.wind && p.s === 'flags' ? 1 + gust * 2 : 1)) % n;
    const x = p.x - (w >> 1), y = p.y - h + 1;
    if (p.opt.light && night) glow(p.x + (w & 1 ? 0 : 0) + 2, y + 6, p.opt.light * 0.5, amb.B.dark ? '#ffc15a' : '#f08a2c', t + p.ph);
    drawSprite(p.s, f, x, y);
    if (moths && p.opt.light > 30)
      for (let k = 0; k < 2; k++) {
        const a = t * (3 + k) + p.ph + k * 3;
        rect(p.x + 4 + Math.cos(a) * (6 + k * 3), y + 8 + Math.sin(a * 1.3) * 5, 1, 1, Math.sin(a * 20) > 0 ? '#f4f1e8' : '#c3c4d6');
      }
  }
}
function glow(x, y, r, col, t) {
  r = Math.round(r + Math.sin(t * 7) * 0.8);
  for (let yy = -r; yy <= r; yy += 2) {
    const hw = Math.round(Math.sqrt(r * r - yy * yy));
    dither(x - hw, y + yy, hw * 2, 2, col, Math.abs(yy) < r * 0.5 ? 3 : 2);
  }
}

// ---------------------------------------------------------------- in front of everyone
export function drawAmbienceFront() {
  const amb = ambience();
  if (!amb?.B) return;
  worldLayer();
  drawPits(amb, true);
  screenLayer();
  const sky = amb.B.sky || [], t = amb.t;
  for (const e of amb.sky) if (e.k === 'streak') rect(e.x, e.y, e.len, 1, Math.sin(e.y) > 0 ? '#ffffff' : '#e8f0fa');
  drawParts(amb, true);
  drawDepthFront(amb.depth, amb.t);
  if (sky.includes('heat')) dither(0, H - 34, W, 34, C.orange, 2 + Math.round(Math.sin(t * 2.5) * 1.2));
  if (amb.B.dark && world.gimmick !== 'ghost') darkness(amb); // a ghost house brings its own dark
}
// the night bazaar's dark: light pools round the lamps and round you
let shade = null;
function darkness(amb) {
  if (!shade) {
    shade = document.createElement('canvas');
    shade.width = W;
    shade.height = H;
  }
  const g = shade.getContext('2d'), cam = world.cameraX || 0, camY = world.cameraY || 0, t = amb.t;
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#0a0620';
  const ground = Math.max(40, Math.min(H, (world.hero ? world.hero.y + world.hero.h : GROUND) - camY + 20));
  for (let y = 0; y < H; y += 4) {
    g.globalAlpha = Math.max(0.15, Math.min(1, 1 - (ground - 30 - y) / 120));
    g.fillRect(0, y, W, 4);
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => {
    g.globalAlpha = a;
    for (let yy = -r; yy <= r; yy += 2) {
      const hw = Math.round(Math.sqrt(r * r - yy * yy));
      g.fillRect(Math.round(x - hw), Math.round(y + yy), hw * 2, 2);
    }
  };
  const lights = [];
  for (const p of amb.props) if (p.opt.light) lights.push([p.x - cam, p.y - 30 - camY, p.opt.light + Math.sin(t * 6 + p.ph) * 1.5]);
  const h = world.hero;
  if (h) lights.push([h.x + h.w / 2 - cam, h.y + h.h / 2 - camY, 58]);
  for (const [x, y, r] of lights) {
    if (x < -r || x > W + r || y < -r || y > H + r) continue;
    hole(x, y, r, 0.45);
    hole(x, y, r * 0.72, 0.6);
    hole(x, y, r * 0.45, 1);
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  X.globalAlpha = amb.B.dark;
  X.drawImage(shade, 0, 0);
  X.globalAlpha = 1;
}
