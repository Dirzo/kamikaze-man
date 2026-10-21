// The War Goose (Super Mario World's Yoshi, armoured): an egg waits near the start of some levels
// (data/gimmicks.js EGG_LEVELS). Break it with a swing or a dash and a War Goose hatches; touch it to
// climb into the saddle. Riding it you run faster and jump higher, your dash becomes a WAR CHARGE
// that bowls foes over, landing on a foe stomps it, and the goose snaps up small residents in front
// of you whole (CHOMP). You keep your weapon and fight as usual. A hit throws you out of the saddle
// instead of hurting you, and the goose flees: catch it again before it flies off. It rides with
// you from level to level (the overworld saves it with the hero) until it is lost.
import { C, HERO } from '../config.js';
import { A } from '../engine/assets.js';
import { X, frame } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { move, overlap, cx, cy } from './physics.js';
import { burst, callout, shake, emit } from './fx.js';
import { hitEnemy, kill, shatter, dropShards } from './combat.js';
import { hitDamage } from './loot.js';
import { attackBox } from './attack-rules.js';
import { TYPES } from '../data/weapons.js';
import { EGG_LEVELS, EGG_ZONES, MOUNT } from '../data/gimmicks.js';

const GOOSE_LINES = ['HONK! (READY)', 'HONK. (MOUNT UP)', 'HONK HONK! (TO WAR)'];
const pick = a => a[Math.floor(Math.random() * a.length)];

// called by startZone: an egg on the start surface, a little way in
export function placeEgg(z) {
  world.egg = null;
  world.loose = null;
  if (!(world.level ? EGG_LEVELS.includes(world.level.id) : EGG_ZONES.includes(z))) return;
  const m = world.map, x = m.startX + 110;
  const p = m.platforms.filter(p => x >= p.x + 8 && x < p.x + p.w - 8 && p.y >= m.startY - 40 && p.y <= m.startY + 60).sort((a, b) => Math.abs(a.y - m.startY) - Math.abs(b.y - m.startY))[0];
  world.egg = { x: p ? x : m.startX + 60, y: p ? p.y : m.startY, hp: 3, hitT: 0, t: 0 };
}

export const mounted = () => !!world.hero?.mount;
export function mount(h) {
  h.mount = { chompT: MOUNT.chompEvery, flapT: 0 };
  world.loose = null;
  sfx.hatch();
  burst(cx(h), h.y + h.h, 10, 'twinkle', ['paper', 'gold', 'orange']);
  callout('WAR GOOSE!', 0, 0, C.gold, { follow: h, life: 70 });
  callout(pick(GOOSE_LINES), 240, 84, C.cream, { life: 90 });
}
// a hit while riding: you are thrown clear and the goose bolts
export function buck(h, dir) {
  h.mount = null;
  world.loose = { x: cx(h) - 15, y: h.y + h.h - 27, w: 30, h: 27, vx: dir * 80, vy: -120, t: MOUNT.loose, face: dir, fresh: false, onGround: false };
  h.inv = Math.max(h.inv, 1.2);
  h.hurtT = 0.25;
  h.vx = dir * 110;
  h.vy = -200;
  h.onGround = false;
  h.attack = null;
  sfx.honk();
  shake(0.3);
  burst(cx(h), cy(h), 10, 'chip', ['paper', 'mist']);
  callout('THROWN FROM THE SADDLE!', 0, 0, C.coral, { follow: h, life: 60 });
}

export function updateMount(dt) {
  const h = world.hero;
  if (!h || h.dead) return;
  updateEgg(dt, h);
  updateLoose(dt, h);
  if (!h.mount) return;
  const M = h.mount;
  M.flapT = Math.max(0, M.flapT - dt);
  if (!h.onGround && h.vy < 0) M.flapT = 0.2;
  stomp(h);
  M.chompT -= dt;
  if (M.chompT <= 0) chomp(h, M);
}

// WAR CHARGE: called from the hero's dash while mounted; everything the charge runs through is hit
export function charge(h) {
  h.chargeHit ||= new Set();
  const box = { x: h.x - 6, y: h.y, w: h.w + 12, h: h.h };
  for (const e of world.enemies) {
    if (e.dead || e.spawnT > 0 || h.chargeHit.has(e) || !overlap(box, e)) continue;
    h.chargeHit.add(e);
    hitEnemy(e, hitDamage(h.weapon) * 1.2, { dir: h.face, knock: 46, hop: true, big: true, special: true, sparkCol: C.orange });
    sfx.honk();
  }
  if (Math.random() < 0.5) emit(cx(h) - h.face * 10, h.y + h.h - 2, 'dust', C.fog);
}

function stomp(h) {
  if (h.vy < 60) return;
  const feet = { x: h.x - 3, y: h.y + h.h - 3, w: h.w + 6, h: 8 };
  for (const e of world.enemies) {
    if (e.dead || e.spawnT > 0 || !overlap(feet, { x: e.x, y: e.y, w: e.w, h: Math.min(10, e.h) })) continue;
    hitEnemy(e, hitDamage(h.weapon) * MOUNT.stomp, { dir: h.face, knock: 8, hop: true, big: true, sparkCol: C.gold });
    h.vy = -HERO.jump * 0.85;
    h.onGround = false;
    sfx.stomp();
    burst(cx(e), e.y, 8, 'dust', ['paper', 'mist']);
    return;
  }
}

