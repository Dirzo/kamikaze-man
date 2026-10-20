// The weapon lock in play (rules in data/meta.js). While you are specialized, a weapon of another
// class that drops bursts into shards on the spot, worth more the rarer it was; the guaranteed
// drops (bosses, secrets, a map's gift) roll a weapon of your class instead. Off-class weapons
// you already carry are turned into shards when a level starts.
import { C } from '../config.js';
import { world } from './world.js';
import { CLASSES, weaponLock, allowedType } from '../data/meta.js';
import { callout } from './fx.js';
import { toast } from './progress.js';
import { dps } from './loot.js';

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
    if (!w || allowedType(w.type) || w.locked) return w;
    n += convertValue(w);
    return null;
  });
  if (h && !allowedType(h.weapon.type)) {
    const best = world.bag.filter(w => w && allowedType(w.type)).sort((a, b) => dps(b) - dps(a))[0];
    if (best) {
      world.bag[world.bag.indexOf(best)] = null;
      n += convertValue(h.weapon);
      h.weapon = best;
    }
  }
  if (n) {
    toast('bag', { head: `${CLASSES[weaponLock()].name} ONLY: OTHER WEAPONS MELTED DOWN`, name: `+${n} SHARDS` });
  }
  return n;
}
