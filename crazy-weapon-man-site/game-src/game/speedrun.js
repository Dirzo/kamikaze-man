// Speedrun: a run clock (paused only by the pause menu), a split at every exit portal with its
// best-ever comparison, damage dealt per weapon, and mastery gained this run. The end screen
// animates all of it: the clock counts up, splits tick in, damage bars grow, mastery bars fill.
import { C, W, H } from '../config.js';
import { X, rect, text, textWidth, fitText, panel, dither } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { lookOf, rarityColour, frameOfLook } from './looks.js';
import { toast } from './progress.js';
import { ZONES } from '../data/zones.js';
import { TYPE_LIST } from '../data/weapons.js';
import { SECRETS } from './secrets.js';
import { proficiency, profToNext, PROF_MAX } from '../data/proficiency.js';
import { clock, delta, shortDelta, records, recordSplit, recordClear } from '../data/speedrun.js';
import { fmt } from '../data/curve.js';

export function newRun() {
  const prof = {};
  for (const t of TYPE_LIST) prof[t] = { ...proficiency(t) };
  world.run = { t: 0, zoneT: 0, splits: [], weapons: new Map(), dealt: 0, prof, best: null, prevBest: null, ended: false, ticks: 0, residentKills: 0, top: 0, sprintT: 0 };
}
export function tickRun(dt) {
  if (world.run && !world.run.ended) world.run.t += dt;
}

// every point of damage the hero deals is credited to the weapon in hand
export function logDamage(dmg, w = world.hero && world.hero.weapon) {
  const R = world.run;
  if (!R || !w || !(dmg > 0)) return;
  let e = R.weapons.get(w);
  if (!e) R.weapons.set(w, (e = { w, dmg: 0 }));
  e.dmg += dmg;
  R.dealt += dmg;
}

// the hero stepped into the exit portal
export function splitZone() {
  const R = world.run;
  if (!R) return;
  const t = R.t - R.zoneT,
    prev = recordSplit(world.zone, t);
  R.splits.push({ zone: world.zone, t, total: R.t, prev });
  R.zoneT = R.t;
  toast('split', { zone: world.zone, t, total: R.t, d: shortDelta(t, prev), ahead: prev == null || t <= prev });
}

export function endRun(won) {
  const R = world.run;
  if (!R || R.ended) return;
  R.ended = true;
  R.won = won;
  if (won) {
    R.prevBest = recordClear(R.t);
    R.newBest = R.prevBest == null || R.t < R.prevBest;
  } else R.prevBest = records().best;
}

// ---------------------------------------------------------------- end screen
const ease = p => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
export const RESULTS_TIME = 3.6; // when every part of the animation has landed

function icon(w, x, y, bw, bh, t) {
  const L = lookOf(w, frameOfLook(w.look, t));
  const k = Math.min(1, bh / L.crop.h, bw / L.crop.w);
  const iw = Math.max(1, Math.round(L.crop.w * k)),
    ih = Math.max(1, Math.round(L.crop.h * k));
  X.drawImage(L.cv, L.crop.x, L.crop.y, L.crop.w, L.crop.h, Math.round(x + (bw - iw) / 2), Math.round(y + (bh - ih) / 2), iw, ih);
}
function bar(x, y, w, h, frac, col) {
  rect(x - 1, y - 1, w + 2, h + 2, C.ink);
  rect(x, y, w, h, C.night);
  rect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), h, col);
}
// absolute mastery xp <-> (level, xp into level)
const absXp = p => {
  let n = p.xp;
  for (let i = 0; i < p.lv; i++) n += profToNext(i);
  return n;
};
function fromAbs(n) {
  let lv = 0;
  while (lv < PROF_MAX && n >= profToNext(lv)) n -= profToNext(lv++);
  return { lv, xp: n };
}

