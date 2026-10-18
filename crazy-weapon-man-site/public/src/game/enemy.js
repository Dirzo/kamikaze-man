// Enemies: one state machine (idle -> wind -> attack -> recover) with per-kind behaviour.
// Knockback/stagger come from combat.js; while kbT/stun run the AI waits.
import { C, W, GROUND } from '../config.js';
import { A } from '../engine/assets.js';
import { frame, rect, text, X, px } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { world, newId } from './world.js';
import { move, overlap, cx, cy } from './physics.js';
import { ENEMIES, ELITE_TITLES, LINES } from '../data/enemies.js';
import { refHP, refDmg, ELITE_HP, ELITE_DMG, ENEMY_HP } from '../data/curve.js';
import { hurtHero, tickStatus, explode } from './combat.js';
import { emit, burst } from './fx.js';
import { say, updateBubble } from './bubbles.js';
import { drawItem } from './drops.js';
import { makeWeapon } from './loot.js';

const pickLine = a => a[Math.floor(Math.random() * a.length)];

export function spawnEnemy(type, x, y, { elite = false, asleep = false, wave = 1 } = {}) {
  const d = ENEMIES[type],
    art = A.enemies[type];
  const w = Math.max(8, Math.round((art.w - 2) * 0.72)),
    h = art.h - 2;
  const z = world.zone;
  const hp = Math.round(refHP(z) * ENEMY_HP * d.hp * (elite ? ELITE_HP : 1) * (1 + 0.06 * (wave - 1)));
  const e = {
    id: newId(),
    type,
    kind: d.kind,
    d,
    name: elite ? `${ELITE_TITLES[Math.floor(Math.random() * ELITE_TITLES.length)]} ${d.name}` : d.name,
    x: Math.max(2, Math.min(W - 2 - w, x - w / 2)),
    y: d.air ? y : Math.min(y, GROUND) - h,
    w,
    h,
    vx: 0,
    vy: 0,
    face: world.hero && cx(world.hero) < x ? -1 : 1,
    hp,
    max: hp,
    dmg: refDmg(z) * d.dmg * (elite ? ELITE_DMG : 1),
    speed: d.speed * (elite ? 1.1 : 1),
    elite,
    air: !!d.air,
    state: asleep ? 'sleep' : d.kind === 'mimic' ? 'disguised' : 'idle',
    asleep,
    sleeper: asleep,
    disguised: d.kind === 'mimic',
    st: 0,
    stun: 0,
    kbT: 0,
    flash: 0,
    spawnT: asleep || d.kind === 'mimic' ? 0 : 0.45,
    onGround: false,
    xp: Math.round((2 + z) * (elite ? 3 : 1)),
    cool: 0.6 + Math.random() * 0.8,
    honkT: 1 + Math.random() * 3,
    grumbleT: 8 + Math.random() * 6,
    anim: Math.random() * 10,
    bubble: null,
    dead: false
  };
  if (e.air) e.hoverY = y;
  if (e.disguised) e.fake = makeWeapon(z, { q: Math.min(10, z + 2 + Math.floor(Math.random() * 3)) });
  world.enemies.push(e);
  if (e.spawnT > 0) burst(cx(e), cy(e), 10, 'smoke', ['fog', 'stone', 'mist']);
  return e;
}

