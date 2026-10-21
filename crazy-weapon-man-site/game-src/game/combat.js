// Hit resolution: every hit on an enemy goes through hitEnemy(), every hit on the hero through
// hurtHero(). Knockback is a fixed push (arcade style): a short free slide then friction.
import { C } from '../config.js';
import { world, newId } from './world.js';
import { spark, damageNumber, heroDamageNumber, shake, hitstop, burst, emit, callout, feel } from './fx.js';
import { sfx } from '../engine/audio.js';
import { makeWeapon, noWeaker } from './loot.js';
import { cx, cy } from './physics.js';
import { ELEMENTS } from '../data/weapons.js';
import { LINES } from '../data/enemies.js';
import { gainXp, gainProficiency } from './progress.js';
import { say } from './bubbles.js';
import { comboHit } from './waves.js';
import { logDamage } from './speedrun.js';
import { BOSS_TOUGH } from '../data/swarm.js';
import { abilityKill, abilityBlock, abilityHurt, bigFoeMult } from './abilities.js';
import { heroStats, foeMult } from './perks.js';
import { stats } from '../data/meta.js';
import { convertDrop } from './classlock.js';

const KB_SLIDE = 0.1;
const pickLine = a => a[Math.floor(Math.random() * a.length)];
let lastStopAt = -9;

// o: { crit, dir, knock (px), hop, element (family), special, big (a finisher), chain, chip (small/no-feedback
// hit), aoe (an area augment's hit: starts no more area hits), nova, col }
export function hitEnemy(e, dmg, o = {}) {
  if (!e || e.dead || e.hp <= 0 || e.spawnT > 0) return 0;
  const hero = world.hero;
  const dir = o.dir || Math.sign(cx(e) - cx(hero)) || 1;
  if (e.asleep) wake(e);
  e.calm = false; // a peaceful resident fights back once hit
  if (e.kind === 'mimic' && e.disguised) reveal(e);
  // shields block from the front unless it's a crit or a special
  if (e.kind === 'shield' && !o.crit && !o.special && !o.chip && e.face === -dir && e.state !== 'attack') {
    dmg *= 0.2;
    if (!o.chain) {
      callout('CLANG', 0, 0, C.ice, { follow: e, life: 40 });
      sfx.clang();
      spark(cx(e) - dir * e.w * 0.4, cy(e), { col: C.ice });
    }
    o = { ...o, knock: (o.knock || 0) * 0.3 };
  }
  dmg *= bigFoeMult(e) * foeMult(e);
  // bosses shrug off any single hit bigger than a sliver of their health (see BOSS_TOUGH)
  if (e.boss || e.swarmBoss) dmg = Math.min(dmg, e.max * BOSS_TOUGH.hitCap);
  dmg = Math.max(1, Math.round(dmg));
  logDamage(Math.min(dmg, Math.max(0, e.hp)));
  e.hp -= dmg;
  e.flash = e.boss ? 0.05 : 0.12;
  damageNumber(e, dmg, { crit: o.crit, chip: o.chip, col: o.col });
  if (!o.chip) {
    const sy = Math.max(e.y + 4, Math.min(e.y + e.h - 4, hero.y + hero.h * 0.45));
    spark(cx(e) - dir * e.w * 0.35, sy, { crit: o.crit, col: o.sparkCol || C.cream });
    if (o.crit) burst(cx(e) - dir * e.w * 0.35, sy, 7, 'twinkle', ['gold', 'pink', 'orange', 'paper']);
    e.faceUntil = world.t + 0.42;
    e.funnyFace = ((e.funnyFace || 0) + 1) % 3;
    sfx.hit(o.crit, o.chain ? null : hero.weapon?.type); // the weapon's signature sound
    sfx.thud(o.crit, e.type === 'goose');
    if (!e.boss && world.t > (e.nextBonk || 0)) {
      callout(['BONK!', 'OOF!', 'PLOP!'][e.funnyFace], 0, 0, C.cream, {follow:e, life:22});
      e.nextBonk = world.t + 0.65;
    }
    const now = feel.frame / 60;
    if (o.crit || e.boss) {
      hitstop(o.crit ? 0.06 : 0.035);
      lastStopAt = now;
    } else if (now - lastStopAt > 0.13) {
      hitstop(o.special ? 0.04 : 0.03);
      lastStopAt = now;
    }
    shake(o.crit ? 0.32 : o.hop ? 0.3 : 0.1);
  }
  if (!o.chip) comboHit();
  // knockback + stagger (not bosses)
  if (!e.boss && !e.swarmBoss) {
    let push = o.knock || 0;
    if (o.crit) push *= 1.35;
    if (e.elite) push *= 0.75;
    if (world.t - (e.lastHitAt || -9) < 0.3 && !o.crit) push *= 0.75;
    if (push > 0) {
      e.vx = (dir * push) / (KB_SLIDE + 0.06);
      e.kbT = KB_SLIDE;
      e.stun = Math.max(e.stun, o.chip ? 0.03 : o.crit ? 0.24 : 0.12);
      e.face = -dir;
      if (!e.air && (o.hop || o.crit)) {
        e.vy = -110;
        e.onGround = false;
      }
    }
    if (e.state === 'wind' && (o.crit || o.special)) e.state = 'idle'; // big hits interrupt wind-ups
  }
  e.lastHitAt = world.t;
  if (o.element && !o.chip) {
    applyElement(e, dmg, o);
    // shard tree keystones: a chance to also strike with another element
    if (!o.chain) for (const [el, p] of Object.entries(heroStats().infuse)) if (el !== o.element && Math.random() < p) applyElement(e, dmg, { ...o, element: el });
  }
  if (!o.chip && !o.chain && !o.aoe) areaHits(e, dmg, o);
  if (e.hp <= 0) kill(e, o);
  return dmg;
}

