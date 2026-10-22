import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWeapon, trainingSword } from '../game-src/game/loot.js';
import { TYPES } from '../game-src/data/weapons.js';
import { SPECIALS, SPECIALS_OF, BOONS, specialRoll, specialOf, boonCount } from '../game-src/data/specials.js';
import fs from 'node:fs';

test('every weapon type has three specials, its signature move first', () => {
  for (const [type, T] of Object.entries(TYPES)) {
    assert.equal(SPECIALS_OF[type].length, 3, type);
    assert.equal(SPECIALS_OF[type][0], T.special, `${type} signature`);
  }
  for (const sp of Object.values(SPECIALS)) assert.ok(sp.name && sp.desc && sp.cool > 0);
});
test('every added special has a move in specials.js and a pose in anim.js', () => {
  const code = fs.readFileSync(new URL('../game-src/game/specials.js', import.meta.url), 'utf8');
  const anim = fs.readFileSync(new URL('../game-src/game/anim.js', import.meta.url), 'utf8');
  const sig = new Set(Object.values(TYPES).map(T => T.special));
  for (const id of Object.keys(SPECIALS)) {
    if (sig.has(id)) continue;
    assert.ok(code.includes(`case '${id}':`), `${id} has no move`);
    assert.ok(anim.includes(`case '${id}':`), `${id} has no pose`);
  }
});
test('Commons and the Training weapon keep the signature; rarer drops roll all three with boons', () => {
  assert.equal(specialOf(trainingSword()).name, 'WHIRLWIND');
  assert.deepEqual(specialRoll(trainingSword()).boons, []);
  const seen = {};
  for (let i = 0; i < 3000; i++) {
    const w = makeWeapon(3, { q: 4, standout: false });
    const r = specialRoll(w);
    seen[r.id] = 1;
    assert.equal(SPECIALS[r.id].type, w.type);
    assert.equal(r.boons.length, boonCount(4, false));
    assert.equal(new Set(r.boons).size, r.boons.length);
    for (const b of r.boons) assert.ok(BOONS[b]);
  }
  assert.equal(Object.keys(seen).length, Object.keys(SPECIALS).length);
  assert.equal(boonCount(0, false), 0);
  assert.equal(boonCount(10, true), 3);
});
test('a weapon always rolls the same special, saved or not', () => {
  const w = makeWeapon(4, { q: 5 });
  const a = JSON.parse(JSON.stringify(specialRoll(w)));
  const copy = JSON.parse(JSON.stringify({ ...w, sp: undefined }));
  assert.deepEqual(specialRoll(copy), a);
});
