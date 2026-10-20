// Every zone moves differently. Each has a layout style that shapes the route: rolling graveyard
// hills, winding ant tunnels, a crater dive, a banquet-hall maze, a cathedral climb, a mountain
// ascent and forge catwalks. Biome art and names still belong to ZONES; geometry never replaces
// their identity. Layouts are seeded per zone, so a route is the same every run and speedrun
// splits stay comparable.
//
// Movement budget the shapes are built around (HERO: jump 262, gravity 760, speed 112): a jump
// rises 45px and carries 77px, so steps rise at most 32-40px and jumpable gaps are at most 56px.
// Anything taller gets a ladder. The finale is always the rightmost screen, flat at bossFloor.
import { W, GROUND } from '../config.js';
import { ZONES } from './zones.js';

export const LAYOUTS = [
  { style: 'hills', title: 'ROLLING GRAVES', label: 'HILL', screens: 8, pits: 2 },
  { style: 'burrow', title: 'ANT TUNNELS', label: 'TUNNEL', levels: 3, screens: 3, nests: 0.5 },
  { style: 'crater', title: 'CRATER DIVE', label: 'DEPTH', ledges: 7, well: 640 },
  { style: 'halls', title: 'BANQUET MAZE', label: 'HALL', rows: 3, cols: 9 },
  { style: 'belfry', title: 'BELL TOWER CLIMB', label: 'FLOOR', storeys: 8 },
  { style: 'summit', title: 'SUMMIT CLIMB', label: 'TERRACE', terraces: 9 },
  { style: 'gantry', title: 'FORGE CATWALKS', label: 'BAY', screens: 10 },
  { style: 'burrow', title: 'ROOT WARRENS', label: 'WARREN', levels: 5, screens: 2.5, nests: 0.8 },
  { style: 'halls', title: 'CASTLE LABYRINTH', label: 'WING', rows: 4, cols: 11 },
  { style: 'burrow', title: 'VAULT BURROWS', label: 'VAULT', levels: 5, screens: 3, nests: 1 }
];

export function makeMap(zone) {
  const lay = LAYOUTS[zone], m = builder(zone);
  STYLES[lay.style](m, lay);
  return finish(m, zone, lay);
}
export function cameraTarget(x, width) { return Math.max(0, Math.min(width - W, x - W * .42)); }
export function cameraTargetY(feet, floorY) { return Math.max(0, Math.min(floorY - GROUND, feet - GROUND + 12)); }
// the chamber the hero is in: the smallest room containing their feet
export function roomAt(map, x, feet) {
  let best = null, area = Infinity;
  for (const r of map.rooms) if (x >= r.x && x < r.end && feet >= r.y0 && feet <= r.y1) {
    const a = r.w * (Math.min(r.y1, 1e5) - r.y0);
    if (a < area) { area = a; best = r; }
  }
  return best;
}

// ---------------------------------------------------------------- building blocks
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const snap = v => Math.round(v / 8) * 8;
function builder(zone) {
  const rand = seeded(zone * 7919 + 101);
  return {
    platforms: [], solids: [], ladders: [], rooms: [], room: 0, width: 0,
    rand, int: (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1)), pick: a => a[Math.floor(rand() * a.length)]
  };
}
// walkable terrain: a solid block whose top is a floor. Without h it fills to the map bottom.
function ground(m, x, y, w, h, extra) {
  const p = { x, y, w, h: h ?? 0, solid: true, ground: true, room: m.room, ...extra };
  if (h == null) p.fill = true;
  m.platforms.push(p); m.solids.push(p);
  return p;
}
// terrain nobody stands on: walls, roofs and hanging overhangs (ceiling draws a jagged underside)
function rock(m, x, y, w, h, ceiling = true) {
  if (w <= 0 || h <= 0) return null;
  const p = { x, y, w, h, solid: true, ceiling };
  m.solids.push(p);
  return p;
}
// a drop-through ledge enemies can hunt from
function ledge(m, x, y, w, extra) {
  const p = { x, y, w, room: m.room, hunt: true, ...extra };
  m.platforms.push(p);
  return p;
}
// climbing up past the top drops the hero at (exitX, exitY) on the upper surface
function ladder(m, x, bottom, exitY, exitX) {
  m.ladders.push({ x, top: exitY - 28, bottom, exitX, exitY, section: Math.floor(x / W) });
}
function room(m, label, x, end, y0, y1, floor) {
  m.room = m.rooms.length;
  m.rooms.push({ index: m.room, label, x, end, w: end - x, y0, y1, floor });
  return m.room;
}

