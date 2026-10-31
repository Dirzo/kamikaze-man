// The overworld scene: walk the hero along revealed roads (d-pad picks the road that points that
// way), press jump/attack/enter on a level to play it, or on a cannon to fire across the map.
// New roads draw themselves in after a clear. Map data and the save rules live in data/overworld.js.
import { W, H, C } from '../config.js';
import { input } from '../engine/input.js';
import { A } from '../engine/assets.js';
import { X, rect, text, textWidth, panel, dither, frame, screenLayer } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { P as powers, openPowers, updatePowers, drawPowers, powersWaiting } from './powers.js';
import { hasTrophy, chosenMount } from '../data/meta.js';
import { MOUNTS } from '../data/mounts.js';
import { BOSS_OF } from '../data/families.js';
import { bossName } from './bosses.js';
import { GIMMICKS, gimmickOf, EGG_LEVELS } from '../data/gimmicks.js';
import { relicCount, allRelics, relicTotal, RELIC_COUNT } from '../data/relics.js';
import { temperOf, setTemper, modsOf, rewardText } from '../data/temper.js';
import { NODES, REGIONS, SLOT_W, SLOT_H, MAP_W, MAP_H, slotX, slotY, roadPath, alongRoad, seenRegions, isLevel, isOpen, edges, step, visit, warp, progress, writeSave } from '../data/overworld.js';
import { drawHeroPlain } from './anim.js';
import { regionArt, landAt, paintAhead, painted } from './owart.js';
import { updateLife, drawLifeGround, drawLifeSky } from './owlife.js';
import { drawGlobe, lonOf } from './globe.js';

const WALK = 150; // px/s along a road
const FLY = 4.2; // seconds for the fly-over of a world you reach for the first time
const DRAW = 0.7; // seconds for a new road to draw in
const HUD_H = 52; // the info panel along the bottom of the screen
export const ow = { save: null, walk: null, cam: { x: 0, y: 0 }, fresh: [], t: 0, face: 1, zoom: 0, zoomOn: false, fly: null, spin: 0 };

export function openOverworld(save, fresh = []) {
  ow.save = save;
  ow.walk = null;
  ow.fresh = fresh.map(e => ({ ...e, t: 0 }));
  ow.zoom = 0;
  ow.zoomOn = false;
  centre(true);
  flyIfNew();
}
// the first time you set foot in a world, the camera takes you on a tour of it: from high above its
// castle, sweeping back across the island to where you stand, with the world's name over it
function flyIfNew() {
  const s = ow.save, R = REGIONS[here().region - 1], seen = seenRegions(s);
  if (seen.includes(R.id)) return;
  seen.push(R.id);
  writeSave(s);
  const castle = Object.values(NODES).find(n => n.region === R.id && n.kind === 'castle');
  ow.fly = { R, t: 0, from: { x: castle.x, y: castle.y }, mid: { x: slotX(R) + SLOT_W / 2, y: slotY(R) + SLOT_H / 2 } };
}
const here = () => NODES[ow.save.at];

function centre(snap) {
  const n = ow.walk ? walkPos() : here();
  const tx = n.x - W / 2, ty = Math.max(0, Math.min(MAP_H - H + HUD_H, n.y - H / 2)); // the sea below the map sits under the HUD
  const k = snap ? 1 : 0.12;
  ow.cam.x += (tx - ow.cam.x) * k;
  ow.cam.y += (ty - ow.cam.y) * k;
}
function walkPos() {
  return alongRoad(ow.walk.path, ow.walk.d);
}
const ease = k => k * k * (3 - 2 * k);
// what the camera looks at: the centre of the view in map pixels, the zoom, and where on the screen
// that centre sits (the zoomed-out view centres the whole map above the HUD)
function view() {
  let cx = ow.cam.x + W / 2, cy = ow.cam.y + H / 2, z = 1, sy = H / 2;
  if (ow.fly) {
    const f = ow.fly, k = Math.min(1, f.t / FLY);
    // high over the castle, then sweep across the island and drop down onto the hero
    const a = k < 0.35 ? ease(k / 0.35) : 1, b = k < 0.35 ? 0 : ease((k - 0.35) / 0.65);
    const sx = f.from.x + (f.mid.x - f.from.x) * a, syy = f.from.y + (f.mid.y - f.from.y) * a;
    cx = sx + (cx - sx) * b; cy = syy + (cy - syy) * b;
    z = 0.42 + 0.58 * b;
  }
  const zk = ease(Math.min(1, ow.zoom * 1.6));
  if (zk > 0) z += (0.3 - z) * zk; // pull up off the ground... then the globe takes over (drawGlobe)
  return { cx, cy, z, sy, x0: cx - W / 2 / z, x1: cx + W / 2 / z, y0: cy - sy / z, y1: cy + (H - sy) / z };
}

