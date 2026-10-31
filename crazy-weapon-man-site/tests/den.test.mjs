import test from 'node:test';
import assert from 'node:assert/strict';
// a little in-memory localStorage, so the den saves and loads like it does in the browser
const mem = new Map();
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
const Den = await import('../game-src/data/den.js');
const { TYPE_LIST } = await import('../game-src/data/weapons.js');
const { ENEMIES } = await import('../game-src/data/enemies.js');
const { FILE_KEYS } = await import('../game-src/data/saves.js');
const { den, resetDen, reloadDen, welcome, addEgg, tapEgg, toBasket, feed, total, rebirth, runCup, claimCup, marketRows, buy, levelEgg, FAMILY, STATS, FOOD, EVOLVE_AT, CROWN_AT, BASKET_MAX, MAX_PETS, EVENT_LIST, CUPS, TAPS_TO_HATCH, DEN_KEY } = Den;

const weapon = (type, q = 3, extra = {}) => ({ type, q, name: `${type} ${q}`, standout: false, family: null, ...extra });
function hatch(zone = 0) {
  addEgg(zone);
  let r;
  for (let k = 0; k < TAPS_TO_HATCH; k++) r = tapEgg(den().eggs.length - 1, () => 0.5);
  return r.pet;
}

test('every weapon type feeds a stat, and every family has a hatchling and five grown forms that exist', () => {
  for (const t of TYPE_LIST) assert.ok(STATS.includes(FOOD[t]), t);
  for (const s of STATS) assert.ok(TYPE_LIST.some(t => FOOD[t] === s), s + ' has no food');
  assert.equal(FAMILY.length, 10);
  for (const F of FAMILY) {
    assert.equal(ENEMIES[F.baby]?.fam, F.fam, F.baby);
    assert.equal(ENEMIES[F.baby].evo, 1, F.baby + ' is not the family hatchling');
    const forms = STATS.map(s => F.forms[s]);
    assert.equal(new Set(forms).size, 5, F.fam + ' repeats a form');
    for (const f of forms) assert.equal(ENEMIES[f]?.fam, F.fam, f);
  }
});

test('the den is part of each save file', () => {
  assert.ok(FILE_KEYS.includes(DEN_KEY));
});

test('the first visit leaves a goose egg; three taps hatch it', () => {
  resetDen();
  assert.equal(welcome(), true);
  assert.equal(welcome(), false);
  assert.deepEqual(den().eggs.map(e => e.zone), [0]);
  assert.deepEqual(tapEgg(0), { taps: 1 });
  assert.deepEqual(tapEgg(0), { taps: 2 });
  const { pet } = tapEgg(0);
  assert.equal(pet.zone, 0);
  assert.equal(den().eggs.length, 0);
  assert.equal(den().pets.length, 1);
});

test('melted weapons fill the basket, and the oldest fall out when it is full', () => {
  resetDen();
  for (let i = 0; i < BASKET_MAX + 5; i++) toBasket(weapon('sword', i % 10));
  assert.equal(den().basket.length, BASKET_MAX);
  toBasket(null);
  toBasket({ type: 'spoon', q: 1 });
  assert.equal(den().basket.length, BASKET_MAX);
});

test('a hatchling grows into the family member of the stat it ate most', () => {
  resetDen();
  const p = hatch(0);
  let n = 0;
  while (!p.form && n++ < 200) {
    toBasket(weapon(n % 4 ? 'bow' : 'sword', 4));
    feed(p.id, den().basket.length - 1);
  }
  assert.equal(p.form, 'aim');
  assert.ok(total(p) >= EVOLVE_AT);
  assert.equal(FAMILY[0].forms.aim, 'gtoss');
  assert.ok(n > 10 && n < 60, `took ${n} weapons`);
});

test('elements give an aura, rarer weapons feed more, happy pets learn faster', () => {
  resetDen();
  const p = hatch(1);
  for (let i = 0; i < 5; i++) toBasket(weapon('hammer', 1, { family: 'ice' })), feed(p.id, 0);
  assert.equal(Den.auraOf(p), 'ice');
  assert.ok(Den.feedXp(weapon('sword', 8), p) > Den.feedXp(weapon('sword', 1), p));
  const sad = { joy: 0 }, glad = { joy: 100 };
  assert.ok(Den.feedXp(weapon('sword', 3), glad) > Den.feedXp(weapon('sword', 3), sad));
});

