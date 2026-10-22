// The ten zones, each the home of one weapon (like the Sword Graveyard and the training sword):
// its residents carry it, its loot leans toward it and its exit gift is one. bg/slab keys match the
// shared art export. Platforms are [x, y, width] in px
// (y = top surface). Health/damage curves live in curve.js.
const L1 = [[52, 160, 72], [204, 140, 72], [356, 160, 72]];
const L2 = [[30, 168, 90], [190, 150, 100], [360, 168, 90]];
const L3 = [[96, 156, 81], [303, 156, 81], [200, 116, 81]];
const L4 = [[20, 150, 72], [160, 170, 160], [388, 150, 72]];

// ---- the soundtrack (engine/audio.js plays it). Like Mario's one tune in many arrangements,
// every zone has its own signature melody for the first half of its loop, and the second half
// quotes Crazy Weapon Man's main motif in the zone's own scale and kit. Themes are one token per
// eighth note: a scale degree, '-' to hold, '.' to rest ('|' marks the bars).
export const MOTIF = '0 - 2 - 4 - 7 - | 6 - 4 . 5 4 2 - | 0 - 2 - 4 - 7 - | 9 - 8 7 7 - - .';
// the Sword Graveyard's tune, which the Armory Vault brings back for its medley
const GRAVEYARD = '0 - 0 2 3 - 2 0 | 4 - 3 2 3 - - . | 0 - 0 2 3 - 5 4 | 3 - 2 1 0 - - .';
// a seven-note theme moved onto a five-note scale (the shrine, the monastery, the ninja castle)
export const fitTheme = (t, L) =>
  L === 7 ? t : t.replace(/-?\d+/g, d => String(Math.round((+d * L) / 7)));

