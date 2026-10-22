import { ENEMIES } from './enemies.js';
// The run's introduction schedule. All random loot and the director use these gates.
// One new idea at a time: finishers -> elements -> build-defining mutations. Weapon types are all
// open from the start.
// Every weapon type drops from the very first map, all at the same odds, so no class is ahead
// before you specialize (Blades has five types to the others' four, but each type is equal).
export const TYPE_UNLOCKS = {
  sword: 0, dagger: 0, bow: 0, hammer: 0, staff: 0, katana: 0,
  nunchucks: 0, shuriken: 0, wand: 0,
  spear: 0, axe: 0, boomerang: 0, scythe: 0
};
// elements and powers open early so the first maps already drop weapons worth showing off
export const ELEMENT_UNLOCKS = {
  fire: 0, ice: 0, poison: 1, water: 1, lightning: 2, earth: 2,
  wind: 3, radiant: 4, plasma: 5, void: 6
};
export const MUTATIONS = {
  echo: { zone: 0, q: 2, label: 'ECHO CUT', desc: 'Finishers strike a second time.', col: 'sky' },
  seeker: { zone: 1, q: 3, label: 'HUNGRY STEEL', desc: 'Hits launch a seeking splinter.', col: 'lime' },
  eruption: { zone: 2, q: 4, label: 'FAULTLINE', desc: 'Finishers erupt beneath nearby foes.', col: 'orange' },
  orbit: { zone: 4, q: 5, label: 'BLADE HALO', desc: 'Three blades orbit and bite.', col: 'violet' },
  cataclysm: { zone: 6, q: 7, label: 'MOON BREAKER', desc: 'Every third attack tears open the arena.', col: 'gold' }
};
// a flat ceiling: zone 1 already rolls up to Epic, then about a tier a zone, so ABSURD still waits for the last one
export const maxRarity = zone => Math.min(10, 3 + Math.floor(Math.max(0, zone) * 0.8));
export const availableTypes = zone => Object.keys(TYPE_UNLOCKS).filter(k => TYPE_UNLOCKS[k] <= zone);
export const availableElements = zone => Object.keys(ELEMENT_UNLOCKS).filter(k => ELEMENT_UNLOCKS[k] <= zone);
export const availableMutations = (zone, q) => Object.keys(MUTATIONS).filter(k => MUTATIONS[k].zone <= zone && MUTATIONS[k].q <= q);
export function mutationLabel(w) { return w.mutation ? MUTATIONS[w.mutation].label : w.family ? w.family.toUpperCase() : 'PURE STEEL'; }
// First three waves only teach approaching, jumping and countering. New counters arrive later.
export const ENEMY_UNLOCKS = {
  stalker: 0, crawler: 0, goose: 2, bombchicken: 3, wizard: 4, shieldbro: 5, blinker: 7,
  brute: 8, roller: 9, taxman: 12, mimic: 13, sniper: 14, summoner: 16,
  eyeball: 17, wraith: 24, maw: 25, flyer: 28,
  // each weapon zone's own residents show up from its first wave
  squirrel: 4, turtle: 8, raccoon: 12, samurai: 16, kitsune: 17, monk: 20, anvil: 24, ninja: 32
};
// A beastkin family (ENEMIES[k].evo) grows up along its world's road instead of by stage: the
// first level meets ranks 1-3, each level after lets the next rank in (deeper rooms one sooner),
// and the old ranks drop out six behind the newest. tier: how far along the road the level is
// (families.js levelTier); without one (classic runs) the map's depth stands in for it.
export const familyTop = (wave, tier) => Math.min(10, tier != null ? 3 + Math.round(tier * 7) + (wave >= 3 ? 1 : 0) : wave * 3 - 1);
export function enemyPool(zone, wave, pool, tier) {
  if (pool.length && pool.every(k => ENEMIES[k]?.evo)) {
    const top = familyTop(wave, tier);
    return pool.filter(k => ENEMIES[k].evo <= top && ENEMIES[k].evo > top - 6);
  }
  const stage = zone * 4 + Math.max(0, wave - 1);
  const allowed = pool.filter(k => (ENEMY_UNLOCKS[k] ?? 0) <= stage);
  return allowed.length ? allowed : ['stalker'];
}
export function waveBudget(zone, wave) {
  return { count: Math.min(22, 3 + zone + wave * 2), alive: Math.min(10, 2 + Math.floor(wave / 2) + Math.floor(zone / 2)),
    elites: zone === 0 ? (wave === 4 ? 1 : 0) : wave >= 2 ? 1 + Math.floor((zone + wave) / 5) : 0,
    interval: Math.max(0.48, 1.15 - zone * 0.055 - wave * 0.045) };
}
