// The Beast Den scene (H on the map): a cozy storybook garden where your beastkin hatchlings live.
// Walk about (LEFT / RIGHT), and press Z (attack) at whatever you stand by:
//   a pet       pat it (it gets happier and learns faster); C opens its card, where you feed it
//               weapons from the basket (LEFT / RIGHT pick one, Z feeds) and rebirth it once crowned
//   the nest    tap an egg; the third tap hatches it
//   the market  the raccoon's stall: treats, eggs, the squeaky mace and decorations (data/den.js)
//   the cup     the Den Cup's gate: pick an event and a cup, and watch your pet compete
// ESC or H goes back to the map. The rules live in data/den.js; this file only walks, draws and asks.
import { W, H, C } from '../config.js';
import { input } from '../engine/input.js';
import { A } from '../engine/assets.js';
import { X, rect, px, text, fitText, panel, frame, tinted, screenLayer } from '../engine/gfx.js';
import { sfx, music, denSfx } from '../engine/audio.js';
import { ZONES } from '../data/zones.js';
import { ENEMIES } from '../data/enemies.js';
import { ELEMENTS } from '../data/weapons.js';
import { lookOf, frameOfLook, rarityColour } from './looks.js';
import { drawHeroAnimated } from './anim.js';
import { createHero } from './hero.js';
import { meta, hasTrophy, spendShards } from '../data/meta.js';
import {
  den, saveDen, welcome, tapEgg, feed, pat, rebirth, canRebirth, total, favourite, auraOf, petSprite, FAMILY, STATS, STAT_INFO, FOOD, EVOLVE_AT, CROWN_AT, XP_PER_LEVEL,
  MAX_PETS, MAX_EGGS, EVENTS, rating as ratingOf, EVENT_LIST, CUPS, cupOpen, runCup, claimCup, marketRows, buy, TOY, feedXp
} from '../data/den.js';

export const DEN_W = 960; // two screens of garden
const GY = 214; // the ground line
const THEME = 'witch-cottage'; // the storybook cottage's art dresses the den
const NEST_X = 64, BASKET_X = 168, MARKET_X = 800, CUP_X = 906;
const ROAM = [232, 744];
const DECOR_X = i => 262 + i * 50;

export const D = { open: false, t: 0, hero: null, cam: 0, pets: new Map(), menu: null, banner: null, parts: [], pops: [], mace: null, near: null, egg: null };

// ---------------------------------------------------------------- opening and closing
export function openDen(weapon) {
  D.open = true;
  D.t = 0;
  D.menu = null;
  D.banner = null;
  D.parts = [];
  D.pops = [];
  const h = (D.hero = createHero());
  if (weapon) h.weapon = weapon;
  h.inv = 0; // a fresh hero spawns with a second of hit safety (a blink) that nothing in the den ever ticks down
  h.x = NEST_X + 60;
  h.y = GY - h.h;
  D.cam = 0;
  D.pets = new Map();
  for (const p of den().pets) agent(p, ROAM[0] + Math.random() * (ROAM[1] - ROAM[0]));
  D.mace = den().owned[TOY.id] ? { x: 480, y: GY - 6, vx: 0, vy: 0, spin: 0 } : null;
  if (welcome()) say('WELCOME TO THE BEAST DEN!', 'A GOOSE EGG IS WAITING IN THE NEST. TAP IT WITH Z');
  else say('THE BEAST DEN', `${den().pets.length} PET${den().pets.length === 1 ? '' : 'S'}  ${den().eggs.length} EGG${den().eggs.length === 1 ? '' : 'S'}  ${den().basket.length} IN THE BASKET`, 2.5);
  music.play('den', ZONES[7].music);
}
export function closeDen() {
  D.open = false;
  D.menu = null;
}
function agent(p, x) {
  const a = { id: p.id, x, vx: 0, tx: x, state: 'idle', st: 1 + Math.random() * 2, anim: Math.random() * 3, hop: 0, emote: null, emT: 0, flash: 0, evoT: 0, old: null };
  D.pets.set(p.id, a);
  return a;
}
// Z (attack) and ENTER (confirm) share a key: take both, so one press never counts twice
const ok = () => !!(input.take('attack') | input.take('confirm'));
const back = () => !!(input.take('pause') | input.take('den'));
// a hop: dur seconds, h pixels high
const jump = (a, dur = 0.35, h = 5) => ((a.hop = dur), (a.hopDur = dur), (a.hopH = h));
const say = (head, sub = '', t = 3.2) => (D.banner = { head, sub, t });
// a word floating up; a new one from the same pet replaces its last ones
const pop = (x, y, s, col, who = null) => (who != null && (D.pops = D.pops.filter(q => q.who !== who)), D.pops.push({ x, y, s, col, t: 1.4, who }));
const burst = (x, y, col, n = 10) => {
  for (let k = 0; k < n; k++) D.parts.push({ x, y, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 90, t: 0.6 + Math.random() * 0.5, col });
};
const art = name => A.enemies[name];
const fi = (a, n) => Math.max(0, a.frames.indexOf(n));
const petData = id => den().pets.find(p => p.id === id);
const petName = p => ENEMIES[petSprite(p)]?.name?.toUpperCase() || FAMILY[p.zone].name;
const biome = () => A.biome?.[THEME];

