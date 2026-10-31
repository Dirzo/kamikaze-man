// The Beast Den (Sonic Adventure 2's Chao Garden, in weapon fantasy): raise beastkin hatchlings
// between runs. Pure data and rules, kept in localStorage per save file, safe to import from node.
//   EGGS       each world's family lays them: the castle head drops one the first time it falls,
//              any cleared level has a small chance to turn one up, and the Den Market sells the
//              eggs of every family whose head you have beaten. Tap an egg in the nest to hatch it.
//   BASKET     every weapon that melts during a run (salvaged, filtered, swapped out) lands in the
//              Feed Basket with its type, rarity and element. Pets eat from it, like Chaos Drives.
//   STATS      what a pet eats decides how it grows: blades build POWER, quick weapons SPEED, poles
//              REACH, ranged weapons AIM and hammers GUARD. Rarer weapons feed more; a happy pet
//              (pet it!) learns faster. Elements give it an aura in that element's colour.
//   EVOLUTION  at EVOLVE_AT total levels a hatchling grows into the family member that matches the
//              stat it ate most (a POWER goose becomes a Black Swan Duelist, an AIM goose a Blade
//              Tosser). At CROWN_AT it earns a crown and can be REBORN as a fresh egg that keeps a
//              share of its levels. Nothing ever dies.
//   DEN CUP    three events, four cups each: the RACE (speed, reach), SPARRING (power, guard) and
//              TARGETS (aim, speed). Placing pays MEDALS; winning a cup opens the next one.
//   MARKET     medals buy treats (+1 level in a stat), eggs, toys and decorations (each world's props,
//              once its head is beaten). A SHARD SNACK costs banked shards instead.
export const DEN_KEY = 'crazyWeaponMan.den.v1';

// ---------------------------------------------------------------- stats and food
export const STATS = ['power', 'speed', 'reach', 'aim', 'guard'];
export const STAT_INFO = {
  power: { name: 'POWER', col: 'coral' },
  speed: { name: 'SPEED', col: 'lime' },
  reach: { name: 'REACH', col: 'sand' },
  aim: { name: 'AIM', col: 'sky' },
  guard: { name: 'GUARD', col: 'violet' }
};
// which stat each weapon type feeds
export const FOOD = {
  sword: 'power', axe: 'power', scythe: 'power',
  dagger: 'speed', katana: 'speed', nunchucks: 'speed',
  staff: 'reach', spear: 'reach', boomerang: 'reach',
  bow: 'aim', shuriken: 'aim', wand: 'aim',
  hammer: 'guard'
};
export const FEED = { base: 20, perQ: 6, standout: 20, joy: 0.3, guardBonus: 1.5 }; // xp per weapon (hammers alone feed GUARD, so they feed it more)
export const XP_PER_LEVEL = 100;
export const STAT_MAX = 99;
export const EVOLVE_AT = 12; // total stat levels
export const CROWN_AT = 60;
export const REBIRTH_KEEP = 0.25; // share of each stat a reborn egg keeps
export const MAX_PETS = 8;
export const MAX_EGGS = 6;
export const BASKET_MAX = 40;
export const LEVEL_EGG_CHANCE = 0.12;

