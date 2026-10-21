// The weapon lock in play (rules in data/meta.js). While you are specialized, a weapon of another
// class that drops bursts into shards on the spot, worth more the rarer it was; the guaranteed
// drops (bosses, secrets, a map's gift) roll a weapon of your class instead. Off-class weapons
// you already carry (locked ones too) are turned into shards when a level starts, and an off-class
// weapon in your hand is swapped for the best of your class in the bag, or reforged as one of your
// class at the same power if the bag has none. An off-class weapon can never be equipped or swung.
import { C } from '../config.js';
import { world } from './world.js';
import { CLASSES, weaponLock, allowedType } from '../data/meta.js';
import { callout } from './fx.js';
import { toast } from './progress.js';
import { dps, makeWeapon, powerScore } from './loot.js';

// shards a converted weapon is worth: rarity and the zone it came from
export const convertValue = (w, zone = world.zone || 0) => Math.round((3 + w.q * 1.6 + (w.standout ? 6 : 0)) * (1 + zone * 0.18));
// called with each weapon about to drop: true when it was turned into shards instead
export function convertDrop(x, y, w, dropShards) {
  if (allowedType(w.type)) return false;
  const n = convertValue(w);
  dropShards(x, y, Math.min(8, n), n);
  callout(`+${n} SHARDS`, 0, 0, C.ice, { follow: { x, y, w: 0 }, life: 40 });
  return true;
}
// at the start of a level: carried off-class weapons are melted down, and if the weapon in hand
// is off-class, the best one of your class in the bag takes its place. Returns the shards, which
// the caller banks.
export function applyLock() {
  if (!weaponLock()) return 0;
  const h = world.hero;
  let n = 0;
  world.bag = world.bag.map(w => {
    if (!w || allowedType(w.type)) return w;
    n += convertValue(w);
    return null;
  });
  if (world.quick && !allowedType(world.quick.item.type)) world.quick = null;
  n += keepInClass(false);
  if (n) {
    toast('bag', { head: `${CLASSES[weaponLock()].name} ONLY: OTHER WEAPONS MELTED DOWN`, name: `+${n} SHARDS` });
  }
  return n;
}
// the weapon in hand must be of your class: the best of your class in the bag takes its place (the
// old one melts, and its shards are returned), or with none in the bag it is reforged in the
// smithy of your class: the same rarity and power, the starter type's shape. Checked every frame
// in play, so nothing (an old save, a quick-equip, a gift) can put an off-class weapon in your hand.
export function keepInClass(announce = true) {
  const h = world.hero;
  if (!weaponLock() || !h?.weapon || allowedType(h.weapon.type)) return 0;
  const old = h.weapon, best = world.bag.filter(w => w && allowedType(w.type)).sort((a, b) => dps(b) - dps(a))[0];
  h.attack = null;
  if (best) {
    world.bag[world.bag.indexOf(best)] = null;
    h.weapon = best;
    const n = convertValue(old);
    if (announce) world.shards += n;
    if (announce) callout(`${CLASSES[weaponLock()].name} ONLY! +${n} SHARDS`, 0, 0, C.ice, { follow: h, life: 60 });
    return announce ? 0 : n;
  }
  h.weapon = reforge(old);
  if (announce) callout(`REFORGED AS A ${h.weapon.type.toUpperCase()}`, 0, 0, C.gold, { follow: h, life: 70 });
  return 0;
}
// an off-class weapon remade as your class's starter type at (at least) the same power
export function reforge(w) {
  const type = CLASSES[weaponLock()].starter, out = makeWeapon(w.home ?? 0, { type, q: w.q, standout: !!w.standout });
  const want = powerScore(w), got = powerScore(out);
  if (got < want) out.boost = (out.boost || 1) * (want / got);
  out.used = w.used;
  return out;
}
