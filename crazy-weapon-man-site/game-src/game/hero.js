// The hero: movement (run, variable jump, coyote time, drop-through, dash), melee combos, ranged
// shots, one special per weapon type, and drawing the held weapon from the front hand.
import { HERO, C, GROUND } from '../config.js';
import { updateClimb } from './climbing.js';
import { input } from '../engine/input.js';
import { sfx, duck } from '../engine/audio.js';
import { world, newId } from './world.js';
import { move, overlap, cx, cy, worldFloor } from './physics.js';
import { TYPES, MOVES, RECOVERY } from '../data/weapons.js';
import { CRIT } from '../data/curve.js';
import { heroMax, heroStats } from './perks.js';
import { hitDamage, trainingSword } from './loot.js';
import { hitEnemy, hurtHero } from './combat.js';
import { emit, burst, spark, shake, hitstop, callout } from './fx.js';
import { lookOf } from './looks.js';
import { attackBox, activeWindow, canAttack } from './attack-rules.js';
import { attackMutation, impactMutation } from './evolution.js';
import { quirkHit } from './quirks.js';
import { drawHeroAnimated, fireAt } from './anim.js';
import { abilityHit, swingMult, critBonus, dashCut, hasAbility } from './abilities.js';
import { heroPhysics } from './gimmicks.js';
import { charge, drawMount, RIDE, flap, mountDef } from './mount.js';
import { X } from '../engine/gfx.js';
import { MOVE, windHang, plungeOf } from '../data/feel.js';
import { beginRun, spHit, startCrazy, updateCrazy, impact, heroHidden } from './specials.js';
import { specialId } from '../data/specials.js';


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
  h.skidT = Math.max(0, (h.skidT || 0) - dt);
  h.squashT = Math.max(0, (h.squashT || 0) - dt);
  h.stretchT = Math.max(0, (h.stretchT || 0) - dt);
  h.lungeT = Math.max(0, (h.lungeT || 0) - dt);
  h.animT += dt;
  const S = heroStats();
  // low health: a heartbeat (the HUD pulses the screen edge with it)
  if (h.hp / h.maxHp < 0.25 && (h.beatT = (h.beatT || 0) - dt) <= 0) {
    h.beatT = 0.8;
    sfx.heartbeat();
  }
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
  // the level's gimmick (water, ice) and the mount you ride change how the hero moves
  const G = heroPhysics() || {}, ride = h.mount ? mountDef(h.mount) : null;
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
  // run: after MOVE.sprintAfter seconds of running one way you hit a sprint (SMW's P-meter in
  // miniature); a melee swing on the ground slows you down and locks which way you face (in the air it
  // keeps your momentum, so swinging mid-jump never drops you short of a ledge)
  const swing = h.attack && !h.attack.ranged ? h.attack : null;
  if (ax && ax === Math.sign(h.vx) && !swing && h.hurtT <= 0 && !h.ladder) h.runT = (h.runT || 0) + dt;
  else if (!ax || ax !== Math.sign(h.vx) || swing) h.runT = 0;
  h.sprint = (h.runT || 0) >= MOVE.sprintAfter && !ride && !G.swim;
  if (h.hurtT <= 0) {
    const slowBy = swing && h.onGround ? (inActive(h, swing) ? MOVE.swingSlow : MOVE.swingSlowWind) : 1;
    const target = ax * HERO.speed * (1 + S.speed) * (G.speed || 1) * (ride ? ride.speed : 1) * (h.sprint ? MOVE.sprintSpeed : 1) * slowBy;
    // turning round at speed on the ground skids (a puff of dust and a lean)
    if (ax && h.onGround && Math.sign(h.vx) === -ax && Math.abs(h.vx) > MOVE.skidSpeed && h.skidT <= 0 && !swing) {
      h.skidT = 0.16;
      sfx.skid();
      burst(cx(h) - ax * 4, h.y + h.h - 1, 5, 'dust', ['mist', 'fog', 'paper']);
    }
    // on ice you slide: turning round (pushing against your own slide) grips a little better
    const a = ax ? HERO.accel * (G.accel || 1) * (G.accel && Math.sign(h.vx) === -ax ? 1.6 : 1) : HERO.friction * (G.friction || 1);
    h.vx += Math.sign(target - h.vx) * Math.min(Math.abs(target - h.vx), a * dt);
    if (ax && !swing) {
      if (h.face !== ax) h.trail = null; // a turn starts a fresh blade trail
      h.face = ax;
    }
    if (h.sprint && h.onGround && Math.random() < 0.35) emit(cx(h) - h.face * 5, h.y + h.h - 1, 'dust', C.mist);
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
      jumpCancel(h);
      h.vy = -HERO.jump * (ride ? ride.jump : 1) * (h.sprint ? MOVE.sprintJump : 1);
      h.coyote = 0;
      h.onGround = false;
      h.jumpHeld = true;
      h.stretchT = 0.09;
      sfx.jump();
    } else if (ride && flap(h)) {
      input.consume('jump'); // SKY FLAP: the griffin beats its wings for one more jump
    } else if (hasAbility('hops') && !h.hopped && !h.ladder) {
      // DOUBLE JUMP: one more hop off thin air
      input.consume('jump');
      jumpCancel(h);
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
  // attack / special. A press during a swing is buffered (MOVE.attackBuffer) and comes out the
  // moment the swing ends; DOWN + attack in the air is the down-strike (data/feel.js PLUNGE)
  const atk = input.pressed('attack', MOVE.attackBuffer) || input.held('attack');
  if (atk && !h.onGround && !h.ladder && !ride && input.held('down') && canAttack(h) && !(plungeOf(h.weapon.type).kind === 'volley' && h.airShot)) {
    input.consume('attack');
    startPlunge(h, T);
    return;
  }
  // the special is buffered too: pressed during a swing it fires as soon as the hit is done
  // (cancelling the swing's recovery). A waiting special goes first, and no new swing starts
  // in front of it, so holding attack can't eat the press.
  const spWant = input.pressed('special', MOVE.specialBuffer) && h.specialCd <= 0 && h.hurtT <= 0;
  if (spWant && (!h.attack || pastHit(h, h.attack))) {
    input.consume('special');
    startSpecial(h, T);
  } else if (atk && canAttack(h) && !spWant) {
    input.consume('attack');
    startAttack(h, T);
  }
  if (h.attack) updateAttack(h, dt, T);

  // SMW jump arc: falling is faster than rising, with a short hang at the top while jump is held
  // (water levels keep their own floaty physics)
  const hang = h.jumpHeld && input.held('jump') && Math.abs(h.vy) < MOVE.apexBand;
  const gk = G.swim ? 1 : h.vy > 0 && !hang ? MOVE.fallGravity : hang ? MOVE.apexGravity : 1;
  const fallSpeed = h.vy;
  if (h.lungeT > 0) h.vx += h.face * h.lungeV;
  const landed = move(h, dt, world.platforms, { gravity: HERO.gravity * (G.gravity || 1) * gk, maxFall: (G.swim ? HERO.maxFall : MOVE.maxFall) * (G.maxFall || 1), dropThrough: h.dropT > 0 });
  if (h.lungeT > 0) h.vx -= h.face * h.lungeV;
  if (h.onGround) h.airShot = false;
  pitCheck(h);
  if (landed) {
    h.landT = 0.08;
    if (fallSpeed > 120) h.squashT = 0.07;
    if (fallSpeed > 200) {
      sfx.land();
      burst(cx(h), h.y + h.h, 4, 'dust', ['mist', 'fog']);
    }
  }
  h.landT = Math.max(0, h.landT - dt);
}

