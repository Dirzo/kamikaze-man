// The level-clear stat sheet (Sonic's tally): the clock against the stage's par, how much of the
// stage you finished, shards, speed and the damage every weapon did tick in one after another,
// then the grade slams down. RETRY plays the level again, CONTINUE goes back to the map. A failed
// attempt gets the same sheet without a grade.
import { C, W, H } from '../config.js';
import { X, rect, text, textWidth, fitText, panel, dither } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { input } from '../engine/input.js';
import { world } from './world.js';
import { lookOf, rarityColour, frameOfLook } from './looks.js';
import { relicsTaken } from './relics.js';
import { clock } from '../data/speedrun.js';
import { fmt } from '../data/curve.js';
import { RELIC_COUNT } from '../data/relics.js';
import { MODS } from '../data/temper.js';
import { FINAL } from '../data/overworld.js';
import { parTime, completion, gradeOf } from '../data/grade.js';

// the numbers, taken the moment the level ends
export function tally() {
  const R = world.run || {}, m = world.map, relicMax = world.relics?.length || 0;
  const residents = m?.spawns?.length || 0, kills = Math.min(residents, R.residentKills || 0);
  const done = completion({ kills, residents, relics: relicsTaken(), relicMax, secret: !!world.secret?.found, hasSecret: !!world.secret });
  const par = parTime(m?.width || W, residents, m?.walls?.length || 0), t = R.t || 0;
  return {
    t, par, done, kills, residents, relics: relicsTaken(), relicMax, secret: world.secret ? (world.secret.found ? 'FOUND' : 'MISSED') : null,
    top: Math.round(R.top || 0), sprintT: R.sprintT || 0, dealt: R.dealt || 0,
    weapons: [...(R.weapons?.values() || [])].sort((a, b) => b.dmg - a.dmg).slice(0, 5),
    hits: R.hits || 0, falls: R.falls || 0, combo: world.fight?.best || 0,
    grade: gradeOf({ t, par, done, hits: R.hits || 0, falls: R.falls || 0, combo: world.fight?.best || 0 })
  };
}

// ---------------------------------------------------------------- timeline (seconds)
const ROW = 0.22, ROWS_AT = 0.35, BARS_AT = 1.2, GRADE_AT = 2.5, DONE = 3.1;
const ease = p => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
const S = { pick: 1, ticks: 0, slam: false };
export function openLevelEnd() {
  S.pick = 1;
  S.ticks = 0;
  S.slam = false;
  for (const a of ['left', 'right', 'up', 'down', 'confirm', 'jump', 'leave']) input.consume(a); // nothing from the level carries over
}
// -> 'retry' | 'continue' | null. The first press skips the tally to the end.
export function updateLevelEnd(T, skip) {
  if (T < DONE) {
    if (T > 0.3 && (input.take('confirm') | input.take('jump'))) skip();
    return null;
  }
  if (input.take('left') | input.take('right') | input.take('up') | input.take('down')) (S.pick = 1 - S.pick), sfx.ui();
  if (input.take('confirm') | input.take('jump')) return sfx.ui(true), S.pick ? 'continue' : 'retry';
  if (input.take('leave')) return 'continue';
  return null;
}
export const LEVEL_END_DONE = DONE;

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