// ---------------------------------------------------------------- update
// returns 'leave' when the hero heads back to the map
export function updateDen(dt) {
  D.t += dt;
  if (D.banner && (D.banner.t -= dt) <= 0) D.banner = null;
  for (const q of D.parts) (q.t -= dt), (q.x += q.vx * dt), (q.y += q.vy * dt), q.z || q.z2 || (q.vy += 260 * dt);
  D.parts = D.parts.filter(q => q.t > 0);
  for (const q of D.pops) (q.t -= dt), (q.y -= 18 * dt);
  D.pops = D.pops.filter(q => q.t > 0);
  updatePets(dt);
  updateMace(dt);
  if (D.menu) return updateMenu(dt);
  if (back()) return 'leave';
  // walking
  const h = D.hero, dir = (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0);
  h.vx = dir * 96;
  if (dir) h.face = dir;
  h.x = Math.max(8, Math.min(DEN_W - 20, h.x + h.vx * dt));
  h.animT += dt;
  D.cam = Math.max(0, Math.min(DEN_W - W, Math.round(h.x - W / 2)));
  // what's in reach
  const hx = h.x + h.w / 2;
  let near = null, best = 26;
  for (const [id, a] of D.pets) if (a.state !== 'evolve' && Math.abs(a.x - hx) < best) (best = Math.abs(a.x - hx)), (near = { kind: 'pet', id });
  if (!near) {
    if (Math.abs(hx - NEST_X) < 40) near = { kind: 'nest' };
    else if (Math.abs(hx - BASKET_X) < 30) near = { kind: 'basket' };
    else if (Math.abs(hx - MARKET_X) < 40) near = { kind: 'market' };
    else if (Math.abs(hx - CUP_X) < 36) near = { kind: 'cup' };
  }
  D.near = near;
  if (!near) return null;
  if (ok()) act(near, false);
  else if (input.take('special')) act(near, true);
  return null;
}
function act(near, alt) {
  const d = den();
  if (near.kind === 'pet') {
    const a = D.pets.get(near.id), p = petData(near.id);
    if (alt) return openCard(near.id);
    pat(near.id);
    a.state = 'idle';
    a.st = 2;
    a.vx = 0;
    a.face = D.hero.x < a.x ? -1 : 1;
    // three pats in a row is the big, happiest reaction
    a.pats = (a.pats || []).filter(q => D.t - q < 2.5).concat(D.t);
    const big = a.pats.length >= 3;
    if (big) a.pats = [];
    petReact(p, a, big);
  } else if (near.kind === 'nest') {
    if (!d.eggs.length) return say('THE NEST IS EMPTY', 'EGGS COME FROM CASTLE HEADS, LUCKY LEVELS AND THE MARKET');
    const r = tapEgg(0);
    D.egg = { t: 0.4 };
    if (r?.full) return say('THE DEN IS FULL', `${MAX_PETS} PETS IS ALL THE GARDEN HOLDS. REBIRTH A CROWNED PET TO MAKE ROOM`);
    if (r?.taps) return sfx.ui(false), burst(NEST_X, GY - 14, C.cream, 3);
    if (r?.pet) {
      sfx.hatch();
      const a = agent(r.pet, NEST_X + 20);
      jump(a, 0.5, 8);
      a.emote = 'heart';
      a.emT = 2;
      burst(NEST_X, GY - 12, FAMILY[r.pet.zone].col, 16);
      say(`A ${petName(r.pet)} HATCHED!`, `SAY HELLO TO ${r.pet.name}. PRESS C BY A PET TO SEE ITS CARD`);
    }
  } else if (near.kind === 'basket') {
    const n = d.basket.length;
    say(`THE FEED BASKET: ${n} WEAPON${n === 1 ? '' : 'S'}`, n ? 'STAND BY A PET AND PRESS C TO FEED IT' : 'WEAPONS YOU MELT IN A RUN LAND HERE');
  } else if (near.kind === 'market') {
    D.menu = { kind: 'market', sel: 0, top: 0, pet: 0, msg: 'Z: BUY   LEFT/RIGHT: PICK A PET   ESC: CLOSE' };
    sfx.ui(true);
  } else if (near.kind === 'cup') {
    if (!d.pets.length) return say('NO ONE TO ENTER YET', 'HATCH AN EGG FIRST');
    D.menu = { kind: 'cup', ev: 0, tier: 0, pet: 0 };
    sfx.ui(true);
  }
}
function openCard(id) {
  D.menu = { kind: 'card', id, sel: 0, msg: '' };
  sfx.ui(true);
}

// pets wander, nap, chase the mace and come running to be fed
function updatePets(dt) {
  const d = den();
  for (const [id, a] of D.pets) {
    const p = petData(id);
    if (!p) {
      D.pets.delete(id);
      continue;
    }
    a.anim += dt;
    a.flash = Math.max(0, a.flash - dt);
    if (a.lvUp && (a.lvUp.t -= dt) <= 0) a.lvUp = null;
    if (a.act) {
      updateReact(a, p, dt);
      if ((a.act.t -= dt) <= 0) (a.act = null), (a.rot = 0), (a.sx = 1), (a.alpha = 1);
      continue;
    }
    a.hop = Math.max(0, a.hop - dt);
    if ((a.emT -= dt) <= 0) a.emote = null;
    if (a.state === 'evolve') {
      if ((a.evoT -= dt) <= 0) (a.state = 'idle'), (a.st = 2), (a.old = null), burst(a.x, GY - 20, C.gold, 20);
      continue;
    }
    if (D.menu?.kind === 'card' && D.menu.id === id) {
      if (D.menu.flash && (D.menu.flash.t -= dt) <= 0) D.menu.flash = null;
      a.vx = 0;
      a.face = D.hero.x < a.x ? -1 : 1;
      continue;
    }
    a.st -= dt;
    if (a.state === 'walk') {
      a.vx = Math.sign(a.tx - a.x) * (22 + p.lv.speed * 0.6);
      a.face = Math.sign(a.vx) || a.face;
      a.x += a.vx * dt;
      if (Math.abs(a.tx - a.x) < 3 || a.st <= 0) (a.state = 'idle'), (a.st = 1 + Math.random() * 3), (a.vx = 0);
    } else if (a.state === 'nap') {
      if (Math.random() < dt * 0.8) D.parts.push({ x: a.x + 6, y: GY - 22, vx: 6, vy: -14, t: 1.2, col: C.mist, z: true });
      if (a.st <= 0) (a.state = 'idle'), (a.st = 1);
    } else if (a.st <= 0) {
      const r = Math.random();
      if (D.mace && r < 0.25) (a.state = 'walk'), (a.tx = D.mace.x), (a.st = 4);
      else if (r < 0.4 && p.joy > 30) (a.state = 'nap'), (a.st = 4 + Math.random() * 4);
      else (a.state = 'walk'), (a.tx = ROAM[0] + Math.random() * (ROAM[1] - ROAM[0])), (a.st = 6);
      if (p.joy >= 80 && Math.random() < 0.3) (a.emote = 'note'), (a.emT = 1.5);
    }
    // kick the squeaky mace
    if (D.mace && Math.abs(D.mace.x - a.x) < 8 && D.mace.y >= GY - 7 && a.state === 'walk') {
      D.mace.vx = (a.face || 1) * (60 + Math.random() * 60);
      D.mace.vy = -90 - Math.random() * 60;
      a.state = 'idle';
      a.st = 1;
      a.emote = 'note';
      a.emT = 1;
      if (Math.random() < 0.3) p.joy = Math.min(100, p.joy + 1);
    }
  }
}
function updateMace(dt) {
  const m = D.mace;
  if (!m) return;
  m.vy += 400 * dt;
  m.x += m.vx * dt;
  m.y += m.vy * dt;
  m.spin += m.vx * dt * 0.2;
  if (m.y > GY - 6) (m.y = GY - 6), (m.vy *= -0.4), (m.vx *= 0.8), Math.abs(m.vy) < 20 && (m.vy = 0);
  if (m.x < ROAM[0] || m.x > ROAM[1]) (m.vx = -m.vx * 0.6), (m.x = Math.max(ROAM[0], Math.min(ROAM[1], m.x)));
}