// ---------------------------------------------------------------- families
// zone -> the family's hatchling, and the grown form for each stat
export const FAMILY = [
  { fam: 'goose', name: 'GOOSE', baby: 'gosling', col: '#f4f1e8', spot: '#ffc15a', forms: { power: 'swan', speed: 'berserker', reach: 'fencer', aim: 'gtoss', guard: 'gsquire' } },
  { fam: 'fuzz', name: 'FUZZBALL', baby: 'fuzzlet', col: '#c3c4d6', spot: '#a8dcfd', forms: { power: 'yeticub', speed: 'wolfpup', reach: 'quillback', aim: 'moss', guard: 'burrball' } },
  { fam: 'lagoon', name: 'LAGOON', baby: 'tadpole', col: '#7cc254', spot: '#3bb8a8', forms: { power: 'shellback', speed: 'spinturtle', reach: 'toadmonk', aim: 'bubblenewt', guard: 'snapper' } },
  { fam: 'bazaar', name: 'BAZAAR', baby: 'alleykit', col: '#f08a2c', spot: '#5d2f14', forms: { power: 'prowler', speed: 'siamese', reach: 'cutpurse', aim: 'juggler', guard: 'bandit' } },
  { fam: 'shrine', name: 'SHRINE', baby: 'shibapup', col: '#ff6fb5', spot: '#f4f1e8', forms: { power: 'akita', speed: 'petalfox', reach: 'twininu', aim: 'windfox', guard: 'husky' } },
  { fam: 'temple', name: 'TEMPLE', baby: 'macaque', col: '#c9a66b', spot: '#c4501f', forms: { power: 'goatmonk', speed: 'langur', reach: 'baboon', aim: 'gibbon', guard: 'snowsage' } },
  { fam: 'forge', name: 'FORGE', baby: 'cub', col: '#8a4f22', spot: '#f08a2c', forms: { power: 'bearsmith', speed: 'honeybadger', reach: 'wolverine', aim: 'anviltoss', guard: 'moltenboar' } },
  { fam: 'cottage', name: 'COTTAGE', baby: 'dustbunny', col: '#f8e08e', spot: '#7a4bc2', forms: { power: 'teahog', speed: 'owlet', reach: 'polyhare', aim: 'hatrabbit', guard: 'hedgehog' } },
  { fam: 'castle', name: 'NINJA', baby: 'gecko', col: '#4f8a3a', spot: '#1d2b6b', forms: { power: 'basilisk', speed: 'wallgecko', reach: 'draco', aim: 'iguana', guard: 'frilled' } },
  { fam: 'hoard', name: 'HOARD', baby: 'whelp', col: '#c4363e', spot: '#ffc15a', forms: { power: 'ember', speed: 'pangolin', reach: 'wyrmling', aim: 'magpie', guard: 'armadillo' } }
];
// a pet's sprite: its family's hatchling, or the grown form it evolved into
export const petSprite = p => (p.form ? FAMILY[p.zone].forms[p.form] : FAMILY[p.zone].baby);

const NAMES = ['PIP', 'RIVET', 'TASSEL', 'NOCK', 'POMMEL', 'FLETCH', 'BRISTLE', 'CLANK', 'HILT', 'QUILL', 'SPROCKET', 'BODKIN', 'MOCHI', 'SABRE', 'TOFFEE', 'BRAMBLE',
  'TINDER', 'GUSSET', 'WICKET', 'BIRCH', 'NUTMEG', 'FERRULE', 'DUMPLING', 'GRIT', 'SPARK', 'TWIG', 'BUTTON', 'KETTLE', 'MAPLE', 'PEBBLE', 'ACORN', 'FUSE'];

// ---------------------------------------------------------------- the den cup
export const EVENTS = {
  race: { name: 'RACE', w: { speed: 0.65, reach: 0.35 }, desc: 'A dash across the den: SPEED runs, REACH clears the hurdles' },
  spar: { name: 'SPARRING', w: { power: 0.55, guard: 0.45 }, desc: 'Three bouts on the mat: POWER lands blows, GUARD shrugs them off' },
  targets: { name: 'TARGETS', w: { aim: 0.8, speed: 0.2 }, desc: 'Ten targets pop up: AIM hits them, SPEED gets there first' }
};
export const EVENT_LIST = Object.keys(EVENTS);
export const CUPS = [
  { id: 'bronze', name: 'BRONZE CUP', col: 'orange', rival: 3, prize: 10 },
  { id: 'silver', name: 'SILVER CUP', col: 'mist', rival: 8, prize: 25 },
  { id: 'gold', name: 'GOLD CUP', col: 'gold', rival: 15, prize: 50 },
  { id: 'crown', name: 'CROWN CUP', col: 'pink', rival: 26, prize: 100 }
];
export const PLACE_PAY = [1, 0.4, 0.2, 0.1]; // share of the prize for 1st..4th

