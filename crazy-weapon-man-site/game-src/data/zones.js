// The ten zones, each the home of one weapon (like the Sword Graveyard and the training sword):
// its residents carry it, its loot leans toward it and its exit gift is one. bg/slab keys match the
// shared art export. Platforms are [x, y, width] in px
// (y = top surface). Health/damage curves live in curve.js.
const L1 = [[52, 160, 72], [204, 140, 72], [356, 160, 72]];
const L2 = [[30, 168, 90], [190, 150, 100], [360, 168, 90]];
const L3 = [[96, 156, 81], [303, 156, 81], [200, 116, 81]];
const L4 = [[20, 150, 72], [160, 170, 160], [388, 150, 72]];

export const ZONES = [
  {
    id: 'graveyard',
    weapon: 'sword',
    name: 'The Sword Graveyard',
    sub: 'A field of swords nobody came back for. Mind the bandits.',
    pool: ['stalker', 'crawler', 'goose', 'bombchicken'],
    platforms: L1,
    boss: null,
    music: { key: 52, scale: 'minor', bpm: 132, prog: [0, 5, 2, 6], drums: 'march' }
  },
  {
    id: 'ranger-forest',
    weapon: 'bow',
    name: "The Ranger's Mushroom Forest",
    sub: 'Every toadstool is an archery range. The squirrels never miss twice.',
    pool: ['squirrel', 'crawler', 'squirrel', 'wizard', 'shieldbro', 'goose'],
    platforms: L2,
    boss: null,
    music: { key: 57, scale: 'dorian', bpm: 124, prog: [0, 3, 0, 4], drums: 'groove' }
  },
  {
    id: 'turtle-lagoon',
    weapon: 'nunchucks',
    name: 'Nunchuck Turtle Lagoon',
    sub: 'A beach dojo of shell-backed kids. Jr. trains here. He brought the big sword.',
    pool: ['turtle', 'crawler', 'turtle', 'roller', 'bombchicken', 'shieldbro'],
    platforms: L3,
    boss: 'bossjr',
    music: { key: 50, scale: 'phrygian', bpm: 150, prog: [0, 1, 0, 6], drums: 'drive' }
  },
  {
    id: 'thieves-bazaar',
    weapon: 'dagger',
    name: "The Thieves' Night Bazaar",
    sub: 'Daggers half price. Your wallet, full price. Watch the raccoons.',
    pool: ['raccoon', 'taxman', 'raccoon', 'mimic', 'blinker', 'goose'],
    platforms: L4,
    boss: null,
    music: { key: 55, scale: 'dorian', bpm: 118, prog: [0, 3, 4, 0], drums: 'jig' }
  },
  {
    id: 'sakura-shrine',
    weapon: 'katana',
    name: 'The Sakura Katana Shrine',
    sub: 'Cherry petals, paper lanterns and very small, very serious samurai.',
    pool: ['samurai', 'kitsune', 'samurai', 'shieldbro', 'sniper', 'eyeball'],
    platforms: L1,
    boss: null,
    music: { key: 48, scale: 'harmonic', bpm: 100, prog: [0, 5, 3, 4], drums: 'slow' }
  },
  {
    id: 'mountain-monastery',
    weapon: 'staff',
    name: 'The Mountain Staff Monastery',
    sub: 'The monks spin staves and chant about ham. The Ogre King is meditating. Loudly.',
    pool: ['monk', 'kitsune', 'monk', 'roller', 'summoner', 'sniper'],
    platforms: L3,
    boss: 'bossman',
    music: { key: 54, scale: 'minor', bpm: 128, prog: [0, 5, 6, 4], drums: 'march' }
  },
  {
    id: 'storm-forge',
    weapon: 'hammer',
    name: "Dad's Hammer & Anvil Forge",
    sub: 'Runaway anvils and fatherly advice. Sr. is hammering something loud.',
    pool: ['anvil', 'brute', 'anvil', 'roller', 'bombchicken', 'mimic', 'shieldbro'],
    platforms: L2,
    boss: 'bosssr',
    music: { key: 47, scale: 'minor', bpm: 146, prog: [0, 6, 5, 4], drums: 'drive' }
  },
  {
    id: 'witch-cottage',
    weapon: 'wand',
    name: "Grandma's Magic Wand Cottage",
    sub: 'Cookie tins bite. Casseroles are cursed. Grandma waves her wand from the good chair.',
    pool: ['wraith', 'maw', 'mimic', 'summoner', 'bombchicken', 'crawler', 'goose'],
    platforms: L4,
    boss: 'bossgrandma',
    music: { key: 50, scale: 'harmonic', bpm: 110, prog: [0, 3, 5, 4], drums: 'swing' }
  },
  {
    id: 'ninja-castle',
    weapon: 'shuriken',
    name: 'The Shuriken Ninja Castle',
    sub: 'A moonlit castle full of throwing stars. The CEO bought it. Hostilely.',
    pool: ['ninja', 'samurai', 'ninja', 'kitsune', 'shieldbro', 'eyeball'],
    platforms: L1,
    boss: 'bossceo',
    music: { key: 58, scale: 'major', bpm: 138, prog: [0, 3, 4, 5], drums: 'march' }
  },
  {
    id: 'armory-vault',
    weapon: null, // every weapon lives here
    name: 'The Sentient Armory Vault',
    sub: 'The weapons have organized. The inventory is hunting you.',
    pool: ['wizard', 'wraith', 'mimic', 'eyeball', 'brute', 'flyer', 'samurai', 'ninja', 'anvil', 'turtle'],
    platforms: L3,
    boss: 'bossweapon',
    music: { key: 49, scale: 'minor', bpm: 156, prog: [0, 5, 3, 4], drums: 'drive' }
  }
];

export const WAVES_PER_ZONE = 4;
export const TITLE_MUSIC = { key: 52, scale: 'dorian', bpm: 112, prog: [0, 3, 5, 4], drums: 'title' };
export const BOSS_MUSIC = {
  bossgoose: { key: 52, bpm: 170 },
  bossacorn: { key: 57, bpm: 166 },
  bosskingpin: { key: 55, bpm: 158 },
  bossshogun: { key: 48, bpm: 150 },
  bossjr: { key: 53, bpm: 176 },
  bossman: { key: 45, bpm: 164 },
  bosssr: { key: 47, bpm: 168 },
  bossgrandma: { key: 50, bpm: 160 },
  bossceo: { key: 46, bpm: 172 },
  bossweapon: { key: 44, bpm: 190 }
};
export const bossSong = kind => ({ ...BOSS_MUSIC[kind], scale: 'harmonic', prog: [0, 1, 4, 0], drums: 'boss' });
