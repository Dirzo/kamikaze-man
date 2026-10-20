// Map layouts. Map 1 (and the other ant-tunnel zones) keep the offset descending chambers of
// Ant Tunnel; the rest are MapleStory-style fields: wide ground, long one-way platforms stacked
// in tiers and ladders hanging from each platform. Each field zone tunes the recipe (hills or
// flat ground, open sky or a cave roof, how many tiers, a climb to a peak) so they feel different.
// Biome art and names still belong to ZONES. Layouts are seeded per zone, so a route is the same
// every run and speedrun splits stay comparable.
//
// Movement budget (HERO: jump 262, gravity 760, speed 112): a jump rises 45px and carries 77px.
// Platforms further apart than that are joined by ladders. The finale is always the rightmost
// screen, flat at bossFloor.
import { W, GROUND, HERO } from '../config.js';
import { ZONES } from './zones.js';

export const LAYOUTS = [
  { style: 'chambers', title: 'ANT TUNNEL', label: 'CHAMBER' },
  { style: 'field', title: 'MUSHROOM MEADOW', label: 'MEADOW', screens: 8, tiers: 3, hills: true },
  { style: 'field', title: 'LAVA CAVERN', label: 'CAVERN', screens: 8, tiers: 2, descend: true, cave: true, plat: [22, 44] },
  { style: 'field', title: 'GRAND BANQUET', label: 'TABLE', screens: 8, tiers: 3, cave: true, plat: [36, 64], gaps: [14, 28] },
  { style: 'field', title: 'BELL TOWER', label: 'LANDING', screens: 3, tiers: 7, peak: true, plat: [16, 30], gaps: [10, 20] },
  { style: 'field', title: 'MOUNTAIN PASS', label: 'LEDGE', screens: 6, tiers: 5, hills: true, peak: true },
  { style: 'field', title: 'FORGE CATWALKS', label: 'CATWALK', screens: 9, tiers: 3, plat: [14, 26], gaps: [10, 18] },
  { style: 'chambers', title: 'ROOT TUNNELS', label: 'BURROW' },
  { style: 'field', title: 'CASTLE RAMPARTS', label: 'RAMPART', screens: 9, tiers: 4, cave: true },
  { style: 'chambers', title: 'VAULT TUNNELS', label: 'VAULT' }
];

