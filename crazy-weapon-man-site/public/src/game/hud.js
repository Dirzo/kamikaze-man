// HUD: framed bottom bar (ARMOR | SPECIAL | WEAPON | SHARDS + LV), zone/wave line, kills, boss bar,
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
import { FIGHT, fightMult } from '../data/feel.js';
import { PROF_DMG } from '../data/proficiency.js';
import { QUIRKS } from '../data/quirks.js';
import { specialOf } from '../data/specials.js';
import { clock as clockOf } from '../data/speedrun.js';
import { drawRelicPips } from './relics.js';
import { gimmickName } from './gimmicks.js';
import { GIMMICKS } from '../data/gimmicks.js';
import { mountDef } from './mount.js';
import { ARMOR } from '../data/feel.js';

const BAR_Y = H - 28;

function bar(x, y, w, h, frac, col, back = C.night) {
  rect(x - 1, y - 1, w + 2, h + 2, C.ink);
  rect(x, y, w, h, back);
  rect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), h, col);
  if (h >= 3) rect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), 1, C.paper);
}
// the armor shield: whole (the weapon in hand takes the next hit) or split down the middle (cracked)
function shield(x, y, cracked, t) {
  const blink = cracked && Math.floor(t * 6) % 2;
  const face = cracked ? (blink ? C.paper : C.red) : C.sky, rim = cracked ? C.wine : C.ink, hi = cracked ? C.coral : C.ice;
  rect(x, y, 9, 1, rim);
  rect(x - 1, y + 1, 11, 6, rim);
  rect(x, y + 7, 9, 2, rim);
  rect(x + 2, y + 9, 5, 1, rim);
  rect(x + 3, y + 10, 3, 1, rim);
  rect(x, y + 1, 9, 6, face);
  rect(x + 1, y + 7, 7, 2, face);
  rect(x + 3, y + 9, 3, 1, face);
  rect(x + 1, y + 2, 2, 3, hi);
  if (cracked) {
    // the crack: a zigzag top to tip
    rect(x + 4, y, 1, 3, C.ink);
    rect(x + 5, y + 3, 1, 2, C.ink);
    rect(x + 3, y + 5, 1, 3, C.ink);
    rect(x + 4, y + 8, 1, 3, C.ink);
  }
}
function gem(x, y) {
  rect(x, y + 1, 4, 2, C.sky);
  rect(x + 1, y, 2, 4, C.ice);
  rect(x + 1, y + 1, 1, 1, C.paper);
}