// ---------------------------------------------------------------- pits
// Standing on solid ground well clear of its edges remembers the spot; falling to the bottom of a
// pit costs PIT_DMG of your health and puts you back there (Super Mario World would take a life).
export const PIT_DMG = 0.15;
function pitCheck(h) {
  const m = world.map;
  if (!m?.pits?.length || h.dead) return;
  const p = h.platform;
  // (well back from the edge, so you don't land on the lip and step straight back in)
  if (h.onGround && p?.ground && p.w >= 40) h.safe = { x: p.w >= 80 ? Math.max(p.x + 24, Math.min(p.x + p.w - h.w - 24, h.x)) : p.x + (p.w - h.w) / 2, y: p.y - h.h };
  if (h.y + h.h < worldFloor() - 1) return;
  const back = h.safe || { x: m.startX, y: m.startY - h.h };
  h.inv = 0;
  h.dashT = 0;
  h.mount = null;
  hurtHero(Math.ceil(h.maxHp * PIT_DMG), 1);
  if (h.dead) return;
  h.x = back.x;
  h.y = back.y;
  h.vx = h.vy = 0;
  h.special = h.attack = null;
  h.jumpHeld = false;
  h.inv = 1.2;
  burst(cx(h), cy(h), 10, 'smoke', ['fog', 'mist']);
  callout('WHOOPS!', 0, 0, C.coral, { follow: h, life: 40 });
}

