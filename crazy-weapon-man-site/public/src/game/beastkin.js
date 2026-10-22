// Beastkin residents (kind 'beast' in data/enemies.js): each zone's own family, all carrying the
// zone's weapon, each type with its own way of fighting (beh). enemy.js hands over think/attack/
// attacking; combat.js tells us about hits and deaths; their arrows ride the shared enemy bolts.
//
// The fuzzball family (zone 2, the bow):
//   hop       Fuzzlet: hops and looses an arrow at the top of the hop
//   roll      Burr Ball: curls up and rolls at you, then shakes its stuck arrows out in a spray
//   lob       Puff Archer: arcs two arrows up and over, so ledges don't keep you safe
//   twin      Twin Tuft: two arrows at once; knocked apart it becomes two Fuzzlets
//   fan       Quillback: a fan of three; every 4th hit it takes, it bristles quills all round
//   snipe     Moss Stalker: hard to see until it draws; one long aimed shot, then it slips away
//   kite      Wolf Pup: bow-bash up close, backflips away and shoots on the way down
//   frost     Frost Cub: frost arrows that slow you for a moment
//   greatbow  Greatbow Yeti: shrugs off light hits; a heavy arrow that bowls you over, and a
//             stomp that sends a shockwave along the floor if you get in close (jump it)
//   alpha     Moonfang: howls the family into a rage, rains arrows on marked spots, claws up close
//
// The goose family (zone 1, the sword):
//   poke      Gosling: waddles up and pokes with its practice sword
//   honk      Honker: a honk you can see rolls along the floor and shoves you back; then it swings
//   shield    Gander Squire: blocks from the front (data block); bashes with the shield
//   lunge     Goose Fencer: a line on the floor shows where its long lunge will go
//   toss      Blade Tosser: throws its sword like a boomerang and is open until it catches it
//   whirl     Whirlwind Goose: spins across the floor like a buzzsaw, then reels about dizzy
//   phase     Grave Goose: hits pass through it unless it is attacking (specials still land)
//   flurry    Goose Berserker: a three-hit flurry; faster once it is hurt
//   parry     Black Swan Duelist: on guard, a hit from the front is parried and riposted
//   warlord   War Gander: heavy; leaps and crashes down where you stand, and raises a ring of
//             grave swords out of the ground around you
import { C } from '../config.js';
import { world } from './world.js';
import { cx, cy, overlap } from './physics.js';
import { rect, px } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { burst, emit, callout, shake } from './fx.js';
import { hurtHero } from './combat.js';
import { spawnEnemy } from './enemy.js';
import { say } from './bubbles.js';
import { LINES } from '../data/enemies.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const say1 = (e, s, col = C.cream) => callout(s, 0, 0, col, { follow: e, life: 40 });

function wind(e, t, pose = 'draw', move = 'shot') {
  e.state = 'wind';
  e.st = t;
  e.vx = 0;
  e.windPose = pose;
  e.move = move;
}
function done(e, cool) {
  e.state = 'recover';
  e.st = 0.3;
  e.pose = null;
  e.cool = cool * (e.swarm ? 0.8 : 1.3) * (e.rage > 0 ? 0.55 : 1);
}
// stay about `want` px from the hero, walking only on the same floor
function keep(e, want, dist, toward, slow) {
  const v = dist > want + 12 ? toward : dist < want - 26 ? -toward : 0;
  e.vx = v * e.speed * slow * (e.rage > 0 ? 1.35 : 1);
}

// ---------------------------------------------------------------- arrows
// an arrow (or quill) from the beast's bow hand; look 'arrow' is drawn below (drawArrow)
function arrow(e, vx, vy, o = {}) {
  const b = { x: cx(e) + e.face * e.w * 0.4 - 2, y: e.y + e.h * 0.42 - 2, w: 4, h: 4, vx, vy, g: 0, dmg: e.dmg, col: C.wood, life: 3, look: 'arrow', owner: e, ...o };
  world.bolts.push(b);
  return b;
}
function aimed(e, sp, spread = 0, dy = 0) {
  const h = world.hero, a = Math.atan2(cy(h) - (e.y + e.h * 0.42 + dy), cx(h) - cx(e)) + spread;
  return [Math.cos(a) * sp, Math.sin(a) * sp];
}
// an arc that comes down on (about) where the hero stands t seconds later
function lobbed(e, t, g) {
  const h = world.hero, dx = cx(h) + h.vx * t * 0.5 - cx(e), dy = h.y + h.h - 4 - (e.y + e.h * 0.42);
  return [dx / t, dy / t - 0.5 * g * t];
}
function loose(e) {
  sfx.enemyCast();
  burst(cx(e) + e.face * e.w * 0.45, e.y + e.h * 0.42, 3, 'dot', ['paper', 'sand']);
}

