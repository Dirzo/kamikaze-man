// The POWERS window on the overworld (E / B / Tab, or the Bag button): three tabs over the map.
//   SHARD TREE  a web of linked nodes: invest banked shards in a rank (ENTER), take back the last
//               step (U: a rank, or a change of class), refund everything and clear the class (Q),
//               change specialization (G, twice). The right panel shows the picked node.
//   MASTERY     a night sky of weapon constellations. Open one (ENTER) to pick its perk stars, one of
//               two at each step of the road to mastery level 100. Q goes back to the sky.
//   TROPHIES    the ten family heads' trophies and the perks they gave you
// Arrows move, SHIFT / V (or clicking a tab) changes tab. Mouse and touch click anything. Rules and
// numbers live in data/meta.js.
import { C, W, H } from '../config.js';
import { canvas, rect, px, text, textWidth, fitText, panel, dither } from '../engine/gfx.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { TYPE_LIST, ELEMENTS } from '../data/weapons.js';
import { proficiency, profRank } from '../data/proficiency.js';
import { fmt } from '../data/curve.js';
import { FAMILIES } from '../data/families.js';
import { bossName } from './bosses.js';
import {
  meta, TREE, TREE_BY_ID, TREE_LINKS, BRANCHES, rank, rankCost, cantBuy, buyRank, undoRank, canUndo, respec, linked, TROPHIES, hasTrophy, CLASSES, weaponLock, setLock,
  MASTERY_TIERS, masteryPerk, perkChoice, choosePerk, tiersOpen, unpicked
} from '../data/meta.js';

const TABS = ['SHARD TREE', 'MASTERY', 'TROPHIES'];
export const P = { open: false, tab: 0, tree: { sel: 'core' }, mast: { type: 0, open: false, tier: 0, opt: 0 }, troph: 0, msg: '', msgT: 0, boxes: [], confirm: false };

export function openPowers(tab = null) {
  P.open = true;
  if (tab != null) P.tab = tab;
  P.msg = '';
  P.confirm = false;
  sfx.ui(true);
}
export function closePowers() {
  P.open = false;
  sfx.ui();
}
// something new to do in there: an open mastery pick, or a rank you can afford
export const powersWaiting = () => TYPE_LIST.some(t => unpicked(t).length) || TREE.some(n => !cantBuy(n.id));

const say = (m, good = false) => {
  P.msg = m;
  P.msgT = 2.5;
  sfx.ui(good);
};
const fmtPct = v => {
  const p = v * 100;
  return (Math.abs(p - Math.round(p)) < 0.05 ? Math.round(p) : p.toFixed(1)) + '';
};
const nodeText = (n, r) => n.desc.replace('{v}', fmtPct(n.per * Math.max(1, r)));