// ---------------------------------------------------------------- the den market
// treats raise one stat a level; the toy cheers everyone up; decorations are each world's props
// (art from that zone's biome atlas), sold once you have beaten its family head
export const TREATS = {
  power: { name: 'WHETSTONE BISCUIT', price: 20 },
  speed: { name: 'SWIFT FEATHER', price: 20 },
  reach: { name: 'LONG LICORICE POLE', price: 20 },
  aim: { name: 'FLETCHING JERKY', price: 20 },
  guard: { name: 'ANVIL CRUMBLE', price: 20 }
};
export const EGG_PRICE = 40;
export const TOY = { id: 'mace', name: 'SQUEAKY MACE', price: 30, desc: 'A rubber mace to chase: every pet gets happier' };
export const SNACK = { name: 'SHARD SNACK', shards: 150, desc: '+1 level in every stat for the pet you pick' };
// [zone, prop sprite in that zone's biome atlas, name]
export const DECOR = [
  [0, 'banner', 'GRAVEYARD BANNER'], [1, 'snowman', 'SNOWMAN'], [2, 'lantern', 'LAGOON LANTERN'], [3, 'lamp', 'BAZAAR LAMP'], [4, 'torii', 'TORII GATE'],
  [5, 'bell', 'TEMPLE BELL'], [6, 'anvil', 'FORGE ANVIL'], [7, 'hive', 'HONEY HIVE'], [8, 'chochin', 'PAPER LANTERN'], [9, 'chest', 'TREASURE CHEST']
].map(([zone, sprite, name]) => ({ id: 'decor' + zone, zone, sprite, name, price: 25 }));

// ---------------------------------------------------------------- save
let storage = null;
try {
  storage = globalThis.localStorage || null;
} catch (_) {
  storage = null;
}
let store = null;
const blank = () => ({ v: 1, pets: [], eggs: [], basket: [], medals: 0, cups: Object.fromEntries(EVENT_LIST.map(ev => [ev, 0])), owned: {}, starter: false, nextId: 1, hatched: 0 });
const num = (v, lo, hi, d = lo) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : d);
const statObj = (raw, hi) => Object.fromEntries(STATS.map(s => [s, num(raw?.[s], 0, hi, 0)]));
function cleanPet(p, id) {
  if (!p || !FAMILY[p.zone]) return null;
  return {
    id, zone: +p.zone, name: String(p.name || NAMES[0]).slice(0, 12), form: STATS.includes(p.form) ? p.form : null, crowned: !!p.crowned,
    lv: statObj(p.lv, STAT_MAX), xp: statObj(p.xp, XP_PER_LEVEL - 1), fed: statObj(p.fed, 1e6), el: p.el && typeof p.el === 'object' ? Object.fromEntries(Object.entries(p.el).slice(0, 8).map(([k, v]) => [k, num(v, 0, 1e6)])) : {},
    joy: num(p.joy, 0, 100, 50), gen: num(p.gen, 0, 99, 0)
  };
}
function load() {
  const out = blank();
  try {
    const raw = JSON.parse(storage?.getItem(DEN_KEY) || 'null');
    if (raw && raw.v === 1) {
      out.nextId = num(raw.nextId, 1, 1e9, 1);
      out.pets = (raw.pets || []).map(p => cleanPet(p, out.nextId++)).filter(Boolean).slice(0, MAX_PETS);
      out.eggs = (raw.eggs || []).filter(e => e && FAMILY[e.zone]).slice(0, MAX_EGGS).map(e => ({ zone: +e.zone, gen: num(e.gen, 0, 99), keep: e.keep ? statObj(e.keep, STAT_MAX) : null, taps: 0 }));
      out.basket = (raw.basket || []).filter(w => w && FOOD[w.type]).slice(-BASKET_MAX);
      out.medals = num(raw.medals, 0, 1e7);
      for (const ev of EVENT_LIST) out.cups[ev] = num(raw.cups?.[ev], 0, CUPS.length);
      for (const k of Object.keys(raw.owned || {})) if (k === TOY.id || DECOR.some(d => d.id === k)) out.owned[k] = 1;
      out.starter = !!raw.starter;
      out.hatched = num(raw.hatched, 0, 1e6);
    }
  } catch (_) {
    /* a broken den starts fresh */
  }
  for (const ev of EVENT_LIST) out.cups[ev] ??= 0;
  return out;
}
export const den = () => (store ||= load());
export function saveDen() {
  try {
    storage?.setItem(DEN_KEY, JSON.stringify(den()));
  } catch (_) {
    /* private mode: the den lives for this tab */
  }
}
export const reloadDen = () => (store = null);
export function resetDen() {
  store = blank();
  saveDen();
}