// what an arrow does on top of its damage (enemy.js updateBolts calls this when one hits you)
export function arrowHit(b) {
  const h = world.hero;
  if (b.chill) {
    if (!(h.chillT > 0)) callout('CHILLED', 0, 0, C.ice, { follow: h, life: 40 });
    h.chillT = Math.max(h.chillT || 0, b.chill);
  }
  if (b.knock) {
    h.vx = (Math.sign(b.vx) || 1) * b.knock;
    h.vy = -150;
    shake(0.5);
  }
}
// a rain arrow hangs (unseen) over its mark, then drops; returns true while it is still waiting
export function arrowWait(b, dt) {
  if (!(b.wait > 0)) return false;
  b.wait -= dt;
  if (b.wait <= 0) {
    b.vy = b.fall || 0;
    if (b.erupt) (b.h = 14), (b.y = b.markY - 14), (b.life = 0.45), burst(b.x + 2, b.markY, 6, 'chip', ['sand', 'wood', 'mist']), sfx.enemyMelee();
  }
  return true;
}

// ---------------------------------------------------------------- every frame
export function beastTick(e, dt) {
  if (e.rage > 0) {
    e.rage -= dt;
    if (Math.random() < 0.25) emit(cx(e) + rnd(-4, 4), e.y + rnd(0, 6), 'dot', C.red);
  }
  // Quillback: bristles a moment after its 4th, 8th... hit
  if (e.bristleT > 0 && (e.bristleT -= dt) <= 0) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.15;
      arrow(e, Math.cos(a) * 120, Math.sin(a) * 120 - 20, { x: cx(e) - 2, y: cy(e) - 2, quill: true, dmg: e.dmg * 0.5, g: 120, life: 1.4 });
    }
    burst(cx(e), cy(e), 10, 'chip', ['paper', 'sand', 'red']);
    sfx.enemyMelee();
  }
  // the geese honk at you now and then
  if (e.d.fam === 'goose' && !e.calm && (e.honkT -= dt) <= 0) {
    e.honkT = 4 + Math.random() * 6;
    if (Math.random() < 0.45) say(e, LINES.honk[Math.floor(Math.random() * LINES.honk.length)], 0.9);
  }
  // Blade Tosser: catches its sword once it has come back
  if (e.unarmed && !world.bolts.some(b => b.owner === e && b.look === 'gsword')) {
    e.unarmed = false;
    say1(e, 'CAUGHT!', C.paper);
  }
  // Grave Goose: only solid while it attacks (and just after)
  if (e.d.beh === 'phase') {
    e.phased = !(e.state === 'wind' || e.state === 'attack' || e.state === 'recover') && world.t >= (e.solidUntil ?? 0);
    e.alpha = Math.max(0.4, Math.min(1, (e.alpha ?? 0.4) + (e.phased ? -3 : 5) * dt));
  }
  // Goose Berserker: hurt, it gets angrier
  if (e.d.beh === 'flurry' && e.hp < e.max * 0.5) {
    if (!e.berserk) (e.berserk = true), say1(e, 'BERSERK!', C.red);
    e.rage = Math.max(e.rage || 0, 0.2);
  }
  // Moss Stalker: fades into the forest unless it is drawing, shooting or was just hit
  if (e.d.beh === 'snipe') {
    const seen = e.state === 'wind' || e.state === 'attack' || world.t - (e.lastHitAt ?? -9) < 2 || e.flash > 0;
    e.alpha = Math.max(0.22, Math.min(1, (e.alpha ?? 0.22) + (seen ? 4 : -1.2) * dt));
  }
}

