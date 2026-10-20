// The POWERS window on the overworld (E / B / Tab, or the Bag button): three tabs over the map.
//   SHARD TREE  spend banked shards on ranks (ENTER), refund everything (Q)
//   MASTERY     each weapon type's perk choices along its road to mastery level 100
//   TROPHIES    the ten family heads' trophies and the perks they gave you
// Arrows move, SHIFT / V (or clicking a tab) changes tab. Mouse and touch click anything. Rules and
// numbers live in data/meta.js.
import { C, W, H } from '../config.js';
import { canvas, rect, text, fitText, panel, dither } from '../engine/gfx.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { TYPE_LIST } from '../data/weapons.js';
import { proficiency, profRank } from '../data/proficiency.js';
import { fmt } from '../data/curve.js';
import { FAMILIES } from '../data/families.js';
import { bossName } from './bosses.js';
import {
  meta, TREE, BRANCHES, GATE, rank, rankCost, cantBuy, buyRank, respec, spentIn, tierOpen, TROPHIES, hasTrophy,
  MASTERY_TIERS, masteryPerk, perkChoice, choosePerk, tiersOpen, unpicked
} from '../data/meta.js';

const TABS = ['SHARD TREE', 'MASTERY', 'TROPHIES'];
export const P = { open: false, tab: 0, tree: { c: 0, r: 0 }, mast: { type: 0, col: 0, tier: 0 }, troph: 0, msg: '', msgT: 0, boxes: [], confirm: false };

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
// the tree laid out as a grid: column = branch * 2 + slot, row = tier
const treeAt = (c, r) => TREE.filter(n => n.branch === BRANCHES[Math.floor(c / 2)].id && n.tier === r)[c % 2];
const fmtPct = v => {
  const p = v * 100;
  return (Math.abs(p - Math.round(p)) < 0.05 ? Math.round(p) : p.toFixed(1)) + '';
};
const nodeText = (n, r) => n.desc.replace('{v}', fmtPct(n.per * Math.max(1, r)));

function buy(n) {
  const why = cantBuy(n.id);
  if (why) return say(why);
  buyRank(n.id);
  say(`${n.name} RANK ${rank(n.id)}`, true);
}
function pick(type, tier, opt) {
  if (tier >= tiersOpen(type)) return say(`REACH ${type.toUpperCase()} MASTERY ${MASTERY_TIERS[tier]} FIRST`);
  choosePerk(type, tier, opt);
  say(`${type.toUpperCase()}: ${masteryPerk(type, tier, opt).name}`, true);
}

