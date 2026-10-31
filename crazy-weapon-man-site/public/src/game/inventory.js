// The weapon log and equipment windows (E / B / Tab, gamepad Back, or the Bag button). Two framed
// windows over a paused game: EQUIPMENT (hero, the weapon in hand, weapon mastery) and WEAPON LOG
// (the 24 highest-DPS weapons found this run, best first, with item details). Nothing here is
// picked by hand: every pickup is equipped the moment it reaches you (drops.js pickUp), because
// the weapon in hand is your armor (combat.js hurtHero). The log is a record, not a stash. On the
// map the Legendary Anvil (G) strikes the weapon in hand.
import { C, W, H } from '../config.js';
import { X, canvas, rect, text, textWidth, fitText, panel, dither } from '../engine/gfx.js';
import { input } from '../engine/input.js';
import { tk } from '../engine/touch-controls.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { dps, powerScore, rarityName, freshUid } from './loot.js';
import { lookOf, rarityColour, frameOfLook } from './looks.js';
import { drawHeroAnimated } from './anim.js';
import { TYPE_LIST } from '../data/weapons.js';
import { ABILITIES } from '../data/abilities.js';
import { MUTATIONS } from '../data/progression.js';
import { ELEMENTS } from '../data/weapons.js';
import { QUIRKS } from '../data/quirks.js';
import { SPECIALS, BOONS, specialRoll } from '../data/specials.js';
import { weaponLock, onClass } from '../data/meta.js';
import { proficiency, profToNext, profRank, PROF_MAX, PROF_DMG } from '../data/proficiency.js';
import { fmt } from '../data/curve.js';
import { RARITY } from '../data/weapons.js';
import { drawSheet } from './statsheet.js';
import { TAB, drawTabs, tabAt, showTab, P as powers } from './powers.js';
import { ANVIL_MAX, strikes, strikeCost, cantStrike, strike, relicsToSpend } from '../data/anvil.js';
import { ABILITY_LIST } from '../data/abilities.js';

export const BAG_SIZE = 24;
const COLS = 8,
  CELL = 30;
const EQ = { x: 6, y: 6, w: 196, h: 230 }; // equipment window
const INV = { x: 208, y: 6, w: 266, h: 230 }; // inventory window
const GRID = { x: INV.x + 13, y: INV.y + 30 };
// on the map the log has one button: the Legendary Anvil (data/anvil.js), for the weapon in hand
const BTNS_MAP = [{ id: 'anvil', label: 'G: ANVIL THE WEAPON IN HAND', x: INV.x + 10, w: INV.w - 20 }];
const btns = () => (world.inv?.tabs ? BTNS_MAP : []);
const BTN_Y = INV.y + 208;
const CLOSE = { x: INV.x + INV.w - 18, y: INV.y + 5, w: 12, h: 11 };
const SHEET_BTN = { x: EQ.x + EQ.w - 58, y: EQ.y + 5, w: 52, h: 11 };
// on the overworld the bag is the POWERS window's first tab: its tab strip sits on top and the bag
// is drawn this much lower (world.inv.tabs)
const TABS_DY = 22;

export const newBag = () => new Array(BAG_SIZE).fill(null);
export const bagCount = () => world.bag.filter(Boolean).length;
const typeName = t => t.toUpperCase();
export const salvageValue = w => 2 + w.q * 2 + (w.standout ? 5 : 0);

// the log: the strongest weapons found this run by DPS, best first. A new find goes in when it
// beats the weakest entry (or there is room); the same weapon is never logged twice. Returns its
// place (0 = the best yet) or -1.
export function logWeapon(w) {
  if (!w || w.name.startsWith('Training ')) return -1;
  const L = world.bag.filter(Boolean);
  if (!L.includes(w)) {
    if (L.length >= BAG_SIZE && dps(w) <= dps(L[L.length - 1])) return -1;
    L.push(w);
    world.bagNew = (world.bagNew || 0) + 1;
  }
  sortLog(L);
  return world.bag.indexOf(w);
}
// mastery and the anvil move DPS about, so the order is checked again whenever it is shown
function sortLog(L = world.bag.filter(Boolean)) {
  L.sort((a, b) => dps(b) - dps(a));
  world.bag = [...L.slice(0, BAG_SIZE), ...new Array(Math.max(0, BAG_SIZE - L.length)).fill(null)];
}

