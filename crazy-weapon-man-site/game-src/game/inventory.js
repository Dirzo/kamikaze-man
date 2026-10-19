// Inventory and equipment windows (E / B / Tab, gamepad Back, or the Bag button). Two framed
// windows over a paused game: EQUIPMENT (hero, weapon slot, weapon mastery) and INVENTORY
// (a 24-slot bag of weapons, item details, equip / drop / salvage). Keyboard, pad, mouse and touch.
import { C, W, H } from '../config.js';
import { X, canvas, rect, text, textWidth, fitText, panel, dither } from '../engine/gfx.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { dps, powerScore, rarityName } from './loot.js';
import { lookOf, rarityColour, frameOfLook } from './looks.js';
import { equip } from './drops.js';
import { dropWeapon } from './combat.js';
import { drawHeroAnimated } from './anim.js';
import { cx } from './physics.js';
import { TYPE_LIST } from '../data/weapons.js';
import { MUTATIONS } from '../data/progression.js';
import { ELEMENTS } from '../data/weapons.js';
import { QUIRKS } from '../data/quirks.js';
import { proficiency, profToNext, profRank, PROF_MAX, PROF_DMG } from '../data/proficiency.js';
import { fmt } from '../data/curve.js';

export const BAG_SIZE = 24;
const COLS = 8,
  CELL = 30;
const EQ = { x: 6, y: 6, w: 196, h: 230 }; // equipment window
const INV = { x: 208, y: 6, w: 266, h: 230 }; // inventory window
const GRID = { x: INV.x + 13, y: INV.y + 30 };
const BTNS = [
  { id: 'equip', label: 'EQUIP', x: INV.x + 10, w: 66 },
  { id: 'drop', label: 'DROP', x: INV.x + 82, w: 60 },
  { id: 'salvage', label: 'SALVAGE', x: INV.x + 148, w: 108 }
];
const BTN_Y = INV.y + 208;
const CLOSE = { x: INV.x + INV.w - 18, y: INV.y + 5, w: 12, h: 11 };

export const newBag = () => new Array(BAG_SIZE).fill(null);
export const bagCount = () => world.bag.filter(Boolean).length;
const typeName = t => t.toUpperCase();
export const salvageValue = w => 2 + w.q * 2 + (w.standout ? 5 : 0);

// put a weapon in the first free slot; false when the bag is full
export function stash(w) {
  if (!w || w.name === 'Training Sword') return true;
  const i = world.bag.indexOf(null);
  if (i < 0) return false;
  world.bag[i] = w;
  world.bagNew = (world.bagNew || 0) + 1;
  return true;
}