export function beastThink(e, dt, dist, toward, slow, sameLevel) {
  const d = e.d, h = world.hero, near = Math.abs(cy(h) - cy(e)) < 70;
  const ready = e.cool <= 0 && dist < d.range && near;
  switch (d.beh) {
    case 'hop':
      if (ready && sameLevel) wind(e, d.wind);
      else keep(e, 70, dist, toward, slow);
      break;
    case 'roll':
      if (e.cool <= 0 && dist < d.range && sameLevel) wind(e, d.wind, 'roll0', 'roll');
      else keep(e, 60, dist, toward, slow);
      break;
    case 'lob':
      if (ready || (e.cool <= 0 && dist < d.range && Math.abs(cy(h) - cy(e)) < 110)) wind(e, d.wind);
      else keep(e, 110, dist, toward, slow);
      break;
    case 'twin':
      if (ready) wind(e, d.wind);
      else keep(e, 80, dist, toward, slow);
      break;
    case 'fan':
      if (ready) wind(e, d.wind);
      else keep(e, 85, dist, toward, slow);
      break;
    case 'snipe':
      if (e.cool <= 0 && dist < d.range && Math.abs(cy(h) - cy(e)) < 100) wind(e, d.wind);
      else keep(e, 170, dist, toward, slow * 0.6);
      break;
    case 'kite':
      if (e.cool <= 0 && dist < d.range + 6 && sameLevel) wind(e, d.wind, 'draw', 'bash');
      else if (e.cool <= 0 && dist > 90 && dist < 170 && near && Math.random() < dt * 1.5) wind(e, 0.45);
      else e.vx = toward * e.speed * slow * (e.rage > 0 ? 1.35 : 1);
      break;
    case 'frost':
      if (ready) wind(e, d.wind);
      else keep(e, 95, dist, toward, slow);
      break;
    case 'greatbow':
      if ((e.stompCool ?? 0) <= 0 && dist < 46 && sameLevel) wind(e, 0.6, 'stomp', 'stomp');
      else if (ready) wind(e, d.wind);
      else keep(e, 130, dist, toward, slow);
      break;
    case 'poke':
    case 'shield':
      if (e.cool <= 0 && dist < d.range + 8 && sameLevel) wind(e, d.wind, 'draw', d.beh === 'shield' ? 'sbash' : 'poke');
      else e.vx = toward * e.speed * slow * (dist < 16 ? 0 : 1);
      break;
    case 'honk':
      if ((e.honkCool ?? 0) <= 0 && dist < 100 && sameLevel) wind(e, 0.45, 'honk', 'honk');
      else if (e.cool <= 0 && dist < d.range + 8 && sameLevel) wind(e, d.wind, 'draw', 'slash');
      else e.vx = toward * e.speed * slow * (dist < 16 ? 0 : 1);
      break;
    case 'lunge':
      if (e.cool <= 0 && dist < d.range && dist > 24 && sameLevel) wind(e, 0.6, 'draw', 'lunge');
      else if (e.cool <= 0 && dist <= 24 && sameLevel) wind(e, 0.4, 'draw', 'slash');
      else keep(e, 64, dist, toward, slow);
      break;
    case 'toss':
      if (!e.unarmed && e.cool <= 0 && dist > 40 && dist < d.range && near) wind(e, d.wind, 'draw', 'toss');
      else if (!e.unarmed && e.cool <= 0 && dist <= 40 && sameLevel) wind(e, 0.4, 'draw', 'slash');
      else keep(e, e.unarmed ? 110 : 80, dist, toward, slow);
      break;
    case 'whirl':
      if (e.cool <= 0 && dist < d.range && sameLevel) wind(e, d.wind, 'draw', 'whirl');
      else keep(e, 70, dist, toward, slow);
      break;
    case 'phase':
      if (e.cool <= 0 && dist < d.range + 8 && sameLevel) wind(e, d.wind, 'draw', 'slash');
      else e.vx = toward * e.speed * slow * (dist < 14 ? 0 : 1);
      break;
    case 'flurry':
      if (e.cool <= 0 && dist < d.range + 8 && sameLevel) wind(e, d.wind * (e.berserk ? 0.6 : 1), 'draw', 'flurry');
      else e.vx = toward * e.speed * slow * (dist < 16 ? 0 : 1) * (e.rage > 0 ? 1.35 : 1);
      break;
    case 'parry':
      if ((e.guardCool ?? 0) <= 0 && dist < 70 && sameLevel) (wind(e, 1.3, 'guard', 'guard'), (e.guarding = true));
      else if (e.cool <= 0 && dist < d.range + 8 && sameLevel) wind(e, d.wind, 'draw', 'slash');
      else keep(e, 40, dist, toward, slow);
      break;
    case 'warlord':
      if ((e.leapCool ?? 0) <= 0 && dist > 60 && dist < 200 && near) wind(e, 0.55, 'draw', 'leap');
      else if ((e.gravesCool ?? 0) <= 0 && dist < 220 && near) wind(e, 0.7, 'plunge', 'graves');
      else if (e.cool <= 0 && dist < d.range + 8 && sameLevel) wind(e, d.wind, 'draw', 'cleave');
      else e.vx = toward * e.speed * slow * (dist < 20 ? 0 : 1);
      break;
    case 'alpha':
      if (!e.howled || ((e.howlCool ?? 0) <= 0 && dist < 200)) wind(e, 0.55, 'howl', 'howl');
      else if ((e.rainCool ?? 0) <= 0 && dist > 50 && dist < 210 && near) wind(e, 0.7, 'sky', 'rain');
      else if (e.cool <= 0 && dist < d.range + 6 && sameLevel) wind(e, d.wind, 'draw', 'claw');
      else e.vx = toward * e.speed * slow * (dist < 22 ? 0 : 1) * (e.rage > 0 ? 1.35 : 1);
      break;
  }
  if (e.stompCool > 0) e.stompCool -= dt;
  if (e.howlCool > 0) e.howlCool -= dt;
  if (e.rainCool > 0) e.rainCool -= dt;
  for (const k of ['honkCool', 'guardCool', 'leapCool', 'gravesCool']) if (e[k] > 0) e[k] -= dt;
}
// the melee swings: lunge speed, how long it lasts, extra reach, damage and knockback
const MELEE = {
  bash: [120, 0.22, 4], claw: [150, 0.22, 4], poke: [140, 0.18, 2], slash: [90, 0.2, 6], sbash: [130, 0.2, 4, 1, 150],
  lunge: [340, 0.24, 4], riposte: [170, 0.22, 10, 1.3, 170], cleave: [60, 0.28, 14, 1.2, 120], flurry: [100, 0.16, 6, 0.8]
};
function swing(e, h) {
  const M = MELEE[e.move], reach = e.d.range + M[2], box = { x: e.face > 0 ? cx(e) : cx(e) - reach, y: e.y, w: reach, h: e.h };
  if (e.move === 'lunge') (box.x = e.face > 0 ? cx(e) : cx(e) - 18), (box.w = 18);
  if (!e.hitDone && overlap(box, h)) {
    e.hitDone = true;
    if (hurtHero(e.dmg * (M[3] || 1), e.face) && M[4]) (h.vx = e.face * M[4]), (h.vy = -140);
  }
}

