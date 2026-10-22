// The Monster Book (MapleStory's): a card for every resident type, filled in by beating them.
// Each card climbs FOUND -> BRONZE -> SILVER -> GOLD as the kills add up, and a GOLD card gives a
// small permanent bonus that works with every weapon. Bosses have their own pages, one per family:
// beat every member of a family (its siblings and the head) to complete the page and win its bonus.
// Kept in localStorage (one book per save file). Pure data, safe to import from node tests.
import { ENEMIES } from './enemies.js';
import { FAMILIES, BOSS_OF } from './families.js';
import { LEVELS } from './overworld.js';

export const BOOK_KEY = 'crazyWeaponMan.book.v1';
// kills to reach each tier of a card
export const CARD_GOALS = [1, 20, 80, 250];
export const CARD_TIERS = ['FOUND', 'BRONZE', 'SILVER', 'GOLD'];
export const TIER_COL = ['mist', 'sand', 'paper', 'gold'];

// type -> the GOLD bonus (meta.js stat fractions), what it says, and a line of lore about the
// weapon the resident carries
export const CARDS = {
  stalker: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Digs swords out of old graves and keeps the sharpest.' },
  crawler: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'Hides a tiny dagger in each pocket. It has six pockets.' },
  goose: { stats: { speed: 0.02 }, bonus: '+2% move speed', lore: 'Carries a stolen sword in its beak and will not give it back.' },
  bombchicken: { stats: { aoeSize: 0.03 }, bonus: 'Area effects reach 3% wider', lore: 'Lays eggs with a fuse. Nobody asks where the fuse comes from.' },
  brute: { stats: { hp: 0.02 }, bonus: '+2% max health', lore: 'Its axe is older than the forest it chopped down.' },
  wraith: { stats: { heal: 0.05 }, bonus: 'Hearts heal 5% more', lore: 'Haunts a casserole dish that has seen a thousand battles.' },
  maw: { stats: { shards: 0.03 }, bonus: '+3% shards', lore: 'A chest that ate the sword it was meant to guard.' },
  flyer: { stats: { dashCd: 0.02 }, bonus: 'Dash returns 2% sooner', lore: 'Teeth sharper than most daggers, and it knows it.' },
  wizard: { stats: { specialCd: 0.02 }, bonus: 'Specials recharge 2% faster', lore: 'Grumpy because his wand is a stick he found.' },
  taxman: { stats: { xp: 0.03 }, bonus: '+3% hero XP', lore: 'Copies forbidden weapon scrolls by candlelight.' },
  mimic: { stats: { standout: 0.005 }, bonus: '+0.5% standout drops', lore: 'Looks exactly like a legendary blade. Bites like one too.' },
  eyeball: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Has seen every weak spot in every suit of armour.' },
  shieldbro: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'Polishes his shield until he can see his own sword in it.' },
  blinker: { stats: { inv: 0.04 }, bonus: '+4% safety after a hit', lore: 'Teleports with a dagger in each hand. Lands with neither.' },
  summoner: { stats: { mastery: 0.03 }, bonus: '+3% weapon mastery', lore: 'Raises skeletons, then teaches them swordplay.' },
  sniper: { stats: { critDmg: 0.05 }, bonus: 'Crits deal 5% more', lore: 'Steve has never missed. Steve has rarely hit, either.' },
  roller: { stats: { knock: 0.05 }, bonus: 'Foes fly 5% further', lore: 'A knight who climbed into a barrel and liked it.' },
  squirrel: { stats: { shotSpeed: 0.03 }, bonus: 'Shots fly 3% faster', lore: 'Fletches arrows from twigs and very small grudges.' },
  turtle: { stats: { combo: 0.05 }, bonus: 'Swarm combos last 5% longer', lore: 'Spins nunchucks faster than the tide comes in.' },
  raccoon: { stats: { hearts: 0.005 }, bonus: '+0.5% heart drops', lore: 'Every dagger at the bazaar passes through these paws.' },
  samurai: { stats: { execute: 0.03 }, bonus: '+3% damage to badly hurt foes', lore: 'Small sword. Large opinions about honour.' },
  kitsune: { stats: { echo: 0.01 }, bonus: '1% of hits echo', lore: 'Its foxfire is the glint off a katana you never saw.' },
  monk: { stats: { regen: 0.0005 }, bonus: 'Heal 0.05% of max health a second', lore: 'Meditates on a staff balanced on one finger.' },
  anvil: { stats: { impact: 0.03 }, bonus: 'Hits land 3% harder', lore: 'Born on Dad\'s anvil. Barks sparks.' },
  ninja: { stats: { swarmDmg: 0.02 }, bonus: '+2% damage in the swarm', lore: 'Carries forty shuriken and a forty-first for luck.' },
  // the fuzzball family (zone 2)
  fuzzlet: { stats: { shotSpeed: 0.02 }, bonus: 'Shots fly 2% faster', lore: 'Its first bow was a twig and a whisker. It hits more often than you would think.' },
  burrball: { stats: { knock: 0.04 }, bonus: 'Foes fly 4% further', lore: 'Every arrow that ever missed it is still stuck in its fur. It keeps them for later.' },
  puffshot: { stats: { aoeSize: 0.02 }, bonus: 'Area effects reach 2% wider', lore: 'Aims at the sky on purpose. The sky has never once dodged.' },
  twintuft: { stats: { echo: 0.01 }, bonus: '1% of hits echo', lore: 'One holds the bow, one pulls the string. They argue over who gets the credit.' },
  quillback: { stats: { critDmg: 0.04 }, bonus: 'Crits deal 4% more', lore: 'Fletches its arrows with its own quills, so every shot is a little personal.' },
  moss: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Wears the forest like a cloak and carries a longbow taller than it is.' },
  wolfpup: { stats: { speed: 0.02 }, bonus: '+2% move speed', lore: 'Has not decided which end of the bow to hit you with, so it uses both.' },
  yeticub: { stats: { hp: 0.015 }, bonus: '+1.5% max health', lore: 'Carved its bow from an icicle. Its arrows never thaw.' },
  yeti: { stats: { impact: 0.03 }, bonus: 'Hits land 3% harder', lore: 'Its greatbow is a whole antler strung with frozen vine. It only ever needs one arrow.' },
  werewolf: { stats: { bossDmg: 0.02 }, bonus: '+2% damage to bosses and elites', lore: 'When the moon is up, so is every bow in the forest.' }
};
export const CARD_LIST = Object.keys(CARDS).filter(t => ENEMIES[t]);