// ---------------------------------------------------------------- menus
function updateMenu(dt) {
  const M = D.menu;
  if (M.kind === 'show') return updateShow(dt);
  const esc = back();
  if (M.kind === 'card') {
    const d = den(), p = petData(M.id);
    if (esc || input.take('special') || !p) return (D.menu = null), null;
    const n = d.basket.length;
    if (input.take('left')) M.sel = Math.max(0, M.sel - 1);
    if (input.take('right')) M.sel = Math.min(Math.max(0, n - 1), M.sel + 1);
    M.sel = Math.min(M.sel, Math.max(0, n - 1));
    if (input.take('up') && canRebirth(p)) {
      if (den().eggs.length >= MAX_EGGS) M.msg = 'THE NEST IS FULL';
      else {
        const a = D.pets.get(p.id);
        rebirth(p.id);
        burst(a.x, GY - 16, C.gold, 24);
        sfx.hatch();
        D.menu = null;
        say(`${p.name} CURLED UP INTO A SPARKLY EGG`, 'IT KEEPS A QUARTER OF EVERY STAT. TAP IT IN THE NEST');
      }
      return null;
    }
    if (ok() && n) {
      const w = d.basket[M.sel], a = D.pets.get(p.id), was = petSprite(p), r = feed(p.id, M.sel);
      if (!r) return null;
      denSfx.feed(w.type, ELEMENTS[w.family]?.effect);
      jump(a);
      burst(a.x, GY - 14, w.family ? C[ELEMENTS[w.family]?.col] || C.paper : rarityColour(w.q), 6);
      M.msg = `NOM! +${r.xp} ${STAT_INFO[r.stat].name}${r.ups ? `  ${STAT_INFO[r.stat].name} LV ${p.lv[r.stat]}!` : ''}`;
      if (r.ups) levelUp(p, a, r.stat), (M.flash = { stat: r.stat, t: 1.4 });
      if (r.evolved) (D.menu = null), evolve(p, a, was);
      if (r.crowned) (D.menu = null), denSfx.crown(), say(`${p.name} EARNED A CROWN!`, 'A CROWNED PET CAN BE REBORN AS A SPARKLY EGG (UP ON ITS CARD)');
    }
    return null;
  }
  if (M.kind === 'market') {
    const rows = marketRows(hasTrophy), d = den();
    if (esc) return (D.menu = null), null;
    if (input.take('up')) M.sel = (M.sel + rows.length - 1) % rows.length;
    if (input.take('down')) M.sel = (M.sel + 1) % rows.length;
    if (d.pets.length) {
      if (input.take('left')) M.pet = (M.pet + d.pets.length - 1) % d.pets.length;
      if (input.take('right')) M.pet = (M.pet + 1) % d.pets.length;
    }
    M.top = Math.max(0, Math.min(M.sel - 2, rows.length - 9, M.top > M.sel ? M.sel : M.top + Math.max(0, M.sel - M.top - 8)));
    if (ok()) {
      const row = rows[M.sel], p = d.pets[M.pet], was = p && petSprite(p);
      const r = buy(row, p?.id, spendShards);
      if (r.err) return (M.msg = r.err), sfx.ui(false), null;
      sfx.card(1);
      if (r.ups && p) levelUp(p, D.pets.get(p.id), row.stat);
      M.msg = `BOUGHT ${row.name}${row.pet ? ' FOR ' + p.name : ''}`;
      if (row.id === TOY.id) D.mace = { x: 480, y: GY - 40, vx: 30, vy: 0, spin: 0 };
      if (r.evolved) (D.menu = null), evolve(p, D.pets.get(p.id), was);
    }
    return null;
  }
  if (M.kind === 'cup') {
    const d = den();
    if (esc) return (D.menu = null), null;
    if (input.take('up')) M.ev = (M.ev + EVENT_LIST.length - 1) % EVENT_LIST.length;
    if (input.take('down')) M.ev = (M.ev + 1) % EVENT_LIST.length;
    if (input.take('left')) M.tier = Math.max(0, M.tier - 1);
    if (input.take('right')) M.tier = Math.min(CUPS.length - 1, M.tier + 1);
    if (input.take('special') || input.take('jump')) M.pet = (M.pet + 1) % d.pets.length;
    M.pet %= d.pets.length;
    if (ok()) {
      const ev = EVENT_LIST[M.ev];
      if (!cupOpen(ev, M.tier)) return (M.msg = `WIN THE ${CUPS[M.tier - 1].name} FIRST`), sfx.ui(false), null;
      const p = d.pets[M.pet];
      D.menu = { kind: 'show', res: runCup(ev, M.tier, p, Math.floor(Math.random() * 1e9)), petId: p.id, t: 0, done: false, back: M };
      music.play('cup', ZONES[0].music);
      sfx.ui(true);
    }
    return null;
  }
  return null;
}
function evolve(p, a, was) {
  a.state = 'evolve';
  a.evoT = 2.4;
  a.old = was;
  denSfx.grow();
  say(`${p.name} GREW UP!`, `IT ATE THE MOST ${STAT_INFO[p.form].name} AND BECAME A ${petName(p)}`, 4);
}
// how long each event's show runs before the results
const showLen = res => (res.ev === 'race' ? Math.max(...res.field.map(f => f.time)) + 1 : res.ev === 'spar' ? 3 * 5 * 0.55 + 3 * 0.8 + 0.6 : 10 * 0.5 + 1.2);
function updateShow(dt) {
  const M = D.menu;
  M.t += dt;
  const len = showLen(M.res);
  if (!M.done && (M.t >= len || input.take('pause'))) M.t = Math.max(M.t, len);
  if (!M.done && M.t >= len) {
    M.done = true;
    M.claim = claimCup(M.res, M.petId);
    M.res.place === 1 ? sfx.clear() : sfx.card(0);
  }
  if (M.done && M.t > len + 0.4 && (ok() || input.take('pause'))) {
    D.menu = { ...M.back, msg: '' };
    music.play('den', ZONES[7].music);
  }
  if (!M.done && ok()) M.t = len; // skip ahead
  return null;
}