// ---------------------------------------------------------------- area augments (shard tree)
// the living foes around a point, nearest first
function around(x, y, r, not = null) {
  return world.enemies
    .filter(n => n !== not && !n.dead && n.spawnT <= 0 && Math.abs(cx(n) - x) < r + n.w / 2 && Math.abs(cy(n) - y) < 30 + n.h / 2)
    .sort((a, b) => Math.abs(cx(a) - x) - Math.abs(cx(b) - x));
}
const AREA_MAX = 8; // foes one area effect can reach
// RIPPLE / WIDE CLEAVE / FRAG SHOTS splash part of a hit onto its neighbours; WHIRLWIND / SHOCKWAVE
// turn a finisher or special into a ring around the hero
function areaHits(e, dmg, o) {
  const S = heroStats(), h = world.hero;
  if (S.splash > 0) {
    const ns = around(cx(e), cy(e), 34, e).slice(0, AREA_MAX);
    if (ns.length) burst(cx(e), cy(e), 6, 'spark', ['orange', 'gold', 'paper']);
    for (const n of ns) hitEnemy(n, dmg * S.splash, { aoe: true, dir: Math.sign(cx(n) - cx(e)) || 1, knock: 6, sparkCol: C.orange, col: C.gold });
  }
  if (S.wave > 0 && h && (o.big || o.special) && world.t - (world.lastWave ?? -9) > 0.3) {
    world.lastWave = world.t;
    const x = cx(h), y = h.y + h.h;
    for (let i = -6; i <= 6; i++) emit(x + i * 9, y - 2, 'dust', i % 2 ? C.mist : C.paper);
    spark(x - 52, y - 6, { big: true, col: C.orange });
    spark(x + 52, y - 6, { big: true, col: C.orange });
    shake(0.25);
    sfx.thud(true);
    for (const n of around(x, cy(h), 56, e).slice(0, AREA_MAX)) hitEnemy(n, dmg * S.wave, { aoe: true, dir: Math.sign(cx(n) - x) || 1, knock: 22, hop: true, sparkCol: C.orange, col: C.gold });
  }
}
// SHARD NOVA / AFTERSHOCK / SCATTER BURST: a kill bursts into shards that hit the foes around it
// for part of the fallen foe's health (a nova's own kills don't nova again)
function nova(e, o) {
  const p = heroStats().nova;
  if (!(p > 0) || o.nova) return;
  const x = cx(e), y = cy(e), ns = around(x, y, 44, e).slice(0, AREA_MAX);
  burst(x, y, 10, 'chip', ['ice', 'sky', 'violet']);
  for (const n of ns) {
    zap(x, y, cx(n), cy(n), C.ice);
    hitEnemy(n, e.max * p, { aoe: true, nova: true, dir: Math.sign(cx(n) - x) || 1, knock: 14, sparkCol: C.ice, col: C.ice });
  }
}

