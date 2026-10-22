// The polish pass: Monster Book, TEMPER tiers, weapon relics, hidden portals, level gimmicks and eggs
import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, CARD_LIST, CARD_GOALS, PAGES, tierOf, recordKill, recordBoss, cardTier, bookStats, bookProgress, resetBook, pageDone, BOOK_KEY } from '../game-src/data/book.js';
import { stats } from '../game-src/data/meta.js';
import { FILE_KEYS } from '../game-src/data/saves.js';
import { ENEMIES } from '../game-src/data/enemies.js';
import { temper, temperOf, setTemper, temperClear, modsOf, MODS, TEMPER_MAX } from '../game-src/data/temper.js';
import { relicSpots, roomRelicSpot, keepRelics, relicCount, allRelics, relicTotal, RELIC_COUNT } from '../game-src/data/relics.js';
import { makeMap, hiddenSpot, secretRoom, ROOM_KINDS } from '../game-src/data/maps.js';
import { GIMMICK_OF, GIMMICKS, EGG_LEVELS, gimmickOf } from '../game-src/data/gimmicks.js';
import { LEVELS, NODES, FINAL } from '../game-src/data/overworld.js';

test('the Monster Book has a card with a bonus for every resident type, and a page per family', () => {
  for (const t of CARD_LIST) assert.ok(ENEMIES[t] && CARDS[t].bonus && CARDS[t].lore && Object.keys(CARDS[t].stats).length, t);
  assert.equal(PAGES.length, 10);
  assert.equal(PAGES.reduce((s, P) => s + P.kinds.length, 0), LEVELS.length, 'every level boss sits on one page');
  for (const P of PAGES) assert.ok(P.kinds.includes(P.head), P.name + ' has its head');
});

test('cards climb FOUND, BRONZE, SILVER, GOLD and only GOLD cards and full pages add stats', () => {
  resetBook();
  assert.deepEqual([0, 1, 19, 20, 80, 249, 250].map(tierOf), [-1, 0, 0, 1, 2, 2, 3]);
  const before = stats().dmg;
  assert.equal(recordKill('stalker'), 0);
  assert.equal(recordKill('stalker', 18), -1);
  assert.equal(recordKill('stalker'), 1);
  assert.equal(stats().dmg, before, 'a BRONZE card gives nothing yet');
  assert.equal(recordKill('stalker', CARD_GOALS[3]), 3);
  assert.equal(cardTier('stalker'), 3);
  assert.ok(Math.abs(stats().dmg - before - CARDS.stalker.stats.dmg) < 1e-9, 'GOLD adds its bonus, and the stat cache notices');
  assert.equal(recordKill('notaresident'), -1);
  const P = PAGES[0], bossDmg = stats().bossDmg;
  P.kinds.slice(0, -1).forEach(k => assert.equal(recordBoss(k), 'new'));
  assert.equal(recordBoss(P.kinds[0]), null, 'a boss counts once');
  assert.equal(recordBoss(P.kinds.at(-1)), 'page');
  assert.ok(pageDone(P) && stats().bossDmg > bossDmg);
  assert.deepEqual(bookStats(), { dmg: CARDS.stalker.stats.dmg, bossDmg: 0.02 });
  assert.equal(bookProgress().pages, 1);
  resetBook();
  assert.equal(stats().dmg, before);
  assert.ok(FILE_KEYS.includes(BOOK_KEY), 'the book belongs to the save file');
});

test('TEMPER: the final castle opens tier 1, then each castle at your top tier opens the next', () => {
  const save = {};
  assert.deepEqual(temperOf(save), { on: 0, max: 0 });
  assert.equal(setTemper(save, 3), 0, 'nothing to pick before the Armory falls');
  assert.equal(temperClear(save, '1-C'), 0);
  assert.equal(temperClear(save, FINAL), 1);
  assert.equal(temperClear(save, FINAL), 0, 'clearing it again at temper 0 opens nothing more');
  assert.equal(setTemper(save, 1), 1);
  const castle = LEVELS.find(n => n.kind === 'castle' && n.id !== FINAL).id;
  assert.equal(temperClear(save, '2-1'), 0, 'only castles open tiers');
  assert.equal(temperClear(save, castle), 2);
  setTemper(save, 1);
  assert.equal(temperClear(save, castle), 0, 'below your top tier nothing opens');
  save.temper = { on: TEMPER_MAX, max: TEMPER_MAX };
  assert.equal(temperClear(save, castle), 0, 'TEMPER 10 is the last');
  assert.equal(NODES[castle].kind, 'castle');
});

