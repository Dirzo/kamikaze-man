// The run's introduction schedule. All random loot and the director use these gates.
// One new idea at a time: basic weapons -> finishers -> elements -> build-defining mutations.
export const TYPE_UNLOCKS = {
  sword: 0, dagger: 0, bow: 0, hammer: 1, staff: 1, katana: 2,
  nunchucks: 2, shuriken: 3, wand: 4,
  spear: 1, axe: 2, boomerang: 3, scythe: 5
};
export const ELEMENT_UNLOCKS = {
  fire: 1, ice: 1, poison: 2, water: 2, lightning: 3, earth: 3,
  wind: 4, radiant: 5, plasma: 6, void: 7
};
export const MUTATIONS = {
  echo: { zone: 2, q: 2, label: 'ECHO CUT', desc: 'Finishers strike a second time.', col: 'sky' },
  seeker: { zone: 3, q: 3, label: 'HUNGRY STEEL', desc: 'Hits launch a seeking splinter.', col: 'lime' },
  eruption: { zone: 4, q: 4, label: 'FAULTLINE', desc: 'Finishers erupt beneath nearby foes.', col: 'orange' },
  orbit: { zone: 6, q: 6, label: 'BLADE HALO', desc: 'Three blades orbit and bite.', col: 'violet' },
  cataclysm: { zone: 8, q: 8, label: 'MOON BREAKER', desc: 'Every third attack tears open the arena.', col: 'gold' }
};
export const maxRarity = zone => Math.min(10, Math.max(1, zone + 1));
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
export function enemyPool(zone, wave, pool) {
  const stage = zone * 4 + Math.max(0, wave - 1);
  const allowed = pool.filter(k => (ENEMY_UNLOCKS[k] ?? 0) <= stage);
  return allowed.length ? allowed : ['stalker'];
}
export function waveBudget(zone, wave) {
  return { count: Math.min(22, 3 + zone + wave * 2), alive: Math.min(10, 2 + Math.floor(wave / 2) + Math.floor(zone / 2)),
    elites: zone === 0 ? (wave === 4 ? 1 : 0) : wave >= 2 ? 1 + Math.floor((zone + wave) / 5) : 0,
    interval: Math.max(0.48, 1.15 - zone * 0.055 - wave * 0.045) };
}
