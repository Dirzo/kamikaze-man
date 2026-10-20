import test from 'node:test';
import assert from 'node:assert/strict';

// a stand-in localStorage, in place before the save modules read it
const mem = new Map();
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
const { useFile, eraseFile, fileSummary, activeFile, FILE_KEYS } = await import('../game-src/data/saves.js');
const { bankShards, meta, winTrophy } = await import('../game-src/data/meta.js');
const { newSave, clearLevel, writeSave, loadSave } = await import('../game-src/data/overworld.js');

test('three save files: each keeps its own map, shards and trophies, and erasing one leaves the others', () => {
  // a save from before files existed is file 1
  const old = newSave();
  clearLevel(old, '1-1');
  old.hero = { lv: 4 };
  writeSave(old);
  bankShards(300);
  assert.equal(activeFile(), 0);
  assert.equal(fileSummary(0).cleared, 1);
  assert.equal(fileSummary(0).lv, 4);
  assert.equal(fileSummary(1), null, 'file 2 starts empty');

  useFile(1);
  assert.equal(meta().shards, 0, 'a new file has its own shard bank');
  assert.equal(loadSave().cleared['1-1'], undefined, 'and its own map');
  bankShards(50);
  winTrophy(1);
  useFile(0);
  assert.equal(meta().shards, 300);
  assert.equal(meta().trophies[1], undefined);
  assert.ok(loadSave().cleared['1-1']);
  assert.equal(fileSummary(1).shards, 50);
  assert.equal(fileSummary(1).trophies, 1);

  eraseFile(1);
  assert.equal(fileSummary(1), null);
  assert.equal(meta().shards, 300, 'erasing another file leaves this one alone');
  eraseFile(0);
  assert.equal(fileSummary(0), null);
  assert.equal(meta().shards, 0);
  for (const k of FILE_KEYS) assert.equal(localStorage.getItem(k), null);
});
