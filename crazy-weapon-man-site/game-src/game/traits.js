// Alerted traits: once a resident notices you (or a swarm member arrives), every enemy type has its
// own little trick on a slow timer, on top of its normal attack: acorns lobbed in arcs, honk waves,
// banana peels, boomerang shields... Calm residents never use them, so wandering stays gentle.
// Each one winds up with the usual "!" tell (enemy.js), moves slowly and is drawn as its own tiny
// pixel thing so you can read what's coming. Numbers live in data/enemies.js (`alert`).
import { C } from '../config.js';
import { world } from './world.js';
import { cx, cy } from './physics.js';
import { rect, px } from '../engine/gfx.js';
import { burst, emit, callout } from './fx.js';
import { sfx } from '../engine/audio.js';
import { arrowWait, drawArrow, drawQuake } from './beastkin.js';

const say1 = (e, s, col = C.cream) => callout(s, 0, 0, col, { follow: e, life: 36 });

// bolt with a look; g = gravity, fuse = pops (small blast) when its life runs out, ground = slides
// along the enemy's own platform and stops at its edges, ret = flies back to its thrower
function bolt(e, o) {
  const b = { x: cx(e) - 2, y: e.y + e.h * 0.4 - 2, w: 4, h: 4, vx: 0, vy: 0, g: 0, dmg: e.dmg * (e.d.alert.dmg ?? 0.7), col: C[e.d.bolt] || C.paper, life: 3, owner: e, ...o };
  if (b.ground) {
    const p = e.platform;
    b.y = e.y + e.h - b.h;
    b.minX = p ? p.x : -1e9;
    b.maxX = p ? p.x + p.w : 1e9;
  }
  world.bolts.push(b);
  return b;
}
const aim = (e, sp) => {
  const h = world.hero, a = Math.atan2(cy(h) - (e.y + e.h * 0.4), cx(h) - cx(e));
  return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp };
};
// a lob that lands on (about) where the hero stands, t seconds later
const lob = (e, t, g = 420) => {
  const h = world.hero, dx = cx(h) - cx(e), dy = h.y + h.h - (e.y + e.h * 0.4);
  return { vx: dx / t, vy: dy / t - 0.5 * g * t, g };
};

