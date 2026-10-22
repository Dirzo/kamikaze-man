// Enemies: one state machine (idle -> wind -> attack -> recover) with per-kind behaviour.
// Knockback/stagger come from combat.js; while kbT/stun run the AI waits.
import { C, W, GROUND } from '../config.js';
import { A } from '../engine/assets.js';
import { frame, rect, text, X, px, tinted } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { world, newId } from './world.js';
import { move, overlap, cx, cy, worldWidth, worldFloor } from './physics.js';
import { ENEMIES, ELITE_TITLES, LINES, deathOf } from '../data/enemies.js';
import { refHP, refDmg, ELITE_HP, ELITE_DMG, ENEMY_HP } from '../data/curve.js';
import { hurtHero, tickStatus, explode, kill, shatter, DEATH_T, SHATTER_T } from './combat.js';
import { emit, burst } from './fx.js';
import { say, updateBubble } from './bubbles.js';
import { drawItem } from './drops.js';
import { makeWeapon } from './loot.js';
import { fireTrait, traitBolt, drawTraitBolt } from './traits.js';
import { callout } from './fx.js';
import { temper, modOn } from '../data/temper.js';
import { MOVE } from '../data/feel.js';

const pickLine = a => a[Math.floor(Math.random() * a.length)];

export function spawnEnemy(type, x, y, { elite = false, asleep = false, wave = 1 } = {}) {
  const d = ENEMIES[type],
    art = A.enemies[type];
  const w = Math.max(8, Math.round((art.w - 2) * 0.72)),
    h = art.h - 2;
  const z = world.zone;
  const F = world.foeScale || { hp: 1, dmg: 1 }; // later levels of a world are tougher (waves.js)
  const T = temper(world.temper); // and so is every level at a post-game TEMPER (data/temper.js)
  const hp = Math.round(refHP(z) * ENEMY_HP * d.hp * (elite ? ELITE_HP : 1) * (1 + 0.06 * (wave - 1)) * F.hp * T.hp);
  const e = {
    id: newId(),
    type,
    kind: d.kind,
    d,
    name: elite ? `${ELITE_TITLES[Math.floor(Math.random() * ELITE_TITLES.length)]} ${d.name}` : d.name,
    x: Math.max(2, Math.min(worldWidth() - 2 - w, x - w / 2)),
    y: d.air ? y : Math.min(y, worldFloor()) - h,
    w,
    h,
    vx: 0,
    vy: 0,
    face: world.hero && cx(world.hero) < x ? -1 : 1,
    hp,
    max: hp,
    dmg: refDmg(z) * d.dmg * (elite ? ELITE_DMG : 1) * F.dmg * T.dmg,
    speed: d.speed * (elite ? 1.1 : 1) * T.speed,
    ward: modOn(T.n, 'warded') && Math.random() < 0.25 ? 1 : 0,
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
    xp: Math.max(1, Math.round((2 + z) * (elite ? 3 : 0.85))), // 0.85 (was 1): maps are MapleStory-dense now
    cool: 0.6 + Math.random() * 0.8,
    honkT: 1 + Math.random() * 3,
    grumbleT: 8 + Math.random() * 6,
    anim: Math.random() * 10,
    calm: true, // wanders its platform until the hero comes close or hits it
    wanderT: Math.random() * 2,
    wanderDir: Math.random() < 0.5 ? -1 : 1,
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
  e.white = Math.max(0, (e.white || 0) - dt);
  e.alertT = Math.max(0, (e.alertT || 0) - dt);
  e.anim += dt;
  if (e.dead) {
    e.deathT -= dt;
    e.vx *= e.launched ? Math.pow(0.97, dt * 60) : 0.9; // a launched body keeps flying
    const air = deathOf(e.type) === 'rise' && !e.launched;
    if (air) (e.vy = -26), (e.y += e.vy * dt);
    else {
      const was = e.onGround, vx = e.vx;
      move(e, dt, world.platforms, { air: false });
      if (e.launched && e.hitWall) (e.vx = -vx * 0.6), burst(cx(e), cy(e), 4, 'dust', ['mist', 'fog']); // off the wall
      if (e.onGround && !was && !e.landed) (e.landed = true), burst(cx(e), e.y + e.h, 5, 'dust', ['mist', 'fog']);
    }
    if (e.deathT <= SHATTER_T) shatter(e);
    return;
  }
  if (e.hp <= 0) { kill(e); return; }
  tickStatus(e, dt);
  // TEMPER: REGENERATION: a resident left alone for a few seconds knits itself back together
  if (e.hp < e.max && !e.swarm && world.t - (e.lastHitAt ?? -9) > 3 && modOn(world.temper, 'regen')) e.hp = Math.min(e.max, e.hp + e.max * 0.04 * dt);
  if (e.dead) return;
  if (e.spawnT > 0) {
    e.spawnT -= dt;
    return;
  }
  // Undiscovered packs hold their ground until the hero reaches their part of the map.
  // This keeps the whole route from collapsing into one giant horde at the entrance.
  if (world.map && (Math.abs(cx(hero)-cx(e))>320 || Math.abs(cy(hero)-cy(e))>115)) { e.vx=0; return; }
  const slow = e.chill > 0 ? 0.5 : 1;
  const physics = () => move(e, dt, world.platforms, { air: e.air, gravity: 760 });
  // knockback slide, then friction while staggered
  if (e.kbT > 0) {
    e.kbT -= dt;
    physics();
    return;
  }
  // launched into the air: helpless until it lands (follow-up hits keep it up)
  if (e.juggle) {
    if (e.onGround && e.vy >= 0) e.juggle = false;
    else e.stun = Math.max(e.stun, 0.05);
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
  // MapleStory touch damage: walking into a riled-up resident hurts (a dash goes through safely).
  // Calm, staggered, juggled and just-woken residents don't.
  if (!e.calm && !e.swarmBoss && e.stun <= 0 && e.kbT <= 0 && !(e.wakeT > 0) && e.state !== 'sleep' && e.state !== 'disguised') {
    const body = { x: e.x + 2, y: e.y + 2, w: e.w - 4, h: e.h - 3 };
    if (overlap(body, hero)) hurtHero(e.dmg * MOVE.touchDmg, Math.sign(cx(hero) - cx(e)) || -hero.face);
  }
  // Residents own their platform: they never walk (or get nudged) off its edge on their own,
  // so a sniper on a ledge stays a sniper on a ledge. Only knockback can throw them off.
  if (!e.air && e.onGround && e.platform) {
    const p = e.platform,
      lo = p.x + 2 - e.w / 2,
      hi = p.x + p.w - 2 - e.w / 2;
    e.x = Math.max(lo, Math.min(hi, e.x));
    if ((e.vx < 0 && e.x + e.vx * dt < lo) || (e.vx > 0 && e.x + e.vx * dt > hi)) {
      e.vx = 0;
      if (e.kind === 'roller' && e.state === 'attack') e.st = 0; // a barrel stops at the edge
    }
  }
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

export function provoke(e) {
  if (!e.calm) return;
  notice(e, 0);
  alertPack(e);
}
// one resident notices you: a little "!" over its head, a hop and a turn to face you, and a beat
// before it comes at you (its trick comes a moment later)
function notice(e, delay) {
  const hero = world.hero;
  e.calm = false;
  e.cool = Math.max(e.cool, 0.5 + delay);
  if (world.t > (e.alertedAt || -9) + 4) {
    e.alertT = 0.6;
    if (!e.air && e.onGround && !e.juggle) (e.vy = -90), (e.onGround = false);
    e.wakeT = Math.max(e.wakeT || 0, 0.3 + delay);
  }
  if (hero) e.face = Math.sign(cx(hero) - cx(e)) || e.face;
  e.alertedAt = world.t;
  e.traitT = Math.max(e.traitT || 0, 1.4 + Math.random());
}
// the rest of its pack (same floor, close by) notices together, one after another
export function alertPack(e) {
  e.packAlerted = true;
  for (const n of world.enemies) {
    if (n === e || n.dead || !n.calm || n.boss || n.swarm || n.state === 'sleep' || n.state === 'disguised') continue;
    if (Math.abs(cx(n) - cx(e)) > 80 || Math.abs(n.y + n.h - (e.y + e.h)) > 10) continue;
    n.packAlerted = true;
    notice(n, 0.04 + Math.random() * 0.14);
  }
}
// stroll back and forth on the home platform, pausing now and then
function wander(e, dt, slow) {
  if ((e.wanderT -= dt) <= 0) {
    e.wanderT = 1.2 + Math.random() * 2.2;
    e.wanderDir = Math.random() < 0.3 ? 0 : Math.random() < 0.5 ? -1 : 1;
  }
  if (e.wanderDir) e.face = e.wanderDir;
  e.vx = e.wanderDir * e.speed * 0.45 * slow;
  if (e.air) e.vy = (e.hoverY + Math.sin(e.anim * 1.6) * 6 - e.y) * 2;
  // turn around at the platform edge instead of pressing into it
  const p = e.platform;
  if (!e.air && p && ((e.vx < 0 && e.x < p.x + 6) || (e.vx > 0 && e.x + e.w > p.x + p.w - 6))) { e.wanderDir *= -1; e.vx = 0; }
  // packs mill about their own spot and give each other room instead of piling into one blob
  if (e.homeX == null) e.homeX = e.x;
  if ((e.vx < 0 && e.x < e.homeX - 28) || (e.vx > 0 && e.x > e.homeX + 28)) { e.wanderDir *= -1; e.vx = 0; }
  const dir = Math.sign(e.vx);
  if (dir && world.enemies.some(n => n !== e && !n.dead && n.calm && Math.abs(cy(n) - cy(e)) < 12 && Math.sign(cx(n) - cx(e)) === dir && Math.abs(cx(n) - cx(e)) < (n.w + e.w) / 2 + 4)) { e.wanderDir = -dir; e.vx = 0; }
}
function think(e, dt, dxh, dist, toward, slow) {
  const d = e.d,
    hero = world.hero;
  const sameLevel = Math.abs(cy(hero) - cy(e)) < 28 || e.air;
  // Residents are peaceful until you get close or hit them, and settle down again once you leave.
  if (!e.swarm && !e.boss) {
    const ranged = e.kind === 'ranged' || e.kind === 'summon' || e.kind === 'sniper';
    if (e.calm && sameLevel && dist < (ranged ? 130 : 70)) provoke(e);
    else if (!e.calm && (dist > 260 || Math.abs(cy(hero) - cy(e)) > 90)) e.calm = true;
    if (e.calm) return wander(e, dt, slow);
  }
  e.face = toward;
  // the alerted trick (traits.js): on its own slow timer, slower still in the swarm
  const A = d.alert;
  if (A && !e.swarmBoss && dist < (A.range || 140) && Math.abs(cy(hero) - cy(e)) < 70) {
    e.traitT = (e.traitT ?? 1.2 + Math.random()) - dt;
    if (e.traitT <= 0) {
      e.traitT = A.every * (e.swarm ? 2.2 : 1) * (0.85 + Math.random() * 0.3);
      e.trait = true;
      windup(e, A.wind || 0.4);
      return;
    }
  }
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
        e.x = Math.max(4, Math.min(worldWidth() - 4 - e.w, cx(hero) + side * 24 - e.w / 2));
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
  if (e.trait) {
    e.trait = false;
    e.hitDone = true; // a trick, not a lunge: no body hitbox
    e.vx = 0;
    e.st = 0.25;
    fireTrait(e);
    return;
  }
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
      // lunges stop at the platform edge instead of carrying the attacker off it
      if (!e.air && e.platform) {
        const p = e.platform,
          room = e.face > 0 ? p.x + p.w - cx(e) : cx(e) - p.x;
        e.vx = e.face * Math.min(Math.abs(e.vx), Math.max(0, room - 4) / 0.4);
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
    if (!e.swarm) e.cool *= 1.6; // map residents breathe between attacks; the swarm doesn't
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
    const used = traitBolt(b, dt);
    if (used) { if (used === 'hit') hurtHero(b.dmg, Math.sign(cx(hero) - b.x) || 1); world.bolts.splice(i, 1); continue; }
    if (world.map?.solids.some(p=>overlap(b,p))) {world.bolts.splice(i,1);continue;}
    if (Math.random() < 0.5) emit(b.x + 2, b.y + 2, 'dot', b.col);
    if (overlap(b, hero) && hero.inv <= 0 && hero.dashT <= 0) {
      hurtHero(b.dmg, Math.sign(b.vx) || 1);
      b.life = 0;
    }
    if (b.life <= 0 || b.x < -10 || b.x > worldWidth() + 10 || b.y > worldFloor() + 4 || b.y < -20) world.bolts.splice(i, 1);
  }
}
export function drawBolts(t = world.t) {
  for (const b of world.bolts) {
    if (b.look && drawTraitBolt(b, t)) continue;
    const x = Math.round(b.x),
      y = Math.round(b.y);
    rect(x - 1, y - 1, 6, 6, C.ink);
    rect(x, y, 4, 4, b.col);
    px(x + 1, y + 1, C.paper);
  }
}

// ---------------------------------------------------------------- draw
// while the world is frozen on a hit, the struck foe shakes side to side (px offset)
export function jitter(e) {
  if (!e.jitAt) return 0;
  const age = performance.now() - e.jitAt;
  if (age > e.jitFor) return 0;
  return Math.floor(age / 34) % 2 ? 1 : -1;
}
export function drawEnemy(e, t) {
  const art = A.enemies[e.type];
  const sx = Math.round(cx(e) - art.w / 2) + (e.dead ? 0 : jitter(e)),
    sy = Math.round(e.y + e.h - (art.h - 1));
  if (e.spawnT > 0 && Math.floor(t * 30) % 2) return;
  if (e.dead && (e.shattered || e.deathT <= SHATTER_T)) return; // it has burst into shards
  if (e.state === 'disguised') return drawDisguise(e, t);
  if (e.scale || e.dead) {
    // swarm bosses: the same resident drawn big, scaled about its feet. A fallen one also takes
    // its death pose (DEATHS in data/enemies.js) about its feet or its middle.
    const k = e.scale || 1,
      fx = cx(e),
      fy = e.y + e.h;
    X.save();
    if (e.dead && !deathPose(e, fx, fy, k, t)) return X.restore();
    X.translate(fx, fy);
    X.scale(k, k);
    X.translate(-fx, -fy);
    drawBody(e, t, Math.round(fx - art.w / 2) + jitter(e), Math.round(fy - (art.h - 1)), art);
    X.restore();
    if (e.state === 'wind' && e.kind === 'sniper' && !e.dead) aimLine(e, t);
    return;
  }
  drawBody(e, t, sx, sy, art);
}
// the fall-over: p runs 0..1 over the fall, then the body holds still (blinking) until it shatters.
// Returns false on a blink frame.
function deathPose(e, fx, fy, k, t) {
  const fall = DEATH_T - SHATTER_T - 0.18,
    p = Math.min(1, (DEATH_T - e.deathT) / fall),
    ease = 1 - (1 - p) * (1 - p),
    dir = e.fallDir || 1,
    h = e.h * k;
  if (p >= 1 && Math.floor(t * 24) % 2) return false; // about to burst
  const about = (px0, py0, fn) => (X.translate(px0, py0), fn(), X.translate(-px0, -py0));
  switch (e.launched ? 'spin' : deathOf(e.type)) {
    case 'topple': // tip over the far foot, onto its back
      about(fx + (dir * e.w * k) / 2, fy, () => X.rotate(dir * ease * Math.PI * 0.5));
      break;
    case 'flip': // hop, turn belly-up and land that way
      about(fx, fy - h / 2, () => X.scale(1, Math.cos(ease * Math.PI) || 0.01));
      break;
    case 'spin': // tumble end over end
      about(fx, fy - h / 2, () => X.rotate(dir * ease * Math.PI * 3));
      break;
    case 'squash': // flatten into a pancake
      about(fx, fy, () => X.scale(1 + ease * 0.6, Math.max(0.25, 1 - ease * 0.75)));
      break;
    case 'rise': // float up and thin out
      if (p > 0.4 && Math.floor(t * 30) % 2) return false;
      about(fx, fy - h / 2, () => X.scale(1 - ease * 0.3, 1 + ease * 0.2));
      break;
  }
  return true;
}
function drawBody(e, t, sx, sy, art) {
  let f = 0;
  if (e.flash > 0 || e.dead) f = 2;
  else if (Math.abs(e.vx) > 8 || e.air) f = Math.floor(e.anim * 8) % 2;
  const bob = e.d.float ? Math.round(Math.sin(e.anim * 3) * 2) : 0;
  frame(e.white > 0 && !e.dead ? tinted(art.im, C.paper) : art.im, f, art.w, art.h, sx, sy + bob - (e.state === 'wind' && e.kind === 'bomb' && Math.floor(t * 16) % 2 ? 1 : 0), e.face < 0);
  // faces, eyes and blush are part of each sprite (art-src/cute_enemies.py); hits squeeze them shut
  if (e.dead) return;
  // a secret room's golden pack glitters; a TEMPER ward is a violet ring
  if (e.golden && Math.floor(t * 8 + e.id) % 3 === 0) px(Math.round(e.x + ((e.anim * 37) % e.w)), Math.round(e.y + ((e.anim * 53) % e.h)), C.gold);
  if (e.ward) for (let a = 0; a < 12; a++) if ((a + Math.floor(t * 8)) % 3) px(Math.round(cx(e) + Math.cos((a * Math.PI) / 6) * (e.w / 2 + 4)), Math.round(cy(e) + Math.sin((a * Math.PI) / 6) * (e.h / 2 + 3)), C.violet);
  // noticed you: a gold "!" that pops up over its head
  if (e.alertT > 0) {
    const mx = Math.round(cx(e)), top = sy - 14 - (e.alertT > 0.5 ? 2 : 0);
    rect(mx - 2, top - 1, 5, 11, C.ink);
    rect(mx - 1, top, 3, 6, C.gold);
    rect(mx - 1, top + 7, 3, 2, C.gold);
  }
  // elite marker: small gold chevron
  if (e.elite) {
    const mx = Math.round(cx(e)),
      my = sy - 15;
    rect(mx - 3, my - 1, 7, 4, C.ink);
    rect(mx - 2, my, 5, 1, C.gold);
    rect(mx - 1, my + 1, 3, 1, C.gold);
  }
  // health bar once damaged (elites always): outlined, with a lagging "damage taken" segment
  if ((e.hp < e.max || e.elite) && !e.swarmBoss) healthBar(e, sy, t);
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
    if (e.kind === 'sniper' && !e.scale) aimLine(e, t);
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