// ---------------------------------------------------------------- drawing
// the sky and hills: the cottage's parallax layers
function drawBackdrop() {
  const b = biome();
  if (b?.layers?.length) {
    b.layers.forEach((im, i) => {
      if (!im) return;
      const k = [0.1, 0.25, 0.45, 0.7][i] ?? 0.5, ox = Math.round((D.cam * k) % im.width);
      X.drawImage(im, -ox, GY - im.height + 40 + i * 2);
      X.drawImage(im, im.width - ox, GY - im.height + 40 + i * 2);
      if (b.under?.[i]) rect(0, GY + 40 + i * 2, W, H, b.under[i]);
    });
  } else rect(0, 0, W, H, C.night);
}
export function drawDen(t) {
  screenLayer();
  const b = biome();
  drawBackdrop();
  X.save();
  X.translate(-D.cam, 0);
  drawGround(b);
  drawStations(t);
  drawDecor(t);
  if (D.mace) drawMace(D.mace);
  const order = [...D.pets.values()].sort((a, b2) => a.x - b2.x);
  for (const a of order) drawPet(a, t);
  const h = D.hero;
  drawHeroAnimated(h, D.t);
  for (const q of D.parts) q.z ? text('Z', q.x, q.y, q.col) : rect(Math.round(q.x), Math.round(q.y), 2, 2, q.col);
  for (const q of D.pops) text(q.s, Math.round(q.x), Math.round(q.y), q.col, { align: 'center' });
  if (!D.menu && D.near) drawPrompt(D.near, t);
  X.restore();
  drawHudBar();
  if (D.banner) drawBanner(D.banner);
  if (D.menu?.kind === 'card') drawCard(D.menu, t);
  if (D.menu?.kind === 'market') drawMarket(D.menu, t);
  if (D.menu?.kind === 'cup') drawCupMenu(D.menu, t);
  if (D.menu?.kind === 'show') drawShow(D.menu, t);
}
function spr(b, name, f, x, y) {
  const s = b?.sprites?.[name];
  if (!s || !b.atlas) return null;
  const [sx, sy, w, h, n] = s;
  X.drawImage(b.atlas, sx + (f % n) * w, sy, w, h, Math.round(x - w / 2), Math.round(y - h + 1), w, h);
  return s;
}
function drawGround(b) {
  const g = b?.sprites?.ground, lip = b?.sprites?.lip;
  if (g && b.atlas) {
    for (let x = 0; x < DEN_W; x += g[2]) for (let y = GY; y < H; y += g[3]) X.drawImage(b.atlas, g[0], g[1], g[2], g[3], x, y, g[2], g[3]);
    if (lip) for (let x = 0; x < DEN_W; x += lip[2]) X.drawImage(b.atlas, lip[0], lip[1], lip[2], lip[3], x, GY - 3, lip[2], lip[3]);
  } else {
    rect(0, GY, DEN_W, H - GY, C.wood);
    rect(0, GY, DEN_W, 3, C.grass);
  }
  // flowers and mushrooms along the garden (always there)
  for (let i = 0; i < 9; i++) spr(b, i % 3 ? 'flowers' : 'mush', i, 250 + i * 57 + (i % 2) * 12, GY);
}
function drawStations(t) {
  const d = den(), b = biome();
  // the nest: a straw bowl with the eggs in it
  const nx = NEST_X;
  rect(nx - 30, GY - 6, 60, 6, C.woodD);
  rect(nx - 28, GY - 8, 56, 3, C.sand);
  for (let k = 0; k < 9; k++) rect(nx - 27 + k * 6, GY - 9 - (k % 2), 4, 1, C.cream);
  d.eggs.forEach((e, i) => drawEgg(e, nx - 20 + (i % 3) * 18 + (i >= 3 ? 9 : 0), GY - 6 - (i >= 3 ? 9 : 0), t, i === 0 && D.egg && (D.egg.t -= 1 / 60) > 0));
  sign(nx, GY - 44, 'NEST');
  // the feed basket: a wicker basket with weapon hilts sticking out
  const bx = BASKET_X;
  const shown = d.basket.slice(-4);
  shown.forEach((w, i) => weaponIcon(w, bx - 16 + i * 8, GY - 30, 12, 18, t));
  rect(bx - 18, GY - 16, 36, 16, C.wood);
  for (let y = GY - 15; y < GY; y += 3) rect(bx - 17, y, 34, 1, C.woodD);
  rect(bx - 19, GY - 17, 38, 2, C.sand);
  text(String(d.basket.length), bx, GY - 12, C.cream, { align: 'center' });
  sign(bx, GY - 52, 'FEED BASKET');
  // the market stall: an awning over a counter, the raccoon behind it
  const mx = MARKET_X, bandit = art('bandit');
  if (bandit) frame(bandit.im, fi(bandit, Math.floor(t * 1.8) % 2 ? 'idle1' : 'idle0'), bandit.w, bandit.h, mx - bandit.w / 2, GY - 16 - bandit.h + 4, true);
  rect(mx - 34, GY - 18, 68, 18, C.woodD);
  rect(mx - 32, GY - 16, 64, 14, C.wood);
  rect(mx - 36, GY - 62, 72, 4, C.woodD);
  for (let k = 0; k < 6; k++) rect(mx - 36 + k * 12, GY - 58, 12, 8, k % 2 ? C.paper : C.red);
  rect(mx - 34, GY - 58, 2, 40, C.woodD);
  rect(mx + 32, GY - 58, 2, 40, C.woodD);
  sign(mx, GY - 72, 'DEN MARKET');
  // the cup gate: an arch with pennants
  const cx = CUP_X;
  rect(cx - 26, GY - 56, 4, 56, C.stone);
  rect(cx + 22, GY - 56, 4, 56, C.stone);
  rect(cx - 30, GY - 60, 60, 6, C.slate);
  for (let k = 0; k < 7; k++) {
    const col = [C.red, C.gold, C.sky, C.lime][k % 4], sw = Math.round(Math.sin(t * 3 + k) * 1);
    rect(cx - 24 + k * 8, GY - 54, 5, 4, col);
    rect(cx - 23 + k * 8 + sw, GY - 50, 3, 2, col);
  }
  const won = EVENT_LIST.reduce((s, ev) => s + d.cups[ev], 0);
  for (let k = 0; k < won; k++) rect(cx - 22 + (k % 6) * 8, GY - 66 - Math.floor(k / 6) * 6, 5, 4, C.gold);
  sign(cx, GY - 78, 'DEN CUP');
}
function sign(x, y, s) {
  const w = fitText(s, 200).length * 6 + 8;
  rect(x - w / 2, y - 2, w, 11, C.ink);
  rect(x - w / 2 + 1, y - 1, w - 2, 9, C.woodD);
  text(s, x, y, C.cream, { align: 'center' });
}
function drawEgg(e, x, y, t, wob) {
  const F = FAMILY[e.zone], sh = wob ? Math.round(Math.sin(t * 40) * 2) : e.taps ? Math.round(Math.sin(t * 6) * 1) : 0;
  x += sh;
  const rows = [3, 5, 7, 7, 9, 9, 9, 9, 7, 5];
  rows.forEach((w, i) => rect(x - (w >> 1), y - rows.length + i, w, 1, F.col));
  rect(x - 3, y - 8, 2, 2, F.spot);
  rect(x + 1, y - 4, 2, 2, F.spot);
  rect(x - 2, y - 9, 1, 1, C.paper);
  if (e.taps) for (let k = 0; k < e.taps; k++) px(x - 2 + k * 2, y - 6 + (k % 2), C.ink); // cracks
  if (e.gen) for (let k = 0; k < 3; k++) if (Math.floor(t * 6 + k * 2) % 4 === 0) px(x - 4 + k * 4, y - 11 + (k % 2) * 3, C.gold); // a reborn egg sparkles
}
function drawDecor(t) {
  const d = den();
  for (let z = 0; z < 10; z++) {
    if (!d.owned['decor' + z]) continue;
    const D2 = A.biome?.[ZONES[z].id], name = ['banner', 'snowman', 'lantern', 'lamp', 'torii', 'bell', 'anvil', 'hive', 'chochin', 'chest'][z];
    spr(D2, name, Math.floor(t * 3), DECOR_X(z), GY);
  }
}
function drawMace(m) {
  const x = Math.round(m.x), y = Math.round(m.y);
  const ang = m.spin, hx = Math.round(Math.cos(ang) * 5), hy = Math.round(Math.sin(ang) * 5);
  for (let k = 0; k < 5; k++) px(x - Math.round((hx * k) / 5), y - Math.round((hy * k) / 5), C.wood);
  rect(x + hx - 3, y + hy - 3, 6, 6, C.pink);
  px(x + hx - 4, y + hy, C.pink);
  px(x + hx + 3, y + hy - 1, C.pink);
  px(x + hx, y + hy - 4, C.pink);
  px(x + hx - 1, y + hy - 2, C.paper);
}
// ---------------------------------------------------------------- petting and levelling up
// every family answers a pat its own way, in sound, motion and a word over its head; three pats in
// a row get the big version
const REACT = {
  goose: { word: 'HONK!', col: 'paper', dur: 0.7 }, // flaps: little hops and loose feathers
  fuzz: { word: 'PRRRR', col: 'ice', dur: 0.7 }, // rolls over in a ball
  lagoon: { word: 'RIBBIT', col: 'lime', dur: 0.8 }, // a big frog hop and a stream of bubbles
  bazaar: { word: 'MRRP', col: 'orange', dur: 1.0 }, // rubs back and forth against your legs
  shrine: { word: 'ARF ARF!', col: 'pink', dur: 0.9 }, // wags so hard it spins
  temple: { word: 'OOK OOK!', col: 'sand', dur: 0.8 }, // a backflip
  forge: { word: 'GRUFF', col: 'orange', dur: 1.0 }, // a bear hug: a big squish and a big heart
  cottage: { word: 'BOING!', col: 'violet', dur: 0.9 }, // two bunny hops and a puff of magic
  castle: { word: 'THLIP', col: 'lime', dur: 0.9 }, // flicks its tongue, vanishes, pops up on your other side
  hoard: { word: 'HUFF', col: 'gold', dur: 1.0 } // a smoke ring, and the odd coin from its hoard
};
function petReact(p, a, big) {
  const fam = FAMILY[p.zone].fam, R = REACT[fam], S = art(petSprite(p)), top = GY - (S?.h || 20);
  a.act = { fam, t: R.dur * (big ? 1.5 : 1), dur: R.dur * (big ? 1.5 : 1), big, k: 0 };
  a.emote = 'heart';
  a.emT = big ? 2 : 1.2;
  denSfx.pet(fam, big);
  pop(a.x, top - 8, big ? R.word + ' ' + R.word : R.word, C[R.col], a.id);
  if (big) D.pops.push({ x: a.x, y: top - 18, s: `${p.name} LOVES YOU`, col: C.pink, t: 1.4, who: a.id });
  if (fam === 'goose') jump(a, 0.25, 3);
  if (fam === 'lagoon') jump(a, 0.6, big ? 22 : 14);
  if (fam === 'temple') jump(a, 0.6, big ? 20 : 14);
  if (fam === 'cottage') jump(a, 0.35, big ? 14 : 9);
  if (fam === 'forge') a.x += Math.sign(D.hero.x + D.hero.w / 2 - a.x) * 6;
  if (fam === 'hoard') {
    for (let k = 0; k < 8; k++) D.parts.push({ x: a.x + a.face * 8, y: top + 10, vx: a.face * (20 + k * 6), vy: -10 - k * 3, t: 0.8, col: C.mist, z2: true });
    if (big && Math.random() < 0.35) (den().medals += 1), saveDen(), pop(a.x, top - 28, '+1 MEDAL FROM THE HOARD', C.gold), burst(a.x, top + 8, C.gold, 6);
  }
  if (fam === 'castle') pop(a.x + a.face * 10, top + 6, '~', C.pink);
}
function updateReact(a, p, dt) {
  const A2 = a.act, u = 1 - A2.t / A2.dur, fam = A2.fam, hx = D.hero.x + D.hero.w / 2, top = GY - (art(petSprite(p))?.h || 20);
  A2.k += dt;
  if (fam === 'goose') {
    if (a.hop <= 0 && u < 0.85) jump(a, 0.25, A2.big ? 6 : 3);
    if (Math.random() < dt * 14) D.parts.push({ x: a.x + (Math.random() - 0.5) * 14, y: top + 6, vx: (Math.random() - 0.5) * 40, vy: -30, t: 0.6, col: C.paper });
  } else if (fam === 'fuzz') a.rot = u * Math.PI * 2 * (A2.big ? 2 : 1) * a.face;
  else if (fam === 'lagoon') {
    if (Math.random() < dt * 18) D.parts.push({ x: a.x + (Math.random() - 0.5) * 10, y: top + 4, vx: (Math.random() - 0.5) * 10, vy: -25 - Math.random() * 20, t: 0.9, col: C.sky, z2: true });
  } else if (fam === 'bazaar') {
    a.x += Math.sign(hx - a.x) * Math.min(Math.abs(hx - a.x), 30 * dt);
    a.face = Math.floor(A2.k / 0.18) % 2 ? 1 : -1;
    a.sx = 1 + Math.sin(A2.k * 18) * 0.06;
  } else if (fam === 'shrine') {
    a.face = Math.floor(A2.k / 0.06) % 2 ? 1 : -1;
    if (A2.big) a.rot = Math.sin(A2.k * 30) * 0.2;
    if (a.hop <= 0) jump(a, 0.2, 3);
  } else if (fam === 'temple') a.rot = a.hop > 0 ? -a.face * Math.PI * 2 * (1 - a.hop / a.hopDur) * (A2.big ? 2 : 1) : 0;
  else if (fam === 'forge') {
    a.sx = 1 + Math.sin(u * Math.PI) * (A2.big ? 0.3 : 0.18);
    if (u > 0.3 && u < 0.35) a.emote = 'heart', (a.emT = 1.5);
  } else if (fam === 'cottage') {
    if (a.hop <= 0 && u < 0.6) jump(a, 0.3, A2.big ? 14 : 8);
    if (Math.random() < dt * 20) D.parts.push({ x: a.x + (Math.random() - 0.5) * 18, y: top + Math.random() * 16, vx: 0, vy: -12, t: 0.6, col: Math.random() < 0.5 ? C.violet : C.pink, z2: true });
  } else if (fam === 'castle') {
    a.alpha = u < 0.35 ? 1 - u / 0.35 : u < 0.5 ? 0 : (u - 0.5) * 2;
    if (u >= 0.4 && !A2.moved) (A2.moved = true), (a.x = Math.max(ROAM[0] - 160, Math.min(ROAM[1] + 40, hx + (hx - a.x)))), (a.face = hx < a.x ? -1 : 1), burst(a.x, GY - 8, C.lime, 4);
  } else if (fam === 'hoard') a.sx = 1 + Math.sin(A2.k * 10) * 0.05;
}
// a stat levelled up: a ring of sparks in the stat's colour, a spin and a fanfare in its key
function levelUp(p, a, stat) {
  denSfx.statUp(stat, p.lv[stat]);
  if (!a) return;
  a.lvUp = { stat, t: 1.4 };
  jump(a, 0.6, 12);
  const S = art(petSprite(p));
  pop(a.x, GY - (S?.h || 20) - 14, `${STAT_INFO[stat].name} UP! LV ${p.lv[stat]}`, C[STAT_INFO[stat].col], a.id);
  burst(a.x, GY - 10, C[STAT_INFO[stat].col], 12);
}
function ring(x, y, L, t) {
  const col = C[STAT_INFO[L.stat].col], u = 1 - L.t / 1.4, r = 6 + u * 26;
  for (let k = 0; k < 14; k++) {
    if ((k + Math.floor(t * 20)) % 3 === 0) continue;
    const ang = (k / 14) * Math.PI * 2 + t * 3;
    rect(Math.round(x + Math.cos(ang) * r), Math.round(y + Math.sin(ang) * r * 0.6), 2, 2, col);
  }
  if (u < 0.5) for (let k = 0; k < 4; k++) rect(Math.round(x - 1 + (k - 1.5) * 6), Math.round(y - u * 50 - k * 3), 2, 4, C.paper); // rising streaks
}
function drawPet(a, t) {
  const p = petData(a.id);
  if (!p) return;
  let name = petSprite(p);
  if (a.state === 'evolve' && a.old && Math.floor(a.evoT * (6 + (2.4 - a.evoT) * 6)) % 2) name = a.old;
  const S = art(name);
  if (!S) return;
  let f = fi(S, Math.floor(a.anim * 1.8) % 2 ? 'idle1' : 'idle0');
  if (a.state === 'walk' && Math.abs(a.vx) > 2) f = fi(S, 'walk' + (Math.floor(a.anim * 9) % 4));
  if (a.state === 'nap') f = fi(S, 'idle0');
  const hop = a.hop > 0 ? Math.round(Math.sin((a.hop / (a.hopDur || 0.35)) * Math.PI) * (a.hopH || 5)) : 0;
  const x = Math.round(a.x - S.w / 2), y = GY - S.h + 1 - hop;
  // an elemental aura from what it ate
  const el = auraOf(p);
  if (el && Math.floor(t * 8 + a.id) % 2) {
    const col = C[ELEMENTS[el]?.col] || C.paper;
    for (let k = 0; k < 3; k++) px(x + ((a.anim * 23 + k * 17) % S.w), y + ((a.anim * 31 + k * 11) % S.h), col);
  }
  rect(x + 3, GY - 1, S.w - 6, 2, 'rgba(26,20,40,0.35)');
  const im = a.state === 'evolve' && Math.floor(t * 12) % 2 ? tinted(S.im, C.paper) : S.im;
  if (a.lvUp) ring(a.x, y + S.h / 2, a.lvUp, t);
  // spins, squishes and fades from petting and levelling up turn about the pet's middle
  X.save();
  if (a.alpha != null && a.alpha < 1) X.globalAlpha = Math.max(0, a.alpha);
  X.translate(Math.round(a.x), y + S.h / 2 + (a.state === 'nap' ? 2 : 0));
  if (a.rot) X.rotate(a.rot);
  if (a.sx && a.sx !== 1) X.scale(a.sx, 1 / a.sx);
  frame(im, f, S.w, S.h, -Math.round(S.w / 2), -Math.round(S.h / 2), (a.face || 1) < 0);
  X.restore();
  // a crown for the champions, on top of the head
  if (p.crowned) {
    const cx = Math.round(a.x) - 3, cy = y + topOf(S, f) - 6;
    rect(cx, cy + 2, 7, 3, C.gold);
    px(cx, cy + 1, C.gold);
    px(cx + 3, cy, C.gold);
    px(cx + 6, cy + 1, C.gold);
    px(cx + 3, cy + 3, C.red);
  }
  if (a.emote === 'heart') heart(Math.round(a.x), y - 10 - Math.round((1.2 - a.emT) * 6));
  if (a.emote === 'note') note(Math.round(a.x) + 4, y - 8 - Math.round(Math.sin(t * 6) * 2));
  if (D.near?.kind === 'pet' && D.near.id === a.id && !D.menu && !a.act && !D.pops.some(q => q.who === a.id)) text(p.name, Math.round(a.x), y - 20, C.cream, { align: 'center' });
}
// the first row of a sprite frame with a painted pixel (sprites carry empty headroom)
const tops = new Map();
function topOf(S, f) {
  const key = S.im.src + ':' + f;
  if (tops.has(key)) return tops.get(key);
  let top = 0;
  try {
    const cv = document.createElement('canvas');
    cv.width = S.w;
    cv.height = S.h;
    const g = cv.getContext('2d');
    g.drawImage(S.im, f * S.w, 0, S.w, S.h, 0, 0, S.w, S.h);
    const px4 = g.getImageData(0, 0, S.w, S.h).data;
    top = S.h;
    for (let i = 3; i < px4.length; i += 4) if (px4[i] > 0) { top = Math.floor((i - 3) / 4 / S.w); break; }
  } catch (_) {
    top = 0;
  }
  tops.set(key, top);
  return top;
}
function heart(x, y) {
  rect(x - 3, y, 2, 2, C.pink);
  rect(x + 1, y, 2, 2, C.pink);
  rect(x - 3, y + 1, 6, 2, C.pink);
  rect(x - 2, y + 3, 4, 1, C.pink);
  px(x - 1, y + 4, C.pink);
  px(x, y + 4, C.pink);
}
function note(x, y) {
  rect(x, y, 1, 6, C.cream);
  rect(x + 1, y, 2, 1, C.cream);
  rect(x - 2, y + 5, 3, 2, C.cream);
}
function weaponIcon(w, x, y, bw, bh, t) {
  if (!w.look) return rect(x + bw / 2 - 1, y, 2, bh, rarityColour(w.q));
  const L = lookOf({ ...w, uid: 'den:' + w.name + w.q }, frameOfLook(w.look, t));
  if (!L?.cv) return;
  const k = Math.min(1, bh / L.crop.h, bw / L.crop.w), iw = Math.max(1, Math.round(L.crop.w * k)), ih = Math.max(1, Math.round(L.crop.h * k));
  X.drawImage(L.cv, L.crop.x, L.crop.y, L.crop.w, L.crop.h, Math.round(x + (bw - iw) / 2), Math.round(y + (bh - ih) / 2), iw, ih);
}
function drawPrompt(n, t) {
  const h = D.hero, x = Math.round(h.x + h.w / 2), y = GY - 46 + Math.round(Math.sin(t * 4));
  const s = n.kind === 'pet' ? 'Z: PAT   C: CARD AND FEED' : n.kind === 'nest' ? (den().eggs.length ? 'Z: TAP AN EGG' : 'THE NEST IS EMPTY') : n.kind === 'basket' ? 'Z: LOOK IN' : n.kind === 'market' ? 'Z: SHOP' : 'Z: ENTER THE CUP';
  if (n.kind === 'pet') return;
  text(s, x, y, C.lime, { align: 'center' });
}
function drawHudBar() {
  const d = den();
  rect(0, 0, W, 14, C.ink);
  text(`MEDALS ${d.medals}`, 6, 3, C.gold);
  text(`SHARDS ${meta().shards}`, 92, 3, C.sky);
  text(`PETS ${d.pets.length}/${MAX_PETS}   EGGS ${d.eggs.length}/${MAX_EGGS}   BASKET ${d.basket.length}`, 186, 3, C.mist);
  text('ESC: MAP', W - 6, 3, C.fog, { align: 'right' });
  text('1 BAG  2 MASTERY  3 MAP', 6, H - 12, C.mist); // the clear keys (main.js hotKey)
  if (D.near?.kind === 'pet' && !D.menu) text('Z: PAT   C: CARD AND FEED', W / 2, H - 12, C.lime, { align: 'center' });
}
function drawBanner(b) {
  const a = Math.min(1, b.t * 3);
  if (a <= 0) return;
  rect(0, 22, W, b.sub ? 30 : 18, C.ink);
  text(b.head, W / 2, 26, C.gold, { align: 'center' });
  if (b.sub) text(fitText(b.sub, W - 20), W / 2, 39, C.mist, { align: 'center' });
}
// darken the scene behind a window
function shade(a) {
  X.save();
  X.globalAlpha = a;
  rect(0, 0, W, H, C.ink);
  X.restore();
}
function bar(x, y, w, v, max, col) {
  rect(x, y, w, 4, C.night);
  rect(x, y, Math.round((w * Math.min(v, max)) / max), 4, col);
}
// the pet's card: stats, how close it is to growing up, and the basket to feed it from
function drawCard(M, t) {
  const p = petData(M.id), d = den();
  if (!p) return;
  shade(0.5);
  const x0 = 60, y0 = 26, w = 360, h = 222;
  panel('panel', x0, y0, w, h);
  const S = art(petSprite(p));
  const F = M.flash, bounce = F ? Math.round(Math.abs(Math.sin(F.t * 9)) * 8 * Math.min(1, F.t)) : 0;
  if (F) ring(x0 + 44, y0 + 50, F, t);
  if (S) racer({ sprite: petSprite(p) }, x0 + 44, y0 + 72 - bounce, t, false, false, false, S.w > 36 ? 1 : 2);
  text(p.name + (p.gen ? ' ' + '*'.repeat(Math.min(5, p.gen)) : ''), x0 + 90, y0 + 12, C.gold, { k: 2 });
  text(`${petName(p)}  (${FAMILY[p.zone].name} FAMILY)`, x0 + 90, y0 + 32, C.cream);
  const tot = total(p);
  text(p.form ? (p.crowned ? 'CROWNED CHAMPION' : `GROWN: ${STAT_INFO[p.form].name} FORM`) : `GROWS UP AT ${EVOLVE_AT} LEVELS: ${tot}/${EVOLVE_AT}, INTO ITS ${STAT_INFO[favourite(p)].name} FORM`, x0 + 90, y0 + 44, C.mist);
  text(p.crowned ? 'UP: REBIRTH AS A SPARKLY EGG' : p.form ? `CROWN AT ${CROWN_AT} LEVELS: ${tot}/${CROWN_AT}` : '', x0 + 90, y0 + 55, p.crowned ? C.lime : C.fog);
  for (let k = 0; k < 5; k++) (k < Math.round(p.joy / 20) ? heart : (x, y) => rect(x - 3, y, 6, 4, C.slate))(x0 + 20 + k * 9, y0 + 78);
  STATS.forEach((s, i) => {
    const y = y0 + 92 + i * 14, col = C[STAT_INFO[s].col];
    if (F?.stat === s && Math.floor(F.t * 10) % 2) rect(x0 + 10, y - 3, w - 20, 13, C.slate);
    text(STAT_INFO[s].name, x0 + 14, y, col);
    text('LV ' + p.lv[s], x0 + 70, y, C.paper);
    bar(x0 + 110, y + 2, 150, p.xp[s], XP_PER_LEVEL, col);
    text(`ATE ${p.fed[s]}`, x0 + 270, y, C.fog);
  });
  // the basket strip
  const by = y0 + 166;
  text(d.basket.length ? 'FEED FROM THE BASKET   LEFT / RIGHT: PICK   Z: FEED' : 'THE BASKET IS EMPTY: MELT WEAPONS IN A RUN TO FILL IT', x0 + 14, by, C.lime);
  const per = 14, start = Math.max(0, Math.min(M.sel - 6, d.basket.length - per));
  for (let i = 0; i < per && start + i < d.basket.length; i++) {
    const w = d.basket[start + i], x = x0 + 14 + i * 24, y = by + 11, on = start + i === M.sel;
    rect(x, y, 22, 22, on ? C.gold : C.slate);
    rect(x + 1, y + 1, 20, 20, C.night);
    weaponIcon(w, x + 2, y + 2, 18, 18, t);
    rect(x + 1, y + 20, 20, 1, C[STAT_INFO[FOOD[w.type]].col]);
  }
  const it = d.basket[M.sel];
  if (it) text(fitText(`${it.name}: +${feedXp(it, p)} ${STAT_INFO[FOOD[it.type]].name}`, 330), x0 + 14, by + 38, rarityColour(it.q));
  if (M.msg) text(M.msg, x0 + 90, y0 + 68, C.gold);
  text('C / ESC: CLOSE', x0 + w - 10, y0 + 12, C.fog, { align: 'right' });
}
function drawMarket(M, t) {
  const rows = marketRows(hasTrophy), d = den();
  shade(0.5);
  const x0 = 50, y0 = 22, w = 380, h = 230;
  panel('panel', x0, y0, w, h);
  text('DEN MARKET', x0 + 12, y0 + 10, C.gold, { k: 2 });
  const p = d.pets[M.pet];
  text(`MEDALS ${d.medals}   SHARDS ${meta().shards}`, x0 + w - 12, y0 + 10, C.cream, { align: 'right' });
  text(p ? `FOR: ${p.name} (LEFT / RIGHT)` : 'NO PETS YET', x0 + w - 12, y0 + 22, C.mist, { align: 'right' });
  for (let i = 0; i < 9 && M.top + i < rows.length; i++) {
    const r = rows[M.top + i], y = y0 + 40 + i * 16, on = M.top + i === M.sel;
    if (on) rect(x0 + 8, y - 3, w - 16, 14, C.slate);
    const col = r.locked ? C.stone : r.owned ? C.fog : C.paper;
    text(r.name + (r.owned ? '  (IN THE DEN)' : ''), x0 + 14, y, col);
    text(r.shards ? `${r.shards} SHARDS` : `${r.price} MEDALS`, x0 + w - 14, y, r.locked ? C.stone : r.shards ? C.sky : C.gold, { align: 'right' });
    if (r.zone != null) drawEgg({ zone: r.zone, taps: 0 }, x0 + w - 100, y + 9, t, false);
  }
  const r = rows[M.sel];
  if (r) text(fitText(r.desc, w - 24), x0 + 12, y0 + h - 30, C.mist);
  text(M.msg || '', x0 + 12, y0 + h - 16, C.lime);
}
function drawCupMenu(M, t) {
  const d = den();
  shade(0.5);
  const x0 = 40, y0 = 24, w = 400, h = 222;
  panel('panel', x0, y0, w, h);
  text('THE DEN CUP', x0 + 12, y0 + 10, C.gold, { k: 2 });
  const p = d.pets[M.pet % d.pets.length];
  text(`ENTRANT: ${p.name}, ${petName(p)}   (C: CHANGE)`, x0 + 12, y0 + 30, C.cream);
  EVENT_LIST.forEach((ev, i) => {
    const y = y0 + 48 + i * 44, on = i === M.ev, E = EVENTS[ev];
    if (on) rect(x0 + 8, y - 4, w - 16, 40, C.slate);
    text(E.name, x0 + 14, y, on ? C.gold : C.paper);
    text(fitText(E.desc, w - 28), x0 + 14, y + 10, C.mist);
    CUPS.forEach((c, k) => {
      const x = x0 + 14 + k * 96, open = cupOpen(ev, k), won = d.cups[ev] > k, sel = on && k === M.tier;
      rect(x, y + 21, 90, 15, sel ? C.gold : open ? C.stone : C.night);
      rect(x + 1, y + 22, 88, 13, C.ink);
      text((won ? '* ' : '') + c.name, x + 45, y + 25, open ? C[c.col] : C.stone, { align: 'center' });
    });
    text(`${p.name}'S SCORE: ${Math.round(ratingOf(p, ev))}`, x0 + w - 14, y, C.fog, { align: 'right' });
  });
  text('UP / DOWN: EVENT   LEFT / RIGHT: CUP   Z: COMPETE   ESC: CLOSE', x0 + 12, y0 + h - 28, C.lime);
  text(M.msg || `1ST PLACE PAYS ${CUPS[M.tier].prize} MEDALS AND OPENS THE NEXT CUP`, x0 + 12, y0 + h - 16, C.mist);
}