// ---------------------------------------------------------------- update
export function updateEnemy(e, dt) {
  const hero = world.hero;
  updateBubble(e, dt);
  e.flash = Math.max(0, e.flash - dt);
  e.anim += dt;
  if (e.dead) {
    e.deathT -= dt;
    e.vx *= 0.9;
    move(e, dt, world.platforms, { air: false });
    return;
  }
  tickStatus(e, dt);
  if (e.dead) return;
  if (e.spawnT > 0) {
    e.spawnT -= dt;
    return;
  }
  const slow = e.chill > 0 ? 0.5 : 1;
  const physics = () => move(e, dt, world.platforms, { air: e.air, gravity: 760, dropThrough: e.dropT > 0 });
  // knockback slide, then friction while staggered
  if (e.kbT > 0) {
    e.kbT -= dt;
    physics();
    return;
  }
  if (e.stun > 0) {
    e.stun -= dt;
    e.vx *= Math.pow(0.84, dt * 60);
    if (e.air) e.vy *= 0.9;
    physics();
    return;
  }
  if (e.wakeT > 0) {
    e.wakeT -= dt;
    e.vx = 0;
    physics();
    return;
  }
  const dxh = cx(hero) - cx(e),
    dist = Math.abs(dxh),
    toward = Math.sign(dxh) || 1;
  const d = e.d;

  if (e.state === 'sleep') {
    e.vx = 0;
    if (dist < 60 && Math.abs(cy(hero) - cy(e)) < 40) wakeUp(e);
    physics();
    return;
  }
  if (e.state === 'disguised') {
    e.vx = 0;
    if (dist < 36 && Math.abs(cy(hero) - cy(e)) < 30) {
      e.disguised = false;
      e.state = 'wind';
      e.st = 0.25;
      e.face = toward;
      say(e, pickLine(LINES.mimic), 1.6, true);
      sfx.enemyMelee();
    }
    physics();
    return;
  }
  // ambient chatter
  if (e.type === 'goose' && (e.honkT -= dt) <= 0) {
    e.honkT = 4 + Math.random() * 5;
    if (Math.random() < 0.5) say(e, pickLine(LINES.honk), 0.9);
  }
  if (e.sleeper && (e.grumbleT -= dt) <= 0) {
    e.grumbleT = 9 + Math.random() * 8;
    say(e, pickLine(LINES.grumble), 2);
  }

  // spread out: same-level enemies don't stand inside each other (keeps every monster readable)
  if (!e.air && (e.state === 'idle' || e.state === 'recover')) {
    for (const o of world.enemies) {
      if (o === e || o.dead || o.air || o.boss || Math.abs(o.y - e.y) > 8) continue;
      const d = cx(e) - cx(o),
        min = (e.w + o.w) * 0.5 + 2;
      if (Math.abs(d) < min) e.x += (Math.sign(d) || (e.id > o.id ? 1 : -1)) * Math.min(40, (min - Math.abs(d)) * 6) * dt;
    }
  }
  // personal space: ground enemies don't stand inside the hero either
  if (!e.air && e.state !== 'attack' && Math.abs(hero.y + hero.h - (e.y + e.h)) < 10) {
    const d = cx(e) - cx(hero),
      min = (e.w + hero.w) * 0.5 + 3;
    if (Math.abs(d) < min) e.x += (Math.sign(d) || -hero.face) * Math.min(80, (min - Math.abs(d)) * 10) * dt;
  }
  e.st -= dt;
  e.cool -= dt;
  switch (e.state) {
    case 'idle':
      think(e, dt, dxh, dist, toward, slow);
      break;
    case 'wind':
      e.vx *= 0.8;
      if (e.st > 0.16 && e.kind !== 'roller' && e.kind !== 'sniper') e.face = toward;
      if (e.st <= 0) attack(e, toward);
      break;
    case 'attack':
      attacking(e, dt, toward);
      break;
    case 'recover':
      e.vx *= 0.85;
      if (e.st <= 0) e.state = 'idle';
      break;
  }
  if (!e.air && e.onGround && e.state === 'idle') {
    const dy = hero.y + hero.h - (e.y + e.h);
    if (dy < -18 && dist < 80) { e.vy = -265; e.onGround = false; }
    else if (dy > 18 && e.platform) { e.dropT = 0.3; e.y += 2; }
  }
  e.dropT = Math.max(0, (e.dropT || 0) - dt);
  physics();
}

// leftover sleepers and hidden mimics come out on their own so a wave can always finish
export function rouse(e) {
  if (e.state === 'sleep') wakeUp(e);
  else if (e.state === 'disguised') {
    e.disguised = false;
    e.state = 'idle';
    say(e, pickLine(LINES.mimic), 1.6, true);
  }
}

function wakeUp(e) {
  e.asleep = false;
  e.state = 'idle';
  e.wakeT = 0.4;
  say(e, pickLine(LINES.wake), 2.4, true);
}

function windup(e, t) {
  e.state = 'wind';
  e.st = t;
  e.vx = 0;
  if (e.type === 'goose') {
    say(e, Math.random() < 0.12 ? pickLine(LINES.honkRare) : pickLine(LINES.honk), 1.1);
    sfx.honk();
  }
}

