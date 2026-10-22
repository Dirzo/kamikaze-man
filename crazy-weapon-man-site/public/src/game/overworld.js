// The overworld scene: walk the hero along revealed roads (d-pad picks the road that points that
// way), press jump/attack/enter on a level to play it, or on a cannon to fire across the map.
// New roads draw themselves in after a clear. Map data and the save rules live in data/overworld.js.
import { W, H, C } from '../config.js';
import { input } from '../engine/input.js';
import { A } from '../engine/assets.js';
import { X, rect, text, textWidth, panel, dither, frame, screenLayer } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { ZONES } from '../data/zones.js';
import { P as powers, openPowers, updatePowers, drawPowers, powersWaiting } from './powers.js';
import { hasTrophy, chosenMount } from '../data/meta.js';
import { MOUNTS } from '../data/mounts.js';
import { BOSS_OF } from '../data/families.js';
import { bossName } from './bosses.js';
import { GIMMICKS, gimmickOf, EGG_LEVELS } from '../data/gimmicks.js';
import { relicCount, allRelics, relicTotal, RELIC_COUNT } from '../data/relics.js';
import { temperOf, setTemper, modsOf, rewardText } from '../data/temper.js';
import { NODES, REGIONS, SLOT_W, SLOT_H, MAP_W, MAP_H, isLevel, isOpen, edges, step, visit, warp, progress, writeSave } from '../data/overworld.js';
import { drawHeroPlain } from './anim.js';

const WALK = 110; // px/s along a road
const DRAW = 0.7; // seconds for a new road to draw in
const HUD_H = 52; // the info panel along the bottom of the screen
export const ow = { save: null, walk: null, cam: { x: 0, y: 0 }, fresh: [], t: 0, face: 1 };

export function openOverworld(save, fresh = []) {
  ow.save = save;
  ow.walk = null;
  ow.fresh = fresh.map(e => ({ ...e, t: 0 }));
  centre(true);
}
const here = () => NODES[ow.save.at];

function centre(snap) {
  const n = ow.walk ? walkPos() : here();
  const tx = Math.max(0, Math.min(MAP_W - W, n.x - W / 2)), ty = Math.max(0, Math.min(MAP_H - H + HUD_H, n.y - H / 2)); // the sea below the map sits under the HUD
  const k = snap ? 1 : 0.12;
  ow.cam.x += (tx - ow.cam.x) * k;
  ow.cam.y += (ty - ow.cam.y) * k;
}
function walkPos() {
  const w = ow.walk, a = NODES[w.from], b = NODES[w.to], p = Math.min(1, w.d / w.len);
  return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
}

// returns the node to play when the player enters a level, otherwise null
export function updateOverworld(dt) {
  const s = ow.save;
  ow.t += dt;
  for (const e of ow.fresh) e.t += dt;
  ow.fresh = ow.fresh.filter(e => e.t < DRAW);
  centre(false);
  if (powers.open) return updatePowers(dt), null;
  if (ow.fresh.length) return null; // let the new roads finish drawing
  if (ow.walk) {
    ow.walk.d += WALK * dt;
    if (ow.walk.d >= ow.walk.len) {
      s.at = ow.walk.to;
      ow.walk = null;
      const fresh = visit(s, s.at);
      if (fresh.length) ow.fresh = fresh.map(e => ({ ...e, t: 0 }));
      writeSave(s);
    }
    return null;
  }
  if (input.take('inv')) return openPowers(), null;
  if (input.take('temper')) return cycleTemper(), null;
  const dx = (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0), dy = (input.held('down') ? 1 : 0) - (input.held('up') ? 1 : 0);
  if (dx || dy) {
    const to = step(s, s.at, dx, dy);
    if (to) {
      const a = here(), b = NODES[to];
      ow.walk = { from: s.at, to, d: 0, len: Math.hypot(b.x - a.x, b.y - a.y) };
      if (b.x !== a.x) ow.face = Math.sign(b.x - a.x);
    }
    return null;
  }
  if (input.take('confirm') | input.take('jump')) {
    const n = here();
    if (n.kind === 'warp' && NODES[n.to]) {
      sfx.zone();
      warp(s, n.id);
      writeSave(s);
      centre(true);
      return null;
    }
    if (isLevel(n)) { sfx.ui(true); return n; }
  }
  return null;
}