// ---------------------------------------------------------------- the show
function racer(f, x, y, t, walking, flip = false, hit = false, k = 1, pose = null) {
  const S = art(f.sprite);
  if (!S) return;
  const name = pose && S.frames.includes(pose) ? pose : hit ? 'hit' : walking ? 'walk' + (Math.floor(t * 10) % 4) : Math.floor(t * 2) % 2 ? 'idle1' : 'idle0';
  X.save();
  X.translate(Math.round(x), Math.round(y));
  X.scale(k, k);
  frame(S.im, fi(S, name), S.w, S.h, -Math.round(S.w / 2), -S.h + 1, flip);
  X.restore();
}
function drawShow(M, t) {
  const res = M.res, T = M.t, len = showLen(res);
  drawBackdrop();
  shade(0.6);
  rect(0, 0, W, 26, C.ink);
  text(`${EVENTS[res.ev].name}: ${CUPS[res.tier].name}`, W / 2, 8, C[CUPS[res.tier].col], { align: 'center', k: 2 });
  if (res.ev === 'race') {
    const x0 = 64, x1 = 410, hurdles = [130, 230, 330];
    res.field.forEach((f, i) => {
      const y = 76 + i * 46;
      rect(0, y - 2, W, 6, C.woodD);
      rect(0, y, W, 2, C.sand);
      for (const hx of hurdles) rect(hx, y - 10, 2, 10, C.cream), rect(hx - 3, y - 11, 8, 2, C.red);
      const u = Math.min(1, T / f.time), x = x0 + (x1 - x0) * u;
      const near = hurdles.find(hx => Math.abs(hx - x) < 14), jump = near ? Math.round(Math.cos(((x - near) / 14) * (Math.PI / 2)) * 12) : 0;
      racer(f, x, y - jump, T + i, u < 1);
      rect(2, y - 32, 116, 21, 'rgba(26,20,40,0.75)');
      text(f.name, 6, y - 30, f.pet ? C.gold : C.paper);
      text(fitText(ENEMIES[f.sprite]?.name.toUpperCase() || '', 110), 6, y - 20, C.mist);
      if (u >= 1) text(`${(f.time).toFixed(2)}s`, x1 + 10, y - 16, f.pet ? C.gold : C.fog);
    });
    rect(x1, 50, 2, 164, C.paper);
    for (let y = 50; y < 214; y += 6) rect(x1 + 2, y, 3, 3, (y / 6) % 2 ? C.ink : C.paper);
  } else if (res.ev === 'spar') {
    const bouts = res.field[0].bouts, per = 5 * 0.55 + 0.8, b = Math.min(2, Math.floor(T / per)), bt = T - b * per, B = bouts[b];
    const k = Math.min(4, Math.floor(Math.max(0, bt - 0.8) / 0.55)), into = (Math.max(0, bt - 0.8) % 0.55) / 0.55;
    rect(80, 200, 320, 8, C.wine);
    rect(90, 196, 300, 5, C.coral);
    const mine = res.field[0], youHit = bt > 0.8 && B.hits[k] === 1, lunge = bt > 0.8 && T < len - 0.6 ? Math.round(Math.sin(into * Math.PI) * 26) : 0;
    const swing = bt > 0.8 && into > 0.25 && into < 0.6;
    racer(mine, 176 + (youHit ? lunge : 0), 197, T, false, false, bt > 0.8 && !youHit && into > 0.4 && into < 0.8, 2, swing && youHit ? 'loose' : null);
    racer(B.rival, 304 - (!youHit ? lunge : 0), 197, T + 1, false, true, youHit && into > 0.4 && into < 0.8, 2, swing && !youHit ? 'loose' : null);
    text(`BOUT ${b + 1} OF 3: ${mine.name} VS ${B.rival.name}`, W / 2, 40, C.cream, { align: 'center' });
    const shown = bt > 0.8 ? k + (into > 0.5 ? 1 : 0) : 0;
    B.hits.slice(0, shown).forEach((hh, i) => rect(W / 2 - 40 + i * 18, 58, 12, 8, hh ? C.lime : C.red));
    bouts.slice(0, b).forEach((bb, i) => text(bb.won ? 'WON' : 'LOST', W / 2 - 60 + i * 60, 76, bb.won ? C.lime : C.coral, { align: 'center' }));
  } else {
    const mine = res.field[0], shot = Math.min(10, Math.floor(T / 0.5)), into = (T % 0.5) / 0.5;
    racer(mine, 80, 201, T, false, false, false, 2, into < 0.3 && shot < 10 ? 'loose' : 'draw');
    rect(0, 201, W, 4, C.sand);
    for (let i = 0; i < 10; i++) {
      const tx = 200 + (i % 5) * 52, ty = 70 + Math.floor(i / 5) * 60, done = i < shot;
      if (done && mine.shots[i]) continue; // popped
      if (i <= shot) {
        rect(tx - 8, ty - 8, 16, 16, C.paper);
        rect(tx - 6, ty - 6, 12, 12, C.red);
        rect(tx - 3, ty - 3, 6, 6, C.paper);
        rect(tx - 1, ty - 1, 2, 2, C.red);
        if (done) text('MISS', tx, ty + 12, C.fog, { align: 'center' });
      }
    }
    if (shot < 10) {
      const tx = 200 + (shot % 5) * 52, ty = 70 + Math.floor(shot / 5) * 60, sx = 90 + (tx - 90) * into, sy = 180 + (ty - 180) * into - Math.sin(into * Math.PI) * 30;
      rect(Math.round(sx), Math.round(sy), 3, 3, C.gold);
    }
    const score = mine.shots.slice(0, shot).reduce((a, b) => a + b, 0);
    text(`${mine.name}: ${score} / 10`, 20, 40, C.gold);
    if (M.done) res.field.slice(1).forEach((f, i) => text(`${f.name}: ${f.score}`, 20, 54 + i * 12, C.mist));
  }
  if (!M.done) text('Z: SKIP', W - 8, H - 12, C.fog, { align: 'right' });
  if (M.done) {
    rect(90, 96, 300, 76, C.ink);
    rect(92, 98, 296, 72, res.place === 1 ? C.wine : C.night);
    text(['1ST PLACE!', '2ND PLACE', '3RD PLACE', '4TH PLACE'][res.place - 1], W / 2, 104, res.place === 1 ? C.gold : C.cream, { align: 'center', k: 2 });
    text(`+${res.medals} MEDALS`, W / 2, 128, C.gold, { align: 'center' });
    const c = M.claim || {};
    text(c.champion ? `${EVENTS[res.ev].name} CHAMPION! EVERY CUP WON` : c.opened ? `THE ${c.opened} IS OPEN` : res.place === 1 ? 'A WIN! TRY THE NEXT CUP' : 'FEED THE RIGHT WEAPONS AND TRY AGAIN', W / 2, 142, C.lime, { align: 'center' });
    text('Z: BACK TO THE CUP', W / 2, 156, C.mist, { align: 'center' });
  }
}
