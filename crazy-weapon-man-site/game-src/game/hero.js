// The hero: movement (run, variable jump, coyote time, drop-through, dash), melee combos, ranged
// shots, one special per weapon type, and drawing the held weapon from the front hand.
import { HERO, C, GROUND } from '../config.js';
import { updateClimb } from './climbing.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { world, newId } from './world.js';
import { move, overlap, cx, cy } from './physics.js';
import { TYPES, MOVES, RECOVERY } from '../data/weapons.js';
import { CRIT } from '../data/curve.js';
import { heroMax, heroStats } from './perks.js';
import { hitDamage, trainingSword } from './loot.js';
import { hitEnemy } from './combat.js';
import { emit, burst, spark, shake, hitstop, callout } from './fx.js';
import { lookOf } from './looks.js';
import { attackBox, activeWindow, canAttack } from './attack-rules.js';
import { attackMutation, impactMutation } from './evolution.js';
import { quirkHit } from './quirks.js';
import { drawHeroAnimated, fireAt } from './anim.js';
import { abilityHit, swingMult, critBonus, dashCut, hasAbility } from './abilities.js';
import { heroPhysics } from './gimmicks.js';
import { charge, drawMount, RIDE } from './mount.js';
import { X } from '../engine/gfx.js';
import { MOUNT } from '../data/gimmicks.js';


export function createHero() {
  return {
    x: 60, y: GROUND - HERO.h, w: HERO.w, h: HERO.h, vx: 0, vy: 0, face: 1,
    onGround: true, coyote: 0, jumpHeld: false, dropT: 0,
    dashT: 0, dashCd: 0, inv: 1, hurtT: 0, dead: false,
    hp: heroMax(1), maxHp: heroMax(1), lv: 1, xp: 0,
    weapon: trainingSword(), cd: 0, combo: 0, comboT: 0, attack: null,
    specialCd: 0, special: null, animT: 0, landT: 0
  };
}

