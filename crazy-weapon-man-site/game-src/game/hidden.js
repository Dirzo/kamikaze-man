// Hidden portals (MapleStory's): every map has one you can't see, on a surface somewhere along the
// route (data/maps.js hiddenSpot). Stand on it and press UP to step into the map's secret room; the
// return portal is right where you arrive. A secret room is one of three kinds:
//   vault   three chests of shards, one with a standout weapon
//   golden  a golden pack of residents: tougher, worth four times the shards and three book kills
//   shrine  a standout weapon of your class on a pedestal, and hearts
// and its ledge holds the level's fifth relic (relics.js). While you are inside, the map waits
// exactly as you left it: its residents, drops and pickups are put aside and handed back when you
// step out. Anything still flying to you in the room is collected on the way out.
import { C, W, HERO } from '../config.js';
import { world } from './world.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { rect, px, text } from '../engine/gfx.js';
import { cx, cy, overlap } from './physics.js';
import { burst, callout, shake } from './fx.js';
import { hiddenSpot, secretRoom, ROOM_KINDS } from '../data/maps.js';
import { relicSpots } from '../data/relics.js';
import { ZONES } from '../data/zones.js';
import { ENEMIES } from '../data/enemies.js';
import { enemyPool } from '../data/progression.js';
import { levelTier } from '../data/families.js';
import { spawnEnemy } from './enemy.js';
import { makeWeapon } from './loot.js';
import { dropWeapon, dropShards } from './combat.js';
import { drawItem } from './drops.js';
import { autoLoot } from './inventory.js';
import { updateCamera } from './camera.js';
import { stats } from '../data/meta.js';

const seedOf = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

// called by startZone after the easter egg and the egg are placed
export function placeHidden(z) {
  world.hidden = null;
  const m = world.map, avoid = [];
  if (world.secret) avoid.push({ x: world.secret.x + 5, y: world.secret.y + 10 });
  if (world.egg) avoid.push({ x: world.egg.x, y: world.egg.y });
  if (world.level) avoid.push(...relicSpots(m, avoid[0]).map(s => ({ x: s.x, y: s.y + 16 })));
  const at = hiddenSpot(m, avoid);
  if (!at) return;
  const kind = ROOM_KINDS[Math.abs(seedOf(world.level?.id || 'zone' + z)) % ROOM_KINDS.length];
  world.hidden = { x: at.x, y: at.y, kind, found: false, inRoom: false, t: 0, room: { map: secretRoom(z, kind), enemies: [], filled: false, chests: [], shrine: null, cleared: false } };
}

const onPortal = (h, x, y) => Math.abs(cx(h) - x) < 9 && Math.abs(h.y + h.h - y) < 3 && h.onGround && !h.ladder;
export const nearHidden = () => {
  const H = world.hidden, h = world.hero;
  return !!H && !!h && (H.inRoom ? onPortal(h, H.room.map.startX, H.room.map.floorY) : onPortal(h, H.x, H.y));
};

export function updateHidden(dt) {
  const H = world.hidden, h = world.hero;
  if (!H || !h || h.dead) return;
  H.t += dt;
  if (!H.inRoom) {
    if (world.lock || world.director?.phase === 'survive') return;
    if (onPortal(h, H.x, H.y) && input.take('up')) enterRoom();
    return;
  }
  const R = H.room, m = R.map;
  if (onPortal(h, m.startX, m.floorY) && H.t > 0.4 && input.take('up')) return leaveRoom();
  for (const c of R.chests) if (!c.open && overlap(h, { x: c.x - 7, y: c.y - 10, w: 14, h: 10 })) openChest(c);
  const S = R.shrine;
  if (S && !S.taken && overlap(h, { x: S.x - 8, y: S.y - 22, w: 16, h: 22 })) {
    S.taken = true;
    dropWeapon(S.x, S.y - 16, S.item);
    for (let i = 0; i < 2; i++) world.pickups.push({ kind: 'heart', x: S.x - 3 + i * 8, y: S.y - 20, vx: i ? 30 : -30, vy: -120, life: 30 });
    sfx.levelUp();
    burst(S.x, S.y - 14, 16, 'twinkle', ['gold', 'cream', 'paper']);
    callout('THE SHRINE GIVES ITS WEAPON', 240, 70, C.gold, { life: 110 });
  }
  if (H.kind === 'golden' && !R.cleared && R.filled && !R.enemies.some(e => !e.dead)) {
    R.cleared = true;
    callout('THE GOLDEN PACK FALLS!', 240, 70, C.gold, { big: true, life: 110 });
    sfx.clear();
  }
}