function think(e, dt, dxh, dist, toward, slow) {
  const d = e.d,
    hero = world.hero;
  const sameLevel = Math.abs(cy(hero) - cy(e)) < 28 || e.air;
  e.face = toward;
  switch (e.kind) {
    case 'melee':
    case 'shield':
    case 'mimic':
      if (dist < d.range + 6 && sameLevel && e.cool <= 0) windup(e, d.wind);
      else e.vx = toward * e.speed * slow * (dist < (e.w + hero.w) * 0.5 + 4 ? 0 : 1);
      if (e.kind === 'shield' && dist < 60) e.vx *= 0.6;
      break;
    case 'blink':
      if (dist > 90 && e.cool <= 0) {
        burst(cx(e), cy(e), 8, 'smoke', ['violet', 'pink']);
        const side = Math.random() < 0.5 ? -1 : 1;
        e.x = Math.max(4, Math.min(W - 4 - e.w, cx(hero) + side * 24 - e.w / 2));
        e.y = Math.min(e.y, hero.y + hero.h - e.h);
        burst(cx(e), cy(e), 8, 'smoke', ['violet', 'pink']);
        e.face = -side;
        windup(e, d.wind + 0.15);
      } else if (dist < d.range + 6 && sameLevel && e.cool <= 0) windup(e, d.wind);
      else e.vx = toward * e.speed * slow;
      break;
    case 'bomb':
      if (dist < 22 && sameLevel) {
        windup(e, d.wind);
        sfx.enemyCast();
      } else e.vx = toward * e.speed * slow;
      break;
    case 'roller':
      if (dist < d.range && sameLevel && e.cool <= 0) windup(e, d.wind);
      else e.vx = toward * e.speed * slow;
      break;
    case 'ranged':
    case 'summon':
    case 'sniper': {
      const want = d.range * 0.75;
      if (e.kind === 'summon' && e.cool <= 0 && world.enemies.filter(o => !o.dead).length < 10 && Math.random() < 0.35) {
        e.summon = true;
        windup(e, d.wind);
        sfx.enemyCast();
        break;
      }
      if (dist < d.range && e.cool <= 0) {
        windup(e, d.wind);
        sfx.enemyCast();
        break;
      }
      let v = 0;
      if (dist > want + 10) v = toward;
      else if (dist < want - 30) v = -toward;
      e.vx = v * e.speed * slow;
      if (e.air) {
        const ty = e.hoverY + Math.sin(e.anim * 1.6) * 8;
        e.vy = (ty - e.y) * 2;
      }
      break;
    }
  }
}

function attack(e, toward) {
  const d = e.d,
    hero = world.hero;
  e.state = 'attack';
  e.hitDone = false;
  switch (e.kind) {
    case 'melee':
    case 'shield':
    case 'blink':
    case 'mimic':
      sfx.enemyMelee();
      if (d.style === 'leap') {
        e.vx = e.face * 150;
        e.vy = -150;
        e.st = 0.35;
      } else if (d.style === 'cleave') {
        e.vx = e.face * 40;
        e.st = 0.28;
      } else {
        e.vx = e.face * 110;
        e.st = 0.2;
      }
      break;
    case 'bomb':
      explode(cx(e), cy(e), e.dmg, true);
      e.hp = 0;
      e.dead = true;
      e.deathT = 0.01;
      break;
    case 'roller':
      e.vx = e.face * 190;
      e.st = 1.1;
      break;
    case 'ranged':
    case 'sniper':
    case 'summon': {
      if (e.summon) {
        e.summon = false;
        for (let i = 0; i < 2; i++) spawnEnemy('crawler', cx(e) + (i ? 18 : -18), e.y + e.h, { wave: world.wave });
        e.st = 0.4;
        e.cool = 6;
        break;
      }
      const sx = cx(e) + e.face * 6,
        sy = e.y + e.h * 0.4;
      const tx = cx(hero),
        ty = hero.y + hero.h * 0.5;
      const sp = e.kind === 'sniper' ? 360 : 130;
      const ang = Math.atan2(ty - sy, tx - sx);
      world.bolts.push({ x: sx - 2, y: sy - 2, w: 4, h: 4, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dmg: e.dmg, col: C[d.bolt] || C.red, life: 3, sniper: e.kind === 'sniper' });
      e.st = 0.2;
      break;
    }
  }
}

function attacking(e, dt, toward) {
  const hero = world.hero;
  if (e.kind === 'melee' || e.kind === 'shield' || e.kind === 'blink' || e.kind === 'mimic') {
    const reach = e.d.range;
    const box = { x: e.face > 0 ? cx(e) : cx(e) - reach, y: e.y, w: reach, h: e.h };
    if (!e.hitDone && overlap(box, hero)) {
      e.hitDone = true;
      hurtHero(e.dmg, e.face);
    }
    e.vx *= 0.9;
  } else if (e.kind === 'roller') {
    if (!e.hitDone && overlap(e, hero)) {
      e.hitDone = true;
      hurtHero(e.dmg, e.face);
    }
    if (Math.random() < 0.4) emit(cx(e), e.y + e.h, 'dust', C.fog);
    if (e.hitWall) e.st = 0;
  }
  if (e.st <= 0) {
    e.state = 'recover';
    e.st = e.kind === 'ranged' || e.kind === 'sniper' ? 0.6 : 0.5;
    e.cool = e.kind === 'ranged' ? 1.4 + Math.random() : e.kind === 'sniper' ? 2.2 : 0.9 + Math.random() * 0.6;
  }
}

