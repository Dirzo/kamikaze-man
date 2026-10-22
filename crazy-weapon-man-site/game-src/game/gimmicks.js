// Level gimmicks in play (data/gimmicks.js lists which level has which):
//   ghost   the map is dark but for a pool of light around you, and haunted blades drift after you
//           while your back is turned (Super Mario World's Boos): face one and it freezes. They
//           can't be hurt; they don't count toward the clear, and they flee the arena.
//   scroll  the screen moves right on its own and you can't leave it. A resident it leaves behind
//           is gone for good (it doesn't count toward the clear); if it pins you against a wall you
//           take a hit and are set down a little way ahead. It stops at the arena.
//   water   the level is flooded: slow sinking, and JUMP is a swim stroke you can repeat in the air.
//   ice     slippery floors: you slide to a stop and skid on turns; knocked-back foes slide further.
// The hero's numbers for water and ice come from heroPhysics(), read by hero.js.
import { C, W, H, HERO } from '../config.js';
import { world } from './world.js';
import { X, rect, px, dither, screenLayer, worldLayer } from '../engine/gfx.js';
import { cx, cy, overlap } from './physics.js';
import { hurtHero } from './combat.js';
import { burst, callout, emit } from './fx.js';
import { lookOf } from './looks.js';
import { makeWeapon } from './loot.js';
import { refDmg } from '../data/curve.js';
import { GIMMICKS, gimmickOf, PHYSICS, SCROLL_SPEED, HAUNT } from '../data/gimmicks.js';

// called by startZone once the map is built
export function startGimmick() {
  const kind = gimmickOf(world.level?.id);
  world.gimmick = kind;
  world.scroll = kind === 'scroll' ? { x: 0, pin: 0 } : null;
  world.haunts = [];
  if (kind === 'ghost') {
    const m = world.map, n = HAUNT.count(world.zone);
    for (let i = 0; i < n; i++) {
      const x = 360 + ((m.bossLeft - 480) * (i + 0.5)) / n;
      const w = makeWeapon(world.zone, { q: 2 + (i % 4), standout: false });
      world.haunts.push({ x, y: m.floorY - 60 - (i % 3) * 50, w: 12, h: 12, item: w, t: i, frozen: false });
    }
  }
}
export const gimmickName = () => (world.gimmick ? GIMMICKS[world.gimmick].name : '');
// the hero's movement numbers in this level (multipliers on HERO), or null for the usual
// (an ice sheet in the snowy woods, ambience.js, is slippery wherever the level is)
export const heroPhysics = () =>
  (world.gimmick && !world.hidden?.inRoom ? PHYSICS[world.gimmick] || null : null) || (world.hero?.onGround && world.hero.platform?.ice ? PHYSICS.ice : null);

export function updateGimmick(dt) {
  const h = world.hero;
  if (!world.gimmick || !h || world.hidden?.inRoom) return;
  if (world.gimmick === 'scroll') updateScroll(dt, h);
  else if (world.gimmick === 'ghost') updateHaunts(dt, h);
  else if (world.gimmick === 'water' && Math.random() < dt * 6) emit(world.cameraX + Math.random() * W, world.cameraY + H - 30, 'bubble', C.ice);
  else if (world.gimmick === 'ice' && Math.random() < dt * 8) emit(world.cameraX + Math.random() * W, world.cameraY + 10, 'frost', C.paper);
}

// ---------------------------------------------------------------- auto-scroll
function updateScroll(dt, h) {
  const S = world.scroll, D = world.director, m = world.map, end = m.width - W;
  if (world.lock || !D || D.phase === 'intro' || h.dead) return;
  if (S.x < end) S.x = Math.min(end, S.x + SCROLL_SPEED * dt);
  // you can't leave the screen in either direction
  const lo = S.x + 2, hi = S.x + W - h.w - 2;
  if (h.x > hi) (h.x = hi), (h.vx = Math.min(0, h.vx));
  if (h.x < lo) {
    h.x = lo;
    h.vx = Math.max(0, h.vx);
    // pinned against a wall by the edge of the screen: take a hit and land a little way ahead
    const wall = m.solids.some(p => overlap({ x: h.x + 1, y: h.y + 2, w: h.w, h: h.h - 4 }, p));
    S.pin = wall ? S.pin + dt : 0;
    if (S.pin > 0.15) {
      S.pin = 0;
      hurtHero(Math.round(h.maxHp * 0.2), 1);
      const x = S.x + 120, ps = m.platforms.filter(p => x >= p.x + 4 && x < p.x + p.w - 4).sort((a, b) => Math.abs(a.y - h.y) - Math.abs(b.y - h.y));
      if (ps[0]) Object.assign(h, { x: x - h.w / 2, y: ps[0].y - HERO.h, vx: 0, vy: 0, ladder: null });
      burst(cx(h), cy(h), 12, 'twinkle', ['orange', 'paper']);
    }
  } else S.pin = 0;
  // residents the screen leaves behind are gone (they never count against the clear)
  for (const e of world.enemies) if (!e.dead && !e.boss && e.x + e.w < S.x - 12) Object.assign(e, { dead: true, deathT: 0, escaped: true, shattered: true });
}
// the camera's x in an auto-scroller (camera.js): the screen, not the hero, decides
export const scrollX = () => (world.scroll && !world.lock && !world.hidden?.inRoom ? world.scroll.x : null);

