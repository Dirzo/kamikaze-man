// Weapon abilities in play (data/abilities.js): hooks called from hero.js, shots.js and combat.js,
// plus the meteors they call down. Ability hits are procs: they never roll quirks or mutations.
import { C } from '../config.js';
import { world } from './world.js';
import { hitEnemy } from './combat.js';
import { hitDamage } from './loot.js';
import { cx, cy, overlap } from './physics.js';
import { rect, px } from '../engine/gfx.js';
import { burst, emit, spark, shake, callout } from './fx.js';
import { sfx } from '../engine/audio.js';
import { innate, heroStats } from './perks.js';

const meteors = [];
// the weapon's own ability, or one the hero learned for good (mastery signature, world boss perk)
export const hasAbility = id => world.hero?.weapon?.ability === id || (!!world.hero && innate(id));
const say1 = (s, col) => callout(s, 0, 0, col, { follow: world.hero, life: 34 });

// a primary hit landed (melee contact or projectile impact); finisher = the combo's big last move
export function abilityHit(h, e, dmg, finisher) {
  if (hasAbility('vampire') && world.t >= (h.sipAt || 0)) {
    h.sipAt = world.t + 0.25;
    h.hp = Math.min(h.maxHp, h.hp + Math.max(1, Math.round(h.maxHp * 0.012)));
    emit(cx(e), cy(e), 'drip', C.red);
  }
  if (hasAbility('meteor') && finisher && !e.dead) {
    meteors.push({ x: cx(e) + (Math.random() - 0.5) * 8, y: Math.max(-20, e.y - 150), ty: e.y + e.h, vy: 160, dmg: hitDamage(h.weapon) * 1.4 });
    sfx.enemyCast();
  }
}
export function abilityKill() {
  const h = world.hero;
  if (!h || !hasAbility('frenzy')) return;
  if (!(h.frenzyT > 0)) say1('FRENZY!', C.coral);
  h.frenzyT = 3;
}
// swings run faster while FRENZY is up
// (and the attack speed perks always)
export const swingMult = h => (hasAbility('frenzy') && h.frenzyT > 0 ? 0.72 : 1) / (1 + heroStats().attackSpeed);
export const critBonus = h => (hasAbility('lucky') ? 0.15 : 0) + heroStats().crit;
export const bigFoeMult = e => (hasAbility('giantslayer') && (e.elite || e.boss || e.swarmBoss) ? 1.25 : 1);

// the hero is about to take a hit: true if a bubble ate it
export function abilityBlock(h) {
  if (!hasAbility('bubble') || world.t < (h.bubbleAt || 0)) return false;
  h.bubbleAt = world.t + 8;
  h.inv = 0.6;
  burst(cx(h), cy(h), 12, 'bubble', ['ice', 'paper', 'sky']);
  sfx.clang();
  say1('POP!', C.ice);
  return true;
}
export function abilityHurt(h) {
  if (!hasAbility('thorns') || h.dead) return;
  for (const e of world.enemies)
    if (!e.dead && Math.abs(cx(e) - cx(h)) < 48 && Math.abs(cy(e) - cy(h)) < 36) hitEnemy(e, hitDamage(h.weapon) * 1.2, { dir: Math.sign(cx(e) - cx(h)) || 1, knock: 24, chain: true, sparkCol: C.leaf });
  burst(cx(h), cy(h), 10, 'chip', ['leaf', 'lime', 'pine']);
  say1('BITES BACK!', C.leaf);
}
// DASH CUT: everything the dash passes through gets sliced once
export function dashCut(h) {
  if (!hasAbility('dashcut')) return;
  h.dashHit = h.dashHit || new Set();
  for (const e of world.enemies) {
    if (e.dead || e.spawnT > 0 || h.dashHit.has(e) || !overlap(h, e)) continue;
    h.dashHit.add(e);
    hitEnemy(e, hitDamage(h.weapon) * 1.1, { dir: h.face, knock: 14, chain: true, sparkCol: C.paper });
  }
}

export function updateAbilities(dt) {
  const h = world.hero;
  if (h) h.frenzyT = Math.max(0, (h.frenzyT || 0) - dt);
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.vy += 700 * dt;
    m.y += m.vy * dt;
    if (Math.random() < 0.8) emit(m.x + (Math.random() - 0.5) * 4, m.y - 4, 'dot', Math.random() < 0.5 ? C.orange : C.gold);
    if (m.y < m.ty) continue;
    meteors.splice(i, 1);
    for (const e of world.enemies)
      if (!e.dead && Math.abs(cx(e) - m.x) < 26 && Math.abs(e.y + e.h - m.ty) < 30) hitEnemy(e, m.dmg, { dir: Math.sign(cx(e) - m.x) || 1, knock: 20, hop: true, chain: true, sparkCol: C.orange });
    spark(m.x, m.ty - 2, { big: true, col: C.orange });
    burst(m.x, m.ty - 2, 8, 'chip', ['orange', 'gold', 'stone']);
    shake(0.25);
  }
}
export function drawAbilities(t) {
  for (const m of meteors) {
    const x = Math.round(m.x), y = Math.round(m.y);
    rect(x - 4, y - 4, 9, 9, C.ink);
    rect(x - 3, y - 3, 7, 7, C.orange);
    rect(x - 2, y - 3, 4, 3, C.gold);
    px(x - 1, y - 2, C.cream);
  }
  const h = world.hero;
  // a ready BUBBLE GUARD shimmers around the hero
  if (h && !h.dead && hasAbility('bubble') && world.t >= (h.bubbleAt || 0)) {
    const r = 15, n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.8;
      px(Math.round(cx(h) + Math.cos(a) * r * 0.75), Math.round(cy(h) + Math.sin(a) * r), i % 3 ? C.ice : C.paper);
    }
  }
}
export function clearAbilities() { meteors.length = 0; }
