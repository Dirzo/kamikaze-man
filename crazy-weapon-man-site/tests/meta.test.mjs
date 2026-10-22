import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, NODES } from '../game-src/data/overworld.js';
import { BOSS_OF, SIBLING_DEFS, HEAD_KINDS, FAMILIES, ROLES, levelTier } from '../game-src/data/families.js';
import { readFileSync } from 'node:fs';
import {
  resetMeta, meta, bankShards, buyRank, cantBuy, rank, respec, undoRank, TREE, TREE_BY_ID, TREE_LINKS, rankCost, stats, setLock, weaponLock, onClass, CLASSES, CLASS_OF, winTrophy, hasTrophy,
  TROPHIES, gate, linked, stableOpen, chosenMount, chooseMount, trophyCount, MASTERY_TIERS, MASTERY_PERKS, choosePerk, perkChoice, tiersOpen, masteryPerk, SIGNATURE
} from '../game-src/data/meta.js';
import { addProficiency, resetProficiency, PROF_MAX, profToNext } from '../game-src/data/proficiency.js';
import { TYPE_LIST } from '../game-src/data/weapons.js';
import { MOUNTS, MOUNT_LIST, STABLE_TROPHIES } from '../game-src/data/mounts.js';

// buy ranks in a node until it holds n (its gate, by default)
const buyTo = (id, n = gate(TREE_BY_ID[id])) => {
  while (rank(id) < n) assert.ok(buyRank(id), `${id} rank ${rank(id) + 1}: ${cantBuy(id)}`);
};

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
  assert.ok(Math.abs(stats().impact - 0.5) < 1e-9 && stats().dmg === 0, 'the ring is about feel, not flat damage');
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
test('specializing opens only your class cluster, and it only powers that class', () => {
  resetMeta();
  assert.equal(Object.values(CLASSES).reduce((n, c) => n + c.types.length, 0), 13, 'every weapon type has a class');
  assert.ok(!onClass('bow') && !onClass('sword'), 'not specialized: no class is powered');
  bankShards(100000);
  buyRank('core');
  buyTo('sharp');
  assert.match(cantBuy('slice'), /SPECIALIZE IN BLADES/);
  assert.ok(setLock('blades'));
  assert.equal(weaponLock(), 'blades');
  assert.ok(onClass('katana') && !onClass('bow') && !onClass('hammer'));
  // round the sword's outline: grip, guard, the edge of the blade, out to the keystone
  for (const id of ['slice', 'longb', 'cleave', 'whirl', 'echo']) buyTo(id);
  assert.match(cantBuy('frenzy'), /LINKED/, 'the tip waits at the end of an edge');
  buyTo('fire');
  assert.ok(buyRank('frenzy'));
  assert.ok(Math.abs(stats('sword').reach - 0.18) < 1e-9, 'blade nodes work with a blade');
  assert.equal(stats('bow').reach, 0, 'and not with a bow');
  assert.ok(stats('katana').innate.has('frenzy') && !stats('bow').innate.has('frenzy'), 'a keystone teaches the blade a move');
  assert.ok(Math.abs(stats('scythe').infuse.fire - 0.18) < 1e-9);
  assert.equal(stats('wand').infuse.fire, undefined);
  assert.ok(Math.abs(stats('bow').impact - 0.3) < 1e-9, 'shared nodes work with everything');
  assert.match(cantBuy('heft'), /SPECIALIZE IN BLUNT/);
  setLock(null);
  assert.ok(!onClass('katana'));
  for (const t of Object.keys(CLASS_OF)) assert.ok(CLASSES[CLASS_OF[t]]);
  resetMeta();
});
test('respec: undo and refund take the class lock back too, so a Blades player can become Ranged', () => {
  resetMeta();
  bankShards(100000);
  buyRank('core');
  buyTo('sharp');
  setLock('blades');
  buyRank('slice');
  assert.equal(weaponLock(), 'blades');
  assert.equal(undoRank(), 'slice', 'the newest rank comes back first');
  assert.equal(undoRank(), '@', 'then the specialization itself');
  assert.equal(weaponLock(), null);
  assert.ok(setLock('ranged'));
  assert.equal(weaponLock(), 'ranged');
  assert.equal(rank('sharp'), 3, 'shared ranks stay put');
  // switching straight from one class to another refunds the old cluster
  setLock('blades');
  assert.ok(buyRank('slice'));
  const before = meta().shards;
  setLock('ranged');
  assert.equal(rank('slice'), 0, 'blade ranks refunded');
  assert.equal(meta().shards, before + rankCost(TREE_BY_ID.slice, 1));
  assert.equal(undoRank(), '@blades', 'and that switch can be undone');
  assert.equal(weaponLock(), 'blades');
  // a lock with no recorded history (an older save) still undoes
  meta().hist = [];
  assert.equal(undoRank(), '@');
  assert.equal(weaponLock(), null);
  // refund clears everything, the class included
  setLock('blunt');
  respec();
  assert.equal(weaponLock(), null);
  assert.equal(meta().shards, 100000);
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
test('area augments: two shared, two per class, each class pair only with that class in hand', () => {
  resetMeta();
  bankShards(1e7);
  const aoe = TREE.filter(n => n.aoe);
  assert.equal(aoe.filter(n => !n.branch).length, 2);
  for (const c of Object.keys(CLASSES)) assert.ok(aoe.filter(n => n.branch === c).length >= 2, c);
  for (const id of ['core', 'sharp']) buyTo(id);
  assert.ok(buyRank('nova'), 'one point in an area augment');
  assert.ok(Math.abs(stats('bow').nova - 0.04) < 1e-9 && Math.abs(stats('hammer').nova - 0.04) < 1e-9, 'shared nova works with everything');
  setLock('blades');
  for (const id of ['slice', 'longb', 'cleave']) buyTo(id);
  assert.ok(buyRank('whirl'));
  assert.ok(Math.abs(stats('sword').wave - 0.12) < 1e-9);
  assert.equal(stats('bow').wave, 0);
  // the web still fits the window: nodes stay apart and inside its 322 x 210 frame
  for (const a of TREE) for (const b of TREE) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 16, a.id + ' ' + b.id);
  // and no class node is a flat damage number
  assert.ok(TREE.every(n => !['dmg', 'critDmg', 'swarmDmg', 'bossDmg', 'execute', 'hp'].includes(n.stat)), 'a flat damage node');
  const ys = TREE.map(n => n.y);
  assert.ok(Math.max(...ys) - Math.min(...ys) + 24 <= 210 && TREE.every(n => Math.abs(n.x) + 8 <= 161));
  resetMeta();
});

test('gates: 3 of 5 ranks open the nodes beyond (2 of 3, 1 of 1), and you can dip a single rank', () => {
  resetMeta();
  bankShards(1e7);
  assert.equal(gate(TREE_BY_ID.sharp), 3);
  assert.equal(gate(TREE_BY_ID.lust), 2);
  assert.equal(gate(TREE_BY_ID.core), 1);
  assert.equal(gate(TREE_BY_ID.dashcut), 1);
  buyRank('core');
  buyRank('sharp');
  assert.ok(!linked('nova') && !linked('band'), '1/5 opens nothing');
  assert.match(cantBuy('nova'), /NEEDS 3\/5 IN HEAVY IMPACT \(2 MORE\)/);
  buyRank('sharp');
  assert.match(cantBuy('nova'), /1 MORE/);
  buyRank('sharp');
  assert.equal(cantBuy('nova'), null, '3/5 opens it');
  assert.ok(buyRank('nova'), 'one point in an AoE node');
  assert.match(cantBuy('ripple'), /LINKED|NEEDS/, 'a 1-rank dip opens nothing beyond it');
  // undo walks back cleanly: the dip comes back before the ranks that opened it
  assert.equal(undoRank(), 'nova');
  assert.equal(undoRank(), 'sharp');
  assert.ok(!linked('nova'));
  // maxing a node opens the same roads as 3/5: the choice is depth here or a dip further on
  buyTo('sharp', 5);
  assert.equal(cantBuy('nova'), null);
  resetMeta();
});
test('gates: an old save that skipped a gate gets every shard back', async () => {
  const mem = {};
  globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => (mem[k] = v) };
  const fresh = await import('../game-src/data/meta.js?gate-load');
  const tv = JSON.parse(JSON.stringify(fresh.meta())).tv;
  mem[fresh.META_KEY] = JSON.stringify({ v: 1, tv, shards: 100, earned: 5000, tree: { core: 1, sharp: 1, band: 1 }, hist: [], trophies: {} });
  fresh.reloadMeta();
  assert.equal(fresh.rank('band'), 0, 'band hung off a 1/5 sharp');
  assert.equal(fresh.meta().shards, 5000);
  mem[fresh.META_KEY] = JSON.stringify({ v: 1, tv, shards: 100, earned: 5000, tree: { core: 1, sharp: 3, band: 1 }, hist: [], trophies: {} });
  fresh.reloadMeta();
  assert.equal(fresh.rank('band'), 1, 'a save that kept to the gates is untouched');
  delete globalThis.localStorage;
});
test('the stable: shut until three family heads fall, then pick one of three mounts', () => {
  resetMeta();
  assert.equal(MOUNT_LIST.length, 3);
  assert.equal(STABLE_TROPHIES, 3);
  for (const id of MOUNT_LIST) assert.equal(MOUNTS[id].perks.length, 2, id);
  assert.ok(!stableOpen() && !chooseMount('griffin') && chosenMount() === null);
  winTrophy(1); winTrophy(2);
  assert.ok(!stableOpen(), 'two is not enough');
  winTrophy(5); // any three heads, in any order
  assert.equal(trophyCount(), 3);
  assert.ok(stableOpen());
  assert.equal(chosenMount(), null, 'nothing rides until you pick');
  assert.ok(chooseMount('ironboar'));
  assert.equal(chosenMount(), 'ironboar');
  assert.ok(chooseMount('wargoose'), 'swap any time');
  assert.ok(!chooseMount('dragon'));
  resetMeta();
});