test('TEMPER tiers stack modifiers and always pay more for more danger', () => {
  assert.equal(MODS.length, TEMPER_MAX);
  assert.deepEqual(temper(0), { ...temper(0), hp: 1, dmg: 1, rarity: 0, shards: 1, xp: 1, standout: 0 });
  for (let n = 1; n <= TEMPER_MAX; n++) {
    const a = temper(n - 1), b = temper(n);
    assert.equal(modsOf(n).length, n);
    assert.ok(b.hp > a.hp && b.dmg >= a.dmg && b.shards > a.shards && b.xp > a.xp && b.rarity >= a.rarity, 'tier ' + n);
  }
  assert.equal(temper(99).n, TEMPER_MAX);
});

test('every level hides four relics on its ledges and a hidden portal on a reachable surface', () => {
  for (const n of LEVELS) {
    const m = makeMap(n.zone, n.id), spots = relicSpots(m);
    assert.equal(spots.length, RELIC_COUNT - 1, n.id);
    for (const s of spots) assert.ok(s.x > 0 && s.x < m.width, n.id + ' relic inside the map');
    const at = hiddenSpot(m, spots.map(s => ({ x: s.x, y: s.y + 16 })));
    assert.ok(at, n.id + ' has a hidden portal');
    assert.ok(at.x > m.startX + 300 && at.x < m.bossLeft, n.id + ' portal along the route, before the arena');
    assert.ok(m.platforms.some(p => p.y === at.y && at.x >= p.x && at.x <= p.x + p.w), n.id + ' portal stands on a surface');
  }
});

test('secret rooms are one screen with a ledge for the fifth relic, in every kind', () => {
  for (const kind of ROOM_KINDS) {
    const r = secretRoom(3, kind), s = roomRelicSpot(r);
    assert.ok(r.secretRoom && r.width <= 480, kind);
    assert.ok(s.x >= r.ledge.x && s.x <= r.ledge.x + r.ledge.w && s.y < r.ledge.y, kind + ' relic on the ledge');
  }
});

test('relics are kept per level, and the set counts toward the map stars', () => {
  const save = {};
  assert.equal(keepRelics(save, '1-2', 0b00101), 2);
  assert.equal(keepRelics(save, '1-2', 0b00101), 0, 'ones you own pay nothing');
  assert.equal(relicCount(save, '1-2'), 2);
  keepRelics(save, '1-2', 0b11010);
  assert.ok(allRelics(save, '1-2'));
  assert.deepEqual(relicTotal(save), { got: 5, all: LEVELS.length * RELIC_COUNT, sets: 1 });
});

test('gimmicks never touch 1-1, name real levels, and eggs sit in real levels', () => {
  assert.equal(gimmickOf('1-1'), null);
  for (const [id, g] of Object.entries(GIMMICK_OF)) assert.ok(NODES[id] && GIMMICKS[g], id);
  for (const id of EGG_LEVELS) assert.ok(NODES[id], id);
  assert.ok(Object.values(GIMMICK_OF).includes('ghost') && Object.values(GIMMICK_OF).includes('scroll'));
});

test('the Collection counts each world and the whole game, and names what is still out there', async () => {
  const { collection, worldRow, rowPct, missing } = await import('../game-src/data/collection.js');
  const { REGIONS, newSave, clearLevel } = await import('../game-src/data/overworld.js');
  const empty = collection(newSave());
  assert.equal(empty.pct, 0);
  assert.equal(empty.total.levels[1], LEVELS.length);
  assert.equal(empty.total.relics[1], LEVELS.length * RELIC_COUNT);
  assert.equal(empty.total.exits[1], LEVELS.filter(n => n.secret.length).length);
  const s = newSave(), w1 = LEVELS.filter(n => n.region === 1);
  for (const n of w1) clearLevel(s, n.id);
  const R = REGIONS[0], open = missing(s, R);
  assert.ok(open.exits.length > 0, 'cleared levels with an untaken secret exit are named');
  assert.equal(open.relics.length, w1.length);
  for (const n of w1) clearLevel(s, n.id, n.secret.length ? 'secret' : 'next'), keepRelics(s, n.id, 31);
  const row = worldRow(s, R, [R.zone]);
  assert.deepEqual(row.stars, [w1.length, w1.length]);
  assert.deepEqual(row.egg, [1, 1]);
  assert.equal(missing(s, R).exits.length, 0);
  assert.equal(missing(s, R).relics.length, 0);
  assert.ok(rowPct(row) < 100, 'the trophy and boss page are still missing');
  assert.ok(collection(s, [R.zone]).pct > 0);
});