export const ZONES = [
  {
    id: 'graveyard',
    weapon: 'sword',
    name: 'The Sword Graveyard',
    sub: 'A field of swords nobody came back for. Mind the bandits.',
    pool: ['stalker', 'crawler', 'goose', 'bombchicken'],
    platforms: L1,
    boss: null,
    music: { key: 52, scale: 'minor', bpm: 132, prog: [0, 5, 2, 6], drums: 'graveyard', theme: GRAVEYARD }
  },
  {
    id: 'ranger-forest',
    weapon: 'bow',
    name: "The Ranger's Mushroom Forest",
    sub: 'Every toadstool is an archery range. The fuzzballs grow up fast out here.',
    pool: ['fuzzlet', 'burrball', 'puffshot', 'twintuft', 'quillback', 'moss', 'wolfpup', 'yeticub', 'yeti', 'werewolf'],
    platforms: L2,
    boss: null,
    music: { key: 57, scale: 'dorian', bpm: 124, prog: [0, 3, 0, 4], drums: 'forest', lead: 'p50', theme: '4 - 5 4 2 - 0 - | 1 - 2 - 4 - - . | 4 - 5 7 5 - 4 2 | 3 - 2 1 2 - - .' }
  },
  {
    id: 'turtle-lagoon',
    weapon: 'nunchucks',
    name: 'Nunchuck Turtle Lagoon',
    sub: 'A beach dojo of shell-backed kids. Jr. trains here. He brought the big sword.',
    pool: ['turtle', 'crawler', 'turtle', 'roller', 'bombchicken', 'shieldbro'],
    platforms: L3,
    boss: 'bossjr',
    music: { key: 50, scale: 'phrygian', bpm: 150, prog: [0, 1, 0, 6], drums: 'drive', lead: 'p12', arp: 'tremolo', theme: '0 . 0 1 0 . 7 . | 6 5 4 . 3 . 1 . | 0 . 0 1 0 . 4 . | 3 1 0 . -1 - . .' }
  },
  {
    id: 'thieves-bazaar',
    weapon: 'dagger',
    name: "The Thieves' Night Bazaar",
    sub: 'Daggers half price. Your wallet, full price. Watch the raccoons.',
    pool: ['raccoon', 'taxman', 'raccoon', 'mimic', 'blinker', 'goose'],
    platforms: L4,
    boss: null,
    music: { key: 55, scale: 'harmonic', bpm: 118, prog: [0, 3, 4, 0], drums: 'swing', theme: '0 1 2 . 1 0 -1 0 | 4 - 3 2 1 - . . | 2 3 4 . 5 4 3 2 | 1 2 1 0 0 - - .' }
  },
  {
    id: 'sakura-shrine',
    weapon: 'katana',
    name: 'The Sakura Katana Shrine',
    sub: 'Cherry petals, paper lanterns and very small, very serious samurai.',
    pool: ['samurai', 'kitsune', 'samurai', 'shieldbro', 'sniper', 'eyeball'],
    platforms: L1,
    boss: null,
    music: { key: 50, scale: 'insen', bpm: 100, prog: [0, 3, 2, 4], drums: 'shrine', lead: 'p12', theme: '0 - 1 - 2 - - . | 3 - 2 1 2 - - . | 4 - 3 - 2 - 3 2 | 1 - - - 0 - - .' }
  },
  {
    id: 'mountain-monastery',
    weapon: 'staff',
    name: 'The Mountain Staff Monastery',
    sub: 'The monks spin staves and chant battle hymns. The Ogre King is meditating. Loudly.',
    pool: ['monk', 'kitsune', 'monk', 'roller', 'summoner', 'sniper'],
    platforms: L3,
    boss: 'bossman',
    music: { key: 54, scale: 'penta', bpm: 104, prog: [0, 3, 2, 0], drums: 'chant', lead: 'p50', bass: 'drone', theme: '0 - 0 - 1 - 2 - | 2 - 1 - 0 - - . | 3 - 2 - 1 - 2 - | 0 - - - - - . .' }
  },
  {
    id: 'storm-forge',
    weapon: 'hammer',
    name: "Dad's Hammer & Anvil Forge",
    sub: 'Runaway anvils and fatherly advice. Sr. is hammering something loud.',
    pool: ['anvil', 'brute', 'anvil', 'roller', 'bombchicken', 'mimic', 'shieldbro'],
    platforms: L2,
    boss: 'bosssr',
    music: { key: 47, scale: 'minor', bpm: 146, prog: [0, 6, 5, 4], drums: 'forge', oct: 0, theme: '0 0 . 0 2 . 3 . | 0 0 . 0 4 - 3 . | 0 0 . 0 2 . 3 5 | 4 - 3 2 0 - - .' }
  },
  {
    id: 'witch-cottage',
    weapon: 'wand',
    name: "Grandma's Magic Wand Cottage",
    sub: 'Cookie tins bite. Casseroles are cursed. Grandma waves her wand from the good chair.',
    pool: ['wraith', 'maw', 'mimic', 'summoner', 'bombchicken', 'crawler', 'goose'],
    platforms: L4,
    boss: 'bossgrandma',
    music: { key: 55, scale: 'major', bpm: 150, bar: 12, prog: [0, 3, 4, 0], drums: 'waltz', lead: 'p12', arp: 'waltz', theme: '4 - 5 4 2 - | 0 - - - 2 - | 3 - 4 3 1 - | -1 - - - - .', themeB: '0 - 2 - 4 - | 7 - - 6 4 - | 5 - 4 - 2 - | 0 - - - - .', bossTheme: '4 - 5 4 2 - 0 - | 0 - - - 2 - - . | 3 - 4 3 1 - . . | -1 - - - - - - .' }
  },
  {
    id: 'ninja-castle',
    weapon: 'shuriken',
    name: 'The Shuriken Ninja Castle',
    sub: 'A moonlit castle full of throwing stars. The Usurper Ninja Lord took it one star at a time.',
    pool: ['ninja', 'samurai', 'ninja', 'kitsune', 'shieldbro', 'eyeball'],
    platforms: L1,
    boss: 'bossceo',
    music: { key: 50, scale: 'hirajoshi', bpm: 138, prog: [0, 3, 2, 4], drums: 'taiko', lead: 'p12', theme: '0 . 2 . 3 - 2 0 | 1 - 0 -1 0 - - . | 3 . 4 . 5 - 4 3 | 2 - 1 2 0 - - .' }
  },
  {
    id: 'armory-vault',
    weapon: null, // every weapon lives here
    name: 'The Sentient Armory Vault',
    sub: 'The weapons have organized. The inventory is hunting you.',
    pool: ['wizard', 'wraith', 'mimic', 'eyeball', 'brute', 'flyer', 'samurai', 'ninja', 'anvil', 'turtle'],
    platforms: L3,
    boss: 'bossweapon',
    music: { key: 49, scale: 'minor', bpm: 156, prog: [0, 5, 3, 4], drums: 'vault', theme: GRAVEYARD }
  }
];