// ---------------------------------------------------------------- eggs
// the first visit gives a goose egg, so there's always someone to raise
export function welcome() {
  const d = den();
  if (d.starter) return false;
  d.starter = true;
  d.eggs.push({ zone: 0, gen: 0, keep: null, taps: 0 });
  saveDen();
  return true;
}
export function addEgg(zone, extra = {}) {
  const d = den();
  if (!FAMILY[zone] || d.eggs.length >= MAX_EGGS) return null;
  const egg = { zone, gen: extra.gen || 0, keep: extra.keep || null, taps: 0 };
  d.eggs.push(egg);
  saveDen();
  return egg;
}
// a level was cleared: its castle head drops the family egg the first time, any other level may turn one up
export function levelEgg(zone, { castleFirst = false, roll = Math.random() } = {}) {
  if (castleFirst || roll < LEVEL_EGG_CHANCE) return addEgg(zone) ? zone : null;
  return null;
}
export const TAPS_TO_HATCH = 3;
// tap an egg: it wobbles, and on the third tap it hatches (null until then, or when the den is full)
export function tapEgg(i, rnd = Math.random) {
  const d = den(), e = d.eggs[i];
  if (!e) return null;
  if (d.pets.length >= MAX_PETS) return { full: true };
  if (++e.taps < TAPS_TO_HATCH) return { taps: e.taps };
  d.eggs.splice(i, 1);
  const used = new Set(d.pets.map(p => p.name));
  const free = NAMES.filter(n => !used.has(n));
  const pet = cleanPet({ zone: e.zone, name: free[Math.floor(rnd() * free.length)] || 'PIP', lv: e.keep || {}, gen: e.gen, joy: 60 }, d.nextId++);
  d.pets.push(pet);
  d.hatched++;
  saveDen();
  return { pet };
}

// ---------------------------------------------------------------- the basket and feeding
// a weapon melted: it lands in the basket (the oldest falls out when it's full)
export function toBasket(w) {
  if (!w || !FOOD[w.type]) return;
  const d = den();
  d.basket.push({ type: w.type, q: w.q | 0, family: w.family || null, standout: !!w.standout, name: w.name || w.type, look: w.look || null });
  if (d.basket.length > BASKET_MAX) d.basket.splice(0, d.basket.length - BASKET_MAX);
  saveDen();
}
export const total = p => STATS.reduce((s, k) => s + p.lv[k], 0);
export const feedXp = (w, p) => Math.round((FEED.base + FEED.perQ * w.q + (w.standout ? FEED.standout : 0)) * (FOOD[w.type] === 'guard' ? FEED.guardBonus : 1) * (1 + (FEED.joy * (p?.joy ?? 0)) / 100));
// add xp to a stat; returns the levels gained
export function grow(p, stat, xp) {
  let ups = 0;
  p.xp[stat] += xp;
  while (p.xp[stat] >= XP_PER_LEVEL && p.lv[stat] < STAT_MAX) (p.xp[stat] -= XP_PER_LEVEL), p.lv[stat]++, ups++;
  if (p.lv[stat] >= STAT_MAX) p.xp[stat] = 0;
  return ups;
}
// the stat a hatchling has eaten most (ties go to the higher level)
export const favourite = p => STATS.reduce((b, s) => (p.fed[s] > p.fed[b] || (p.fed[s] === p.fed[b] && p.lv[s] > p.lv[b]) ? s : b), STATS[0]);
// a hatchling that reached EVOLVE_AT grows up; anyone at CROWN_AT earns the crown
function settle(p) {
  const out = {};
  if (!p.form && total(p) >= EVOLVE_AT) (p.form = favourite(p)), (out.evolved = p.form);
  if (!p.crowned && total(p) >= CROWN_AT) (p.crowned = true), (out.crowned = true);
  return out;
}
export const auraOf = p => {
  const [el, n] = Object.entries(p.el).sort((a, b) => b[1] - a[1])[0] || [];
  return n >= 5 ? el : null;
};
// feed basket item i to a pet
export function feed(petId, i) {
  const d = den(), p = d.pets.find(q => q.id === petId), w = d.basket[i];
  if (!p || !w) return null;
  d.basket.splice(i, 1);
  const stat = FOOD[w.type], xp = feedXp(w, p);
  p.fed[stat] += 1;
  if (w.family) p.el[w.family] = (p.el[w.family] || 0) + 1;
  p.joy = Math.min(100, p.joy + 3);
  const ups = grow(p, stat, xp);
  const res = { stat, xp, ups, ...settle(p) };
  saveDen();
  return res;
}
export function pat(petId) {
  const p = den().pets.find(q => q.id === petId);
  if (!p) return 0;
  p.joy = Math.min(100, p.joy + 6);
  saveDen();
  return p.joy;
}
// a crowned pet goes back into an egg that keeps a share of its levels
export const canRebirth = p => !!p && p.crowned;
export function rebirth(petId) {
  const d = den(), i = d.pets.findIndex(q => q.id === petId), p = d.pets[i];
  if (!canRebirth(p) || d.eggs.length >= MAX_EGGS) return null;
  d.pets.splice(i, 1);
  const keep = Object.fromEntries(STATS.map(s => [s, Math.floor(p.lv[s] * REBIRTH_KEEP)]));
  const egg = { zone: p.zone, gen: p.gen + 1, keep, taps: 0 };
  d.eggs.push(egg);
  saveDen();
  return egg;
}

