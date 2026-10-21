// Progression that outlives every level and run (Slormancer style), kept in localStorage:
//   SPECIALIZE   lock to BLADES, BLUNT or RANGED: other weapon classes drop as shards instead.
//   SHARD TREE   shards you collect are banked and spent on ranks in a web of linked nodes: a ring
//                of shared nodes round CORE, and a cluster for each specialization. Respec is free.
//   TROPHIES     beating a world's family head (its castle) gives that world's trophy and a
//                permanent perk.
//   MASTERY      every weapon type's mastery (proficiency.js) opens a choice of two perks at each
//                MASTERY_TIERS level; the perk only works while you hold that type. Swap any time.
// stats(type) adds every bonus up into one flat object of fractions that the game code reads.
import { TYPE_LIST } from './weapons.js';
import { proficiency } from './proficiency.js';

export const META_KEY = 'crazyWeaponMan.meta.v1';

// ---------------------------------------------------------------- specializations
// The weapon lock: specialize in one class and every weapon of another class that drops is turned
// into shards (game/classlock.js). Each class has its own cluster of the shard tree, which you can
// only invest in while specialized in it and which only works with that class in hand.
export const CLASSES = {
  blades: { name: 'BLADES', col: 'coral', types: ['sword', 'dagger', 'katana', 'axe', 'scythe'], starter: 'sword' },
  blunt: { name: 'BLUNT', col: 'sand', types: ['hammer', 'nunchucks', 'staff', 'spear'], starter: 'hammer' },
  ranged: { name: 'RANGED', col: 'sky', types: ['bow', 'shuriken', 'wand', 'boomerang'], starter: 'bow' }
};
export const CLASS_OF = Object.fromEntries(Object.entries(CLASSES).flatMap(([c, C]) => C.types.map(t => [t, c])));

// ---------------------------------------------------------------- the shard tree
// A web of nodes (Slormancer's Ancestral Legacy). CORE sits in the middle of a ring of shared
// nodes that work with every weapon; a cluster for each specialization grows out of the ring, and
// each ends in two element keystones that infuse your hits with that element. You can invest in a
// node once a node linked to it has a rank. Respec is free, and UNDO takes back the last rank.
export const BRANCHES = [
  { id: 'blades', name: 'BLADES', col: 'coral', dir: [-1.2, -0.3], side: [0, 1], anchors: ['sharp', 'band'] },
  { id: 'blunt', name: 'BLUNT', col: 'sand', dir: [1.2, -0.3], side: [0, 1], anchors: ['skin', 'hearts'] },
  { id: 'ranged', name: 'RANGED', col: 'sky', dir: [0, 0.92], side: [1.15, 0], anchors: ['magnet', 'learn'], label: 82 }
];
// the shared ring: [id, x, y, depth, name, max ranks, stat, per rank, description ({v} = the total)]
const SHARED = [
  ['sharp', -30, -8, 0, 'SHARPENED', 5, 'dmg', 0.03, '+{v}% damage'],
  ['band', -24, 16, 0, 'BANDAGES', 5, 'heal', 0.1, 'Hearts heal {v}% more'],
  ['skin', 30, -8, 0, 'THICK SKIN', 5, 'hp', 0.04, '+{v}% max health'],
  ['hearts', 24, 16, 0, 'HEARTFELT', 5, 'hearts', 0.02, '+{v}% heart drops'],
  ['magnet', -10, 28, 0, 'MAGNET', 5, 'shards', 0.06, '+{v}% shards'],
  ['learn', 10, 28, 0, 'STUDIOUS', 5, 'xp', 0.06, '+{v}% hero XP'],
  ['tutor', 0, -28, 1, 'MENTOR', 5, 'mastery', 0.08, '+{v}% weapon mastery'],
  ['bounty', -22, -50, 2, 'BOUNTY', 5, 'bossShards', 0.2, '+{v}% shards from bosses'],
  ['lust', 22, -50, 2, 'COVETOUS', 3, 'lust', 0.1, 'Weapon Lust builds {v}% faster'],
  ['stand', 0, -72, 3, 'LUCKY LOOT', 3, 'standout', 0.02, '+{v}% standout weapon drops'],
  ['combo', -46, 40, 1, 'MOMENTUM', 5, 'combo', 0.08, 'Swarm combos last {v}% longer'],
  ['grace', 46, 40, 1, 'GRACE', 5, 'inv', 0.06, '+{v}% longer safety after a hit'],
  // area-of-effect augments that work with every weapon, one step off the inner ring
  ['nova', -48, -66, 1, 'SHARD NOVA', 5, 'nova', 0.04, 'Kills burst into shards that hit foes nearby for {v}% of the fallen foe\'s health'],
  ['ripple', 48, -66, 1, 'RIPPLE', 5, 'splash', 0.03, 'Every hit splashes {v}% of its damage onto foes nearby']
];
const SHARED_LINKS = [['core', 'sharp'], ['core', 'skin'], ['core', 'magnet'], ['core', 'learn'], ['core', 'tutor'], ['sharp', 'band'], ['band', 'magnet'],
  ['skin', 'hearts'], ['hearts', 'learn'], ['magnet', 'learn'], ['tutor', 'bounty'], ['tutor', 'lust'], ['bounty', 'stand'], ['lust', 'stand'],
  ['band', 'combo'], ['hearts', 'grace'], ['sharp', 'bounty'], ['skin', 'lust'], ['sharp', 'nova'], ['bounty', 'nova'], ['skin', 'ripple'], ['lust', 'ripple']];