export function buy(n) {
  const why = cantBuy(n.id);
  if (why) return say(why);
  buyRank(n.id);
  say(`${n.name} RANK ${rank(n.id)}`, true);
  consolidate(n);
}
// ---- the shard consolidation: buying a rank pulls a stream of shards out of the shard counter,
// each curving into the node with a rising tick, and once they have all landed the node locks in
// with a flash ring, eight rays and a chord
const FLOW = [], LOCKIN = [];
const FLY = 0.42; // seconds a shard spends in the air
function consolidate(n) {
  const [x1, y1] = at(n), x0 = W - 60, y0 = 16, k = rank(n.id), count = Math.min(16, 6 + k * 2);
  for (let i = 0; i < count; i++) {
    const side = (i % 2 ? 1 : -1) * (20 + Math.random() * 50);
    FLOW.push({ x0, y0, x1, y1, cx: (x0 + x1) / 2 + side, cy: Math.min(y0, y1) - 10 + Math.random() * 40, t: -i * 0.035, i, last: i === count - 1, n });
  }
  P.drain = 0.5; // the counter flashes as it pays out
}
function updateConsolidate(dt) {
  P.drain = Math.max(0, (P.drain || 0) - dt);
  for (let j = FLOW.length - 1; j >= 0; j--) {
    const f = FLOW[j];
    f.t += dt;
    if (f.t < FLY) continue;
    FLOW.splice(j, 1);
    sfx.shardTick(f.i);
    if (f.last) {
      LOCKIN.push({ x: f.x1, y: f.y1, r: R[f.n.size], col: colOf(f.n), t: 0 });
      sfx.invest(rank(f.n.id) >= f.n.max);
    }
  }
  for (let j = LOCKIN.length - 1; j >= 0; j--) if ((LOCKIN[j].t += dt) > 0.45) LOCKIN.splice(j, 1);
}
function drawConsolidate() {
  for (const f of FLOW) {
    if (f.t < 0) continue;
    const p = f.t / FLY, e = p * p * (3 - 2 * p), q = 1 - e; // ease in-out along a curve
    const x = Math.round(q * q * f.x0 + 2 * q * e * f.cx + e * e * f.x1), y = Math.round(q * q * f.y0 + 2 * q * e * f.cy + e * e * f.y1);
    // a little diamond shard with a short trail
    rect(x - 2, y - 1, 5, 3, C.ink);
    rect(x - 1, y - 2, 3, 5, C.ink);
    px(x - 1, y, C.sky); px(x + 1, y, C.sky); px(x, y - 1, C.ice); px(x, y + 1, C.sky); px(x, y, C.paper);
    const tp = Math.max(0, p - 0.08), te = tp * tp * (3 - 2 * tp), tq = 1 - te;
    px(Math.round(tq * tq * f.x0 + 2 * tq * te * f.cx + te * te * f.x1), Math.round(tq * tq * f.y0 + 2 * tq * te * f.cy + te * te * f.y1), C.blue);
  }
  for (const L of LOCKIN) {
    const p = L.t / 0.45, r = L.r + 2 + p * 14, col = p < 0.25 ? C.paper : L.col;
    for (let a = 0; a < 32; a++) if (a % 2 || p < 0.5) px(Math.round(L.x + Math.cos((a * Math.PI) / 16) * r), Math.round(L.y + Math.sin((a * Math.PI) / 16) * r), col);
    for (let a = 0; a < 8; a++) {
      const dx = Math.cos((a * Math.PI) / 4), dy = Math.sin((a * Math.PI) / 4);
      for (let s = L.r + 3 + p * 6; s < L.r + 6 + p * 12; s++) px(Math.round(L.x + dx * s), Math.round(L.y + dy * s), p < 0.3 ? C.cream : C.gold);
    }
    if (p < 0.2) disc(L.x, L.y, L.r, C.paper);
  }
}
function undo() {
  const id = undoRank();
  if (!id) return say('NOTHING TO UNDO');
  P.lockPend = undefined;
  if (id[0] === '@') {
    // a specialization change taken back: show the class choice again
    P.tree.sel = 'core';
    const c = weaponLock();
    return say(c ? `BACK TO ${CLASSES[c].name}` : 'CLASS LOCK OFF. PICK ANY CLASS (G)', true);
  }
  P.tree.sel = id;
  say(`${TREE_BY_ID[id].name} BACK TO RANK ${rank(id)}`, true);
}
// the specialization: G (or a button) picks one, then ENTER (or the same button again) locks it in
const LOCKS = [null, 'blades', 'blunt', 'ranged'];
function pendLock(c) {
  P.lockPend = c;
  if (c === weaponLock()) say(c ? `ALREADY A ${CLASSES[c].name} SPECIALIST` : 'NO LOCK: EVERY WEAPON DROPS');
  else say(c ? `ENTER: ONLY ${CLASSES[c].name} DROP. THE REST, AND YOUR BAG'S, MELT INTO SHARDS` : 'ENTER: DROP THE LOCK, EVERY WEAPON DROPS AGAIN');
}
function chooseLock(c) {
  if (P.lockPend !== c) return pendLock(c);
  P.lockPend = undefined;
  if (c === weaponLock()) return;
  const was = weaponLock(), before = meta().shards;
  setLock(c);
  const back = meta().shards - before, refunded = back ? ` +${fmt(back)} SHARDS FROM ${CLASSES[was].name}` : '';
  say((c ? `${CLASSES[c].name} SPECIALIST! ITS CLUSTER IS OPEN` : 'LOCK OFF. EVERY WEAPON DROPS AGAIN') + refunded, true);
}
function refundAll() {
  if (!P.confirm) {
    P.confirm = true;
    return say('PRESS Q AGAIN: REFUND EVERY RANK AND CLEAR YOUR CLASS');
  }
  respec();
  P.confirm = false;
  P.lockPend = undefined;
  P.tree.sel = 'core';
  say('ALL SHARDS REFUNDED, CLASS CLEARED. PICK ANY CLASS!', true);
}
// the nearest thing in the pressed direction (within a 60 degree cone each side), for arrow keys
// on the web and the sky
function step(from, list, dx, dy) {
  let best = null, bd = Infinity;
  for (const o of list) {
    const ox = o.x - from.x, oy = o.y - from.y, along = ox * dx + oy * dy, d = Math.hypot(ox, oy);
    if (o === from || along <= 0 || along < d * 0.5) continue;
    const score = d * (2 - along / d);
    if (score < bd) (bd = score), (best = o);
  }
  return best;
}
export function pick(type, tier, opt) {
  if (tier >= tiersOpen(type)) return say(`REACH ${type.toUpperCase()} MASTERY ${MASTERY_TIERS[tier]} FIRST`);
  if (perkChoice(type, tier) === opt) return;
  choosePerk(type, tier, opt);
  say(`${type.toUpperCase()}: ${masteryPerk(type, tier, opt).name}`, true);
  // the weapon charges with the new power: it glows brighter and hums, then flares (drawConstellation)
  P.charge = { type, tier, opt, t: 0, done: false };
  sfx.hum();
}
const CHARGE = 1.05; // seconds the constellation spends powering up

// called by the overworld while the window is open
export function updatePowers(dt) {
  P.msgT = Math.max(0, P.msgT - dt);
  updateConsolidate(dt);
  const ch = P.charge;
  if (ch && (ch.t += dt) >= CHARGE * 0.85 && !ch.done) (ch.done = true), sfx.empower();
  if (ch && ch.t > CHARGE + 0.5) P.charge = null;
  const M = P.mast;
  if (P.tab === 1 && M.open && (input.take('pause') | input.take('leave'))) return (M.open = false), sfx.ui();
  if (input.take('inv') | input.take('pause')) return closePowers();
  if (input.take('dash')) {
    P.tab = (P.tab + 1) % TABS.length;
    P.confirm = false;
    return sfx.ui();
  }
  const dx = (input.take('right') ? 1 : 0) - (input.take('left') ? 1 : 0), dy = (input.take('down') ? 1 : 0) - (input.take('up') ? 1 : 0);
  const ok = input.take('confirm') | input.take('jump');
  if (dx || dy) sfx.ui();
  if (P.tab === 0) {
    const n = TREE_BY_ID[P.tree.sel];
    if (dx || dy) (P.tree.sel = (step(n, TREE, dx, dy) || n).id), (P.lockPend = undefined);
    if (ok) P.lockPend !== undefined ? chooseLock(P.lockPend) : buy(TREE_BY_ID[P.tree.sel]);
    if (input.take('undo')) undo();
    if (input.take('lock')) pendLock(LOCKS[(LOCKS.indexOf(P.lockPend !== undefined ? P.lockPend : weaponLock()) + 1) % LOCKS.length]);
    if (input.take('leave')) refundAll();
  } else if (P.tab === 1) {
    if (!M.open) {
      if (dx || dy) M.type = SKY.indexOf(step(SKY[M.type], SKY, dx, dy) || SKY[M.type]);
      if (ok) (M.open = true), (M.tier = Math.min(tiersOpen(TYPE_LIST[M.type]), MASTERY_TIERS.length - 1)), (M.opt = 0);
    } else {
      M.tier = Math.max(0, Math.min(MASTERY_TIERS.length - 1, M.tier + dy));
      if (dx) M.opt = dx > 0 ? 1 : 0;
      if (ok) pick(TYPE_LIST[M.type], M.tier, M.opt);
    }
  } else {
    P.troph = Math.max(0, Math.min(9, P.troph + dy + dx * 5));
  }
}

