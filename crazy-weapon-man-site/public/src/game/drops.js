// Weapon drops (looted automatically into the bag; DOWN equips a just-looted upgrade),
// and pickups (shards fly to you, hearts heal).
import { C } from '../config.js';
import { stats, allowedType } from '../data/meta.js';
import { temper } from '../data/temper.js';
import { X, rect } from '../engine/gfx.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { move, cx, cy, worldFloor } from './physics.js';
import { dps, powerScore } from './loot.js';
import { lookOf, overlays, runEmitters, frameOfLook, rarityColour } from './looks.js';
import { MUTATIONS } from '../data/progression.js';
import { toast } from './progress.js';
import { burst, emit } from './fx.js';
import { autoLoot, equipFromBag } from './inventory.js';

export function equip(item) {
  const h = world.hero,
    old = h.weapon;
  if (!allowedType(item.type)) return null; // specialized: another class can't be wielded
  item.used = true;
  const gain = Math.round((powerScore(item) / Math.max(1, powerScore(old)) - 1) * 100);
  h.weapon = item;
  h.combo = 0;
  h.attackCount = 0;
  h.orbitTick = 0;
  h.attack = null;
  toast('weapon', { name: item.name, col: rarityColour(item.q), gain, standout: item.standout });
  if (item.mutation && !world.seenMutations.has(item.mutation)) {
    world.seenMutations.add(item.mutation);
    toast('power', { ...MUTATIONS[item.mutation] });
  }
  sfx.pickup();
  burst(cx(h), h.y + 6, 10, 'twinkle', [lookOf(item).light, 'paper']);
  if (!world.best || dps(item) > dps(world.best)) world.best = item;
  return old;
}

// Weapon drops pop out, hover where they landed (no physics, so nothing slips through a floor or
// off a ledge) and then fly to you and are looted into the bag.
const POP = 0.35, HOME = 0.7;
export function updateDrops(dt) {
  const h = world.hero;
  world.nearDrop = null;
  for (let i = world.drops.length - 1; i >= 0; i--) {
    const d = world.drops[i];
    d.t += dt;
    if (d.t < POP) {
      d.x += d.vx * dt;
      d.vy += 600 * dt;
      d.y += d.vy * dt;
      continue;
    }
    if (d.hy == null) d.hy = d.y;
    if (h.dead || d.t < HOME) {
      d.y += (d.hy - d.y) * Math.min(1, dt * 10);
      continue;
    }
    // fly to the hero, faster the longer it has been flying
    const dx = cx(h) - cx(d),
      dy = cy(h) - cy(d),
      dist = Math.hypot(dx, dy),
      sp = 120 + (d.t - HOME) * 520;
    if (dist < 12) {
      world.drops.splice(i, 1);
      autoLoot(d.item);
      sfx.pickup();
      burst(cx(h), h.y + 6, 6, 'twinkle', [lookOf(d.item).light, 'paper']);
      continue;
    }
    d.x += (dx / dist) * Math.min(dist, sp * dt);
    d.y += (dy / dist) * Math.min(dist, sp * dt);
    if (Math.random() < dt * 30) emit(cx(d), cy(d), 'twinkle', rarityColour(d.item.q));
  }
  if (world.quick) {
    world.quick.t -= dt;
    const i = world.bag.indexOf(world.quick.item);
    if (world.quick.t <= 0 || i < 0) world.quick = null;
    else if (!h.dead && !h.attack && !h.special && h.dashT <= 0 && input.take('down', 0.15)) equipFromBag(i);
  }
  // pickups
  for (let i = world.pickups.length - 1; i >= 0; i--) {
    const p = world.pickups[i];
    p.life -= dt;
    p.w = p.h = p.kind === 'heart' ? 7 : 4;
    const dist = Math.hypot(cx(h) - (p.x + 2), cy(h) - (p.y + 2));
    if (p.kind === 'shard' && dist < 70 && p.life < 19.6) {
      // magnet
      p.vx += ((cx(h) - p.x) / Math.max(1, dist)) * 900 * dt;
      p.vy += ((cy(h) - p.y) / Math.max(1, dist)) * 900 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    } else {
      p.vx *= Math.pow(0.2, dt);
      move(p, dt, world.platforms, { gravity: 600 });
    }
    if (dist < 10 && !h.dead) {
      if (p.kind === 'shard') {
        // SHARD MAGNET / STICKY FINGERS: the fractions add up across pickups
        world.shardAcc = (world.shardAcc || 0) + p.value * (1 + stats().shards) * temper(world.temper).shards; // (TEMPER pays more)
        const n = Math.floor(world.shardAcc);
        world.shardAcc -= n;
        world.shards += n;
        sfx.pickup();
      } else {
        const heal = Math.round(h.maxHp * 0.15 * (1 + stats().heal));
        h.hp = Math.min(h.maxHp, h.hp + heal);
        sfx.ui(true);
        burst(cx(h), h.y + 4, 6, 'twinkle', ['red', 'paper']);
      }
      world.pickups.splice(i, 1);
      continue;
    }
    if (p.life <= 0 || p.y > worldFloor() + 20) world.pickups.splice(i, 1);
  }
}
// draw a weapon item lying on the ground (also used by the mimic's disguise)
export function drawItem(item, x, y, t) {
  const L = lookOf(item, frameOfLook(item.look, t));
  const bob = Math.round(Math.sin(t * 4 + x * 0.05) * 1.5);
  const x0 = Math.round(x - L.w / 2),
    y0 = Math.round(y - L.h + 3) + bob;
  if (item.q >= 2 || item.standout) {
    // short light pillar
    const col = item.standout ? C.gold : rarityColour(item.q);
    for (let i = 0; i < 8 + item.q * 2; i += 2) rect(Math.round(x) - 1, y0 - i - 2, 2, 1, col);
  }
  X.drawImage(L.cv, x0, y0);
  overlays(L, item.look, t, 1, (sx, sy) => [x0 + sx, y0 + sy]);
  runEmitters(L.emitters, () => {
    const m = L.marks[Math.floor(Math.random() * L.marks.length)];
    return m ? { x: x0 + m[0] + 0.5, y: y0 + m[1] + 0.5 } : null;
  }, 0.5);
}

export function drawDrops(t) {
  for (const d of world.drops) {
    drawItem(d.item, cx(d), d.y + d.h, t);
  }
  for (const p of world.pickups) {
    const x = Math.round(p.x),
      y = Math.round(p.y);
    if (p.life < 3 && Math.floor(t * 10) % 2) continue;
    if (p.kind === 'shard') {
      rect(x - 1, y - 1, 6, 6, C.ink);
      rect(x, y + 1, 4, 2, C.sky);
      rect(x + 1, y, 2, 4, C.ice);
      X.fillStyle = C.paper;
      X.fillRect(x + 1, y + 1, 1, 1);
    } else {
      rect(x - 1, y, 9, 6, C.ink);
      rect(x, y - 1, 3, 2, C.ink);
      rect(x + 4, y - 1, 3, 2, C.ink);
      rect(x, y, 3, 3, C.red);
      rect(x + 4, y, 3, 3, C.red);
      rect(x + 1, y + 3, 5, 2, C.red);
      rect(x + 3, y + 5, 1, 1, C.red);
      X.fillStyle = C.paper;
      X.fillRect(x + 1, y + 1, 1, 1);
    }
  }
}
