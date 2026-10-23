// Map layouts: Super Mario World style run-through stages built for speed. Every level runs left
// to right: rolling ground with steps you can hop, pits to jump (fall in and you lose a chunk of
// health and go back to the last ground you stood on), chasms with a stepping ledge in the middle,
// floating ledge rows and staircases that make a richer high route (the relics sit up there), and a
// flat arena at the end where the boss waits. No ladders, no stacked storeys: you never have to
// stop moving. Stages run 11 to 20 screens, with long straightaways to build up speed on (hero.js
// momentum). Residents stand along the route in small groups you can cut through at a run; you
// don't have to clear them to reach the arena, but a full clear pays.
// Biome art and names still belong to ZONES. Layouts are seeded per level, so a route is the same
// every run and speedrun splits stay comparable.
//
// Movement budget (HERO jump 262, gravity 760 rising, 1.6x falling, speed 112): a jump rises 45px
// and carries about 69px. So steps are at most 32px, pits at most 56px, a floating ledge sits 36-40px
// over the surface you jump from, and wider chasms always get a stepping ledge.
import { W, GROUND, HERO } from '../config.js';
import { ZONES } from './zones.js';
import { NODES, REGIONS, isLevel } from './overworld.js';

// residents per map: groups along the route, fewer than the old MapleStory fields (50 + 4z), so
// each kill pays KILL_PAY times as much (xp, shards, weapon drops) and the economy keeps its pace
export const FOES = zone => 40 + zone * 4;
export const KILL_PAY = zone => (50 + zone * 4) / FOES(zone);
// shards for a full clear (every resident on the map) before you reach the arena
export const CLEAR_BONUS = zone => 12 + zone * 4;

// each world's stage recipe: how often pits, hills, floating ledges and staircases come up
//   pits   chance a stretch ends in a pit     chasm  share of pits that are wide chasms
//   hills  how big the steps are (0-3)        climb / descend  the stage trends up or down
//   blocks floating ledge rows                stairs staircases up to a high run
//   cave   a rock roof (always high enough to jump under)   pack  residents per group
//   straight  chance of a long flat straightaway to build momentum on (Sonic, Dead Cells)
export const LAYOUTS = [
  { title: 'ANT TUNNEL', label: 'TUNNEL', screens: 11, straight: 0.3, cave: true, pits: 0.18, chasm: 0.2, hills: 1, blocks: 0.35, stairs: 0.15, pack: [2, 4] },
  { title: 'ARCHERY GLADE', label: 'GLADE', screens: 12, straight: 0.35, pits: 0.22, chasm: 0.25, hills: 2, blocks: 0.4, stairs: 0.25, pack: [2, 4] },
  { title: 'SEA CAVES', label: 'GROTTO', screens: 12, straight: 0.25, cave: true, pits: 0.28, chasm: 0.35, hills: 1, descend: true, blocks: 0.3, stairs: 0.1, pack: [2, 5] },
  { title: 'MARKET ROOFTOPS', label: 'ROOFTOP', screens: 12, straight: 0.3, pits: 0.45, chasm: 0.3, hills: 2, blocks: 0.45, stairs: 0.2, pack: [2, 5] },
  { title: 'CHERRY PAGODA', label: 'STOREY', screens: 13, straight: 0.3, pits: 0.25, chasm: 0.3, hills: 1, climb: true, blocks: 0.3, stairs: 0.45, pack: [2, 5] },
  { title: 'MONASTERY STEPS', label: 'TERRACE', screens: 13, straight: 0.25, pits: 0.2, chasm: 0.2, hills: 3, blocks: 0.3, stairs: 0.4, pack: [3, 5] },
  { title: 'FORGE CATWALKS', label: 'CATWALK', screens: 14, straight: 0.25, pits: 0.42, chasm: 0.45, hills: 1, blocks: 0.35, stairs: 0.15, pack: [3, 5] },
  { title: 'ROOT TUNNELS', label: 'BURROW', screens: 14, straight: 0.3, cave: true, pits: 0.3, chasm: 0.3, hills: 2, descend: true, blocks: 0.35, stairs: 0.2, pack: [3, 6] },
  { title: 'CASTLE RAMPARTS', label: 'RAMPART', screens: 15, straight: 0.3, pits: 0.45, chasm: 0.35, hills: 2, blocks: 0.4, stairs: 0.3, pack: [3, 6] },
  { title: 'VAULT TUNNELS', label: 'VAULT', screens: 16, straight: 0.3, cave: true, pits: 0.5, chasm: 0.4, hills: 2, blocks: 0.4, stairs: 0.3, pack: [3, 6] }
];