export function drawResults(won, T, t) {
  const R = world.run,
    h = world.hero;
  if (!R) return;
  dither(0, 0, W, H, C.ink, 12);
  panel('panel', 6, 4, W - 12, H - 8);
  text(won ? 'THE DRAGON FALLS' : 'YOU DIED', W / 2, 11, won ? C.gold : C.red, { align: 'center', k: 2 });

  // ---- left: clock, best, splits, stats ----
  const lx = 16,
    lw = 186;
  const shown = R.t * ease(T / 1.2);
  text(won ? 'CLEAR TIME' : 'TIME SURVIVED', lx, 32, C.mist);
  text(clock(shown), lx, 42, T < 1.2 ? C.cream : won ? C.gold : C.paper, { k: 3 });
  if (T >= 1.2) {
    if (won && R.newBest) text(R.prevBest == null ? 'FIRST CLEAR! NEW BEST' : `NEW BEST!  ${delta(R.t, R.prevBest)}`, lx, 66, Math.floor(t * 6) % 2 ? C.lime : C.gold);
    else if (won) text(`BEST ${clock(R.prevBest)}  ${delta(R.t, R.prevBest)}`, lx, 66, C.coral);
    else text(`DIED IN ZONE ${world.zone + 1}${R.prevBest != null ? '   BEST ' + clock(R.prevBest) : ''}`, lx, 66, C.coral);
  }
  rect(lx, 77, lw, 1, C.slate);
  text('SPLITS', lx, 81, C.gold);
  const rows = R.splits.slice(-10);
  rows.forEach((s, i) => {
    if (T < 1.2 + i * 0.12) return;
    const y = 92 + i * 10;
    text(`${s.zone + 1}`, lx, y, C.fog);
    text(fitText(ZONES[s.zone].name.toUpperCase(), 92), lx + 12, y, C.mist);
    text(clock(s.t), lx + 150, y, C.paper, { align: 'right' });
    const d = shortDelta(s.t, s.prev);
    if (d) text(d, lx + lw, y, s.t <= s.prev ? C.lime : C.coral, { align: 'right' });
    else text('NEW', lx + lw, y, C.gold, { align: 'right' });
  });
  if (!rows.length && T >= 1.2) text('NO ZONE CLEARED', lx, 92, C.fog);
  const sy = 200;
  rect(lx, sy - 4, lw, 1, C.slate);
  [['KILLS', fmt(world.kills)], ['LEVEL', String(h ? h.lv : 1)], ['SECRETS', `${world.secretsFound || 0}/${SECRETS.length}`]].forEach(([a, b], i) => {
    text(a, lx + i * 64, sy, C.mist);
    text(b, lx + i * 64, sy + 10, C.paper, { k: 1 });
  });
  text(`${fmt(R.dealt)} DAMAGE`, lx, sy + 24, C.gold);
  text(`${(R.dealt / Math.max(1, R.t)).toFixed(0)} DPS AVERAGE`, lx, sy + 34, C.mist);

  // ---- right top: damage dealt by weapon ----
  const rx = 214,
    rw = W - 16 - rx;
  rect(rx - 6, 30, 1, 222, C.slate);
  text('DAMAGE BY WEAPON', rx, 32, C.gold);
  const list = [...R.weapons.values()].sort((a, b) => b.dmg - a.dmg);
  const top = list.slice(0, 6),
    max = top.length ? top[0].dmg : 1,
    grow = ease((T - 1.4) / 1.2);
  top.forEach((e, i) => {
    const y = 44 + i * 17,
      col = e.w.standout ? C.gold : rarityColour(e.w.q);
    icon(e.w, rx, y, 20, 12, t);
    text(fitText(e.w.name, rw - 80), rx + 24, y, col);
    text(fmt(e.dmg * grow), rx + rw, y, C.paper, { align: 'right' });
    bar(rx + 24, y + 9, rw - 24, 3, (e.dmg / max) * grow, col);
    if (e.w === (h && h.weapon) && grow >= 1) rect(rx + 21, y + 1, 1, 10, C.cream);
  });
  if (!top.length) text('NO DAMAGE DEALT', rx, 46, C.fog);
  if (list.length > 6) text(`+${list.length - 6} MORE WEAPONS  ${fmt(list.slice(6).reduce((n, e) => n + e.dmg, 0))}`, rx, 146, C.fog);

  // ---- right bottom: mastery gained this run ----
  const my = 160;
  rect(rx, my - 4, rw, 1, C.slate);
  text('MASTERY THIS RUN', rx, my, C.gold);
  const gains = TYPE_LIST.map(type => ({ type, a: absXp(R.prof[type]), b: absXp(proficiency(type)) }))
    .filter(g => g.b > g.a)
    .sort((x, y) => y.b - y.a - (x.b - x.a))
    .slice(0, 8);
  const fill = ease((T - 2.3) / 1.2);
  gains.forEach((g, i) => {
    const col = i % 2,
      row = Math.floor(i / 2),
      x = rx + col * (rw / 2 + 2),
      y = my + 12 + row * 19,
      cw = rw / 2 - 6;
    const now = fromAbs(g.a + (g.b - g.a) * fill),
      start = fromAbs(g.a),
      up = now.lv - start.lv;
    text(g.type.toUpperCase(), x, y, C.mist);
    text(`LV${now.lv}${up > 0 ? ' +' + up : ''}`, x + cw, y, up > 0 ? C.lime : C.paper, { align: 'right' });
    bar(x, y + 10, cw, 3, now.lv >= PROF_MAX ? 1 : now.xp / profToNext(now.lv), up > 0 && fill < 1 && Math.floor(t * 10) % 2 ? C.lime : C.sky);
  });
  if (!gains.length && T > 2.3) text('NO KILLS, NO MASTERY', rx, my + 12, C.fog);

  // a tick for each split and a chime when the clock lands
  const beats = Math.min(rows.length, Math.max(0, Math.floor((T - 1.2) / 0.12) + 1)) + (T >= 1.2 ? 1 : 0);
  if (beats > R.ticks) {
    R.ticks = beats;
    sfx.ui(R.ticks === 1);
  }
  if (T > RESULTS_TIME - 1 && Math.floor(T * 2) % 2) text('PRESS START TO GO AGAIN', W / 2, H - 15, C.lime, { align: 'center' });
}
