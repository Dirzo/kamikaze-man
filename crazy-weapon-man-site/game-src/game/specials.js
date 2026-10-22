// The crazy specials: the shared show every special puts on (a flash, a name banner across the
// screen, speed lines, shake, hit-stop and a stinger), the special boons and synergies, and the
// moves added on top of each type's signature special (data/specials.js lists them all; the
// signature ones still run in hero.js). Long-lived pieces (waves, sky strikes, vortexes, beams,
// orbiting stars) live in world.spx and keep going after the hero is free again.
import { C, W, H, HERO } from '../config.js';
import { world } from './world.js';
import { emit, burst, spark, shake, hitstop, callout, zoomPunch, kick } from './fx.js';
import { sfx, duck } from '../engine/audio.js';
import { hitEnemy } from './combat.js';
import { cx, cy, overlap } from './physics.js';
import { lookOf } from './looks.js';
import { hitDamage } from './loot.js';
import { CRIT } from '../data/curve.js';
import { heroStats } from './perks.js';
import { critBonus } from './abilities.js';
import { input } from '../engine/input.js';
import { ELEMENTS } from '../data/weapons.js';
import { X, rect, px, dither, text } from '../engine/gfx.js';
import { specialOf, specialRoll } from '../data/specials.js';
import { drawHeroAnimated } from './anim.js';

// every special hits this much harder than its listed multiplier (specials are the big moments)
export const SPECIAL_POWER = 1.3;
const CANCEL_MULT = 1.5; // CRAZY CANCEL: a special fired out of a combo finisher
const VAMP_CAP = 0.12; // BLOODRUSH heals at most this share of max health per special

// ---------------------------------------------------------------- one special's run
// The run carries the special's damage, size and boons, and is shared by everything it spawns.
export function beginRun(h) {
  const w = h.weapon, R = specialRoll(w), B = new Set(R.boons), sp = specialOf(w);
  const cancel = !!(h.attack && h.attack.move && h.attack.move.big);
  const L = lookOf(w);
  const element = w.family || (B.has('infuse') ? R.element : null);
  const run = {
    w, sp, B,
    base: hitDamage(w),
    mult: SPECIAL_POWER * (B.has('overcharge') ? 1.6 : 1) * (cancel ? CANCEL_MULT : 1),
    size: (B.has('giant') ? 1.4 : 1) * (1 + (heroStats().aoeSize || 0)),
    element,
    infuse: B.has('infuse'),
    col: element ? C[ELEMENTS[element].col] : L.light,
    light: L.light,
    mid: L.mid,
    kills: 0,
    healed: 0,
    praised: 0,
    cancel,
    foes: new Set() // every foe this special touched
  };
  globalThis.__spLog?.push(run); // (testing: tools record what each special reached)
  h.specialCd = h.specialMax = sp.cool * (1 - heroStats().specialCd) * (B.has('quick') ? 0.65 : 1);
  if (B.has('guard')) h.inv = Math.max(h.inv, 1.3);
  if (B.has('aftershock')) world.spx.push({ k: 'shock', x: cx(h), y: h.y + h.h, t: 0, delay: 0.55, run, hit: new Map(), follow: h });
  intro(run, h);
  return run;
}

function rollCrit(h) {
  let c = CRIT.chance + (h.lv - 1) * 0.004 + critBonus(h);
  if (h.weapon.family === 'radiant') c += 0.15;
  return Math.random() < c;
}

// a special's hit on one foe: crits, boons and the kill tally all go through here
export function spHit(run, e, mult, o = {}) {
  const h = world.hero;
  if (!e || e.dead || e.spawnT > 0) return 0;
  const crit = rollCrit(h);
  let dmg = run.base * run.mult * mult * (crit ? CRIT.mult + heroStats().critDmg : 1);
  if (run.B.has('execute') && e.hp < e.max * 0.3) {
    dmg *= 3;
    if (!o.quiet) callout('EXECUTE', 0, 0, C.coral, { follow: e, life: 30 });
  }
  run.foes.add(e);
  const dealt = hitEnemy(e, dmg, {
    crit,
    dir: o.dir || Math.sign(cx(e) - cx(h)) || h.face,
    knock: o.knock ?? 20,
    hop: o.hop,
    big: o.big,
    element: run.element,
    special: true,
    sparkCol: run.col
  });
  if (o.launch && !e.boss && !e.dead) {
    e.vy = -o.launch;
    e.onGround = false;
  }
  if (dealt && run.B.has('vamp') && run.healed < VAMP_CAP) {
    const n = Math.max(1, Math.round(h.maxHp * 0.015));
    run.healed += n / h.maxHp;
    h.hp = Math.min(h.maxHp, h.hp + n);
    if (Math.random() < 0.4) emit(cx(e), cy(e), 'suck', C.red);
  }
  if (e.dead) {
    run.kills++;
    if (run.B.has('refund')) h.specialCd = Math.max(0, h.specialCd - 0.8);
    praise(run, h);
  }
  return dealt;
}
// OVERKILL: wiping a crowd with one special shouts about it and gives half the cooldown back
const PRAISE = [[5, 'OVERKILL!', 'gold'], [10, 'MASSACRE!!', 'orange'], [20, 'CRAZY!!!', 'pink']];
function praise(run, h) {
  const p = PRAISE[run.praised];
  if (!p || run.kills < p[0]) return;
  run.praised++;
  callout(p[1], W / 2, 84 + run.praised * 2, C[p[2]], { big: true, life: 80 });
  if (run.praised === 1) h.specialCd *= 0.5;
  flash(C[p[2]], 6);
  sfx.boom(1.5);
}

// all foes in an ellipse (radius r across, ry up and down)
function inside(x, y, r, ry = r * 0.7) {
  return world.enemies.filter(e => !e.dead && e.spawnT <= 0 && Math.abs(cx(e) - x) < r + e.w / 2 && Math.abs(cy(e) - y) < ry + e.h / 2);
}
function nearest(x, y, r, n) {
  return inside(x, y, r, r * 0.6).sort((a, b) => Math.hypot(cx(a) - x, cy(a) - y) - Math.hypot(cx(b) - x, cy(b) - y)).slice(0, n);
}
// hit a list once per entity (or again after `re` seconds)
function hitOnce(ent, list, mult, o) {
  for (const e of list) {
    const next = ent.hit.get(e);
    if (next != null && (!ent.re || world.t < next)) continue;
    ent.hit.set(e, world.t + (ent.re || 0));
    spHit(ent.run, e, mult, o);
  }
}