// every class cluster has the same shape: [along, across, size, depth] for each slot, then the links
// (-1 and -2 are the cluster's two anchors on the ring)
const SLOTS = [[56, -10, 'small', 1], [56, 10, 'small', 1], [78, -22, 'small', 2], [78, 0, 'small', 2], [78, 22, 'small', 2],
  [100, -12, 'small', 3], [100, 12, 'small', 3], [124, 0, 'medium', 4], [118, -34, 'key', 5], [118, 34, 'key', 5],
  [70, -44, 'aoe', 2], [70, 44, 'aoe', 2]]; // the cluster's two area-of-effect augments: an early pick, a step off the ring
const SLOT_LINKS = [[-1, 0], [-2, 1], [0, 1], [0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [3, 6], [4, 6], [5, 7], [6, 7], [2, 8], [5, 8], [4, 9], [6, 9],
  [0, 10], [2, 10], [1, 11], [4, 11]];
// shards per rank by depth (a rank costs this times the rank being bought)
const DEPTH_COST = [45, 90, 135, 180, 240, 320];
// per class, in slot order: [id, name, max ranks, stat, per rank, description, keystone element]
const NODES = {
  blades: [
    ['edge', 'KEEN EDGE', 5, 'crit', 0.01, '+{v}% critical chance with blades'],
    ['swarm', 'SWARMBANE', 5, 'swarmDmg', 0.04, '+{v}% blade damage in the swarm'],
    ['brutal', 'BIG CRITS', 5, 'critDmg', 0.08, 'Blade crits deal +{v}% more'],
    ['fleet', 'FLEET FOOT', 5, 'speed', 0.03, '+{v}% move speed with a blade'],
    ['exec', 'EXECUTION', 3, 'execute', 0.12, '+{v}% blade damage to foes under a third of their health'],
    ['slice', 'QUICK SLICE', 5, 'attackSpeed', 0.03, 'Blades swing {v}% faster'],
    ['blink', 'BLINK STEP', 5, 'dashCd', 0.06, 'Dash recharges {v}% faster with a blade'],
    ['bladem', 'BLADE MASTER', 3, 'dmg', 0.06, '+{v}% blade damage'],
    ['fire', 'BLAZING BLADES', 5, 'infuse', 0.06, 'Blades are infused with Fire: {v}% chance to burn', 'fire'],
    ['bolt', 'THUNDER BLADES', 5, 'infuse', 0.06, 'Blades are infused with Lightning: {v}% chance to chain', 'lightning'],
    ['whirl', 'WHIRLWIND', 5, 'wave', 0.12, 'Blade finishers spin out a whirlwind: {v}% damage to every foe around you'],
    ['cleave', 'WIDE CLEAVE', 5, 'splash', 0.07, 'Blade hits cleave through: {v}% of the damage splashes onto foes nearby']
  ],
  blunt: [
    ['armor', 'PADDING', 5, 'armor', 0.025, 'Take {v}% less damage with a blunt weapon'],
    ['giant', 'GIANTBANE', 5, 'bossDmg', 0.04, '+{v}% blunt damage to bosses and elites'],
    ['stone', 'STONESKIN', 3, 'armor', 0.04, 'Take {v}% less damage with a blunt weapon'],
    ['regen', 'REGENERATE', 3, 'regen', 0.001, 'Heal {v}% of max health a second with a blunt weapon'],
    ['crush', 'CRUSH', 5, 'swarmDmg', 0.04, '+{v}% blunt damage in the swarm'],
    ['heavy', 'HEAVY HANDS', 5, 'specialCd', 0.04, 'Blunt specials recharge {v}% faster'],
    ['bones', 'BONEBREAKER', 5, 'critDmg', 0.08, 'Blunt crits deal +{v}% more'],
    ['bluntm', 'CRUSHER', 3, 'dmg', 0.06, '+{v}% blunt damage'],
    ['quake', 'QUAKE STRIKES', 5, 'infuse', 0.06, 'Blunt hits are infused with Earth: {v}% chance to quake', 'earth'],
    ['frost', 'FROST STRIKES', 5, 'infuse', 0.06, 'Blunt hits are infused with Ice: {v}% chance to chill', 'ice'],
    ['shock', 'SHOCKWAVE', 5, 'wave', 0.15, 'Blunt finishers slam a shockwave: {v}% damage to every foe around you'],
    ['after', 'AFTERSHOCK', 5, 'nova', 0.06, 'Blunt kills quake: {v}% of the fallen foe\'s health to foes nearby']
  ],
  ranged: [
    ['spec', 'SPECIALIST', 5, 'specialCd', 0.04, 'Ranged specials recharge {v}% faster'],
    ['aim', 'STEADY AIM', 5, 'crit', 0.01, '+{v}% critical chance at range'],
    ['quick', 'QUICK DRAW', 5, 'attackSpeed', 0.03, 'Ranged weapons fire {v}% faster'],
    ['snipe', 'SNIPER', 5, 'bossDmg', 0.04, '+{v}% ranged damage to bosses and elites'],
    ['kite', 'KITING', 5, 'speed', 0.03, '+{v}% move speed with a ranged weapon'],
    ['volley', 'VOLLEY', 5, 'swarmDmg', 0.04, '+{v}% ranged damage in the swarm'],
    ['pin', 'PIN DOWN', 3, 'execute', 0.12, '+{v}% ranged damage to foes under a third of their health'],
    ['rangem', 'DEADEYE', 3, 'dmg', 0.06, '+{v}% ranged damage'],
    ['venom', 'VENOM SHOTS', 5, 'infuse', 0.06, 'Shots are infused with Poison: {v}% chance to poison', 'poison'],
    ['gale', 'GALE SHOTS', 5, 'infuse', 0.06, 'Shots are infused with Wind: {v}% chance to toss', 'wind'],
    ['frag', 'FRAG SHOTS', 5, 'splash', 0.08, 'Shots burst on impact: {v}% of the damage splashes onto foes nearby'],
    ['scatter', 'SCATTER BURST', 5, 'nova', 0.06, 'Ranged kills scatter shrapnel: {v}% of the fallen foe\'s health to foes nearby']
  ]
};
// x, y are offsets in pixels from CORE
export const TREE = [{ id: 'core', branch: null, depth: 0, size: 'medium', name: 'AWAKENING', max: 1, stat: 'dmg', per: 0.02, desc: '+{v}% damage. Every path starts here', cost: 25, x: 0, y: 0, links: [] }];
for (const [id, x, y, depth, name, max, stat, per, desc] of SHARED) TREE.push({ id, branch: null, depth, size: 'small', name, max, stat, per, desc, cost: DEPTH_COST[depth], x, y, links: [] });
for (const B of BRANCHES)
  NODES[B.id].forEach(([id, name, max, stat, per, desc, el], i) => {
    const [a, s, size, depth] = SLOTS[i];
    TREE.push({ id, branch: B.id, depth, size, name, max, stat, per, desc, el, cost: DEPTH_COST[depth], x: Math.round(a * B.dir[0] + s * B.side[0]), y: Math.round(a * B.dir[1] + s * B.side[1]), links: [] });
  });
// area-of-effect augments get their own look on the web
export const AOE_STATS = ['splash', 'wave', 'nova'];
for (const n of TREE) if (AOE_STATS.includes(n.stat)) (n.aoe = true), (n.size = n.size === 'small' ? 'aoe' : n.size);
export const TREE_BY_ID = Object.fromEntries(TREE.map(n => [n.id, n]));
const link = (a, b) => {
  TREE_BY_ID[a].links.push(b);
  TREE_BY_ID[b].links.push(a);
};
for (const [a, b] of SHARED_LINKS) link(a, b);
for (const B of BRANCHES) for (const [a, b] of SLOT_LINKS) link(a < 0 ? B.anchors[-a - 1] : NODES[B.id][a][0], NODES[B.id][b][0]);
// bridges from the clusters back to the ring
link('exec', 'combo');
link('pin', 'combo');
link('crush', 'grace');
link('kite', 'grace');
export const TREE_LINKS = TREE.flatMap(n => n.links.filter(id => id > n.id).map(id => [n.id, id]));
export const rankCost = (n, rank) => n.cost * rank; // rank = the rank being bought, from 1
// bumped whenever the web changes shape: an older save gets every shard it spent back
const TREE_V = 2;

// ---------------------------------------------------------------- world boss perks and trophies
// region -> the trophy you take off the family head and the perk it gives
export const TROPHIES = {
  1: { name: "MOTHER GOOSE'S CROWN", perk: 'HONK OF COURAGE', desc: '+10% max health', stats: { hp: 0.1 } },
  2: { name: 'THE GOLDEN ACORN', perk: 'EAGLE EYE', desc: '+5% critical chance', stats: { crit: 0.05 } },
  3: { name: "JR.'S SURFBOARD", perk: "SURF'S UP", desc: 'Double jump with every weapon', stats: {}, innate: 'hops' },
  4: { name: "THE KINGPIN'S MONOCLE", perk: 'STICKY FINGERS', desc: '+25% shards', stats: { shards: 0.25 } },
  5: { name: 'THE SHOGUN NODACHI', perk: 'PETAL STEP', desc: 'Dashing through foes slices them', stats: {}, innate: 'dashcut' },
  6: { name: "THE OGRE KING'S BEADS", perk: 'INNER PEACE', desc: 'Heal 0.25% of max health a second', stats: { regen: 0.0025 } },
  7: { name: "DAD'S HAMMER", perk: "DAD'S TOUGHNESS", desc: 'Take 12% less damage', stats: { armor: 0.12 } },
  8: { name: "GRANDMA'S CASSEROLE DISH", perk: 'SECOND HELPINGS', desc: 'Hearts heal 50% more and drop more often', stats: { heal: 0.5, hearts: 0.04 } },
  9: { name: 'THE STOLEN CROWN', perk: "USURPER'S EDGE", desc: '+15% damage to bosses and elites', stats: { bossDmg: 0.15 } },
  10: { name: 'THE FIRST WEAPON', perk: 'EVERY WEAPON EVER', desc: '+15% damage with everything', stats: { dmg: 0.15 } }
};

// ---------------------------------------------------------------- weapon mastery perks
// Mastery runs to level 100 (proficiency.js), so the choices are spread all the way along it.
export const MASTERY_TIERS = [5, 10, 20, 30, 40, 50, 60, 70, 85, 100];
// the two signature abilities each type can learn (data/abilities.js)
export const SIGNATURE = {
  sword: ['meteor', 'giantslayer'], dagger: ['frenzy', 'dashcut'], katana: ['dashcut', 'lucky'], hammer: ['thorns', 'meteor'],
  nunchucks: ['frenzy', 'bubble'], staff: ['hops', 'bubble'], bow: ['lucky', 'hops'], shuriken: ['frenzy', 'lucky'],
  wand: ['meteor', 'vampire'], spear: ['giantslayer', 'dashcut'], axe: ['thorns', 'frenzy'], scythe: ['vampire', 'giantslayer'],
  boomerang: ['hops', 'bubble']
};
// per tier: [option A, option B]; a `sig` option grants that signature ability (0 or 1), and
// 'other' at the last tier grants whichever signature you did not pick at level 50
export const MASTERY_PERKS = [
  [{ name: 'EDGE', desc: '+6% damage', stats: { dmg: 0.06 } }, { name: 'KEEN', desc: '+4% critical chance', stats: { crit: 0.04 } }],
  [{ name: 'QUICK HANDS', desc: 'Attack 6% faster', stats: { attackSpeed: 0.06 } }, { name: 'SECOND WIND', desc: 'Special recharges 15% faster', stats: { specialCd: 0.15 } }],
  [{ name: 'IRON GRIP', desc: 'Take 6% less damage', stats: { armor: 0.06 } }, { name: 'LONG STRIDE', desc: '+6% move speed', stats: { speed: 0.06 } }],
  [{ name: 'BRUISER', desc: '+12% damage to bosses and elites', stats: { bossDmg: 0.12 } }, { name: 'CROWD CONTROL', desc: '+15% damage in the swarm', stats: { swarmDmg: 0.15 } }],
  [{ name: 'HONED', desc: '+10% damage', stats: { dmg: 0.1 } }, { name: 'LUCKY STREAK', desc: '+6% critical chance', stats: { crit: 0.06 } }],
  [{ sig: 0 }, { sig: 1 }],
  [{ name: 'FOCUS', desc: 'Crits deal +30% more', stats: { critDmg: 0.3 } }, { name: 'FINISHER', desc: '+25% damage to foes under a third of their health', stats: { execute: 0.25 } }],
  [{ name: 'TOUGH LOVE', desc: '+10% max health', stats: { hp: 0.1 } }, { name: 'SHARD SENSE', desc: '+15% shards', stats: { shards: 0.15 } }],
  [{ name: 'ARMS MASTER', desc: 'Attack 10% faster', stats: { attackSpeed: 0.1 } }, { name: 'QUICK RECOVERY', desc: 'Special recharges 25% faster', stats: { specialCd: 0.25 } }],
  [{ name: 'PERFECT FORM', desc: '+25% damage', stats: { dmg: 0.25 } }, { sig: 'other' }]
];
const ABILITY_NAMES = { meteor: 'METEOR CALLER', vampire: 'THIRSTY', thorns: 'BITES BACK', hops: 'DOUBLE JUMP', dashcut: 'DASH CUT', frenzy: 'FRENZY', lucky: 'LUCKY', bubble: 'BUBBLE GUARD', giantslayer: 'GIANT SLAYER' };
const ABILITY_DESC = { meteor: 'Finishers call a meteor', vampire: 'Hits heal you a little', thorns: 'Getting hit lashes back', hops: 'Jump again in mid-air', dashcut: 'Dashes slice foes', frenzy: 'Kills speed up swings', lucky: '+15% critical chance', bubble: 'A bubble blocks a hit every 8s', giantslayer: '+25% damage to big foes' };
// the perk at (type, tier, option) with its name and description filled in
export function masteryPerk(type, tier, opt) {
  const p = MASTERY_PERKS[tier][opt];
  if (p.sig == null) return { ...p, stats: p.stats || {} };
  const picked = meta().perks[type]?.[5];
  const ab = p.sig === 'other' ? SIGNATURE[type][picked === 1 ? 0 : 1] : SIGNATURE[type][p.sig];
  return { name: ABILITY_NAMES[ab], desc: p.sig === 'other' ? 'Also learn ' + ABILITY_NAMES[ab].toLowerCase() + ': ' + ABILITY_DESC[ab].toLowerCase() : ABILITY_DESC[ab], stats: {}, innate: ab };
}
// how many mastery tiers this type has opened
export const tiersOpen = type => MASTERY_TIERS.filter(lv => proficiency(type).lv >= lv).length;

// ---------------------------------------------------------------- the save
let storage = null;
try {
  storage = globalThis.localStorage || null;
} catch (_) {
  storage = null;
}
const blank = () => ({ v: 1, tv: TREE_V, shards: 0, earned: 0, lock: null, tree: {}, hist: [], perks: {}, trophies: {} });
let store = null;
function load() {
  const out = blank();
  try {
    const raw = JSON.parse(storage?.getItem(META_KEY) || 'null');
    if (raw && raw.v === 1) {
      out.shards = Math.max(0, Math.floor(+raw.shards || 0));
      out.earned = Math.max(out.shards, Math.floor(+raw.earned || 0));
      for (const [id, r] of Object.entries(raw.tree || {})) if (TREE_BY_ID[id]) out.tree[id] = Math.max(0, Math.min(TREE_BY_ID[id].max, Math.floor(+r || 0)));
      if (Array.isArray(raw.hist)) out.hist = raw.hist.filter(id => out.tree[id] || isLockStep(id)).slice(-HIST_MAX);
      if (CLASSES[raw.lock]) out.lock = raw.lock;
      if (raw.tv !== TREE_V || !reachable(out.tree)) {
        // a save from an older tree: only the tree spends shards, so every shard earned comes back
        out.shards = out.earned;
        out.tree = {};
        out.hist = [];
      }
      for (const t of TYPE_LIST) if (Array.isArray(raw.perks?.[t])) out.perks[t] = raw.perks[t].slice(0, MASTERY_TIERS.length).map(c => (c === 0 || c === 1 ? c : null));
      for (const r of Object.keys(TROPHIES)) if (raw.trophies?.[r]) out.trophies[r] = 1;
    }
  } catch (_) {
    /* a broken save starts fresh */
  }
  return out;
}
export function meta() {
  return (store ||= load());
}
function save() {
  try {
    storage?.setItem(META_KEY, JSON.stringify(store));
  } catch (_) {
    /* private mode: progress lives for this tab */
  }
  cache = null;
}
// forget the cached copy (the save files menu just swapped what is in storage)
export function reloadMeta() {
  store = null;
  cache = null;
}
export function resetMeta() {
  store = blank();
  save();
}

// ---- shards
export function bankShards(n) {
  const m = meta();
  n = Math.max(0, Math.floor(n));
  m.shards += n;
  m.earned += n;
  save();
  return n;
}
export const rank = id => meta().tree[id] || 0;
// every invested node can be walked to from CORE through invested nodes
function reachable(tree) {
  const seen = new Set(), todo = tree.core ? ['core'] : [];
  while (todo.length) {
    const id = todo.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const l of TREE_BY_ID[id].links) if (tree[l]) todo.push(l);
  }
  return Object.keys(tree).every(id => !tree[id] || seen.has(id));
}
// CORE is always open; any other node opens once a node linked to it has a rank
export const linked = id => id === 'core' || TREE_BY_ID[id].links.some(l => rank(l));
// why a rank can't be bought, or null if it can
export function cantBuy(id) {
  const n = TREE_BY_ID[id];
  if (!n) return 'NO SUCH NODE';
  if (rank(id) >= n.max) return 'MAXED';
  if (n.branch && meta().lock !== n.branch) return `SPECIALIZE IN ${CLASSES[n.branch].name} (G) TO INVEST HERE`;
  if (!linked(id)) return 'INVEST IN A LINKED NODE FIRST';
  if (meta().shards < rankCost(n, rank(id) + 1)) return 'NOT ENOUGH SHARDS';
  return null;
}
const HIST_MAX = 300;
export function buyRank(id) {
  if (cantBuy(id)) return false;
  const n = TREE_BY_ID[id], m = meta();
  m.shards -= rankCost(n, rank(id) + 1);
  m.tree[id] = rank(id) + 1;
  m.hist.push(id);
  if (m.hist.length > HIST_MAX) m.hist.shift();
  save();
  return true;
}
// take back the last step: a rank bought (newest first, so the web always stays linked) or a
// change of specialization, which goes back to the class you had before. Once every recorded step
// is undone, one more undo drops the lock itself, so you can always get back to choosing a class.
export function undoRank() {
  const m = meta(), id = m.hist.pop();
  if (id && isLockStep(id)) {
    m.lock = CLASSES[id.slice(1)] ? id.slice(1) : null;
    save();
    return id;
  }
  if (!id && m.lock) {
    m.lock = null;
    save();
    return '@';
  }
  if (!id || !rank(id)) return save(), null;
  m.shards += rankCost(TREE_BY_ID[id], rank(id));
  if (--m.tree[id] === 0) delete m.tree[id];
  save();
  return id;
}
export const canUndo = () => meta().hist.length > 0 || !!meta().lock;
// every rank refunded in full, and the specialization dropped: a clean slate to pick any class
export function respec() {
  const m = meta();
  m.shards += treeSpent();
  m.tree = {};
  m.hist = [];
  m.lock = null;
  save();
}
export const treeSpent = () => TREE.reduce((s, n) => s + n.cost * (rank(n.id) * (rank(n.id) + 1)) / 2, 0);