// a family page: every boss of that world, and what completing it gives
export const PAGE_BONUS = { stats: { bossDmg: 0.02 }, bonus: '+2% damage to bosses and elites' };
export const PAGES = Object.keys(FAMILIES).map(r => ({
  region: +r,
  name: FAMILIES[r].name,
  head: FAMILIES[r].head,
  kinds: LEVELS.filter(n => n.region === +r).map(n => BOSS_OF[n.id])
}));

// ---------------------------------------------------------------- the save
let storage = null;
try {
  storage = globalThis.localStorage || null;
} catch (_) {
  storage = null;
}
const blank = () => ({ v: 1, kills: {}, bosses: {} });
let store = null,
  version = 0; // bumped on every change that can move a bonus (meta.js recomputes its stats)
function load() {
  const out = blank();
  try {
    const raw = JSON.parse(storage?.getItem(BOOK_KEY) || 'null');
    if (raw && raw.v === 1) {
      for (const t of CARD_LIST) if (raw.kills?.[t] > 0) out.kills[t] = Math.floor(+raw.kills[t]) || 0;
      for (const P of PAGES) for (const k of P.kinds) if (raw.bosses?.[k]) out.bosses[k] = 1;
    }
  } catch (_) {
    /* a torn page starts a fresh book */
  }
  return out;
}
export const book = () => (store ||= load());
function save() {
  try {
    storage?.setItem(BOOK_KEY, JSON.stringify(store));
  } catch (_) {
    /* private mode: the book lives for this tab */
  }
}
export const bookVersion = () => version;
export function reloadBook() {
  store = null;
  version++;
}
export function resetBook() {
  store = blank();
  version++;
  save();
}

// ---- cards
export const cardKills = type => book().kills[type] || 0;
// the tier a kill count has reached: -1 (never seen) .. 3 (GOLD)
export const tierOf = n => CARD_GOALS.reduce((t, g, i) => (n >= g ? i : t), -1);
export const cardTier = type => tierOf(cardKills(type));
// kills still needed for the next tier, or 0 at GOLD
export const toNext = type => {
  const n = cardKills(type), t = tierOf(n);
  return t >= CARD_GOALS.length - 1 ? 0 : CARD_GOALS[t + 1] - n;
};
// a resident went down: returns the tier its card just reached, or -1 if it stayed put. Writes
// are batched: storage is touched on a tier change, and otherwise every tenth kill.
export function recordKill(type, n = 1) {
  if (!CARDS[type]) return -1;
  const B = book(), before = tierOf(B.kills[type] || 0);
  B.kills[type] = (B.kills[type] || 0) + n;
  const after = tierOf(B.kills[type]);
  if (after !== before) {
    if (after === CARD_GOALS.length - 1) version++;
    save();
    return after;
  }
  if (B.kills[type] % 10 === 0) save();
  return -1;
}
export const flushBook = () => store && save();

// ---- boss pages
export const bossBeaten = kind => !!book().bosses[kind];
export const pageDone = P => P.kinds.every(bossBeaten);
// a boss fell: returns 'page' when that completed its family's page, 'new' for a first win, or null
export function recordBoss(kind) {
  const P = PAGES.find(p => p.kinds.includes(kind));
  if (!P || bossBeaten(kind)) return null;
  book().bosses[kind] = 1;
  save();
  if (pageDone(P)) {
    version++;
    return 'page';
  }
  return 'new';
}

// ---- totals
export function bookStats() {
  const out = {};
  const add = s => {
    for (const k in s) out[k] = (out[k] || 0) + s[k];
  };
  for (const t of CARD_LIST) if (cardTier(t) >= CARD_GOALS.length - 1) add(CARDS[t].stats);
  for (const P of PAGES) if (pageDone(P)) add(PAGE_BONUS.stats);
  return out;
}
export function bookProgress() {
  const found = CARD_LIST.filter(t => cardTier(t) >= 0).length, gold = CARD_LIST.filter(t => cardTier(t) >= 3).length;
  const bosses = PAGES.reduce((s, P) => s + P.kinds.filter(bossBeaten).length, 0), all = PAGES.reduce((s, P) => s + P.kinds.length, 0);
  return { found, gold, cards: CARD_LIST.length, bosses, all, pages: PAGES.filter(pageDone).length };
}