export function fireTrait(e) {
  const T = e.d.alert.do, f = e.face;
  switch (T) {
    case 'sword': // Graveyard Bandit: flings a spare sword from the graves, end over end
      bolt(e, { ...lob(e, 0.8), look: 'sword', w: 6, h: 6 });
      break;
    case 'pebble': // Pocket Gremlin: flicks a pebble
      bolt(e, { ...lob(e, 0.6, 500), look: 'pebble' });
      break;
    case 'honk': // War Goose: a honk you can see, rolling along the ground
      bolt(e, { vx: f * 110, ground: true, look: 'honk', w: 6, h: 8, life: 2.4 });
      sfx.honk();
      say1(e, 'HONK!', C.paper);
      break;
    case 'egg': // Bomb Chicken: lays an egg that pops a second later
      bolt(e, { vx: -f * 20, vy: -60, g: 500, look: 'egg', w: 5, h: 6, life: 1.3, fuse: 22, stop: true });
      say1(e, 'BAWK!');
      break;
    case 'slam': // Axe Ogre: thumps the ground, a ripple runs out both ways
      for (const d of [-1, 1]) bolt(e, { vx: d * 120, ground: true, look: 'ripple', w: 6, h: 5, life: 1.6 });
      burst(cx(e), e.y + e.h, 8, 'chip', ['sand', 'wood']);
      break;
    case 'casserole': // Casserole Spirit: lobs a hot dish
      bolt(e, { ...lob(e, 0.9), look: 'pot', w: 6, h: 5 });
      break;
    case 'coins': // Hungry Chest: spits a mouthful of coins
      for (let i = 0; i < 3; i++) bolt(e, { vx: f * (60 + i * 35), vy: -160 - i * 20, g: 460, look: 'coin' });
      say1(e, 'PTOO!', C.gold);
      break;
    case 'seed': // Toothy Sky Rat: drops seed bombs from above
      bolt(e, { vx: (cx(world.hero) - cx(e)) * 0.6, vy: 20, g: 360, look: 'seed', life: 2.4 });
      break;
    case 'fan': // Grumpy Wizard: a fan of three grumpy sparks
      for (let i = -1; i <= 1; i++) { const a = Math.atan2(cy(world.hero) - cy(e), cx(world.hero) - cx(e)) + i * 0.3; bolt(e, { vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, look: 'star', col: C.red }); }
      break;
    case 'paper': // Cursed Scribe: a slow paper plane that follows you a little
      bolt(e, { ...aim(e, 70), look: 'paper', w: 6, h: 4, homing: 1.4, life: 4 });
      break;
    case 'fakeout': // Suspicious Weapon Drop: spits a fake weapon that hops at you
      bolt(e, { ...lob(e, 0.7), look: 'sword', w: 6, h: 6, col: C.gold });
      say1(e, 'FREE LOOT!', C.gold);
      break;
    case 'tears': // All-Seeing Orb: weeps three teardrops
      for (let i = -1; i <= 1; i++) bolt(e, { vx: i * 40 + f * 20, vy: -60, g: 300, look: 'tear', col: C.sky });
      break;
    case 'shield': // Shield Knight: throws the shield, which comes back
      bolt(e, { vx: f * 150, look: 'shield', w: 6, h: 7, ret: 0.55, life: 2.2 });
      say1(e, 'CATCH!', C.ice);
      break;
    case 'afterimage': // Blink Imp: leaves a sparkly afterimage that pops
      bolt(e, { look: 'imp', w: 6, h: 6, life: 0.9, fuse: 20 });
      break;
    case 'bone': // Necromancer: a spinning bone boomerang
      bolt(e, { ...aim(e, 120), look: 'bone', w: 6, h: 4, ret: 0.7, life: 2.4 });
      break;
    case 'burst': // Steve: a second shot right after the first. Steve never misses (he does)
      bolt(e, { ...aim(e, 260), look: null, col: C.red, sniper: true });
      break;
    case 'barrel': // Runaway Barrel Knight: kicks a little barrel down the platform
      bolt(e, { vx: f * 130, ground: true, look: 'barrel', w: 6, h: 6, life: 2.4 });
      break;
    case 'acorn': // Acorn Archer: arcs an acorn
      bolt(e, { ...lob(e, 0.8), look: 'acorn' });
      break;
    case 'squirt': // Nunchuck Turtle: squirts water
      bolt(e, { vx: f * 150, vy: -90, g: 380, look: 'tear', col: C.sky });
      say1(e, 'SPLOOSH!', C.sky);
      break;
    case 'peel': // Bazaar Raccoon: drops a banana peel and runs off
      bolt(e, { vx: -f * 30, vy: -40, g: 500, look: 'peel', w: 6, h: 3, life: 3.5, stop: true });
      e.vx = -f * 90;
      break;
    case 'crescent': // Tiny Samurai: a crescent slash that flies along the ground
      bolt(e, { vx: f * 140, ground: true, look: 'crescent', w: 5, h: 10, life: 1.8 });
      say1(e, 'HYAH!', C.paper);
      break;
    case 'foxfire': // Kitsune Spirit: two foxfires that drift after you
      for (const d of [-1, 1]) bolt(e, { vx: d * 30, vy: -50, look: 'fox', col: C.sky, homing: 2, life: 3.2, speed: 65 });
      break;
    case 'beads': // Pebble Monk: three prayer beads in a row
      for (let i = 0; i < 3; i++) bolt(e, { vx: f * 95, x: cx(e) - 2 - f * i * 9, look: 'bead', life: 2.4 });
      break;
    case 'sparks': // Anvil Pup: shakes off a shower of hot sparks
      for (let i = -1; i <= 1; i++) bolt(e, { vx: f * 50 + i * 45, vy: -190, g: 520, look: 'ember', col: C.orange });
      say1(e, 'CLANG!', C.orange);
      break;
    case 'stars': // Pocket Ninja: two shuriken, one high one low
      for (let i = 0; i < 2; i++) bolt(e, { ...aim(e, 130), y: e.y + e.h * (0.2 + i * 0.5), look: 'shuriken', col: C.mist });
      break;
  }
}