export function beastAttack(e, toward) {
  const d = e.d, h = world.hero;
  e.attackPose = 'loose';
  e.st = 0.25;
  switch (e.move) {
    case 'shot':
      loose(e);
      switch (d.beh) {
        case 'hop': // up we go; the arrow comes at the top of the hop (beastAttacking)
          e.vy = -190;
          e.vx = -toward * 25;
          e.onGround = false;
          e.pose = 'jump';
          e.hopShot = true;
          e.st = 1;
          return;
        case 'lob':
          for (const t of [0.85, 1.1]) arrow(e, ...lobbed(e, t, 380), { g: 380 });
          break;
        case 'twin':
          for (const dy of [-3, 3]) arrow(e, ...aimed(e, 140, 0, dy), { y: e.y + e.h * 0.42 - 2 + dy });
          break;
        case 'fan':
          for (const s of [-0.24, 0, 0.24]) arrow(e, ...aimed(e, 135, s));
          break;
        case 'snipe':
          arrow(e, ...aimed(e, 330), { long: true });
          e.st = 0.35;
          e.relocate = true;
          break;
        case 'frost':
          arrow(e, ...aimed(e, 135), { frost: true, chill: 1.6 });
          burst(cx(e) + e.face * 8, e.y + e.h * 0.42, 4, 'dot', ['ice', 'paper']);
          break;
        case 'greatbow':
          arrow(e, ...aimed(e, 245), { heavy: true, w: 8, h: 4, dmg: e.dmg * 1.3, knock: 230 });
          e.vx = -e.face * 40; // the kick of it
          shake(0.25);
          break;
        default:
          arrow(e, ...aimed(e, 150));
      }
      return;
    case 'roll':
      e.vx = e.face * 175;
      e.st = 1.0;
      e.pose = 'roll';
      sfx.enemyMelee();
      return;
    case 'guard': // the Black Swan's guard ran out without a hit: it swings instead
      e.guarding = false;
      e.guardCool = 3;
      e.move = 'slash';
    // falls through
    case 'flurry':
      e.combo = 0;
    // falls through
    case 'bash': // Wolf Pup: a bow-bash, then the backflip (beastAttacking)
    case 'claw': // Moonfang: the bladed tips of the moon bow
    case 'poke':
    case 'slash':
    case 'sbash':
    case 'lunge':
    case 'riposte':
    case 'cleave': {
      sfx.enemyMelee();
      const M = MELEE[e.move];
      e.attackPose = { lunge: 'lunge', sbash: 'bash' }[e.move] || 'loose';
      e.vx = e.face * M[0];
      e.st = M[1];
      if (e.move === 'lunge') say1(e, 'EN GARDE!', C.paper);
      if (e.move === 'riposte') say1(e, 'RIPOSTE!', C.gold);
      if (e.d.beh === 'phase') e.solidUntil = world.t + 0.9;
      if (e.platform) {
        const p = e.platform, room = e.face > 0 ? p.x + p.w - cx(e) : cx(e) - p.x;
        e.vx = e.face * Math.min(Math.abs(e.vx), Math.max(0, room - 4) / (M[1] + 0.1));
      }
      return;
    }
    case 'honk': // Honker: the honk rolls along the floor
      e.honkCool = 4;
      e.attackPose = 'honk';
      e.st = 0.35;
      sfx.honk();
      say1(e, 'HONK!!', C.paper);
      {
        const p = e.platform;
        world.bolts.push({ x: cx(e) + e.face * 8 - 3, y: e.y + e.h - 9, w: 6, h: 8, vx: e.face * 130, vy: 0, g: 0, dmg: e.dmg * 0.35, knock: 170, col: C.paper, life: 1.5, look: 'honk', owner: e,
          ground: true, minX: p ? p.x : -1e9, maxX: p ? p.x + p.w : 1e9 });
      }
      return;
    case 'toss': // Blade Tosser: there goes the sword (it comes back: traits.js ret)
      e.unarmed = true;
      e.attackPose = 'throw';
      e.st = 0.3;
      sfx.enemyMelee();
      world.bolts.push({ x: cx(e) + e.face * 6 - 3, y: e.y + e.h * 0.35, w: 6, h: 6, vx: e.face * 170, vy: Math.max(-40, Math.min(40, cy(h) - cy(e))), g: 0, dmg: e.dmg, col: C.mist, life: 3, look: 'gsword', ret: 0.55, owner: e });
      return;
    case 'whirl': // Whirlwind Goose: off it goes
      e.pose = 'spin';
      e.spinDir = e.face;
      e.vx = e.face * 120;
      e.st = 1.5;
      say1(e, 'WHEEE!', C.paper);
      return;
    case 'leap': { // War Gander: up and over, down where you stand
      const t = 0.75, dx = Math.max(-200, Math.min(200, cx(h) - cx(e)));
      e.vx = dx / t;
      e.vy = -0.5 * 760 * t;
      e.onGround = false;
      e.pose = 'leap';
      e.leapX = cx(e) + dx;
      e.leapAt = world.t;
      e.leapCool = 4.5;
      e.st = 2;
      sfx.enemyMelee();
      return;
    }
    case 'graves': { // War Gander: the graveyard's old swords burst up around you
      e.gravesCool = 6;
      e.attackPose = 'plunge';
      e.st = 0.5;
      shake(0.3);
      burst(cx(e) + e.face * 14, e.y + e.h, 8, 'chip', ['sand', 'wood']);
      const foot = h.y + h.h;
      [-36, -12, 12, 36].forEach((o, i) => world.bolts.push({ x: cx(h) + o + rnd(-4, 4) - 2, y: foot - 4, w: 4, h: 4, vx: 0, vy: 0, g: 0, wait: 0.6 + i * 0.08, erupt: true,
        dmg: e.dmg * 0.8, col: C.mist, life: 2, look: 'grave', markY: foot, owner: e }));
      say1(e, 'RISE, BLADES!', C.gold);
      return;
    }
    case 'stomp': {
      e.attackPose = 'idle1';
      e.stompCool = 3.5;
      e.st = 0.4;
      shake(0.55);
      sfx.boom(0.6);
      burst(cx(e), e.y + e.h, 12, 'chip', ['paper', 'ice', 'mist']);
      for (const dir of [-1, 1]) {
        const p = e.platform;
        world.bolts.push({ x: cx(e) - 4 + dir * 10, y: e.y + e.h - 6, w: 8, h: 6, vx: dir * 150, vy: 0, g: 0, dmg: e.dmg * 0.8, col: C.ice, life: 1.5, look: 'quake', owner: e,
          ground: true, minX: p ? p.x : -1e9, maxX: p ? p.x + p.w : 1e9 });
      }
      if (Math.abs(cx(h) - cx(e)) < 30 && h.onGround && Math.abs(h.y + h.h - (e.y + e.h)) < 6) hurtHero(e.dmg, Math.sign(cx(h) - cx(e)) || e.face);
      return;
    }
    case 'howl': {
      e.howled = true;
      e.howlCool = 11;
      e.attackPose = 'howl';
      e.st = 0.6;
      say1(e, 'AWOOOO!', C.gold);
      sfx.honk();
      let n = 0;
      for (const o of world.enemies) {
        if (o.dead || o.d?.fam !== e.d.fam || Math.abs(cx(o) - cx(e)) > 180 || Math.abs(cy(o) - cy(e)) > 90) continue;
        o.rage = 6;
        o.calm = false;
        if (o !== e) n++, burst(cx(o), o.y, 4, 'dot', ['red', 'orange']);
      }
      if (n) callout(`PACK RILED x${n}`, 0, 0, C.red, { follow: e, life: 50 });
      return;
    }
    case 'rain': {
      e.rainCool = 6.5;
      e.attackPose = 'sky';
      e.st = 0.4;
      loose(e);
      for (const s of [-0.2, 0, 0.2]) arrow(e, Math.sin(s) * 60, -280, { x: cx(e) + e.face * 4 - 2, y: e.y - 4, life: 0.5, moon: true, harmless: true });
      const foot = h.y + h.h;
      const offs = [-48, -24, 0, 24, 48].map(o => o + rnd(-6, 6));
      offs.forEach((o, i) => world.bolts.push({ x: cx(h) + o - 2, y: Math.max(-8, foot - 96), w: 4, h: 6, vx: 0, vy: 0, g: 0, fall: 320, wait: 0.75 + i * 0.06,
        dmg: e.dmg * 0.8, col: C.ice, life: 2.4, look: 'arrow', moon: true, rain: true, markY: foot, owner: e }));
      return;
    }
  }
}