export function openInventory() {
  if (world.inv || !world.hero || world.hero.dead) return false;
  sortLog();
  world.inv = { sel: 0, t: 0, msg: '', lastClick: -9, sheet: false };
  world.bagNew = 0;
  sfx.ui(true);
  return true;
}
export function closeInventory() {
  if (!world.inv) return;
  world.inv = null;
  sfx.ui();
}
export const toggleInventory = () => (world.inv ? closeInventory() : openInventory());

// the anvil strikes the weapon in hand (and its edge passes on to every weapon you swap to after,
// data/anvil.js inheritAnvil); relics are spent for good, so it asks twice
export function anvil() {
  const I = world.inv, save = powers.save, w = world.hero.weapon;
  const no = save ? cantStrike(save, w) : 'THE ANVIL IS ON THE MAP';
  if (no) return (I.anvilAsk = false), (I.msg = no), sfx.ui();
  if (!I.anvilAsk) {
    I.anvilAsk = true;
    I.msg = `+${strikes(w) + 1} FOR ${strikeCost(strikes(w))} RELICS: G AGAIN`;
    return sfx.ui();
  }
  I.anvilAsk = false;
  if (strike(save, w) && !w.ability) {
    // the fifth strike awakens it
    w.ability = ABILITY_LIST[Math.floor(Math.random() * ABILITY_LIST.length)];
    w.name = w.name.replace(/ \+\d$/, `, ${ABILITIES[w.ability].clause[0]} +${ANVIL_MAX}`);
  }
  freshUid(w); // its look changed: draw it anew
  logWeapon(w);
  I.msg = strikes(w) === ANVIL_MAX ? `+${ANVIL_MAX}! THE ANVIL AWAKENS IT` : `STRUCK! NOW +${strikes(w)}`;
  sfx.levelUp();
}

function moveSel(d) {
  const I = world.inv;
  I.sel = (I.sel + d + BAG_SIZE) % BAG_SIZE;
  I.msg = '';
  sfx.ui();
}

export function updateInventory(dt) {
  const I = world.inv;
  if (!I) return;
  I.t += dt;
  // on the map, R and SHIFT go to the STATS tab (the next one along)
  if (I.tabs && (input.take('sheet') | input.take('dash'))) return showTab(TAB.STATS);
  if (I.tabs && input.take('anvil')) return anvil();
  if (input.take('sheet')) return (I.sheet = !I.sheet), sfx.ui(I.sheet);
  if (I.sheet) {
    if (input.take('inv') || input.take('pause') || input.take('leave')) (I.sheet = false), sfx.ui();
    return;
  }
  if (input.take('inv') || input.take('pause')) return closeInventory();
  if (input.take('left')) moveSel(-1);
  if (input.take('right')) moveSel(1);
  if (input.take('up')) moveSel(-COLS);
  if (input.take('down')) moveSel(COLS);
  input.consume('dash');
}

