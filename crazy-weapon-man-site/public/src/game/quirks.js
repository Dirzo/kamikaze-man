// Weapon quirks in play: one roll per primary hit (melee contact or projectile impact). Quirk hits
// are procs, so they never roll another quirk or mutation. Chances live in data/quirks.js.
import { C } from '../config.js';
import { world, newId } from './world.js';
import { QUIRKS, quirkChance, quirkPower } from '../data/quirks.js';
import { hitEnemy, dropShards } from './combat.js';
import { callout, emit, burst, spark, shake } from './fx.js';
import { sfx } from '../engine/audio.js';
import { say } from './bubbles.js';
import { cx, cy } from './physics.js';
import { lookOf } from './looks.js';

const BORROW = ['fire', 'ice', 'poison', 'water', 'lightning'];
const SAD = ['*sniff*', 'why...', 'ok :(', 'rude.', 'i had a family'];
const NEEDS_LIVE = new Set(['tetanus', 'glue', 'sad', 'bonk', 'wobble', 'poke', 'borrowed']);
const near = (e, rx, ry = 40) =>
  world.enemies.filter(n => n !== e && !n.dead && !(n.spawnT > 0) && Math.abs(cx(n) - cx(e)) < rx && Math.abs(cy(n) - cy(e)) < ry);
const say1 = (e, s, col) => callout(s, 0, 0, col, { follow: e, life: 34 });