// called from updateBolts for bolts with trait behaviour; returns true when the bolt is used up
export function traitBolt(b, dt) {
  const h = world.hero;
  if (arrowWait(b, dt)) return false; // a Moonfang rain arrow, hanging over its mark
  if (b.stop && b.vy > 0 && b.y + b.h >= (b.floorY ?? (b.floorY = (b.owner ? b.owner.y + b.owner.h : b.y + 20)))) {
    // eggs and peels come to rest on the floor they were dropped on
    b.y = b.floorY - b.h; b.vx = 0; b.vy = 0; b.g = 0;
  }
  if (b.ground && (b.x < b.minX || b.x + b.w > b.maxX)) return pop(b);
  if (b.homing) {
    const sp = b.speed || Math.hypot(b.vx, b.vy) || 60, a = Math.atan2(cy(h) - b.y, cx(h) - b.x), cur = Math.atan2(b.vy, b.vx);
    let da = a - cur;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const n = cur + Math.max(-b.homing * dt, Math.min(b.homing * dt, da));
    b.vx = Math.cos(n) * sp; b.vy = Math.sin(n) * sp;
  }
  if (b.ret != null && (b.t = (b.t || 0) + dt) > b.ret) {
    const o = b.owner;
    if (!o || o.dead) return true;
    const dx = cx(o) - b.x, dy = cy(o) - b.y, d = Math.max(1, Math.hypot(dx, dy));
    b.vx = (dx / d) * 160; b.vy = (dy / d) * 160;
    if (d < 8) return true;
  }
  if (b.fuse && b.life <= dt) return pop(b);
  return false;
}
function pop(b) {
  if (b.fuse) {
    burst(b.x + 2, b.y + 2, 8, 'twinkle', b.look === 'imp' ? ['violet', 'pink'] : ['cream', 'orange', 'paper']);
    sfx.boom(0.4);
    const h = world.hero;
    if (Math.abs(cx(h) - b.x) < b.fuse && Math.abs(cy(h) - b.y) < b.fuse) return 'hit';
  }
  return true;
}