// ---- the weapon lock
// a specialization change in the undo history: '@' + the class it replaced ('@' alone: no lock)
const isLockStep = id => typeof id === 'string' && id[0] === '@';
export const weaponLock = () => meta().lock;
// null drops the lock (every class drops again). Leaving a class refunds the ranks in its cluster,
// since they only work while you are that class, and the change can be undone like a rank.
export function setLock(cls) {
  if (cls !== null && !CLASSES[cls]) return false;
  const m = meta(), prev = m.lock;
  if (cls === prev) return true;
  if (prev) {
    for (const n of TREE) if (n.branch === prev && rank(n.id)) refundNode(n);
    // anything that only hung off the old cluster comes back too, so the web stays linked
    for (let loose = true; loose; ) {
      loose = false;
      for (const n of TREE) if (rank(n.id) && !reachableNode(n.id)) (refundNode(n), (loose = true));
    }
    m.hist = m.hist.filter(id => isLockStep(id) || m.tree[id]);
  }
  m.lock = cls;
  m.hist.push('@' + (prev || ''));
  if (m.hist.length > HIST_MAX) m.hist.shift();
  save();
  return true;
}
function refundNode(n) {
  const m = meta();
  m.shards += n.cost * (rank(n.id) * (rank(n.id) + 1)) / 2;
  delete m.tree[n.id];
}
// can this invested node be walked to from CORE through invested nodes?
function reachableNode(id) {
  const tree = meta().tree, seen = new Set(), todo = tree.core ? ['core'] : [];
  while (todo.length) {
    const at = todo.pop();
    if (at === id) return true;
    if (seen.has(at)) continue;
    seen.add(at);
    for (const l of TREE_BY_ID[at].links) if (tree[l]) todo.push(l);
  }
  return false;
}
// does a weapon type drop as itself under the current lock?
export const allowedType = type => !meta().lock || CLASS_OF[type] === meta().lock;