// ---------------------------------------------------------------- update
export function updateHero(h, dt) {
  if (h.dead) {
    h.vx *= 0.9;
    move(h, dt, world.platforms);
    return;
  }
  const T = TYPES[h.weapon.type];
  h.inv = Math.max(0, h.inv - dt);
  h.giantT = Math.max(0, (h.giantT || 0) - dt); // GROWTH SPURT quirk: the weapon is drawn huge
  h.hurtT = Math.max(0, h.hurtT - dt);
  h.cd = Math.max(0, h.cd - dt);
  h.specialCd = Math.max(0, h.specialCd - dt);
  h.dashCd = Math.max(0, h.dashCd - dt);
  h.comboT = Math.max(0, h.comboT - dt);
  h.dropT = Math.max(0, h.dropT - dt);
  h.castT = Math.max(0, (h.castT || 0) - dt);
  h.animT += dt;
  const S = heroStats();
  if (S.regen && h.hp < h.maxHp) {
    // REGENERATION / INNER PEACE: whole points only, the remainder carries over
    h.regenAcc = (h.regenAcc || 0) + h.maxHp * S.regen * dt;
    const n = Math.floor(h.regenAcc);
    if (n) { h.regenAcc -= n; h.hp = Math.min(h.maxHp, h.hp + n); }
  }

  // special moves take over movement while they run
  if (h.special) {
    updateSpecial(h, dt);
    return;
  }

  if (updateClimb(h, dt)) {
    if ((input.pressed('attack', 0.16) || input.held('attack')) && canAttack(h)) { input.consume('attack'); startAttack(h, T); }
    if (h.attack) updateAttack(h, dt, T);
    return;
  }
  const ax = input.axis();
  // the level's gimmick (water, ice) and the War Goose change how the hero moves
  const G = heroPhysics() || {}, ride = h.mount ? MOUNT : null;
  // dash (riding: a longer WAR CHARGE that bowls foes over)
  if (input.take('dash') && h.dashCd <= 0 && h.hurtT <= 0) {
    h.dashT = HERO.dashTime * (ride ? ride.chargeTime : 1);
    h.chargeHit = null;
    h.dashCd = HERO.dashCooldown * (1 - S.dashCd);
    if (ax) h.face = ax;
    h.attack = null;
    h.cd = 0;
    h.inv = Math.max(h.inv, HERO.dashTime);
    h.dashHit = null;
    sfx.dash();
    burst(cx(h), h.y + h.h - 2, 5, 'dust', ['mist', 'fog']);
  }
  if (h.dashT > 0) {
    h.dashT -= dt;
    h.vx = h.face * HERO.dashSpeed;
    h.vy = Math.min(h.vy, 0) * 0.5;
    if (Math.random() < 0.6) emit(cx(h) - h.face * 6, h.y + 6 + Math.random() * 14, 'streak', C.mist);
    move(h, dt, world.platforms, { gravity: 0 });
    dashCut(h);
    if (ride) charge(h);
    return;
  }
  // run
  if (h.hurtT <= 0) {
    const target = ax * HERO.speed * (1 + S.speed) * (G.speed || 1) * (ride ? ride.speed : 1);
    // on ice you slide: turning round (pushing against your own slide) grips a little better
    const a = ax ? HERO.accel * (G.accel || 1) * (G.accel && Math.sign(h.vx) === -ax ? 1.6 : 1) : HERO.friction * (G.friction || 1);
    h.vx += Math.sign(target - h.vx) * Math.min(Math.abs(target - h.vx), a * dt);
    if (ax) {
      if (h.face !== ax) h.trail = null; // a turn starts a fresh blade trail
      h.face = ax;
    }
  }
  // jump / drop-through
  h.coyote = h.onGround ? HERO.coyote : Math.max(0, h.coyote - dt);
  if (h.onGround || h.ladder) h.hopped = false;
  if (input.pressed('jump', HERO.jumpBuffer) && h.hurtT <= 0) {
    if (input.held('down') && h.onGround && h.platform && !h.platform.solid) {
      input.consume('jump');
      h.dropT = 0.25;
      h.y += 2;
    } else if (G.swim && !h.ladder) {
      // underwater: every press is another stroke, from the floor or in mid-water
      input.consume('jump');
      h.vy = -G.swim * (ride ? ride.jump : 1);
      h.coyote = 0;
      h.onGround = false;
      h.jumpHeld = false;
      sfx.swim();
      burst(cx(h), h.y + h.h, 3, 'bubble', ['ice', 'sky']);
    } else if (h.coyote > 0) {
      input.consume('jump');
      h.vy = -HERO.jump * (ride ? ride.jump : 1);
      h.coyote = 0;
      h.onGround = false;
      h.jumpHeld = true;
      sfx.jump();
    } else if (hasAbility('hops') && !h.hopped && !h.ladder) {
      // DOUBLE JUMP: one more hop off thin air
      input.consume('jump');
      h.vy = -HERO.jump * 0.9;
      h.hopped = true;
      h.jumpHeld = true;
      sfx.jump();
      burst(cx(h), h.y + h.h, 6, 'twinkle', ['sky', 'paper']);
    }
  }
  if (h.jumpHeld && !input.held('jump')) {
    if (h.vy < -90) h.vy *= 0.5; // variable jump height
    h.jumpHeld = false;
  }
  // attack / special
  if ((input.pressed('attack', 0.16) || input.held('attack')) && canAttack(h)) {
    input.consume('attack');
    startAttack(h, T);
  }
  if (input.take('special') && h.specialCd <= 0 && h.hurtT <= 0 && !h.attack) startSpecial(h, T);
  if (h.attack) updateAttack(h, dt, T);

  const fallSpeed = h.vy;
  const landed = move(h, dt, world.platforms, { gravity: HERO.gravity * (G.gravity || 1), maxFall: HERO.maxFall * (G.maxFall || 1), dropThrough: h.dropT > 0 });
  if (landed) {
    h.landT = 0.08;
    if (fallSpeed > 200) {
      sfx.land();
      burst(cx(h), h.y + h.h, 4, 'dust', ['mist', 'fog']);
    }
  }
  h.landT = Math.max(0, h.landT - dt);
}

// ---------------------------------------------------------------- attacks
function rollCrit(h) {
  let c = CRIT.chance + (h.lv - 1) * 0.004 + critBonus(h);
  if (h.weapon.family === 'radiant') c += 0.15;
  return Math.random() < c;
}

function startAttack(h, T) {
  const w = h.weapon;
  attackMutation(h);
  h.combo = h.comboT > 0 ? (h.combo + 1) % (T.combo ? T.combo.length : 3) : 0;
  const fast = swingMult(h);
  h.cd = T.cd * fast;
  sfx.attack(w.type, w.q);
  if (!T.melee) {
    // the shot leaves when the animation releases it (bow string, throw, wand flick)
    h.attack = { ranged: true, t: 0, dur: T.cd * fast, weapon: w, fired: false, fireAt: fireAt(w.type) };
    h.comboT = T.cd * fast + 0.25;
    return;
  }
  const mv = MOVES[T.combo[h.combo]];
  h.attack = { move: mv, moveName: T.combo[h.combo], t: 0, dur: T.cd * mv.dur * fast, weapon: w, hit: new Set() };
  h.cd = h.attack.dur + (h.combo === T.combo.length - 1 ? RECOVERY : 0); // finisher has end lag
  h.comboT = h.attack.dur + 0.3;
}