// ---------------------------------------------------------------- the big moment
// a slam: shake, hold, zoom, flash, a shockwave ring and a boom
export function impact(x, y, pow, col, run = null) {
  shake(Math.min(1, 0.45 + pow * 0.2));
  hitstop(Math.min(0.14, 0.04 + pow * 0.03));
  zoomPunch(Math.min(0.08, 0.02 + pow * 0.02));
  flash(pow >= 2 ? C.paper : col, 2 + Math.round(pow));
  ring(x, y, 30 * pow * (run ? run.size : 1), col);
  spark(x, y, { big: true, col });
  burst(x, y, 10 + pow * 6, 'spark', [col, 'paper', 'gold']);
  sfx.boom(pow);
}
const ring = (x, y, r, col, life = 0.3) => world.spx.push({ k: 'ring', x, y, r, col, t: 0, life });

// screen-wide pieces (drawn over everything, counted in drawn frames so they run through hit-stop)
const S = { flash: null, banner: null, lines: 0, dark: 0 };
export function flash(col, n = 4) {
  if (!S.flash || n >= S.flash.n) S.flash = { col, n, max: n };
}
function intro(run, h) {
  const sp = run.sp;
  sfx.special(run.w.type);
  sfx.stinger();
  duck(0.35, 0.7);
  S.banner = { s: sp.name, col: run.col, age: 0, boons: run.B.size, cancel: run.cancel };
  S.lines = 14;
  flash(C.paper, 3);
  shake(0.45);
  zoomPunch(0.04);
  hitstop(0.05);
  burst(cx(h), cy(h), 14, 'spark', [run.col, 'paper', 'gold']);
  ring(cx(h), cy(h), 26, run.col, 0.25);
  if (run.cancel) callout('CRAZY CANCEL!', W / 2, 98, C.pink, { big: true, life: 60 });
}

// ---------------------------------------------------------------- the added moves
// start: called once when the special begins (h.special = s already, with s.run)
// api: { shoot(h, ang, mult, extra) } for moves that throw real projectiles
export function startCrazy(h, s, api) {
  const run = s.run, f = h.face, foot = h.y + h.h, z = run.size;
  s.api = api;
  switch (s.kind) {
    case 'skysplit':
      h.vy = -200;
      h.onGround = false;
      strike(run, 'sword', cx(h) + f * 46, foot, 0.3, 40 * z, 2.4, { launch: 200, pow: 2, after: 'split' });
      break;
    case 'shadowstep':
      s.targets = nearest(cx(h), cy(h), 170 * z, 6);
      h.inv = Math.max(h.inv, 0.9);
      break;
    case 'knives':
      for (let i = 0; i < 12; i++) api.ring(h, (i / 12) * Math.PI * 2, 0.75, { pierce: 1 });
      flash(run.col, 3);
      break;
    case 'thousand':
      s.x0 = h.x;
      s.y0 = h.y;
      s.targets = inside(cx(h), cy(h), 150 * z, 60);
      s.hide = true;
      h.inv = Math.max(h.inv, 1);
      S.dark = 52;
      sfx.dash();
      break;
    case 'meteor':
      h.vy = -560;
      h.onGround = false;
      h.inv = Math.max(h.inv, 1.2);
      break;
    case 'dragoon':
      s.floor = h.y + h.h;
      h.vy = -460;
      h.vx = f * 60;
      h.onGround = false;
      h.inv = Math.max(h.inv, 1);
      break;
    case 'pillars':
      for (let i = 0; i < 7; i++) strike(run, 'pillar', cx(h) + f * (24 + i * 22 * z), foot, 0.12 + i * 0.07, 13 * z, 1.35, { launch: 240, warn: false });
      break;
    case 'arrowrain':
      for (let i = 0; i < 24; i++) strike(run, 'arrow', cx(h) + f * (28 + Math.random() * 120 * z), foot, 0.22 + i * 0.025, 11 * z, 0.6, { knock: 6, warn: false });
      h.castT = 0.3;
      break;
    case 'spearrain':
      for (let i = 0; i < 12; i++) strike(run, 'spear', cx(h) + f * (20 + Math.random() * 100 * z), foot, 0.2 + i * 0.045, 14 * z, 1, { launch: 120, warn: false });
      h.castT = 0.3;
      break;
    case 'orbit':
      world.spx = world.spx.filter(x => x.k !== 'orbit');
      world.spx.push({ k: 'orbit', run, t: 0, life: 4, re: 0.3, hit: new Map(), r: 28 * z, n: 6, follow: h });
      h.castT = 0.3;
      break;
    case 'blackhole':
      world.spx.push({ k: 'vortex', run, t: 0, life: 1.4, re: 0.2, hit: new Map(), x: cx(h) + f * 74, y: cy(h) - 4, r: 84 * z });
      h.castT = 0.3;
      sfx.hum?.();
      break;
    case 'flock':
      for (let i = 0; i < 8; i++) api.shoot(h, -0.7 + (i / 7) * 1.4, 0.7, { pierce: 2, shot: { homing: 8, life: 2.4 } });
      h.castT = 0.3;
      break;
    case 'harvest':
      S.dark = 24;
      break;
  }
}