// Every level plays its own stage from its world's recipe: the first level plays the zone's
// stage, and each later level reseeds it and pushes it a step further along the road (longer,
// more pits, more residents), with the fort and the castle the biggest of all.
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const road = {}; // level id -> [place on its world's road from 0, levels on that road]
for (const R of REGIONS) {
  const ids = Object.values(NODES).filter(n => n.region === R.id && isLevel(n)).map(n => n.id);
  ids.forEach((id, i) => (road[id] = [i, ids.length]));
}
// the level's own recipe, or null when it plays the zone's stage (its first level)
export const ownMap = id => !!(NODES[id] && levelLayout(NODES[id].zone, id));
export function levelLayout(zone, id) {
  const lay = LAYOUTS[zone], node = NODES[id];
  if (!node || !road[id] || !road[id][0]) return null;
  const [i, n] = road[id], tier = i / (n - 1), kind = node.kind, big = kind === 'fort' || kind === 'castle';
  const title = kind === 'castle' ? lay.title + ' KEEP' : kind === 'fort' ? lay.title + ' FORT' : kind === 'secret' ? 'HIDDEN ' + lay.title : lay.title + ' ' + ROMAN[i + 1];
  const seed = [...id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7);
  return {
    ...lay, title, seed,
    screens: Math.min(20, lay.screens + Math.round(tier * 3) + (big ? 1 : 0)),
    pits: Math.min(0.55, lay.pits + tier * 0.1),
    cave: kind === 'fort' || (i % 4 === 3 ? !lay.cave : !!lay.cave),
    foes: Math.round(tier * 8) + (big ? 3 : 0),
    elite: big ? 6 : 0,
    dark: kind === 'castle' ? 2 : kind === 'fort' ? 1 : 0
  };
}
export function makeMap(zone, levelId = null) {
  const L = levelLayout(zone, levelId), at = L || LAYOUTS[zone], m = builder(zone, L ? L.seed : 0);
  stage(m, at);
  return { ...finish(m, zone, at), own: !!L };
}
export function cameraTarget(x, width) { return Math.max(0, Math.min(width - W, x - W * .42)); }
export function cameraTargetY(feet, floorY) { return Math.max(0, Math.min(floorY - GROUND, feet - GROUND + 12)); }
// the stretch the hero is in: the smallest room containing their feet
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
function builder(zone, seed = 0) {
  const rand = seeded(zone * 7919 + 101 + seed);
  return {
    zone, platforms: [], solids: [], ladders: [], rooms: [], room: 0, width: 0, pits: [],
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
// terrain nobody stands on: the cave roof (ceiling draws a jagged underside)
function rock(m, x, y, w, h, ceiling = true) {
  if (w <= 0 || h <= 0) return null;
  const p = { x, y, w, h, solid: true, ceiling };
  m.solids.push(p);
  return p;
}
// a drop-through floating ledge (residents can perch on it)
function ledge(m, x, y, w, extra) {
  const p = { x, y, w, room: m.room, hunt: true, ...extra };
  m.platforms.push(p);
  return p;
}
function room(m, label, x, end, y0, y1, floor) {
  m.room = m.rooms.length;
  m.rooms.push({ index: m.room, label, x, end, w: end - x, y0, y1, floor });
  return m.room;
}

// ---------------------------------------------------------------- the stage
// Built left to right in relative heights (negative is up), then shifted so the highest surface
// sits near the top of the map.
const STEPS = [[0], [-16, 0, 0, 16], [-24, -16, 0, 0, 16, 24], [-32, -24, -16, 0, 16, 24, 32]];
function stage(m, lay) {
  const width = lay.screens * W, end = width - W;
  m.width = width;
  const segs = [], floats = [], trend = lay.climb ? -1 : lay.descend ? 1 : 0;
  let x = 0, y = 0;
  const add = (w, dy = 0) => { y += Math.max(-32, Math.min(32, dy)); const g = { x, y, w }; segs.push(g); x += w; return g; };
  const step = () => m.pick(STEPS[lay.hills || 0]) + trend * m.pick([8, 16]);
  add(224); // a runway to get going
  while (x < end - 96) {
    const left = end - x;
    // a pit (or a wide chasm with a stepping ledge in its middle), then the ground goes on
    if (left > 260 && m.rand() < lay.pits) {
      let gap, chasm = false;
      if (m.rand() < lay.chasm) {
        gap = m.int(14, 18) * 8;
        chasm = true;
        // two clear hops, onto it and off it, and wide enough that one running jump lands on it
        floats.push({ x: x + 24, y: y - 16, w: gap - 48, step: true });
      } else gap = m.int(4, 6) * 8 + (m.rand() < 0.3 ? 8 : 0);
      m.pits.push({ x, w: gap });
      x += gap;
      // a chasm's far side is never far below its stepping ledge
      add(Math.min(end - x, m.int(12, 22) * 8), chasm ? m.pick([-16, 0, 8]) : m.pick([-16, 0, 0, 16]));
      continue;
    }
    // a straightaway: a long flat run with nothing overhead, where momentum builds to a full sprint
    if (left > 720 && m.rand() < lay.straight) {
      add(m.int(44, 64) * 8, m.pick([-16, 0, 0, 16])).straight = true;
      continue;
    }
    const w = left < 360 ? left : m.int(12, 30) * 8;
    const g = add(w, step()), n0 = floats.length;
    // a row of floating ledges over the ground, sometimes with a second, higher one
    if (g.w >= 136 && m.rand() < lay.blocks) {
      const fw = m.int(6, 10) * 8, fx = g.x + m.int(3, Math.max(3, Math.floor((g.w - fw) / 8) - 3)) * 8;
      const f = { x: fx, y: g.y - m.pick([36, 40]), w: Math.min(fw, g.x + g.w - fx - 8) };
      if (f.w >= 40) {
        floats.push(f);
        if (m.rand() < 0.5) floats.push({ x: f.x + f.w - 24, y: f.y - 36, w: m.int(6, 9) * 8 });
      }
    } else if (g.w >= 176 && m.rand() < lay.stairs) {
      // a staircase up to a high run, the long way round with the best view (and the relics)
      const n = m.int(2, 4);
      let sx = g.x + 24;
      for (let k = 1; k <= n; k++, sx += 56) floats.push({ x: sx, y: g.y - 36 * k, w: 48 });
      floats.push({ x: sx, y: g.y - 36 * n - 32, w: m.int(12, 20) * 8 });
    }
    // a ledge stops well short of the ground's end, so dropping off it never lands you in the next pit
    for (const f of floats.slice(n0)) f.w = Math.min(f.w, g.x + g.w - 56 - f.x);
  }
  if (x < end) (segs.at(-1).w += end - x), (x = end);
  // shift so the runway is at the usual ground height (GROUND), unless the stage climbs so high
  // that its top surface would come within 48px of the top of the map
  const top = Math.min(...segs.map(g => g.y), ...floats.map(f => f.y)), off = Math.max(GROUND - segs[0].y, 48 - top);
  const arenaY = segs.at(-1).y + off;
  // the route is cut into stretches of about two screens for the HUD's room line
  const stretches = Math.max(1, Math.round(end / (2 * W)));
  const edge = k => (k >= stretches ? end : Math.round((k * end) / stretches / 8) * 8);
  for (let k = 0; k < stretches; k++) room(m, lay.label + ' ' + (k + 1), edge(k), edge(k + 1), 0, Infinity, 0);
  const roomOf = x => Math.min(stretches - 1, Math.floor((x / end) * stretches));
  for (const g of segs) {
    m.room = roomOf(g.x);
    m.rooms[m.room].floor ||= g.y + off;
    ground(m, g.x, g.y + off, g.w);
  }
  for (const f of floats) {
    const w = Math.min(f.w, end - 8 - f.x);
    if (w < 32) continue;
    m.room = roomOf(f.x);
    ledge(m, f.x, f.y + off, w, f.step ? { step: true } : null);
  }
  room(m, 'ARENA', end, width, 0, Infinity, arenaY);
  ground(m, end, arenaY, W);
  m.room = 0;
  // the cave roof: 32px columns, always 104px or more over the highest thing you can stand on
  if (lay.cave) {
    const surf = m.platforms.filter(p => p.x < end);
    const lowest = x0 => {
      let best = Infinity;
      for (const p of surf) if (p.x < x0 + 56 && p.x + p.w > x0 - 24) best = Math.min(best, p.y);
      return best;
    };
    let run = null;
    for (let cx = 256; cx < end - 16; cx += 32) {
      const h = Math.floor((lowest(cx) - 104) / 8) * 8 - m.pick([0, 8, 16]);
      if (run && run.h === h) { run.w += 32; continue; }
      if (run) rock(m, run.x, 0, run.w, run.h);
      run = h >= 16 && isFinite(h) ? { x: cx, w: 32, h } : null;
    }
    if (run) rock(m, run.x, 0, run.w, run.h);
  }
  m.start = { x: 48, y: segs[0].y + off };
  m.arena = arenaY;
  m.gadgets = gadgets(m, lay, segs.map(g => ({ ...g, y: g.y + off })), floats.map(f => ({ ...f, y: f.y + off })), end);
}

// ---------------------------------------------------------------- speed gadgets (game/gadgets.js)
// Sonic-style obstacles that pay you for running a stage well. Every one is optional: the route
// never needs them (tests/map-reach.mjs ignores them), they just make it faster or richer. Each
// world brings in one new kind (the first one of a new kind sits on flat ground near the start, so
// you meet it before you need it) and keeps the old ones, a little more often each world.
//   spring  a bounce pad at the foot of a high route: launches you up past the floating ledges
//   boost   a dash panel at the start of a straightaway: full momentum and a burst on top
//   rope    a vine or rope over a chasm: grab it, swing, let go at the bottom for a long fling
//   zip     a zipline over a pit, sloping down: hang on and slide out the far end at speed
//   rings   a trail of shard rings along the fastest jump: all of them in one go is a PERFECT
export const GADGET_INTRO = ['spring', 'boost', 'rope', 'zip', 'rings']; // world 1 brings the first, and so on
export const gadgetKinds = zone => GADGET_INTRO.slice(0, Math.min(GADGET_INTRO.length, zone + 1));
function gadgets(m, lay, segs, floats, end) {
  const zone = m.zone, kinds = new Set(gadgetKinds(zone)), out = [], fresh = GADGET_INTRO[zone];
  const dense = Math.min(0.85, 0.45 + zone * 0.05); // later worlds use them more
  const groundAt = x => segs.find(g => x >= g.x + 16 && x <= g.x + g.w - 16);
  const near = x => out.some(o => Math.abs((o.x ?? o.x0) - x) < 72);
  // the new kind for this world, first thing after the runway on flat ground
  if (fresh) {
    const g = segs.find(g => g.x >= 200 && g.w >= 200);
    if (g) {
      const x = g.x + 48;
      if (fresh === 'spring' || fresh === 'boost') out.push({ kind: fresh, x, y: g.y, dir: 1, intro: true });
      else if (fresh === 'rings') out.push({ kind: 'rings', intro: true, x, pts: arc(x, g.y, 120, 44, 6) });
    }
  }
  // springs at the foot of the floating rows and staircases
  if (kinds.has('spring')) for (const f of floats) {
    if (f.step || m.rand() > dense * 0.6) continue;
    const x = f.x - 28, g = groundAt(x);
    if (g && g.y - f.y >= 30 && !near(x) && x < end - 64) out.push({ kind: 'spring', x, y: g.y });
  }
  // dash panels at the start of every straightaway
  if (kinds.has('boost')) for (const g of segs) if (g.straight && !near(g.x + 40)) out.push({ kind: 'boost', x: g.x + 40, y: g.y, dir: 1 });
  // a line of rings down the middle of a straightaway, at running height: grab them at full tilt
  if (kinds.has('rings')) for (const g of segs) if (g.straight && m.rand() < dense)
    out.push({ kind: 'rings', x: g.x + 120, pts: Array.from({ length: 8 }, (_, i) => [g.x + 120 + i * 24, g.y - 12]) });
  // over the pits: ropes on the wide chasms, ziplines and ring trails on the rest
  for (const p of m.pits) {
    const L = segs.find(g => g.x + g.w === p.x), R = segs.find(g => g.x === p.x + p.w);
    if (!L || !R) continue;
    // the world that brings in ropes or ziplines puts them on its first pits that can take one
    const wide = p.w > 56, zipOk = L.w >= 120 && R.w >= 120, firsts = k => fresh === k && out.filter(o => o.kind === k).length < 3;
    const r = m.rand(), want = firsts('rope') && wide ? 'rope' : firsts('zip') && zipOk ? 'zip'
      : wide && kinds.has('rope') && r < dense ? 'rope' : zipOk && kinds.has('zip') && r < dense * 0.5 ? 'zip' : !wide && kinds.has('rings') && r < dense ? 'rings' : null;
    if (want === 'rope') out.push({ kind: 'rope', x: p.x + 36, y: L.y - 118, len: 76 }); // the knot hangs where a running jump off the edge peaks
    else if (want === 'zip') out.push({ kind: 'zip', x0: p.x - 96, y0: L.y - 52, x1: p.x + p.w + 96, y1: Math.max(L.y - 52 + 16, R.y - 34) });
    else if (want === 'rings') out.push({ kind: 'rings', x: p.x, pts: arc(p.x - 24, L.y, p.w + 48, 40, 6) });
  }
  return out.filter(o => (o.x ?? o.x0) < end - 40).sort((a, b) => (a.x ?? a.x0) - (b.x ?? b.x0));
}
// n points along a hop from (x, ground y) over w px, `rise` at the top (the rings' centres)
function arc(x, y, w, rise, n) {
  return Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n;
    return [Math.round(x + u * w), Math.round(y - 14 - 4 * rise * u * (1 - u))];
  });
}


