// Survival swarm numbers: the combo meter and the unique boss that ends each zone's swarm.

// Every hit during the swarm adds to the combo; it falls off when you stop hitting things for
// `window(n)` seconds (shorter as it grows). Each 5 hits is +1% damage, up to +30%.
export const COMBO = { window: n => Math.max(1.2, 2.2 - n * 0.01), per: 5, step: 0.01, max: 0.3, shardsPer: 4 };
export const comboMult = c => (c && c.n > 0 ? 1 + Math.min(COMBO.max, Math.floor(c.n / COMBO.per) * COMBO.step) : 1);

// Every level's boss (data/families.js) crashes into the survival swarm a few seconds in (the
// moment is a surprise; a themed warning comes just before). The swarm keeps coming at a third of
// its size, `every` times slower, until the boss falls.
export const SWARM_BOSS = { every: 3, alive: 0.3 };
// no single hit takes more than `hitCap` of a boss's health (a lucky weapon used to delete them in
// 3-10 seconds); their health is set in bosses.js startBoss from families.js ROLES
export const BOSS_TOUGH = { hitCap: 0.05 };
export const BOSS_ARRIVES = { min: 6, spread: 5, warn: 1.6 };