// ---------------------------------------------------------------- mouse / touch
canvas.addEventListener('pointerdown', e => {
  if (!P.open) return;
  e.preventDefault();
  const b = canvas.getBoundingClientRect(), x = ((e.clientX - b.left) * W) / b.width, y = ((e.clientY - b.top) * H) / b.height;
  const hit = [...P.boxes].reverse().find(r => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
  if (hit) hit.on();
});
const box = (x, y, w, h, on) => P.boxes.push({ x, y, w, h, on });

// ---------------------------------------------------------------- drawing
export function drawPowers(t) {
  if (!P.open) return;
  P.boxes = [];
  dither(0, 0, W, H, C.ink, 12);
  panel('panel', 4, 4, W - 8, H - 8);
  TABS.forEach((name, i) => {
    const x = 12 + i * 84, on = P.tab === i;
    rect(x, 10, 80, 13, on ? C.gold : C.slate);
    rect(x + 1, 11, 78, 11, on ? C.night : C.ink);
    text(name, x + 40, 13, on ? C.gold : C.fog, { align: 'center' });
    box(x, 10, 80, 13, () => { P.tab = i; P.confirm = false; sfx.ui(); });
  });
  rect(W - 21, 10, 13, 13, C.ink);
  text('X', W - 15, 13, C.coral, { align: 'center' });
  box(W - 22, 9, 15, 15, closePowers);
  text(`${fmt(meta().shards)} SHARDS`, W - 28, 13, P.drain > 0 && Math.floor(t * 20) % 2 ? C.paper : C.ice, { align: 'right' });
  if (P.tab === 0) drawTree(t), drawConsolidate();
  else if (P.tab === 1) drawMastery(t);
  else drawTrophies(t);
  if (P.msgT > 0) text(P.msg, W / 2, H - 29, C.cream, { align: 'center' });
  const hint = P.tab === 0 ? 'ARROWS: PICK  ENTER: INVEST  U: UNDO  Q: REFUND  G: SPECIALIZE  SHIFT: TAB  E: CLOSE'
    : P.tab === 1 ? (P.mast.open ? 'ARROWS: PICK A STAR   ENTER: CHOOSE THE PERK   Q: BACK TO THE SKY   E: CLOSE' : 'ARROWS: PICK A CONSTELLATION   ENTER: OPEN IT   SHIFT: NEXT TAB   E: CLOSE')
    : 'BEAT A FAMILY HEAD IN ITS CASTLE FOR ITS TROPHY   SHIFT: NEXT TAB   E: CLOSE';
  text(hint, W / 2, H - 18, C.fog, { align: 'center' });
}

// ---------------------------------------------------------------- shared pixel helpers
const MAP = { x: 8, y: 28, w: 322, h: 210 }; // the web / the sky
const SIDE = { x: 334, y: 28, w: 138, h: 210 }; // the detail panel
function disc(x, y, r, col) {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy) + 0.5);
    rect(x - w, y + dy, w * 2 + 1, 1, col);
  }
}
function cloud(x, y, r, col, level) {
  for (const [k, l] of [[1, level * 0.5], [0.66, level * 0.8], [0.35, level]])
    for (let dy = -r * k; dy <= r * k; dy += 2) {
      const w = Math.sqrt(Math.max(0, (r * k) ** 2 - dy * dy)) * 1.5;
      dither(x - w, y + dy, w * 2, 2, col, l);
    }
}
// a dotted line, from just outside one circle to just outside another
function dots(x1, y1, x2, y2, col, gap = 2, r1 = 0, r2 = 0) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  for (let s = r1 + 1; s < d - r2; s += gap) px(x1 + ((x2 - x1) * s) / d, y1 + ((y2 - y1) * s) / d, col);
}
function wrap(s, maxW) {
  const lines = [''];
  for (const w of s.split(' ')) {
    const t = lines.at(-1) ? lines.at(-1) + ' ' + w : w;
    if (textWidth(t) > maxW && lines.at(-1)) lines.push(w);
    else lines[lines.length - 1] = t;
  }
  return lines;
}
function para(s, x, y, maxW, col, gap = 9) {
  for (const l of wrap(s, maxW)) (text(l, x, y, col), (y += gap));
  return y;
}
function button(label, x, y, w, on, col, fn) {
  rect(x, y, w, 13, on ? col : C.slate);
  rect(x + 1, y + 1, w - 2, 11, C.ink);
  text(label, x + w / 2, y + 3, on ? col : C.stone, { align: 'center' });
  box(x, y, w, 13, fn);
}
// background stars that stay put
const STARS = Array.from({ length: 140 }, (_, i) => [((i * 7919) % 997) / 997, ((i * 104729) % 991) / 991, i % 9 === 0 ? 2 : i % 3 === 0 ? 1 : 0]);
function starfield(t, twinkle = true) {
  rect(MAP.x, MAP.y, MAP.w, MAP.h, C.ink);
  STARS.forEach(([fx, fy, b], i) => {
    const on = !twinkle || b < 2 || Math.floor(t * 2 + i) % 5;
    px(MAP.x + fx * MAP.w, MAP.y + fy * MAP.h, b === 2 && on ? C.mist : b === 1 ? C.stone : C.slate);
  });
}