// ---------------------------------------------------------------- bolts (enemy projectiles)
export function updateBolts(dt) {
  const hero = world.hero;
  for (let i = world.bolts.length - 1; i >= 0; i--) {
    const b = world.bolts[i];
    b.vy += (b.g || 0) * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (Math.random() < 0.5) emit(b.x + 2, b.y + 2, 'dot', b.col);
    if (overlap(b, hero) && hero.inv <= 0 && hero.dashT <= 0) {
      hurtHero(b.dmg, Math.sign(b.vx) || 1);
      b.life = 0;
    }
    if (b.life <= 0 || b.x < -10 || b.x > W + 10 || b.y > GROUND + 4 || b.y < -20) world.bolts.splice(i, 1);
  }
}
export function drawBolts() {
  for (const b of world.bolts) {
    const x = Math.round(b.x),
      y = Math.round(b.y);
    rect(x - 1, y - 1, 6, 6, C.ink);
    rect(x, y, 4, 4, b.col);
    px(x + 1, y + 1, C.paper);
  }
}

// ---------------------------------------------------------------- draw
export function drawEnemy(e, t) {
  const art = A.enemies[e.type];
  const sx = Math.round(cx(e) - art.w / 2),
    sy = Math.round(e.y + e.h - (art.h - 1));
  if (e.spawnT > 0 && Math.floor(t * 30) % 2) return;
  if (e.dead && Math.floor(e.deathT * 30) % 2) return;
  if (e.state === 'disguised') return drawDisguise(e, t);
  let f = 0;
  if (e.flash > 0 || e.dead) f = 2;
  else if (Math.abs(e.vx) > 8 || e.air) f = Math.floor(e.anim * 8) % 2;
  const bob = e.d.float ? Math.round(Math.sin(e.anim * 3) * 2) : 0;
  frame(art.im, f, art.w, art.h, sx, sy + bob - (e.state === 'wind' && e.kind === 'bomb' && Math.floor(t * 16) % 2 ? 1 : 0), e.face < 0);
  if (e.dead) return;
  // elite marker: small gold chevron
  if (e.elite) {
    const mx = Math.round(cx(e)),
      my = sy - 15;
    rect(mx - 3, my - 1, 7, 4, C.ink);
    rect(mx - 2, my, 5, 1, C.gold);
    rect(mx - 1, my + 1, 3, 1, C.gold);
  }
  // health bar once damaged (elites always): outlined, with a lagging "damage taken" segment
  if (e.hp < e.max || e.elite) healthBar(e, sy, t);
  // wind-up tell: blinking "!"
  if (e.state === 'wind') {
    const p = 1 - e.st / (e.d.wind || 0.5);
    if (p > 0.5 || Math.floor(t * 12) % 2 === 0) {
      const mx = Math.round(cx(e)),
        top = sy - 18;
      rect(mx - 3, top - 1, 7, 13, C.ink);
      rect(mx - 1, top, 3, 7, p > 0.6 ? C.paper : C.red);
      rect(mx - 1, top + 8, 3, 3, p > 0.6 ? C.paper : C.red);
    }
    if (e.kind === 'sniper') aimLine(e, t);
  }
  if (e.state === 'sleep') {
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.6 + i / 3 + e.anim) % 1;
      text('z', Math.round(e.x + e.w * 0.7 + p * 10 + i * 2), Math.round(e.y - 4 - p * 18), C.mist, { k: i === 2 ? 2 : 1 });
    }
  }
}

export function healthBar(e, sy, t) {
  const bw = Math.max(16, Math.min(34, e.w + 6)),
    bx = Math.round(cx(e) - bw / 2),
    by = sy - (e.elite ? 10 : 6);
  const frac = Math.max(0, e.hp) / e.max;
  e.hpShown = e.hpShown == null ? frac : Math.max(frac, e.hpShown - 0.012);
  rect(bx - 1, by - 1, bw + 2, 5, C.ink);
  rect(bx, by, bw, 3, C.wine);
  rect(bx, by, Math.round(bw * e.hpShown), 3, C.cream);
  rect(bx, by, Math.round(bw * frac), 3, e.elite ? C.orange : C.red);
  rect(bx, by, Math.round(bw * frac), 1, e.elite ? C.gold : C.coral);
}

function aimLine(e, t) {
  const hero = world.hero;
  const x0 = cx(e),
    y0 = e.y + e.h * 0.4,
    x1 = cx(hero),
    y1 = hero.y + hero.h * 0.5;
  const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 3);
  X.fillStyle = Math.floor(t * 16) % 2 ? C.red : C.coral;
  for (let i = 0; i < n; i += 2) X.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
}

// the mimic sits there looking exactly like a weapon drop
function drawDisguise(e, t) {
  drawItem(e.fake, cx(e), e.y + e.h, t);
}
