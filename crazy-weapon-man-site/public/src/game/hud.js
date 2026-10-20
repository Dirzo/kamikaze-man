// HUD: framed bottom bar (HP | SPECIAL | WEAPON | SHARDS + LV), zone/wave line, kills, boss bar,
// toasts. Drawn in screen space (no screenshake).
import { C, W, H } from '../config.js';
import { X, rect, text, textWidth, fitText, panel, dither } from '../engine/gfx.js';
import { world } from './world.js';
import { ZONES } from '../data/zones.js';
import { TYPES } from '../data/weapons.js';
import { xpToLevel, fmt } from '../data/curve.js';
import { dps } from './loot.js';
import { lookOf, rarityColour, frameOfLook } from './looks.js';
import { mutationLabel, MUTATIONS } from '../data/progression.js';
import { enemiesLeft, swarmBossUp } from './waves.js';
import { COMBO, comboMult } from '../data/swarm.js';
import { PROF_DMG } from '../data/proficiency.js';
import { QUIRKS } from '../data/quirks.js';
import { clock as clockOf } from '../data/speedrun.js';

const BAR_Y = H - 28;

function bar(x, y, w, h, frac, col, back = C.night) {
  rect(x - 1, y - 1, w + 2, h + 2, C.ink);
  rect(x, y, w, h, back);
  rect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), h, col);
  if (h >= 3) rect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), 1, C.paper);
}
function heart(x, y) {
  rect(x, y, 2, 2, C.red);
  rect(x + 3, y, 2, 2, C.red);
  rect(x, y + 1, 5, 2, C.red);
  rect(x + 1, y + 3, 3, 1, C.red);
  rect(x + 2, y + 4, 1, 1, C.red);
  rect(x + 1, y, 1, 1, C.coral);
}
function gem(x, y) {
  rect(x, y + 1, 4, 2, C.sky);
  rect(x + 1, y, 2, 4, C.ice);
  rect(x + 1, y + 1, 1, 1, C.paper);
}

