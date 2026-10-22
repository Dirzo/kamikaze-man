// Inventory and equipment windows (E / B / Tab, gamepad Back, or the Bag button). Two framed
// windows over a paused game: EQUIPMENT (hero, weapon slot, weapon mastery) and INVENTORY
// (a 24-slot bag of weapons, item details, equip / lock / salvage). Keyboard, pad, mouse and touch.
// Drops are looted automatically and kept until the bag is full; after that the weakest unlocked
// weapons are swapped out for better ones. Locked weapons are never replaced or salvaged.
import { C, W, H } from '../config.js';
import { X, canvas, rect, text, textWidth, fitText, panel, dither } from '../engine/gfx.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { dps, powerScore, rarityName, freshUid } from './loot.js';
import { lookOf, rarityColour, frameOfLook } from './looks.js';
import { equip } from './drops.js';
import { toast } from './progress.js';
import { lustBoost } from './lust.js';
import { drawHeroAnimated } from './anim.js';
import { TYPE_LIST } from '../data/weapons.js';
import { ABILITIES } from '../data/abilities.js';
import { MUTATIONS } from '../data/progression.js';
import { ELEMENTS } from '../data/weapons.js';
import { QUIRKS } from '../data/quirks.js';
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
const BTNS = [
  { id: 'equip', label: 'EQUIP', x: INV.x + 10, w: 66 },
  { id: 'lock', label: 'LOCK', x: INV.x + 82, w: 60 },
  { id: 'salvage', label: 'SALVAGE', x: INV.x + 148, w: 108 }
];
// on the map the bag has a fourth button: the Legendary Anvil (data/anvil.js)
const BTNS_MAP = [
  { id: 'equip', label: 'EQUIP', x: INV.x + 10, w: 52 },
  { id: 'lock', label: 'LOCK', x: INV.x + 66, w: 46 },
  { id: 'salvage', label: 'SALVAGE', x: INV.x + 116, w: 78 },
  { id: 'anvil', label: 'ANVIL', x: INV.x + 198, w: 58 }
];
const btns = () => (world.inv?.tabs ? BTNS_MAP : BTNS);
const BTN_Y = INV.y + 208;
const CLOSE = { x: INV.x + INV.w - 18, y: INV.y + 5, w: 12, h: 11 };
const FILTER_BTN = { x: INV.x + 74, y: INV.y + 5, w: 98, h: 11 };
const SHEET_BTN = { x: EQ.x + EQ.w - 58, y: EQ.y + 5, w: 52, h: 11 };
// on the overworld the bag is the POWERS window's first tab: its tab strip sits on top and the bag
// is drawn this much lower (world.inv.tabs)
const TABS_DY = 22;

export const newBag = () => new Array(BAG_SIZE).fill(null);
export const bagCount = () => world.bag.filter(Boolean).length;
const typeName = t => t.toUpperCase();
export const salvageValue = w => 2 + w.q * 2 + (w.standout ? 5 : 0);

// the loot filter (MapleStory's pet filter, Slormancer's auto-salvage): drops below the chosen rarity
// melt into shards the moment they are looted. Standouts are always kept. F (or the label) cycles it;
// the choice is kept in this browser for every save file.
export const FILTER_KEY = 'crazyWeaponMan.filter.v1';
export const FILTER_STEPS = [0, 1, 2, 3, 4, 5]; // salvage everything below this rarity (0 = off)
let filterQ = null;
export function lootFilter() {
  if (filterQ == null) {
    try {
      filterQ = Math.max(0, Math.min(5, +(globalThis.localStorage?.getItem(FILTER_KEY) || 0) || 0));
    } catch (_) {
      filterQ = 0;
    }
  }
  return filterQ;
}
export function setLootFilter(q) {
  filterQ = FILTER_STEPS.includes(q) ? q : 0;
  try {
    globalThis.localStorage?.setItem(FILTER_KEY, String(filterQ));
  } catch (_) {
    /* private mode: the filter lasts for this tab */
  }
  return filterQ;
}
export const filterText = () => (lootFilter() ? `FILTER: SALVAGE BELOW ${RARITY[lootFilter()].name.toUpperCase()}` : 'FILTER: OFF, KEEP EVERYTHING');
export const filtered = w => !!w && !w.standout && w.q < lootFilter();

