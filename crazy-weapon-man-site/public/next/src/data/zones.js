// The ten zones. bg/slab keys match the shared art export. Platforms are [x, y, width] in px
// (y = top surface). Health/damage curves live in curve.js.
const L1 = [[52, 160, 72], [204, 140, 72], [356, 160, 72]];
const L2 = [[30, 168, 90], [190, 150, 100], [360, 168, 90]];
const L3 = [[96, 156, 81], [303, 156, 81], [200, 116, 81]];
const L4 = [[20, 150, 72], [160, 170, 160], [388, 150, 72]];

export const ZONES = [
  {
    id: 'graveyard',
    name: 'The Sword Graveyard',
    sub: 'Prototype weapons stuck in old battlefields. Mind the apprentices.',
    pool: ['stalker', 'crawler', 'goose', 'bombchicken'],
    platforms: L1,
    boss: null,
    music: { key: 52, scale: 'minor', bpm: 132, prog: [0, 5, 2, 6], drums: 'march' }
  },
  {
    id: 'disco-crypt',
    name: 'Disco Crypt of Compliance',
    sub: 'Weapon testing moved underground after the noise complaints.',
    pool: ['crawler', 'wizard', 'shieldbro', 'blinker', 'bombchicken', 'goose'],
    platforms: L2,
    boss: null,
    music: { key: 57, scale: 'dorian', bpm: 124, prog: [0, 3, 0, 4], drums: 'disco' }
  },
  {
    id: 'volcano',
    name: 'Tax Audit Volcano',
    sub: 'Jr. is just beyond the crater. No safety scrolls were filed.',
    pool: ['brute', 'roller', 'shieldbro', 'bombchicken', 'wizard'],
    platforms: L3,
    boss: 'bossjr',
    music: { key: 50, scale: 'phrygian', bpm: 150, prog: [0, 1, 0, 6], drums: 'drive' }
  },
  {
    id: 'feast-hall',
    name: 'Bone Dragon Feast Hall',
    sub: 'Every skeleton has a council summons. Most of them are hungry.',
    pool: ['taxman', 'shieldbro', 'blinker', 'mimic', 'sniper', 'goose'],
    platforms: L4,
    boss: null,
    music: { key: 55, scale: 'dorian', bpm: 118, prog: [0, 3, 4, 0], drums: 'jig' }
  },
  {
    id: 'cathedral',
    name: 'Cathedral of Bad Ideas',
    sub: 'Management calls it an alignment ritual. The architecture calls it a threat.',
    pool: ['taxman', 'wizard', 'summoner', 'shieldbro', 'sniper', 'eyeball'],
    platforms: L1,
    boss: null,
    music: { key: 48, scale: 'harmonic', bpm: 100, prog: [0, 5, 3, 4], drums: 'slow' }
  },
  {
    id: 'frozen-peaks',
    name: 'Frozen Meat Peaks',
    sub: 'A frozen fortress, hostile and aggressively KPI-driven. Boss Man waits.',
    pool: ['taxman', 'sniper', 'roller', 'summoner', 'shieldbro', 'mimic'],
    platforms: L3,
    boss: 'bossman',
    music: { key: 54, scale: 'minor', bpm: 128, prog: [0, 5, 6, 4], drums: 'march' }
  },
  {
    id: 'storm-forge',
    name: "Dad's Storm Forge",
    sub: 'Runaway anvils and Dad-level safety advice. Sr. is tuning something loud.',
    pool: ['brute', 'roller', 'bombchicken', 'mimic', 'shieldbro', 'sniper', 'stalker'],
    platforms: L2,
    boss: 'bosssr',
    music: { key: 47, scale: 'minor', bpm: 146, prog: [0, 6, 5, 4], drums: 'drive' }
  },
  {
    id: 'witch-cottage',
    name: "Grandma's Armed Witch Cottage",
    sub: 'Cookie tins bite. Casseroles are cursed. Grandma is in the good chair.',
    pool: ['wraith', 'maw', 'mimic', 'summoner', 'bombchicken', 'crawler', 'goose'],
    platforms: L4,
    boss: 'bossgrandma',
    music: { key: 50, scale: 'harmonic', bpm: 110, prog: [0, 3, 5, 4], drums: 'swing' }
  },
  {
    id: 'citadel',
    name: 'The Hostile Takeover Citadel',
    sub: 'Every floor is a performance review. The CEO owns the stairs.',
    pool: ['taxman', 'shieldbro', 'sniper', 'blinker', 'roller', 'eyeball'],
    platforms: L1,
    boss: 'bossceo',
    music: { key: 58, scale: 'major', bpm: 138, prog: [0, 3, 4, 5], drums: 'march' }
  },
  {
    id: 'armory-vault',
    name: 'The Sentient Armory Vault',
    sub: 'The weapons have organized. The inventory is hunting you.',
    pool: ['wizard', 'wraith', 'mimic', 'eyeball', 'brute', 'flyer', 'roller', 'blinker'],
    platforms: L3,
    boss: 'bossweapon',
    music: { key: 49, scale: 'minor', bpm: 156, prog: [0, 5, 3, 4], drums: 'drive' }
  }
];

export const WAVES_PER_ZONE = 4;
export const TITLE_MUSIC = { key: 52, scale: 'dorian', bpm: 112, prog: [0, 3, 5, 4], drums: 'title' };
export const BOSS_MUSIC = {
  bossjr: { key: 53, bpm: 176 },
  bossman: { key: 45, bpm: 164 },
  bosssr: { key: 47, bpm: 168 },
  bossgrandma: { key: 50, bpm: 160 },
  bossceo: { key: 46, bpm: 172 },
  bossweapon: { key: 44, bpm: 190 }
};
export const bossSong = kind => ({ ...BOSS_MUSIC[kind], scale: 'harmonic', prog: [0, 1, 4, 0], drums: 'boss' });
