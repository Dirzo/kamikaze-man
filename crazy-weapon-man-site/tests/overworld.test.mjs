import test from 'node:test';
import assert from 'node:assert/strict';
import { NODES, LEVELS, REGIONS, START, FINAL, MAP_W, MAP_H, newSave, revealAll, clearLevel, visit, warp, isOpen, step, edges, progress } from '../game-src/data/overworld.js';
import { ZONES } from '../game-src/data/zones.js';

const explore = secrets => revealAll(newSave(), secrets);

test('the map has 50+ levels over all ten zones, every exit points somewhere real', () => {
  assert.ok(LEVELS.length >= 50, LEVELS.length + ' levels');
  assert.equal(REGIONS.length, ZONES.length);
  for (const R of REGIONS) assert.ok(LEVELS.filter(n => n.region === R.id).length >= 6, R.name);
  for (const n of Object.values(NODES)) {
    for (const to of [...n.next, ...n.secret]) assert.ok(NODES[to], n.id + ' -> ' + to);
    if (n.kind === 'warp') assert.equal(NODES[n.to].to, n.id, 'warps come in pairs');
    assert.ok(n.x >= 16 && n.x <= MAP_W - 16 && n.y >= 40 && n.y <= MAP_H - 10, n.id + ' off the map');
  }
  for (const R of REGIONS) assert.equal(LEVELS.filter(n => n.region === R.id && n.kind === 'castle').length, 1, R.name + ' castle');
});
test('nodes never sit on top of each other', () => {
  const all = Object.values(NODES);
  for (const a of all) for (const b of all) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 34, a.id + ' crowds ' + b.id);
});
test('forks in the road: every region offers a choice of route', () => {
  for (const R of REGIONS) assert.ok(LEVELS.some(n => n.region === R.id && n.next.length >= 2), R.name + ' has no fork');
  assert.ok(LEVELS.filter(n => n.secret.length).length >= 10);
});
test('the final castle is reachable with normal exits alone; secret exits reach everything else', () => {
  const plain = explore(false), full = explore(true);
  assert.ok(plain.cleared[FINAL]);
  for (const n of LEVELS.filter(n => n.kind === 'secret')) assert.ok(!isOpen(plain, n.id), n.id + ' should need a secret exit');
  for (const n of Object.values(NODES)) assert.ok(isOpen(full, n.id), n.id + ' unreachable');
  assert.equal(progress(full).cleared, LEVELS.length);
});
test('a fresh map opens only the first level; clearing reveals the next roads', () => {
  const s = newSave();
  assert.ok(isOpen(s, '1-1') && !isOpen(s, '1-2'));
  assert.equal(step(s, START, 1, 0), '1-1');
  const fresh = clearLevel(s, '1-1');
  assert.deepEqual(fresh.map(e => e.to), ['1-2']);
  assert.equal(step(s, '1-1', -1, 0), START, 'roads walk both ways');
  const fork = clearLevel(s, '1-2');
  assert.deepEqual(fork.map(e => e.to).sort(), ['1-3', '1-4']);
  assert.equal(step(s, '1-2', 1, -1), '1-3');
  assert.equal(step(s, '1-2', 1, 1), '1-4');
  assert.equal(clearLevel(s, '1-2').length, 0, 'clearing twice changes nothing');
  assert.equal(edges(s).length, 4);
});
test('a warp cannon fires you to its partner and back', () => {
  const s = newSave();
  for (const id of ['1-1', '1-2', '1-4']) clearLevel(s, id);
  assert.ok(!isOpen(s, '1-S'));
  clearLevel(s, '1-4', 'secret');
  clearLevel(s, '1-S');
  visit(s, 'W1');
  assert.equal(warp(s, 'W1'), 'W1b');
  assert.ok(isOpen(s, '3-1'));
  assert.equal(warp(s, 'W1b'), 'W1');
});