// ---- trophies
export const hasTrophy = region => !!meta().trophies[region];
export function winTrophy(region) {
  const m = meta();
  if (!TROPHIES[region] || m.trophies[region]) return false;
  m.trophies[region] = 1;
  save();
  return true;
}

// ---- mastery perks
export const perkChoice = (type, tier) => meta().perks[type]?.[tier] ?? null;
export function choosePerk(type, tier, opt) {
  if (tier >= tiersOpen(type) || (opt !== 0 && opt !== 1)) return false;
  const m = meta();
  m.perks[type] ||= [];
  m.perks[type][tier] = opt;
  save();
  return true;
}
// tiers that are open but have no pick yet (the overworld nags about these)
export const unpicked = type => Array.from({ length: tiersOpen(type) }, (_, i) => i).filter(i => perkChoice(type, i) == null);

// ---------------------------------------------------------------- the sum of it all
const ZERO = { dmg: 0, crit: 0, critDmg: 0, swarmDmg: 0, bossDmg: 0, execute: 0, specialCd: 0, attackSpeed: 0, hp: 0, heal: 0, armor: 0, speed: 0,
  dashCd: 0, inv: 0, regen: 0, shards: 0, xp: 0, combo: 0, hearts: 0, mastery: 0, bossShards: 0, standout: 0, lust: 0, splash: 0, wave: 0, nova: 0 };