// ---------------------------------------------------------------- 1. rolling graveyard hills
// Open sky and a wavy horizon: short climbs, crypt-lid perches and sunken graves with ladders.
function hills(m, lay) {
  const width = lay.screens * W, top = GROUND - 72, low = GROUND + 48;
  m.width = width;
  let x = 0, y = GROUND, pits = 0;
  const open = (label = lay.label) => { if (m.rooms.length) m.rooms.at(-1).end = x, m.rooms.at(-1).w = x - m.rooms.at(-1).x; room(m, label, x, width, 0, Infinity, y); };
  open();
  ground(m, 0, GROUND, 256); x = 256;
  while (x < width - W) {
    if (x - m.rooms.at(-1).x > W * 1.3) open();
    if (pits < lay.pits && x > W && x + 520 < width - W && m.rand() < 0.3) {
      // sunken grave: drop in, climb out either side
      pits++;
      const w = snap(m.int(200, 260)), py = y + m.pick([88, 104]);
      ground(m, x, py, w);
      ladder(m, x + 16, py, y, x - 22);
      ladder(m, x + w - 16, py, y, x + w + 8);
      x += w;
      const after = snap(m.int(128, 200));
      ground(m, x, y, after); x += after;
      continue;
    }
    y = Math.max(top, Math.min(low, y + m.pick([-32, -24, -16, 0, 16, 24, 32])));
    let w = m.int(12, 32) * 8;
    if (width - W - x - w < 72) w = width - W - x;
    ground(m, x, y, w);
    if (w >= 160 && m.rand() < 0.5) {
      ledge(m, x + 24, y - 40, w - 48); // crypt lid
      if (w >= 224 && m.rand() < 0.5) ledge(m, x + 64, y - 80, w - 128); // headstone row above it
    }
    x += w;
  }
  y = Math.max(top, Math.min(low, y + m.pick([-16, 0, 16])));
  open('GATE');
  ground(m, x, y, width - x);
  m.start = { x: 48, y: GROUND };
  m.arena = y;
}

