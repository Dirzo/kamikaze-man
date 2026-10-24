// Cracked rock at the foot of a cliff (data/maps.js): it stops the mouth of a tunnel through the
// cliff, the quick low road under the climb over the top. Every swing or shot that lands knocks a
// chunk off (a big swing knocks two), and running into it at a full sprint or mid-dash bursts
// straight through without losing a step. Broken, it spills a few shards and leaves rubble.
import { C } from '../config.js';
import { rect, text } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { overlap, cx } from './physics.js';
import { burst, shake, callout } from './fx.js';
import { dropShards } from './combat.js';

export const WALLS = { shards: zone => 3 + zone * 2, flash: 0.12, burst: 160 }; // burst: speed you keep through it
const live = () => (world.map?.walls || []).filter(w => !w.broken);

function hitWall(w, n = 1) {
  w.hp -= n;
  w.flashT = WALLS.flash;
  w.jolt = 2;
  sfx.clang();
  burst(w.x + w.w / 2, w.y + 8 + Math.random() * (w.h - 16), 4, 'chip', ['mist', 'fog']);
  if (w.hp <= 0) smash(w);
}
function smash(w) {
  w.broken = true;
  const i = world.map.solids.indexOf(w);
  if (i >= 0) world.map.solids.splice(i, 1);
  sfx.boom?.();
  shake(0.3);
  burst(w.x + w.w / 2, w.y + w.h / 2, 16, 'chip', ['mist', 'fog', 'stone']);
  burst(w.x + w.w / 2, w.y + w.h - 4, 8, 'dust', ['mist', 'fog']);
  const n = WALLS.shards(world.zone || 0);
  dropShards(w.x + w.w / 2, w.y + w.h - 12, Math.min(6, n), n);
  if (world.run) world.run.walls = (world.run.walls || 0) + 1;
}

// a melee swing's active hitbox (hero.js): each wall takes one knock a swing
export function swingWalls(box, a) {
  for (const w of live()) {
    if (a.hit.has(w) || !overlap(box, w)) continue;
    a.hit.add(w);
    hitWall(w, a.move?.big ? 2 : 1);
  }
}
// a shot that hit terrain (shots.js)
export function shotWall(w) {
  if (w.wall && !w.broken) hitWall(w);
}
// after the hero moves: ran into a wall at a full sprint or mid-dash? Straight through it.
export function bumpWalls(h, vx) {
  if (!h.hitWall || !(h.sprint || h.dashT > 0)) return;
  const probe = { x: h.x + h.hitWall * 2, y: h.y, w: h.w, h: h.h };
  const w = live().find(w => overlap(probe, w));
  if (!w) return;
  smash(w);
  h.hitWall = 0;
  h.vx = Math.sign(vx || h.face) * Math.max(Math.abs(vx), WALLS.burst);
  callout('SMASH!', 0, 0, C.gold, { follow: h, life: 30 });
}

// cracked stone that cracks more as it takes hits, then a heap of rubble
export function drawWalls(t) {
  const x0 = world.cameraX - 40, x1 = world.cameraX + 520;
  for (const w of world.map?.walls || []) {
    if (w.x + w.w < x0 || w.x > x1) continue;
    if (w.broken) {
      // rubble at its foot
      const b = w.y + w.h;
      rect(w.x - 4, b - 4, w.w + 8, 4, C.ink);
      rect(w.x - 3, b - 3, w.w + 6, 3, C.stone);
      rect(w.x + 1, b - 6, 6, 3, C.fog);
      rect(w.x + 9, b - 5, 5, 2, C.slate);
      continue;
    }
    w.flashT = Math.max(0, (w.flashT || 0) - 1 / 60);
    w.jolt = Math.max(0, (w.jolt || 0) - 0.25);
    const x = w.x + (w.jolt ? (Math.floor(t * 50) % 2 ? 1 : -1) : 0), lit = w.flashT > 0;
    rect(x - 1, w.y - 1, w.w + 2, w.h + 1, C.ink);
    // courses of stone blocks, offset every other row
    for (let r = 0, y = w.y; y < w.y + w.h; r++, y += 8) {
      rect(x, y, w.w, 8, lit ? C.mist : C.stone);
      rect(x, y, w.w, 1, lit ? C.paper : C.fog);
      rect(x, y + 7, w.w, 1, C.slate);
      rect(x + (r % 2 ? 4 : 11), y + 1, 1, 6, C.slate);
    }
    // the cracks spread as it takes hits
    const dmg = w.max - w.hp;
    const crack = (cx0, f, len) => { for (let k = 0; k < len && f * w.h + k * 3 < w.h - 2; k++) rect(x + cx0 + (k % 3 === 1 ? 1 : 0) - Math.floor(k / 3), w.y + Math.round(f * w.h) + k * 3, 1, 3, C.ink); };
    crack(9, 0.1, 5);
    if (dmg >= 1) crack(6, 0.4, 4), crack(12, 0.55, 4);
    if (dmg >= 2) crack(4, 0.2, 4), crack(11, 0.7, 3), rect(x + 2, w.y + Math.round(w.h * 0.45), 4, 3, C.ink);
    if (w.intro && Math.floor(t * 3) % 2) text('SMASH IT!', cx({ x: w.x, w: w.w }), w.y - 14, C.gold, { align: 'center' });
  }
}