let cache = null;
function add(out, s) {
  for (const k in s) out[k] += s[k];
}
// the account-wide part (tree + trophies), and the held weapon type's mastery perks on top
export function stats(type = null) {
  cache ||= {};
  const key = type ? type + tiersOpen(type) : '-'; // a mastery level-up opens a tier: new key
  if (cache[key]) return cache[key];
  const out = { ...ZERO, innate: new Set(), infuse: {} };
  const cls = type && CLASS_OF[type];
  for (const n of TREE) {
    if (!rank(n.id) || (n.branch && n.branch !== cls)) continue; // a class cluster only works with that class in hand
    if (n.el) out.infuse[n.el] = n.per * rank(n.id);
    else out[n.stat] += n.per * rank(n.id);
  }
  for (const r of Object.keys(meta().trophies)) {
    add(out, TROPHIES[r].stats);
    if (TROPHIES[r].innate) out.innate.add(TROPHIES[r].innate);
  }
  if (type)
    for (let t = 0; t < tiersOpen(type); t++) {
      const c = perkChoice(type, t);
      if (c == null) continue;
      const p = masteryPerk(type, t, c);
      add(out, p.stats);
      if (p.innate) out.innate.add(p.innate);
    }
  out.armor = Math.min(0.6, out.armor);
  out.specialCd = Math.min(0.6, out.specialCd);
  out.dashCd = Math.min(0.6, out.dashCd);
  out.splash = Math.min(0.6, out.splash);
  return (cache[key] = out);
}
// a single number for "how strong has the account become" (tests and the playtest report)
export function metaPower() {
  const s = stats(meta().lock ? CLASSES[meta().lock].starter : null); // with the class cluster, if specialized
  return +((1 + s.dmg) * (1 + s.hp) / (1 - s.armor)).toFixed(2);
}