// ---------------------------------------------------------------- 2. winding ant tunnels
// Switchback tunnels stacked under the surface. Each level wobbles up and down with tight
// squeezes and sunken nest chambers, then drops down a shaft into the next level, which runs the
// other way. Every shaft has a ladder back up. The last level ends in a tall queen's chamber.
function burrow(m, lay) {
  const width = snap(lay.screens * W), L = lay.levels | 1, shaftW = 80, rockGap = 28;
  m.width = width;
  const levels = [];
  for (let i = 0; i < L; i++) {
    const dir = i % 2 ? -1 : 1, last = i === L - 1;
    const exitSide = last ? 0 : dir, entrySide = i === 0 ? 0 : -dir;
    const pieces = [];
    let f = 0;
    const seg = (x, w, extra) => { pieces.push({ x, w, f, clear: m.pick([84, 92, 100, 112]), floor: true, roof: true, ...extra }); };
    let x = 0;
    if (i === 0) { seg(0, 200, { roof: false, clear: 120 }); x = 200; }
    else if (entrySide < 0 || exitSide < 0) { seg(0, shaftW, entrySide < 0 ? { roof: false, clear: 110 } : { floor: false, clear: 110, exit: true }); x = shaftW; }
    const end = last ? width - W : exitSide > 0 || entrySide > 0 ? width - shaftW : width;
    let sinceNest = 0;
    while (x < end) {
      const left = end - x;
      if (sinceNest > 1 && left >= 272 + 96 && m.rand() < lay.nests * 0.45) {
        const w = m.int(26, 34) * 8;
        pieces.push({ x, w: 48, f: f + 24, clear: 174, floor: true, roof: true, nest: 'in' });
        pieces.push({ x: x + 48, w: w - 96, f: f + 48, clear: 198, floor: true, roof: true, nest: 'bowl' });
        pieces.push({ x: x + w - 48, w: 48, f: f + 24, clear: 174, floor: true, roof: true, nest: 'out' });
        x += w; sinceNest = 0;
        continue;
      }
      let w = m.int(9, 22) * 8;
      if (left - w < 72) w = left;
      // a nest's exit step sits 24 below the tunnel, so the next rise after one stays small
      f = Math.max(-16, Math.min(64, f + m.pick(sinceNest ? [-24, -16, 0, 0, 16, 24, 32] : [0, 16, 24, 32])));
      seg(x, w); x += w; sinceNest++;
    }
    if (last) { f += 24; pieces.push({ x, w: W, f, clear: 236, floor: true, roof: true, arena: true }); }
    else if (end < width) {
      // the exit shaft keeps the neighbour's floor height so the ladder lands flush
      const shaft = { x: end, w: shaftW, f, clear: 110, floor: exitSide < 0, roof: entrySide <= 0, exit: exitSide > 0 };
      if (entrySide > 0) Object.assign(shaft, { floor: true, roof: false, exit: false });
      pieces.push(shaft);
    }
    if (exitSide < 0) pieces[0].f = pieces[1].f;
    levels.push({ dir, last, exitSide, entrySide, pieces });
  }
  // stack the levels so each one's highest ceiling clears the level above by solid rock
  let prevMax = null;
  for (const [i, lv] of levels.entries()) {
    const minCeil = Math.min(...lv.pieces.filter(p => p.roof).map(p => p.f - p.clear));
    lv.off = i === 0 ? GROUND : prevMax + rockGap - minCeil;
    lv.line = i === 0 ? 0 : prevMax + 14;
    prevMax = Math.max(...lv.pieces.filter(p => p.floor).map(p => p.f)) + lv.off;
  }
  for (const [i, lv] of levels.entries()) {
    const below = levels[i + 1];
    room(m, lay.label, 0, width, i === 0 ? 0 : lv.line, below ? below.line : Infinity, lv.off);
    const levelRoom = m.room;
    for (const p of lv.pieces) {
      const fy = p.f + lv.off, cy = fy - p.clear;
      if (p.nest === 'in') room(m, 'NEST', p.x, p.x + 400, lv.line, fy + 60, fy);
      if (p.nest === 'out') { const r = m.rooms[m.room]; r.end = p.x + p.w; r.w = r.end - r.x; }
      if (p.arena) room(m, 'QUEEN CHAMBER', p.x, p.x + p.w, lv.line, Infinity, fy);
      if (p.roof) rock(m, p.x, lv.line, p.w, cy - lv.line);
      if (p.floor) ground(m, p.x, fy, p.w, below ? below.line - fy : undefined);
      if (p.nest === 'bowl') {
        const lx = p.x + Math.round((p.w - 80) / 16) * 8;
        ledge(m, lx, fy - 40, 80);
        ledge(m, Math.max(p.x - 40, Math.min(p.x + p.w - 24, lx + m.pick([-48, 64]))), fy - 80, 64);
      }
      if (p.nest === 'out' || p.arena) m.room = levelRoom;
    }
    if (lv.exitSide) {
      // climb the shaft back up to this level's floor
      const nx = below.pieces.find(p => p.floor && !p.roof && (lv.exitSide > 0 ? p.x >= width - shaftW : p.x === 0));
      const lowY = nx.f + below.off;
      const upper = lv.exitSide > 0 ? lv.pieces.at(-2) : lv.pieces[1];
      const S = lv.exitSide > 0 ? width - shaftW : shaftW;
      ladder(m, S - 16 * lv.exitSide * -1, lowY, upper.f + lv.off, lv.exitSide > 0 ? S - 22 : S + 10);
    }
  }
  m.start = { x: 48, y: GROUND };
  m.arena = levels.at(-1).pieces.at(-1).f + levels.at(-1).off;
}