export function beastAttacking(e, dt, toward) {
  const h = world.hero, d = e.d;
  switch (e.move) {
    case 'shot':
      if (d.beh === 'hop') {
        if (e.hopShot && e.vy > -30) {
          e.hopShot = false;
          arrow(e, ...aimed(e, 150));
          loose(e);
        }
        if (!e.hopShot && e.onGround) e.st = Math.min(e.st, 0);
      }
      break;
    case 'roll':
      if (!e.hitDone && overlap(e, h)) (e.hitDone = true), hurtHero(e.dmg, e.face);
      if (Math.random() < 0.4) emit(cx(e), e.y + e.h, 'dust', C.fog);
      if (e.hitWall || Math.abs(e.vx) < 5) e.st = 0;
      break;
    case 'whirl': {
      const box = { x: e.x - 8, y: e.y, w: e.w + 16, h: e.h };
      if (overlap(box, h)) hurtHero(e.dmg, Math.sign(cx(h) - cx(e)) || e.face);
      if (Math.abs(e.vx) < 5 || e.hitWall) e.spinDir = -e.spinDir; // bounces off the ledge's edge
      e.vx = e.spinDir * 120;
      if (Math.random() < 0.5) emit(cx(e), e.y + e.h, 'dust', C.mist);
      break;
    }
    case 'leap':
      if (e.onGround && world.t - e.leapAt > 0.15) {
        // the landing: a crash, a shockwave both ways, and anyone right there is hit
        e.st = 0;
        e.vx = 0;
        shake(0.6);
        sfx.boom(0.7);
        burst(cx(e), e.y + e.h, 14, 'chip', ['sand', 'mist', 'paper']);
        for (const dir of [-1, 1]) {
          const p = e.platform;
          world.bolts.push({ x: cx(e) - 4 + dir * 12, y: e.y + e.h - 6, w: 8, h: 6, vx: dir * 150, vy: 0, g: 0, dmg: e.dmg * 0.7, col: C.sand, life: 1.2, look: 'quake', owner: e,
            ground: true, minX: p ? p.x : -1e9, maxX: p ? p.x + p.w : 1e9 });
        }
        if (Math.abs(cx(h) - cx(e)) < 26 && Math.abs(h.y + h.h - (e.y + e.h)) < 10) hurtHero(e.dmg * 1.2, Math.sign(cx(h) - cx(e)) || e.face);
      }
      break;
    case 'flurry':
      swing(e, h);
      e.vx *= 0.9;
      // three cuts: forward, back up, and a big one down
      if (e.st <= 0 && e.combo < 2) {
        e.combo++;
        e.hitDone = false;
        e.attackPose = e.combo === 1 ? 'loose2' : 'loose3';
        e.vx = e.face * (e.combo === 2 ? 150 : 100);
        e.st = e.combo === 2 ? 0.22 : 0.16;
        e.face = toward;
        sfx.enemyMelee();
      }
      break;
    case 'poke':
    case 'slash':
    case 'sbash':
    case 'lunge':
    case 'riposte':
    case 'cleave':
      swing(e, h);
      e.vx *= e.move === 'lunge' ? 0.97 : 0.9;
      break;
    case 'bash':
    case 'claw': {
      swing(e, h);
      e.vx *= 0.9;
      // the Wolf Pup's backflip: up and away, a shot on the way down
      if (e.move === 'bash' && e.st <= 0 && !e.flipped) {
        e.flipped = true;
        e.vy = -210;
        e.vx = -e.face * 120;
        e.onGround = false;
        e.pose = 'flip';
        e.flipShot = true;
        e.st = 1.1;
      }
      if (e.flipShot && e.vy > -20) {
        e.flipShot = false;
        e.pose = 'loose';
        e.face = toward;
        arrow(e, ...aimed(e, 160));
        loose(e);
      }
      if (e.flipped && !e.flipShot && e.onGround) e.st = Math.min(e.st, 0);
      break;
    }
  }
  if (e.st > 0) return;
  // finished: what comes after
  if (e.move === 'roll') {
    // shake the stuck arrows loose: a spray up and out
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * (0.15 + (i / 6) * 0.7);
      arrow(e, Math.cos(a) * 130, Math.sin(a) * 130, { x: cx(e) - 2, y: e.y + 2, g: 320, dmg: e.dmg * 0.6, life: 2 });
    }
    burst(cx(e), e.y + 4, 6, 'chip', ['wood', 'lime']);
    say1(e, 'SHAKE!', C.sand);
  }
  if (e.relocate) {
    // the Moss Stalker slips off to a new spot on its ledge
    e.relocate = false;
    const p = e.platform;
    if (p) {
      burst(cx(e), cy(e), 8, 'smoke', ['lime', 'fog']);
      const lo = p.x + 4, hi = p.x + p.w - 4 - e.w, opts = [e.x - rnd(40, 80), e.x + rnd(40, 80)].filter(x => x >= lo && x <= hi);
      if (opts.length) e.x = opts[Math.floor(Math.random() * opts.length)];
      burst(cx(e), cy(e), 6, 'smoke', ['lime', 'fog']);
      e.alpha = 0.22;
    }
  }
  if (e.move === 'whirl') {
    e.pose = null;
    e.stun = Math.max(e.stun, 1.1); // dizzy: hit it now
    say1(e, 'DIZZY...', C.gold);
    burst(cx(e), e.y - 2, 6, 'twinkle', ['gold', 'paper']);
  }
  e.flipped = false;
  const cool = { hop: 1.3, roll: 1.9, lob: 1.9, twin: 1.6, fan: 1.8, snipe: 2.6, kite: 1.2, frost: 1.6, greatbow: 2.2, alpha: 1.1,
    poke: 1.2, honk: 1.2, shield: 1.3, lunge: 1.9, toss: 1.0, whirl: 2.2, phase: 1.3, flurry: 1.6, parry: 1.2, warlord: 1.4 }[d.beh] || 1.5;
  done(e, ['howl', 'rain', 'stomp', 'leap', 'graves'].includes(e.move) ? 0.6 : cool);
}