// ---------------------------------------------------------------- the shard web
const R = { small: 5, aoe: 6, medium: 7, key: 9 };
const colOf = n => (n.el ? C[ELEMENTS[n.el].col] : n.branch ? C[BRANCHES.find(B => B.id === n.branch).col] : C.gold);
const minY = Math.min(...TREE.map(n => n.y)) - 12, maxY = Math.max(...TREE.map(n => n.y)) + 12;
const ORIGIN = { x: MAP.x + MAP.w / 2, y: Math.round(MAP.y + (MAP.h - (maxY - minY)) / 2 - minY) };
const at = n => [ORIGIN.x + n.x, ORIGIN.y + n.y];

// ---- each class cluster sits on a dithered silhouette of its weapon: a sword for blades, a hammer
// for blunt, a bow for ranged. Shapes are in the cluster's own frame (u: out from CORE along the
// branch, v: across it), the same frame the nodes are placed in, so the weapon covers its cluster.
const WEAPON_SHAPES = {
  blades: (u, v) => {
    const a = Math.abs(v);
    if (u >= 60 && u <= 130) return a < Math.min(11, (132 - u) * 0.7); // blade, tapering to a point
    if (u >= 50 && u < 60) return a < 32; // crossguard
    if (u >= 32 && u < 50) return a < 5; // grip
    return Math.hypot(u - 27, v) < 8; // pommel
  },
  blunt: (u, v) => {
    const a = Math.abs(v);
    if (u >= 92 && u <= 126) return a < 30 - Math.max(0, Math.abs(u - 109) - 12) * 1.6; // head, bevelled corners
    return u >= 26 && u < 90 && a < 5; // handle
  },
  ranged: (u, v) => {
    const d = Math.hypot(u - 22, v), ang = Math.abs(Math.atan2(v, u - 22)), a = Math.abs(v);
    if (d > 76 && d < 88 && ang < 0.95) return true; // the bent limbs
    if (Math.abs(u - (22 + 82 * Math.cos(0.95))) < 1.2 && a < 82 * Math.sin(0.95)) return true; // the string
    if (u >= 40 && u <= 116 && a < 2) return true; // a nocked arrow
    return u > 114 && u < 130 && a < (130 - u) * 0.6; // its head
  }
};
const shapeRuns = {};
// rasterize a class's weapon once into horizontal runs: [x, y, width, edge]
function weaponRuns(B) {
  if (shapeRuns[B.id]) return shapeRuns[B.id];
  const [a, b] = B.dir, [c, d] = B.side, det = a * d - b * c, inside = WEAPON_SHAPES[B.id];
  const hit = (x, y) => {
    const dx = x - ORIGIN.x, dy = y - ORIGIN.y;
    return inside((dx * d - dy * c) / det, (a * dy - b * dx) / det);
  };
  const runs = [];
  for (let y = MAP.y; y < MAP.y + MAP.h; y++)
    for (let x = MAP.x, start = -1, edge = false; x <= MAP.x + MAP.w; x++) {
      const on = x < MAP.x + MAP.w && hit(x, y);
      if (on && start < 0) start = x;
      if (on) edge ||= !hit(x - 1, y) || !hit(x + 1, y) || !hit(x, y - 1) || !hit(x, y + 1);
      if (!on && start >= 0) runs.push([start, y, x - start]), (start = -1);
    }
  // the outline, one pixel wide, drawn a little denser
  const outline = [];
  for (const [x0, y, w] of runs) for (let x = x0; x < x0 + w; x++) if (!hit(x - 1, y) || !hit(x + 1, y) || !hit(x, y - 1) || !hit(x, y + 1)) outline.push([x, y]);
  return (shapeRuns[B.id] = { runs, outline });
}
function drawWeaponShape(B, col, level) {
  const { runs, outline } = weaponRuns(B);
  for (const [x, y, w] of runs) dither(x, y, w, 1, col, level);
  for (const [x, y] of outline) dither(x, y, 1, 1, col, level + 6);
}

