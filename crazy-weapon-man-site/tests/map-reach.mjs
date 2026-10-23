// Plays a map with the real collision code: from sampled spots on every surface the hero walks,
// jumps (with and without a late steer, with the faster fall of the real jump) and drops through ledges, and climbs every ladder. Returns
// which surfaces can reach which, so tests can prove nothing is stranded and nothing is one-way.
import { move } from '../game-src/game/physics.js';
import { world } from '../game-src/game/world.js';
import { HERO } from '../game-src/config.js';
import { MOVE } from '../game-src/data/feel.js';

const DT = 1 / 60;
export function surfaceGraph(map) {
  // ramps (maps.js slope) are surfaces too: you can stand, walk and jump on them
  const P = map.platforms, S = [...P, ...(map.slopes || [])], links = S.map(() => new Set());
  const top = (p, x) => (p.slope ? p.y0 + Math.max(0, Math.min(p.w, x + HERO.w / 2 - p.x)) * p.k : p.y);
  const at = (x, y) => P.findIndex(p => p.y === y && x >= p.x && x < p.x + p.w);
  const saved = world.map;
  try {
    for (const [i, p] of S.entries()) {
      // only collide with nearby terrain: the same rules, a fraction of the work
      // breakable walls (game/walls.js) are no barrier: you smash through them
      const near = map.solids.filter(s => !s.wall && s.x < p.x + p.w + 420 && s.x + s.w > p.x - 420 && s.y < p.y + 700 && s.y + s.h > p.y - 260);
      world.map = { ...map, solids: near };
      const xs = new Set(p.slope ? [p.x + 1, p.x + p.w / 2, p.x + p.w - 1].map(c => c - HERO.w / 2) : [p.x + 1, p.x + p.w - HERO.w - 1]);
      for (let x = p.x + 12; x < p.x + p.w - HERO.w; x += 24) xs.add(x);
      for (const x0 of xs) {
        const box = { x: x0, y: top(p, x0) - HERO.h, w: HERO.w, h: HERO.h };
        if (near.some(s => s !== p && box.x < s.x + s.w && box.x + box.w > s.x && box.y < s.y + s.h && box.y + box.h > s.y)) continue;
        for (const dir of [-1, 0, 1]) {
          const tries = [{ jump: false }, { jump: true, steer: 0 }, { jump: true, steer: 0.2 }];
          if (!p.solid && !p.slope) tries.push({ drop: true });
          for (const a of tries) {
            const b = { ...box, vx: a.steer ? 0 : dir * HERO.speed, vy: a.jump ? -HERO.jump : 0, onGround: !a.jump, platform: p };
            if (a.drop) b.y += 2;
            let airborne = a.jump || a.drop;
            for (let t = 0; t < 2.2; t += DT) {
              if (a.steer && t >= a.steer) b.vx = dir * HERO.speed;
              move(b, DT, P, { gravity: HERO.gravity * (b.vy > 0 ? MOVE.fallGravity : 1), maxFall: MOVE.maxFall, dropThrough: a.drop && t < 0.25 }); // the SMW arc: no apex hang, to be safe
              if (!b.onGround) { airborne = true; continue; }
              // the deepest floor doubles as the world floor, which reports no platform
              const j = b.platform ? S.indexOf(b.platform) : P.findIndex(q => q.y === b.y + b.h && b.x + b.w > q.x && b.x < q.x + q.w);
              if (j >= 0 && j !== i) links[i].add(j);
              if (airborne || b.hitWall || j !== i) break;
            }
          }
        }
      }
    }
  } finally { world.map = saved; }
  for (const l of map.ladders) {
    const lo = at(l.x, l.bottom), hi = at(l.exitX, l.exitY);
    if (lo < 0 || hi < 0) continue;
    links[lo].add(hi);
    const top = P[hi];
    if (Math.abs(Math.max(top.x + HERO.w / 2, Math.min(top.x + top.w - HERO.w / 2, l.x)) - l.x) < 19) links[hi].add(lo);
  }
  const reach = from => {
    const seen = new Set([from]), q = [from];
    while (q.length) for (const j of links[q.shift()]) if (!seen.has(j)) { seen.add(j); q.push(j); }
    return seen;
  };
  const start = at(map.startX + HERO.w / 2, map.startY), exit = at(map.exitX, map.exitY);
  const forward = reach(start);
  const back = new Set(P.map((_, i) => i).filter(i => reach(i).has(start)));
  return { links, start, exit, forward, back, at };
}