export function openInventory() {
  if (world.inv || world.forge || !world.hero || world.hero.dead) return false;
  const first = world.bag.findIndex(Boolean);
  world.inv = { sel: Math.max(0, first), t: 0, msg: '', confirm: false, lastClick: -9 };
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

function act(id) {
  const I = world.inv,
    h = world.hero,
    w = world.bag[I.sel];
  if (!w) {
    I.msg = 'EMPTY SLOT';
    I.confirm = false;
    return;
  }
  if (id === 'equip') {
    const old = equip(w);
    world.bag[I.sel] = old && old.name !== 'Training Sword' ? old : null;
    I.msg = 'EQUIPPED';
    I.confirm = false;
  } else if (id === 'drop') {
    world.bag[I.sel] = null;
    dropWeapon(cx(h), h.y, w);
    const d = world.drops[world.drops.length - 1];
    d.declined = true; // stays on the ground until you walk off it
    I.msg = 'DROPPED AT YOUR FEET';
    I.confirm = false;
    sfx.ui();
  } else if (id === 'salvage') {
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
  if (input.take('inv') || input.take('pause')) return closeInventory();
  if (input.take('left')) moveSel(-1);
  if (input.take('right')) moveSel(1);
  if (input.take('up')) moveSel(-COLS);
  if (input.take('down')) moveSel(COLS);
  if (I.t < 0.15) return;
  if (input.take('attack') | input.take('confirm')) act('equip');
  else if (input.take('jump')) act('drop');
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
  if (inside(p, CLOSE)) return closeInventory();
  for (const b of BTNS) if (inside(p, { x: b.x, y: BTN_Y, w: b.w, h: 16 })) return act(b.id);
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
  const i = cellAt(toCanvas(e));
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
  X.setTransform(2, 0, 0, 2, px + 36 - doll.w, py + 60 - doll.h * 2);
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
  const nameLines = wrap(w.name, 180);
  nameLines.forEach((l, i) => text(l, EQ.x + 10, EQ.y + 92 + i * 9, w.standout ? C.gold : rarityColour(w.q)));
  const q = QUIRKS[w.quirk];
  if (q) text('QUIRK: ' + q.label, EQ.x + 10, EQ.y + 92 + nameLines.length * 9, C[q.col] || C.paper);

  // weapon mastery (persists between runs)
  const my = EQ.y + 116;
  rect(EQ.x + 6, my - 3, EQ.w - 12, 1, C.slate);
  text('WEAPON MASTERY', EQ.x + 10, my, C.gold);
  text('KEPT EVERY RUN', EQ.x + EQ.w - 10, my, C.fog, { align: 'right' });
  TYPE_LIST.forEach((type, i) => {
    const p = proficiency(type),
      y = my + 11 + i * 10,
      on = type === w.type;
    if (on) rect(EQ.x + 7, y - 2, EQ.w - 14, 10, C.slate);
    text(typeName(type), EQ.x + 10, y, on ? C.cream : C.mist);
    text('LV' + p.lv, EQ.x + 74, y, p.lv >= PROF_MAX ? C.gold : C.paper);
    const frac = p.lv >= PROF_MAX ? 1 : p.xp / profToNext(p.lv);
    bar(EQ.x + 98, y + 2, 50, frac, p.lv >= PROF_MAX ? C.gold : C.sky);
    text('+' + Math.round(p.lv * PROF_DMG * 1000) / 10 + '%', EQ.x + EQ.w - 9, y, C.lime, { align: 'right' });
  });

  // ---- INVENTORY ----
  titleBar(INV, 'INVENTORY');
  rect(CLOSE.x, CLOSE.y, CLOSE.w, CLOSE.h, C.wine);
  text('X', CLOSE.x + 4, CLOSE.y + 2, C.paper);
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
    text('WEAPONS YOU SWAP OUT LAND HERE.', tx, dy + 14, C.mist);
    text('DOWN ON A DROP PUTS IT IN THE BAG.', tx, dy + 24, C.mist);
  } else {
    const col = it.standout ? C.gold : rarityColour(it.q);
    text(fitText(it.name, INV.w - 30), tx, dy + 2, col);
    text(`${it.standout ? 'STANDOUT ' : ''}${rarityName(it).toUpperCase()} ${typeName(it.type)}`, tx, dy + 12, C.mist);
    const gain = Math.round((powerScore(it) / Math.max(1, powerScore(w)) - 1) * 100);
    text(fmt(dps(it)) + ' DPS', tx, dy + 22, C.paper);
    text(`${gain >= 0 ? '+' : ''}${gain}% POWER VS EQUIPPED`, INV.x + INV.w - 14, dy + 22, gain >= 0 ? C.lime : C.coral, { align: 'right' });
    const extras = [];
    if (it.family) extras.push(ELEMENTS[it.family].word.toUpperCase());
    if (it.mutation) extras.push(MUTATIONS[it.mutation].label);
    text(extras.length ? extras.join('  ') : 'NO ELEMENT', tx, dy + 32, it.mutation ? C.gold : C.fog);
    const qq = QUIRKS[it.quirk];
    if (qq) {
      text('QUIRK: ' + qq.label, tx, dy + 42, C[qq.col] || C.paper);
      text(fitText(qq.desc, INV.w - 30), tx, dy + 51, C.mist);
    }
    const p = proficiency(it.type);
    text(`${typeName(it.type)} MASTERY LV ${p.lv} ${profRank(p.lv)}`, tx, dy + 61, C.sky);
  }
  // buttons + shards
  for (const b of BTNS) {
    const hot = b.id === 'salvage' && I.confirm;
    panel(hot ? 'btn-hot' : 'btn', b.x, BTN_Y, b.w, 16);
    const label = b.id === 'salvage' && it ? `${b.label} +${salvageValue(it)}` : b.label;
    text(label, b.x + b.w / 2, BTN_Y + 5, it ? C.paper : C.fog, { align: 'center' });
  }
  if (I.msg) text(I.msg, INV.x + INV.w / 2, BTN_Y - 9, C.lime, { align: 'center' });
  rect(INV.x + 10, INV.y + INV.h + 4, 4, 2, C.sky);
  text(`${fmt(world.shards)} SHARDS`, INV.x + 18, INV.y + INV.h + 2, C.ice);
  text('Z EQUIP  X DROP  C SALVAGE  E CLOSE', W - 6, INV.y + INV.h + 2, C.mist, { align: 'right' });
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