// each frame of an added move; returns false when the move is over
export function updateCrazy(h, dt, s) {
  const run = s.run, f = h.face, T = s.t, z = run.size, foot = h.y + h.h;
  switch (s.kind) {
    case 'skysplit':
      return T < 0.5;
    case 'crossslash':
      h.vx = 0;
      if (!s.done && T > 0.1) {
        s.done = true;
        wave(run, 'cross', cx(h) + f * 14, cy(h), f * 330, 0, 30 * z, 30 * z, 0.9, 1.9, { knock: 30 });
        sfx.slash();
        kick(f, 3);
      }
      return T < 0.3;
    case 'shadowstep': {
      h.vx = 0;
      h.vy = 0;
      s.tick ||= 0;
      if (T < s.tick) return true;
      const e = (s.targets || []).find(e => !e.dead && !s.hit.has(e));
      if (!e) {
        if (!s.end) {
          s.end = true;
          flash(run.col, 4);
          shake(0.5);
          if (!s.hit.size) { h.vx = f * 400; } // nobody near: a blink forward
        }
        return T < s.tick + 0.15;
      }
      s.hit.set(e, 1);
      s.tick = T + 0.085;
      afterimage(h);
      const side = Math.sign(cx(e) - cx(h)) || f;
      h.x = cx(e) + side * (e.w / 2 + 6) - h.w / 2;
      h.y = e.y + e.h - h.h;
      h.face = -side;
      slashMark(cx(e), cy(e), run.col);
      spHit(run, e, 1.7, { dir: -side, knock: 10 });
      hitstop(0.03);
      sfx.slash();
      return true;
    }
    case 'knives':
      if (!s.second && T > 0.18) {
        s.second = true;
        for (let i = 0; i < 12; i++) s.api.ring(h, ((i + 0.5) / 12) * Math.PI * 2, 0.75, { pierce: 1 });
      }
      return T < 0.3;
    case 'thousand': {
      h.vx = h.vy = 0;
      h.x = s.x0;
      h.y = s.y0;
      const live = s.targets.filter(e => !e.dead);
      if (T < 0.6) {
        s.tick ||= 0;
        if (T >= s.tick) {
          s.tick = T + 0.035;
          const e = live[Math.floor(Math.random() * live.length)];
          if (e) {
            slashMark(cx(e) + (Math.random() - 0.5) * 10, cy(e) + (Math.random() - 0.5) * 10, Math.random() < 0.5 ? C.paper : run.col);
            spHit(run, e, 0.22, { knock: 0, quiet: true });
          } else slashMark(cx(h) + f * (20 + Math.random() * 100), cy(h) + (Math.random() - 0.5) * 30, C.paper);
          sfx.attack('katana', 6);
        }
        return true;
      }
      if (!s.cut) {
        s.cut = true;
        s.hide = false;
        for (const e of live) {
          spHit(run, e, 1.8, { knock: 26, hop: true, big: true });
          burst(cx(e), cy(e), 8, 'blood', ['red', 'wine']);
        }
        S.dark = 0;
        flash(C.paper, 8);
        shake(0.85);
        hitstop(0.12);
        zoomPunch(0.06);
        callout('...SHEATHE', 0, 0, C.paper, { follow: h, life: 50 });
        sfx.clang();
        sfx.boom(1.6);
      }
      return T < 0.8;
    }
    case 'moon':
      h.vx = 0;
      if (!s.done && T > 0.1) {
        s.done = true;
        wave(run, 'crescent', cx(h) + f * 12, cy(h), f * 290, 0, 26 * z, 46 * z, 1.1, 2, { knock: 34 });
        sfx.slash();
        flash(C.ice, 3);
      }
      return T < 0.3;
    case 'meteor':
      if (!s.down && (h.vy >= -40 || T > 0.38)) {
        s.down = true;
        h.vy = 760;
        h.vx = f * 130;
      }
      if (s.down && !s.slam) {
        h.vy = 760;
        for (let i = 0; i < 3; i++) emit(cx(h) + (Math.random() - 0.5) * 10, h.y + Math.random() * h.h, 'flame', i ? C.orange : C.gold);
        emit(cx(h), h.y, 'smoke', C.fog);
      } else if (!s.down) h.vx = f * 40;
      if (s.down && h.onGround && !s.slam) {
        s.slam = T;
        for (const e of inside(cx(h), foot - 10, 100 * z, 40)) {
          spHit(run, e, 2.7, { knock: 44, launch: 260, big: true });
          if (!e.boss) e.stun = Math.max(e.stun || 0, 1);
        }
        world.spx.push({ k: 'crater', x: cx(h), y: foot, t: 0, life: 1.3, r: 46 * z, col: C.orange });
        burst(cx(h), foot, 24, 'flame', ['orange', 'gold', 'red']);
        burst(cx(h), foot, 20, 'chip', ['sand', 'wood', 'stone']);
        impact(cx(h), foot - 4, 3, C.orange, run);
      }
      return !(s.slam && T > s.slam + 0.35) && T < 1.8;
    case 'gavel':
      if (!s.done && T > 0.14) {
        s.done = true;
        for (const e of inside(cx(h) + f * 16, foot - 10, 36 * z, 30)) spHit(run, e, 1.2, { knock: 20, hop: true });
        impact(cx(h) + f * 16, foot - 2, 1, C.sky, run);
        const foes = nearest(cx(h), cy(h), 190 * z, 6);
        for (let i = 0; i < 6; i++) {
          const e = foes[i];
          const x = e ? cx(e) : cx(h) + f * (40 + i * 26);
          strike(run, 'bolt', x, e ? e.y + e.h : foot, 0.1 + i * 0.08, 22 * z, 1.6, { pow: 1, knock: 16, col: C.sky });
        }
      }
      h.vx = 0;
      return T < 0.6;
    case 'dragon': {
      if (T < 0.62) {
        h.vx = f * 70;
        s.tick ||= 0;
        if (T >= s.tick) {
          s.tick = T + 0.052;
          const box = { x: f > 0 ? cx(h) : cx(h) - 32 * z, y: h.y, w: 32 * z, h: h.h };
          for (const e of world.enemies) if (!e.dead && overlap(box, e)) spHit(run, e, 0.33, { knock: 4, quiet: true });
          emit(cx(h) + f * (8 + Math.random() * 24), h.y + 4 + Math.random() * 14, 'spark', Math.random() < 0.5 ? run.col : C.paper);
          sfx.attack('nunchucks', 4);
        }
        return true;
      }
      if (!s.up) {
        s.up = true;
        const box = { x: f > 0 ? cx(h) - 4 : cx(h) - 36 * z, y: h.y - 20, w: 40 * z, h: h.h + 20 };
        for (const e of world.enemies) if (!e.dead && overlap(box, e)) spHit(run, e, 1.9, { knock: 10, launch: 300, big: true });
        h.vy = -260;
        h.onGround = false;
        world.spx.push({ k: 'dragonfx', x: cx(h) + f * 10, y: foot, f, t: 0, life: 0.8, col: run.col });
        impact(cx(h) + f * 12, h.y, 1.5, C.orange, run);
      }
      h.vx = f * 30;
      return T < 0.95;
    }
    case 'tornado':
      if (!s.done && T > 0.12) {
        s.done = true;
        wave(run, 'tornado', cx(h) + f * 22, foot - 28 * z, f * 85, 0, 34 * z, 56 * z, 2.3, 0.42, { knock: 4, re: 0.15, pull: 70 });
        sfx.dash();
      }
      h.vx = 0;
      return T < 0.3;
    case 'pillars':
      h.vx = 0;
      return T < 0.45;
    case 'monkey':
      if (!s.done) {
        s.done = true;
        world.spx.push({ k: 'staff', run, t: 0, life: 0.55, hit: new Map(), len: 112 * z, f, follow: h });
        sfx.dash();
      }
      h.vx = 0;
      h.vy = Math.min(h.vy, 0);
      return T < 0.55;
    case 'arrowrain':
    case 'spearrain':
      h.vx = 0;
      return T < 0.3;
    case 'siege':
      if (T < 0.38) {
        h.vx = 0;
        if (Math.random() < 0.9) emit(cx(h) + f * 8, h.y + 11, 'suck', Math.random() < 0.5 ? run.col : C.paper);
        if (!s.hum) { s.hum = true; sfx.charge?.(); }
        return true;
      }
      if (!s.done) {
        s.done = true;
        wave(run, 'bolt', cx(h) + f * 14, h.y + 11, f * 640, 0, 30, 9 * z, 0.8, 2.9, { knock: 50 });
        h.vx = -f * 160;
        kick(-f, 4);
        flash(run.col, 4);
        shake(0.6);
        hitstop(0.05);
        sfx.boom(1.2);
      }
      return T < 0.55;
    case 'bigstar':
      if (!s.done && T > 0.08) {
        s.done = true;
        wave(run, 'bigstar', cx(h) + f * 16, cy(h), f * 240, 0, 30 * z, 30 * z, 2.4, 0.65, { knock: 12, re: 0.2, swing: 0.6 });
      }
      h.vx = 0;
      return T < 0.25;
    case 'beam':
      h.vx = 0;
      h.vy = Math.min(h.vy, 0);
      if (!s.done) {
        s.done = true;
        world.spx.push({ k: 'beam', run, t: 0, life: 0.9, re: 0.1, hit: new Map(), len: 300, thick: 12 * z, f, follow: h });
        flash(run.col, 4);
        sfx.zap?.();
      }
      if (Math.random() < 0.5) shake(0.3);
      return T < 0.9;
    case 'dragoon':
      if (!s.down && (h.vy >= 0 || T > 0.42)) {
        s.down = true;
        // dive at the nearest foe ahead (or a long way forward if there is none)
        const e = nearest(cx(h) + f * 60, foot0(h, s) - 10, 140 * z, 1)[0], tFall = Math.max(0.12, (foot0(h, s) - foot) / 560);
        s.dvx = e ? Math.max(-420, Math.min(420, (cx(e) - cx(h)) / tFall)) : f * 300;
      }
      if (s.down && !s.slam) {
        h.vy = 560;
        h.vx = s.dvx;
        emit(cx(h) - f * 6, h.y + Math.random() * h.h, 'streak', run.col);
        const box = { x: h.x - 4, y: h.y, w: h.w + 8, h: h.h + 6 };
        for (const e of world.enemies) if (!e.dead && !s.hit.has(e) && overlap(box, e)) { s.hit.set(e, 1); spHit(run, e, 1.4, { knock: 20 }); }
      } else if (!s.down) h.vx = f * 60;
      if (s.down && h.onGround && !s.slam) {
        s.slam = T;
        h.vx = 0;
        for (const e of inside(cx(h), foot - 10, 62 * z, 34)) spHit(run, e, 2.3, { knock: 36, launch: 220, big: true });
        burst(cx(h), foot, 18, 'chip', ['sand', 'stone', 'paper']);
        impact(cx(h), foot - 2, 2, run.col, run);
      }
      return !(s.slam && T > s.slam + 0.3) && T < 1.6;
    case 'berserk':
      h.vx = f * 210;
      s.tick ||= 0;
      if (T >= s.tick) {
        s.tick = T + 0.09;
        for (const e of inside(cx(h), cy(h), 32 * z, 22)) spHit(run, e, 0.58, { knock: 18 });
        sfx.attack('axe', 5);
        ring(cx(h), cy(h), 22 * z, run.light, 0.12);
      }
      emit(cx(h) - f * 8, foot - 2, 'dust', C.mist);
      return T < 0.7;
    case 'splitter':
      h.vx = 0;
      if (!s.done && T > 0.18) {
        s.done = true;
        wave(run, 'fissure', cx(h) + f * 18, foot - 8, f * 270, 0, 16, 16 * z, 0.9, 1.9, { knock: 24, launch: 250 });
        impact(cx(h) + f * 16, foot - 2, 1.5, C.sand, run);
      }
      return T < 0.42;
    case 'harvest':
      h.vx = 0;
      if (!s.done && T > 0.06) {
        s.done = true;
        const foes = inside(cx(h), cy(h), 130 * z, 50);
        for (const e of foes) {
          spHit(run, e, 1.35, { knock: 0 });
          if (!e.boss && !e.dead) e.vx = Math.sign(cx(h) - cx(e)) * 160;
          world.spx.push({ k: 'soul', x: cx(e), y: cy(e), t: 0, life: 0.45, follow: h, col: C.violet });
        }
        s.heal = Math.min(0.12, foes.length * 0.02);
        flash(C.violet, 5);
        ring(cx(h), cy(h), 130 * z, C.violet, 0.4);
        sfx.boom(1);
      }
      if (s.heal && T > 0.45) {
        h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * s.heal));
        burst(cx(h), cy(h), 10, 'twinkle', ['violet', 'pink', 'paper']);
        s.heal = 0;
      }
      return T < 0.55;
    case 'deathmoon':
      h.vx = 0;
      if (!s.done && T > 0.12) {
        s.done = true;
        for (const d of [-1, 1]) wave(run, 'crescent', cx(h) + d * 12, cy(h), d * 270, 0, 30 * z, 52 * z, 1, 1.95, { knock: 30, col: C.violet });
        flash(C.violet, 4);
        sfx.slash();
      }
      return T < 0.35;
    case 'megarang':
      if (!s.done && T > 0.08) {
        s.done = true;
        wave(run, 'megarang', cx(h) + f * 16, cy(h), f * 330, 0, 30 * z, 30 * z, 1.8, 0.65, { knock: 12, re: 0.18, back: true });
      }
      h.vx = 0;
      return T < 0.25;
    case 'flock':
    case 'orbit':
    case 'blackhole':
      h.vx = 0;
      return T < 0.25;
  }
  return false;
}