export function drawLevelEnd(T, t) {
  const E = world.levelEnd, Y = E.tally, clear = E.result === 'clear', final = clear && E.node.id === FINAL;
  dither(0, 0, W, H, C.ink, 10);
  panel('panel', 8, 4, W - 16, H - 8);
  text(final ? 'THE HOARD IS QUIET' : clear ? 'LEVEL CLEAR!' : 'LEVEL FAILED', 20, 12, clear ? C.gold : C.coral, { k: 2 });
  text(fitText(E.node.id + '  ' + E.node.name.toUpperCase(), 210), W - 20, 16, C.paper, { align: 'right' });

  // ---- left: the tally, one row at a time, numbers counting up
  const lx = 22, lw = 176, rows = [];
  const pct = v => Math.round(v * 100) + '%';
  rows.push(['TIME', k => clock(Y.t * k), Y.t <= Y.par ? C.lime : C.paper]);
  rows.push(['PAR', () => clock(Y.par), C.fog]);
  rows.push(['RESIDENTS', k => `${Math.round(Y.kills * k)}/${Y.residents}`, Y.kills >= Y.residents ? C.gold : C.paper]);
  if (Y.relicMax) rows.push(['RELICS', k => `${Math.round(Y.relics * k)}/${Y.relicMax}`, Y.relics >= Y.relicMax ? C.gold : C.paper]);
  if (Y.secret) rows.push(['SECRET', () => Y.secret, Y.secret === 'FOUND' ? C.pink : C.fog]);
  rows.push(['COMPLETION', k => pct(Y.done * k), Y.done >= 1 ? C.gold : C.sky]);
  rows.push(['SHARDS', k => '+' + fmt(Math.round(E.shards * k)), C.ice]);
  rows.push(['TOP SPEED', k => Math.round(Y.top * k) + 'PX/S', C.sky]);
  rows.push(['AT FULL SPRINT', k => clock(Y.sprintT * k), C.sky]);
  rows.push(['DAMAGE', k => fmt(Math.round(Y.dealt * k)), C.coral]);
  rows.push(['HITS TAKEN', k => `${Math.round(Y.hits * k)}` + (Y.falls ? `  FALLS ${Y.falls}` : ''), Y.hits + Y.falls ? C.coral : C.gold]);
  rows.push(['BEST COMBO', k => Math.round(Y.combo * k) + ' HITS', C.gold]);
  rows.forEach(([label, val, col], i) => {
    const at = ROWS_AT + i * ROW * 0.6;
    if (T < at) return;
    const y = 34 + i * 12, k = ease((T - at) / 0.5);
    text(label, lx, y, C.mist);
    text(val(k), lx + lw, y, k < 1 ? C.cream : col, { align: 'right' });
    rect(lx, y + 9, lw, 1, C.night);
  });
  const ticks = rows.filter((_, i) => T >= ROWS_AT + i * ROW * 0.6).length;
  if (ticks > S.ticks) (S.ticks = ticks), sfx.shardTick(ticks);

  // ---- middle: damage by weapon
  const mx = 214, mw = 140;
  rect(mx - 8, 34, 1, 150, C.slate);
  text('DAMAGE BY WEAPON', mx, 36, C.gold);
  const max = Y.weapons[0]?.dmg || 1, grow = ease((T - BARS_AT) / 1.1);
  Y.weapons.forEach((e, i) => {
    const y = 50 + i * 26, col = e.w.standout ? C.gold : rarityColour(e.w.q);
    icon(e.w, mx, y, 20, 12, t);
    text(fitText(e.w.name, mw - 24), mx + 24, y, col);
    bar(mx + 24, y + 10, mw - 24, 3, (e.dmg / max) * grow, col);
    text(fmt(Math.round(e.dmg * grow)) + '  ' + Math.round((e.dmg / Math.max(1, Y.dealt)) * 100) + '%', mx + mw, y + 15, C.paper, { align: 'right' });
  });
  if (!Y.weapons.length) text('NO DAMAGE DEALT', mx, 50, C.fog);

  // ---- right: the grade slams down (Sonic's rank), with a flash and a ring of stars
  const gx = 412, gy = 94;
  rect(gx - 50, 34, 1, 150, C.slate);
  text(clear ? 'GRADE' : 'RESULT', gx, 36, C.gold, { align: 'center' });
  if (T >= GRADE_AT) {
    const G = Y.grade, p = Math.min(1, (T - GRADE_AT) / 0.25);
    if (!S.slam) (S.slam = true), clear ? (sfx.levelUp(), G.g === 'S' && sfx.clear()) : sfx.hurt();
    if (clear) {
      const k = Math.max(8, Math.round(16 - p * 8)), col = G.g === 'S' ? [C.gold, C.cream, C.orange, C.pink][Math.floor(t * 12) % 4] : C[G.col];
      if (p < 1) dither(gx - 44, 46, 88, 104, C.paper, Math.round((1 - p) * 12)); // the flash as it lands
      text(G.g, gx, gy - (k * 7) / 2, col, { k, align: 'center' });
      // stars spin out round the letter after it lands
      const s = T - GRADE_AT - 0.25;
      if (s > 0 && s < 0.9) for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + s * 2, r = 22 + s * 40;
        rect(Math.round(gx + Math.cos(a) * r), Math.round(gy + Math.sin(a) * r * 0.8), 2, 2, i % 2 ? C.gold : C.paper);
      }
      if (p >= 1) {
        text(G.word, gx, gy + 38, col, { align: 'center' });
        text(`SCORE ${Math.round(G.score * 100)}`, gx, gy + 50, C.mist, { align: 'center' });
      }
    } else {
      text('NO', gx, gy - 18, C.coral, { k: 3, align: 'center' });
      text('GRADE', gx, gy + 6, C.coral, { k: 2, align: 'center' });
      text('THE MAP IS SAFE', gx, gy + 34, C.mist, { align: 'center' });
    }
  }

  // ---- bottom: what the clear opened, then RETRY / CONTINUE
  const extra = [];
  const line = final ? 'YOU BEAT CRAZY WEAPON MAN. THE CLOSETS STILL HAVE SECRETS.'
    : E.secret ? 'SECRET EXIT! A HIDDEN PATH OPENS'
    : clear ? (E.fresh.length > 1 ? 'A FORK IN THE ROAD! ' + E.fresh.length + ' NEW PATHS OPEN' : E.fresh.length ? 'A NEW PATH OPENS' : 'YOUR GEAR IS SAVED')
    : 'NOTHING LOST BUT THE ATTEMPT. THE SHARDS ARE BANKED.';
  extra.push([line, clear ? C.lime : C.mist]);
  if (E.trophy) extra.push([`TROPHY: ${E.trophy.name}  NEW POWER: ${E.trophy.perk}`, C.gold], [E.trophy.desc.toUpperCase(), C.cream]);
  if (E.relics?.set) extra.push([`ALL ${RELIC_COUNT} RELICS! A STAR FOR ${E.node.id}`, C.gold]);
  else if (E.relics?.fresh) extra.push([`${E.relics.fresh} NEW RELIC${E.relics.fresh > 1 ? 'S' : ''} KEPT`, C.cream]);
  if (E.temperUp) extra.push([`TEMPER ${E.temperUp} UNLOCKED: ${MODS[E.temperUp - 1].name}  (T ON THE MAP)`, C.coral]);
  if (E.cards) extra.push([`MONSTER BOOK: ${E.cards} CARD${E.cards > 1 ? 'S' : ''} WENT UP A TIER`, C.sky]);
  if (E.stable) extra.push(['THE STABLE IS OPEN! PICK A MOUNT: E (POWERS) > STABLE', C.lime]);
  rect(20, 188, W - 40, 1, C.slate);
  extra.slice(0, 4).forEach(([s, col], i) => text(fitText(s, W - 44), W / 2, 193 + i * 10, col, { align: 'center' }));
  if (T >= DONE) {
    const opts = ['RETRY', clear ? 'CONTINUE' : 'BACK TO MAP'], bw = 110, y = H - 26;
    opts.forEach((o, i) => {
      const x = W / 2 + (i ? 8 : -8 - bw), on = S.pick === i;
      rect(x, y, bw, 14, on ? C.gold : C.slate);
      rect(x + 1, y + 1, bw - 2, 12, on ? C.wine : C.night);
      text((on ? '> ' : '') + o, x + bw / 2, y + 4, on ? C.cream : C.fog, { align: 'center' });
    });
  } else if (Math.floor(t * 3) % 2) text('JUMP / ENTER: SKIP', W / 2, H - 22, C.fog, { align: 'center' });
}