// ---------------------------------------------------------------- residents and bounds
function finish(m, zone, lay) {
  const width = m.width;
  // with pits the map's floor is a pit bottom below every ground, where a fall ends (hero.js)
  const deepest = Math.max(...m.platforms.filter(p => p.ground).map(p => p.y)), floorY = m.pits.length ? deepest + 80 : deepest, height = floorY + 64;
  for (const p of m.solids) if (p.fill) { p.h = height - p.y; delete p.fill; }
  for (const r of m.rooms) { r.end = Math.min(r.end, width); r.w = r.end - r.x; }
  const blocked = (x, y) => m.solids.some(p => x + 8 > p.x && x - 8 < p.x + p.w && y - 24 < p.y + p.h && y - 1 > p.y);
  const roofAbove = (x, y) => Math.max(0, ...m.solids.filter(p => x + 8 > p.x && x - 8 < p.x + p.w && p.y + p.h <= y - 1).map(p => p.y + p.h));
  // residents gather in small packs spread along the route; members stand a body apart so no two
  // overlap, and a pack never spills off its platform
  const GAP = 24;
  const spans = [];
  for (const p of m.platforms) {
    if (!(p.ground || p.hunt) || p.w < 40) continue;
    let left = Math.max(p.x + 14, 70), right = Math.min(p.x + p.w - 14, width - 70);
    if (Math.abs(p.y - m.start.y) < 4 && p.x <= m.start.x) left = Math.max(left, m.start.x + 170);
    if (right - left >= GAP * 3) spans.push({ p, left, right });
  }
  spans.sort((a, b) => a.left - b.left || a.p.y - b.p.y);
  const total = spans.reduce((s, q) => s + q.right - q.left, 0), count = FOES(zone) + (lay.foes || 0), spawns = [];
  const packs = [];
  for (let left = count; left > 0; ) {
    const n = Math.min(left, m.int(...(lay.pack || [5, 8])));
    packs.push(n);
    left -= n;
  }
  for (let [k, n] of packs.entries()) {
    let pos = (k + 0.5) / packs.length * total, q = spans[0];
    for (q of spans) { if (pos <= q.right - q.left) break; pos -= q.right - q.left; }
    if (lay.seed && k === packs.length - 1) (q = spans.at(-1)), (pos = (q.right - q.left) / 2); // a level's own map: the last pack waits in the arena
    // a ledge too short for the whole pack hands the rest on to the next pack
    const fit = Math.min(n, 1 + Math.floor((q.right - q.left) / 20));
    if (fit < n && k + 1 < packs.length) packs[k + 1] += n - fit;
    n = fit;
    const gap = Math.min(GAP, (q.right - q.left) / Math.max(1, n - 1)), half = (n - 1) * gap / 2;
    const mid = Math.max(q.left + half, Math.min(q.right - half, q.left + pos));
    for (let j = 0; j < n; j++) {
      let sx = Math.round(mid - half + j * gap);
      // slide off any wall or doorframe standing on the surface
      for (let d = 8, x0 = sx; blocked(sx, q.p.y) && d < q.right - q.left; d += 8)
        sx = [x0 + d, x0 - d].find(v => v >= q.left && v <= q.right && !blocked(v, q.p.y)) ?? sx;
      const roof = roofAbove(sx, q.p.y), i = spawns.length;
      spawns.push({
        x: sx, y: q.p.y, airY: Math.max(roof + 18, q.p.y - 52), section: Math.floor(sx / W), room: q.p.room, pack: k,
        wave: Math.min(4, 1 + Math.floor(q.p.room * 4 / m.rooms.length)), elite: zone > 0 && i > 0 && i % (lay.elite || 9) === 0
      });
    }
  }
  return {
    name: ZONES[zone].name, style: lay.style, title: lay.title, dark: lay.dark || 0, width, height, floorY, rooms: m.rooms,
    sections: Math.ceil(width / W), platforms: m.platforms, solids: m.solids, ladders: m.ladders, spawns,
    startX: m.start.x, startY: m.start.y, exitX: width - 36, exitY: m.arena,
    bossFloor: m.arena, bossLeft: width - W + 8, bossRight: width - 8, pits: m.pits, gadgets: m.gadgets || []
  };
}