// ---------------------------------------------------------------- the den cup
// how good a pet is at an event: its weighted stats, a little joy, and a bonus when its grown form
// is the event's main stat
export function rating(p, ev) {
  const E = EVENTS[ev];
  let r = 0;
  for (const [s, w] of Object.entries(E.w)) r += w * p.lv[s];
  const main = Object.entries(E.w).sort((a, b) => b[1] - a[1])[0][0];
  return r + p.joy / 25 + (p.form === main ? 3 : 0) + p.gen;
}
export const cupOpen = (ev, tier) => tier <= den().cups[ev];
// a seeded random so a cup plays out the same way in tests
export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// rivals: other families' beastkin, babies in the bronze cup and grown forms after it
function rivals(tier, own, R, taken) {
  const out = [], names = NAMES.filter(n => !taken.includes(n));
  while (out.length < 3) {
    const zone = Math.floor(R() * FAMILY.length);
    if (zone === own && R() < 0.6) continue;
    const F = FAMILY[zone], form = tier ? STATS[Math.floor(R() * STATS.length)] : null;
    const sprite = form ? F.forms[form] : F.baby;
    out.push({ zone, sprite, name: names.splice(Math.floor(R() * names.length), 1)[0], r: CUPS[tier].rival * (0.75 + 0.5 * R()) });
  }
  return out;
}
// play a cup out. Returns the field (the pet first) and what the scene animates:
//   race     finish times (seconds)       spar  three bouts of five exchanges
//   targets  ten shots each (hit or miss), the pet's in order
export function runCup(ev, tier, p, seed = Date.now()) {
  const R = seeded(seed | 0), mine = rating(p, ev);
  const field = [{ zone: p.zone, sprite: petSprite(p), name: p.name, r: mine, pet: true }, ...rivals(tier, p.zone, R, den().pets.map(q => q.name).concat(p.name))];
  let place;
  if (ev === 'race') {
    for (const f of field) f.time = 9 * (20 / (20 + f.r)) * (0.9 + 0.2 * R());
    const slow = Math.max(...field.map(f => f.time));
    for (const f of field) f.time = (6.5 * f.time) / slow;
    place = 1 + field.slice(1).filter(f => f.time < field[0].time).length;
  } else if (ev === 'spar') {
    let wins = 0;
    const bouts = field.slice(1).map(rv => {
      const pWin = (mine + 2) / (mine + rv.r + 4), hits = [];
      for (let k = 0; k < 5; k++) hits.push(R() < pWin ? 1 : 0);
      const won = hits.reduce((a, b) => a + b, 0) >= 3;
      wins += won;
      return { rival: rv, hits, won };
    });
    field[0].bouts = bouts;
    place = 4 - wins;
  } else {
    for (const f of field) {
      const pHit = Math.min(0.97, 0.2 + (0.75 * f.r) / (f.r + 10));
      f.shots = Array.from({ length: 10 }, () => (R() < pHit ? 1 : 0));
      f.score = f.shots.reduce((a, b) => a + b, 0);
    }
    place = 1 + field.slice(1).filter(f => f.score > field[0].score).length;
  }
  return { ev, tier, field, place, medals: Math.round(CUPS[tier].prize * PLACE_PAY[place - 1]) };
}
// bank a finished cup: medals, a little joy, and the next cup opens on a win
export function claimCup(res, petId) {
  const d = den(), p = d.pets.find(q => q.id === petId);
  d.medals += res.medals;
  if (p) p.joy = Math.min(100, p.joy + (res.place === 1 ? 10 : 4));
  const opened = res.place === 1 && d.cups[res.ev] === res.tier && res.tier < CUPS.length;
  if (opened) d.cups[res.ev] = res.tier + 1;
  saveDen();
  return { opened: opened && res.tier + 1 < CUPS.length ? CUPS[res.tier + 1].name : null, champion: opened && res.tier + 1 === CUPS.length };
}