// ---------------------------------------------------------------- 3. crater dive
// Drop down a volcanic well on outcrops that jut from alternating walls, with ladders climbing
// back up beside each lip. A passage at the bottom runs into the boss's magma chamber.
function crater(m, lay) {
  const wellL = 176, wellW = lay.well, wellR = wellL + wellW, width = snap(wellR + W * 0.8) + W;
  m.width = width;
  room(m, 'RIM', 0, wellL, 0, GROUND + 20, GROUND);
  ground(m, 0, GROUND, wellL);
  let y = GROUND, prev = null;
  const join = (cur, lowY) => {
    // a ladder rises from the outcrop below, just past the lip of the one above
    if (!prev) ladder(m, wellL + 16, lowY, GROUND, wellL - 22);
    else if (prev.left) ladder(m, prev.x + prev.w + 16, lowY, prev.y, prev.x + prev.w - 22);
    else ladder(m, prev.x - 16, lowY, prev.y, prev.x + 10);
  };
  for (let k = 0; k < lay.ledges; k++) {
    y += m.int(15, 19) * 8;
    const left = k % 2 === 0, len = snap(wellW * (0.56 + m.rand() * 0.08)), x = left ? wellL : wellR - len;
    if (k % 2 === 0) room(m, lay.label, wellL, wellR, y - 150, y + 300, y);
    const cur = ground(m, x, y, len, 40);
    cur.left = left;
    join(cur, y);
    // a hunting ledge hangs over the open side of the well
    if (left) ledge(m, x + len + 24, y - 36, 88);
    else ledge(m, x - 112, y - 36, 88);
    prev = cur;
  }
  const yB = y + 150;
  room(m, 'MAGMA RUN', wellL, width - W, prev.y + 40, Infinity, yB);
  ground(m, wellL, yB, width - wellL);
  join(null, yB);
  // passage to the chamber: a few lava-crust bumps under a low roof
  for (let x = wellR + 88; x < width - W - 120; x += m.int(18, 26) * 8) ground(m, x, yB - 24, m.int(8, 12) * 8, 24);
  rock(m, wellR, GROUND - 40, width - W - wellR, yB - 110 - (GROUND - 40));
  rock(m, width - W, GROUND - 40, W, yB - 250 - (GROUND - 40));
  room(m, 'MAGMA CHAMBER', width - W, width, prev.y + 40, Infinity, yB);
  m.start = { x: 48, y: GROUND };
  m.arena = yB;
}