// ---------------------------------------------------------------- mouse / touch
const inside = (p, r) => p.x >= r.x && p.y >= r.y && p.x < r.x + r.w && p.y < r.y + r.h;
function toCanvas(e) {
  const b = canvas.getBoundingClientRect();
  return { x: ((e.clientX - b.left) * W) / b.width, y: ((e.clientY - b.top) * H) / b.height };
}
function cellAt(p) {
  const c = Math.floor((p.x - GRID.x) / CELL),
    r = Math.floor((p.y - GRID.y) / CELL);
  return c >= 0 && c < COLS && r >= 0 && r < BAG_SIZE / COLS ? r * COLS + c : -1;
}
canvas.addEventListener('pointerdown', e => {
  const I = world.inv;
  if (!I) return;
  e.preventDefault();
  const p = toCanvas(e);
  if (I.tabs) {
    const i = tabAt(p.x, p.y);
    if (i > TAB.BAG) return showTab(i);
    if (p.y < TABS_DY + 4) return void (p.x >= W - 22 && closeInventory());
    p.y -= TABS_DY;
    if (inside(p, SHEET_BTN)) return showTab(TAB.STATS);
  }
  if (I.sheet) return (I.sheet = false), sfx.ui();
  if (inside(p, CLOSE)) return closeInventory();
  if (inside(p, SHEET_BTN)) return (I.sheet = true), sfx.ui(true);
  for (const b of btns()) if (inside(p, { x: b.x, y: BTN_Y, w: b.w, h: 16 })) return anvil();
  const i = cellAt(p);
  if (i < 0 || i === I.sel) return;
  I.sel = i;
  I.msg = '';
  sfx.ui();
});
canvas.addEventListener('pointermove', e => {
  if (!world.inv || e.pointerType !== 'mouse') return;
  const p = toCanvas(e);
  if (world.inv.tabs) p.y -= TABS_DY;
  const i = cellAt(p);
  world.inv.hover = i;
});

// ---------------------------------------------------------------- drawing
function icon(w, x, y, bw, bh, t) {
  const L = lookOf(w, frameOfLook(w.look, t));
  const k = Math.min(1, (bh - 4) / L.crop.h, (bw - 4) / L.crop.w);
  const iw = Math.max(1, Math.round(L.crop.w * k)),
    ih = Math.max(1, Math.round(L.crop.h * k));
  X.drawImage(L.cv, L.crop.x, L.crop.y, L.crop.w, L.crop.h, Math.round(x + (bw - iw) / 2), Math.round(y + (bh - ih) / 2), iw, ih);
}
function slot(x, y, s, w, on, t) {
  const edge = w ? (w.standout ? C.gold : rarityColour(w.q)) : C.slate;
  rect(x, y, s, s, C.ink);
  rect(x + 1, y + 1, s - 2, s - 2, on ? edge : w ? C.stone : C.slate);
  rect(x + 2, y + 2, s - 4, s - 4, on ? C.slate : C.night);
  if (w) {
    rect(x + 2, y + 2, s - 4, 1, edge); // rarity stripe
    icon(w, x + 2, y + 3, s - 4, s - 5, t);
  }
}
function titleBar(r, s) {
  panel('panel', r.x, r.y, r.w, r.h);
  rect(r.x + 4, r.y + 4, r.w - 8, 13, C.navy);
  rect(r.x + 4, r.y + 16, r.w - 8, 1, C.sky);
  text(s, r.x + 9, r.y + 7, C.cream);
}
function bar(x, y, w, frac, col) {
  rect(x - 1, y - 1, w + 2, 5, C.ink);
  rect(x, y, w, 3, C.night);
  rect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), 3, col);
}

