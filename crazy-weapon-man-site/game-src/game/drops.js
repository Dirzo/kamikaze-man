// Weapon drops on the ground (walk over to compare; better ones auto-equip, others swap with DOWN),
// and pickups (shards fly to you, hearts heal).
import { C, GROUND } from '../config.js';
import { X, rect, text, textWidth, fitText } from '../engine/gfx.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { move, overlap, cx, cy, worldFloor } from './physics.js';
import { dps, powerScore } from './loot.js';
import { lookOf, overlays, runEmitters, frameOfLook, rarityColour } from './looks.js';
import { MUTATIONS } from '../data/progression.js';
import { toast } from './progress.js';
import { burst, emit } from './fx.js';
import { dropWeapon } from './combat.js';

export function equip(item) {
  const h = world.hero,
    old = h.weapon;
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

export function updateDrops(dt) {
  const h = world.hero;
  world.nearDrop = null;
  for (let i = world.drops.length - 1; i >= 0; i--) {
    const d = world.drops[i];
    d.t += dt;
    d.life -= dt;
    d.vx *= Math.pow(0.1, dt);
    move(d, dt, world.platforms, { gravity: 600 });
    if (d.life <= 0) {
      world.drops.splice(i, 1);
      continue;
    }
    if (d.t > 0.4 && !h.dead && overlap({ x: h.x - 4, y: h.y, w: h.w + 8, h: h.h }, d)) {
      const better = powerScore(d.item) > powerScore(h.weapon) * 1.001;
      if (better && !d.declined && !h.attack && !h.special && h.dashT <= 0) {
        const old = equip(d.item);
        world.drops.splice(i, 1);
        dropOld(old, d);
        continue;
      }
      world.nearDrop = d;
    } else if (d.declined && !overlap({ x: h.x - 8, y: h.y, w: h.w + 16, h: h.h }, d)) d.declined = false;
  }
  if (world.nearDrop && !h.attack && !h.special && h.dashT <= 0 && input.take('down', 0.15)) {
    const d = world.nearDrop;
    world.drops.splice(world.drops.indexOf(d), 1);
    const old = equip(d.item);
    dropOld(old, d);
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
        world.shards += p.value;
        sfx.pickup();
      } else {
        const heal = Math.round(h.maxHp * 0.15);
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
function dropOld(old, d) {
  if (old.name === 'Training Sword') return;
  dropWeapon(cx(d), d.y, old);
  const n = world.drops[world.drops.length - 1];
  n.declined = true;
  n.life = 20;
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
    if (d.life < 4 && Math.floor(t * 10) % 2) continue;
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

// compare card over the drop you're standing on
export function drawNearDrop(t) {
  const d = world.nearDrop;
  if (!d) return;
  const h = world.hero;
  const item = d.item,
    gain = Math.round((powerScore(item) / Math.max(1, powerScore(h.weapon)) - 1) * 100);
  const name = fitText(item.name, 200);
  const line2 = `${gain >= 0 ? '+' : ''}${gain}% POWER   DOWN: SWAP`;
  const w = Math.max(textWidth(name), textWidth(line2)) + 10;
  const x = Math.round(Math.max((world.cameraX || 0) + 4, Math.min((world.cameraX || 0) + 476 - w, cx(d) - w / 2))),
    y = Math.round(d.y - 34);
  rect(x - 1, y - 1, w + 2, 24, C.ink);
  rect(x, y, w, 22, item.standout ? C.gold : rarityColour(item.q));
  rect(x + 1, y + 1, w - 2, 20, C.night);
  text(name, x + w / 2, y + 3, item.standout ? C.gold : rarityColour(item.q), { align: 'center' });
  text(line2, x + w / 2, y + 12, gain >= 0 ? C.lime : C.coral, { align: 'center' });
}