// put a weapon in the first free slot; false when the bag is full
export function stash(w) {
  if (!w || w.name === 'Training Sword') return true;
  const i = world.bag.indexOf(null);
  if (i < 0) return false;
  world.bag[i] = w;
  world.bagNew = (world.bagNew || 0) + 1;
  return true;
}

// auto-loot: every drop is kept until all 24 slots are full. Once full, a new weapon replaces the
// weakest unlocked weapon of its type (or the weakest unlocked weapon overall if none share its
// type) when it has more DPS; otherwise the new one is salvaged. Locked weapons are never touched.
export function autoLoot(w) {
  if (!w || w.name === 'Training Sword') return 'skip';
  const col = w.standout ? C.gold : rarityColour(w.q);
  if (filtered(w)) {
    world.shards += salvageValue(w);
    toast('bag', { head: `FILTERED  SALVAGED +${salvageValue(w)}`, name: w.name, col: C.fog });
    return 'filtered';
  }
  const better = dps(w) > dps(world.hero.weapon);
  let res;
  if (stash(w)) res = 'bagged';
  else {
    const weakest = list => list.reduce((m, i) => (m < 0 || dps(world.bag[i]) < dps(world.bag[m]) ? i : m), -1);
    const open = world.bag.map((b, i) => (b && !b.locked ? i : -1)).filter(i => i >= 0);
    const same = open.filter(i => world.bag[i].type === w.type);
    const i = weakest(same.length ? same : open);
    if (i < 0 || dps(world.bag[i]) >= dps(w)) {
      world.shards += salvageValue(w);
      toast('bag', { head: `BAG FULL  SALVAGED +${salvageValue(w)}`, name: w.name, col: C.fog });
      return 'salvaged';
    }
    const old = world.bag[i];
    world.shards += salvageValue(old);
    world.bag[i] = w;
    world.bagNew = (world.bagNew || 0) + 1;
    res = 'upgraded';
    toast('bag', { head: better ? 'BETTER WEAPON!  DOWN: EQUIP' : `SWAPPED OUT ${typeName(old.type)} +${salvageValue(old)}`, name: w.name, col, hot: better });
  }
  world.quick = better ? { item: w, t: 4 } : null;
  if (res === 'bagged') toast('bag', { head: better ? 'BETTER WEAPON!  DOWN: EQUIP' : 'INTO THE BAG   E: OPEN', name: w.name, col, hot: better });
  return res;
}

// equip a bag weapon (the old one takes its slot); a weapon you have never held feeds Weapon Lust
export function equipFromBag(i) {
  const w = world.bag[i];
  if (!w) return false;
  const fresh = !w.used,
    old = equip(w);
  world.bag[i] = old && old.name !== 'Training Sword' ? old : null;
  if (world.quick && world.quick.item === w) world.quick = null;
  if (fresh) lustBoost(world.hero);
  return true;
}