export function drawInventory(t) {
  const I = world.inv,
    h = world.hero;
  if (!I || !h) return;
  dither(0, 0, W, H, C.ink, 9);
  const tabDy = I.tabs ? TABS_DY : 0;
  if (I.tabs) drawTabs(t, TAB.BAG), X.save(), X.translate(0, tabDy);

  // ---- EQUIPMENT ----
  titleBar(EQ, 'EQUIPMENT');
  const px = EQ.x + 10,
    py = EQ.y + 22;
  rect(px, py, 72, 70, C.ink);
  rect(px + 1, py + 1, 70, 68, C.night);
  for (let i = 0; i < 70; i += 6) rect(px + 1, py + 1 + i, 70, 1, C.slate); // backdrop lines
  rect(px + 1, py + 60, 70, 9, C.slate);
  const doll = { ...h, x: 0, y: 0, face: 1, vx: 0, vy: 0, attack: null, special: null, ladder: null, dashT: 0, hurtT: 0, castT: 0, onGround: true, dead: false };
  X.save();
  X.setTransform(2, 0, 0, 2, px + 36 - doll.w, py + 60 - doll.h * 2 + tabDy);
  drawHeroAnimated(doll, t);
  X.restore();
  const w = h.weapon,
    sx = EQ.x + 90,
    sy = EQ.y + 24;
  text('WEAPON', sx, sy, C.gold);
  slot(sx, sy + 10, 30, w, true, t);
  text('LV ' + h.lv, sx + 36, sy + 12, C.paper);
  text(fmt(dps(w)) + ' DPS', sx + 36, sy + 22, C.gold);
  text(typeName(w.type), sx + 36, sy + 32, C.mist);
  const nameLines = wrap(w.name, 180).slice(0, 2);
  nameLines.forEach((l, i) => text(l, EQ.x + 10, EQ.y + 90 + i * 9, w.standout ? C.gold : rarityColour(w.q)));
  let ty = EQ.y + 90 + nameLines.length * 9;
  const q = QUIRKS[w.quirk];
  if (q) { text('QUIRK: ' + q.label, EQ.x + 10, ty, C[q.col] || C.paper); ty += 9; }
  const ab = ABILITIES[w.ability];
  if (ab) { text('ABILITY: ' + ab.label, EQ.x + 10, ty, C[ab.col] || C.paper); ty += 9; }
  const sr = specialRoll(w);
  text('SPECIAL: ' + SPECIALS[sr.id].name + (sr.boons.length ? ' ' + '+'.repeat(sr.boons.length) : ''), EQ.x + 10, ty, C.gold);

  rect(SHEET_BTN.x, SHEET_BTN.y, SHEET_BTN.w, SHEET_BTN.h, C.slate);
  text('R: STATS', SHEET_BTN.x + SHEET_BTN.w / 2, SHEET_BTN.y + 2, C.cream, { align: 'center' });
  const my = EQ.y + 138, sel = world.bag[I.sel];
  if (sel && sel !== w) drawCompare(w, sel, my);
  else {
  // weapon mastery (persists between runs), two columns so every type fits
  rect(EQ.x + 6, my - 3, EQ.w - 12, 1, C.slate);
  text('WEAPON MASTERY', EQ.x + 10, my, C.gold);
  text('KEPT EVERY RUN', EQ.x + EQ.w - 10, my, C.fog, { align: 'right' });
  const per = Math.ceil(TYPE_LIST.length / 2), colW = (EQ.w - 14) / 2;
  TYPE_LIST.forEach((type, i) => {
    const p = proficiency(type),
      x = EQ.x + 7 + Math.floor(i / per) * colW,
      y = my + 11 + (i % per) * 11,
      on = type === w.type;
    if (on) rect(x, y - 2, colW - 2, 10, C.slate);
    text(typeName(type), x + 2, y, on ? C.cream : C.mist);
    text('LV' + p.lv, x + colW - 4, y, p.lv >= PROF_MAX ? C.gold : C.paper, { align: 'right' });
    const frac = p.lv >= PROF_MAX ? 1 : p.xp / profToNext(p.lv);
    rect(x + 2, y + 8, colW - 8, 1, C.night);
    rect(x + 2, y + 8, Math.round((colW - 8) * Math.max(0, Math.min(1, frac))), 1, p.lv >= PROF_MAX ? C.gold : C.sky);
  });
  }

  // ---- INVENTORY ----
  titleBar(INV, 'WEAPON LOG: BEST DPS FOUND');
  rect(CLOSE.x, CLOSE.y, CLOSE.w, CLOSE.h, C.wine);
  text('X', CLOSE.x + 4, CLOSE.y + 2, C.paper);
  text(`${bagCount()}/${BAG_SIZE}`, INV.x + INV.w - 24, INV.y + 7, C.ice, { align: 'right' });
  for (let i = 0; i < BAG_SIZE; i++) {
    const x = GRID.x + (i % COLS) * CELL,
      y = GRID.y + Math.floor(i / COLS) * CELL;
    slot(x + 1, y + 1, CELL - 2, world.bag[i], i === I.sel, t);
    if (world.bag[i] && world.bag[i] === w) text('E', x + 4, y + CELL - 10, C.lime); // the one in hand
    if (i === I.hover && i !== I.sel) rect(x + 1, y + CELL - 2, CELL - 2, 1, C.cream);
  }
  // item details
  const it = world.bag[I.sel],
    dy = GRID.y + 3 * CELL + 6;
  rect(INV.x + 8, dy - 3, INV.w - 16, 74, C.ink);
  rect(INV.x + 9, dy - 2, INV.w - 18, 72, C.night);
  const tx = INV.x + 14;
  if (!it) {
    text('NOTHING LOGGED HERE YET', tx, dy + 2, C.fog);
    text('EVERY WEAPON YOU PICK UP IS EQUIPPED AT ONCE:', tx, dy + 14, C.mist);
    text('A NEW ONE IS FRESH ARMOR. ONE HIT CRACKS IT,', tx, dy + 24, C.mist);
    text('TWO SHATTER IT. THE 24 STRONGEST YOU FIND', tx, dy + 34, C.mist);
    text('THIS RUN ARE LOGGED HERE, BEST FIRST.', tx, dy + 44, C.mist);
  } else {
    const col = it.standout ? C.gold : rarityColour(it.q);
    text(fitText(it.name, INV.w - 50), tx, dy + 2, col);
    text(`#${I.sel + 1}`, INV.x + INV.w - 14, dy + 2, it === w ? C.lime : C.gold, { align: 'right' });
    text(`${it.standout ? 'STANDOUT ' : ''}${rarityName(it).toUpperCase()} ${typeName(it.type)}`, tx, dy + 12, C.mist);
    if (weaponLock() && !onClass(it.type)) text('OFF-CLASS', INV.x + INV.w - 12, dy + 12, C.coral, { align: 'right' }); // no specialization cluster for it
    const gain = Math.round((powerScore(it) / Math.max(1, powerScore(w)) - 1) * 100);
    text(fmt(dps(it)) + ' DPS', tx, dy + 22, C.paper);
    text(it === w ? 'IN HAND' : `${gain >= 0 ? '+' : ''}${gain}% POWER VS IN HAND`, INV.x + INV.w - 14, dy + 22, it === w ? C.lime : gain >= 0 ? C.lime : C.coral, { align: 'right' });
    const extras = [];
    if (it.family) extras.push(ELEMENTS[it.family].word.toUpperCase());
    if (it.mutation) extras.push(MUTATIONS[it.mutation].label);
    text(extras.length ? extras.join('  ') : 'NO ELEMENT', tx, dy + 32, it.mutation ? C.gold : C.fog);
    const isr = specialRoll(it);
    text(SPECIALS[isr.id].name + (isr.boons.length ? ' ' + '+'.repeat(isr.boons.length) : ''), INV.x + INV.w - 12, dy + 32, C.gold, { align: 'right' });
    const qq = QUIRKS[it.quirk];
    const ia = ABILITIES[it.ability];
    if (qq) text('QUIRK: ' + qq.label, tx, dy + 42, C[qq.col] || C.paper);
    if (ia) text('ABILITY: ' + ia.label, INV.x + INV.w - 12, dy + 42, C[ia.col] || C.paper, { align: 'right' });
    if (isr.boons.length) text(fitText('SPECIAL BOONS: ' + isr.boons.map(b => BOONS[b].label).join(' + '), INV.w - 30), tx, dy + 51, C[BOONS[isr.boons[0]].col] || C.paper);
    else if (ia || qq) text(fitText((ia || qq).desc, INV.w - 30), tx, dy + 51, C.mist);
    const p = proficiency(it.type);
    text(`${typeName(it.type)} MASTERY LV ${p.lv} ${profRank(p.lv)}`, tx, dy + 61, C.sky);
  }
  // the anvil (map only) + shards
  for (const b of btns()) {
    panel(I.anvilAsk ? 'btn-hot' : 'btn', b.x, BTN_Y, b.w, 16);
    text(b.label, b.x + b.w / 2, BTN_Y + 5, C.paper, { align: 'center' });
  }
  if (I.msg) text(I.msg, INV.x + INV.w / 2, BTN_Y - 9, C.lime, { align: 'center' });
  rect(EQ.x + 6, EQ.y + EQ.h + 4, 4, 2, C.sky);
  text(`${fmt(world.shards)} SHARDS`, EQ.x + 14, EQ.y + EQ.h + 2, C.ice);
  if (I.tabs) text(`${relicsToSpend(powers.save)} RELICS`, EQ.x + 120, EQ.y + EQ.h + 2, C.gold, { align: 'right' });
  text(tk(I.tabs ? 'ARROWS BROWSE  G ANVIL  SHIFT TAB  1 CLOSE' : 'ARROWS BROWSE  R STATS  1 / E CLOSE', ''), W - 6, INV.y + INV.h + 2, C.mist, { align: 'right' });
  if (I.sheet) drawSheetWindow(w);
  if (I.tabs) X.restore();
}