// ---------------------------------------------------------------- hits and deaths (combat.js)
export function beastHit(e) {
  if (e.d.beh === 'fan' && (e.hits = (e.hits || 0) + 1) % 4 === 0 && !e.dead) {
    e.bristleT = 0.3;
    say1(e, 'BRISTLE!', C.red);
  }
}
// Twin Tuft: knocked apart, it is two Fuzzlets
export function beastDeath(e) {
  if (e.d.beh !== 'twin' || e.eaten) return;
  for (const dir of [-1, 1]) {
    const k = spawnEnemy('fuzzlet', cx(e) + dir * 6, e.y + e.h, { wave: world.wave });
    k.spawnT = 0;
    k.calm = false;
    k.swarm = e.swarm;
    k.vx = dir * 70;
    k.vy = -170;
    k.onGround = false;
    k.kbT = 0.35;
    k.cool = 1;
  }
  say1(e, 'SPLIT!', C.sand);
}
// before a hit lands: true when the beast shrugs it off whole. The Grave Goose is a ghost until it
// attacks; the Black Swan on guard parries a hit from the front and ripostes.
export function beastGuard(e, dir, o) {
  if (e.phased && !o.special) {
    if (!o.chain && world.t > (e.phaseSaid ?? -9) + 0.6) (e.phaseSaid = world.t), say1(e, 'PHASED', C.ice);
    return true;
  }
  if (e.guarding && e.state === 'wind' && e.face === -dir && !o.special && !o.chip) {
    e.guarding = false;
    e.guardCool = 3;
    sfx.clang();
    say1(e, 'PARRY!', C.gold);
    burst(cx(e) + e.face * 8, cy(e), 8, 'twinkle', ['paper', 'gold']);
    wind(e, 0.14, 'draw', 'riposte');
    return true;
  }
  return false;
}
// heavy beasts (the Greatbow Yeti) barely budge from light hits
export const beastPush = (e, push) => (e.d.heavy ? push * 0.3 : push);

