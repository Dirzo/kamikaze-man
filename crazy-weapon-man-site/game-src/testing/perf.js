// The playtest's ?perf probe: what one level costs to run and draw, and where the run slows down.
//   cost   ms per update step and per drawn frame, how much is in flight (enemies, bolts, shots,
//          specials, particles), JS heap in and out
//   pace   the hero's frontier (the furthest right it has been): every pause of 1.5 s or more in it
//          is a stall, blamed on what stands there (a fight pad, a cracked wall, a pit, a nook,
//          a gadget, enemies on the route); each fight pad's time, hits, specials and best combo;
//          how fast the speed stretches between pads really run
import { world } from '../game/world.js';
import { STEP } from '../config.js';
import { fxCounts } from '../game/fx.js';
import { cx } from '../game/physics.js';

const STALL = 1.5;
const q = (a, f) => (a.length ? a[Math.min(a.length - 1, Math.floor(a.length * f))] : 0);

export function perfProbe() {
  const m = world.map, h = world.hero;
  const pads = m.platforms.filter(p => p.fight).map(p => ({ x: p.x, w: p.w, in: null, out: null, hits: 0, specials: 0, kills: 0, best: 0, hp: 0 }));
  const feats = [
    ...pads.map(p => ({ k: 'fight pad', x: p.x - 24, r: p.x + p.w })),
    ...(m.walls || []).map(w => ({ k: 'cracked wall', x: w.x - 40, r: w.x + w.w + 8, w })),
    ...(m.pits || []).map(p => ({ k: p.w > 56 ? 'chasm' : 'pit', x: p.x - 40, r: p.x + p.w + 24 })),
    ...(m.gadgets || []).map(g => ({ k: 'gadget ' + g.kind, x: (g.x ?? 0) - 32, r: (g.x ?? 0) + (g.w || 16) + 32 })),
    ...m.platforms.filter(p => p.nook).map(p => ({ k: 'nook', x: p.x - 16, r: p.x + p.w + 16 })),
    ...m.platforms.filter(p => p.cliff).map(p => ({ k: 'cliff top', x: p.x - 16, r: p.x + p.w })),
    { k: 'arena', x: m.bossLeft - 16, r: m.width }
  ];
  const P = {
    upd: [], drw: [], peak: { enemies: 0, bolts: 0, shots: 0, spx: 0, parts: 0, numbers: 0, pickups: 0, drops: 0 },
    heap0: performance.memory?.usedJSHeapSize || 0, t: 0, front: cx(h), frontT: 0, stalls: [], pads,
    run: { t: 0, d: 0, sprint: 0, n: 0 }, wallHits: 0, wallT: 0, specials: 0, lastSpecial: false, kills0: world.kills, arenaT: null, steps: 0, spikes: [], lastHeap: 0, frontFoes: []
  };
  // a hitch: what was going on in that step (a special, a new kind of enemy on screen, a crowd)
  const seen = new Set(world.enemies.map(e => e.type));
  const spike = (k, ms) => {
    const h = world.hero, fresh = world.enemies.filter(e => !seen.has(e.type)).map(e => e.type);
    for (const e of world.enemies) seen.add(e.type);
    if (P.spikes.length < 40) P.spikes.push({ k, ms: Math.round(ms), t: +P.t.toFixed(1), phase: world.director?.phase, special: h.special?.kind || null,
      spx: [...new Set(world.spx.map(x => x.k))], enemies: world.enemies.length, fresh: [...new Set(fresh)], gc: (performance.memory?.usedJSHeapSize || 0) < P.lastHeap - 2e6 });
  };
  const at = x => feats.filter(f => x >= f.x && x <= f.r).map(f => f.k);
  const padAt = x => pads.find(p => x >= p.x - 24 && x <= p.x + p.w);
  const enemiesNear = x => world.enemies.filter(e => !e.dead && !e.boss && Math.abs(cx(e) - x) < 200).map(e => e.type + (e.air ? '^' : ''));
  return {
    update(fn) {
      const t0 = performance.now(); fn(); const ms = performance.now() - t0;
      P.upd.push(ms);
      if (ms > 25) spike('update', ms);
    },
    draw(fn) {
      const t0 = performance.now(); fn(); const ms = performance.now() - t0;
      P.drw.push(ms);
      if (ms > 40) spike('draw', ms);
    },
    sample() {
      const h = world.hero, x = cx(h), D = world.director;
      P.t += STEP; P.steps++;
      const pk = P.peak, f = fxCounts();
      pk.enemies = Math.max(pk.enemies, world.enemies.length); pk.bolts = Math.max(pk.bolts, world.bolts.length);
      pk.shots = Math.max(pk.shots, world.shots.length); pk.spx = Math.max(pk.spx, world.spx.length);
      pk.parts = Math.max(pk.parts, f.parts); pk.numbers = Math.max(pk.numbers, f.numbers);
      pk.pickups = Math.max(pk.pickups, world.pickups.length); pk.drops = Math.max(pk.drops, world.drops.length);
      if (P.steps % 30 === 0) P.lastHeap = performance.memory?.usedJSHeapSize || 0;
      const sp = !!h.special;
      if (sp && !P.lastSpecial) { P.specials++; const p = padAt(x); if (p && p.in != null && p.out == null) p.specials++; }
      P.lastSpecial = sp;
      if (h.hitWall && h.onGround) P.wallHits++;
      if ((m.walls || []).some(w => !w.broken && Math.abs(w.x + w.w / 2 - x) < 48)) P.wallT += STEP;
      if (D?.phase === 'survive' || D?.phase === 'exit') { if (P.arenaT == null) P.arenaT = P.t; return; }
      // the frontier
      if (x > P.front + 8) {
        const gap = P.t - P.frontT;
        if (gap >= STALL) P.stalls.push({ x: Math.round(P.front), t: +gap.toFixed(1), at: at(P.front), foes: P.frontFoes.length, types: P.frontFoes });
        P.front = x; P.frontT = P.t; P.frontFoes = enemiesNear(x);
      }
      // pads: entered when the frontier reaches them, left when it passes their far end
      for (const p of pads) {
        if (p.in == null && P.front >= p.x - 24) { p.in = P.t; p.k0 = world.kills; p.hp = world.enemies.filter(e => !e.dead && !e.boss && cx(e) >= p.x - 24 && cx(e) <= p.x + p.w + 24).length; }
        if (p.in != null && p.out == null) {
          p.best = Math.max(p.best, world.fight?.n || 0);
          if (P.front > p.x + p.w + 8) { p.out = P.t; p.kills = world.kills - p.k0; }
        }
      }
      // the speed stretches: off any pad, not at the arena, moving forward on the ground
      if (!padAt(x) && x < m.bossLeft && h.onGround && x >= P.front - 8) {
        P.run.t += STEP; P.run.d += Math.abs(h.vx) * STEP; P.run.n++;
        if (h.sprint) P.run.sprint += STEP;
      }
    },
    finish(report) {
      const u = P.upd.sort((a, b) => a - b), d = P.drw.sort((a, b) => a - b);
      const heap1 = performance.memory?.usedJSHeapSize || 0;
      for (const p of pads) if (p.in != null && p.out == null) { p.out = P.arenaT ?? P.t; p.kills = world.kills - p.k0; }
      report.perf = {
        upd: [q(u, 0.5), q(u, 0.95), q(u, 0.99), u.at(-1) || 0].map(v => +v.toFixed(2)),
        drw: [q(d, 0.5), q(d, 0.95), q(d, 0.99), d.at(-1) || 0].map(v => +v.toFixed(2)),
        slowFrames: d.filter((v, i) => v + (u[i] || 0) > 16.7).length / Math.max(1, d.length),
        peak: P.peak, spikes: P.spikes, heapMB: [+(P.heap0 / 1e6).toFixed(1), +(heap1 / 1e6).toFixed(1)]
      };
      report.pace = {
        width: m.width, toArena: +(P.arenaT ?? P.t).toFixed(1), stalls: P.stalls, wallHits: P.wallHits, wallT: +P.wallT.toFixed(1), specials: P.specials,
        pads: pads.map(p => ({ w: p.w, t: p.in == null ? null : +((p.out ?? P.t) - p.in).toFixed(1), foes: p.hp, kills: p.kills, best: p.best, specials: p.specials })),
        run: { t: +P.run.t.toFixed(1), v: P.run.t ? Math.round(P.run.d / P.run.t) : 0, sprint: P.run.t ? +(P.run.sprint / P.run.t).toFixed(2) : 0 },
        layout: { pads: pads.length, walls: (m.walls || []).length, pits: (m.pits || []).length, gadgets: (m.gadgets || []).map(g => g.kind), nooks: m.platforms.filter(p => p.nook === 2).length, sets: m.sets }
      };
    }
  };
}