function applyElement(e, dmg, o) {
  const el = ELEMENTS[o.element];
  if (!el) return;
  sfx.element(el.effect);
  const col = C[el.col];
  switch (el.effect) {
    case 'burn':
      e.burn = { t: 2, dmg: Math.max(1, dmg * 0.12), tick: 0.5 };
      break;
    case 'venom':
      e.venom = { t: 3, stacks: Math.min(5, (e.venom ? e.venom.stacks : 0) + 1), dmg: Math.max(1, dmg * 0.06), tick: 0.5 };
      break;
    case 'chill':
      e.chill = 1.6;
      break;
    case 'chain':
      if (!o.chain) {
        const near = world.enemies
          .filter(n => n !== e && !n.dead && Math.abs(cx(n) - cx(e)) < 70 && Math.abs(cy(n) - cy(e)) < 50)
          .sort((a, b) => Math.abs(cx(a) - cx(e)) - Math.abs(cx(b) - cx(e)))
          .slice(0, 2);
        for (const n of near) {
          zap(cx(e), cy(e), cx(n), cy(n), col);
          hitEnemy(n, dmg * 0.4, { chain: true, dir: Math.sign(cx(n) - cx(e)) || 1, knock: 6, sparkCol: col });
        }
      }
      break;
    case 'wave':
      if (!e.boss) e.vx *= 1.7;
      for (let i = 0; i < 4; i++) emit(cx(e), cy(e), 'drip', C.sky);
      break;
    case 'stun':
      if (Math.random() < 0.25 && !e.boss) {
        e.stun = Math.max(e.stun, 0.7);
        callout('STUNNED', 0, 0, C.sand, { follow: e, life: 36 });
      }
      break;
    case 'gust':
      if (!e.boss && !e.air) {
        e.vy = -150;
        e.onGround = false;
      }
      break;
    case 'holy':
      if (o.crit) world.hero.hp = Math.min(world.hero.maxHp, world.hero.hp + Math.ceil(world.hero.maxHp * 0.02));
      break;
    case 'pull':
      for (const n of world.enemies)
        if (n !== e && !n.dead && !n.boss && Math.abs(cx(n) - cx(e)) < 60) {
          n.vx = Math.sign(cx(e) - cx(n)) * 140;
          n.kbT = 0.08;
        }
      break;
  }
}

// pixel lightning between two points
export function zap(x0, y0, x1, y1, col) {
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    emit(x0 + (x1 - x0) * t + (Math.random() - 0.5) * 4, y0 + (y1 - y0) * t + (Math.random() - 0.5) * 4, 'spark', i % 2 ? col : C.paper);
  }
}

// damage over time ticks (burn, venom) — called from the enemy update
export function tickStatus(e, dt) {
  for (const k of ['burn', 'venom', 'rash']) {
    const s = e[k];
    if (!s) continue;
    s.t -= dt;
    s.tick -= dt;
    if (s.tick <= 0) {
      s.tick = 0.5;
      const d = k === 'venom' ? s.dmg * s.stacks : s.dmg;
      const col = k === 'burn' ? C.orange : k === 'rash' ? C.rust : C.lime;
      hitEnemy(e, d, { chip: true, col });
      emit(cx(e), e.y + 2, k === 'burn' ? 'ember' : k === 'rash' ? 'dot' : 'bubble', col);
    }
    if (s.t <= 0) e[k] = null;
  }
  if (e.chill > 0) {
    e.chill -= dt;
    if (Math.random() < 0.15) emit(e.x + Math.random() * e.w, e.y + Math.random() * e.h, 'frost', C.ice);
  }
}

export function wake(e) {
  e.asleep = false;
  e.state = 'idle';
  e.wakeT = 0.4;
  say(e, pickLine(LINES.wake), 2.4, true);
  callout('!', 0, 0, C.gold, { follow: e, life: 30 });
}
function reveal(e) {
  e.disguised = false;
  e.state = 'idle';
  say(e, pickLine(LINES.mimic), 1.6, true);
  sfx.enemyMelee();
}

// a defeated resident falls over (its DEATHS style, drawn in enemy.js) for DEATH_T seconds, and
// with SHATTER_T left its body bursts into the shards it was carrying
export const DEATH_T = 0.8, SHATTER_T = 0.22;
export function kill(e, o = {}) {
  if (e.dead || e.boss) return; // bosses handle their own defeat (bosses.js)
  e.dead = true;
  e.deathT = DEATH_T;
  e.fallDir = o.dir || Math.sign(cx(e) - cx(world.hero)) || 1;
  e.vx = e.fallDir * 70;
  if (!e.air) (e.vy = -120), (e.onGround = false);
  world.kills++;
  sfx.die(e.type, e.elite);
  burst(cx(e), cy(e), e.elite ? 14 : 8, 'chip', ['paper', 'mist', 'fog']);
  if (e.elite) {
    hitstop(0.08);
    shake(0.45);
  }
  if (e.sleeper) say(e, pickLine(LINES.last), 1.4, true);
  gainXp(e.xp);
  gainProficiency(e.elite ? 'elite' : 'normal');
  abilityKill();
  nova(e, o);
  // loot: the shards come out of the body when it shatters (shatter below)
  const zone = world.zone;
  e.shardLoot = e.elite ? 6 : 1 + (Math.random() < 0.4 ? 1 : 0);
  world.killsSinceDrop = (world.killsSinceDrop || 0) + 1;
  // (10 kills / 7%: was 7 / 10% before maps held 40+ residents, so weapons keep the same pace)
  if (world.killsSinceDrop >= 10 || Math.random() < (e.elite ? 0.65 : 0.07)) dropWeapon(cx(e), e.y, makeWeapon(zone, { elite: e.elite }));
  if (Math.random() < (e.elite ? 0.4 : 0.035) + stats().hearts) world.pickups.push({ kind: 'heart', x: cx(e) - 3, y: cy(e), vx: (Math.random() - 0.5) * 40, vy: -120, life: 14 });
  if (e.kind === 'bomb') explode(cx(e), cy(e), e.dmg, true);
}

