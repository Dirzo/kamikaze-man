import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVE, momentumStep, momentumOf, runSpeed, rushMult, camLead, FIGHT, fightMult } from '../game-src/data/feel.js';
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
  assert.equal(momentumStep(0.9, 0.1, { push: true, back: true, left: 0.4 }), 0.4, 'turning round skids it down to the speed you still have');
  assert.equal(momentumStep(0.9, 0.1, { push: true, back: true }), 0, 'and a full turn loses it');
  assert.equal(momentumOf(runSpeed(100, 0.2, 0.6), 100, 0.2).toFixed(6), '0.600000', 'momentumOf undoes runSpeed');
});
test('Sonic pace: full momentum is well over twice walking speed, RUSH opens a fight without ending it, the camera leads further at speed', () => {
  assert.ok(MOVE.topSpeed >= 2.2);
  assert.ok(rushMult(1) >= 1.5 && rushMult(1) <= 3, 'a full-sprint hit lands harder, but a resident still takes a few hits');
  assert.equal(rushMult(1, 0, true), 1 + MOVE.rushTough, 'elites and bosses only take the small bonus');
  assert.equal(rushMult(1, 0.1, true), 1 + MOVE.rushTough + 0.1, 'the RUSH stat still adds for them');
  assert.equal(camLead(0, 100), MOVE.lookAhead);
  assert.equal(camLead(300, 100), MOVE.lookAheadTop);
  assert.ok(camLead(50, 100) > MOVE.lookAhead && camLead(50, 100) < MOVE.lookAheadTop);
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
test('the level-clear grade runs S (truly awesome) through F (really messed up)', () => {
  const par = parTime(12 * 480, 40);
  assert.ok(par > 60 && par < 200, 'par ' + par);
  const full = completion({ kills: 40, residents: 40, relics: 5, relicMax: 5, secret: true, hasSecret: true });
  assert.equal(full, 1);
  const half = completion({ kills: 20, residents: 40, relics: 1, relicMax: 5, secret: false, hasSecret: true });
  assert.ok(half > 0.3 && half < 0.5);
  const g = (r, done, hits = 0, falls = 0, combo = 0) => gradeOf({ t: par * r, par, done, hits, falls, combo }).g;
  assert.equal(g(0.6, 1, 2, 0, 30), 'S', 'well under par, everything done, barely touched');
  assert.notEqual(g(1, 1, 3), 'S', 'just making par is not an S');
  assert.notEqual(g(0.6, 0.8, 2), 'S', 'skipping a fifth of the stage is not an S');
  assert.equal(g(0.85, 0.9, 6), 'A', 'a good run');
  assert.equal(g(1, 0.75, 8), 'B', 'an average run');
  assert.equal(g(1.2, 0.65, 10), 'C', 'below average');
  assert.equal(g(1.5, 0.5, 12, 2), 'D', 'messed up');
  assert.equal(g(2, half, 20, 4), 'F', 'really messed up');
  assert.equal(timeScore(par * 0.6, par), 1);
  assert.ok(timeScore(par, par) < 0.7, 'par is a pass, not full marks');
  assert.equal(completion({ kills: 0, residents: 0 }), 1);
});
import { makeMap, gadgetKinds, GADGET_INTRO, setKinds, SET_INTRO } from '../game-src/data/maps.js';
test('speed gadgets and set pieces come in one new kind per world, the new one early on, and every one sits inside the stage', () => {
  for (let z = 0; z < 10; z++) {
    const m = makeMap(z), kinds = new Set(m.gadgets.map(g => g.kind));
    for (const k of kinds) assert.ok(gadgetKinds(z).includes(k) || setKinds(z).includes(k), `${k} before its world in zone ${z + 1}`);
    for (const k of m.sets) assert.ok(setKinds(z).includes(k), `set piece ${k} before its world in zone ${z + 1}`);
    if (z < SET_INTRO.length) assert.ok(m.sets.includes(SET_INTRO[z]), `world ${z + 1} never shows its new ${SET_INTRO[z]}`);
    if (z < GADGET_INTRO.length) assert.ok(kinds.has(GADGET_INTRO[z]), `world ${z + 1} never shows its new ${GADGET_INTRO[z]}`);
    for (const g of m.gadgets) {
      const x = g.x ?? g.x0;
      assert.ok(x > 100 && x < m.bossLeft, `${g.kind} outside the route in zone ${z + 1}`);
      if (g.kind === 'boost') assert.equal(Math.abs(g.dir), 1);
    }
  }
});

test('slopes join the ground they run between, with solid ground under them, and there are no loops', () => {
  for (let z = 0; z < 10; z++) {
    const m = makeMap(z);
    assert.ok(m.slopes.length >= 3, `zone ${z + 1} has ramps`);
    for (const s of m.slopes) {
      assert.ok(Math.abs(s.k) <= 1.0001 && s.w >= 8, 'no slope steeper than 45 degrees');
      assert.ok(m.solids.some(q => q.under === s && q.x === s.x && q.w === s.w && q.y === Math.max(s.y0, s.y1) + 1), 'ground under every ramp');
    }
    assert.ok(!m.gadgets.some(g => g.kind === 'loop'), 'loops are gone');
  }
});

test('the field combo pays for a string of hits, and a special cashes it in', () => {
  assert.equal(fightMult(0), 1);
  assert.ok(fightMult(5) > fightMult(2), 'more hits, more damage');
  assert.equal(fightMult(100), 1 + FIGHT.max, 'up to a cap');
  assert.equal(fightMult(5, true) - 1, (fightMult(5) - 1) * FIGHT.cash, 'a special cashes the combo in');
  assert.ok(FIGHT.cut > 0 && FIGHT.window >= 1, 'each hit brings the special closer, with time to reach the next foe');
});
test('every stage runs speed, a fight, a feature, round and round, with relic nooks off the fast line', async () => {
  const { LEVELS } = await import('../game-src/data/overworld.js');
  const { relicSpots } = await import('../game-src/data/relics.js');
  let nooks = 0, relicNooks = 0;
  for (const [z, id] of [...Array.from({ length: 10 }, (_, z) => [z, null]), ...LEVELS.map(n => [n.zone, n.id])]) {
    const m = makeMap(z, id), pads = m.platforms.filter(p => p.fight).sort((a, b) => a.x - b.x);
    assert.ok(pads.length >= 3, `three fights or more in ${id || z}`);
    // between two fights there's always some running and a feature (a pit, a cliff or a high road)
    for (let i = 1; i < pads.length; i++) {
      const a = pads[i - 1].x + pads[i - 1].w, b = pads[i].x;
      assert.ok(b - a >= 300, `a breather between fights in ${id || z}`);
    }
    const ns = m.platforms.filter(p => p.nook);
    nooks += ns.length;
    if (id) relicNooks += relicSpots(m).filter(s => ns.some(p => s.x >= p.x && s.x <= p.x + p.w && s.y === p.y - 16)).length;
  }
  assert.ok(nooks > 40, 'nooks are common');
  assert.ok(relicNooks > 30, 'relics wait in the nooks');
});