// ---------------------------------------------------------------- 4. banquet-hall maze
// A grid of halls joined by doorways and ladder hatches, carved as a maze with a few loops.
// Dead ends hide residents, so clearing it means exploring every wing. Exit: the throne room.
function halls(m, lay) {
  const R = lay.rows, Cn = lay.cols, cw = 320, ch = 160, T = 24, mazeW = Cn * cw, width = mazeW + W;
  m.width = width;
  const fy = r => GROUND + r * ch, top = r => fy(r) - ch + T;
  const east = new Set(), south = new Set(), key = (r, c) => r * Cn + c;
  const seen = new Set([0]), stack = [[0, 0]];
  while (stack.length) {
    const [r, c] = stack.at(-1);
    const next = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]].filter(([a, b]) => a >= 0 && b >= 0 && a < R && b < Cn && !seen.has(key(a, b)));
    if (!next.length) { stack.pop(); continue; }
    const [a, b] = next[Math.floor(m.rand() * next.length)];
    if (a === r) east.add(key(r, Math.min(b, c))); else south.add(key(Math.min(a, r), c));
    seen.add(key(a, b)); stack.push([a, b]);
  }
  for (let r = 0; r < R; r++) for (let c = 0; c < Cn; c++) {
    if (c < Cn - 1 && m.rand() < 0.16) east.add(key(r, c));
    if (r < R - 1 && m.rand() < 0.12) south.add(key(r, c));
  }
  // route order: halls further from the entrance hold tougher residents
  const dist = new Map([[0, 0]]), queue = [[0, 0]];
  while (queue.length) {
    const [r, c] = queue.shift(), d = dist.get(key(r, c));
    for (const [a, b, open] of [[r, c + 1, east.has(key(r, c))], [r, c - 1, c > 0 && east.has(key(r, c - 1))], [r + 1, c, south.has(key(r, c))], [r - 1, c, r > 0 && south.has(key(r - 1, c))]])
      if (open && !dist.has(key(a, b))) { dist.set(key(a, b), d + 1); queue.push([a, b]); }
  }
  const cells = [...dist.keys()].sort((a, b) => dist.get(a) - dist.get(b));
  const roomOf = new Map(), hole = new Map();
  for (const k of cells) {
    const r = Math.floor(k / Cn), c = k % Cn;
    roomOf.set(k, room(m, lay.label, c * cw, (c + 1) * cw, top(r) - T, fy(r), fy(r)));
  }
  // a ladder climbs out of each hatch, so a hall's own hatch never sits under the one above it
  for (let r = 0; r < R - 1; r++) for (let c = 0; c < Cn; c++) if (south.has(key(r, c))) {
    const above = hole.get(key(r - 1, c)), xs = [];
    for (let x = c * cw + 40; x <= c * cw + cw - 96; x += 8) if ((above == null || Math.abs(x - above) > 80) && (r || c || x > 128)) xs.push(x);
    hole.set(key(r, c), m.pick(xs));
  }
  rock(m, 0, 0, mazeW + 12, top(0));
  for (let r = 0; r < R; r++) for (let c = 0; c < Cn; c++) {
    const k = key(r, c), x0 = c * cw, x1 = r === R - 1 && c === Cn - 1 ? width : (c + 1) * cw + (c === Cn - 1 ? 12 : 0);
    m.room = roomOf.get(k);
    const h = r === R - 1 ? undefined : T, hx = hole.get(k);
    if (hx == null) ground(m, x0, fy(r), x1 - x0, h);
    else {
      ground(m, x0, fy(r), hx - x0, h);
      ground(m, hx + 56, fy(r), x1 - hx - 56, h);
      ladder(m, hx + 28, fy(r + 1), fy(r), hx + 60);
    }
    // walls and doorways on the east side of each hall
    const wx = (c + 1) * cw - 12, door = c === Cn - 1 ? r === R - 1 : east.has(k);
    rock(m, wx, top(r), 24, door ? fy(r) - 72 - top(r) : fy(r) - top(r), door);
    // furniture: a long table, sometimes a gallery above it, clear of both ladder hatches
    const above = hole.get(key(r - 1, c)), busy = [hx, above].filter(v => v != null);
    const spots = [x0 + 24, x0 + 176].filter(s => busy.every(v => s + 128 + 24 < v || s > v + 56 + 24));
    if (spots.length) {
      const sx = m.pick(spots), w = m.pick([96, 112, 128]);
      ledge(m, sx, fy(r) - 36, w);
      if (m.rand() < 0.45) ledge(m, sx + m.pick([16, 32]), fy(r) - 72, 64);
    }
  }
  room(m, 'THRONE ROOM', mazeW, width, 0, Infinity, fy(R - 1));
  rock(m, mazeW + 12, 0, W - 12, fy(R - 1) - 260);
  m.start = { x: 48, y: GROUND };
  m.arena = fy(R - 1);
}