// the full stat sheet over both windows
function drawSheetWindow(w) {
  dither(0, 0, W, H, C.ink, 10);
  titleBar({ x: 6, y: 6, w: W - 12, h: H - 12 }, 'STATS: EVERYTHING BEHIND THE BLADE');
  drawSheet(14, 28, W - 26, H - 50, w);
  text('R / E / CLICK: BACK', W - 14, H - 17, C.fog, { align: 'right' });
}

// the compare table (MapleStory's compare tooltip): the weapon in hand against the one picked
function drawCompare(a, b, my) {
  rect(EQ.x + 6, my - 3, EQ.w - 12, 1, C.slate);
  text('COMPARE', EQ.x + 10, my, C.gold);
  const c1 = EQ.x + 118, c2 = EQ.x + EQ.w - 8;
  text('IN HAND', c1, my, C.fog, { align: 'right' });
  text('LOGGED', c2, my, C.fog, { align: 'right' });
  const el = x => (x.family ? ELEMENTS[x.family].word.toUpperCase() : '-');
  const num = (label, va, vb, f = fmt) => [label, f(va), f(vb), Math.sign(vb - va)];
  const rows = [
    num('DPS', dps(a), dps(b)),
    num('POWER', powerScore(a), powerScore(b)),
    num('RARITY', a.standout ? 11 : a.q, b.standout ? 11 : b.q, q => (q > 10 ? 'STANDOUT' : RARITY[q].name.toUpperCase())),
    ['ELEMENT', el(a), el(b), (b.family ? 1 : 0) - (a.family ? 1 : 0)],
    ['QUIRK', QUIRKS[a.quirk]?.label || '-', QUIRKS[b.quirk]?.label || '-', 0],
    ['ABILITY', ABILITIES[a.ability]?.label || '-', ABILITIES[b.ability]?.label || '-', (b.ability ? 1 : 0) - (a.ability ? 1 : 0)],
    ['SPECIAL', SPECIALS[specialRoll(a).id].name, SPECIALS[specialRoll(b).id].name, specialRoll(b).boons.length - specialRoll(a).boons.length],
    ['MUTATION', a.mutation ? MUTATIONS[a.mutation].label : '-', b.mutation ? MUTATIONS[b.mutation].label : '-', (b.mutation ? 1 : 0) - (a.mutation ? 1 : 0)],
    num('MASTERY', proficiency(a.type).lv, proficiency(b.type).lv, v => 'LV ' + v)
  ];
  rows.forEach(([label, va, vb, d], i) => {
    const y = my + 11 + i * 8;
    if (i % 2) rect(EQ.x + 7, y - 1, EQ.w - 14, 8, C.night);
    text(label, EQ.x + 10, y, C.mist);
    text(fitText(va, 58), c1, y, C.paper, { align: 'right' });
    text(fitText(vb, 60), c2 - 8, y, d > 0 ? C.lime : d < 0 ? C.coral : C.paper, { align: 'right' });
    if (d) text(d > 0 ? '+' : '-', c2, y, d > 0 ? C.lime : C.coral, { align: 'right' });
  });
}

function wrap(name, maxW) {
  const lines = [''];
  for (const word of name.split(' ')) {
    const n = lines.length - 1,
      next = lines[n] ? lines[n] + ' ' + word : word;
    if (textWidth(next) > maxW && lines[n] && n === 0) lines.push(word);
    else lines[n] = next;
  }
  return lines.map(s => fitText(s, maxW));
}