// ---------------------------------------------------------------- attacks
// where a melee swing is: its progress after the heavy-weapon hang (data/feel.js windHang)
function swingP(h, a) {
  const p = Math.min(1, a.t / a.dur);
  return windHang(h.weapon.type, p, activeWindow(h.weapon.type, a.move.big)[0]);
}
function inActive(h, a) {
  const p = swingP(h, a), [s0, s1] = activeWindow(h.weapon.type, a.move.big);
  return p >= s0 && p <= s1;
}
// the hit is done: a melee swing past its active frames, or a shot already loosed
function pastHit(h, a) {
  return a.ranged ? a.fired : swingP(h, a) > activeWindow(h.weapon.type, a.move.big)[1];
}
// a jump cancels a swing's recovery once its hit has landed (not the wind-up)
function jumpCancel(h) {
  const a = h.attack;
  if (a && !a.ranged && a.hit.size && pastHit(h, a)) {
    h.attack = null;
    h.cd = 0;
    h.comboT = Math.max(h.comboT, 0.3);
  }
}

// the down-strike: blades pogo off foes, blunt weapons pound the ground, ranged weapons rain a volley
function startPlunge(h, T) {
  const P = plungeOf(h.weapon.type);
  h.attack = null;
  sfx.attack(h.weapon.type, h.weapon.q);
  if (P.kind === 'volley') {
    for (const a of P.angles) shoot(h, T, a, P.mult);
    h.vy = Math.min(h.vy, -P.hop);
    h.airShot = true;
    h.cd = T.cd;
    h.castT = 0.3;
    return;
  }
  h.special = { kind: 'plunge', P, t: 0, hit: new Map(), tick: 0 };
  h.vy = P.fall;
}

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
  // a small step into each swing, a bigger one into the finisher
  if (h.onGround) {
    h.lungeT = MOVE.lungeTime;
    h.lungeV = (mv.big ? MOVE.lungeBig : MOVE.lunge) / MOVE.lungeTime;
  }
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
  const p = swingP(h, a);
  a.p = p; // the pose follows the same (hung) progress as the hitbox
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
    vx: Math.cos(ang) * (T.speed || 260) * (1 + heroStats().shotSpeed) * h.face,
    vy: Math.sin(ang) * (T.speed || 260) * (1 + heroStats().shotSpeed),
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
    move: { big: h.combo === 2 },
    ...extra.shot
  });
}

