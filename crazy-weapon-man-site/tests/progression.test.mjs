import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWeapon, trainingSword, dps, hitDamage } from '../game-src/game/loot.js';
import { TYPE_UNLOCKS, ELEMENT_UNLOCKS, MUTATIONS, availableTypes, availableElements, availableMutations, maxRarity, enemyPool, waveBudget } from '../game-src/data/progression.js';
import { TYPES, MOVES } from '../game-src/data/weapons.js';
import { activeWindow, attackBox, canAttack } from '../game-src/game/attack-rules.js';
import { refHP, ENEMY_HP } from '../game-src/data/curve.js';
import { ZONES } from '../game-src/data/zones.js';
import { move } from '../game-src/game/physics.js';

test('20,000 random drops obey introduction gates, including boss/elite rewards', () => {
  for (let zone=0;zone<10;zone++) for(let i=0;i<2000;i++) {
    const w=makeWeapon(zone,{boss:i%4===0,elite:i%4===1});
    assert.ok(TYPE_UNLOCKS[w.type]<=zone);
    assert.ok(w.q<=maxRarity(zone));
    if(w.family) assert.ok(ELEMENT_UNLOCKS[w.family]<=zone);
    if(w.mutation) { const m=MUTATIONS[w.mutation]; assert.ok(m.zone<=zone && m.q<=w.q); }
    assert.ok(Number.isFinite(dps(w)) && dps(w)>0);
    assert.ok(w.name.length<=40);
  }
});
test('opening loot has three fundamentals and no elemental/mutation overload',()=>{
  assert.deepEqual(availableTypes(0),['sword','dagger','bow']);
  assert.deepEqual(availableElements(0),[]); assert.deepEqual(availableMutations(0,10),[]);
  assert.deepEqual(enemyPool(0,1,ZONES[0].pool),['stalker','crawler']);
  assert.ok(!enemyPool(0,3,ZONES[0].pool).includes('bombchicken'));
  assert.ok(enemyPool(0,4,ZONES[0].pool).includes('bombchicken'));
});
test('all powers eventually unlock; late-run pressure increases without unbounded hordes',()=>{
  assert.equal(availableTypes(9).length,9); assert.equal(availableElements(9).length,10);
  assert.equal(availableMutations(9,10).length,5);
  assert.ok(waveBudget(9,4).count>waveBudget(0,1).count);
  assert.ok(waveBudget(9,4).interval<waveBudget(0,1).interval);
  assert.ok(waveBudget(9,4).alive<=10); assert.equal(waveBudget(0,1).elites,0);
});
test('a normal blade needs 3-6 hits at home; standout strength decays across zones',()=>{
  for(let z=0;z<10;z++) {
    const w=makeWeapon(z,{q:Math.min(10,z+1),type:'sword',standout:false});
    const hits=refHP(z)*ENEMY_HP/hitDamage(w); assert.ok(hits>=2.7 && hits<=6);
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