// a cracked weapon: the screen edge pulses red in time with the heartbeat (hero.js plays it)
function lowHealth(h, t) {
  if (h.dead || !h.cracked) return;
  const beat = (Math.sin(t * Math.PI * 2 * 1.25) + 1) / 2, lv = 3 + beat * 6, d = 3 + Math.round(beat * 3);
  dither(0, 0, W, d, C.red, lv);
  dither(0, BAR_Y - d, W, d, C.red, lv);
  dither(0, d, d, BAR_Y - d * 2, C.red, lv);
  dither(W - d, d, d, BAR_Y - d * 2, C.red, lv);
}
export function drawHud(t) {
  const h = world.hero;
  if (!h) return;
  lowHealth(h, t);
  // ---- bottom bar ----
  panel('panel', 0, BAR_Y, W, 28);
  const y = BAR_Y + 10;
  const label = (s, x) => text(s, x, BAR_Y + 2, C.gold);
  // ARMOR: the weapon in hand is it (combat.js hurtHero). Two pips: hits it can still take
  const cracked = !!h.cracked, blink = Math.floor(t * 6) % 2;
  label('ARMOR', 8);
  shield(9, y - 2, cracked, t);
  for (let i = 0; i < 2; i++) {
    const on = i === 0 || !cracked, px = 22 + i * 12;
    rect(px - 1, y - 1, 11, 7, C.ink);
    rect(px, y, 9, 5, on ? (cracked ? (blink ? C.paper : C.red) : C.lime) : C.night);
    if (on) rect(px, y, 9, 1, C.paper);
  }
  text(cracked ? '1 HIT!' : 'WHOLE', 48, y, cracked ? (blink ? C.paper : C.coral) : C.lime);
  // SPEED: the momentum gauge under the health bar, flashing at a full sprint (RUSH)
  const mom = h.mom || 0, rushing = h.sprint && Math.floor(t * 10) % 2;
  bar(16, y + 10, 58, 2, mom, rushing ? C.paper : h.sprint ? C.sky : C.blue);
  if (h.sprint) text('RUSH', 78, y + 8, rushing ? C.paper : C.sky);
  sep(104);
  // SPECIAL
  const T = TYPES[h.weapon.type];
  label(specialOf(h.weapon).name, 110);
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
  if (h.cracked) for (let i = 0; i < 4; i++) rect(196 + Math.round(iw * (0.25 + i * 0.17)), y + (i % 2 ? 1 : 4), 1, 4, C.red); // the cracks
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
  if (world.hidden?.inRoom) sub = 'SECRET ROOM   WALK OUT THE EXIT DOOR ON THE LEFT TO GO BACK';
  else if (D) {
    if (D.phase === 'fight' || D.phase === 'intro') sub = `RUN TO THE ARENA >   ${enemiesLeft()} LEFT FOR A FULL CLEAR`;
    else if (D.phase === 'arena') sub = 'FULL CLEAR! - THE ARENA IS AT THE END >';
    else if (D.phase === 'survive') sub = swarmBossUp() ? 'BEAT THE BOSS' : 'SURVIVE THE SWARM';
    else if (D.phase === 'exit') sub = 'MAP CLEAR - REACH THE EXIT >';
  }
  text(sub, 6, 15, C.mist);
  text(mutationLabel(h.weapon), W - 6, 16, h.weapon.mutation ? C.gold : C.fog, {align:'right'});
  if (world.run) text(clockOf(world.run.t), W / 2, 5, C.cream, { align: 'center' });
  const kills = `${world.kills} KILLS`;
  text(kills, W - 6, 5, C.paper, { align: 'right' });
  text(`E LOG${world.bagNew ? ' NEW BEST!' : ''}`, W - 14 - textWidth(kills), 5, world.bagNew ? C.lime : C.ice, { align: 'right' });
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
  // ---- this level's relics, its gimmick, its temper ----
  if (!(D && D.phase === 'survive')) {
    drawRelicPips(6, 56);
    const tags = [];
    if (world.gimmick) tags.push([gimmickName(), C[GIMMICKS[world.gimmick].col]]);
    if (world.temper) tags.push(['TEMPER ' + world.temper, C.coral]);
    if (h.mount) tags.push([mountDef(h.mount).name + (h.mount.barding ? ' (BARDED)' : ''), C[mountDef(h.mount).col]]);
    let tx = world.level ? 46 : 6;
    for (const [s, col] of tags) (text(s, tx, 56, col), (tx += textWidth(s) + 8));
  }
  // ---- survival countdown ----
  // no countdown: the boss's arrival is meant to be a surprise
  if (D && D.phase === 'survive' && !swarmBossUp()) text('SURVIVE!', W / 2, 50, Math.floor(t * 3) % 2 ? C.coral : C.cream, { align: 'center', k: 2 });
  // ---- cracked: the one thing you must know right now ----
  if (h.cracked && !h.dead) {
    const coming = world.drops.length > 0,
      l1 = 'WEAPON CRACKED!  NEXT HIT SHATTERS IT',
      l2 = coming ? 'A NEW WEAPON IS ON ITS WAY: GRAB IT!' : `KILL SOMETHING FOR A NEW WEAPON  (SPARE IN ${Math.max(1, Math.ceil(ARMOR.spare - (h.crackT || 0)))})`,
      tw = Math.max(textWidth(l1), textWidth(l2)) + 16, by = BAR_Y - 60; // (above the map's name line)
    panel('card', W / 2 - tw / 2, by, tw, 24);
    rect(W / 2 - tw / 2 + 3, by + 3, tw - 6, 9, blink ? C.red : C.wine);
    text(l1, W / 2, by + 4, C.paper, { align: 'center' });
    text(l2, W / 2, by + 14, coming ? C.lime : C.gold, { align: 'center' });
  }
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
  // ---- field combo (combat.js): hits strung together out on the route ----
  const fc = world.fight;
  if (fc && fc.n >= 2 && fc.t > 0 && !(D && D.phase === 'survive')) {
    const x = W - 8, y = 64, bonus = Math.round((fightMult(fc.n) - 1) * 100);
    text(fc.n + ' HITS', x, y, fc.n >= 10 ? C.gold : C.cream, { align: 'right', k: 2 });
    bar(x - 70, y + 17, 70, 3, fc.t / FIGHT.window, fc.t < 0.4 && Math.floor(t * 10) % 2 ? C.coral : C.gold);
    text(`+${bonus}% DMG  SPECIAL x${FIGHT.cash}`, x, y + 23, C.lime, { align: 'right' });
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
      text(L ? `${L.id}  -  ${world.map?.own ? world.map.title : Z.name.toUpperCase()}  -  ${home}` : `ZONE ${world.zone + 1}` + (world.map ? ` - ${world.map.title}` : '') + `  -  ${home}`, W / 2, 98, C.gold, { align: 'center' });
      text(L ? L.name : Z.name, W / 2, 108, C.paper, { align: 'center', k: 2 });
      text(fitText(Z.sub, 460), W / 2, 128, C.mist, { align: 'center' });
    }
  }

  // ---- toasts ----
  let ty = D && D.phase === 'survive' ? 86 : b && !b.dead ? 66 : 46;
  for (let i = world.toasts.length - 1; i >= 0; i--) {
    const to = world.toasts[i];
    if (to.kind === 'weapon') {
      const l1 = (to.standout ? 'STANDOUT WEAPON!  +' : 'NEW WEAPON, FRESH ARMOR  +') + to.gain + '% POWER';
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
    } else if (to.kind === 'card') {
      // the Monster Book: a card went up a tier (or a boss page filled in)
      const l1 = `MONSTER BOOK  ${to.tier}`, l2 = fitText(to.gold && to.bonus ? `${to.name}: ${to.bonus.toUpperCase()}` : to.name, 300);
      const tw = Math.max(textWidth(l1), textWidth(l2)) + 14;
      panel('card', W / 2 - tw / 2, ty, tw, 24);
      text(l1, W / 2, ty + 4, to.gold ? (Math.floor(t * 6) % 2 ? C.gold : C.cream) : C.sky, { align: 'center' });
      text(l2, W / 2, ty + 13, to.gold ? C.lime : C.paper, { align: 'center' });
      ty += 28;
    } else if (to.kind === 'level') {
      panel('card', W / 2 - 60, ty, 120, 32);
      text('LEVEL UP!', W / 2, ty + 5, C.gold, { align: 'center', k: 2 });
      text(`LV ${to.lv}`, W / 2, ty + 21, C.paper, { align: 'center' });
      ty += 36;
    }
  }
}
function sep(x) {
  rect(x, BAR_Y + 4, 1, 20, C.ink);
  rect(x + 1, BAR_Y + 4, 1, 20, C.slate);
}