// the fallen body bursts into crystal: a flash, flying shard chips and sparkles, then the shards
// themselves pop out for the magnet to pull in
export function shatter(e) {
  if (e.shattered) return;
  e.shattered = true;
  const x = cx(e), y = cy(e), big = e.elite || !!e.scale;
  spark(x, y, { big, col: C.ice });
  burst(x, y, big ? 22 : 12, 'chip', ['ice', 'sky', 'paper', 'violet']);
  burst(x, y, big ? 10 : 6, 'twinkle', ['ice', 'paper', 'sky']);
  burst(x, y, 4, 'mote', ['sky', 'ice']);
  sfx.shatter(big);
  if (e.shardLoot) dropShards(x, y, e.shardLoot);
  e.shardLoot = 0;
}

export function dropWeapon(x, y, w) {
  world.killsSinceDrop = 0;
  if (convertDrop(x, y, w, dropShards)) return; // specialized: another class bursts into shards
  noWeaker(w);
  if (world.drops.length >= 8) world.drops.shift();
  world.drops.push({ id: newId(), x: x - 6, y: y - 6, w: 12, h: 8, vx: (Math.random() - 0.5) * 50, vy: -150, item: w, life: 40, t: 0 });
  sfx.loot(w.q);
}
// n pickups worth `total` shards between them (one each by default)
export function dropShards(x, y, n, total = n) {
  for (let i = 0; i < n; i++)
    world.pickups.push({ kind: 'shard', x: x - 2, y: y - 2, vx: (Math.random() - 0.5) * 90, vy: -100 - Math.random() * 80, life: 20, value: Math.floor(total / n) + (i < total % n ? 1 : 0) });
}

// explosion: hurts the hero and (if `friendly`) other enemies; big pixel burst, no circles
export function explode(x, y, dmg, friendly = false, radius = 34) {
  sfx.boom(1);
  shake(0.55);
  hitstop(0.05);
  spark(x, y, { big: true, col: C.orange });
  burst(x, y, 16, 'chip', ['orange', 'gold', 'red', 'paper']);
  burst(x, y, 6, 'smoke', ['stone', 'fog']);
  const hero = world.hero;
  if (Math.abs(cx(hero) - x) < radius && Math.abs(cy(hero) - y) < radius) hurtHero(dmg, Math.sign(cx(hero) - x) || 1);
  if (friendly)
    for (const e of world.enemies)
      if (!e.dead && Math.abs(cx(e) - x) < radius && Math.abs(cy(e) - y) < radius) hitEnemy(e, dmg * 2, { dir: Math.sign(cx(e) - x) || 1, knock: 30, hop: true });
}

export function hurtHero(dmg, dir = 1) {
  const h = world.hero;
  if (!h || h.dead || h.inv > 0 || h.dashT > 0) return 0;
  if (abilityBlock(h)) return 0;
  const S = heroStats();
  dmg = Math.max(1, Math.round(dmg * (1 - S.armor)));
  h.hp -= dmg;
  h.inv = 0.8 * (1 + S.inv);
  h.hurtT = 0.25;
  h.vx = dir * 130;
  h.vy = -120;
  h.onGround = false;
  h.attack = null;
  heroDamageNumber(h, dmg);
  sfx.hurt();
  shake(0.4);
  hitstop(0.05);
  burst(cx(h), cy(h), 6, 'chip', ['red', 'paper']);
  if (h.hp <= 0 && h.oneUp) {
    // the golden mushroom's spare life (secrets.js)
    h.oneUp = false;
    h.hp = Math.round(h.maxHp / 2);
    h.inv = 2;
    callout('1UP!', 0, 0, C.lime, { follow: h, life: 70 });
    burst(cx(h), cy(h), 16, 'twinkle', ['lime', 'gold', 'paper']);
  }
  if (h.hp <= 0) {
    h.hp = 0;
    h.dead = true;
    world.phase = 'dead';
  }
  abilityHurt(h);
  return dmg;
}
