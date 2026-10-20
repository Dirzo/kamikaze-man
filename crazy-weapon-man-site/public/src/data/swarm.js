// Survival swarm numbers: the combo meter and the unique boss that ends each zone's swarm.

// Every hit during the swarm adds to the combo; it falls off when you stop hitting things for
// `window(n)` seconds (shorter as it grows). Each 5 hits is +1% damage, up to +30%.
export const COMBO = { window: n => Math.max(1.2, 2.2 - n * 0.01), per: 5, step: 0.01, max: 0.3, shardsPer: 4 };
export const comboMult = c => (c && c.n > 0 ? 1 + Math.min(COMBO.max, Math.floor(c.n / COMBO.per) * COMBO.step) : 1);

// Every zone's boss crashes into the survival swarm a few seconds in (the moment is a surprise; a
// themed warning comes just before). Zones without a story boss get a swarm boss: a giant, named
// resident that also fires its zone's themed `moves` (bosses.js castMove) every few seconds and
// pulls its `surprise` at half health. The swarm keeps coming at half pace until the boss falls.
// hp is in refHP(zone) units.
export const SWARM_BOSS = { hp: 12, dmg: 1.6, every: 2, alive: 0.5, moveEvery: 4.2 };
export const BOSS_ARRIVES = { min: 6, spread: 5, warn: 1.6 };
export const SWARM_BOSSES = [
  { type: 'goose', scale: 3, name: 'MOTHER GOOSE OF THE GRAVES', line: 'HONK. (FINAL FORM)', moves: ['graves'], surprise: 'honk', warn: 'A HONK ECHOES FROM THE GRAVES...' },
  { type: 'squirrel', scale: 3, name: 'THE ACORN ARCHER KING', line: 'I NEVER MISS. TWICE.', moves: ['arrows'], surprise: 'volley', warn: 'THE CANOPY RUSTLES...' },
  { type: 'turtle', scale: 3, name: 'GRANDMASTER SHELLDON', line: 'NUNCHUCKS ARE A LIFESTYLE', moves: ['tide', 'shell'], surprise: 'surf', warn: 'THE TIDE IS GOING OUT... FAST' },
  { type: 'raccoon', scale: 3, name: 'THE RACCOON KINGPIN', line: "EVERYTHING HERE IS STOLEN. EVEN ME.", moves: ['smoke'], surprise: 'decoys', warn: 'YOUR POCKETS FEEL LIGHTER...' },
  { type: 'samurai', scale: 3, name: 'THE PETAL SHOGUN', line: 'ONE CUT. MAYBE TWO.', moves: ['iai', 'petals'], surprise: 'storm', warn: 'THE PETALS STOP FALLING...' },
  { type: 'monk', scale: 3, name: 'THE ABBOT OF AVALANCHES', line: 'BE STILL. NOW ROLL.', moves: ['avalanche'], surprise: 'avalanche', warn: 'THE MOUNTAIN GROANS...' },
  { type: 'anvil', scale: 3, name: "DAD'S FAVOURITE ANVIL", line: 'CLANG. (AFFECTIONATE)', moves: ['molten'], surprise: 'overheat', warn: 'SOMEONE LEFT THE FORGE ON HIGH' },
  { type: 'wraith', scale: 3, name: "GRANDMA'S HAUNTED CASSEROLE", line: 'EAT YOUR VEGETABLES', moves: ['cookies', 'sparkles'], surprise: 'helpings', warn: 'SOMETHING SMELLS LIKE CASSEROLE...' },
  { type: 'ninja', scale: 3, name: 'THE SHADOW INTERN', line: 'I AM UNPAID AND UNSEEN', moves: ['stars', 'vanish'], surprise: 'clones', warn: 'A SHADOW MOVES ON THE ROOF...' },
  { type: 'eyeball', scale: 3, name: 'THE VAULT SEES ALL', line: 'I SAW YOU LOOT THAT', moves: ['graves', 'stars'], surprise: 'arsenal', warn: 'EVERY WEAPON YOU DROPPED IS HUMMING...' }
];