export function enterRoom() {
  const H = world.hidden, h = world.hero, R = H.room, m = R.map;
  H.inRoom = true;
  H.found = true;
  H.t = 0;
  H.saved = { map: world.map, platforms: world.platforms, enemies: world.enemies, drops: world.drops, pickups: world.pickups, cameraX: world.cameraX, cameraY: world.cameraY, lastRoom: world.lastRoom };
  world.map = m;
  world.platforms = m.platforms;
  world.enemies = R.enemies;
  world.drops = [];
  world.pickups = [];
  world.bolts.length = world.shots.length = 0;
  world.lastRoom = null;
  stand(h, m.startX, m.floorY);
  if (!R.filled) fill(R, H.kind);
  sfx.portal();
  shake(0.2);
  burst(cx(h), cy(h), 16, 'twinkle', ['violet', 'sky', 'paper']);
  callout('SECRET ROOM!', W / 2, 60, C.pink, { big: true, life: 110 });
  updateCamera(0, true);
}
function leaveRoom() {
  const H = world.hidden, h = world.hero, S = H.saved;
  // anything still on its way to you comes along
  for (const d of world.drops) autoLoot(d.item);
  for (const p of world.pickups) if (p.kind === 'shard') world.shards += Math.round(p.value * (1 + stats().shards));
  H.inRoom = false;
  H.t = 0;
  Object.assign(world, { map: S.map, platforms: S.platforms, enemies: S.enemies, drops: S.drops, pickups: S.pickups, cameraX: S.cameraX, cameraY: S.cameraY, lastRoom: S.lastRoom });
  world.bolts.length = world.shots.length = 0;
  H.saved = null;
  stand(h, H.x, H.y);
  sfx.portal();
  burst(cx(h), cy(h), 12, 'twinkle', ['violet', 'sky', 'paper']);
  updateCamera(0, true);
}
function stand(h, x, y) {
  Object.assign(h, { x: x - h.w / 2, y: y - HERO.h, vx: 0, vy: 0, onGround: true, platform: null, ladder: null, attack: null, special: null, dashT: 0, trail: null });
  h.inv = Math.max(h.inv, 0.6);
}

function fill(R, kind) {
  R.filled = true;
  const m = R.map, z = world.zone, f = m.floorY;
  if (kind === 'vault') {
    const prize = Math.floor(Math.random() * 3);
    R.chests = [{ x: 140, y: f }, { x: 210, y: f }, { x: 330, y: m.ledge.y }].map((c, i) => ({ ...c, open: false, prize: i === prize }));
  } else if (kind === 'golden') {
    const pool = enemyPool(z, 4, ZONES[z].pool, world.level ? levelTier(world.level.id) : null).filter(t => ENEMIES[t].kind !== 'mimic' && !ENEMIES[t].air);
    // (spawned straight into the room's list: world.enemies is the room's while you are inside)
    for (let i = 0; i < 5; i++) {
      const e = spawnEnemy(pool[i % pool.length], 150 + i * 56, f, { wave: 4 });
      if (!e) continue;
      e.golden = true;
      e.max = e.hp = Math.round(e.hp * 1.6);
      e.xp *= 3;
      e.name = 'Golden ' + e.name;
    }
  } else {
    const w = makeWeapon(z, { standout: true, type: ['sword', 'bow', 'hammer', 'katana', 'staff', 'wand'][Math.floor(Math.random() * 6)] });
    R.shrine = { x: 200, y: f, item: w, taken: false };
  }
}
function openChest(c) {
  c.open = true;
  const z = world.zone;
  sfx.loot(4);
  burst(c.x, c.y - 6, 12, 'twinkle', ['gold', 'cream', 'paper']);
  dropShards(c.x, c.y - 8, 6, 10 + z * 6);
  if (c.prize) dropWeapon(c.x, c.y - 10, makeWeapon(z, { standout: true }));
}

// ---------------------------------------------------------------- drawing
function swirl(x, y, t, open) {
  for (let i = 0; i < 14; i++) {
    const a = t * 3 + (i / 14) * Math.PI * 2, r = 5 + (i % 3) * 3;
    px(Math.round(x + Math.cos(a) * r), Math.round(y - 14 + Math.sin(a) * r * 1.4), i % 2 ? C.violet : open ? C.ice : C.pink);
  }
}
export function drawHidden(t) {
  const H = world.hidden, h = world.hero;
  if (!H || !h) return;
  if (!H.inRoom) {
    // invisible, but the air shimmers a little when you are close, and a portal you have found
    // stays faintly marked
    const d = Math.abs(cx(h) - H.x) + Math.abs(h.y + h.h - H.y) * 2;
    if (H.found) swirl(H.x, H.y, t * 0.6, false);
    else if (d < 70 && Math.floor(t * 6) % 3 === 0) for (let i = 0; i < 3; i++) px(Math.round(H.x - 6 + ((t * 40 + i * 17) % 12)), Math.round(H.y - 4 - ((t * 20 + i * 9) % 20)), C.mist);
    if (onPortal(h, H.x, H.y)) arrow(H.x, H.y - 34, t);
    return;
  }
  const R = H.room, m = R.map;
  swirl(m.startX, m.floorY, t, true);
  if (onPortal(h, m.startX, m.floorY)) arrow(m.startX, m.floorY - 34, t);
  text('UP: BACK', m.startX, m.floorY + 6, C.fog, { align: 'center' });
  for (const c of R.chests) chest(c.x, c.y, c.open);
  if (R.shrine) {
    const S = R.shrine;
    rect(S.x - 9, S.y - 10, 18, 10, C.ink);
    rect(S.x - 8, S.y - 9, 16, 9, C.stone);
    rect(S.x - 8, S.y - 9, 16, 2, C.mist);
    if (!S.taken) drawItem(S.item, S.x, S.y - 12, t);
  }
}
function arrow(x, y, t) {
  const b = Math.floor(t * 4) % 2;
  rect(x - 4, y + b, 9, 3, C.ink);
  rect(x - 3, y + 1 + b, 7, 1, C.gold);
  rect(x - 1, y - 2 + b, 3, 3, C.ink);
  px(x, y - 1 + b, C.gold);
  text('UP', x, y - 10 + b, C.gold, { align: 'center' });
}
function chest(x, y, open) {
  rect(x - 7, y - 9, 14, 9, C.ink);
  rect(x - 6, y - 8, 12, 8, C.wood);
  rect(x - 6, y - 8, 12, 2, open ? C.night : C.woodD);
  rect(x - 1, y - 6, 2, 2, C.gold);
  if (open) rect(x - 6, y - 13, 12, 3, C.woodD);
}