// called by the overworld while the window is open
export function updatePowers(dt) {
  P.msgT = Math.max(0, P.msgT - dt);
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
    const T = P.tree;
    T.c = (T.c + dx + 6) % 6;
    T.r = Math.max(0, Math.min(3, T.r + dy));
    if (ok) buy(treeAt(T.c, T.r));
    if (input.take('leave')) {
      if (!P.confirm) {
        P.confirm = true;
        say('PRESS Q AGAIN TO REFUND EVERY RANK');
      } else {
        respec();
        P.confirm = false;
        say('ALL SHARDS REFUNDED. SPEC AGAIN!', true);
      }
    }
  } else if (P.tab === 1) {
    const M = P.mast;
    if (M.col === 0) {
      M.type = (M.type + dy + TYPE_LIST.length) % TYPE_LIST.length;
      if (dx > 0) M.col = 1;
    } else {
      M.tier = Math.max(0, Math.min(MASTERY_TIERS.length - 1, M.tier + dy));
      M.col = Math.max(0, Math.min(2, M.col + dx));
      if (ok && M.col) pick(TYPE_LIST[M.type], M.tier, M.col - 1);
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
  text(`${fmt(meta().shards)} SHARDS`, W - 28, 13, C.ice, { align: 'right' });
  if (P.tab === 0) drawTree(t);
  else if (P.tab === 1) drawMastery(t);
  else drawTrophies(t);
  if (P.msgT > 0) text(P.msg, W / 2, H - 38, C.cream, { align: 'center' });
  const hint = P.tab === 0 ? 'ARROWS: PICK   ENTER: BUY A RANK   Q: REFUND ALL   SHIFT: NEXT TAB   E: CLOSE'
    : P.tab === 1 ? 'ARROWS: PICK   ENTER: CHOOSE THE PERK   SHIFT: NEXT TAB   E: CLOSE' : 'BEAT A FAMILY HEAD IN ITS CASTLE FOR ITS TROPHY   SHIFT: NEXT TAB   E: CLOSE';
  text(hint, W / 2, H - 18, C.fog, { align: 'center' });
}

function drawTree(t) {
  BRANCHES.forEach((B, bi) => {
    const bx = 10 + bi * 154, col = C[B.col];
    rect(bx, 28, 150, 166, C.ink);
    rect(bx, 28, 150, 12, C.night);
    text(B.name, bx + 6, 31, col);
    text(`${spentIn(B.id)} RANKS`, bx + 144, 31, C.fog, { align: 'right' });
    for (let tier = 0; tier < 4; tier++) {
      const open = tierOpen(B.id, tier), y = 46 + tier * 37;
      [0, 1].forEach(slot => {
        const c = bi * 2 + slot, n = treeAt(c, tier), x = bx + 4 + slot * 73, sel = P.tab === 0 && P.tree.c === c && P.tree.r === tier;
        const r = rank(n.id), maxed = r >= n.max, afford = !cantBuy(n.id);
        rect(x, y, 69, 30, sel ? C.gold : maxed ? col : C.slate);
        rect(x + 1, y + 1, 67, 28, open ? C.night : C.ink);
        text(fitText(n.name, 64), x + 3, y + 3, open ? (maxed ? col : C.paper) : C.stone);
        for (let i = 0; i < n.max; i++) rect(x + 3 + i * 7, y + 13, 5, 3, i < r ? col : C.stone);
        text(!open ? `AT ${GATE[tier]} RANKS` : maxed ? 'MAX' : fmt(rankCost(n.tier, r + 1)), x + 3, y + 19, !open ? C.stone : maxed ? col : afford ? C.ice : C.fog);
        if (afford && Math.floor(t * 3) % 2) rect(x + 62, y + 3, 3, 3, C.lime);
        box(x, y, 69, 30, () => {
          if (P.tree.c === c && P.tree.r === tier) buy(n);
          else { P.tree.c = c; P.tree.r = tier; sfx.ui(); }
        });
      });
    }
  });
  const n = treeAt(P.tree.c, P.tree.r), r = rank(n.id), why = cantBuy(n.id);
  text(`${n.name}  RANK ${r}/${n.max}`, 12, 200, C.gold);
  text(r ? `NOW: ${nodeText(n, r)}` + (r < n.max ? `   NEXT: ${nodeText(n, r + 1)}` : '') : `FIRST RANK: ${nodeText(n, 1)}`, 12, 210, C.paper);
  if (why && why !== 'MAXED') text(why, W - 12, 200, C.coral, { align: 'right' });
  else if (!why) text(`BUY FOR ${fmt(rankCost(n.tier, r + 1))} SHARDS`, W - 12, 200, C.lime, { align: 'right' });
}

function drawMastery(t) {
  const M = P.mast;
  TYPE_LIST.forEach((type, i) => {
    const y = 30 + i * 13, sel = M.type === i, p = proficiency(type), wait = unpicked(type).length;
    rect(10, y, 104, 12, sel ? (M.col === 0 ? C.gold : C.slate) : C.ink);
    rect(11, y + 1, 102, 10, sel ? C.night : C.ink);
    text(type.toUpperCase(), 14, y + 3, sel ? C.gold : C.paper);
    text('LV ' + p.lv, 110, y + 3, C.sky, { align: 'right' });
    if (wait && Math.floor(t * 3) % 2) rect(4 + 2, y + 4, 3, 3, C.lime);
    box(10, y, 104, 12, () => { M.type = i; M.col = 0; sfx.ui(); });
  });
  const type = TYPE_LIST[M.type], p = proficiency(type), open = tiersOpen(type);
  text(`${type.toUpperCase()} MASTERY ${p.lv}/100  ${profRank(p.lv)}`, 122, 30, C.gold);
  MASTERY_TIERS.forEach((lv, tier) => {
    const y = 42 + tier * 15, on = tier < open, chosen = perkChoice(type, tier);
    text('LV' + lv, 122, y + 3, on ? C.sky : C.stone);
    [0, 1].forEach(opt => {
      const perk = masteryPerk(type, tier, opt), x = 150 + opt * 162, sel = M.col === opt + 1 && M.tier === tier, picked = chosen === opt;
      rect(x, y, 158, 13, sel ? C.gold : picked ? C.lime : C.slate);
      rect(x + 1, y + 1, 156, 11, picked ? C.pine : on ? C.night : C.ink);
      text(fitText(perk.name, 150), x + 4, y + 3, picked ? C.lime : on ? C.paper : C.stone);
      box(x, y, 158, 13, () => {
        if (M.col === opt + 1 && M.tier === tier) pick(type, tier, opt);
        else { M.col = opt + 1; M.tier = tier; sfx.ui(); }
      });
    });
  });
  if (M.col) {
    const perk = masteryPerk(type, M.tier, M.col - 1);
    text(fitText(`${perk.name}: ${perk.desc.toUpperCase()}` + (M.tier >= open ? `  (AT MASTERY ${MASTERY_TIERS[M.tier]})` : ''), 350), 122, 200, C.paper);
  } else text(open < MASTERY_TIERS.length ? `NEXT PERK AT MASTERY ${MASTERY_TIERS[open]}. KILL THINGS WITH IT!` : 'EVERY PERK OPEN. A TRUE GRANDMASTER.', 122, 200, C.mist);
  text('PERKS WORK WHILE YOU HOLD THAT TYPE. CHANGE THEM ANY TIME.', 122, 210, C.fog);
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
