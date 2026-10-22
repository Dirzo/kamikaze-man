// Weapon generation and the numbers a weapon produces.
import { TYPES, RARITY, MOVES, RECOVERY } from '../data/weapons.js';
import { nameWeapon } from '../data/names.js';
import { refHP, share, STANDOUT_SHARE, standoutChance } from '../data/curve.js';

import { maxRarity, availableTypes, availableElements, availableMutations } from '../data/progression.js';
import { quirkFor } from '../data/quirks.js';
import { rollAbility } from '../data/abilities.js';
import { profMult } from '../data/proficiency.js';
import { world } from './world.js';
import { lustMult } from '../data/lust.js';
import { comboMult } from '../data/swarm.js';
import { stats, weaponLock, allowedType, CLASSES } from '../data/meta.js';
import { temper } from '../data/temper.js';
let uid = 1;
// what the hero has grown into with a type: its mastery level and every damage perk
const growth = type => profMult(type) * (1 + stats(type).dmg);

// All sources share the zone ceiling: zone 1 tops out at Epic; the
// absurd tier only shows up at the very end
export const maxQ = maxRarity;

export function makeWeapon(zone, { elite = false, boss = false, standout = null, q = null, type = null } = {}) {
  const r = Math.random;
  const types = availableTypes(zone);
  // every type is equally likely (a zone's own weapon still arrives as its map-clear gift)
  type = type || types[Math.floor(r() * types.length)];
  if ((boss || standout === true) && weaponLock()) type = classType(type); // a guaranteed prize is always one you can use
  if (q == null) {
    const top = maxQ(zone);
    q = Math.min(10, Math.floor((top + 0.99) * Math.pow(r(), elite || boss ? 0.85 : 1.2)));
    if (boss) q = top; // a boss always pays out the zone's best tier
  }
  // TEMPER: rarer weapons, past the zone's usual ceiling
  if (world.temper) q += temper(world.temper).rarity;
  // elements show up from the first map, more often on rarer weapons
  q = Math.max(0, Math.min(10, q));
  const elements = availableElements(zone);
  const family = elements.length && r() < (boss ? 0.7 : 0.2 + 0.06 * q) ? elements[Math.floor(r() * elements.length)] : null;
  const mutations = availableMutations(zone, q);
  const mutation = mutations.length && (boss || r() < 0.18 + q * 0.025) ? mutations[Math.floor(r() * mutations.length)] : null;
  if (standout == null) standout = r() < standoutChance(zone) + stats().standout + temper(world.temper).standout;
  // standouts are named one tier grander, but never beyond what the zone allows
  const ability = rollAbility(q, { standout, boss }, r);
  const { name, look } = nameWeapon(type, q, family, standout, r, Math.min(10, Math.max(q, maxQ(zone)) + 1), ability);
  return { uid: uid++, type, q, family, mutation, standout, home: zone, name, look, quirk: quirkFor(look, r), ability };
}

// a weapon loaded from a save gets a new id (looks are cached by id)
export const freshUid = w => ((w.uid = uid++), w);

// a type of your specialization's class for a drop that must be a weapon you can use
export function classType(type) {
  if (allowedType(type)) return type;
  const T = CLASSES[weaponLock()].types;
  return T[Math.floor(Math.random() * T.length)];
}
// the first weapon: a sword, or your specialization's own starter
export function trainingSword() {
  const STARTER = weaponLock() ? CLASSES[weaponLock()].starter : 'sword', BASE = STARTER[0].toUpperCase() + STARTER.slice(1);
  return {
    uid: uid++,
    type: STARTER,
    q: 0,
    family: null,
    standout: false,
    home: 0,
    name: 'Training ' + BASE,
    look: { q: 0, base: BASE, family: null, cond: 'Plain' },
    quirk: 'bonk'
  };
}

// damage of one hit at move multiplier 1, including the hero's proficiency with this weapon type,
// the damage perks (meta.js) and, for the weapon in hand, the Weapon Lust bonus
export function hitDamage(w) {
  const T = TYPES[w.type],
    h = world.hero;
  return refHP(w.home) * (w.standout ? STANDOUT_SHARE : share(w.q) * T.hit) * (w.boost || 1) * growth(w.type) * (h && h.weapon === w ? lustMult(h) * comboMult(world.swarmCombo) : 1);
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

// A new weapon is never a downgrade: any drop that rolls weaker than the one in your hand is pumped
// up (w.boost) to match it, plus a little extra, so every pickup is worth a swing. The match stops
// at par, the best this drop's zone can roll (a standout of the strongest type, with an element and
// the top power): past that the extra compounded on every pickup and a run's weapon outgrew the
// zones ~3x each (playtest: 50x enemy health per hit by zone 8).
export function noWeaker(w) {
  const h = world.hero;
  if (!w || !h || !h.weapon || h.weapon === w) return w;
  const par = Math.max(...Object.keys(TYPES).map(type => powerScore({ ...w, type, standout: true, boost: 1, mutation: 'cataclysm', family: w.family || 'fire' })));
  const held = Math.min(par, powerScore(h.weapon) / (lustMult(h) * comboMult(world.swarmCombo)));
  const mine = powerScore(w);
  if (mine < held) w.boost = (w.boost || 1) * (held / mine) * (1 + Math.random() * 0.1);
  return w;
}

// the held weapon's damage per second without the moment-to-moment Weapon Lust and combo bonuses
export function steadyDps() {
  const h = world.hero;
  return h && h.weapon ? dps(h.weapon) / (lustMult(h) * comboMult(world.swarmCombo)) : 0;
}
// what bosses measure the hero by when they arrive: the gear alone. Mastery and perks are left out,
// so getting stronger the long way (shards, trophies, mastery) really does shorten boss fights.
export const baseDps = () => (world.hero?.weapon ? steadyDps() / growth(world.hero.weapon.type) : 0);