export function quirkHit(h, e, dmg, dir) {
  const w = h.weapon,
    id = w.quirk,
    Q = QUIRKS[id];
  if (!Q || h.dead) return false;
  if (world.t < (h.quirkReadyAt || 0)) return false;
  if (NEEDS_LIVE.has(id) && (e.dead || e.hp <= 0)) return false;
  if (Math.random() >= quirkChance(w)) return false;
  h.quirkReadyAt = world.t + 0.18;
  world.quirkCount = (world.quirkCount || 0) + 1;
  dmg *= quirkPower(w);
  const col = C[Q.col] || C.paper,
    o = { dir, chain: true, knock: 6, sparkCol: col };
  switch (id) {
    case 'tetanus':
      e.rash = { t: 3, dmg: Math.max(1, dmg * 0.1), tick: 0.5 };
      say1(e, 'TETANUS!', col);
      break;
    case 'wobble':
      hitEnemy(e, dmg * 0.5, o);
      say1(e, 'WOBBLE!', col);
      break;
    case 'flyoff':
    case 'boomerang':
      throwCopy(h, w, dmg * (id === 'flyoff' ? 0.8 : 0.6), id === 'boomerang');
      say1(h, id === 'flyoff' ? 'WHOOPS!' : 'BOOMERANG!', col);
      break;
    case 'splash':
      for (const n of [e, ...near(e, 42)]) {
        if (n !== e) hitEnemy(n, dmg * 0.35, { ...o, dir: Math.sign(cx(n) - cx(e)) || dir });
        n.chill = Math.max(n.chill || 0, 1.2);
      }
      for (let i = 0; i < 8; i++) emit(cx(e) + (Math.random() - 0.5) * 30, cy(e) - 4, 'drip', C.sky);
      say1(e, 'SPLOOSH!', col);
      break;
    case 'glue':
      if (!e.boss) {
        e.stun = Math.max(e.stun || 0, 0.9);
        e.vx = 0;
      }
      for (let i = 0; i < 5; i++) emit(e.x + Math.random() * e.w, e.y + e.h - 2, 'bubble', C.lime);
      say1(e, 'STUCK!', col);
      break;
    case 'borrowed': {
      const fam = BORROW[Math.floor(Math.random() * BORROW.length)];
      hitEnemy(e, dmg * 0.3, { ...o, element: fam, chain: false, chip: false });
      say1(e, 'BORROWED ' + fam.toUpperCase() + '!', col);
      break;
    }
    case 'poke':
      hitEnemy(e, dmg * 0.6, { ...o, crit: true });
      say1(e, 'POKE!', col);
      break;
    case 'sad':
      if (!e.boss) e.stun = Math.max(e.stun || 0, 1.4);
      say(e, SAD[Math.floor(Math.random() * SAD.length)], 1.4, true);
      for (let i = 0; i < 3; i++) emit(cx(e) + (Math.random() - 0.5) * 6, e.y + 6, 'drip', C.blue);
      break;
    case 'yoink':
      dropShards(cx(e), cy(e), 1 + (Math.random() < 0.4 ? 1 : 0));
      say1(e, 'YOINK!', col);
      break;
    case 'stink':
      for (const n of [e, ...near(e, 48)])
        if (!n.dead) n.venom = { t: 3, stacks: Math.min(5, (n.venom ? n.venom.stacks : 0) + 1), dmg: Math.max(1, dmg * 0.05), tick: 0.5 };
      burst(cx(e), cy(e), 8, 'smoke', ['leaf', 'lime', 'pine']);
      say1(e, 'PEE-YEW!', col);
      break;
    case 'shrapnel': {
      const ns = near(e, 64, 50)
        .sort((a, b) => Math.abs(cx(a) - cx(e)) - Math.abs(cx(b) - cx(e)))
        .slice(0, 3);
      for (const n of ns) hitEnemy(n, dmg * 0.4, { ...o, dir: Math.sign(cx(n) - cx(e)) || dir });
      burst(cx(e), cy(e), 10, 'chip', ['mist', 'paper', 'stone']);
      say1(e, 'SHRAPNEL!', col);
      break;
    }
    case 'bonk':
      if (!e.boss && !e.air) {
        e.vy = -170;
        e.onGround = false;
      }
      if (!e.boss) e.stun = Math.max(e.stun || 0, 0.6);
      burst(cx(e), e.y - 2, 5, 'twinkle', ['gold', 'cream']);
      say1(e, 'BOING!', col);
      break;
    case 'spare': {
      const back = world.enemies.filter(n => !n.dead && !(n.spawnT > 0) && Math.sign(cx(n) - cx(h)) === -dir && Math.abs(cx(n) - cx(h)) < 40 && Math.abs(cy(n) - cy(h)) < 26);
      for (const n of back) hitEnemy(n, dmg * 0.6, { ...o, dir: -dir });
      if (!back.length && !e.dead) hitEnemy(e, dmg * 0.4, o);
      spark(cx(h) - dir * 14, cy(h), { col: C.violet });
      say1(h, 'SPARE SWING!', col);
      break;
    }
    case 'warm':
      h.hp = Math.min(h.maxHp, h.hp + Math.max(1, Math.round(h.maxHp * 0.02)));
      burst(cx(h), h.y + 4, 4, 'twinkle', ['red', 'coral']);
      say1(h, 'STILL WARM', col);
      break;
    case 'honk':
      sfx.honk();
      for (const n of [e, ...near(e, 64)])
        if (!n.boss && !n.dead) {
          n.vx = (Math.sign(cx(n) - cx(h)) || dir) * 160;
          n.kbT = 0.1;
          n.stun = Math.max(n.stun || 0, 0.3);
        }
      say1(h, 'HONK!', col);
      break;
    case 'confetti':
      for (const n of [e, ...near(e, 56, 44)]) {
        if (n.dead) continue;
        hitEnemy(n, dmg * 0.45, { ...o, dir: Math.sign(cx(n) - cx(e)) || dir });
        if (!n.boss) n.stun = Math.max(n.stun || 0, 0.5);
      }
      burst(cx(e), cy(e) - 4, 16, 'twinkle', ['pink', 'gold', 'sky', 'lime', 'violet']);
      say1(e, 'PARTY!', col);
      break;
    case 'zap': {
      let from = e;
      const hit = new Set([e]);
      if (!e.dead) hitEnemy(e, dmg * 0.4, o);
      for (let k = 0; k < 3; k++) {
        const next = world.enemies.filter(n => !n.dead && !hit.has(n) && !(n.spawnT > 0) && Math.hypot(cx(n) - cx(from), cy(n) - cy(from)) < 90)
          .sort((a, b) => Math.hypot(cx(a) - cx(from), cy(a) - cy(from)) - Math.hypot(cx(b) - cx(from), cy(b) - cy(from)))[0];
        if (!next) break;
        for (let i = 1; i < 6; i++) emit(cx(from) + (cx(next) - cx(from)) * i / 6, cy(from) + (cy(next) - cy(from)) * i / 6 + (Math.random() - 0.5) * 6, 'twinkle', C.sky);
        hitEnemy(next, dmg * 0.4, { ...o, dir: Math.sign(cx(next) - cx(from)) || dir });
        hit.add(next);
        from = next;
      }
      say1(e, 'ZAP!', col);
      break;
    }
    case 'giant': {
      const front = world.enemies.filter(n => !n.dead && !(n.spawnT > 0) && Math.sign(cx(n) - cx(h)) !== -dir && Math.abs(cx(n) - cx(h)) < 72 && Math.abs(cy(n) - cy(h)) < 40);
      for (const n of front) {
        hitEnemy(n, dmg * 0.8, { ...o, knock: 30 });
        if (!n.boss && !n.air) { n.vy = -120; n.onGround = false; }
      }
      h.giantT = 0.35;
      shake(0.3);
      burst(cx(h) + dir * 30, h.y + h.h - 2, 10, 'smoke', ['sand', 'mist', 'cream']);
      say1(h, 'HUGE!', col);
      break;
    }
  }
  return true;
}

// a spinning copy of the weapon (loose heads, bent boomerangs); drawn by shots.js
function throwCopy(h, w, dmg, back) {
  const L = lookOf(w);
  world.shots.push({
    id: newId(), type: w.type, sprite: true, boomerang: back, x: cx(h) + h.face * 6, y: h.y + 10, w: 6, h: 5,
    vx: h.face * (back ? 230 : 210), vy: back ? 0 : -30, g: back ? 0 : 160, dmg, crit: false, knock: 10,
    pierce: back ? 9 : 2, homing: 0, life: back ? 1.4 : 0.9, hit: new Set(), element: null, col: L.mid, light: L.light,
    weapon: w, emitters: [], spin: 0, proc: true, t: 0
  });
}