function drawTree(t) {
  starfield(t);
  for (const [B, c] of [[BRANCHES[0], C.wine], [BRANCHES[1], C.woodD], [BRANCHES[2], C.navy]]) drawWeaponShape(B, c, weaponLock() === B.id ? 5 : 3);
  for (const B of BRANCHES) {
    const lx = ORIGIN.x + B.dir[0] * 90 + B.side[0] * (B.label || 52), ly = ORIGIN.y + B.dir[1] * 90 + B.side[1] * 50;
    text(B.name, Math.max(MAP.x + 20, Math.min(MAP.x + MAP.w - 20, lx)), Math.min(MAP.y + MAP.h - 10, ly), weaponLock() === B.id ? C[B.col] : C.stone, { align: 'center' });
  }
  const L = weaponLock();
  text(L ? `${CLASSES[L].name} SPECIALIST` : 'NOT SPECIALIZED', MAP.x + 4, MAP.y + MAP.h - 10, L ? C[CLASSES[L].col] : C.fog);
  for (const [a, b] of TREE_LINKS) {
    const A = TREE_BY_ID[a], Bn = TREE_BY_ID[b], ra = rank(a), rb = rank(b);
    const col = ra && rb ? (A.branch === Bn.branch || !A.branch ? colOf(Bn.branch ? Bn : A) : C.gold) : ra || rb ? C.fog : C.slate;
    dots(...at(A), ...at(Bn), col, ra && rb ? 1 : 2, R[A.size], R[Bn.size]);
  }
  for (const n of TREE) {
    const [x, y] = at(n), r = R[n.size], k = rank(n.id), col = colOf(n), open = linked(n.id), sel = P.tree.sel === n.id;
    if (n.size === 'key') cloud(x, y, 9, col, k ? 6 : 3);
    if (sel && Math.floor(t * 4) % 2) disc(x, y, r + 2, C.gold);
    const shut = n.branch && weaponLock() !== n.branch; // another specialization's cluster
    disc(x, y, r, k ? (shut ? C.stone : col) : shut ? C.night : open ? (cantBuy(n.id) ? C.fog : C.ice) : C.slate);
    disc(x, y, r - 1, C.ink);
    if (k) disc(x, y, Math.max(1, Math.round(((r - 2) * k) / n.max)), col);
    if (k >= n.max) px(x, y, C.cream);
    if (n.size === 'key') for (const [ox, oy] of [[0, -r - 2], [0, r + 2], [-r - 2, 0], [r + 2, 0]]) px(x + ox, y + oy, k ? col : C.stone);
    // an area augment wears a burst of eight rays
    if (n.aoe) for (const [ox, oy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) px(Math.round(x + ox * (r + 2)), Math.round(y + oy * (r + 2)), k ? C.orange : C.stone);
    box(x - r - 2, y - r - 2, r * 2 + 5, r * 2 + 5, () => {
      if (P.tree.sel === n.id) buy(n);
      else (P.tree.sel = n.id), sfx.ui();
    });
  }
  drawNodePanel(t);
}

function drawNodePanel(t) {
  const n = TREE_BY_ID[P.tree.sel], k = rank(n.id), why = cantBuy(n.id), col = colOf(n), S = SIDE;
  rect(S.x, S.y, S.w, S.h, C.night);
  rect(S.x + 1, S.y + 1, S.w - 2, S.h - 2, C.ink);
  disc(S.x + 18, S.y + 18, 11, col);
  disc(S.x + 18, S.y + 18, 9, C.night);
  disc(S.x + 18, S.y + 18, Math.max(1, Math.round((7 * Math.max(k, 0.4)) / n.max)), k ? col : C.slate);
  let y = para(n.name, S.x + 34, S.y + 7, S.w - 38, C.gold);
  text(`RANK ${k}/${n.max}`, S.x + 34, Math.max(y, S.y + 22), k ? col : C.fog);
  y = S.y + 38;
  text(n.el ? 'ELEMENT KEYSTONE' : n.aoe ? (n.branch ? CLASSES[n.branch].name + ' AREA AUGMENT' : 'AREA AUGMENT: EVERY WEAPON') : n.branch ? CLASSES[n.branch].name + ' ONLY' : n.id === 'core' ? 'THE CORE' : 'SHARED: EVERY WEAPON', S.x + 6, y, C.stone);
  y += 11;
  if (k) y = para('NOW: ' + nodeText(n, k), S.x + 6, y, S.w - 12, C.paper) + 2;
  if (k < n.max) y = para((k ? 'NEXT: ' : '') + nodeText(n, k + 1), S.x + 6, y, S.w - 12, k ? C.mist : C.paper) + 2;
  if (n.id === 'core') {
    text('SPECIALIZE (G)', S.x + 6, y + 4, C.gold);
    LOCKS.forEach((c, i) => {
      const bx = S.x + 6 + (i % 2) * 64, yy = y + 15 + Math.floor(i / 2) * 16, on = weaponLock() === c, pend = P.lockPend === c && !on;
      rect(bx, yy, 62, 13, on ? (c ? C[CLASSES[c].col] : C.mist) : pend && Math.floor(t * 4) % 2 ? C.gold : C.slate);
      rect(bx + 1, yy + 1, 60, 11, on ? C.night : C.ink);
      text(c ? CLASSES[c].name : 'NONE', bx + 31, yy + 3, on ? (c ? C[CLASSES[c].col] : C.paper) : pend ? C.gold : C.fog, { align: 'center' });
      box(bx, yy, 62, 13, () => chooseLock(c));
    });
  }
  const by = S.y + S.h - 62;
  if (k < n.max) {
    text('SHARD COST', S.x + 6, by - 12, C.fog);
    text(fmt(rankCost(n, k + 1)), S.x + S.w - 6, by - 12, why === 'NOT ENOUGH SHARDS' ? C.coral : C.ice, { align: 'right' });
  }
  if (why && why !== 'MAXED') para(why, S.x + 6, by - 30, S.w - 12, C.coral);
  button(k >= n.max ? 'MAXED' : 'INVEST', S.x + 6, by, S.w - 12, !why, C.lime, () => buy(n));
  button('UNDO', S.x + 6, by + 17, (S.w - 16) / 2, canUndo(), C.sky, undo);
  button(P.confirm ? 'SURE?' : 'REFUND', S.x + 10 + (S.w - 16) / 2, by + 17, (S.w - 16) / 2, TREE.some(m => rank(m.id)) || !!weaponLock(), C.coral, refundAll);
  text(`${TREE.reduce((s, m) => s + rank(m.id), 0)} RANKS SPENT`, S.x + S.w / 2, by + 37, C.stone, { align: 'center' });
}

// ---------------------------------------------------------------- the mastery sky
// each weapon type is a constellation drawn in its own shape: strokes in -1..1 units. Its ten perk
// tiers sit evenly along the strokes, each with two stars to choose from.
const SHAPES = {
  sword: [[[0, -1], [0, 0.55]], [[-0.42, 0.55], [0.42, 0.55]], [[0, 0.55], [0, 0.98]]],
  dagger: [[[0, -0.7], [0, 0.35]], [[-0.38, 0.35], [0.38, 0.35]], [[0, 0.35], [0, 0.8]]],
  katana: [[[0.3, -1], [0.32, -0.45], [0.22, 0.05], [0.02, 0.5]], [[-0.18, 0.4], [0.24, 0.62]], [[0.02, 0.5], [-0.12, 0.98]]],
  hammer: [[[-0.65, -0.85], [0.65, -0.85], [0.65, -0.35], [-0.65, -0.35], [-0.65, -0.85]], [[0, -0.35], [0, 1]]],
  nunchucks: [[[-0.75, -0.95], [-0.45, -0.1]], [[-0.45, -0.1], [0, 0.25], [0.45, -0.1]], [[0.45, -0.1], [0.75, -0.95]]],
  staff: [[[0, -0.95], [0, 1]], [[-0.32, -0.7], [0, -0.95], [0.32, -0.7]]],
  bow: [[[0, -1], [0.42, -0.62], [0.58, 0], [0.42, 0.62], [0, 1]], [[0, -1], [0, 1]], [[-0.62, 0], [0.58, 0]]],
  shuriken: [[[0, -1], [0.25, -0.25], [1, 0], [0.25, 0.25], [0, 1], [-0.25, 0.25], [-1, 0], [-0.25, -0.25], [0, -1]]],
  wand: [[[-0.55, 0.95], [0.35, -0.45]], [[0.35, -1], [0.35, 0.05]], [[-0.15, -0.45], [0.85, -0.45]]],
  spear: [[[0, -1], [-0.25, -0.55], [0, -0.45], [0.25, -0.55], [0, -1]], [[0, -0.45], [0, 1]]],
  axe: [[[0, -1], [0, 1]], [[0, -0.85], [0.62, -1], [0.75, -0.45], [0.62, 0.1], [0, -0.15]]],
  scythe: [[[0.25, 1], [0, -1]], [[0, -1], [-0.55, -0.9], [-0.95, -0.5]]],
  boomerang: [[[-0.9, 0.45], [-0.3, -0.1], [0, -0.6], [0.3, -0.1], [0.9, 0.45]]]
};
// the ten tier points of a shape: [x, y, direction x, direction y] in units
const TIER_PTS = Object.fromEntries(
  Object.entries(SHAPES).map(([type, strokes]) => {
    const segs = strokes.flatMap(s => s.slice(1).map((p, i) => [s[i], p]));
    const len = segs.reduce((a, [p, q]) => a + Math.hypot(q[0] - p[0], q[1] - p[1]), 0);
    return [type, MASTERY_TIERS.map((_, i) => {
      let d = ((i + 0.5) / MASTERY_TIERS.length) * len;
      for (const [p, q] of segs) {
        const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (d <= l) return [p[0] + ((q[0] - p[0]) * d) / l, p[1] + ((q[1] - p[1]) * d) / l, (q[0] - p[0]) / l, (q[1] - p[1]) / l];
        d -= l;
      }
    })];
  })
);
// the sky: five constellations round the pole star, eight further out
const SK = 21; // constellation size in the sky
const POLE = { x: MAP.x + MAP.w / 2, y: MAP.y + MAP.h / 2 + 2 };
const SKY = TYPE_LIST.map((type, i) => {
  const inner = i < 5, a = inner ? -Math.PI / 2 + (i * Math.PI * 2) / 5 : -Math.PI / 2 + Math.PI / 8 + ((i - 5) * Math.PI * 2) / 8;
  return { type, x: Math.round(POLE.x + Math.cos(a) * (inner ? 58 : 130)), y: Math.round(POLE.y + Math.sin(a) * (inner ? 46 : 74)) };
});
const NEBULA = [[-100, -52, 30, 'wine'], [-70, -30, 22, 'pink'], [30, -70, 30, 'navy'], [70, -55, 22, 'blue'], [-110, 55, 30, 'pine'], [-80, 70, 18, 'leaf'],
  [100, 55, 32, 'indigo'], [130, 30, 20, 'violet'], [135, -20, 22, 'rust'], [0, 10, 24, 'navy']];

// the lines of a constellation, with a star at every corner
function strokes(type, x, y, k, col, starCol) {
  for (const s of SHAPES[type]) {
    for (let i = 1; i < s.length; i++) dots(x + s[i - 1][0] * k, y + s[i - 1][1] * k, x + s[i][0] * k, y + s[i][1] * k, col, k > 30 ? 2 : 1);
    for (const [ux, uy] of s) {
      const sx = x + ux * k, sy = y + uy * k;
      px(sx, sy, starCol);
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) px(sx + ox, sy + oy, col);
    }
  }
}
// A weapon's permanent glow evolves with its mastery level (0-100): nothing at first, then a faint
// blue haze, icy, warm cream, gold, and at 100 a radiant gold that breathes. Chosen perks deepen it.
const GLOW_STAGES = [
  { lv: 0, line: C.fog, star: C.paper, halo: C.slate, base: 0 },
  { lv: 10, line: C.sky, star: C.ice, halo: C.navy, base: 2 },
  { lv: 25, line: C.ice, star: C.paper, halo: C.blue, base: 3 },
  { lv: 50, line: C.cream, star: C.paper, halo: C.violet, base: 3.5 },
  { lv: 75, line: C.gold, star: C.cream, halo: C.orange, base: 4 },
  { lv: 100, line: C.gold, star: C.paper, halo: C.gold, base: 5 }
];
export function masteryGlow(type, t) {
  const lv = proficiency(type).lv, stage = GLOW_STAGES.reduce((s, g, i) => (lv >= g.lv ? i : s), 0), g = GLOW_STAGES[stage];
  const perks = MASTERY_TIERS.filter((_, i) => perkChoice(type, i) != null).length;
  const breathe = stage ? Math.sin(t * (1.5 + stage * 0.4)) * (stage >= 5 ? 1.5 : 0.6) : 0;
  return { stage, line: g.line, star: g.star, halo: g.halo, level: stage ? Math.max(1, g.base + perks * 0.2 + breathe) : 0 };
}
// a mote of light at a random point along one of the constellation's strokes
function emitSpark(x, y, k, type, t, i) {
  const S = SHAPES[type], s = S[Math.floor(Math.random() * S.length)], j = 1 + Math.floor(Math.random() * (s.length - 1)), f = Math.random();
  const sx = x + (s[j - 1][0] + (s[j][0] - s[j - 1][0]) * f) * k, sy = y + (s[j - 1][1] + (s[j][1] - s[j - 1][1]) * f) * k;
  px(Math.round(sx), Math.round(sy), i ? C.cream : C.paper);
  px(Math.round(sx) + 1, Math.round(sy), C.gold);
  px(Math.round(sx), Math.round(sy) - 1, C.gold);
}
// the two option stars at a tier, left one first
function optionStars(type, tier, x, y, k) {
  const [ux, uy, dx, dy] = TIER_PTS[type][tier], cx0 = x + ux * k, cy0 = y + uy * k;
  const a = [cx0 - dy * 12, cy0 + dx * 12], b = [cx0 + dy * 12, cy0 - dx * 12];
  return { c: [cx0, cy0], o: a[0] < b[0] - 0.5 || (Math.abs(a[0] - b[0]) <= 0.5 && a[1] < b[1]) ? [a, b] : [b, a] };
}