// ---------------------------------------------------------------- the den market
// every row the market lists; `ok(trophies)` says whether it's on sale yet
export function marketRows(hasTrophy = () => false) {
  const d = den(), rows = [];
  for (const s of STATS) rows.push({ id: 'treat:' + s, name: TREATS[s].name, price: TREATS[s].price, desc: `+1 ${STAT_INFO[s].name} for the pet you pick`, pet: true, stat: s });
  rows.push({ id: 'snack', name: SNACK.name, shards: SNACK.shards, desc: SNACK.desc, pet: true });
  rows.push({ id: TOY.id, name: TOY.name, price: TOY.price, desc: TOY.desc, owned: !!d.owned[TOY.id] });
  for (let z = 0; z < FAMILY.length; z++) {
    const open = z === 0 || hasTrophy(z + 1);
    rows.push({ id: 'egg:' + z, name: FAMILY[z].name + ' EGG', price: EGG_PRICE, desc: open ? `Hatches a ${FAMILY[z].name.toLowerCase()} hatchling` : `Beat world ${z + 1}'s family head to stock it`, locked: !open, zone: z });
  }
  for (const D of DECOR) {
    const open = D.zone === 0 || hasTrophy(D.zone + 1);
    rows.push({ id: D.id, name: D.name, price: D.price, desc: open ? `A piece of world ${D.zone + 1} for the den` : `Beat world ${D.zone + 1}'s family head to stock it`, locked: !open, owned: !!d.owned[D.id], decor: D });
  }
  return rows;
}
// buy a row (for a pet when the row needs one). spendShards(n) -> bool pays for the snack.
export function buy(row, petId = null, spendShards = () => false) {
  const d = den();
  if (row.locked) return { err: 'NOT IN STOCK YET' };
  if (row.owned) return { err: 'ALREADY IN THE DEN' };
  const p = row.pet ? d.pets.find(q => q.id === petId) : null;
  if (row.pet && !p) return { err: 'PICK A PET FIRST' };
  if (row.id.startsWith('egg:') && d.eggs.length >= MAX_EGGS) return { err: 'THE NEST IS FULL' };
  if (row.shards) {
    if (!spendShards(row.shards)) return { err: 'NOT ENOUGH SHARDS' };
  } else if (d.medals < row.price) return { err: 'NOT ENOUGH MEDALS' };
  else d.medals -= row.price;
  let out = { ok: true };
  if (row.stat) {
    p.fed[row.stat] += 3;
    out.ups = grow(p, row.stat, XP_PER_LEVEL);
    out = { ...out, ...settle(p) };
  } else if (row.id === 'snack') {
    for (const s of STATS) grow(p, s, XP_PER_LEVEL);
    out = { ...out, ...settle(p) };
  } else if (row.id.startsWith('egg:')) d.eggs.push({ zone: row.zone, gen: 0, keep: null, taps: 0 });
  else {
    d.owned[row.id] = 1;
    if (row.id === TOY.id) for (const q of d.pets) q.joy = Math.min(100, q.joy + 20);
  }
  saveDen();
  return out;
}