function updateAttack(h, dt, T) {
  const a = h.attack;
  a.t += dt;
  if (a.ranged) {
    if (!a.fired && a.t / a.dur >= a.fireAt) {
      a.fired = true;
      shoot(h, T, 0);
      if (Math.random() < heroStats().multishot) shoot(h, T, -0.1, 0.85); // TWIN SHOT
    }
    if (a.t >= a.dur) h.attack = null;
    return;
  }
  const p = a.t / a.dur;
  const [activeStart, activeEnd] = activeWindow(h.weapon.type, a.move.big);
  if (p >= activeStart && p <= activeEnd) {
    const box = attackBox(h, T, a.move, heroStats().reach);
    // AWAKENING: the swing leaves a trail of shard-light
    if (heroStats().trail && Math.random() < 0.6) emit(box.x + Math.random() * box.w, box.y + Math.random() * box.h, 'twinkle', Math.random() < 0.5 ? C.ice : C.sky);
    for (const e of world.enemies) {
      if (e.dead || e.spawnT > 0 || a.hit.has(e) || !overlap(box, e)) continue;
      a.hit.add(e);
      const crit = rollCrit(h);
      const dmg = hitDamage(h.weapon) * a.move.mult * (crit ? CRIT.mult + heroStats().critDmg : 1);
      hitEnemy(e, dmg, {
        crit,
        dir: h.face,
        knock: T.knock * (a.move.big ? 1.3 : 1),
        hop: T.hop && a.move.big,
        big: a.move.big,
        element: h.weapon.family,
        sparkCol: lookOf(h.weapon).light
      });
      impactMutation(h, e, a);
      quirkHit(h, e, dmg, h.face);
      abilityHit(h, e, dmg, a.move.big);
    }
  }
  if (a.t >= a.dur) h.attack = null;
}

// projectiles: angle offset in radians
function shoot(h, T, ang, mult = 1, extra = {}) {
  const w = h.weapon;
  const crit = rollCrit(h);
  const L = lookOf(w);
  world.shots.push({
    id: newId(),
    type: w.type,
    x: cx(h) + h.face * 8,
    y: h.y + 12,
    w: 6,
    h: 4,
    vx: Math.cos(ang) * T.speed * (1 + heroStats().shotSpeed) * h.face,
    vy: Math.sin(ang) * T.speed * (1 + heroStats().shotSpeed),
    dmg: hitDamage(w) * mult * (crit ? CRIT.mult + heroStats().critDmg : 1),
    crit,
    knock: T.knock,
    pierce: T.pierce + (w.family === 'plasma' ? 2 : 0) + (extra.pierce || 0) + Math.round(heroStats().pierce * 100),
    homing: T.homing || (heroStats().homing ? 3 : 0),
    trail: !!heroStats().trail,
    life: 1.6,
    hit: new Set(),
    element: w.family,
    col: L.mid,
    light: L.light,
    weapon: w,
    emitters: L.emitters,
    spin: 0,
    boomerang: !!T.boomerang,
    t: 0,
    proc: mult !== 1,
    move: { big: h.combo === 2 }
  });
}