// returns the node to play when the player enters a level, otherwise null
export function updateOverworld(dt) {
  const s = ow.save;
  ow.t += dt;
  paintAhead();
  updateLife(dt);
  for (const e of ow.fresh) e.t += dt;
  ow.fresh = ow.fresh.filter(e => e.t < DRAW);
  centre(false);
  ow.zoom = Math.max(0, Math.min(1, ow.zoom + (ow.zoomOn ? dt : -dt) * 2.2));
  if (powers.open) return updatePowers(dt), null;
  if (ow.fly) {
    ow.fly.t += dt;
    // any button skips the tour
    if (ow.fly.t > 0.4 && (input.take('confirm') | input.take('jump') | input.take('dash'))) ow.fly.t = FLY;
    if (ow.fly.t >= FLY) ow.fly = null;
    return null;
  }
  // the world view: pull right back to see the whole archipelago (SHIFT again, or any button, to come back)
  if (input.take('dash')) {
    ow.zoomOn = !ow.zoomOn;
    if (ow.zoomOn) ow.spin = lonOf(here().x); // the globe turns up with you facing us
    return sfx.ui(ow.zoomOn), null;
  }
  if (ow.zoomOn) {
    // the globe drifts round on its own; the arrows turn it
    ow.spin += dt * (0.12 + ((input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0)) * 1.6);
    if (input.take('confirm') | input.take('jump') | input.take('pause')) ow.zoomOn = false, sfx.ui(false);
    return null;
  }
  if (ow.fresh.length) return null; // let the new roads finish drawing
  if (ow.walk) {
    ow.walk.d += WALK * dt;
    if (ow.walk.d >= ow.walk.len) {
      s.at = ow.walk.to;
      ow.walk = null;
      const fresh = visit(s, s.at);
      if (fresh.length) ow.fresh = fresh.map(e => ({ ...e, t: 0 }));
      writeSave(s);
      flyIfNew();
    }
    return null;
  }
  if (input.take('inv')) return openPowers(), null;
  if (input.take('temper')) return cycleTemper(), null;
  const dx = (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0), dy = (input.held('down') ? 1 : 0) - (input.held('up') ? 1 : 0);
  if (dx || dy) {
    const to = step(s, s.at, dx, dy);
    if (to) {
      const a = here(), b = NODES[to], path = roadPath(a, b);
      ow.walk = { from: s.at, to, d: 0, len: path.len, path };
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
      flyIfNew();
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
function drawRegion(R, v) {
  // the island from above (owart.js), shaded over until you reach it
  const ox = slotX(R), oy = slotY(R);
  if (ox > v.x1 || ox + SLOT_W < v.x0 || oy > v.y1 || oy + SLOT_H < v.y0) return;
  if (v.z < 0.9 && !painted(R)) return; // (zoomed out, wait for paintAhead rather than stall)
  const art = regionArt(R);
  if (art) X.drawImage(art, ox, oy);
  if (!regionOpen(R)) dither(ox + 8, oy + 8, SLOT_W - 16, SLOT_H - 16, C.ink, 10);
  if (v.z < 0.6) return; // (the world view names the islands itself)
  const label = R.id + '  ' + R.name;
  rect(ox + 10, oy + 10, textWidth(label) + 10, 13, C.ink);
  text(label, ox + 15, oy + 13, regionOpen(R) ? C.gold : C.fog);
}
// a dirt road seen from above along its winding path: inked edges, packed earth, a worn lighter
// middle (a secret road is paved in pink), drawn in as far as `frac`. Where it crosses open sea it
// becomes a plank bridge on posts.
function road(a, b, frac, col, v) {
  const P = roadPath(a, b), end = Math.floor((P.length - 1) * frac), pink = col === C.pink;
  if (Math.max(a.x, b.x) + 60 < v.x0 || Math.min(a.x, b.x) - 60 > v.x1 || Math.max(a.y, b.y) + 60 < v.y0 || Math.min(a.y, b.y) - 60 > v.y1) return;
  if (P.sea === undefined) P.sea = P.map(p => landAt(p.x, p.y) === 0);
  if (v.z < 0.5) {
    // the world view: a thin line is enough
    X.strokeStyle = pink ? C.pink : C.cream;
    X.lineWidth = 2 / v.z;
    X.beginPath();
    X.moveTo(P[0].x, P[0].y);
    for (let i = 1; i <= end; i++) X.lineTo(P[i].x, P[i].y);
    X.stroke();
    return;
  }
  for (const [r, c, cb] of [[4, C.ink, C.ink], [3, pink ? C.wine : C.woodD, C.woodD], [2, pink ? C.pink : C.sand, C.wood]])
    for (let i = 0; i <= end; i++) {
      const p = P[i];
      if (P.sea[i]) {
        if (r === 3) continue;
        rect(Math.round(p.x) - r, Math.round(p.y) - r + 1, r * 2, r * 2 - 1, cb); // the bridge deck
        if (r === 2 && i % 3 === 0) rect(Math.round(p.x) - r, Math.round(p.y) - r + 1, r * 2, 1, C.woodD); // a plank seam
        if (r === 4 && i % 8 === 0) rect(Math.round(p.x) - 1, Math.round(p.y) + 4, 2, 3, C.woodD); // a post
      } else rect(Math.round(p.x) - r, Math.round(p.y) - r + 1, r * 2, r * 2 - 1, c);
    }
  for (let i = 0; i <= end; i += 3) if (!P.sea[i]) rect(Math.round(P[i].x), Math.round(P[i].y), 1, 1, pink ? C.paper : C.cream);
}
function drawNode(n, t, z = 1) {
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
  if (open && isLevel(n) && z > 0.6) text(n.id.replace('-F', ' FORT').replace('-C', ' CASTLE').replace('-S', ' SECRET'), x, y + 9, done ? C.cream : C.mist, { align: 'center' });
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
  const s = ow.save, v = view(), z = v.z;
  X.setTransform(1, 0, 0, 1, 0, 0);
  rect(0, 0, W, H, C.navy);
  if (z === 1) X.setTransform(1, 0, 0, 1, -Math.round(v.x0), -Math.round(v.y0));
  else X.setTransform(z, 0, 0, z, W / 2 - v.cx * z, v.sy - v.cy * z);
  // Hoplon is round: the map repeats east and west, so draw each copy that is on screen
  const p = ow.walk ? walkPos() : here();
  for (const off of [-MAP_W, 0, MAP_W]) {
    if (v.x1 < off || v.x0 > off + MAP_W) continue;
    X.translate(off, 0);
    drawSurface({ ...v, x0: v.x0 - off, x1: v.x1 - off, cx: v.cx - off }, t, z, off === 0 ? p : null);
    X.translate(-off, 0);
  }
  screenLayer();
  if (ow.zoom > 0) drawGlobe(Math.max(0, Math.min(1, (ow.zoom - 0.35) / 0.45)), ow.spin, p, t, regionOpen);
  if (ow.fly) drawFlyBanner();
  drawOverworldHud(t);
  powers.sheetWeapon = s.hero?.weapon || null; // the STATS tab reads the weapon you carry
  powers.save = s; // the COLLECTION tab counts this file's levels, exits and relics
  drawPowers(t);
}
// one copy of the planet's surface: the sea, the continents, life, roads, nodes, the hero
function drawSurface(v, t, z, p) {
  const s = ow.save;
  // the sea: deep out in the channels, its swell rolling (only the part on screen)
  const wx0 = Math.max(0, Math.floor(v.x0 / 28) * 28 - 28), wy0 = Math.max(0, Math.floor(v.y0 / 14) * 14 - 14), stepY = z < 0.5 ? 28 : 14;
  for (let y = wy0; y < Math.min(MAP_H + 80, v.y1 + 14); y += stepY)
    for (let x = wx0 + ((y / 14) % 2 ? 7 : 0); x < Math.min(MAP_W, v.x1 + 28); x += 28) rect(x + Math.round(Math.sin(t + y) * 2), y, 6, 1, C.blue);
  for (const R of REGIONS) drawRegion(R, v);
  drawLifeGround(v, t);
  const fresh = new Map(ow.fresh.map(e => [e.from + '>' + e.to, e.t / DRAW]));
  for (const e of edges(s)) road(NODES[e.from], NODES[e.to], fresh.get(e.from + '>' + e.to) ?? 1, e.secret ? C.pink : C.cream, v);
  for (const n of Object.values(NODES)) if (n.x > v.x0 - 30 && n.x < v.x1 + 30 && n.y > v.y0 - 30 && n.y < v.y1 + 30) drawNode(n, t, z);
  if (p) {
    // the hero
    const Hh = A.hero;
    rect(Math.round(p.x) - 5, Math.round(p.y) + 1, 11, 2, 'rgba(26,20,40,0.4)'); // the hero's shadow
    if (Hh) {
      const f = ow.walk ? ['run1', 'run2', 'run3'][Math.floor(t * 10) % 3] : Math.floor(t * 2) % 2 ? 'idle' : 'idle2';
      drawHeroPlain(f, Math.round(p.x - Hh.w / 2), Math.round(p.y - Hh.h + (ow.walk ? 4 : -2)), ow.face < 0 ? -1 : 1);
    } else rect(p.x - 4, p.y - 14, 8, 12, C.gold);
  }
  drawLifeSky(v, t, z);
}
// a world's name over its fly-over, fading in and out
function drawFlyBanner() {
  const f = ow.fly, k = f.t / FLY, a = Math.min(1, k * 5, (1 - k) * 4), R = f.R;
  if (a <= 0) return;
  X.globalAlpha = a;
  rect(0, 70, W, 46, 'rgba(26,20,40,0.6)');
  text('WORLD ' + R.id, W / 2, 78, C.gold, { align: 'center' });
  text(R.name, W / 2, 92, C.paper, { align: 'center', k: 2 });
  X.globalAlpha = 1;
  text('JUMP: SKIP', W - 8, 4, C.fog, { align: 'right' });
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
  if (ow.temperMsg > 0) text('BEAT THE DRAGON TO OPEN TEMPER', W - 12, y + 36, C.coral, { align: 'right' });
  else if (T.max) text(`T: TEMPER ${T.on}/${T.max}` + (T.on ? '  ' + rewardText(T.on) : '  OFF'), W - 12, y + 36, tCol, { align: 'right' });
  const hint = ow.walk ? '' : n.kind === 'warp' ? 'ARROWS: WALK  JUMP: FIRE THE CANNON  SHIFT: WORLD' : isLevel(n) ? 'ARROWS: WALK  JUMP: PLAY  SHIFT: WORLD VIEW' : 'ARROWS: WALK    SHIFT: WORLD VIEW';
  if (hint) text(hint, 12, y + 26, C.mist);
  // the POWERS window: blinks when there is a mastery perk to pick or a rank you can afford
  text('B: BAG', W - 70, y + 26, C.gold, { align: 'right' });
  text('ESC: SAVE FILES', W - 112, y + 26, C.fog, { align: 'right' });
  text('E: POWERS', W - 12, y + 26, powersWaiting() && Math.floor(t * 3) % 2 ? C.lime : C.gold, { align: 'right' });
}