// CHOMP: the goose swallows the small resident right in front of it
function chomp(h, M) {
  const reach = MOUNT.chompReach, x0 = h.face > 0 ? cx(h) + 4 : cx(h) - 4 - reach;
  const e = world.enemies.find(e => !e.dead && !e.boss && !e.swarmBoss && !e.elite && !e.golden && e.spawnT <= 0 && e.state !== 'disguised'
    && e.x + e.w > x0 && e.x < x0 + reach && Math.abs(e.y + e.h - (h.y + h.h)) < 14);
  if (!e) return (M.chompT = 0.2);
  M.chompT = MOUNT.chompEvery;
  M.chompAnim = 0.25;
  sfx.chomp();
  callout('CHOMP!', 0, 0, C.orange, { follow: h, life: 40 });
  kill(e, { dir: h.face });
  e.eaten = true;
  shatter(e); // the shards come straight out of the goose
}

function updateEgg(dt, h) {
  const E = world.egg;
  if (!E || world.hidden?.inRoom) return;
  E.t += dt;
  E.hitT = Math.max(0, E.hitT - dt);
  const box = { x: E.x - 7, y: E.y - 17, w: 14, h: 17 };
  const T = TYPES[h.weapon.type];
  const struck = (h.attack && !h.attack.ranged && h.attack.move && overlap(attackBox(h, T, h.attack.move, 0), box)) || (h.dashT > 0 && overlap(h, box)) || world.shots.some(s => overlap(s, box));
  if (!struck || E.hitT > 0) return;
  E.hitT = 0.25;
  E.hp--;
  sfx.clang();
  burst(E.x, E.y - 8, 6, 'chip', ['cream', 'sand']);
  if (E.hp > 0) return;
  world.egg = null;
  shake(0.25);
  burst(E.x, E.y - 8, 16, 'chip', ['cream', 'gold', 'paper']);
  if (h.mount) {
    // you already have one: the hatchling honks at your goose and runs off, leaving its shards
    dropShards(E.x, E.y - 10, 6, 20 + world.zone * 6);
    callout('YOUR GOOSE HONKS PROUDLY', 0, 0, C.cream, { follow: h, life: 70 });
    sfx.honk();
    return;
  }
  sfx.hatch();
  world.loose = { x: E.x - 15, y: E.y - 27, w: 30, h: 27, vx: 0, vy: -140, t: Infinity, face: -Math.sign(E.x - cx(h)) || 1, fresh: true, onGround: false };
  callout('A WAR GOOSE HATCHED! TOUCH IT TO RIDE', 240, 70, C.gold, { life: 120 });
}

function updateLoose(dt, h) {
  const L = world.loose;
  if (!L || world.hidden?.inRoom) return;
  L.t -= dt;
  L.anim = (L.anim || 0) + dt;
  if (!L.fresh) {
    L.vx = L.face * 90;
    if (L.onGround && Math.random() < dt * 2) L.vy = -170;
  } else L.vx = 0;
  move(L, dt, world.platforms, { gravity: 700 });
  if (L.hitWall) L.face *= -1;
  if (L.t <= 0) {
    // it gives up on you and flies home
    burst(cx(L), cy(L), 12, 'twinkle', ['paper', 'mist']);
    callout('YOUR GOOSE FLEW AWAY', 0, 0, C.mist, { follow: h, life: 60 });
    world.loose = null;
    return;
  }
  if ((L.fresh || L.t < MOUNT.loose - 0.6) && overlap(h, L) && !h.dead) mount(h);
}

// ---------------------------------------------------------------- drawing
function goose(x, feet, face, f, k = 1) {
  const G = A.mounts.wargoose;
  if (!G) return;
  X.save();
  X.translate(x, feet);
  X.scale(k, k);
  frame(G.im, f, G.w, G.h, -Math.round(G.w / 2), -G.h + 1, face < 0);
  X.restore();
}
// under the rider: called by the hero's draw before the hero (who sits RIDE px higher)
export const RIDE = 9;
export function drawMount(h, t) {
  if (!h.mount) return;
  const M = h.mount;
  if (h.ladder) return goose(cx(h) - h.face * 14, h.y + h.h + 2 + Math.sin(t * 12) * 2, h.face, 2); // flapping up beside you
  const f = h.inv > 0 && h.hurtT > 0 ? 3 : !h.onGround || M.flapT > 0 ? 2 : Math.abs(h.vx) > 10 ? Math.floor(t * 9) % 2 : 0;
  goose(cx(h) - h.face * 2, h.y + h.h + 1, h.face, f);
  if (M.chompAnim > 0) (M.chompAnim -= 1 / 60), emit(cx(h) + h.face * 16, h.y + 8, 'dust', C.orange);
}
export function drawMountWorld(t) {
  const E = world.egg, L = world.loose;
  if (world.hidden?.inRoom) return;
  if (E && A.mounts.egg) {
    const G = A.mounts.egg, wob = E.hitT > 0 ? (Math.floor(t * 30) % 2 ? 1 : -1) : Math.sin(t * 2) > 0.95 ? 1 : 0;
    frame(G.im, Math.min(2, 3 - E.hp), G.w, G.h, Math.round(E.x - G.w / 2) + wob, E.y - G.h + 1);
  }
  if (L) {
    if (!L.fresh && L.t < 1.5 && Math.floor(t * 10) % 2) return;
    goose(cx(L), L.y + L.h, L.face, L.fresh ? Math.floor(t * 2) % 2 : 2);
  }
}
