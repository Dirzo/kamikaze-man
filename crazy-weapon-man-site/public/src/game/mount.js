// Mounts (Super Mario World's Yoshi, armoured): once three family heads have fallen the stable opens
// and you pick a war-beast (data/mounts.js: the War Goose, the Iron Boar or the War Griffin). Then an
// egg waits near the start of some levels (data/gimmicks.js EGG_LEVELS). Break it with a swing or a
// dash and your mount hatches; touch it to climb into the saddle. Riding it you run faster and jump
// higher, your dash becomes a WAR CHARGE that bowls foes over and landing on a foe stomps it, plus
// the mount's own perks: the goose snaps up small residents whole (CHOMP), the boar's iron barding
// soaks a hit, the griffin flaps for one more jump and its stomps strike everything around. You keep
// your weapon and fight as usual. A hit throws you out of the saddle instead of hurting you, and the
// mount flees: catch it again before it runs off. It rides with you from level to level (the
// overworld saves it with the hero) until it is lost.
import { C, HERO } from '../config.js';
import { A } from '../engine/assets.js';
import { X, frame } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { move, overlap, cx, cy } from './physics.js';
import { burst, callout, shake, emit } from './fx.js';
import { hitEnemy, kill, shatter, dropShards, zap } from './combat.js';
import { hitDamage } from './loot.js';
import { attackBox } from './attack-rules.js';
import { TYPES } from '../data/weapons.js';
import { EGG_LEVELS, EGG_ZONES, MOUNT } from '../data/gimmicks.js';
import { MOUNTS } from '../data/mounts.js';
import { chosenMount } from '../data/meta.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
// the beast under the hero (or a loose one), from data/mounts.js
export const mountDef = m => MOUNTS[m?.kind] || MOUNTS.wargoose;
const cry = kind => (kind === 'ironboar' ? sfx.grunt() : kind === 'griffin' ? sfx.screech() : sfx.honk());

// called by startZone: an egg on the start surface, a little way in
export function placeEgg(z) {
  world.egg = null;
  world.loose = null;
  if (!chosenMount()) return; // no mounts until the stable is open and you have picked one
  if (!(world.level ? EGG_LEVELS.includes(world.level.id) : EGG_ZONES.includes(z))) return;
  const m = world.map, x = m.startX + 110;
  const p = m.platforms.filter(p => x >= p.x + 8 && x < p.x + p.w - 8 && p.y >= m.startY - 40 && p.y <= m.startY + 60).sort((a, b) => Math.abs(a.y - m.startY) - Math.abs(b.y - m.startY))[0];
  world.egg = { x: p ? x : m.startX + 60, y: p ? p.y : m.startY, hp: 3, hitT: 0, t: 0 };
}

export const mounted = () => !!world.hero?.mount;
// a fresh saddle on this kind of mount (also how the overworld restores one between levels)
export function saddle(kind) {
  const D = MOUNTS[kind];
  return { kind, chompT: D.chomp || 1, flapT: 0, barding: D.barding, flaps: D.flaps };
}
export function mount(h, kind = world.loose?.kind || chosenMount() || 'wargoose') {
  const D = MOUNTS[kind];
  h.mount = saddle(kind);
  world.loose = null;
  sfx.hatch();
  burst(cx(h), h.y + h.h, 10, 'twinkle', ['paper', D.col, 'orange']);
  callout(D.name + '!', 0, 0, C[D.col], { follow: h, life: 70 });
  callout(pick(D.lines), 240, 84, C.cream, { life: 90 });
}
// a hit while riding: barding takes it, or you are thrown clear and the mount bolts
export function buck(h, dir) {
  const M = h.mount;
  if (M.barding > 0) {
    // IRON BARDING: the plate takes the blow and falls away
    M.barding--;
    h.inv = Math.max(h.inv, 1);
    h.vx = dir * 60;
    sfx.clang();
    shake(0.25);
    burst(cx(h), h.y + h.h - 6, 10, 'chip', ['stone', 'fog', 'paper']);
    callout('BARDING CRACKED!', 0, 0, C.sand, { follow: h, life: 55 });
    return;
  }
  const D = mountDef(M);
  h.mount = null;
  world.loose = { kind: M.kind, x: cx(h) - D.w / 2, y: h.y + h.h - D.h, w: D.w, h: D.h, vx: dir * 80, vy: -120, t: MOUNT.loose, face: dir, fresh: false, onGround: false };
  h.inv = Math.max(h.inv, 1.2);
  h.hurtT = 0.25;
  h.vx = dir * 110;
  h.vy = -200;
  h.onGround = false;
  h.attack = null;
  cry(M.kind);
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
  const M = h.mount, D = mountDef(M);
  M.flapT = Math.max(0, M.flapT - dt);
  if (!h.onGround && h.vy < 0) M.flapT = 0.2;
  if (h.onGround || h.ladder) M.flaps = D.flaps;
  stomp(h, D);
  if (!D.chomp) return;
  M.chompT -= dt;
  if (M.chompT <= 0) chomp(h, M, D);
}
// SKY FLAP: called by the hero's jump in mid-air; true when the mount had a flap left
export function flap(h) {
  const M = h.mount;
  if (!M || !(M.flaps > 0) || h.ladder) return false;
  M.flaps--;
  M.flapT = 0.3;
  h.vy = -HERO.jump * mountDef(M).jump * 0.92;
  h.jumpHeld = true;
  sfx.screech();
  burst(cx(h), h.y + h.h, 8, 'twinkle', ['sky', 'paper', 'ice']);
  return true;
}