// ---------------------------------------------------------------- long-lived pieces
function wave(run, style, x, y, vx, vy, w, hh, life, mult, o = {}) {
  world.spx.push({ k: 'wave', style, run, x, y, vx, vy, w, h: hh, life, mult, o, t: 0, re: o.re || 0, hit: new Map(), x0: x, f: Math.sign(vx) || 1, col: o.col || run.col });
}
function strike(run, style, x, y, delay, r, mult, o = {}) {
  world.spx.push({ k: 'strike', style, run, x, y, delay, r, mult, o, t: 0, hit: new Map(), col: o.col || run.col });
}
function slashMark(x, y, col) {
  const a = Math.random() * Math.PI;
  world.spx.push({ k: 'slash', x, y, a, col, t: 0, life: 0.16, len: 34 + Math.random() * 20 });
}
function afterimage(h) {
  world.spx.push({ k: 'ghost', t: 0, life: 0.3, h: { ...h, special: null, attack: null, dashT: 0.1, inv: 0 } });
}

export function updateSpecials(dt) {
  const list = world.spx;
  if (!list || !list.length) return;
  for (const p of list) {
    p.t += dt;
    switch (p.k) {
      case 'wave': {
        if (p.o.back) p.vx -= p.f * 520 * dt; // the megarang turns round and comes home
        if (p.o.swing && Math.floor(p.t / p.o.swing) !== Math.floor((p.t - dt) / p.o.swing)) p.vx = -p.vx; // the giant star bounces
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const box = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
        const foes = world.enemies.filter(e => !e.dead && overlap(box, e));
        hitOnce(p, foes, p.mult, { dir: Math.sign(p.vx) || p.f, knock: p.o.knock, launch: p.o.launch, quiet: !!p.re });
        if (p.o.pull) for (const e of world.enemies) if (!e.dead && !e.boss && Math.abs(cx(e) - p.x) < p.o.pull && Math.abs(cy(e) - p.y) < 40) e.x += Math.sign(p.x - cx(e)) * 70 * dt + p.vx * dt * 0.8;
        if (p.style === 'fissure' && Math.random() < 0.8) emit(p.x, p.y + 6, 'chip', Math.random() < 0.5 ? C.sand : C.orange);
        if (p.style === 'bolt') emit(p.x - p.f * 14, p.y + (Math.random() - 0.5) * 4, 'streak', p.col);
        if (p.style === 'tornado' && Math.random() < 0.6) emit(p.x + (Math.random() - 0.5) * p.w, p.y + p.h / 2, 'dust', C.mist);
        if (p.o.back && p.t > 0.3 && world.hero && Math.abs(p.x - cx(world.hero)) < 10) p.t = p.life;
        break;
      }
      case 'strike':
        if (!p.hitDone && p.t >= p.delay) {
          p.hitDone = true;
          const foes = inside(p.x, p.y - 12, p.r, p.style === 'bolt' || p.style === 'sword' ? 40 : 20);
          hitOnce(p, foes, p.mult, { knock: p.o.knock ?? 18, launch: p.o.launch, hop: true });
          const pow = p.o.pow || 0;
          if (pow) impact(p.x, p.y - 4, pow, p.col, p.run);
          else {
            spark(p.x, p.y - 4, { col: p.col, big: p.style === 'pillar' });
            if (p.style === 'pillar') shake(0.35), sfx.thud(true), burst(p.x, p.y, 6, 'chip', ['sand', 'stone']);
            else if (p.style === 'spear') shake(0.25), sfx.thud(false);
            else if (Math.random() < 0.3) sfx.hit(false, 'bow');
          }
          if (p.style === 'bolt') sfx.zap?.(), burst(p.x, p.y, 6, 'spark', ['sky', 'paper']);
          if (p.o.after === 'split') for (const d of [-1, 1]) wave(p.run, 'fissure', p.x + d * 12, p.y - 8, d * 250, 0, 16, 16 * p.run.size, 0.55, 1, { knock: 20, launch: 200 });
          p.life = p.delay + (p.style === 'sword' ? 0.7 : p.style === 'pillar' ? 0.45 : p.style === 'bolt' ? 0.18 : 0.3);
        }
        p.life ??= p.delay + 1;
        break;
      case 'vortex': {
        for (const e of world.enemies) {
          if (e.dead || e.boss) continue;
          const dx = p.x - cx(e);
          if (Math.abs(dx) < p.r * 1.3 && Math.abs(cy(e) - p.y) < 60) e.x += Math.sign(dx) * Math.min(Math.abs(dx), 130 * dt);
        }
        hitOnce(p, inside(p.x, p.y, p.r * 0.6, 30), 0.26, { knock: 0, quiet: true });
        if (Math.random() < 0.9) emit(p.x, p.y, 'suck', Math.random() < 0.5 ? C.violet : C.pink);
        if (!p.boom && p.t > p.life - 0.05) {
          p.boom = true;
          for (const e of inside(p.x, p.y, p.r * 0.75, 40)) spHit(p.run, e, 2.4, { knock: 40, launch: 200, big: true });
          impact(p.x, p.y, 2.5, C.violet, p.run);
          burst(p.x, p.y, 20, 'mote', ['violet', 'pink', 'paper']);
        }
        break;
      }
      case 'orbit': {
        const h = p.follow;
        p.pts = [];
        for (let i = 0; i < p.n; i++) {
          const a = p.t * 7 + (i / p.n) * Math.PI * 2;
          p.pts.push([cx(h) + Math.cos(a) * p.r, cy(h) + Math.sin(a) * p.r * 0.7]);
        }
        const foes = world.enemies.filter(e => !e.dead && p.pts.some(([x, y]) => Math.abs(cx(e) - x) < e.w / 2 + 5 && Math.abs(cy(e) - y) < e.h / 2 + 5));
        hitOnce(p, foes, 0.5, { knock: 10, quiet: true });
        break;
      }
      case 'beam': {
        const h = p.follow, x0 = cx(h) + p.f * 10, y = h.y + 11;
        p.x0 = x0;
        p.y = y;
        const box = { x: p.f > 0 ? x0 : x0 - p.len, y: y - p.thick / 2, w: p.len, h: p.thick };
        hitOnce(p, world.enemies.filter(e => !e.dead && overlap(box, e)), 0.48, { knock: 8, dir: p.f, quiet: true });
        for (let i = 0; i < 2; i++) emit(x0 + p.f * Math.random() * p.len, y + (Math.random() - 0.5) * p.thick, 'spark', Math.random() < 0.5 ? p.run.col : C.paper);
        break;
      }
      case 'staff': {
        const h = p.follow, k = Math.min(1, p.t / p.life);
        p.ang = -Math.PI / 2 + p.f * k * Math.PI * 2.2;
        const ex = cx(h) + Math.cos(p.ang) * p.len, ey = cy(h) + Math.sin(p.ang) * p.len * 0.8;
        p.ex = ex;
        p.ey = ey;
        const foes = world.enemies.filter(e => !e.dead && segDist(cx(e), cy(e), cx(h), cy(h), ex, ey) < 8 + e.h / 2);
        hitOnce(p, foes, 2.2, { knock: 40, launch: 180, big: true });
        if (Math.random() < 0.6) emit(ex, ey, 'spark', C.gold);
        break;
      }
      case 'shock':
        if (!p.done && p.t >= p.delay) {
          p.done = true;
          const h = p.follow, x = cx(h), y = h.y + h.h;
          for (const e of inside(x, y - 10, 72 * p.run.size, 30)) spHit(p.run, e, 0.8, { knock: 26, hop: true });
          ring(x, y - 4, 72 * p.run.size, C.sand, 0.35);
          burst(x, y, 12, 'chip', ['sand', 'wood']);
          shake(0.5);
          sfx.thud(true);
          p.life = p.t;
        }
        p.life ??= p.delay + 1;
        break;
      case 'soul': {
        const h = p.follow, k = p.t / p.life;
        p.cx = p.x + (cx(h) - p.x) * k;
        p.cy = p.y + (cy(h) - p.y) * k - Math.sin(k * Math.PI) * 20;
        emit(p.cx, p.cy, 'ghost', C.violet);
        break;
      }
      case 'dragonfx':
        emit(p.x + Math.sin(p.t * 20) * 8, p.y - p.t * 140, 'flame', Math.random() < 0.5 ? C.orange : C.gold);
        break;
    }
  }
  world.spx = list.filter(p => p.t < (p.life ?? 1));
}
const foot0 = (h, s) => s.floor ?? h.y + h.h;
function segDist(px_, py_, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy || 1;
  const k = Math.max(0, Math.min(1, ((px_ - x0) * dx + (py_ - y0) * dy) / L));
  return Math.hypot(px_ - (x0 + dx * k), py_ - (y0 + dy * k));
}
export function clearSpecials() {
  world.spx = [];
  S.flash = S.banner = null;
  S.lines = S.dark = 0;
}