test('a crowned pet is reborn as an egg that keeps a quarter of its levels', () => {
  resetDen();
  const p = hatch(6);
  while (total(p) < CROWN_AT) toBasket(weapon('hammer', 10, { standout: true })), feed(p.id, 0);
  assert.equal(p.crowned, true);
  const guard = p.lv.guard;
  const egg = rebirth(p.id);
  assert.equal(egg.gen, 1);
  assert.equal(egg.keep.guard, Math.floor(guard / 4));
  assert.equal(den().pets.length, 0);
  const again = hatch(6);
  assert.ok(den().pets[0].lv.guard >= 0);
  assert.equal(again.zone, 6);
});

test('the den holds eight pets; a full den keeps its eggs', () => {
  resetDen();
  for (let i = 0; i < MAX_PETS; i++) hatch(i);
  addEgg(9);
  assert.deepEqual(tapEgg(0), { full: true });
  assert.equal(den().eggs.length, 1);
});

test('the den cup: a strong pet wins, wins open the next cup, places pay medals', () => {
  resetDen();
  const p = hatch(0);
  for (const s of STATS) p.lv[s] = 40;
  for (const ev of EVENT_LIST) {
    assert.ok(Den.cupOpen(ev, 0));
    assert.ok(!Den.cupOpen(ev, 1));
    let wins = 0;
    for (let s = 1; s <= 20; s++) {
      const r = runCup(ev, 0, p, s);
      assert.equal(r.field.length, 4);
      assert.ok(r.place >= 1 && r.place <= 4);
      if (r.place === 1) wins++;
    }
    assert.ok(wins >= 17, `${ev}: a level 40 pet only won ${wins}/20 bronze cups`);
    const r = runCup(ev, 0, p, 3);
    const before = den().medals;
    if (r.place === 1) {
      claimCup(r, p.id);
      assert.equal(den().medals, before + CUPS[0].prize);
      assert.ok(Den.cupOpen(ev, 1));
    }
  }
  // a fresh hatchling rarely wins the crown cup
  const baby = hatch(1);
  let wins = 0;
  for (let s = 1; s <= 20; s++) wins += runCup('race', 3, baby, s).place === 1;
  assert.ok(wins <= 2, `a baby won ${wins} crown cups`);
});

test('the market: medals buy treats and eggs, decorations wait for trophies, the snack costs shards', () => {
  resetDen();
  const p = hatch(0);
  den().medals = 100;
  const rows = marketRows(r => r === 2); // world 2's head beaten
  const row = id => rows.find(r => r.id === id);
  assert.equal(buy(row('treat:power'), p.id).ok, true);
  assert.equal(p.lv.power, 1);
  assert.equal(den().medals, 80);
  assert.equal(buy(row('egg:2')).err, 'NOT IN STOCK YET');
  assert.equal(buy(row('egg:1')).ok, true);
  assert.equal(buy(row('decor0')).ok, true);
  assert.equal(marketRows().find(r => r.id === 'decor0').owned, true);
  assert.equal(buy(row('decor3')).err, 'NOT IN STOCK YET');
  assert.equal(buy(row('treat:aim')).err, 'PICK A PET FIRST');
  assert.equal(buy(row('snack'), p.id, () => false).err, 'NOT ENOUGH SHARDS');
  assert.equal(buy(row('snack'), p.id, () => true).ok, true);
  den().medals = 0;
  assert.equal(buy(row('treat:aim'), p.id).err, 'NOT ENOUGH MEDALS');
});

test('castle heads always leave an egg; other levels sometimes do', () => {
  resetDen();
  assert.equal(levelEgg(4, { castleFirst: true, roll: 0.99 }), 4);
  assert.equal(levelEgg(4, { roll: 0.99 }), null);
  assert.equal(levelEgg(3, { roll: 0.01 }), 3);
});

test('the den survives a reload', () => {
  resetDen();
  const p = hatch(3);
  p.lv.speed = 7;
  toBasket(weapon('dagger'));
  feed(p.id, 0);
  den().medals = 33;
  Den.saveDen();
  reloadDen();
  assert.equal(den().pets[0].lv.speed >= 7, true);
  assert.equal(den().medals, 33);
  mem.set(DEN_KEY, '{broken');
  reloadDen();
  assert.equal(den().pets.length, 0);
});