const SPIN = ['sword', 'shield', 'bone', 'shuriken', 'barrel'];
export function drawTraitBolt(b, t) {
  const x = Math.round(b.x), y = Math.round(b.y), k = Math.floor(t * 12 + b.x * 0.1) % 4, f = Math.sign(b.vx) || 1;
  const o = (w, h) => rect(x - 1, y - 1, w + 2, h + 2, C.ink);
  switch (b.look) {
    case 'arrow': return drawArrow(b, t);
    case 'quake': return drawQuake(b, t);
    case 'sword': o(6, 6);
      if (k % 2) { rect(x, y + 2, 6, 2, b.col === C.gold ? C.gold : C.mist); rect(x + (f > 0 ? 0 : 4), y + 1, 2, 4, C.wood); }
      else { rect(x + 2, y, 2, 6, b.col === C.gold ? C.gold : C.mist); rect(x + 1, y + (k ? 4 : 0), 4, 2, C.wood); }
      break;
    case 'pebble': o(4, 4); rect(x, y, 4, 4, C.stone); px(x + 1, y + 1, C.mist); break;
    case 'honk': for (let i = 0; i < 3; i++) rect(x + (f > 0 ? i * 2 : 4 - i * 2), y + i, 1, 8 - i * 2, C.paper); break;
    case 'egg': o(5, 6); rect(x, y, 5, 6, C.paper); rect(x + 1, y, 3, 1, C.cream); if (b.life < 0.5 && k % 2) rect(x + 1, y + 2, 3, 2, C.red); break;
    case 'ripple': rect(x, y + 3, 6, 2, C.sand); rect(x + 1, y + 1, 4, 2, C.wood); break;
    case 'pot': o(6, 5); rect(x, y + 1, 6, 4, C.orange); rect(x, y, 6, 1, C.cream); emit(x + 3, y - 1, 'dot', C.paper); break;
    case 'coin': o(4, 4); rect(x + (k % 2), y, 4 - 2 * (k % 2), 4, C.gold); px(x + 1, y + 1, C.cream); break;
    case 'seed': o(4, 4); rect(x, y, 4, 4, C.wood); px(x + 1, y, C.lime); break;
    case 'star': o(4, 4); rect(x + 1, y, 2, 4, b.col); rect(x, y + 1, 4, 2, b.col); px(x + 1, y + 1, C.paper); break;
    case 'paper': o(6, 4); rect(x, y + 1, 6, 2, C.paper); rect(x + (f > 0 ? 3 : 0), y, 3, 1, C.mist); break;
    case 'tear': o(4, 4); rect(x + 1, y, 2, 4, b.col); rect(x, y + 2, 4, 2, b.col); px(x + 1, y + 2, C.paper); break;
    case 'shield': o(6, 7); rect(x, y, 6, 6, C.ice); rect(x + 1, y + 6, 4, 1, C.ice); rect(x + 2, y + 1, 2, 4, k % 2 ? C.gold : C.sky); break;
    case 'imp': if (k % 2) { rect(x, y, 6, 6, C.violet); rect(x + 1, y + 1, 1, 1, C.paper); rect(x + 4, y + 1, 1, 1, C.paper); } else rect(x + 1, y + 1, 4, 4, C.pink); break;
    case 'bone': o(6, 4); if (k % 2) { rect(x, y + 1, 6, 2, C.paper); px(x, y, C.paper); px(x + 5, y + 3, C.paper); } else { rect(x + 2, y - 1, 2, 6, C.paper); } break;
    case 'barrel': o(6, 6); rect(x, y, 6, 6, C.wood); rect(x, y + (k % 3) * 2, 6, 1, C.woodD); break;
    case 'acorn': o(4, 5); rect(x, y + 1, 4, 4, C.wood); rect(x, y, 4, 2, C.woodD); px(x + 2, y - 1, C.woodD); break;
    case 'peel': o(6, 3); rect(x, y + 1, 6, 2, C.gold); rect(x + 2, y, 2, 1, C.cream); break;
    case 'crescent': for (let i = 0; i < 10; i++) px(x + (f > 0 ? Math.round(Math.sin(i / 9 * Math.PI) * 4) : 4 - Math.round(Math.sin(i / 9 * Math.PI) * 4)), y + i, i % 3 ? C.paper : C.ice); break;
    case 'fox': rect(x, y + 1, 4, 3, C.sky); rect(x + 1, y - 1 + (k % 2), 2, 2, C.ice); px(x + 1, y + 2, C.paper); break;
    case 'bead': o(4, 4); rect(x, y, 4, 4, C.wood); px(x + 1, y + 1, C.sand); break;
    case 'ember': rect(x + 1, y, 2, 3, C.orange); px(x + 1, y, C.gold); break;
    case 'shuriken': o(4, 4); if (k % 2) { rect(x + 1, y, 2, 4, C.mist); rect(x, y + 1, 4, 2, C.mist); } else { px(x, y, C.mist); px(x + 3, y, C.mist); px(x, y + 3, C.mist); px(x + 3, y + 3, C.mist); rect(x + 1, y + 1, 2, 2, C.slate); } break;
    default: return false;
  }
  return true;
}
