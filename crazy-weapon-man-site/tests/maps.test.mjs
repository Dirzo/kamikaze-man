import test from 'node:test';
import assert from 'node:assert/strict';
import { makeMap, cameraTarget } from '../game-src/data/maps.js';
import { HERO, GROUND, W } from '../game-src/config.js';
import { world } from '../game-src/game/world.js';
import { move } from '../game-src/game/physics.js';
test('ten finite maps grow from three to five screens with residents across their routes',()=>{
  let prevWidth=0,prevCount=0;
  for(let z=0;z<10;z++) {
    const m=makeMap(z);assert.ok(m.width>=3*W && m.width<=5*W);
    assert.ok(m.width>=prevWidth && m.spawns.length>=prevCount);prevWidth=m.width;prevCount=m.spawns.length;
    assert.ok(m.spawns.some(e=>e.x>m.width-W));
    assert.ok(m.spawns.every(e=>e.x>120 && e.x<m.width-70));
    assert.ok(m.platforms.every(p=>p.x>=0 && p.x+p.w<m.width));
    assert.ok(m.exitX>m.width-60);
  }
});
test('every platform is reachable through normal jump steps',()=>{
  const jumpRise=HERO.jump*HERO.jump/(2*HERO.gravity);
  for(let z=0;z<10;z++) {
    const m=makeMap(z), reached=new Set();let changed=true;
    while(changed) {
      changed=false;
      for(const p of m.platforms) if(!reached.has(p)) {
        const support=p.y>=GROUND-jumpRise || [...reached].some(q=>q.y-p.y<=jumpRise && p.x<q.x+q.w+60 && p.x+p.w>q.x-60);
        if(support){reached.add(p);changed=true;}
      }
    }
    assert.equal(reached.size,m.platforms.length,'unreachable ledge in map '+z);
  }
});
test('world collision permits traversal beyond the old screen edge and clamps only at map ends',()=>{
  world.map=makeMap(9);
  try {
    const h={x:W+100,y:GROUND-HERO.h,w:HERO.w,h:HERO.h,vx:HERO.speed,vy:0};
    move(h,1/60,[]);assert.ok(h.x>W+100);
    h.x=world.map.width-3;move(h,1/60,[]);assert.equal(h.x,world.map.width-2-h.w);
    h.x=-10;move(h,1/60,[]);assert.equal(h.x,2);
  } finally {world.map=null;}
});
test('camera tracks the route and never reveals space outside the map',()=>{
  for(let z=0;z<10;z++) {
    const m=makeMap(z);assert.equal(cameraTarget(0,m.width),0);
    assert.ok(cameraTarget(W*2,m.width)>0);
    assert.equal(cameraTarget(m.width+500,m.width),m.width-W);
  }
});
