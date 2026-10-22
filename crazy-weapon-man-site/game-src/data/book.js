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
  // the goose family (zone 1)
  gosling: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'Its sword is made of wood. Its confidence is made of steel.' },
  honker: { stats: { knock: 0.03 }, bonus: 'Foes fly 3% further', lore: 'The honk comes first. The sword comes second. Both hurt.' },
  gsquire: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'Polishes its pot helm every morning and its shield every night.' },
  fencer: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Lunges first and apologises never. The feather in its hat is its own.' },
  gtoss: { stats: { shotSpeed: 0.02 }, bonus: 'Shots fly 2% faster', lore: 'Throws its sword every time. Catches it most times.' },
  whirl: { stats: { aoeSize: 0.02 }, bonus: 'Area effects reach 2% wider', lore: 'Learned the spinning slash by accident and never stopped.' },
  ggrave: { stats: { inv: 0.03 }, bonus: '+3% safety after a hit', lore: 'Still guards the grave of the sword it lost. Still angry about it.' },
  berserker: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Two swords, no plan, and a headband that says it all.' },
  swan: { stats: { critDmg: 0.04 }, bonus: 'Crits deal 4% more', lore: 'Duels at dawn, parries at noon, and has never once raised its voice.' },
  gander: { stats: { hp: 0.02 }, bonus: '+2% max health', lore: 'Every sword in the graveyard answers to it. Its claymore answers to nobody.' },
  // the dragon hoard family (zone 10)
  whelp: { stats: { hp: 0.02 }, bonus: '+2% max health', lore: 'Its first sword came out of the hoard. It has not let go of it since.' },
  pangolin: { stats: { knock: 0.03 }, bonus: 'Foes fly 3% further', lore: 'Rolls down the coin piles for fun, and down the corridors at you.' },
  magpie: { stats: { shards: 0.02 }, bonus: '+2% shards', lore: 'Steals anything that glints. Gives it back point first.' },
  armadillo: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'Duels by the rules: two daggers, one spin, and then the shell.' },
  ember: { stats: { critDmg: 0.04 }, bonus: 'Crits deal 4% more', lore: 'Draws once. The floor stays on fire a while afterwards.' },
  wyrmling: { stats: { aoeSize: 0.02 }, bonus: 'Area effects reach 2% wider', lore: 'Meditates on the hoard every morning. Breathes fire when it loses count.' },
  platedpango: { stats: { impact: 0.02 }, bonus: 'Hits land 2% harder', lore: 'Mints the vault\'s coins with one hammer blow each. Some come out hot.' },
  gemwyrm: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Grows its own crystals. Throws the ones that come out wrong.' },
  kobold: { stats: { speed: 0.02 }, bonus: '+2% move speed', lore: 'Guards the vault doors. Runs away from them, too, when it has to.' },
  elder: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Collected one of every weapon in the world, and learned them all.' },
  // the lizard ninja family (zone 9)
  gecko: { stats: { speed: 0.02 }, bonus: '+2% move speed', lore: 'Its hood is three sizes too big. Its pose is perfect.' },
  draco: { stats: { shotSpeed: 0.02 }, bonus: 'Shots fly 2% faster', lore: 'Jumps off the castle roof every night. Has not touched the ground in years.' },
  wallgecko: { stats: { inv: 0.03 }, bonus: '+3% safety after a hit', lore: 'Sticks to walls, ceilings and, once, the moon.' },
  chameleon: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Nobody has ever seen it. Plenty have seen its stars.' },
  frilled: { stats: { knock: 0.03 }, bonus: 'Foes fly 3% further', lore: 'The frill is for scaring you. The star is for everything else.' },
  anole: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'Carries nine smoke bombs. Has never once used a door.' },
  basilisk: { stats: { dashCd: 0.03 }, bonus: 'Dash returns 3% sooner', lore: 'Runs on water, rooftops and its own two feet. Never walks.' },
  iguana: { stats: { echo: 0.01 }, bonus: '1% of hits echo', lore: 'Its star always comes back. It has never had to fetch it.' },
  skink: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'Drops its tail, grows another, drops that too. Keeps the old ones as decoys.' },
  komodo: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Master of the castle clan. A thousand stars, and he knows where every one lands.' },
  // the owl, bunny and hedgehog family (zone 8)
  dustbunny: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'Lives under the cottage bed. Has learned exactly one spell and uses it a lot.' },
  hedgehog: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'Knitted its own cap. Curls up whenever anyone comments on it.' },
  owlet: { stats: { shotSpeed: 0.02 }, bonus: 'Shots fly 2% faster', lore: 'Too young to read the spellbook, so it drops whatever glows.' },
  hatrabbit: { stats: { shards: 0.02 }, bonus: '+2% shards', lore: 'Nobody knows what is in the hat. Including the rabbit.' },
  moth: { stats: { inv: 0.03 }, bonus: '+3% safety after a hit', lore: 'Weaves the cottage curtains from its own wing-dust. Sneezing is not allowed.' },
  polyhare: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Thinks everyone would be happier as a bunny. Has not yet been proved wrong.' },
  teahog: { stats: { hp: 0.02 }, bonus: '+2% max health', lore: 'The kettle is always on. The teacups have opinions.' },
  mirrorowl: { stats: { echo: 0.01 }, bonus: '1% of hits echo', lore: 'Never learned a spell of its own. Borrows yours.' },
  broombat: { stats: { knock: 0.03 }, bonus: 'Foes fly 3% further', lore: 'Delivers the cottage post by broom. Stars included free.' },
  hornedowl: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Wrote every book on the cottage shelves, and the meteor chapter twice.' },
  // the bear, badger and boar family (zone 7)
  cub: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'Sweeps the forge floor, fetches the coal, and is not yet allowed near the big hammers.' },
  badger: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Fixes the pipes under the forge. Prefers to come up through the floor.' },
  boarbellows: { stats: { knock: 0.03 }, bonus: 'Foes fly 3% further', lore: 'Works the bellows with its trotters and charges with its head. The fire follows.' },
  bearsmith: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Forged half the hammers in the world. The floor of its workshop is all cracks.' },
  honeybadger: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'Does not care. Hit it and find out just how much it does not care.' },
  anviltoss: { stats: { hp: 0.02 }, bonus: '+2% max health', lore: 'Delivers anvils. By air.' },
  wolverine: { stats: { echo: 0.01 }, bonus: '1% of hits echo', lore: 'Puts in a thousand rivets a day, two at a time, spinning.' },
  moltenboar: { stats: { aoeSize: 0.02 }, bonus: 'Area effects reach 2% wider', lore: 'Runs hotter than the furnace. Has to sit in the quench tank twice a shift.' },
  grizzly: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'One ring of its bell and every smith in the forge picks up the pace.' },
  polarbear: { stats: { inv: 0.03 }, bonus: '+3% safety after a hit', lore: 'Came down from the ice to work the cold-iron. Wears most of it.' },
  // the monkey, goat and yak family (zone 6)
  macaque: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'First week at the monastery. The robe is a hand-me-down and the staff is a broom handle.' },
  vaultmonkey: { stats: { knock: 0.03 }, bonus: 'Foes fly 3% further', lore: 'Has never once used the stairs.' },
  goatmonk: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'Keeps the mountain gate. Headbutts first, bows politely after.' },
  gibbon: { stats: { aoeSize: 0.02 }, bonus: 'Area effects reach 2% wider', lore: 'Arms longer than its staff, and its staff is very long.' },
  snowsage: { stats: { hp: 0.02 }, bonus: '+2% max health', lore: 'Meditates in the hot spring every morning. Every monk it touches feels better.' },
  baboon: { stats: { shotSpeed: 0.02 }, bonus: 'Shots fly 2% faster', lore: 'Its staff grows when it shouts. It shouts a lot.' },
  ibex: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Lives on a cliff with no paths. Comes down to train, and to land on visitors.' },
  langur: { stats: { echo: 0.01 }, bonus: '1% of hits echo', lore: 'Five strikes before you blink, and the fifth sends you to the rafters.' },
  yak: { stats: { inv: 0.03 }, bonus: '+3% safety after a hit', lore: 'Has stood at the temple door so long the floor remembers its slam.' },
  cloudape: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Rides a cloud, splits into three, and has never lost a sparring match to any of them.' },
  // the dog and fox family (zone 5)
  shibapup: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'Its katana is taller than it is. It has fallen over it four times today.' },
  corgi: { stats: { knock: 0.03 }, bonus: 'Foes fly 3% further', lore: 'Short legs, a low stance and a sweep that takes out every ankle in the shrine.' },
  akita: { stats: { critDmg: 0.04 }, bonus: 'Crits deal 4% more', lore: 'Draws, cuts and sheathes before the petal it was watching reaches the ground.' },
  petalfox: { stats: { inv: 0.03 }, bonus: '+3% safety after a hit', lore: 'The one you hit was petals. It always is.' },
  husky: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'Has guarded the same gate for nine winters. Nothing has got past it yet.' },
  twininu: { stats: { echo: 0.01 }, bonus: '1% of hits echo', lore: 'Two katanas and no idea which one it likes more.' },
  windfox: { stats: { shotSpeed: 0.02 }, bonus: 'Shots fly 2% faster', lore: 'Cuts the air itself, and the air goes where it is told.' },
  houndguard: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Throws the kunai first and asks the questions with the katana.' },
  tosa: { stats: { hp: 0.02 }, bonus: '+2% max health', lore: 'Grand champion of the shrine. Its charge has never once been stopped.' },
  ninetail: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Nine tails, nine hundred years, and every cherry tree in the shrine answers to it.' },
  // the cat and raccoon family (zone 4)
  alleykit: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'Found its knife in a fish crate. It has not let go of either since.' },
  pickpocket: { stats: { shards: 0.02 }, bonus: '+2% shards', lore: 'Never steals more than it can carry. Carries a very large sack.' },
  cutpurse: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Walks straight through a crowd and out the other side with everyone\'s purse.' },
  lanterncat: { stats: { inv: 0.03 }, bonus: '+3% safety after a hit', lore: 'Carries a lantern and never lights it. The eyes are enough.' },
  juggler: { stats: { shotSpeed: 0.02 }, bonus: 'Shots fly 2% faster', lore: 'Juggles six daggers for the tourists. Throws three at everyone else.' },
  shadowtom: { stats: { critDmg: 0.04 }, bonus: 'Crits deal 4% more', lore: 'Lost the eye in a fair fight. Has not had one of those since.' },
  siamese: { stats: { echo: 0.01 }, bonus: '1% of hits echo', lore: 'Two daggers, four cuts, and not one hair out of place.' },
  prowler: { stats: { knock: 0.03 }, bonus: 'Foes fly 3% further', lore: 'Sleeps on the awnings all day. Wakes up for exactly one thing.' },
  bandit: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'Fights inside a cloud of its own making. Nobody has seen its face, or its paws.' },
  fatcat: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Owns the bazaar, the stalls, the thieves, and probably that dagger you just bought.' },
  // the turtle and frog family (zone 3)
  tadpole: { stats: { attackSpeed: 0.01 }, bonus: 'Attack 1% faster', lore: 'Its legs came in last week. Its nunchucks came in first.' },
  pondfrog: { stats: { knock: 0.03 }, bonus: 'Foes fly 3% further', lore: 'Its tongue has a longer reach than its chucks, and it knows it.' },
  snapper: { stats: { armor: 0.01 }, bonus: 'Take 1% less damage', lore: 'Ducks into its shell at the first hit, comes out snapping at the second.' },
  spinturtle: { stats: { aoeSize: 0.02 }, bonus: 'Area effects reach 2% wider', lore: 'A brilliant spin. A terrible landing. It has never once landed the right way up.' },
  toadmonk: { stats: { echo: 0.01 }, bonus: '1% of hits echo', lore: 'Counts to four with its chucks. Nobody has ever been on the ground for five.' },
  lilylurker: { stats: { crit: 0.01 }, bonus: '+1% critical chance', lore: 'Has been a lily pad for three days. Waiting is the whole technique.' },
  bubblenewt: { stats: { shotSpeed: 0.02 }, bonus: 'Shots fly 2% faster', lore: 'Its chucks spin so fast they blow bubbles. Its bubbles are very hard to leave.' },
  shellback: { stats: { inv: 0.03 }, bonus: '+3% safety after a hit', lore: 'Never turns its back on a fight, except on purpose, and then you regret it.' },
  bullfrog: { stats: { hp: 0.02 }, bonus: '+2% max health', lore: 'The dojo floor has three dents in it. They all have its name on.' },
  grandsnapper: { stats: { dmg: 0.01 }, bonus: '+1% damage', lore: 'Black belt, white beard, iron chucks, and a hundred years of practice.' },
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
