// Weapon abilities: a named power on top of the quirk, rolled on Uncommon and better weapons (and on
// every standout and boss drop). The weapon's name says so: "..., Caller of Small Meteors".
// Effects live in game/abilities.js; `clause` words are appended by names.js.
export const ABILITIES = {
  meteor: { label: 'METEOR CALLER', desc: 'Combo finishers call a small meteor down on the foe.', col: 'orange', clause: ['Caller of Small Meteors', 'Who Asks the Sky for Help'] },
  vampire: { label: 'THIRSTY', desc: 'Hits sip a little health back for you.', col: 'red', clause: ['the Thirsty', 'Who Drinks Ketchup', 'Sipper of Life'] },
  thorns: { label: 'BITES BACK', desc: 'Getting hit lashes every foe nearby.', col: 'leaf', clause: ['Who Bites Back', 'the Prickly'] },
  hops: { label: 'DOUBLE JUMP', desc: 'Jump again in mid-air.', col: 'sky', clause: ['of Many Hops', 'Who Jumps on Air'] },
  dashcut: { label: 'DASH CUT', desc: 'Dashing through foes slices them.', col: 'mist', clause: ['Who Cuts While Running', 'the Hasty'] },
  frenzy: { label: 'FRENZY', desc: 'Kills make you swing faster for a few seconds.', col: 'coral', clause: ['Who Gets Faster and Faster', 'the Caffeinated'] },
  lucky: { label: 'LUCKY', desc: '+15% critical hit chance.', col: 'lime', clause: ['of Suspicious Luck', 'Who Found a Clover'] },
  bubble: { label: 'BUBBLE GUARD', desc: 'A bubble pops instead of you every 8 seconds.', col: 'ice', clause: ['Who Wears a Bubble', 'the Well-Wrapped'] },
  giantslayer: { label: 'GIANT SLAYER', desc: '+25% damage to elites and bosses.', col: 'gold', clause: ['Bane of Big Things', 'Toppler of Giants'] }
};
export const ABILITY_LIST = Object.keys(ABILITIES);
export const abilityChance = (q, { standout = false, boss = false } = {}) => (standout || boss ? 1 : q < 1 ? 0 : Math.min(0.8, 0.35 + 0.05 * q));
export function rollAbility(q, o = {}, r = Math.random) {
  return r() < abilityChance(q, o) ? ABILITY_LIST[Math.floor(r() * ABILITY_LIST.length)] : null;
}