// ---------------------------------------------------------------- hidden portals (MapleStory)
// Every map hides one portal you can't see: a spot on a wide surface, well away from the start, the
// arena, ladders and the spots in `avoid`. Stand on it and press UP to step into the secret room.
// The pick is seeded by the map, so a portal is always in the same place.
export function hiddenSpot(map, avoid = []) {
  const clear = (x, y) => avoid.every(a => Math.abs(a.x - x) > 40 || Math.abs(a.y - y) > 30) && map.ladders.every(l => Math.abs(l.x - x) > 36 || y < l.top - 4 || y > l.bottom + 4);
  const spots = [];
  for (const p of map.platforms) {
    if (p.w < 56 || p.ceiling) continue;
    for (const x of [p.x + 20, p.x + p.w - 20]) if (x > map.startX + 320 && x < map.bossLeft - 100 && clear(x, p.y)) spots.push({ x: Math.round(x), y: p.y });
  }
  if (!spots.length) return null;
  spots.sort((a, b) => a.x - b.x || a.y - b.y);
  const seed = Math.round(map.width * 7 + map.height * 13 + spots.length * 31);
  return spots[Math.floor(spots.length * 0.35 + (seed % 7) / 7 * spots.length * 0.5) % spots.length];
}
// The secret room behind it: one screen with a floor, a ledge up a ladder and a return portal where
// you arrive. `kind` decides what waits there (game/hidden.js fills it in): a vault of chests, a
// golden pack of residents, or a shrine with a weapon on it.
export const ROOM_KINDS = ['vault', 'golden', 'shrine'];
export function secretRoom(zone, kind) {
  const floor = GROUND, width = W;
  const platforms = [], solids = [];
  const base = { x: 0, y: floor, w: width, h: 64, solid: true, ground: true, room: 0 };
  platforms.push(base); solids.push(base);
  const ledge = { x: 270, y: floor - 76, w: 150, room: 0, hunt: true };
  platforms.push(ledge);
  solids.push({ x: 0, y: 0, w: width, h: 24, solid: true, ceiling: true });
  const ladders = [{ x: 290, top: ledge.y, bottom: floor, exitX: 290 - HERO.w / 2, exitY: ledge.y, section: 0 }];
  return {
    name: ZONES[zone].name, style: 'room', title: 'SECRET ROOM', own: true, secretRoom: true, kind, dark: 2,
    width, height: floor + 64, floorY: floor, rooms: [{ index: 0, label: kind === 'vault' ? 'VAULT' : kind === 'golden' ? 'GOLDEN DEN' : 'SHRINE', x: 0, end: width, w: width, y0: 0, y1: Infinity, floor }],
    sections: 1, platforms, solids, ladders, spawns: [], ledge,
    startX: 40, startY: floor, exitX: -999, exitY: floor, bossFloor: floor, bossLeft: width * 9, bossRight: width * 9
  };
}