// TEMPER (data/temper.js): T steps up through the tiers you have opened, then back to none
function cycleTemper() {
  const s = ow.save, T = temperOf(s);
  if (!T.max) return (ow.temperMsg = 1.6), sfx.ui();
  setTemper(s, (T.on + 1) % (T.max + 1));
  writeSave(s);
  ow.temperMsg = 0;
  ow.temperFlash = 3;
  sfx.ui(temperOf(s).on > 0);
}

// ---------------------------------------------------------------- drawing
const regionOpen = R => Object.values(NODES).some(n => n.region === R.id && isOpen(ow.save, n.id));
function drawRegion(R) {
  const x = R.col * SLOT_W + 6, y = R.row * SLOT_H + 6, w = SLOT_W - 12, h = SLOT_H - 12, bg = A.bg[ZONES[R.zone].id];
  rect(x - 2, y - 2, w + 4, h + 4, C.ink);
  if (bg) X.drawImage(bg, 0, 0, W, 206, x, y, w, h);
  else rect(x, y, w, h, C.slate);
  dither(x, y, w, h, C.ink, regionOpen(R) ? 5 : 12);
  const label = R.id + '  ' + R.name;
  rect(x + 4, y + 4, textWidth(label) + 10, 13, C.ink);
  text(label, x + 9, y + 7, regionOpen(R) ? C.gold : C.fog);
}
function road(a, b, frac, col) {
  const len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.floor(len / 6);
  for (let i = 0; i <= n * frac; i++) {
    const p = i / Math.max(1, n);
    rect(Math.round(a.x + (b.x - a.x) * p) - 2, Math.round(a.y + (b.y - a.y) * p) - 2, 4, 4, C.ink);
    rect(Math.round(a.x + (b.x - a.x) * p) - 1, Math.round(a.y + (b.y - a.y) * p) - 1, 2, 2, col);
  }
}
function drawNode(n, t) {
  const s = ow.save, open = isOpen(s, n.id), done = !!s.cleared[n.id], x = n.x, y = n.y;
  if (!open && (n.kind === 'secret' || n.kind === 'warp')) return; // hidden until found
  const fill = !open ? C.stone : done ? C.gold : n.kind === 'secret' ? C.pink : C.red;
  if (n.kind === 'castle') {
    rect(x - 9, y - 12, 18, 14, C.ink); rect(x - 8, y - 11, 16, 12, open ? C.mist : C.stone);
    for (const cx of [-8, -2, 4]) rect(x + cx, y - 14, 4, 3, open ? C.mist : C.stone);
    rect(x - 2, y - 5, 4, 6, C.ink);
    rect(x - 1, y - 20, 1, 7, C.woodD); rect(x, y - 20, 5, 3, done ? C.gold : C.red);
    if (hasTrophy(n.region)) { rect(x + 8, y - 22, 7, 5, C.ink); rect(x + 9, y - 21, 5, 3, C.gold); rect(x + 10, y - 18, 3, 3, C.orange); } // its trophy is yours
  } else if (n.kind === 'fort') {
    rect(x - 6, y - 10, 12, 12, C.ink); rect(x - 5, y - 9, 10, 10, open ? C.sand : C.stone);
    rect(x - 6, y - 12, 3, 3, C.ink); rect(x + 3, y - 12, 3, 3, C.ink); rect(x - 2, y - 4, 4, 5, done ? C.gold : C.wine);
  } else if (n.kind === 'warp') {
    rect(x - 7, y - 4, 14, 8, C.ink); rect(x - 6, y - 3, 12, 6, C.slate); rect(x + 2, y - 6, 6, 7, C.ink); rect(x + 3, y - 5, 4, 5, C.teal);
    if (Math.floor(t * 3) % 2) rect(x + 8, y - 4, 2, 2, C.gold);
  } else if (n.kind === 'start') {
    rect(x - 5, y - 5, 10, 10, C.ink); rect(x - 4, y - 4, 8, 8, C.orange); rect(x - 1, y - 1, 2, 2, C.cream);
  } else {
    rect(x - 6, y - 4, 12, 8, C.ink); rect(x - 4, y - 6, 8, 12, C.ink);
    rect(x - 5, y - 3, 10, 6, fill); rect(x - 3, y - 5, 6, 10, fill);
    rect(x - 3, y - 3, 3, 2, C.paper);
    if (s.cleared[n.id]?.includes('secret')) rect(x + 4, y - 7, 3, 3, C.pink);
  }
  if (open && isLevel(n)) decorate(n, x, y, t);
  if (open && isLevel(n)) text(n.id.replace('-F', ' FORT').replace('-C', ' CASTLE').replace('-S', ' SECRET'), x, y + 9, done ? C.cream : C.mist, { align: 'center' });
}