function drawMastery(t) {
  starfield(t);
  const M = P.mast;
  for (const [ox, oy, r, c] of NEBULA) cloud(POLE.x + ox, POLE.y + oy, r, C[c], M.open ? 1.5 : 3);
  if (M.open) drawConstellation(t);
  else drawSky(t);
  drawMasteryPanel(t);
}
function drawSky(t) {
  const M = P.mast;
  // the pole star
  for (let i = -6; i <= 6; i++) (px(POLE.x + i, POLE.y, C.fog), px(POLE.x, POLE.y + i, C.fog));
  disc(POLE.x, POLE.y, 2, C.cream);
  SKY.forEach((s, i) => {
    const sel = M.type === i, open = tiersOpen(s.type), wait = unpicked(s.type).length;
    const G = masteryGlow(s.type, t);
    if (G.level) cloud(s.x, s.y, 14 + G.stage * 2, G.halo, G.level);
    if (sel) cloud(s.x, s.y, 18, C.slate, 5);
    strokes(s.type, s.x, s.y, SK, sel ? C.ice : G.stage ? G.line : open ? C.fog : C.stone, sel || open || G.stage ? G.star : C.mist);
    TIER_PTS[s.type].forEach(([ux, uy], tier) => {
      const x = s.x + ux * SK, y = s.y + uy * SK, chosen = perkChoice(s.type, tier) != null;
      if (chosen) (disc(x, y, 1, C.gold), px(x, y, C.cream));
      else px(x, y, tier < open ? (Math.floor(t * 3) % 2 ? C.lime : C.mist) : C.slate);
    });
    if (sel) text(s.type.toUpperCase(), s.x, s.y + SK + 4, C.gold, { align: 'center' });
    else if (wait && Math.floor(t * 3) % 2) disc(s.x, s.y + SK + 5, 1, C.lime);
    box(s.x - SK - 2, s.y - SK - 2, SK * 2 + 4, SK * 2 + 4, () => {
      if (M.type === i) (M.open = true), (M.tier = Math.min(tiersOpen(s.type), MASTERY_TIERS.length - 1)), (M.opt = 0);
      M.type = i;
      sfx.ui();
    });
  });
}
function drawConstellation(t) {
  const M = P.mast, type = TYPE_LIST[M.type], open = tiersOpen(type), k = 88, ch = P.charge && P.charge.type === type ? P.charge : null;
  // charging: the weapon hums (a one-pixel shiver that quickens) and its glow swells, then flares
  const p = ch ? Math.min(1, ch.t / CHARGE) : 0, flare = ch && ch.t > CHARGE * 0.85 ? Math.max(0, 1 - (ch.t - CHARGE * 0.85) / 0.6) : 0;
  const shiver = ch && p < 1 ? (Math.floor(t * (20 + p * 40)) % 2 ? 1 : -1) * (p > 0.3 ? 1 : 0) : 0;
  const x = POLE.x + shiver, y = POLE.y;
  // the weapon's permanent glow, grown from its mastery (masteryGlow), swelling further while it charges
  const G = masteryGlow(type, t);
  if (G.level || ch) cloud(x, y, 44 + G.stage * 6, G.halo, Math.min(8, G.level + p * 4 + flare * 6));
  const glow = ch ? [C.sky, C.ice, C.cream, C.gold, C.paper][Math.min(4, Math.floor(p * 4 + flare * 2))] : G.line;
  strokes(type, x, y, k, glow, ch && Math.floor(t * 16) % 2 ? C.gold : G.star);
  if (!ch && G.stage >= 3) for (let i = 0; i < G.stage - 2; i++) if (Math.random() < 0.5) emitSpark(x, y, k, type, t, i);
  if (ch && p < 1) for (let i = 0; i < 3; i++) emitSpark(x, y, k, type, t, i); // power crawling along the lines
  if (flare) {
    const r = 10 + (1 - flare) * 90;
    for (let a = 0; a < 48; a++) if (a % 2 || flare > 0.5) px(Math.round(x + Math.cos((a * Math.PI) / 24) * r), Math.round(y + Math.sin((a * Math.PI) / 24) * r * 0.8), flare > 0.6 ? C.paper : C.gold);
  }
  text(type.toUpperCase(), MAP.x + 6, MAP.y + 5, C.gold);
  text(`MASTERY ${proficiency(type).lv}/100`, MAP.x + 6, MAP.y + 15, C.sky);
  MASTERY_TIERS.forEach((lv, tier) => {
    const { c, o } = optionStars(type, tier, x, y, k), chosen = perkChoice(type, tier), on = tier < open;
    o.forEach(([sx, sy], opt) => {
      const picked = chosen === opt, sel = M.tier === tier && M.opt === opt;
      dots(c[0], c[1], sx, sy, picked ? C.gold : on ? C.fog : C.slate, picked ? 1 : 2, 1, 4);
      if (picked) cloud(sx, sy, 6, C.gold, 5);
      if (sel && Math.floor(t * 4) % 2) disc(sx, sy, 6, C.gold);
      disc(sx, sy, picked ? 4 : 3, picked ? C.gold : on ? C.mist : C.slate);
      disc(sx, sy, picked ? 2 : 1, picked ? C.cream : on ? (chosen == null && Math.floor(t * 3) % 2 ? C.lime : C.paper) : C.stone);
      box(sx - 7, sy - 7, 15, 15, () => {
        if (M.tier === tier && M.opt === opt) pick(type, tier, opt);
        else (M.tier = tier), (M.opt = opt), sfx.ui();
      });
    });
    disc(c[0], c[1], 1, on ? C.ice : C.slate);
    if (M.tier === tier) text('LV' + lv, c[0], c[1] - 10, on ? C.sky : C.stone, { align: 'center' });
  });
  button('< SKY', MAP.x + 6, MAP.y + MAP.h - 19, 40, true, C.mist, () => ((M.open = false), sfx.ui()));
}
function drawMasteryPanel(t) {
  const M = P.mast, type = TYPE_LIST[M.type], p = proficiency(type), open = tiersOpen(type), S = SIDE;
  rect(S.x, S.y, S.w, S.h, C.night);
  rect(S.x + 1, S.y + 1, S.w - 2, S.h - 2, C.ink);
  text(type.toUpperCase(), S.x + 6, S.y + 6, C.gold);
  text(`MASTERY ${p.lv}/100`, S.x + 6, S.y + 16, C.sky);
  text(profRank(p.lv), S.x + 6, S.y + 26, C.fog);
  for (let i = 0; i < 10; i++) rect(S.x + 6 + i * 13, S.y + 37, 11, 3, perkChoice(type, i) != null ? C.gold : i < open ? C.lime : C.slate);
  if (!M.open) {
    let y = S.y + 48;
    MASTERY_TIERS.forEach((lv, tier) => {
      const c = perkChoice(type, tier);
      text(fitText(`${lv}: ${c != null ? masteryPerk(type, tier, c).name : tier < open ? 'CHOOSE!' : '...'}`, S.w - 12), S.x + 6, y, c != null ? C.paper : tier < open ? C.lime : C.stone);
      y += 10;
    });
    button('OPEN', S.x + 6, S.y + S.h - 19, S.w - 12, true, C.ice, () => ((M.open = true), (M.tier = Math.min(open, MASTERY_TIERS.length - 1)), (M.opt = 0), sfx.ui()));
    return;
  }
  const on = M.tier < open, chosen = perkChoice(type, M.tier);
  text(`AT MASTERY ${MASTERY_TIERS[M.tier]}`, S.x + 6, S.y + 46, on ? C.sky : C.coral);
  [0, 1].forEach(opt => {
    const perk = masteryPerk(type, M.tier, opt), y0 = S.y + 58 + opt * 56, sel = M.opt === opt, picked = chosen === opt;
    rect(S.x + 4, y0, S.w - 8, 52, sel ? C.gold : picked ? C.lime : C.slate);
    rect(S.x + 5, y0 + 1, S.w - 10, 50, picked ? C.pine : C.night);
    text(fitText((picked ? '* ' : '') + perk.name, S.w - 16), S.x + 8, y0 + 4, picked ? C.lime : sel ? C.gold : C.paper);
    para(perk.desc.toUpperCase(), S.x + 8, y0 + 15, S.w - 16, on ? C.mist : C.stone);
    box(S.x + 4, y0, S.w - 8, 52, () => {
      if (M.opt === opt) pick(type, M.tier, opt);
      else (M.opt = opt), sfx.ui();
    });
  });
  button(chosen === M.opt ? 'CHOSEN' : 'CHOOSE', S.x + 6, S.y + S.h - 19, S.w - 12, on && chosen !== M.opt, C.lime, () => pick(type, M.tier, M.opt));
}