// ---------------------------------------------------------------- specials
function startSpecial(h, T) {
  h.specialCd = h.specialMax = T.cool * (1 - heroStats().specialCd);
  h.special = { kind: T.special, t: 0, hit: new Map(), tick: 0 };
  h.attack = null;
  sfx.special(h.weapon.type);
  callout(T.specialName, 0, 0, C.gold, { follow: h, life: 45 });
  const s = h.special;
  switch (s.kind) {
    case 'iai':
      s.x0 = h.x;
      h.inv = Math.max(h.inv, 0.35);
      break;
    case 'vault':
      h.vy = -300;
      h.onGround = false;
      break;
    case 'quake':
      h.vy = -160;
      h.onGround = false;
      break;
    case 'volley':
      for (let i = -2; i <= 2; i++) shoot(h, T, i * 0.12, 0.9);
      h.special = null;
      h.castT = 0.3;
      break;
    case 'storm':
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const f = h.face;
        h.face = Math.cos(ang) >= 0 ? 1 : -1;
        shoot(h, T, Math.atan2(Math.sin(ang), Math.abs(Math.cos(ang))), 0.8, { pierce: 2 });
        h.face = f;
      }
      h.special = null;
      h.castT = 0.3;
      break;
    case 'skewer':
      h.inv = Math.max(h.inv, 0.3);
      break;
    case 'tomahawk': { // axe: hurl a big spinning copy that cuts both ways and comes back
      const L = lookOf(h.weapon);
      world.shots.push({ id: newId(), type: h.weapon.type, sprite: true, boomerang: true, x: cx(h) + h.face * 6, y: h.y + 8, w: 10, h: 8,
        vx: h.face * 250, vy: 0, g: 0, dmg: hitDamage(h.weapon) * 1.8, crit: false, knock: 22, pierce: 99, homing: 0, life: 1.6, hit: new Set(),
        element: h.weapon.family, col: L.mid, light: L.light, weapon: h.weapon, emitters: L.emitters, spin: 0, proc: true, t: 0 });
      h.special = null;
      h.castT = 0.3;
      break;
    }
    case 'ricochet': // boomerang: three at once, fanned
      for (let i = -1; i <= 1; i++) shoot(h, T, i * 0.28, 1.1, { pierce: 3 });
      h.special = null;
      h.castT = 0.3;
      break;
    case 'nova':
      areaHit(h, 70, 1.5, { knock: 40, hop: true });
      ringBurst(cx(h), cy(h), 30, lookOf(h.weapon).light);
      shake(0.4);
      h.special = null;
      h.castT = 0.3;
      break;
  }
}

function areaHit(h, radius, mult, o = {}, once = null) {
  const T = TYPES[h.weapon.type];
  for (const e of world.enemies) {
    if (e.dead) continue;
    if (Math.abs(cx(e) - cx(h)) > radius || Math.abs(cy(e) - cy(h)) > radius * 0.7 + 10) continue;
    if (once && once.has(e)) continue;
    if (once) once.add(e);
    const crit = rollCrit(h);
    hitEnemy(e, hitDamage(h.weapon) * mult * (crit ? CRIT.mult + heroStats().critDmg : 1), {
      crit,
      dir: Math.sign(cx(e) - cx(h)) || h.face,
      knock: o.knock ?? T.knock,
      hop: o.hop,
      element: h.weapon.family,
      special: true,
      sparkCol: lookOf(h.weapon).light
    });
  }
}
function ringBurst(x, y, n, col) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    emit(x + Math.cos(a) * 6, y + Math.sin(a) * 4, 'spark', i % 2 ? col : C.paper);
  }
}

