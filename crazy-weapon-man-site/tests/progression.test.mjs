import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWeapon, trainingSword, dps, hitDamage } from '../game-src/game/loot.js';
import { TYPE_UNLOCKS, ELEMENT_UNLOCKS, MUTATIONS, availableTypes, availableElements, availableMutations, maxRarity, enemyPool, waveBudget } from '../game-src/data/progression.js';
import { TYPES, MOVES, RECOVERY } from '../game-src/data/weapons.js';
import { activeWindow, attackBox, canAttack } from '../game-src/game/attack-rules.js';
import { refHP, ENEMY_HP } from '../game-src/data/curve.js';
import { ZONES } from '../game-src/data/zones.js';
import { ENEMIES } from '../game-src/data/enemies.js';
import { ABILITIES } from '../game-src/data/abilities.js';
import { move } from '../game-src/game/physics.js';

test('20,000 random drops obey introduction gates, including boss/elite rewards', () => {
  for (let zone=0;zone<10;zone++) for(let i=0;i<2000;i++) {
    const w=makeWeapon(zone,{boss:i%4===0,elite:i%4===1});
    assert.ok(TYPE_UNLOCKS[w.type]<=zone);
    assert.ok(w.q<=maxRarity(zone));
    if(w.family) assert.ok(ELEMENT_UNLOCKS[w.family]<=zone);
    if(w.mutation) { const m=MUTATIONS[w.mutation]; assert.ok(m.zone<=zone && m.q<=w.q); }
    assert.ok(Number.isFinite(dps(w)) && dps(w)>0);
    assert.ok(w.name.length<=90,w.name);
    if(w.ability) assert.ok(ABILITIES[w.ability].clause.some(c=>w.name.endsWith(c)),w.name);
  }
});
test('names run longer at higher rarity, and rare weapons often carry an ability',()=>{
  const ws=Array.from({length:3000},()=>makeWeapon(9,{boss:true}));
  assert.ok(Math.max(...ws.map(w=>w.name.length))>55);
  assert.ok(ws.every(w=>w.ability));
  const commons=Array.from({length:500},()=>makeWeapon(0,{q:0,standout:false}));
  assert.ok(commons.every(w=>!w.ability));
});
test('opening loot has every weapon type at equal odds and no elemental/mutation overload',()=>{
  assert.equal(availableTypes(0).length,13);
  const seen={};for(let i=0;i<26000;i++){const t=makeWeapon(0).type;seen[t]=(seen[t]||0)+1;}
  for(const t of Object.keys(TYPES)) assert.ok(Math.abs(seen[t]-2000)<260,`${t} dropped ${seen[t]}/2000`);
  assert.deepEqual(availableElements(0),[]); assert.deepEqual(availableMutations(0,10),[]);
  assert.deepEqual(enemyPool(0,1,ZONES[0].pool),['gosling','honker']);
  assert.ok(!enemyPool(0,3,ZONES[0].pool).includes('gander'));
  assert.ok(enemyPool(0,4,ZONES[0].pool).includes('gander'));
});
test('all powers eventually unlock; late-run pressure increases without unbounded hordes',()=>{
  assert.equal(availableTypes(9).length,13); assert.equal(availableElements(9).length,10);
  assert.equal(availableMutations(9,10).length,5);
  assert.ok(waveBudget(9,4).count>waveBudget(0,1).count);
  assert.ok(waveBudget(9,4).interval<waveBudget(0,1).interval);
  assert.ok(waveBudget(9,4).alive<=10); assert.equal(waveBudget(0,1).elites,0);
});
test('a normal blade needs 2-6 hits at home; standout strength decays across zones',()=>{
  for(let z=0;z<10;z++) {
    const w=makeWeapon(z,{q:Math.min(10,z+1),type:'sword',standout:false});
    const hits=refHP(z)*ENEMY_HP/hitDamage(w); assert.ok(hits>=2.3 && hits<=6);
  }
  const w=makeWeapon(0,{type:'sword',q:1,standout:true});
  assert.ok(hitDamage(w)>=refHP(0)*ENEMY_HP);
  assert.ok(hitDamage(w)<refHP(1)*ENEMY_HP);
});
test('active windows fit every weapon animation and geometry mirrors exactly',()=>{
  for(const [type,T] of Object.entries(TYPES)) if(T.melee) for(const name of T.combo) {
    const mv=MOVES[name], [a,b]=activeWindow(type,mv.big);
    assert.ok(a>0 && a<b && b<1);
    const h={x:100,y:80,w:11,face:1},r=attackBox(h,T,mv),l=attackBox({...h,face:-1},T,mv);
    assert.equal(r.w,l.w); assert.ok(Math.abs(r.x+l.x+r.w-211)<1e-8);
  }
  const h={attack:{},special:null,cd:0,hurtT:0,dashT:0,dead:false};
  assert.equal(canAttack(h),false); assert.equal(canAttack({...h,attack:null}),true);
});
test('one-way platforms permit jumping up, landing and deliberate drop-through',()=>{
  const p=[{x:20,y:120,w:100}], b={x:50,y:90,w:11,h:22,vx:0,vy:150};
  for(let i=0;i<4;i++) move(b,1/60,p); assert.equal(b.y,98); assert.equal(b.onGround,true);
  b.y+=2; move(b,1/60,p,{dropThrough:true}); assert.ok(b.y>98);
});

test('all nine attacks and finisher recovery run exactly 25% faster',()=>{
  const before={sword:0.34,dagger:0.24,katana:0.32,hammer:0.58,nunchucks:0.26,staff:0.4,bow:0.44,shuriken:0.3,wand:0.36};
  for(const [type,cd] of Object.entries(before)) assert.ok(Math.abs(cd/TYPES[type].cd-1.25)<1e-10);
  assert.ok(Math.abs(0.12/RECOVERY-1.25)<1e-10);
});

test('the goose family grows up along World 1: goslings on 1-1, War Ganders at the castle', () => {
  const pool = ZONES[0].pool;
  assert.deepEqual(enemyPool(0, 1, pool, 0), ['gosling', 'honker', 'gsquire']);
  assert.ok(enemyPool(0, 1, pool, 1).includes('gander'));
});
test('the lagoon family grows up along zone 3: tadpoles on 3-1, the Grand Snapper at the castle', () => {
  const pool = ZONES[2].pool, at = t => enemyPool(2, 1, pool, t);
  assert.deepEqual(at(0), ['tadpole', 'pondfrog', 'snapper']);
  assert.ok(at(1).includes('grandsnapper') && !at(1).includes('tadpole'));
  assert.ok(pool.every(t => ENEMIES[t].fam === 'lagoon'));
});
test('the fuzzball family grows up along zone 2: fuzzlets on its first level, werewolves at the castle', () => {
  const pool = ZONES[1].pool, at = t => enemyPool(1, 1, pool, t);
  assert.deepEqual(at(0), ['fuzzlet', 'burrball', 'puffshot']);
  assert.ok(at(1).includes('werewolf') && at(1).includes('yeti') && !at(1).includes('fuzzlet'));
  for (let t = 0; t <= 1; t += 0.1) assert.ok(at(t).length >= 3 && at(t).length <= 6, String(t));
  assert.ok(enemyPool(1, 4, pool).includes('werewolf'), 'a classic run meets the whole family by the deep rooms');
});