function cup(x, y, won) {
  const g = won ? C.gold : C.stone, d = won ? C.orange : C.slate;
  rect(x, y, 14, 8, C.ink);
  rect(x + 1, y + 1, 12, 6, g);
  rect(x + 2, y + 1, 3, 4, won ? C.cream : C.fog);
  rect(x - 2, y + 2, 3, 3, d);
  rect(x + 13, y + 2, 3, 3, d);
  rect(x + 5, y + 8, 4, 3, d);
  rect(x + 3, y + 11, 8, 3, g);
}
function drawTrophies(t) {
  const won = Object.keys(TROPHIES).filter(r => hasTrophy(r)).length;
  text(`TROPHIES ${won}/10`, 12, 30, C.gold);
  for (let i = 0; i < 10; i++) {
    const r = i + 1, T = TROPHIES[r], x = 10 + Math.floor(i / 5) * 232, y = 42 + (i % 5) * 31, have = hasTrophy(r), sel = P.troph === i;
    rect(x, y, 228, 28, sel ? C.gold : C.slate);
    rect(x + 1, y + 1, 226, 26, C.ink);
    cup(x + 6, y + 7, have);
    text(have ? T.name : '???', x + 26, y + 4, have ? C.gold : C.fog);
    text(have ? fitText(`${T.perk}: ${T.desc.toUpperCase()}`, 196) : fitText('BEAT ' + bossName(FAMILIES[r].head), 196), x + 26, y + 15, have ? C.lime : C.stone);
    box(x, y, 228, 28, () => { P.troph = i; sfx.ui(); });
  }
  text(won ? 'TROPHY PERKS ARE ALWAYS ON, FOR EVERY WEAPON.' : 'EVERY CASTLE HOLDS A FAMILY HEAD. BEAT ONE TO WIN ITS TROPHY.', 12, 200, C.mist);
}