function updateSpecial(h, dt) {
  const s = h.special;
  s.t += dt;
  s.tick -= dt;
  const T = TYPES[h.weapon.type];
  const light = lookOf(h.weapon).light;
  switch (s.kind) {
    case 'whirl': // sword: spin, 4 hits around
      h.inv = Math.max(h.inv, 0.05);
      h.vx = input.axis() * HERO.speed * 0.6;
      if (s.tick <= 0) {
        s.tick = 0.12;
        areaHit(h, 34, 0.8, { knock: 14 });
        ringBurst(cx(h), cy(h), 10, light);
      }
      if (s.t > 0.5) h.special = null;
      break;
    case 'flurry': // dagger: rapid stabs in front
      h.vx = h.face * 30;
      if (s.tick <= 0) {
        s.tick = 0.08;
        const box = { x: h.face > 0 ? cx(h) : cx(h) - 26, y: h.y + 4, w: 26, h: 16 };
        for (const e of world.enemies)
          if (!e.dead && overlap(box, e)) {
            const crit = rollCrit(h);
            hitEnemy(e, hitDamage(h.weapon) * 0.6 * (crit ? CRIT.mult + heroStats().critDmg : 1), { crit, dir: h.face, knock: 6, element: h.weapon.family, special: true, sparkCol: light });
          }
        sfx.attack('dagger', h.weapon.q);
      }
      if (s.t > 0.5) h.special = null;
      break;
    case 'iai': // katana: dash through, then everything on the line is cut
      if (s.t < 0.16) {
        h.vx = h.face * 560;
        h.vy = 0;
        emit(cx(h), h.y + 10 + Math.random() * 6, 'streak', light);
      } else if (!s.cut) {
        s.cut = true;
        const xa = Math.min(s.x0, h.x) - 6,
          xb = Math.max(s.x0, h.x) + h.w + 6;
        for (const e of world.enemies)
          if (!e.dead && e.x + e.w > xa && e.x < xb && Math.abs(cy(e) - cy(h)) < 26) {
            const crit = rollCrit(h);
            hitEnemy(e, hitDamage(h.weapon) * 2.2 * (crit ? CRIT.mult + heroStats().critDmg : 1), { crit, dir: h.face, knock: 20, element: h.weapon.family, special: true, sparkCol: light });
          }
        for (let x = xa; x < xb; x += 3) emit(x, cy(h) + (Math.random() - 0.5) * 3, 'spark', Math.random() < 0.5 ? light : C.paper);
        shake(0.35);
        h.vx = 0;
      }
      if (s.t > 0.3) h.special = null;
      break;
    case 'quake': // hammer: hop, slam, shockwave both ways
      if (s.t > 0.12 && h.onGround && !s.slam) {
        s.slam = true;
        areaHit(h, 90, 1.6, { knock: 24, hop: true });
        for (const e of world.enemies) if (!e.dead && !e.boss && Math.abs(cx(e) - cx(h)) < 90 && e.onGround) e.stun = Math.max(e.stun, 0.8);
        for (let i = -12; i <= 12; i++) emit(cx(h) + i * 7, h.y + h.h - 1, 'chip', i % 2 ? C.sand : C.wood);
        spark(cx(h), h.y + h.h, { big: true, col: light });
        shake(0.6);
        hitstop(0.06);
      }
      if (s.t > 0.6) h.special = null;
      break;
    case 'cyclone': // nunchucks: spinning for a second, can move
      h.vx = input.axis() * HERO.speed * 0.8;
      if (s.tick <= 0) {
        s.tick = 0.1;
        areaHit(h, 30, 0.4, { knock: 8 });
        emit(cx(h) + (Math.random() - 0.5) * 50, cy(h) + (Math.random() - 0.5) * 20, 'streak', light);
      }
      if (s.t > 1) h.special = null;
      break;
    case 'vault': // staff: up, then slam down
      if (s.t > 0.28 && !s.down) {
        s.down = true;
        h.vy = 420;
      }
      if (s.down && h.onGround && !s.slam) {
        s.slam = true;
        areaHit(h, 44, 2, { knock: 28, hop: true });
        spark(cx(h), h.y + h.h, { big: true, col: light });
        burst(cx(h), h.y + h.h, 10, 'chip', ['sand', 'paper']);
        shake(0.5);
        hitstop(0.05);
      }
      if (s.t > 0.9 || (s.slam && s.t > 0.4)) h.special = null;
      break;
    case 'skewer': // spear: charge forward, skewering everything in front once
      if (s.t < 0.24) {
        h.vx = h.face * 400;
        h.vy = Math.min(h.vy, 0);
        const box = { x: h.face > 0 ? cx(h) : cx(h) - 40, y: h.y + 6, w: 40, h: 14 };
        for (const e of world.enemies)
          if (!e.dead && !s.hit.has(e) && overlap(box, e)) {
            s.hit.set(e, 1);
            const crit = rollCrit(h);
            hitEnemy(e, hitDamage(h.weapon) * 1.8 * (crit ? CRIT.mult + heroStats().critDmg : 1), { crit, dir: h.face, knock: 30, element: h.weapon.family, special: true, sparkCol: light });
          }
        emit(cx(h) - h.face * 6, h.y + 10 + Math.random() * 6, 'streak', light);
      } else h.vx *= 0.8;
      if (s.t > 0.36) h.special = null;
      break;
    case 'reap': // scythe: one huge sweep all around; each foe it cuts gives a little health back
      if (!s.cut) {
        s.cut = true;
        let n = 0;
        for (const e of world.enemies) {
          if (e.dead || Math.abs(cx(e) - cx(h)) > 56 || Math.abs(cy(e) - cy(h)) > 34) continue;
          const crit = rollCrit(h);
          hitEnemy(e, hitDamage(h.weapon) * 1.7 * (crit ? CRIT.mult + heroStats().critDmg : 1), { crit, dir: Math.sign(cx(e) - cx(h)) || h.face, knock: 18, element: h.weapon.family, special: true, sparkCol: light });
          n++;
        }
        if (n) h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * 0.025 * Math.min(5, n)));
        ringBurst(cx(h), cy(h), 36, light);
        shake(0.35);
      }
      h.vx = 0;
      if (s.t > 0.4) h.special = null;
      break;
    default:
      h.special = null;
  }
  move(h, dt, world.platforms, { gravity: HERO.gravity, maxFall: 460, dropThrough: false });
}

// ---------------------------------------------------------------- draw
export function drawHero(h, t) {
  if (!h.mount || h.ladder) return drawMount(h, t), drawHeroAnimated(h, t);
  // in the saddle: the goose underneath, the rider sitting a little higher
  drawMount(h, t);
  X.save();
  X.translate(0, -RIDE);
  drawHeroAnimated(h, t);
  X.restore();
}