// ---------------------------------------------------------------- 5. bell tower climb
// Start in the crypt and climb storey by storey: some hatches have ladders, others a zigzag of
// little ledges to hop up. The roof opens onto a terrace and the exit.
function belfry(m, lay) {
  const S = lay.storeys, sh = 150, T = 24, TW = 2 * W, width = TW + W, roof = 120, oW = 120;
  m.width = width;
  // hatches alternate between the side walls; the rest of each storey is one long floor
  // (counted down from the roof, whose hatch is on the left so it runs straight onto the terrace)
  const right = k => (S - k) % 2 === 1, fy = k => roof + (S - k) * sh, ox = k => right(k) ? TW - oW : 0;
  for (let k = 0; k < S; k++) room(m, k ? lay.label : 'CRYPT', 0, TW, fy(k + 1) + T, fy(k), fy(k));
  room(m, 'ROOF', 0, width, 0, fy(S), fy(S));
  m.room = 0;
  ground(m, 0, fy(0), TW);
  const kinds = [];
  for (let k = 1; k <= S; k++) kinds.push(k % 2 ? 'stairs' : 'ladder');
  for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(m.rand() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
  for (let k = 1; k <= S; k++) {
    const x = ox(k);
    m.room = k - 1;
    const near = right(k) ? x + 6 : x + oW - 54, far = right(k) ? x + oW - 54 : x + 6;
    if (kinds[k - 1] === 'ladder') ladder(m, right(k) ? x + 18 : x + oW - 18, fy(k - 1), fy(k), right(k) ? x - 22 : x + oW + 10);
    else for (let j = 1; j <= 4; j++) ledge(m, j % 2 ? far : near, fy(k - 1) - 30 * j, 48, { hunt: false });
    m.room = Math.min(k, S);
    if (right(k)) ground(m, 0, fy(k), x, T);
    else ground(m, oW, fy(k), TW - oW, T);
    if (k < S) {
      // pews and chandeliers, clear of the hatch below and the one above
      const lo = Math.min(x, ox(k + 1)) + oW + 24, hi = Math.max(x, ox(k + 1)) - 24;
      const w = m.int(15, 25) * 8, px = snap(lo + m.rand() * Math.max(0, hi - lo - w));
      ledge(m, px, fy(k) - 40, Math.min(w, hi - px));
      if (m.rand() < 0.6) ledge(m, px + 32, fy(k) - 80, 64);
    }
  }
  const pw = m.int(15, 25) * 8;
  m.room = 0;
  ledge(m, snap(TW / 2 - pw / 2), fy(0) - 40, pw);
  m.room = S;
  ground(m, TW, fy(S), W);
  m.start = { x: 48, y: fy(0) };
  m.arena = fy(S);
}

// ---------------------------------------------------------------- 6. summit climb
// Outdoors and uphill: terraces rise to the right. Cliffs are climbed by ladder or by hopping up
// a stack of ice ledges; crevasses dip between some of them. The boss waits on the peak.
function summit(m, lay) {
  const n = lay.terraces, peak = 140;
  const ts = [];
  let rel = 0;
  for (let t = 0; t < n; t++) {
    const rise = t ? m.pick([72, 96, 120, 144]) : 0;
    rel -= rise;
    ts.push({ w: t === 0 ? 384 : m.int(40, 64) * 8, rel, rise, kind: t ? m.pick(['ladder', 'steps', 'steps', 'crevasse']) : null });
  }
  const arena = { w: W, rise: m.pick([72, 96]), kind: 'steps' };
  rel -= arena.rise;
  const off = peak - rel;
  let x = 0, prevY = null;
  const climb = (kind, cliffX, lowY, highY) => {
    if (kind === 'ladder') ladder(m, cliffX - 16, lowY, highY, cliffX + 10);
    else {
      const rise = lowY - highY, steps = Math.ceil(rise / 34) - 1, dy = rise / (steps + 1);
      for (let j = 1; j <= steps; j++) ledge(m, cliffX - 8 - 52 * (steps - j + 1), Math.round(lowY - dy * j), 48, { hunt: false });
    }
  };
  for (const [t, T] of ts.entries()) {
    const y = T.rel + off;
    if (t && T.kind === 'crevasse') {
      const cw = m.int(20, 28) * 8, cy = prevY + 96;
      room(m, 'CREVASSE', x, x + cw, prevY, cy + 10, cy);
      ground(m, x, cy, cw);
      ladder(m, x + 16, cy, prevY, x - 22);
      ladder(m, x + cw - 16, cy, y, x + cw + 10);
      x += cw;
    } else if (t) climb(T.kind, x, prevY, y);
    room(m, t ? lay.label : 'BASE CAMP', x, x + T.w, y - 160, y + 10, y);
    ground(m, x, y, T.w);
    // floating ice perches over the left half, away from the next climb
    if (T.w >= 400) {
      const lx = x + 40 + snap(m.rand() * 48), lw = Math.min(m.int(12, 16) * 8, x + T.w - 260 - lx);
      ledge(m, lx, y - 40, lw);
      if (m.rand() < 0.5) ledge(m, lx + 40, y - 80, 72);
    }
    x += T.w; prevY = y;
  }
  const y = peak;
  climb(arena.kind, x, prevY, y);
  room(m, 'PEAK', x, x + W, 0, y + 10, y);
  ground(m, x, y, W);
  m.width = x + W;
  m.start = { x: 48, y: ts[0].rel + off };
  m.arena = y;
}

// ---------------------------------------------------------------- 7. forge catwalks
// Bays between furnace pillars, each with three tiers: a gappy top catwalk, a middle gantry and
// the forge floor. Miss a jump and you fall a tier; ladders bring you back up.
function gantry(m, lay) {
  const width = lay.screens * W, yT = GROUND, yM = GROUND + 140, yP = GROUND + 290;
  m.width = width;
  const bays = [];
  let x = 176;
  while (x < width - W - 400) {
    let w = m.int(70, 96) * 8;
    if (width - W - (x + w) < 560) w = width - W - x;
    const bay = { a: x, b: x + w };
    x += w;
    if (x < width - W) { bay.pillar = m.int(8, 12) * 8; x += bay.pillar; }
    bays.push(bay);
  }
  for (const [i, { a, b, pillar = 0 }] of bays.entries()) {
    room(m, lay.label, i ? a : 0, b + pillar, 0, Infinity, yP);
    if (i === 0) { ground(m, 0, yT, a, yP - yT); ladder(m, a + 16, yP, yT, a - 22); }
    // top catwalk: jumpable gaps, sometimes one broken span you have to drop through
    const broken = b - a > 640 && m.rand() < 0.7 ? a + snap((b - a) * (0.4 + m.rand() * 0.2)) : null;
    const tops = [];
    let s = a + m.pick([0, 40, 48]);
    while (b - s >= 64) {
      const stop = broken != null && s < broken ? broken - 56 : b;
      let w = m.int(12, 24) * 8;
      if (stop - (s + w) < 120) w = stop - s;
      tops.push(ledge(m, s, yT, w));
      s += w;
      s += s === broken - 56 ? 112 : m.pick([40, 48, 56]);
    }
    // the middle gantry spans most of the bay; ladders climb to both ends of the top catwalk
    const mid = ledge(m, a + 72, yM, b - a - 144);
    for (const p of new Set([tops[0], tops.at(-1)])) {
      const lx = Math.max(mid.x + 16, Math.min(mid.x + mid.w - 16, p.x + 24));
      ladder(m, lx, yM, yT, Math.max(p.x, lx - 5));
    }
    const lx = mid.x + snap(mid.w / 2);
    ladder(m, lx, yP, yM, lx - 5);
    // anvils on the forge floor, clear of the ladder foot
    for (let ax = a + 96; ax < b - 120; ax += m.int(28, 40) * 8) if (ax > lx + 16 || ax + 80 < lx) ground(m, ax, yP - 24, 64, 24);
    if (pillar) ground(m, b, yT, pillar, yP - yT);
  }
  m.room = 0;
  ground(m, 0, yP, width - W);
  room(m, 'CRUCIBLE', width - W, width, 0, Infinity, yP);
  ground(m, width - W, yP, W);
  m.start = { x: 48, y: yT };
  m.arena = yP;
}

const STYLES = { hills, burrow, crater, halls, belfry, summit, gantry };

// ---------------------------------------------------------------- residents and bounds
function finish(m, zone, lay) {
  const width = m.width;
  const floorY = Math.max(...m.platforms.filter(p => p.ground).map(p => p.y)), height = floorY + 64;
  for (const p of m.solids) if (p.fill) { p.h = height - p.y; delete p.fill; }
  for (const r of m.rooms) { r.end = Math.min(r.end, width); r.w = r.end - r.x; }
  const blocked = (x, y) => m.solids.some(p => x + 8 > p.x && x - 8 < p.x + p.w && y - 24 < p.y + p.h && y - 1 > p.y);
  const roofAbove = (x, y) => Math.max(0, ...m.solids.filter(p => x + 8 > p.x && x - 8 < p.x + p.w && p.y + p.h <= y - 1).map(p => p.y + p.h));
  // spread residents evenly along every walkable surface, in route order
  const spans = [];
  for (const p of m.platforms) {
    if (!(p.ground || p.hunt) || p.w < 40) continue;
    let left = Math.max(p.x + 14, 70), right = Math.min(p.x + p.w - 14, width - 70);
    if (Math.abs(p.y - m.start.y) < 4 && p.x <= m.start.x) left = Math.max(left, m.start.x + 170);
    if (right - left >= 8) spans.push({ p, left, right });
  }
  spans.sort((a, b) => a.p.room - b.p.room || a.p.y - b.p.y || a.left - b.left);
  const total = spans.reduce((s, q) => s + q.right - q.left, 0), count = 28 + zone * 3, spawns = [];
  for (let i = 0; i < count; i++) {
    let pos = (i + 0.5) / count * total, q = spans[0];
    for (q of spans) { if (pos <= q.right - q.left) break; pos -= q.right - q.left; }
    let sx = Math.round(Math.min(q.right, q.left + pos));
    // slide off any wall or doorframe standing on the surface
    for (let d = 8, x0 = sx; blocked(sx, q.p.y) && d < q.right - q.left; d += 8)
      sx = [x0 + d, x0 - d].find(v => v >= q.left && v <= q.right && !blocked(v, q.p.y)) ?? sx;
    const roof = roofAbove(sx, q.p.y);
    spawns.push({
      x: sx, y: q.p.y, airY: Math.max(roof + 18, q.p.y - 65), section: Math.floor(sx / W), room: q.p.room,
      wave: Math.min(4, 1 + Math.floor(q.p.room * 4 / m.rooms.length)), elite: zone > 0 && i > 0 && i % 9 === 0
    });
  }
  return {
    name: ZONES[zone].name, style: lay.style, title: lay.title, width, height, floorY, rooms: m.rooms,
    sections: Math.ceil(width / W), platforms: m.platforms, solids: m.solids, ladders: m.ladders, spawns,
    startX: m.start.x, startY: m.start.y, exitX: width - 36, exitY: m.arena,
    bossFloor: m.arena, bossLeft: width - W + 8, bossRight: width - 8
  };
}