export function makeMap(zone) {
  const lay = LAYOUTS[zone], m = builder(zone);
  if (lay.style === 'chambers') return chambers(zone, lay);
  field(m, lay);
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
// A ladder hangs from the platform above it: climbing to the top stands you on that platform,
// right where the ladder is (exitX is the hero's left edge there), and stops you.
function ladder(m, x, bottom, exitY) {
  m.ladders.push({ x, top: exitY, bottom, exitX: x - HERO.w / 2, exitY, section: Math.floor(x / W) });
}
function room(m, label, x, end, y0, y1, floor) {
  m.room = m.rooms.length;
  m.rooms.push({ index: m.room, label, x, end, w: end - x, y0, y1, floor });
  return m.room;
}


// ---------------------------------------------------------------- Ant Tunnel chambers
// The original layout, unchanged except that each ladder up a cliff now has a small landing at the
// top, so the climb ends standing on it.
function chambers(zone, lay) {
  const sections=8+Math.floor(zone/2),width=sections*W,countRooms=4+Math.floor(zone/3);
  const weights=[1,.76,1.2,.86,1.12,.82,1.04].slice(0,countRooms);
  const total=weights.reduce((a,b)=>a+b,0),rooms=[];
  let x=0,y=GROUND;
  for(let i=0;i<countRooms;i++) {
    const end=i===countRooms-1?width:Math.round((x+width*weights[i]/total)/8)*8;
    rooms.push({x,end,w:end-x,floor:y,index:i,label:lay.label,y0:0,y1:Infinity});x=end;
    y+=[168,210,150,224,178,202][(i+zone)%6];
  }
  const floorY=rooms.at(-1).floor,platforms=[],solids=[],ladders=[];
  const hasBoss=!!ZONES[zone].boss;
  const ladder=(x,bottom,p)=>ladders.push({x,top:p.y,bottom,exitX:x-HERO.w/2,exitY:p.y,section:Math.floor(x/W)});
  for(const room of rooms) {
    const {x,w,floor,index}=room, bossRoom=hasBoss && index===rooms.length-1;
    const base={x,y:floor,w,h:floorY-floor+64,solid:true,room:index,ground:true};
    platforms.push(base);solids.push(base);
    // Massive overhangs shape each neck and chamber; no repeated horizontal storeys.
    if(index>0) {
      const roof={x:x+148,y:0,w:w-148,h:floor-(bossRoom?218:172+index%2*24),ceiling:true,solid:true};
      solids.push(roof);
      const prev=platforms.find(p=>p.ground && p.room===index-1);
      const landing={x,y:prev.y,w:56,room:index-1,landing:true};
      platforms.push(landing);
      ladder(x+36,floor,landing);
      // Small resting shelves break up the vertical passage beside the return rope.
      const drop=floor-prev.y;
      for(let step=1;step<Math.ceil(drop/76);step++)platforms.push({x:x+54+(step%2)*16,y:prev.y+step*68,w:64,room:index,connector:true});
    }
    const usable=bossRoom?w-W-40:w;
    if(usable>370) {
      const shelfX=x+Math.round(usable*.28),shelfW=Math.min(360,Math.round(usable*.44));
      const shelf={x:shelfX,y:floor-76,w:shelfW,room:index,hunt:true};
      platforms.push(shelf);
      platforms.push({x:shelfX-90,y:floor-38,w:104,room:index,connector:true});
      platforms.push({x:shelfX+shelfW-12,y:floor-38,w:112,room:index,connector:true});
      ladder(shelfX+shelfW-26,floor,shelf);
      // An offset alcove is a branch off the chamber, not another full-width lane.
      if(index%2===0 && usable>650) {
        const alcove={x:x+usable-190,y:floor-112,w:146,room:index,hunt:true};
        platforms.push(alcove);ladder(alcove.x+30,floor,alcove);
      }
    }
  }
  const count=28+zone*3,spawns=[];
  const hunt=platforms.filter(p=>p.ground||p.hunt);
  for(let i=0;i<count;i++) {
    const p=hunt[i%hunt.length],slot=Math.floor(i/hunt.length);
    const left=p.ground?p.x+Math.min(190,p.w*.24):p.x+24;
    const span=Math.max(1,p.x+p.w-28-left);
    const sx=left+((slot*137+i*53)%span);
    const roof=Math.max(0,...solids.filter(s=>s.ceiling && sx>=s.x && sx<s.x+s.w).map(s=>s.y+s.h));
    spawns.push({x:sx,y:p.y,airY:Math.max(roof+18,p.y-65),section:Math.floor(sx/W),room:p.room,wave:Math.min(4,1+Math.floor(p.room*4/countRooms)),elite:zone>0&&i>0&&i%9===0});
  }
  return {name:ZONES[zone].name,style:lay.style,title:lay.title,width,height:floorY+64,floorY,rooms,sections,platforms,solids,ladders,spawns,
    startX:48,startY:GROUND,exitX:width-36,exitY:floorY,bossFloor:floorY,bossLeft:width-W+8,bossRight:width-8};
}

// ---------------------------------------------------------------- MapleStory-style fields
// Ground runs the whole map; above it, long one-way platforms sit in tiers with generous gaps.
// Every platform has a ladder (two on long ones) down to whatever is right beneath it, so you
// can always climb back up. With peak: the last screen is a cliff whose top is the boss arena,
// reached from the highest tier.
function field(m, lay) {
  const width = lay.screens * W, T = lay.tiers, sp = 84, end = width - W;
  const [pw0, pw1] = lay.plat || [28, 56], [gp0, gp1] = lay.gaps || [12, 34];
  const base = 150 + T * sp;
  m.width = width;
  // ground: gentle hills, a staircase down, or flat; always long enough to walk comfortably
  const grounds = [];
  let x = 0, y = base;
  room(m, lay.label, 0, width, 0, Infinity, base);
  while (x < (lay.peak ? end : width - W)) {
    let w = m.int(20, 40) * 8;
    if ((lay.peak ? end : width - W) - x - w < 160) w = (lay.peak ? end : width - W) - x;
    if (x) {
      if (lay.hills) y = Math.max(base - 32, Math.min(base + 32, y + m.pick([-24, -16, 0, 16, 24])));
      if (lay.descend) y += m.pick([16, 24]);
    }
    grounds.push(ground(m, x, y, w));
    x += w;
  }
  const tierY = k => base - 32 - k * sp;
  let arenaY;
  if (lay.peak) {
    arenaY = tierY(T);
    room(m, 'PEAK', end, width, 0, arenaY + 10, arenaY);
    ground(m, end, arenaY, W);
  } else {
    arenaY = y;
    room(m, 'CLEARING', end, width, 0, Infinity, arenaY);
    ground(m, end, arenaY, W);
  }
  m.room = 0;
  const groundAt = x => grounds.find(g => x >= g.x && x < g.x + g.w);
  // tiers, staggered so the platforms above overlap the gaps below
  const tiers = [];
  for (let k = 1; k <= T; k++) {
    const row = [], ty = tierY(k);
    let px = 96 + m.int(0, 24) * 8 + (k % 2) * 120;
    const stop = lay.peak && k === T ? end : end - 40;
    while (px < stop - 160) {
      let w = m.int(pw0, pw1) * 8;
      if (stop - (px + w) < 160 || (lay.peak && k === T && stop - (px + w) < 360)) w = lay.peak && k === T ? stop - px : Math.min(w, stop - px);
      row.push(ledge(m, px, ty, w));
      px += w + m.int(gp0, gp1) * 8;
    }
    tiers.push(row);
  }
  // ladders hang from each platform to the surface right below it
  const below = (x, y) => {
    let best = null;
    for (const row of tiers) for (const p of row) if (p.y > y && x >= p.x + 12 && x < p.x + p.w - 12 && (!best || p.y < best.y)) best = p;
    if (best) return best;
    const g = groundAt(x);
    return g && x >= g.x + 12 && x < g.x + g.w - 12 && g.y > y ? g : null;
  };
  for (const row of tiers) for (const p of row) {
    const spots = p.w >= 420 ? [p.x + 40 + m.int(0, 4) * 8, p.x + p.w - 48 - m.int(0, 4) * 8] : [p.x + snap(p.w / 2)];
    for (let lx of spots) {
      // slide the ladder until its foot lands on a floor well inside its edges
      let foot = below(lx, p.y);
      for (let d = 8; !foot && d < p.w / 2 - 16; d += 8) for (const v of [lx + d, lx - d]) if (!foot && v > p.x + 16 && v < p.x + p.w - 16 && below(v, p.y)) { lx = v; foot = below(v, p.y); }
      if (foot) ladder(m, lx, foot.y, p.y);
    }
  }
  // a cave roof hangs over everything but the start
  if (lay.cave) {
    const top = tierY(T) - 76;
    for (let rx = 240; rx < width; ) {
      const w = Math.min(width - rx, m.int(16, 30) * 8);
      rock(m, rx, 0, w, Math.max(16, top - m.pick([0, 16, 32, 48])));
      rx += w;
    }
  }
  m.start = { x: 48, y: grounds[0].y };
  m.arena = arenaY;
}


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