// ---------------------------------------------------------------- drawing
// which named frame (art-src/beastkin.py) to show
export function beastFrame(e, t, art) {
  const F = art.frames, at = n => Math.max(0, F.indexOf(n));
  if (e.flash > 0 || e.dead) return at('hit');
  if (e.state === 'attack' || e.pose) {
    const pose = e.pose || e.attackPose;
    if (pose === 'roll') return at(Math.floor(t * 14) % 2 ? 'roll1' : 'roll0');
    if (pose === 'spin') return at('spin' + (Math.floor(t * 18) % 3));
    if (F.includes(pose)) return at(pose);
  }
  if (e.state === 'wind') return at(F.includes(e.windPose) ? e.windPose : 'draw');
  if (e.state === 'recover' && e.st > 0.15) return at('loose');
  if (!e.onGround && !e.air && F.includes('jump')) return at('jump');
  if (e.unarmed) return at(Math.abs(e.vx) > 8 && Math.floor(e.anim * 6) % 2 ? 'bare1' : 'bare0');
  if (Math.abs(e.vx) > 8) return at('walk' + (Math.floor(e.anim * 9) % 4));
  return at(Math.floor(e.anim * 1.8) % 2 ? 'idle1' : 'idle0');
}

// arrows: a shaft along the flight path, a steel (or ice, or moon) head and red fletching. A
// waiting rain arrow shows only its mark on the ground.
export function drawArrow(b, t) {
  if (b.rain && b.wait > 0) {
    if (Math.floor(t * 12) % 2 || b.wait < 0.25) {
      const x = Math.round(b.x + 2), y = Math.round(b.markY);
      rect(x - 3, y - 1, 7, 1, C.red);
      px(x, y - 2, C.coral);
    }
    return true;
  }
  const a = Math.atan2(b.vy, b.vx), dx = Math.cos(a), dy = Math.sin(a);
  const L = b.heavy ? 9 : b.quill ? 3 : b.long ? 7 : 5, x0 = b.x + b.w / 2 - dx * L / 2, y0 = b.y + b.h / 2 - dy * L / 2;
  const shaft = b.quill ? C.paper : b.moon ? C.mist : b.heavy ? C.paper : C.wood;
  const head = b.frost ? C.ice : b.moon ? C.paper : C.mist;
  for (let i = 0; i <= L; i++) px(Math.round(x0 + dx * i), Math.round(y0 + dy * i) + 1, C.ink); // a shadow underneath
  for (let i = 0; i <= L; i++) px(Math.round(x0 + dx * i), Math.round(y0 + dy * i), i >= L - 1 ? head : shaft);
  if (b.heavy) for (let i = 0; i <= L; i++) px(Math.round(x0 + dx * i - dy), Math.round(y0 + dy * i + dx), i >= L - 2 ? head : C.sand);
  if (!b.quill) {
    px(Math.round(x0 - dy), Math.round(y0 + dx), b.frost ? C.paper : C.red);
    px(Math.round(x0 + dy), Math.round(y0 - dx), b.frost ? C.paper : C.red);
  } else px(Math.round(x0), Math.round(y0), C.red);
  if (b.frost && Math.random() < 0.4) emit(b.x + 2, b.y + 2, 'dot', C.ice);
  return true;
}
export function drawQuake(b, t) {
  const x = Math.round(b.x), y = Math.round(b.y), k = Math.floor(t * 20) % 2;
  rect(x - 1, y + 2 - k, b.w + 2, 5 + k, C.ink);
  rect(x, y + 3 - k, b.w, 3 + k, C.ice);
  rect(x + 2, y + 2 - k, b.w - 4, 1, C.paper);
  if (Math.random() < 0.5) emit(x + b.w / 2, y + 2, 'dust', C.mist);
  return true;
}