// a level's extras on the map: a gold star once all five relics are home (a count before that),
// a badge for its gimmick, and an egg where your mount waits (once the stable is open)
function star(x, y, col) {
  rect(x - 1, y - 3, 3, 7, C.ink); rect(x - 3, y - 1, 7, 3, C.ink);
  rect(x, y - 2, 1, 5, col); rect(x - 2, y, 5, 1, col); rect(x - 1, y - 1, 3, 3, col);
}
function decorate(n, x, y, t) {
  const s = ow.save, k = relicCount(s, n.id);
  if (allRelics(s, n.id)) star(x - 10, y - 8, Math.floor(t * 2 + x) % 5 ? C.gold : C.paper);
  else if (k) for (let i = 0; i < RELIC_COUNT; i++) rect(x - 9 + i * 2, y - 10, 1, 2, i < k ? C.gold : C.stone);
  const g = gimmickOf(n.id);
  if (g) {
    rect(x + 6, y + 1, 5, 5, C.ink);
    rect(x + 7, y + 2, 3, 3, C[GIMMICKS[g].col]);
  }
  if (chosenMount() && EGG_LEVELS.includes(n.id)) {
    rect(x - 12, y + 1, 4, 5, C.ink);
    rect(x - 11, y + 2, 2, 3, C.cream);
  }
}