export function drawHud(t) {
  const h = world.hero;
  if (!h) return;
  // ---- bottom bar ----
  panel('panel', 0, BAR_Y, W, 28);
  const y = BAR_Y + 10;
  const label = (s, x) => text(s, x, BAR_Y + 2, C.gold);
  // HP
  label('HP', 8);
  heart(8, y + 1);
  bar(16, y + 2, 58, 4, h.hp / h.maxHp, h.hp / h.maxHp < 0.3 && Math.floor(t * 6) % 2 ? C.coral : C.red);
  text(fmt(h.hp), 78, y, C.paper);
  sep(104);
  // SPECIAL
  const T = TYPES[h.weapon.type];
  label(T.specialName, 110);
  const ready = h.specialCd <= 0;
  bar(110, y + 2, 44, 4, ready ? 1 : 1 - h.specialCd / (h.specialMax || T.cool), ready ? C.lime : C.teal);
  text(ready ? 'READY' : h.specialCd.toFixed(1), 158, y, ready ? C.lime : C.mist);
  sep(190);
  // WEAPON: icon, scrolling name, DPS
  label('WEAPON', 196);
  const w = h.weapon,
    L = lookOf(w, frameOfLook(w.look, t));
  const k = Math.min(1, 10 / L.crop.h, 22 / L.crop.w);
  const iw = Math.max(1, Math.round(L.crop.w * k)),
    ih = Math.max(1, Math.round(L.crop.h * k));
  X.drawImage(L.cv, L.crop.x, L.crop.y, L.crop.w, L.crop.h, 196, y + 4 - Math.floor(ih / 2), iw, ih);
  const dpsText = fmt(dps(w)) + ' DPS',
    dpsW = textWidth(dpsText);
  const nx = 196 + iw + 4,
    room = 372 - dpsW - 6 - nx;
  const nameCol = w.standout ? C.gold : rarityColour(w.q);
  const nmW = textWidth(w.name);
  if (nmW <= room) text(w.name, nx, y, nameCol);
  else {
    const over = nmW - room,
      slide = over / 14,
      cyc = slide + 3,
      tt = t % cyc,
      off = Math.round(tt < 1.5 ? 0 : tt < 1.5 + slide ? (tt - 1.5) * 14 : over);
    X.save();
    X.beginPath();
    X.rect(nx, y - 2, room, 12);
    X.clip();
    text(w.name, nx - off, y, nameCol);
    X.restore();
  }
  text(dpsText, 372, y, C.gold, { align: 'right' });
  sep(378);
  // SHARDS + LV + XP
  label('LV ' + h.lv, 384);
  gem(384, y + 1);
  text(fmt(world.shards), 391, y, C.ice);
  bar(426, y + 2, 46, 4, h.xp / xpToLevel(h.lv), C.gold);

  // ---- top lines ----
  const Z = ZONES[world.zone];
  text(Z.name, 6, 5, C.paper);
  const D = world.director;
  let sub = '';
  if (D) {
    if (D.phase === 'fight') sub = `${enemiesLeft()} ENEMIES LEFT   CLEAR THE MAP`;
    else if (D.phase === 'intro') sub = `${enemiesLeft()} ENEMIES LEFT   EXPLORE >`;
    else if (D.phase === 'arena') sub = 'MAP CLEAR - THE ARENA IS AT THE END >';
    else if (D.phase === 'survive') sub = swarmBossUp() ? 'BEAT THE BOSS' : 'SURVIVE THE SWARM';
    else if (D.phase === 'exit') sub = 'MAP CLEAR - REACH THE EXIT >';
  }
  text(sub, 6, 15, C.mist);
  text(mutationLabel(h.weapon), W - 6, 16, h.weapon.mutation ? C.gold : C.fog, {align:'right'});
  if (world.run) text(clockOf(world.run.t), W / 2, 5, C.cream, { align: 'center' });
  const kills = `${world.kills} KILLS`;
  text(kills, W - 6, 5, C.paper, { align: 'right' });
  const bagN = world.bag.filter(Boolean).length;
  text(`E BAG ${bagN}/${world.bag.length}${world.bagNew ? ' NEW!' : ''}`, W - 14 - textWidth(kills), 5, world.bagNew ? C.lime : C.ice, { align: 'right' });
  const qk = QUIRKS[h.weapon.quirk];
  if (qk) text(qk.label, W - 12 - textWidth(mutationLabel(h.weapon)), 16, C.fog, { align: 'right' });

  // Full equipped name stays visible without waiting for the bottom ticker.
  panel('panel', 4, 25, W - 8, 17);
  const nameScale = textWidth(w.name) <= W - 28 ? 1 : (W - 28) / textWidth(w.name);
  X.save(); X.translate(W / 2, 30); X.scale(nameScale, 1);
  text(w.name, 0, 0, C.paper, {align:'center'}); X.restore();

  // ---- weapon lust meter ----
  const lust = h.lust || 0;
  text('LUST', 6, 46, lust > 0 ? C.pink : C.fog);
  bar(32, 48, 60, 3, lust / 100, C.pink);
  if (h.newToyT > 0) text('NEW TOY!', 98, 46, Math.floor(t * 6) % 2 ? C.pink : C.paper);
  // ---- survival countdown ----
  // no countdown: the boss's arrival is meant to be a surprise
  if (D && D.phase === 'survive' && !swarmBossUp()) text('SURVIVE!', W / 2, 50, Math.floor(t * 3) % 2 ? C.coral : C.cream, { align: 'center', k: 2 });
  // ---- swarm combo meter: drains while you're not hitting anything ----
  const cb = world.swarmCombo;
  if (D && D.phase === 'survive' && cb) {
    const on = cb.n > 0,
      x = 6;
    text('COMBO', x, 57, on ? C.gold : C.fog);
    text(on ? 'x' + cb.n : '-', x + 34, 54, on ? (cb.n >= 50 ? C.gold : C.cream) : C.fog, { k: 2 });
    bar(x, 72, 80, 3, on ? cb.t / COMBO.window(cb.n) : 0, cb.t < 0.5 && Math.floor(t * 10) % 2 ? C.coral : C.gold);
    const bonus = Math.round((comboMult(cb) - 1) * 100);
    if (bonus > 0) text(`+${bonus}% DMG`, x, 79, C.lime);
    else if (!on && cb.lost >= 10) text(`LOST x${cb.lost}`, x, 79, C.coral);
  }
  // ---- boss bar ----
  const b = world.boss;
  if (b && !b.dead) {
    const bw = 200,
      bx = (W - bw) / 2;
    text(b.name, W / 2, 45, C.gold, { align: 'center' });
    bar(bx, 55, bw, 5, b.hp / b.max, C.red);
    for (const f of [1 / 3, 2 / 3]) rect(bx + Math.round(bw * f), 55, 1, 5, C.ink);
  }

  // ---- zone intro card ----
  if (D && D.phase === 'intro') {
    const a = Math.min(1, (2.6 - D.t) * 4, D.t * 3);
    if (a > 0.1) {
      dither(0, 92, W, 50, C.ink, 11);
      const home = Z.weapon ? `HOME OF THE ${Z.weapon.toUpperCase()}` : 'HOME OF EVERY WEAPON';
      const L = world.level; // an overworld level is named for itself, in its zone
      text(L ? `${L.id}  -  ${Z.name.toUpperCase()}  -  ${home}` : `ZONE ${world.zone + 1}` + (world.map ? ` - ${world.map.title}` : '') + `  -  ${home}`, W / 2, 98, C.gold, { align: 'center' });
      text(L ? L.name : Z.name, W / 2, 108, C.paper, { align: 'center', k: 2 });
      text(fitText(Z.sub, 460), W / 2, 128, C.mist, { align: 'center' });
    }
  }

  // ---- toasts ----
  let ty = D && D.phase === 'survive' ? 86 : b && !b.dead ? 66 : 46;
  for (let i = world.toasts.length - 1; i >= 0; i--) {
    const to = world.toasts[i];
    if (to.kind === 'weapon') {
      const l1 = (to.standout ? 'STANDOUT WEAPON!  +' : 'NEW WEAPON  +') + to.gain + '% POWER';
      const l2 = fitText(to.name, 300);
      const tw = Math.max(textWidth(l1), textWidth(l2)) + 14;
      panel('card', W / 2 - tw / 2, ty, tw, 24);
      text(l1, W / 2, ty + 4, to.standout ? C.lime : C.gold, { align: 'center' });
      text(l2, W / 2, ty + 13, to.standout ? C.gold : to.col, { align: 'center' });
      ty += 28;
    } else if (to.kind === 'power') {
      panel('card', W / 2 - 142, ty, 284, 32);
      text(to.label + ' UNLOCKED', W / 2, ty + 5, C.gold, {align:'center'});
      text(to.desc, W / 2, ty + 18, C.paper, {align:'center'});
      ty += 36;
    } else if (to.kind === 'bag') {
      const l1 = to.head || 'INTO THE BAG   E: OPEN',
        l2 = fitText(to.name, 300),
        tw = Math.max(textWidth(l1), textWidth(l2)) + 14;
      panel('card', W / 2 - tw / 2, ty, tw, 24);
      text(l1, W / 2, ty + 4, to.hot ? (Math.floor(t * 6) % 2 ? C.lime : C.gold) : C.ice, { align: 'center' });
      text(l2, W / 2, ty + 13, to.col, { align: 'center' });
      ty += 28;
    } else if (to.kind === 'mastery') {
      const l1 = `${to.type.toUpperCase()} MASTERY LV ${to.lv}`,
        l2 = `${to.rank}   +${Math.round(to.lv * PROF_DMG * 1000) / 10}% ${to.type.toUpperCase()} DAMAGE`,
        tw = Math.max(textWidth(l1, 2), textWidth(l2)) + 14;
      panel('card', W / 2 - tw / 2, ty, tw, 32);
      text(l1, W / 2, ty + 5, C.sky, { align: 'center', k: 2 });
      text(l2, W / 2, ty + 21, C.paper, { align: 'center' });
      ty += 36;
    } else if (to.kind === 'split') {
      const l1 = `ZONE ${to.zone + 1} SPLIT  ${clockOf(to.t)}`,
        l2 = to.d ? `${to.d} VS BEST   RUN ${clockOf(to.total)}` : `FIRST SPLIT   RUN ${clockOf(to.total)}`,
        tw = Math.max(textWidth(l1, 2), textWidth(l2)) + 14;
      panel('card', W / 2 - tw / 2, ty, tw, 32);
      text(l1, W / 2, ty + 5, C.gold, { align: 'center', k: 2 });
      text(l2, W / 2, ty + 21, to.ahead ? C.lime : C.coral, { align: 'center' });
      ty += 36;
    } else if (to.kind === 'level') {
      panel('card', W / 2 - 60, ty, 120, 32);
      text('LEVEL UP!', W / 2, ty + 5, C.gold, { align: 'center', k: 2 });
      text(`LV ${to.lv}  MAX HP UP`, W / 2, ty + 21, C.paper, { align: 'center' });
      ty += 36;
    }
  }
}
function sep(x) {
  rect(x, BAR_Y + 4, 1, 20, C.ink);
  rect(x + 1, BAR_Y + 4, 1, 20, C.slate);
}