// ---------------------------------------------------------------- specials
function startSpecial(h, T) {
  // the weapon's own rolled special (data/specials.js); the run carries its damage, size and boons
  const run = beginRun(h);
  h.special = { kind: specialId(h.weapon), t: 0, hit: new Map(), tick: 0, run };
  h.attack = null;
  const s = h.special, M = run.mult, z = run.size;
  // thrown specials: real projectiles carrying the special's damage
  const api = {
    shoot: (h, ang, mult, extra) => shoot(h, T, ang, mult * M, extra),
    ring: (h, ang, mult, extra) => {
      const f = h.face;
      h.face = Math.cos(ang) >= 0 ? 1 : -1;
      shoot(h, T, Math.atan2(Math.sin(ang), Math.abs(Math.cos(ang))), mult * M, extra);
      h.face = f;
    }
  };
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
      for (let i = -2; i <= 2; i++) shoot(h, T, i * 0.12, 0.9 * M);
      h.special = null;
      h.castT = 0.3;
      break;
    case 'storm':
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const f = h.face;
        h.face = Math.cos(ang) >= 0 ? 1 : -1;
        shoot(h, T, Math.atan2(Math.sin(ang), Math.abs(Math.cos(ang))), 0.8 * M, { pierce: 2 });
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
      world.shots.push({ id: newId(), type: h.weapon.type, sprite: true, boomerang: true, x: cx(h) + h.face * 6, y: h.y + 8,
        vx: h.face * 250, vy: 0, g: 0, dmg: hitDamage(h.weapon) * 1.8 * M, w: 10 * z, h: 8 * z, crit: false, knock: 22, pierce: 99, homing: 0, life: 1.6, hit: new Set(),
        element: h.weapon.family, col: L.mid, light: L.light, weapon: h.weapon, emitters: L.emitters, spin: 0, proc: true, t: 0 });
      h.special = null;
      h.castT = 0.3;
      break;
    }
    case 'ricochet': // boomerang: three at once, fanned
      for (let i = -1; i <= 1; i++) shoot(h, T, i * 0.28, 1.1 * M, { pierce: 3 });
      h.special = null;
      h.castT = 0.3;
      break;
    case 'nova':
      areaHit(h, 70, 1.5, { knock: 40, hop: true });
      ringBurst(cx(h), cy(h), 30, lookOf(h.weapon).light);
      impact(cx(h), cy(h), 2, run.col, run);
      h.special = null;
      h.castT = 0.3;
      break;
    default:
      startCrazy(h, s, api);
  }
}

