// Weapon types, rarities, elements. Per-hit damage = refHP(home zone) * share(q) * hit * move mult
// (see curve.js), so faster weapons hit lighter and every type has similar damage per second.
//
// All attack animations, release times and finisher recovery run 25% faster.
export const ATTACK_SPEED = 1.25;
// melee fields: cd (s between swings), reach/height (hitbox px in front of the hand), knock (px push)
// ranged fields: speed (px/s), pierce, homing
export const TYPES = {
  sword: { melee: true, cd: 0.34 / ATTACK_SPEED, reach: 27, height: 24, hit: 1.25, knock: 20, combo: ['slashDown', 'slashUp', 'slashBig'], special: 'whirl', specialName: 'WHIRLWIND', cool: 5 },
  dagger: { melee: true, cd: 0.24 / ATTACK_SPEED, reach: 18, height: 14, hit: 0.66, knock: 10, combo: ['stab', 'stab', 'stabBig'], special: 'flurry', specialName: 'FLURRY', cool: 4.5 },
  katana: { melee: true, cd: 0.32 / ATTACK_SPEED, reach: 32, height: 18, hit: 1.08, knock: 18, combo: ['slashDown', 'stab', 'slashBig'], special: 'iai', specialName: 'IAI DASH', cool: 4.5 },
  hammer: { melee: true, cd: 0.58 / ATTACK_SPEED, reach: 25, height: 28, hit: 2.2, knock: 32, hop: true, combo: ['smash', 'smash', 'smashBig'], special: 'quake', specialName: 'QUAKE', cool: 6 },
  nunchucks: { melee: true, cd: 0.26 / ATTACK_SPEED, reach: 22, height: 20, hit: 0.72, knock: 12, combo: ['spin', 'spin', 'spinBig'], special: 'cyclone', specialName: 'CYCLONE', cool: 5.5 },
  staff: { melee: true, cd: 0.4 / ATTACK_SPEED, reach: 36, height: 14, hit: 1.3, knock: 24, combo: ['stab', 'slashUp', 'stabBig'], special: 'vault', specialName: 'VAULT SLAM', cool: 5.5 },
  bow: { melee: false, cd: 0.44 / ATTACK_SPEED, hit: 1.25, knock: 14, speed: 320, pierce: 0, special: 'volley', specialName: 'VOLLEY', cool: 5 },
  shuriken: { melee: false, cd: 0.3 / ATTACK_SPEED, hit: 0.8, knock: 10, speed: 250, pierce: 1, spin: true, special: 'storm', specialName: 'STAR STORM', cool: 5 },
  wand: { melee: false, cd: 0.36 / ATTACK_SPEED, hit: 1.05, knock: 12, speed: 190, pierce: 0, homing: 3, special: 'nova', specialName: 'NOVA', cool: 5.5 }
};
export const TYPE_LIST = Object.keys(TYPES);
export const RECOVERY = 0.12 / ATTACK_SPEED; // extra pause after the last hit of a combo

// combo moves: damage multiplier, swing arc (degrees from -> to, 0 = forward), duration split
export const MOVES = {
  slashDown: { mult: 1, from: -110, to: 40, dur: 1 },
  slashUp: { mult: 1, from: 60, to: -100, dur: 1 },
  slashBig: { mult: 1.35, from: -140, to: 70, dur: 1.25, big: true },
  stab: { mult: 1, from: 0, to: 0, thrust: 10, dur: 0.9 },
  stabBig: { mult: 1.35, from: 0, to: 0, thrust: 16, dur: 1.15, big: true },
  smash: { mult: 1, from: -150, to: 50, dur: 1 },
  smashBig: { mult: 1.4, from: -170, to: 70, dur: 1.2, big: true },
  spin: { mult: 1, from: -180, to: 180, dur: 1 },
  spinBig: { mult: 1.3, from: -360, to: 180, dur: 1.3, big: true }
};

// rarity tiers q = 0..10 (colour = palette name)
export const RARITY = [
  { name: 'Common', col: 'mist' },
  { name: 'Uncommon', col: 'grass' },
  { name: 'Rare', col: 'sky' },
  { name: 'Epic', col: 'violet' },
  { name: 'Heroic', col: 'pink' },
  { name: 'Legendary', col: 'orange' },
  { name: 'Mythic', col: 'gold' },
  { name: 'Relic', col: 'coral' },
  { name: 'Ancient Relic', col: 'cream' },
  { name: 'Divine', col: 'ice' },
  { name: 'ABSURD', col: 'paper' }
];

// elements: family -> name word, adjective prefix, palette colour, effect (see combat.js)
export const ELEMENTS = {
  fire: { word: 'Fire', prefix: 'Blazing', col: 'orange', effect: 'burn' },
  ice: { word: 'Ice', prefix: 'Frostbitten', col: 'ice', effect: 'chill' },
  lightning: { word: 'Lightning', prefix: 'Thunderstruck', col: 'sky', effect: 'chain' },
  poison: { word: 'Poison', prefix: 'Venomous', col: 'lime', effect: 'venom' },
  water: { word: 'Tidal', prefix: 'Soggy', col: 'blue', effect: 'wave' },
  earth: { word: 'Quake', prefix: 'Seismic', col: 'sand', effect: 'stun' },
  wind: { word: 'Gale', prefix: 'Cyclonic', col: 'mist', effect: 'gust' },
  plasma: { word: 'Arcane', prefix: 'Spellcharged', col: 'pink', effect: 'pierce' },
  radiant: { word: 'Radiant', prefix: 'Blinding', col: 'cream', effect: 'holy' },
  void: { word: 'Void', prefix: 'Abyssal', col: 'violet', effect: 'pull' }
};
export const ELEMENT_LIST = Object.keys(ELEMENTS);
