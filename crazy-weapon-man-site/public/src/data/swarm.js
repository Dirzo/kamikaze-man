// Survival swarm numbers: the combo meter and the unique boss that ends each zone's swarm.

// Every hit during the swarm adds to the combo; it falls off when you stop hitting things for
// `window(n)` seconds (shorter as it grows). Each 5 hits is +1% damage, up to +30%.
export const COMBO = { window: n => Math.max(1.2, 2.2 - n * 0.01), per: 5, step: 0.01, max: 0.3, shardsPer: 4 };
export const comboMult = c => (c && c.n > 0 ? 1 + Math.min(COMBO.max, Math.floor(c.n / COMBO.per) * COMBO.step) : 1);

// When the swarm timer runs out, this zone's swarm boss shows up (a giant, named resident).
// The swarm keeps coming at half pace until it falls. hp is in refHP(zone) units.
export const SWARM_BOSS = { hp: 9, dmg: 1.6, every: 2, alive: 0.5 };
export const SWARM_BOSSES = [
  { type: 'goose', scale: 3, name: 'MOTHER GOOSE OF THE GRAVES', line: 'HONK. (FINAL FORM)' },
  { type: 'crawler', scale: 3, name: 'THE GREAT SPORE GREMLIN', line: 'I LIVE IN YOUR POCKET NOW' },
  { type: 'brute', scale: 3, name: 'MAGMA OGRE, NEVER CALM', line: 'I AM CALM. I AM SO CALM.' },
  { type: 'shieldbro', scale: 3, name: 'THE FEAST HALL BOUNCER', line: "YOU'RE NOT ON THE LIST" },
  { type: 'summoner', scale: 3, name: 'ARCH-NECROMANCER OF BAD IDEAS', line: 'WHAT IF... MORE BONES?' },
  { type: 'roller', scale: 3, name: 'THE FROZEN HAM WHEEL', line: 'ROLLING IN. SLOWLY. COLDLY.' },
  { type: 'stalker', scale: 3, name: "DAD'S STORM FOREMAN", line: 'WHO TOUCHED MY THERMOSTAT' },
  { type: 'wraith', scale: 3, name: "GRANDMA'S HAUNTED CASSEROLE", line: 'EAT YOUR VEGETABLES' },
  { type: 'sniper', scale: 3, name: "STEVEN, STEVE'S BIGGER BROTHER", line: 'STEVE MISSED ONCE. I DID NOT.' },
  { type: 'eyeball', scale: 3, name: 'THE VAULT SEES ALL', line: 'I SAW YOU LOOT THAT' }
];
