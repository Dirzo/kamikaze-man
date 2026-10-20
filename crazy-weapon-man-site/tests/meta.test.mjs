import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, NODES } from '../game-src/data/overworld.js';
import { BOSS_OF, SIBLING_DEFS, HEAD_KINDS, FAMILIES, ROLES, levelTier } from '../game-src/data/families.js';
import { readFileSync } from 'node:fs';
import {
  resetMeta, meta, bankShards, buyRank, cantBuy, rank, respec, TREE, GATE, rankCost, spentIn, stats, winTrophy, hasTrophy,
  TROPHIES, MASTERY_TIERS, MASTERY_PERKS, choosePerk, perkChoice, tiersOpen, masteryPerk, SIGNATURE
} from '../game-src/data/meta.js';
import { addProficiency, resetProficiency, PROF_MAX, profToNext } from '../game-src/data/proficiency.js';
import { TYPE_LIST } from '../game-src/data/weapons.js';

test('every level has its own boss: a sibling of its world, or the family head in the castle', () => {
  const kinds = LEVELS.map(n => BOSS_OF[n.id]);
  assert.equal(new Set(kinds).size, LEVELS.length, 'a boss repeats');
  for (const n of LEVELS) {
    const kind = BOSS_OF[n.id];
    if (n.kind === 'castle') assert.equal(kind, FAMILIES[n.region].head, n.id);
    else {
      const D = SIBLING_DEFS[kind];
      assert.equal(D.family, n.region, n.id + ' boss is from another family');
      assert.ok(D.patterns.length >= 2 && D.intro.length && D.defeat, n.id);
      assert.equal(D.role, n.kind === 'fort' ? 'fort' : n.kind === 'secret' ? 'secret' : 'level');
    }
  }
  assert.equal(HEAD_KINDS.length, 10);
});
test('family heads are the toughest of their family, and the road to the castle gets harder', () => {
  for (const k of ['level', 'secret', 'fort']) for (const f of ['hp', 'secs', 'dmg']) assert.ok(ROLES.castle[f] > ROLES[k][f], k + ' ' + f);
  for (const R of Object.keys(FAMILIES)) {
    const ids = LEVELS.filter(n => n.region === +R).map(n => n.id);
    assert.equal(levelTier(ids.find(id => NODES[id].kind === 'castle')), 1);
    assert.equal(levelTier(ids[0]), 0);
  }
});
test('sibling moves are moves the boss engine knows', () => {
  // (bosses.js draws, so read its move names from the source rather than importing it)
  const known = new Set([...readFileSync(new URL('../game-src/game/bosses.js', import.meta.url), 'utf8').matchAll(/case '(\w+)'/g)].map(m => m[1]));
  for (const D of Object.values(SIBLING_DEFS)) for (const p of [...D.patterns, D.surprise]) assert.ok(known.has(p.split(':')[0]), D.name + ': ' + p);
});

test('shards bank, buy ranks behind tier gates, and refund in full', () => {
  resetMeta();
  assert.equal(cantBuy('sharp'), 'NOT ENOUGH SHARDS');
  bankShards(100000);
  assert.match(cantBuy('brutal'), /SPEND 5 MORE/);
  for (let i = 0; i < 5; i++) assert.ok(buyRank('sharp'));
  assert.equal(cantBuy('sharp'), 'MAXED');
  assert.equal(cantBuy('brutal'), null, 'tier 1 opens after 5 ranks');
  assert.ok(Math.abs(stats().dmg - 0.15) < 1e-9);
  const spent = [1, 2, 3, 4, 5].reduce((s, r) => s + rankCost(0, r), 0);
  assert.equal(meta().shards, 100000 - spent);
  respec();
  assert.equal(meta().shards, 100000);
  assert.equal(rank('sharp'), 0);
  assert.equal(spentIn('might'), 0);
  assert.deepEqual(GATE.slice(0, 1), [0]);
  assert.equal(TREE.length, 24);
});
test('a trophy is won once and its perk is always on', () => {
  resetMeta();
  assert.ok(winTrophy(7));
  assert.ok(!winTrophy(7), 'twice');
  assert.ok(hasTrophy(7));
  assert.equal(stats('sword').armor, TROPHIES[7].stats.armor);
  winTrophy(3);
  assert.ok(stats(null).innate.has('hops'));
});
test('mastery runs to 100 and opens ten perk choices along the way, per weapon type', () => {
  resetMeta();
  resetProficiency();
  assert.equal(PROF_MAX, 100);
  assert.equal(MASTERY_TIERS.length, MASTERY_PERKS.length);
  assert.equal(MASTERY_TIERS.at(-1), 100);
  let kills = 0;
  for (let lv = 0; lv < 100; lv++) kills += profToNext(lv);
  assert.ok(kills > 8000, 'grandmastery should be a long road: ' + kills);
  assert.ok(!choosePerk('sword', 0, 0), 'no perk before mastery 5');
  addProficiency('sword', 60, 60);
  assert.equal(tiersOpen('sword'), 1);
  assert.ok(choosePerk('sword', 0, 0));
  assert.equal(perkChoice('sword', 0), 0);
  assert.ok(Math.abs(stats('sword').dmg - 0.06) < 1e-9);
  assert.equal(stats('bow').dmg, 0, 'perks only work for their type');
  assert.ok(choosePerk('sword', 0, 1), 'swap any time');
  assert.equal(stats('sword').dmg, 0);
  for (const t of TYPE_LIST) {
    assert.equal(SIGNATURE[t].length, 2, t);
    assert.ok(masteryPerk(t, 5, 0).innate && masteryPerk(t, 5, 1).innate);
    assert.notEqual(masteryPerk(t, 9, 1).innate, masteryPerk(t, 5, 0).innate);
  }
  resetProficiency();
  resetMeta();
});
