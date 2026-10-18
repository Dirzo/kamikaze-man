// Weapon generation and the numbers a weapon produces.
import { TYPES, TYPE_LIST, ELEMENT_LIST, RARITY } from '../data/weapons.js';
import { nameWeapon } from '../data/names.js';
import { refHP, share, STANDOUT_SHARE, standoutChance } from '../data/curve.js';

let uid = 1;

// highest rarity that can drop in a zone (elites +1, bosses +2): zone 1 tops out at Uncommon, the
// absurd tier only shows up at the very end
export const maxQ = zone => Math.min(10, zone + 1);

export function makeWeapon(zone, { elite = false, boss = false, standout = null, q = null, type = null } = {}) {
  const r = Math.random;
  type = type || TYPE_LIST[Math.floor(r() * TYPE_LIST.length)];
  if (q == null) {
    const top = maxQ(zone) + (elite ? 1 : 0) + (boss ? 2 : 0);
    q = Math.min(10, Math.floor((top + 0.99) * Math.pow(r(), elite || boss ? 1.3 : 1.9)));
    if (boss) q = Math.max(q, Math.min(10, zone + 1));
  }
  // elements start appearing in zone 2, more often on rarer weapons
  const family = zone > 0 && r() < 0.04 + 0.04 * q ? ELEMENT_LIST[Math.floor(r() * ELEMENT_LIST.length)] : null;
  if (standout == null) standout = r() < standoutChance(zone);
  // standouts are named one tier grander, but never beyond what the zone allows
  const { name, look } = nameWeapon(type, q, family, standout, r, Math.min(10, maxQ(zone) + 1));
  return { uid: uid++, type, q, family, standout, home: zone, name, look };
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
    look: { q: 0, base: 'Sword', family: null, cond: 'Plain' }
  };
}

// damage of one hit at move multiplier 1, used in zone `zoneNow`
export function hitDamage(w) {
  const T = TYPES[w.type];
  return refHP(w.home) * (w.standout ? STANDOUT_SHARE : share(w.q) * T.hit);
}
// relative strength in the current zone (for the HUD and auto-equip): damage per second
export function dps(w) {
  return hitDamage(w) / TYPES[w.type].cd;
}
export const rarityName = w => RARITY[w.q].name;