// ---------------------------------------------------------------- ghost house
function updateHaunts(dt, h) {
  if (world.lock) {
    // the arena is lit: the blades flee
    for (const g of world.haunts) burst(g.x, g.y, 8, 'ghost', ['violet', 'mist']);
    world.haunts.length = 0;
    return;
  }
  for (const g of world.haunts) {
    g.t += dt;
    const dx = cx(h) - g.x, dy = cy(h) - g.y, d = Math.hypot(dx, dy) || 1;
    if (d > HAUNT.near) continue;
    // you are facing it: it stops dead and shivers
    g.frozen = Math.sign(dx) !== h.face && !h.ladder;
    if (!g.frozen) {
      g.x += (dx / d) * HAUNT.speed * dt;
      g.y += (dy / d) * HAUNT.speed * dt;
      if (Math.random() < dt * 8) emit(g.x, g.y, 'ghost', C.violet);
    }
    if (overlap(h, { x: g.x - 5, y: g.y - 5, w: 10, h: 10 }) && hurtHero(refDmg(world.zone) * HAUNT.dmg * (world.foeScale?.dmg || 1), Math.sign(-dx) || 1)) {
      callout('BOO!', 0, 0, C.violet, { follow: h, life: 40 });
    }
  }
}

// ---------------------------------------------------------------- drawing
// world layer, after the actors: the haunted blades, translucent
export function drawGimmickWorld(t) {
  if (world.gimmick !== 'ghost' || world.hidden?.inRoom) return;
  for (const g of world.haunts) {
    const L = lookOf(g.item);
    X.save();
    X.globalAlpha = g.frozen ? 0.28 : 0.6;
    X.translate(Math.round(g.x + (g.frozen ? (Math.floor(t * 30) % 2 ? 1 : -1) : 0)), Math.round(g.y + Math.sin(g.t * 2) * 2));
    X.rotate(Math.sin(g.t * 1.3) * 0.5 + (g.frozen ? 0 : 0.6));
    X.drawImage(L.cv, -Math.round(L.w / 2), -Math.round(L.h / 2));
    X.restore();
    if (!g.frozen && Math.floor(t * 4) % 3 === 0) px(Math.round(g.x), Math.round(g.y - 9), C.violet);
  }
}
// screen layer, over the world but under the HUD: water, frost and the dark
export function drawGimmickScreen(t) {
  const G = world.gimmick;
  if (!G || world.hidden?.inRoom) return;
  screenLayer();
  if (G === 'water') {
    X.save();
    X.globalAlpha = 0.18;
    rect(0, 0, W, H, C.blue);
    X.restore();
    for (let i = 0; i < 8; i++) {
      const y = 30 + i * 22, off = Math.round(Math.sin(t * 1.5 + i) * 6);
      for (let x = (i % 2) * 12 + off; x < W; x += 24) rect(x, y, 6, 1, i % 3 ? C.sky : C.ice);
    }
  } else if (G === 'ice') {
    worldLayer();
    for (const p of world.platforms) if (p.x + p.w >= world.cameraX && p.x <= world.cameraX + W) rect(p.x, p.y - 1, p.w, 2, C.ice), dither(p.x, p.y + 1, p.w, 2, C.paper, 4);
    screenLayer();
  } else if (G === 'ghost' && !world.lock) {
    const h = world.hero, hx = Math.round(cx(h) - world.cameraX), hy = Math.round(cy(h) - world.cameraY);
    darkness(hx, hy, 74, 0.86);
    darkness(hx, hy, 52, 0.35);
  }
}
function darkness(x, y, r, a) {
  X.save();
  X.globalAlpha = a;
  X.fillStyle = C.ink;
  X.beginPath();
  X.rect(0, 0, W, H);
  // a blocky circle: a stack of rows, so the light's edge stays pixel art
  for (let dy = -r; dy <= r; dy += 3) {
    const w = Math.round(Math.sqrt(r * r - dy * dy));
    X.rect(x - w, y + dy, w * 2, 3);
  }
  X.fill('evenodd');
  X.restore();
}