export function drawOverworld(t) {
  const s = ow.save;
  X.setTransform(1, 0, 0, 1, 0, 0);
  rect(0, 0, W, H, C.navy);
  // (the sea runs past the map's bottom edge, where the camera can go so the HUD never hides a node)
  X.setTransform(1, 0, 0, 1, -Math.round(ow.cam.x), -Math.round(ow.cam.y));
  for (let y = 0; y < MAP_H + HUD_H; y += 14) for (let x = (y / 14) % 2 ? 7 : 0; x < MAP_W; x += 28) rect(x + Math.round(Math.sin(t + y) * 2), y, 6, 1, C.blue);
  for (const R of REGIONS) drawRegion(R);
  const fresh = new Map(ow.fresh.map(e => [e.from + '>' + e.to, e.t / DRAW]));
  for (const e of edges(s)) road(NODES[e.from], NODES[e.to], fresh.get(e.from + '>' + e.to) ?? 1, e.secret ? C.pink : C.cream);
  for (const n of Object.values(NODES)) drawNode(n, t);
  // the hero
  const p = ow.walk ? walkPos() : here(), Hh = A.hero;
  if (Hh) {
    const f = ow.walk ? ['run1', 'run2', 'run3'][Math.floor(t * 10) % 3] : Math.floor(t * 2) % 2 ? 'idle' : 'idle2';
    drawHeroPlain(f, Math.round(p.x - Hh.w / 2), Math.round(p.y - Hh.h + (ow.walk ? 4 : -2)), ow.face < 0 ? -1 : 1);
  } else rect(p.x - 4, p.y - 14, 8, 12, C.gold);
  screenLayer();
  drawOverworldHud(t);
  powers.sheetWeapon = s.hero?.weapon || null; // the STATS tab reads the weapon you carry
  drawPowers(t);
}
function drawOverworldHud(t) {
  const s = ow.save, n = here(), R = REGIONS[n.region - 1], P = progress(s);
  // along the bottom, so the region names along the top of each painting stay readable
  const y = H - HUD_H;
  panel('panel', 4, y, W - 8, 48);
  text(R.id + ' ' + R.name, 12, y + 6, C.gold);
  text('LEVELS CLEARED ' + P.cleared + '/' + P.total, W - 12, y + 6, C.lime, { align: 'right' });
  const kind = { level: '', fort: ' (FORT)', castle: ' (CASTLE)', secret: ' (SECRET)', warp: ' (CANNON)', start: '' }[n.kind];
  text((isLevel(n) ? n.id + '  ' : '') + n.name.toUpperCase() + kind, 12, y + 16, C.paper);
  if (isLevel(n)) {
    // every level has its own boss: a sibling of the family, or the head itself in the castle
    const done = s.cleared[n.id] ? (s.cleared[n.id].includes('secret') ? 'CLEARED + SECRET   ' : 'CLEARED   ') : '';
    text(done + (n.kind === 'castle' ? 'HEAD: ' : 'BOSS: ') + bossName(BOSS_OF[n.id]), W - 12, y + 16, n.kind === 'castle' ? C.coral : C.cream, { align: 'right' });
  }
  // the fourth line: this level's extras, and the TEMPER tier you are playing at
  if (isLevel(n)) {
    const g = gimmickOf(n.id), bits = [];
    bits.push(`RELICS ${relicCount(s, n.id)}/${RELIC_COUNT}`);
    if (g) bits.push(GIMMICKS[g].name);
    if (chosenMount() && EGG_LEVELS.includes(n.id)) bits.push(MOUNTS[chosenMount()].name + ' EGG');
    text(bits.join('   '), 12, y + 36, g ? C[GIMMICKS[g].col] : C.cream);
  }
  const RT = relicTotal(s), T = temperOf(s);
  text(`RELICS ${RT.got}/${RT.all}  STARS ${RT.sets}`, W / 2 + 10, y + 6, C.gold, { align: 'center' });
  ow.temperMsg = Math.max(0, (ow.temperMsg || 0) - 1 / 60);
  ow.temperFlash = Math.max(0, (ow.temperFlash || 0) - 1 / 60);
  const tCol = ow.temperFlash > 2.5 && Math.floor(t * 20) % 2 ? C.paper : T.on ? C.coral : C.fog;
  if (ow.temperFlash > 0 && T.on) {
    // the modifiers this tier switches on, over the map for a moment
    const mods = modsOf(T.on), ph = 18 + mods.length * 9, py = y - ph - 4;
    panel('panel', W - 214, py, 210, ph);
    text(`TEMPER ${T.on}: THE ENEMIES GET`, W - 206, py + 5, C.coral);
    mods.forEach((m, i) => text(m.name, W - 206, py + 15 + i * 9, i === mods.length - 1 ? C.cream : C.mist));
  }
  if (ow.temperMsg > 0) text('BEAT THE SENTIENT ARMORY TO OPEN TEMPER', W - 12, y + 36, C.coral, { align: 'right' });
  else if (T.max) text(`T: TEMPER ${T.on}/${T.max}` + (T.on ? '  ' + rewardText(T.on) : '  OFF'), W - 12, y + 36, tCol, { align: 'right' });
  const hint = ow.walk ? '' : n.kind === 'warp' ? 'ARROWS: WALK    JUMP / ENTER: FIRE THE CANNON' : isLevel(n) ? 'ARROWS: WALK    JUMP / ENTER: PLAY LEVEL' : 'ARROWS: WALK';
  if (hint) text(hint, 12, y + 26, C.mist);
  // the POWERS window: blinks when there is a mastery perk to pick or a rank you can afford
  text('B: BAG', W - 70, y + 26, C.gold, { align: 'right' });
  text('ESC: SAVE FILES', W - 112, y + 26, C.fog, { align: 'right' });
  text('E: POWERS', W - 12, y + 26, powersWaiting() && Math.floor(t * 3) % 2 ? C.lime : C.gold, { align: 'right' });
}
