import test from 'node:test';
import assert from 'node:assert/strict';
import { makeMap, cameraTarget, cameraTargetY } from '../game-src/data/maps.js';
import { HERO, GROUND, W } from '../game-src/config.js';
import { world } from '../game-src/game/world.js';
import { move } from '../game-src/game/physics.js';
test('ten finite maps grow from eight to twelve screens with residents across their routes',()=>{
  let prevWidth=0,prevCount=0;
  for(let z=0;z<10;z++) {
    const m=makeMap(z);assert.ok(m.width>=8*W && m.width<=12*W);
    assert.ok(m.width>=prevWidth && m.spawns.length>=prevCount);prevWidth=m.width;prevCount=m.spawns.length;
    assert.ok(m.spawns.some(e=>e.x>m.width-W));
    assert.ok(m.spawns.every(e=>e.x>=70 && e.x<m.width-70));
    assert.ok(m.platforms.every(p=>p.x>=0 && p.x+p.w<=m.width+36));
    assert.ok(m.exitX>m.width-60);
  }
});
test('each section has a clear ladder joining all three hunting tiers',()=>{
  for(let z=0;z<10;z++) {
    const m=makeMap(z);assert.equal(m.levels.length,3);assert.equal(m.ladders.length,m.sections);
    for(const l of m.ladders) {
      assert.ok(l.top<m.levels[0] && l.bottom===m.floorY);
      assert.ok(!m.solids.some(p=>l.x>p.x-10 && l.x<p.x+p.w+10));
      assert.ok(m.platforms.some(p=>p.y===l.exitY && l.exitX>=p.x && l.exitX<p.x+p.w));
    }
    for(const spawn of m.spawns) assert.ok(m.platforms.some(p=>spawn.x>=p.x && spawn.x<p.x+p.w && spawn.y===p.y));
    assert.equal(cameraTargetY(m.floorY,m.floorY),384);
  }
});
test('solid floors, ceilings and side walls stop movement',()=>{
  world.map=makeMap(1);
  try {
    const p=world.map.solids[0], h={x:100,y:p.y+p.h+1,w:16,h:22,vx:0,vy:-200};
    move(h,1/60,[]);assert.equal(h.y,p.y+p.h);assert.equal(h.vy,0);
    h.x=p.x+p.w+1;h.y=p.y+4;h.vx=-150;h.vy=0;
    move(h,1/60,[]);assert.equal(h.x,p.x+p.w);assert.equal(h.hitWall,-1);
  } finally {world.map=null;}
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