function areaHit(h, radius, mult, o = {}, once = null) {
  const run = h.special && h.special.run;
  if (!run) return;
  radius *= run.size;
  for (const e of world.enemies) {
    if (e.dead) continue;
    if (Math.abs(cx(e) - cx(h)) > radius || Math.abs(cy(e) - cy(h)) > radius * 0.7 + 10) continue;
    if (once && once.has(e)) continue;
    if (once) once.add(e);
    spHit(run, e, mult, { knock: o.knock, hop: o.hop });
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
            spHit(s.run, e, 0.6, { dir: h.face, knock: 6 });
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
            spHit(s.run, e, 2.2, { dir: h.face, knock: 20 });
          }
        for (let x = xa; x < xb; x += 3) emit(x, cy(h) + (Math.random() - 0.5) * 3, 'spark', Math.random() < 0.5 ? light : C.paper);
        impact(cx(h), cy(h), 1.5, light, s.run);
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
        impact(cx(h), h.y + h.h - 2, 2.5, light, s.run);
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
        burst(cx(h), h.y + h.h, 10, 'chip', ['sand', 'paper']);
        impact(cx(h), h.y + h.h - 2, 2, light, s.run);
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
            spHit(s.run, e, 1.8, { dir: h.face, knock: 30 });
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
          spHit(s.run, e, 1.7, { dir: Math.sign(cx(e) - cx(h)) || h.face, knock: 18 });
          n++;
        }
        if (n) h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * 0.025 * Math.min(5, n)));
        ringBurst(cx(h), cy(h), 36, light);
        impact(cx(h), cy(h), 1.5, C.violet, s.run);
      }
      h.vx = 0;
      if (s.t > 0.4) h.special = null;
      break;
    case 'plunge': { // the down-strike (startPlunge)
      const P = s.P;
      h.vx = input.axis() * HERO.speed * 0.7;
      if (!s.slam) h.vy = Math.max(h.vy, P.fall);
      const box = { x: h.x - 4, y: h.y + h.h - 6, w: h.w + 8, h: 14 };
      if (!s.slam) for (const e of world.enemies) {
        if (e.dead || e.spawnT > 0 || s.hit.has(e) || !overlap(box, e)) continue;
        s.hit.set(e, 1);
        const crit = rollCrit(h);
        hitEnemy(e, hitDamage(h.weapon) * P.mult * (crit ? CRIT.mult + heroStats().critDmg : 1), { crit, dir: Math.sign(cx(e) - cx(h)) || h.face, knock: 8, plunge: true, element: h.weapon.family, sparkCol: light });
        abilityHit(h, e, 0, true);
        if (P.kind === 'pogo') {
          // bounce off the head, and the double jump comes back
          h.vy = -HERO.jump * P.bounce;
          h.hopped = false;
          h.jumpHeld = false;
          h.stretchT = 0.09;
          sfx.jump();
          burst(cx(h), h.y + h.h, 6, 'twinkle', [light, 'paper']);
          h.special = null;
          break;
        }
      }
      if (h.special && h.onGround && !s.slam) {
        s.slam = true;
        s.t = 0;
        h.squashT = 0.09;
        if (P.kind === 'pound') {
          const r = P.radius * (1 + heroStats().aoeSize);
          for (const e of world.enemies) {
            if (e.dead || s.hit.has(e) || Math.abs(cx(e) - cx(h)) > r || Math.abs(e.y + e.h - (h.y + h.h)) > 14) continue;
            const crit = rollCrit(h);
            hitEnemy(e, hitDamage(h.weapon) * P.wave * (crit ? CRIT.mult + heroStats().critDmg : 1), { crit, dir: Math.sign(cx(e) - cx(h)) || h.face, knock: 22, hop: true, plunge: true, element: h.weapon.family, sparkCol: light });
          }
          for (let i = -8; i <= 8; i++) emit(cx(h) + (i * r) / 8, h.y + h.h - 1, 'chip', i % 2 ? C.sand : C.wood);
          spark(cx(h), h.y + h.h, { big: true, col: light });
          shake(0.5);
          hitstop(0.06);
          sfx.thud(true);
        } else burst(cx(h), h.y + h.h, 4, 'dust', ['mist', 'fog']);
      }
      if (s.slam && s.t > (P.kind === 'pound' ? 0.2 : 0.08)) h.special = null;
      break;
    }
    default:
      if (!updateCrazy(h, dt, s)) h.special = null;
  }
  move(h, dt, world.platforms, { gravity: HERO.gravity, maxFall: 460, dropThrough: false });
}

// ---------------------------------------------------------------- draw
export function drawHero(h, t) {
  if (heroHidden(h)) return; // THOUSAND CUTS: he is everywhere at once
  // landing squash and take-off stretch, about the feet
  const k = h.squashT > 0 ? [1.14, 0.86] : h.stretchT > 0 ? [0.88, 1.12] : null;
  if (k) {
    const fx = cx(h), fy = h.y + h.h;
    X.save();
    X.translate(fx, fy);
    X.scale(k[0], k[1]);
    X.translate(-fx, -fy);
    drawHeroBody(h, t);
    return X.restore();
  }
  drawHeroBody(h, t);
}
function drawHeroBody(h, t) {
  if (!h.mount || h.ladder) return drawMount(h, t), drawHeroAnimated(h, t);
  // in the saddle: the goose underneath, the rider sitting a little higher
  drawMount(h, t);
  X.save();
  X.translate(0, -RIDE);
  drawHeroAnimated(h, t);
  X.restore();
}