// WAR CHARGE: called from the hero's dash while mounted; everything the charge runs through is hit
export function charge(h) {
  const D = mountDef(h.mount);
  h.chargeHit ||= new Set();
  const box = { x: h.x - 6, y: h.y, w: h.w + 12, h: h.h };
  for (const e of world.enemies) {
    if (e.dead || e.spawnT > 0 || h.chargeHit.has(e) || !overlap(box, e)) continue;
    h.chargeHit.add(e);
    hitEnemy(e, hitDamage(h.weapon) * D.charge, { dir: h.face, knock: D.knock, hop: true, big: true, special: true, sparkCol: C.orange });
    cry(h.mount.kind);
  }
  if (Math.random() < 0.5) emit(cx(h) - h.face * 10, h.y + h.h - 2, 'dust', C.fog);
}

function stomp(h, D) {
  if (h.vy < 60) return;
  const feet = { x: h.x - 3, y: h.y + h.h - 3, w: h.w + 6, h: 8 };
  for (const e of world.enemies) {
    if (e.dead || e.spawnT > 0 || !overlap(feet, { x: e.x, y: e.y, w: e.w, h: Math.min(10, e.h) })) continue;
    hitEnemy(e, hitDamage(h.weapon) * D.stomp, { dir: h.face, knock: 8, hop: true, big: true, sparkCol: C.gold });
    h.vy = -HERO.jump * 0.85;
    h.onGround = false;
    sfx.stomp();
    burst(cx(e), e.y, 8, 'dust', ['paper', 'mist']);
    if (D.quake) thunderDive(h, e, D);
    return;
  }
}

// THUNDER DIVE: the griffin's stomp cracks down on every foe around the one it landed on
function thunderDive(h, hit, D) {
  const x = cx(hit), y = hit.y + hit.h;
  shake(0.3);
  for (let i = -5; i <= 5; i++) emit(x + i * 9, y - 2, 'dust', i % 2 ? C.ice : C.paper);
  for (const e of world.enemies) {
    if (e === hit || e.dead || e.spawnT > 0 || Math.abs(cx(e) - x) > 56 || Math.abs(e.y + e.h - y) > 40) continue;
    zap(cx(h), h.y + h.h, cx(e), cy(e), C.ice);
    hitEnemy(e, hitDamage(h.weapon) * D.quake, { aoe: true, dir: Math.sign(cx(e) - x) || 1, knock: 18, hop: true, sparkCol: C.ice, col: C.ice });
  }
}

// CHOMP: the goose swallows the small resident right in front of it
function chomp(h, M, D) {
  const reach = MOUNT.chompReach, x0 = h.face > 0 ? cx(h) + 4 : cx(h) - 4 - reach;
  const e = world.enemies.find(e => !e.dead && !e.boss && !e.swarmBoss && !e.elite && !e.golden && e.spawnT <= 0 && e.state !== 'disguised'
    && e.x + e.w > x0 && e.x < x0 + reach && Math.abs(e.y + e.h - (h.y + h.h)) < 14);
  if (!e) return (M.chompT = 0.2);
  M.chompT = D.chomp;
  M.chompAnim = 0.25;
  sfx.chomp();
  callout('CHOMP!', 0, 0, C.orange, { follow: h, life: 40 });
  kill(e, { dir: h.face });
  e.eaten = true;
  e.shardLoot = Math.round((e.shardLoot || 0) * (1 + D.gizzard)); // SHARD GIZZARD
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
    // you already have one: the hatchling salutes your mount and runs off, leaving its shards
    dropShards(E.x, E.y - 10, 6, 20 + world.zone * 6);
    callout(`YOUR ${mountDef(h.mount).name} LOOKS PROUD`, 0, 0, C.cream, { follow: h, life: 70 });
    cry(h.mount.kind);
    return;
  }
  const kind = chosenMount() || 'wargoose', D = MOUNTS[kind];
  sfx.hatch();
  world.loose = { kind, x: E.x - D.w / 2, y: E.y - D.h, w: D.w, h: D.h, vx: 0, vy: -140, t: Infinity, face: -Math.sign(E.x - cx(h)) || 1, fresh: true, onGround: false };
  callout(`A ${D.name} HATCHED! TOUCH IT TO RIDE`, 240, 70, C[D.col], { life: 120 });
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
    callout(`YOUR ${MOUNTS[L.kind]?.name || 'MOUNT'} WENT HOME`, 0, 0, C.mist, { follow: h, life: 60 });
    world.loose = null;
    return;
  }
  if ((L.fresh || L.t < MOUNT.loose - 0.6) && overlap(h, L) && !h.dead) mount(h);
}

// ---------------------------------------------------------------- drawing
export function beast(kind, x, feet, face, f, k = 1) {
  const G = A.mounts[MOUNTS[kind]?.sprite || 'wargoose'];
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
  if (h.ladder) return beast(M.kind, cx(h) - h.face * 14, h.y + h.h + 2 + Math.sin(t * 12) * 2, h.face, 2); // scrambling up beside you
  const f = h.inv > 0 && h.hurtT > 0 ? 3 : !h.onGround || M.flapT > 0 ? 2 : Math.abs(h.vx) > 10 ? Math.floor(t * 9) % 2 : 0;
  beast(M.kind, cx(h) - h.face * 2, h.y + h.h + 1, h.face, f);
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
    beast(L.kind, cx(L), L.y + L.h, L.face, L.fresh ? Math.floor(t * 2) % 2 : 2);
  }
}