// ---------------------------------------------------------------- drawing (world layer)
// a thick pixel line
function line(x0, y0, x1, y1, t, col) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  X.fillStyle = col;
  const o = Math.floor(t / 2);
  for (let i = 0; i <= n; i++) X.fillRect(Math.round(x0 + ((x1 - x0) * i) / n) - o, Math.round(y0 + ((y1 - y0) * i) / n) - o, t, t);
}
function arc(x, y, rx, ry, a0, a1, t, col) {
  const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry)));
  X.fillStyle = col;
  const o = Math.floor(t / 2);
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    X.fillRect(Math.round(x + Math.cos(a) * rx) - o, Math.round(y + Math.sin(a) * ry) - o, t, t);
  }
}
const blink = t => Math.floor(t * 30) % 2;

export function drawSpecials() {
  // the world goes dark behind the special (THOUSAND CUTS, SOUL HARVEST): drawn under its pieces
  if (S.dark > 0) {
    dither(Math.round(world.cameraX || 0) - 8, Math.round(world.cameraY || 0) - 8, W + 16, H + 16, C.ink, Math.min(11, S.dark));
    S.dark--;
  }
  const list = world.spx;
  if (!list || !list.length) return;
  const top = Math.round(world.cameraY || 0) - 10;
  for (const p of list) {
    const k = p.life ? Math.min(1, p.t / p.life) : 0;
    switch (p.k) {
      case 'ring': {
        const r = p.r * (0.3 + 0.7 * Math.sqrt(k));
        arc(p.x, p.y, r, r * 0.45, 0, Math.PI * 2, k < 0.5 ? 3 : 1, k < 0.3 ? C.paper : p.col);
        break;
      }
      case 'wave':
        drawWave(p);
        break;
      case 'strike':
        drawStrike(p, top);
        break;
      case 'slash': {
        const L = p.len * (k < 0.4 ? k / 0.4 : 1), dx = Math.cos(p.a) * L / 2, dy = Math.sin(p.a) * L / 2;
        line(p.x - dx, p.y - dy, p.x + dx, p.y + dy, k < 0.5 ? 3 : 1, p.col);
        if (k < 0.5) line(p.x - dx * 0.7, p.y - dy * 0.7, p.x + dx * 0.7, p.y + dy * 0.7, 1, C.paper);
        break;
      }
      case 'ghost':
        if (blink(p.t)) drawHeroAnimated(p.h, p.t);
        break;
      case 'vortex': {
        const R = p.r * (p.boom ? 1.2 * k : 0.25 + 0.15 * Math.sin(p.t * 20));
        for (let i = 0; i < 3; i++) arc(p.x, p.y, R * (1 - i * 0.28), R * (1 - i * 0.28) * 0.6, p.t * (8 + i * 3), p.t * (8 + i * 3) + Math.PI * 1.4, 2, [C.violet, C.pink, C.paper][i]);
        rect(p.x - 4, p.y - 3, 8, 6, C.ink);
        rect(p.x - 2, p.y - 2, 4, 4, C.indigo);
        break;
      }
      case 'orbit':
        for (const [x, y] of p.pts || []) star(x, y, 4, p.t * 20, p.run.light, C.paper);
        break;
      case 'beam': {
        if (p.x0 == null) break;
        const t = p.thick * (k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1) * (0.85 + 0.15 * blink(p.t));
        const x = p.f > 0 ? p.x0 : p.x0 - p.len;
        rect(x, p.y - t / 2 - 1, p.len, t + 2, p.run.mid);
        rect(x, p.y - t / 2, p.len, t, p.run.col);
        rect(x, p.y - t / 4, p.len, Math.max(1, t / 2), C.paper);
        rect(p.x0 - 6, p.y - t / 2 - 3, 12, t + 6, C.paper); // the muzzle flare
        break;
      }
      case 'staff': {
        const h = p.follow;
        if (p.ex == null) break;
        line(cx(h), cy(h), p.ex, p.ey, 5, C.woodD);
        line(cx(h), cy(h), p.ex, p.ey, 3, C.wood);
        line(cx(h) + (p.ex - cx(h)) * 0.9, cy(h) + (p.ey - cy(h)) * 0.9, p.ex, p.ey, 5, C.gold);
        arc(cx(h), cy(h), p.len, p.len * 0.8, p.ang - p.f * 0.6, p.ang, 1, C.cream);
        break;
      }
      case 'crater': {
        const r = p.r;
        if (k > 0.7 && blink(p.t)) break;
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI - Math.PI;
          line(p.x, p.y - 1, p.x + Math.cos(a) * r * (0.6 + (i % 3) * 0.2), p.y - 1 + Math.sin(a) * 4, 1, i % 2 ? C.orange : C.gold);
        }
        rect(p.x - r * 0.6, p.y - 2, r * 1.2, 2, C.red);
        break;
      }
      case 'soul':
        if (p.cx != null) star(p.cx, p.cy, 3, p.t * 10, C.violet, C.paper);
        break;
    }
  }
}
// a four-point spinning star (shuriken, orbit stars)
function star(x, y, r, a, col, hi) {
  for (let i = 0; i < 4; i++) {
    const b = a + (i * Math.PI) / 2;
    line(x, y, x + Math.cos(b) * r, y + Math.sin(b) * r, 2, col);
  }
  rect(x - 1, y - 1, 2, 2, hi);
}
function drawWave(p) {
  const { x, y, w, h, f, col } = p, k = p.t / p.life;
  if (k > 0.85 && blink(p.t)) return;
  switch (p.style) {
    case 'cross':
      line(x - w / 2, y - h / 2, x + w / 2, y + h / 2, 4, col);
      line(x - w / 2, y + h / 2, x + w / 2, y - h / 2, 4, col);
      line(x - w / 2, y - h / 2, x + w / 2, y + h / 2, 2, C.paper);
      line(x - w / 2, y + h / 2, x + w / 2, y - h / 2, 2, C.paper);
      for (let i = 1; i < 4; i++) rect(x - f * (w / 2 + i * 6), y - 1, 4, 2, col);
      break;
    case 'crescent':
      arc(x - f * w * 0.6, y, w, h / 2, f > 0 ? -1.2 : Math.PI - 1.2, f > 0 ? 1.2 : Math.PI + 1.2, 4, col);
      arc(x - f * w * 0.55, y, w * 0.92, h * 0.44, f > 0 ? -1.0 : Math.PI - 1.0, f > 0 ? 1.0 : Math.PI + 1.0, 2, C.paper);
      arc(x - f * w * 1.1, y, w, h / 2, f > 0 ? -0.9 : Math.PI - 0.9, f > 0 ? 0.9 : Math.PI + 0.9, 1, col);
      break;
    case 'fissure':
      for (let i = 0; i < 6; i++) rect(x - f * i * 5, y + h / 2 - 2 - (i % 2), 5, 2, i % 2 ? C.orange : C.gold);
      line(x, y + h / 2, x + f * 3, y - h / 2, 3, C.orange);
      line(x - f * 3, y + h / 2, x + f * 1, y - h * 0.2, 2, C.gold);
      break;
    case 'tornado':
      for (let i = 0; i < 6; i++) {
        const yy = y + h / 2 - (i * h) / 6, rr = 3 + i * (w / 12);
        arc(x + Math.sin(p.t * 9 + i) * 3, yy, rr, 2, p.t * 14 + i, p.t * 14 + i + Math.PI * 1.3, 1, i % 2 ? C.mist : C.paper);
      }
      break;
    case 'bolt':
      rect(x - f * 18, y - 1, 30, 3, C.woodD);
      rect(x - f * 18, y, 30, 1, col);
      line(x + f * 12, y - h / 2, x + f * 18, y, 2, C.paper);
      line(x + f * 12, y + h / 2, x + f * 18, y, 2, C.paper);
      rect(x - f * 22, y - 3, 4, 7, col);
      break;
    case 'bigstar':
      star(x, y, w / 2, p.t * 24, p.run.mid, C.paper);
      star(x, y, w / 3, p.t * 24 + 0.4, p.run.light, C.paper);
      break;
    case 'megarang': {
      const a = p.t * 22;
      line(x, y, x + Math.cos(a) * w / 2, y + Math.sin(a) * w / 2, 4, p.run.mid);
      line(x, y, x + Math.cos(a + 1.9) * w / 2, y + Math.sin(a + 1.9) * w / 2, 4, p.run.mid);
      line(x, y, x + Math.cos(a) * w / 2, y + Math.sin(a) * w / 2, 2, p.run.light);
      line(x, y, x + Math.cos(a + 1.9) * w / 2, y + Math.sin(a + 1.9) * w / 2, 2, p.run.light);
      break;
    }
  }
}
function drawStrike(p, top) {
  const { x, y, r, col } = p, k = Math.min(1, p.t / p.delay);
  if (!p.hitDone) {
    if (p.o.warn !== false && blink(p.t)) {
      // a target on the ground: two brackets closing in
      const d = r * (1 - k * 0.6);
      rect(x - d, y - 2, 4, 1, C.coral), rect(x + d - 4, y - 2, 4, 1, C.coral);
      rect(x - d, y - 4, 1, 3, C.coral), rect(x + d - 1, y - 4, 1, 3, C.coral);
    }
    // the thing on its way down
    const yy = top + (y - top) * k * k;
    if (p.style === 'arrow' && k > 0.3) line(x, yy - 9, x, yy, 1, C.paper), rect(x - 1, yy, 3, 2, col);
    else if (p.style === 'spear' && k > 0.2) line(x, yy - 18, x, yy, 2, C.wood), line(x, yy - 3, x, yy + 3, 3, C.paper);
    else if (p.style === 'sword') drawSkySword(x, yy, r);
    return;
  }
  const a = p.t - p.delay;
  switch (p.style) {
    case 'sword':
      if (a < 0.5 || blink(p.t)) drawSkySword(x, y, r);
      break;
    case 'bolt':
      if (a < 0.18) {
        let px0 = x, py0 = top;
        for (let yy = top + 12; yy <= y; yy += 12) {
          const nx = x + (Math.random() - 0.5) * 12;
          line(px0, py0, nx, yy, 3, col);
          line(px0, py0, nx, yy, 1, C.paper);
          px0 = nx;
          py0 = yy;
        }
        rect(x - r, y - 2, r * 2, 2, C.paper);
      }
      break;
    case 'pillar': {
      const hh = Math.round(36 * (a < 0.1 ? a / 0.1 : a > 0.3 ? Math.max(0, 1 - (a - 0.3) / 0.15) : 1));
      rect(x - 6, y - hh, 12, hh, C.stone);
      rect(x - 5, y - hh, 3, hh, C.mist);
      rect(x - 6, y - hh, 12, 2, C.sand);
      break;
    }
    case 'arrow':
      if (a < 0.25) line(x, y - 7, x, y, 1, C.paper), rect(x - 1, y - 9, 3, 2, col);
      break;
    case 'spear':
      if (a < 0.3) line(x, y - 18, x, y, 2, C.wood), rect(x - 2, y - 20, 4, 3, col);
      break;
  }
}
// a sword as tall as the screen: blade, guard and grip, point down
function drawSkySword(x, y, r) {
  const L = 76, bw = Math.max(6, Math.round(r / 4));
  rect(x - bw / 2 - 1, y - L, bw + 2, L, C.ink);
  rect(x - bw / 2, y - L, bw, L - 2, C.mist);
  rect(x - bw / 2, y - L, Math.max(1, bw / 3), L - 2, C.paper);
  rect(x - 1, y - 4, 2, 4, C.paper);
  rect(x - bw * 1.6, y - L - 4, bw * 3.2, 5, C.gold);
  rect(x - 2, y - L - 18, 4, 14, C.woodD);
  rect(x - 3, y - L - 22, 6, 5, C.gold);
}

