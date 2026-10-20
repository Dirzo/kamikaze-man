import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, NODES } from '../game-src/data/overworld.js';
import { BOSS_OF, SIBLING_DEFS, HEAD_KINDS, FAMILIES, ROLES, levelTier } from '../game-src/data/families.js';
import { readFileSync } from 'node:fs';
import {
  resetMeta, meta, bankShards, buyRank, cantBuy, rank, respec, undoRank, TREE, TREE_BY_ID, TREE_LINKS, rankCost, stats, setLock, weaponLock, allowedType, CLASSES, CLASS_OF, winTrophy, hasTrophy,
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

test('the shard web: every node links back to CORE, and keystones sit at the ends', () => {
  const seen = new Set(), todo = ['core'];
  while (todo.length) {
    const id = todo.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    todo.push(...TREE_BY_ID[id].links);
  }
  assert.equal(seen.size, TREE.length);
  assert.equal(TREE.filter(n => n.el).length, 6, 'two element keystones a cluster');
  for (const n of TREE.filter(n => n.branch)) assert.ok(!['hp', 'shards', 'xp', 'heal', 'hearts', 'mastery', 'lust', 'combo', 'standout', 'bossShards'].includes(n.stat), n.id + ' is read without a weapon type, so it must be shared');
  for (const n of TREE) for (const l of n.links) assert.ok(TREE_BY_ID[l].links.includes(n.id), n.id + ' - ' + l);
  for (const [a, b] of TREE_LINKS) assert.ok(TREE_BY_ID[a] && TREE_BY_ID[b]);
  const pos = new Set(TREE.map(n => n.x + ',' + n.y));
  assert.equal(pos.size, TREE.length, 'two nodes on one spot');
});
test('shards bank, ranks need a linked node, undo takes back the last rank, refund is in full', () => {
  resetMeta();
  assert.equal(cantBuy('core'), 'NOT ENOUGH SHARDS');
  bankShards(100000);
  assert.match(cantBuy('sharp'), /LINKED/);
  assert.ok(buyRank('core'));
  for (let i = 0; i < 5; i++) assert.ok(buyRank('sharp'));
  assert.equal(cantBuy('sharp'), 'MAXED');
  assert.equal(cantBuy('band'), null, 'linked to sharp');
  assert.match(cantBuy('stand'), /LINKED/);
  assert.ok(Math.abs(stats().dmg - 0.17) < 1e-9);
  const spent = rankCost(TREE_BY_ID.core, 1) + [1, 2, 3, 4, 5].reduce((s, r) => s + rankCost(TREE_BY_ID.sharp, r), 0);
  assert.equal(meta().shards, 100000 - spent);
  assert.equal(undoRank(), 'sharp');
  assert.equal(rank('sharp'), 4);
  assert.equal(meta().shards, 100000 - spent + rankCost(TREE_BY_ID.sharp, 5));
  respec();
  assert.equal(meta().shards, 100000);
  assert.equal(rank('sharp'), 0);
  assert.equal(undoRank(), null);
});
test('specializing: only your class drops, and only your class cluster opens and works', () => {
  resetMeta();
  assert.equal(Object.values(CLASSES).reduce((n, c) => n + c.types.length, 0), 13, 'every weapon type has a class');
  assert.ok(allowedType('bow') && allowedType('hammer'), 'no lock: everything drops');
  bankShards(100000);
  buyRank('core');
  buyRank('sharp');
  assert.match(cantBuy('edge'), /SPECIALIZE IN BLADES/);
  assert.ok(setLock('blades'));
  assert.equal(weaponLock(), 'blades');
  assert.ok(allowedType('katana') && !allowedType('bow') && !allowedType('hammer'));
  assert.ok(buyRank('edge'));
  buyRank('brutal');
  assert.ok(buyRank('fire'), 'the keystone hangs off big crits');
  assert.ok(Math.abs(stats('sword').crit - 0.01) < 1e-9, 'blade nodes work with a blade');
  assert.equal(stats('bow').crit, 0, 'and not with a bow');
  assert.ok(Math.abs(stats('scythe').infuse.fire - 0.06) < 1e-9);
  assert.equal(stats('wand').infuse.fire, undefined);
  assert.ok(Math.abs(stats('bow').dmg - 0.05) < 1e-9, 'shared nodes work with everything');
  assert.match(cantBuy('armor'), /SPECIALIZE IN BLUNT/);
  setLock(null);
  assert.ok(allowedType('bow'));
  for (const t of Object.keys(CLASS_OF)) assert.ok(CLASSES[CLASS_OF[t]]);
  resetMeta();
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