export const WAVES_PER_ZONE = 4;
const SCALE_LEN = { insen: 5, hirajoshi: 5, penta: 5 };
for (const z of ZONES) z.music.themeB ??= fitTheme(MOTIF, SCALE_LEN[z.music.scale] || 7);
// the title is the main motif as a fanfare
export const TITLE_MUSIC = {
  key: 52, scale: 'dorian', bpm: 112, prog: [0, 3, 5, 4], drums: 'title', lead: 'p50',
  theme: MOTIF, themeB: '7 - - 9 7 - 4 - | 5 - 6 - 7 - - . | 4 - 5 - 7 - 9 - | 11 - - - 7 - - .'
};
// Each level kind gets its own arrangement of its zone's theme, the way Mario's overworld tune
// comes back slow and hollow underground, heavy in a fort and bright in a bonus room:
//   cave    dark maps (deep tunnels and grottos): slower, a droning bass, no arpeggio
//   fort    harmonic minor and a driving beat     castle  the same, heavier and lower
//   secret  secret levels: faster and an octave up
export const ARRANGE = {
  cave: m => ({ ...m, bpm: Math.round(m.bpm * 0.82), bass: 'drone', arp: 'off', lead: 'tri', drums: m.bar ? m.drums : 'slow' }),
  fort: m => ({ ...m, ...darker(m), bpm: m.bpm + 8, drums: m.bar ? m.drums : 'drive' }),
  castle: m => ({ ...m, ...darker(m), bpm: m.bpm + 4, oct: 0, lead: 'p50', drums: m.bar ? m.drums : 'boss' }),
  secret: m => ({ ...m, bpm: Math.round(m.bpm * 1.12), oct: (m.oct ?? 1) + 1, arp: m.arp === 'off' ? 'roll' : m.arp })
};
const darker = m => (SCALE_LEN[m.scale] ? {} : { scale: m.scale === 'major' ? 'minor' : 'harmonic' });
// which arrangement a level plays: its node kind, or 'cave' for a dark map
export const arrangement = (kind, dark = 0) =>
  kind === 'castle' || kind === 'fort' || kind === 'secret' ? kind : dark >= 2 ? 'cave' : null;
export const zoneSong = (z, kind, dark) => {
  const a = arrangement(kind, dark);
  return { id: 'zone:' + z + (a ? ':' + a : ''), spec: a ? ARRANGE[a](ZONES[z].music) : ZONES[z].music };
};
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
// Boss fights remix the zone's theme as driving rock, Slormancer style: the family's key and
// tempo, a galloping bass, the boss kit and a square lead. The waltz zone's tune is straightened
// to 4/4 for it (bossTheme).
export const bossSong = (kind, z = 0) => {
  const m = ZONES[z].music, five = SCALE_LEN[m.scale];
  return {
    ...BOSS_MUSIC[kind], scale: five ? m.scale : 'harmonic', prog: [0, 1, 4, 0], drums: 'boss', bass: 'gallop', lead: 'p50', oct: 1,
    theme: m.bossTheme || m.theme, themeB: fitTheme(MOTIF, five || 7)
  };
};
