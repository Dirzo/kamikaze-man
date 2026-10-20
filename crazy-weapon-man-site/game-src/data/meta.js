// Progression that outlives every level and run (Slormancer style), kept in localStorage:
//   SHARD TREE   shards you collect are banked and spent on ranks in three branches. Deeper tiers
//                open once enough ranks are spent in that branch. Respec is free.
//   TROPHIES     beating a world's family head (its castle) gives that world's trophy and a
//                permanent perk.
//   MASTERY      every weapon type's mastery (proficiency.js) opens a choice of two perks at each
//                MASTERY_TIERS level; the perk only works while you hold that type. Swap any time.
// stats(type) adds every bonus up into one flat object of fractions that the game code reads.
import { TYPE_LIST } from './weapons.js';
import { proficiency } from './proficiency.js';

export const META_KEY = 'crazyWeaponMan.meta.v1';

// ---------------------------------------------------------------- the shard tree
// tier t of a branch opens after GATE[t] ranks are spent in that branch
export const GATE = [0, 5, 12, 20];
export const rankCost = (tier, rank) => (50 + 50 * tier) * rank; // rank = the rank being bought, from 1
export const BRANCHES = [
  { id: 'might', name: 'MIGHT', col: 'coral' },
  { id: 'guard', name: 'GUARD', col: 'sky' },
  { id: 'fortune', name: 'FORTUNE', col: 'gold' }
];
// [id, branch, tier, name, max ranks, stat, per rank, description ({v} = the total at this rank)]
const NODES = [
  ['sharp', 'might', 0, 'SHARPENED', 5, 'dmg', 0.03, '+{v}% damage'],
  ['luck', 'might', 0, 'LUCKY HITS', 5, 'crit', 0.01, '+{v}% critical chance'],
  ['brutal', 'might', 1, 'BIG CRITS', 5, 'critDmg', 0.08, 'Crits deal +{v}% more'],
  ['swarm', 'might', 1, 'SWARMBANE', 5, 'swarmDmg', 0.04, '+{v}% damage in the swarm'],
  ['giant', 'might', 2, 'GIANTBANE', 5, 'bossDmg', 0.04, '+{v}% damage to bosses and elites'],
  ['spec', 'might', 2, 'SPECIALIST', 5, 'specialCd', 0.04, 'Specials recharge {v}% faster'],
  ['over', 'might', 3, 'OVERCHARGE', 3, 'dmg', 0.06, '+{v}% damage'],
  ['exec', 'might', 3, 'EXECUTION', 3, 'execute', 0.12, '+{v}% damage to foes under a third of their health'],
  ['skin', 'guard', 0, 'THICK SKIN', 5, 'hp', 0.04, '+{v}% max health'],
  ['band', 'guard', 0, 'BANDAGES', 5, 'heal', 0.1, 'Hearts heal {v}% more'],
  ['armor', 'guard', 1, 'PADDING', 5, 'armor', 0.025, 'Take {v}% less damage'],
  ['fleet', 'guard', 1, 'FLEET FOOT', 5, 'speed', 0.03, '+{v}% move speed'],
  ['blink', 'guard', 2, 'BLINK STEP', 5, 'dashCd', 0.06, 'Dash recharges {v}% faster'],
  ['grace', 'guard', 2, 'GRACE', 5, 'inv', 0.06, '+{v}% longer safety after a hit'],
  ['regen', 'guard', 3, 'REGENERATE', 3, 'regen', 0.001, 'Heal {v}% of max health a second'],
  ['stone', 'guard', 3, 'STONESKIN', 3, 'armor', 0.04, 'Take {v}% less damage'],
  ['magnet', 'fortune', 0, 'MAGNET', 5, 'shards', 0.06, '+{v}% shards'],
  ['learn', 'fortune', 0, 'STUDIOUS', 5, 'xp', 0.06, '+{v}% hero XP'],
  ['combo', 'fortune', 1, 'MOMENTUM', 5, 'combo', 0.08, 'Swarm combos last {v}% longer'],
  ['hearts', 'fortune', 1, 'HEARTFELT', 5, 'hearts', 0.02, '+{v}% heart drops'],
  ['tutor', 'fortune', 2, 'MENTOR', 5, 'mastery', 0.08, '+{v}% weapon mastery'],
  ['bounty', 'fortune', 2, 'BOUNTY', 5, 'bossShards', 0.2, '+{v}% shards from bosses'],
  ['stand', 'fortune', 3, 'LUCKY LOOT', 3, 'standout', 0.02, '+{v}% standout weapon drops'],
  ['lust', 'fortune', 3, 'COVETOUS', 3, 'lust', 0.1, 'Weapon Lust builds {v}% faster']
];
export const TREE = NODES.map(([id, branch, tier, name, max, stat, per, desc]) => ({ id, branch, tier, name, max, stat, per, desc }));
export const TREE_BY_ID = Object.fromEntries(TREE.map(n => [n.id, n]));

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
  9: { name: 'THE STOLEN CROWN', perk: 'HOSTILE TAKEOVER', desc: '+15% damage to bosses and elites', stats: { bossDmg: 0.15 } },
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
const blank = () => ({ v: 1, shards: 0, earned: 0, tree: {}, perks: {}, trophies: {} });
let store = null;
function load() {
  const out = blank();
  try {
    const raw = JSON.parse(storage?.getItem(META_KEY) || 'null');
    if (raw && raw.v === 1) {
      out.shards = Math.max(0, Math.floor(+raw.shards || 0));
      out.earned = Math.max(out.shards, Math.floor(+raw.earned || 0));
      for (const [id, r] of Object.entries(raw.tree || {})) if (TREE_BY_ID[id]) out.tree[id] = Math.max(0, Math.min(TREE_BY_ID[id].max, Math.floor(+r || 0)));
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
export const spentIn = branch => TREE.filter(n => n.branch === branch).reduce((s, n) => s + rank(n.id), 0);
export const tierOpen = (branch, tier) => spentIn(branch) >= GATE[tier];
// why a rank can't be bought, or null if it can
export function cantBuy(id) {
  const n = TREE_BY_ID[id];
  if (!n) return 'NO SUCH NODE';
  if (rank(id) >= n.max) return 'MAXED';
  if (!tierOpen(n.branch, n.tier)) return `SPEND ${GATE[n.tier] - spentIn(n.branch)} MORE IN ${n.branch.toUpperCase()}`;
  if (meta().shards < rankCost(n.tier, rank(id) + 1)) return 'NOT ENOUGH SHARDS';
  return null;
}
export function buyRank(id) {
  if (cantBuy(id)) return false;
  const n = TREE_BY_ID[id], m = meta();
  m.shards -= rankCost(n.tier, rank(id) + 1);
  m.tree[id] = rank(id) + 1;
  save();
  return true;
}
// every rank refunded in full
export function respec() {
  const m = meta();
  for (const n of TREE) for (let r = 1; r <= rank(n.id); r++) m.shards += rankCost(n.tier, r);
  m.tree = {};
  save();
}
export const treeSpent = () => TREE.reduce((s, n) => s + Array.from({ length: rank(n.id) }, (_, i) => rankCost(n.tier, i + 1)).reduce((a, b) => a + b, 0), 0);

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
  dashCd: 0, inv: 0, regen: 0, shards: 0, xp: 0, combo: 0, hearts: 0, mastery: 0, bossShards: 0, standout: 0, lust: 0 };
let cache = null;
function add(out, s) {
  for (const k in s) out[k] += s[k];
}
// the account-wide part (tree + trophies), and the held weapon type's mastery perks on top
export function stats(type = null) {
  cache ||= {};
  const key = type ? type + tiersOpen(type) : '-'; // a mastery level-up opens a tier: new key
  if (cache[key]) return cache[key];
  const out = { ...ZERO, innate: new Set() };
  for (const n of TREE) if (rank(n.id)) out[n.stat] += n.per * rank(n.id);
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
  return (cache[key] = out);
}
// a single number for "how strong has the account become" (tests and the playtest report)
export function metaPower() {
  const s = stats();
  return +((1 + s.dmg) * (1 + s.hp) / (1 - s.armor)).toFixed(2);
}