export function openInventory() {
  if (world.inv || !world.hero || world.hero.dead) return false;
  const first = world.bag.findIndex(Boolean);
  world.inv = { sel: Math.max(0, first), t: 0, msg: '', confirm: false, lastClick: -9, sheet: false };
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

// the anvil strikes the picked bag weapon, or the one in your hand when the picked slot is empty;
// relics are spent for good, so it asks twice
export function anvil() {
  const I = world.inv, save = powers.save, inBag = !!world.bag[I.sel], w = inBag ? world.bag[I.sel] : world.hero.weapon;
  const no = save ? cantStrike(save, w) : 'THE ANVIL IS ON THE MAP';
  I.confirm = false;
  if (no) return (I.anvilAsk = false), (I.msg = no), sfx.ui();
  if (!I.anvilAsk) {
    I.anvilAsk = true;
    I.msg = `+${strikes(w) + 1} FOR ${strikeCost(strikes(w))} RELICS${inBag ? '' : ' (IN HAND)'}: G AGAIN`;
    return sfx.ui();
  }
  I.anvilAsk = false;
  if (strike(save, w) && !w.ability) {
    // the fifth strike awakens it
    w.ability = ABILITY_LIST[Math.floor(Math.random() * ABILITY_LIST.length)];
    w.name = w.name.replace(/ \+\d$/, `, ${ABILITIES[w.ability].clause[0]} +${ANVIL_MAX}`);
  }
  freshUid(w); // its look changed: draw it anew
  I.msg = strikes(w) === ANVIL_MAX ? `+${ANVIL_MAX}! THE ANVIL AWAKENS IT` : `STRUCK! NOW +${strikes(w)}`;
  sfx.levelUp();
}

function act(id) {
  const I = world.inv,
    w = world.bag[I.sel];
  if (id === 'anvil') return anvil();
  I.anvilAsk = false;
  if (!w) {
    I.msg = 'EMPTY SLOT';
    I.confirm = false;
    return;
  }
  if (id === 'equip') {
    equipFromBag(I.sel);
    I.msg = 'EQUIPPED';
    I.confirm = false;
  } else if (id === 'lock') {
    w.locked = !w.locked;
    I.msg = w.locked ? 'LOCKED: NEVER REPLACED OR SALVAGED' : 'UNLOCKED';
    I.confirm = false;
    sfx.ui(w.locked);
  } else if (id === 'salvage') {
    if (w.locked) {
      I.msg = 'LOCKED - UNLOCK IT FIRST';
      I.confirm = false;
      sfx.ui();
      return;
    }
    if (!I.confirm) {
      I.confirm = true;
      I.msg = 'SALVAGE AGAIN TO CONFIRM';
      sfx.ui();
      return;
    }
    world.bag[I.sel] = null;
    world.shards += salvageValue(w);
    I.msg = `SALVAGED FOR ${salvageValue(w)} SHARDS`;
    I.confirm = false;
    sfx.pickup();
  }
}

function cycleFilter() {
  const I = world.inv;
  setLootFilter(FILTER_STEPS[(FILTER_STEPS.indexOf(lootFilter()) + 1) % FILTER_STEPS.length]);
  I.msg = filterText();
  I.confirm = false;
  sfx.ui(lootFilter() > 0);
}
function moveSel(d) {
  const I = world.inv;
  I.sel = (I.sel + d + BAG_SIZE) % BAG_SIZE;
  I.confirm = false;
  I.msg = '';
  sfx.ui();
}

export function updateInventory(dt) {
  const I = world.inv;
  if (!I) return;
  I.t += dt;
  // on the map, R and SHIFT go to the STATS tab (the next one along)
  if (I.tabs && (input.take('sheet') | input.take('dash'))) return showTab(TAB.STATS);
  if (I.tabs && input.take('anvil')) return act('anvil');
  if (input.take('sheet')) return (I.sheet = !I.sheet), sfx.ui(I.sheet);
  if (I.sheet) {
    if (input.take('inv') || input.take('pause') || input.take('leave')) (I.sheet = false), sfx.ui();
    return;
  }
  if (input.take('inv') || input.take('pause')) return closeInventory();
  if (input.take('filter')) cycleFilter();
  if (input.take('left')) moveSel(-1);
  if (input.take('right')) moveSel(1);
  if (input.take('up')) moveSel(-COLS);
  if (input.take('down')) moveSel(COLS);
  if (I.t < 0.15) return;
  if (input.take('attack') | input.take('confirm')) act('equip');
  else if (input.take('jump')) act('lock');
  else if (input.take('special')) act('salvage');
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
  if (inside(p, FILTER_BTN)) return cycleFilter();
  if (inside(p, SHEET_BTN)) return (I.sheet = true), sfx.ui(true);
  for (const b of btns()) if (inside(p, { x: b.x, y: BTN_Y, w: b.w, h: 16 })) return act(b.id);
  const i = cellAt(p);
  if (i < 0) return;
  if (i === I.sel && performance.now() - I.lastClick < 400) act('equip'); // double-click equips
  else if (i !== I.sel) {
    I.sel = i;
    I.confirm = false;
    I.msg = '';
    sfx.ui();
  }
  I.lastClick = performance.now();
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
    if (w.locked) padlock(x + s - 8, y + s - 9);
  }
}
function padlock(x, y) {
  rect(x, y, 7, 8, C.ink);
  rect(x + 2, y + 1, 3, 1, C.gold);
  rect(x + 1, y + 2, 1, 2, C.gold);
  rect(x + 5, y + 2, 1, 2, C.gold);
  rect(x + 1, y + 4, 5, 3, C.gold);
  rect(x + 3, y + 5, 1, 1, C.ink);
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
  const nameLines = wrap(w.name, 180).slice(0, 3);
  nameLines.forEach((l, i) => text(l, EQ.x + 10, EQ.y + 90 + i * 9, w.standout ? C.gold : rarityColour(w.q)));
  let ty = EQ.y + 90 + nameLines.length * 9;
  const q = QUIRKS[w.quirk];
  if (q) { text('QUIRK: ' + q.label, EQ.x + 10, ty, C[q.col] || C.paper); ty += 9; }
  const ab = ABILITIES[w.ability];
  if (ab) text('ABILITY: ' + ab.label, EQ.x + 10, ty, C[ab.col] || C.paper);

  rect(SHEET_BTN.x, SHEET_BTN.y, SHEET_BTN.w, SHEET_BTN.h, C.slate);
  text('R: STATS', SHEET_BTN.x + SHEET_BTN.w / 2, SHEET_BTN.y + 2, C.cream, { align: 'center' });
  const my = EQ.y + 138, sel = world.bag[I.sel];
  if (sel) drawCompare(w, sel, my);
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
  titleBar(INV, 'INVENTORY');
  rect(CLOSE.x, CLOSE.y, CLOSE.w, CLOSE.h, C.wine);
  text('X', CLOSE.x + 4, CLOSE.y + 2, C.paper);
  rect(FILTER_BTN.x, FILTER_BTN.y, FILTER_BTN.w, FILTER_BTN.h, lootFilter() ? C.wine : C.slate);
  text(fitText(lootFilter() ? 'F: BELOW ' + RARITY[lootFilter()].name.toUpperCase() : 'F: FILTER OFF', FILTER_BTN.w - 4), FILTER_BTN.x + FILTER_BTN.w / 2, FILTER_BTN.y + 2, lootFilter() ? C.cream : C.fog, { align: 'center' });
  text(`EQUIP  ${bagCount()}/${BAG_SIZE}`, INV.x + INV.w - 24, INV.y + 7, C.ice, { align: 'right' });
  for (let i = 0; i < BAG_SIZE; i++) {
    const x = GRID.x + (i % COLS) * CELL,
      y = GRID.y + Math.floor(i / COLS) * CELL;
    slot(x + 1, y + 1, CELL - 2, world.bag[i], i === I.sel, t);
    if (i === I.hover && i !== I.sel) rect(x + 1, y + CELL - 2, CELL - 2, 1, C.cream);
  }
  // item details
  const it = world.bag[I.sel],
    dy = GRID.y + 3 * CELL + 6;
  rect(INV.x + 8, dy - 3, INV.w - 16, 74, C.ink);
  rect(INV.x + 9, dy - 2, INV.w - 18, 72, C.night);
  const tx = INV.x + 14;
  if (!it) {
    text('EMPTY SLOT', tx, dy + 2, C.fog);
    text('DROPS ARE LOOTED AUTOMATICALLY.', tx, dy + 14, C.mist);
    text('NOTHING IS SALVAGED UNTIL ALL 24 FILL;', tx, dy + 24, C.mist);
    text('THEN THE WEAKEST GO. LOCK TO KEEP ONE.', tx, dy + 34, C.mist);
  } else {
    const col = it.standout ? C.gold : rarityColour(it.q);
    text(fitText(it.name, INV.w - (it.locked ? 44 : 30)), tx, dy + 2, col);
    if (it.locked) padlock(INV.x + INV.w - 22, dy);
    text(`${it.standout ? 'STANDOUT ' : ''}${rarityName(it).toUpperCase()} ${typeName(it.type)}`, tx, dy + 12, C.mist);
    const gain = Math.round((powerScore(it) / Math.max(1, powerScore(w)) - 1) * 100);
    text(fmt(dps(it)) + ' DPS', tx, dy + 22, C.paper);
    text(`${gain >= 0 ? '+' : ''}${gain}% POWER VS EQUIPPED`, INV.x + INV.w - 14, dy + 22, gain >= 0 ? C.lime : C.coral, { align: 'right' });
    const extras = [];
    if (it.family) extras.push(ELEMENTS[it.family].word.toUpperCase());
    if (it.mutation) extras.push(MUTATIONS[it.mutation].label);
    text(extras.length ? extras.join('  ') : 'NO ELEMENT', tx, dy + 32, it.mutation ? C.gold : C.fog);
    const qq = QUIRKS[it.quirk];
    const ia = ABILITIES[it.ability];
    if (qq) text('QUIRK: ' + qq.label, tx, dy + 42, C[qq.col] || C.paper);
    if (ia) text('ABILITY: ' + ia.label, INV.x + INV.w - 12, dy + 42, C[ia.col] || C.paper, { align: 'right' });
    if (ia || qq) text(fitText((ia || qq).desc, INV.w - 30), tx, dy + 51, C.mist);
    const p = proficiency(it.type);
    text(`${typeName(it.type)} MASTERY LV ${p.lv} ${profRank(p.lv)}`, tx, dy + 61, C.sky);
  }
  // buttons + shards
  for (const b of btns()) {
    const hot = (b.id === 'salvage' && I.confirm) || (b.id === 'anvil' && I.anvilAsk);
    panel(hot ? 'btn-hot' : 'btn', b.x, BTN_Y, b.w, 16);
    const label = b.id === 'salvage' && it ? `${b.label} +${salvageValue(it)}` : b.id === 'lock' && it && it.locked ? 'UNLOCK' : b.label;
    text(label, b.x + b.w / 2, BTN_Y + 5, it ? C.paper : C.fog, { align: 'center' });
  }
  if (I.msg) text(I.msg, INV.x + INV.w / 2, BTN_Y - 9, C.lime, { align: 'center' });
  rect(EQ.x + 6, EQ.y + EQ.h + 4, 4, 2, C.sky);
  text(`${fmt(world.shards)} SHARDS`, EQ.x + 14, EQ.y + EQ.h + 2, C.ice);
  if (I.tabs) text(`${relicsToSpend(powers.save)} RELICS`, EQ.x + 120, EQ.y + EQ.h + 2, C.gold, { align: 'right' });
  text(I.tabs ? 'Z EQUIP  X LOCK  C SALVAGE  G ANVIL  F FILTER  SHIFT TAB' : 'Z EQUIP  X LOCK  C SALVAGE  F FILTER  R STATS  E CLOSE', W - 6, INV.y + INV.h + 2, C.mist, { align: 'right' });
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
  text('PICKED', c2, my, C.fog, { align: 'right' });
  const el = x => (x.family ? ELEMENTS[x.family].word.toUpperCase() : '-');
  const num = (label, va, vb, f = fmt) => [label, f(va), f(vb), Math.sign(vb - va)];
  const rows = [
    num('DPS', dps(a), dps(b)),
    num('POWER', powerScore(a), powerScore(b)),
    num('RARITY', a.standout ? 11 : a.q, b.standout ? 11 : b.q, q => (q > 10 ? 'STANDOUT' : RARITY[q].name.toUpperCase())),
    ['ELEMENT', el(a), el(b), (b.family ? 1 : 0) - (a.family ? 1 : 0)],
    ['QUIRK', QUIRKS[a.quirk]?.label || '-', QUIRKS[b.quirk]?.label || '-', 0],
    ['ABILITY', ABILITIES[a.ability]?.label || '-', ABILITIES[b.ability]?.label || '-', (b.ability ? 1 : 0) - (a.ability ? 1 : 0)],
    ['MUTATION', a.mutation ? MUTATIONS[a.mutation].label : '-', b.mutation ? MUTATIONS[b.mutation].label : '-', (b.mutation ? 1 : 0) - (a.mutation ? 1 : 0)],
    num('MASTERY', proficiency(a.type).lv, proficiency(b.type).lv, v => 'LV ' + v)
  ];
  rows.forEach(([label, va, vb, d], i) => {
    const y = my + 11 + i * 9;
    if (i % 2) rect(EQ.x + 7, y - 1, EQ.w - 14, 9, C.night);
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
