// Weapon generation and the numbers a weapon produces.
import { TYPES, RARITY, MOVES, RECOVERY } from '../data/weapons.js';
import { nameWeapon } from '../data/names.js';
import { refHP, share, STANDOUT_SHARE, standoutChance } from '../data/curve.js';

import { maxRarity, availableTypes, availableElements, availableMutations } from '../data/progression.js';
import { quirkFor } from '../data/quirks.js';
import { profMult } from '../data/proficiency.js';
import { world } from './world.js';
import { lustMult } from '../data/lust.js';
let uid = 1;

// All sources share the zone ceiling: zone 1 tops out at Uncommon; the
// absurd tier only shows up at the very end
export const maxQ = maxRarity;

export function makeWeapon(zone, { elite = false, boss = false, standout = null, q = null, type = null } = {}) {
  const r = Math.random;
  const types = availableTypes(zone);
  type = type || types[Math.floor(r() * types.length)];
  if (q == null) {
    const top = maxQ(zone);
    q = Math.min(10, Math.floor((top + 0.99) * Math.pow(r(), elite || boss ? 1.3 : 1.9)));
    if (boss) q = Math.max(q, Math.min(10, zone + 1));
  }
  // elements start appearing in zone 2, more often on rarer weapons
  q = Math.max(0, Math.min(10, q));
  const elements = availableElements(zone);
  const family = elements.length && r() < (boss ? 0.7 : 0.12 + 0.055 * q) ? elements[Math.floor(r() * elements.length)] : null;
  const mutations = availableMutations(zone, q);
  const mutation = mutations.length && (boss || r() < 0.18 + q * 0.025) ? mutations[Math.floor(r() * mutations.length)] : null;
  if (standout == null) standout = r() < standoutChance(zone);
  // standouts are named one tier grander, but never beyond what the zone allows
  const { name, look } = nameWeapon(type, q, family, standout, r, Math.min(10, maxQ(zone) + 1));
  return { uid: uid++, type, q, family, mutation, standout, home: zone, name, look, quirk: quirkFor(look, r) };
}

export function trainingSword() {
  return {
    uid: uid++,
    type: 'sword',
    q: 0,
    family: null,
    standout: false,
    home: 0,
    name: 'Training Sword',
    look: { q: 0, base: 'Sword', family: null, cond: 'Plain' },
    quirk: 'bonk'
  };
}

// damage of one hit at move multiplier 1, including the hero's proficiency with this weapon type
// and, for the weapon in hand, the Weapon Lust bonus
export function hitDamage(w) {
  const T = TYPES[w.type],
    h = world.hero;
  return refHP(w.home) * (w.standout ? STANDOUT_SHARE : share(w.q) * T.hit) * profMult(w.type) * (h && h.weapon === w ? lustMult(h) : 1);
}
// relative strength in the current zone (for the HUD and auto-equip): damage per second
export function dps(w) {
  const T = TYPES[w.type];
  // Full three-hit cycle including finisher recovery; compare like with like.
  const mult = T.melee ? T.combo.reduce((n, k) => n + MOVES[k].mult, 0) / T.combo.reduce((n, k) => n + MOVES[k].dur, 0) : 1;
  return hitDamage(w) * mult / (T.cd + (T.melee ? RECOVERY / 3 : 0));
}
export const rarityName = w => RARITY[w.q].name;

// Estimated utility for auto-equip. Preserve build-defining powers against tiny raw-DPS gains.
// The HUD still reports actual direct DPS. Proc damage and control are explicit utility premiums.
export function powerScore(w) {
  const bonus = {echo:1.18,seeker:1.3,eruption:1.28,orbit:1.3,cataclysm:1.45}[w.mutation] || 1;
  return dps(w) * bonus * (w.family ? 1.12 : 1);
}