// the Blade Tosser's sword, end over end
export function drawSpinSword(b, t) {
  const x = Math.round(b.x + 3), y = Math.round(b.y + 3), a = t * 18, dx = Math.cos(a), dy = Math.sin(a);
  for (let i = -4; i <= 4; i++) px(Math.round(x + dx * i), Math.round(y + dy * i) + 1, C.ink);
  for (let i = -4; i <= 4; i++) px(Math.round(x + dx * i), Math.round(y + dy * i), i < -1 ? C.wood : i === -1 ? C.gold : C.paper);
  px(Math.round(x - dy * 2 - dx), Math.round(y + dx * 2 - dy), C.gold);
  px(Math.round(x + dy * 2 - dx), Math.round(y - dx * 2 - dy), C.gold);
  return true;
}
// the War Gander's grave swords: a cracking mark, then a blade bursting up out of the ground
export function drawGrave(b, t) {
  const x = Math.round(b.x + 2), y = Math.round(b.markY);
  if (b.wait > 0) {
    if (Math.floor(t * 14) % 2 || b.wait < 0.2) {
      rect(x - 3, y - 1, 7, 1, C.red);
      px(x - 1, y - 2, C.coral);
      px(x + 1, y - 2, C.coral);
    }
    return true;
  }
  const up = Math.min(14, Math.round((0.45 - b.life) * 120) + 6);
  rect(x - 2, y - up - 1, 5, up + 1, C.ink);
  rect(x - 1, y - up, 3, up, C.mist);
  rect(x - 1, y - up, 1, up, C.paper);
  rect(x - 3, y - 4, 7, 2, C.wood);
  px(x, y - up - 1, C.paper);
  return true;
}
// what a beast shows before it acts: the Goose Fencer's lunge line, the War Gander's landing spot
export function drawTell(e, t) {
  if (e.state === 'wind' && e.move === 'lunge' && Math.floor(t * 16) % 2) {
    const y = Math.round(e.y + e.h - 1), x0 = Math.round(cx(e) + e.face * 8);
    for (let i = 0; i < 80; i += 4) px(x0 + e.face * i, y, C.red);
  }
  if (e.move === 'leap' && e.state === 'attack' && !e.onGround) {
    const x = Math.round(e.leapX), y = Math.round(world.hero.y + world.hero.h - 1);
    rect(x - 8, y, 17, 1, Math.floor(t * 14) % 2 ? C.red : C.coral);
    rect(x - 5, y - 1, 11, 1, C.ink);
  }
}
