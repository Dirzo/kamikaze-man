import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVE, momentumStep, runSpeed, rushMult } from '../game-src/data/feel.js';
import { parTime, completion, gradeOf, timeScore } from '../game-src/data/grade.js';
import { speedBoon, SPEED_BOONS, specialRoll } from '../game-src/data/specials.js';
import { TREE_BY_ID, MASTERY_PERKS } from '../game-src/data/meta.js';

test('momentum builds to full in momentumTime of running, faster with ACCELERATION, and carries through the air', () => {
  let m = 0;
  for (let t = 0; t < MOVE.momentumTime - 1e-9; t += 1 / 60) m = momentumStep(m, 1 / 60, { push: true });
  assert.ok(m > 0.97);
  let fast = 0;
  for (let i = 0; i < 30; i++) fast = momentumStep(fast, 1 / 60, { push: true, accel: 1 });
  assert.ok(Math.abs(fast - 2 * 30 / 60 / MOVE.momentumTime) < 1e-6);
  assert.equal(momentumStep(0.8, 0.5, { push: false, ground: false }), 0.8, 'momentum carries through a jump');
  assert.ok(momentumStep(0.8, 0.1, { push: false }) < 0.8, 'letting go on the ground bleeds it');
  assert.equal(momentumStep(0.9, 0.1, { push: true, back: true }), 0, 'turning round loses it');
});
test('SPEED and momentum set the run speed, and RUSH only pays from half momentum', () => {
  assert.equal(runSpeed(100, 0, 0), 100);
  assert.ok(Math.abs(runSpeed(100, 0.1, 1) - 110 * MOVE.topSpeed) < 1e-9);
  assert.equal(rushMult(0.5), 1);
  assert.ok(Math.abs(rushMult(1, 0.1) - (1 + MOVE.rush + 0.1)) < 1e-9);
});
test('speed comes from the shard tree, mastery and gear boons, and a weapon\'s old boons never change', () => {
  assert.equal(TREE_BY_ID.tail.stat, 'accel');
  assert.equal(TREE_BY_ID.slip.stat, 'rush');
  assert.ok(MASTERY_PERKS.flat().some(p => p.stats?.accel));
  const ws = Array.from({ length: 300 }, (_, i) => ({ name: 'Blade ' + i, type: 'sword', q: 5 }));
  const rolled = ws.map(speedBoon).filter(Boolean);
  assert.ok(rolled.length > 40 && rolled.length < 200, 'about a third of Epic weapons run fast: ' + rolled.length);
  assert.ok(rolled.every(b => SPEED_BOONS[b]));
  assert.equal(speedBoon({ name: 'Plain', type: 'sword', q: 0 }), null, 'Commons roll none');
  const w = { name: 'Blade 7', type: 'sword', q: 5 }, before = JSON.stringify(specialRoll({ ...w }));
  speedBoon(w);
  assert.equal(JSON.stringify(specialRoll({ ...w })), before);
});
test('the level-clear grade: S for a fast full clear, D for a slow half one', () => {
  const par = parTime(12 * 480, 40);
  assert.ok(par > 60 && par < 200, 'par ' + par);
  const full = completion({ kills: 40, residents: 40, relics: 5, relicMax: 5, secret: true, hasSecret: true });
  assert.equal(full, 1);
  assert.equal(gradeOf({ t: par * 0.9, par, done: full }).g, 'S');
  const half = completion({ kills: 20, residents: 40, relics: 1, relicMax: 5, secret: false, hasSecret: true });
  assert.ok(half > 0.3 && half < 0.5);
  assert.equal(gradeOf({ t: par * 2, par, done: half }).g, 'D');
  assert.equal(timeScore(par, par), 1);
  assert.equal(completion({ kills: 0, residents: 0 }), 1);
});
import { makeMap, gadgetKinds, GADGET_INTRO } from '../game-src/data/maps.js';
test('speed gadgets come in one new kind per world, the new one early on, and every one sits inside the stage', () => {
  for (let z = 0; z < 10; z++) {
    const m = makeMap(z), kinds = new Set(m.gadgets.map(g => g.kind));
    for (const k of kinds) assert.ok(gadgetKinds(z).includes(k), `${k} before its world in zone ${z + 1}`);
    if (z < GADGET_INTRO.length) assert.ok(kinds.has(GADGET_INTRO[z]), `world ${z + 1} never shows its new ${GADGET_INTRO[z]}`);
    for (const g of m.gadgets) {
      const x = g.x ?? g.x0;
      assert.ok(x > 100 && x < m.bossLeft, `${g.kind} outside the route in zone ${z + 1}`);
      if (g.kind === 'boost') assert.equal(Math.abs(g.dir), 1);
    }
  }
});