// ---------------------------------------------------------------- drawing (screen layer)
export function drawSpecialScreen() {
  if (S.lines > 0) {
    // speed lines from the screen edges toward the middle
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + S.lines * 0.13, L = 30 + ((i * 37) % 40);
      const ex = W / 2 + Math.cos(a) * 300, ey = H / 2 + Math.sin(a) * 180;
      line(ex, ey, ex - Math.cos(a) * L, ey - Math.sin(a) * L, i % 3 ? 1 : 2, i % 2 ? C.paper : C.cream);
    }
    S.lines--;
  }
  const b = S.banner;
  if (b) {
    b.age++;
    const inT = 6, hold = 34, outT = 6, age = b.age;
    const slide = age < inT ? (1 - age / inT) * W : age > inT + hold ? -((age - inT - hold) / outT) * W : 0;
    const y = 58, hh = 26;
    rect(0, y, W, hh, C.ink);
    rect(0, y - 1, W, 1, b.col);
    rect(0, y + hh, W, 1, b.col);
    for (let i = 0; i < 10; i++) rect(((age * 14 + i * 53) % (W + 40)) - 40, y + 3 + ((i * 7) % (hh - 6)), 18 + (i % 3) * 10, 1, i % 2 ? b.col : C.slate);
    text(b.s, W / 2 + slide, y + 6, Math.floor(age / 3) % 2 ? C.paper : b.col, { align: 'center', k: 2 });
    const sub = (b.cancel ? 'CRAZY CANCEL  ' : '') + (b.boons ? '★'.repeat(b.boons) + ' BOOSTED' : 'SPECIAL');
    text(sub.replace(/★/g, '*'), W / 2 - slide, y + hh - 7, C.gold, { align: 'center' });
    if (age > inT + hold + outT) S.banner = null;
  }
  if (S.flash) {
    const f = S.flash;
    dither(0, 0, W, H, f.col, Math.round((f.n / f.max) * 7));
    if (--f.n <= 0) S.flash = null;
  }
}
// the hero is hidden while THOUSAND CUTS runs
export const heroHidden = h => !!(h.special && h.special.hide);
