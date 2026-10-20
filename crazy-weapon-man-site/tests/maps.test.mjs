import test from 'node:test';
import assert from 'node:assert/strict';
import { makeMap, cameraTarget, cameraTargetY, LAYOUTS } from '../game-src/data/maps.js';
import { surfaceGraph } from './map-reach.mjs';
import { HERO, GROUND, W } from '../game-src/config.js';
import { world } from '../game-src/game/world.js';
import { ZONES } from '../game-src/data/zones.js';
import { move } from '../game-src/game/physics.js';
test('map 1 keeps its Ant Tunnel layout; the others are distinct MapleStory-style fields',()=>{
  assert.equal(LAYOUTS[0].style,'chambers');
  const fields=new Set();
  for(let z=0;z<10;z++) {
    const m=makeMap(z);
    assert.equal(m.name,ZONES[z].name);assert.ok(m.title);
    assert.equal(JSON.stringify(makeMap(z)),JSON.stringify(m));
    if(m.style==='field')fields.add(JSON.stringify({...LAYOUTS[z],title:0,label:0}));
  }
  assert.equal(fields.size,LAYOUTS.filter(l=>l.style==='field').length,'two field zones share the same recipe');
});
test('ladders end level with the platform they hang from, so the climb stops there',()=>{
  for(let z=0;z<10;z++) for(const l of makeMap(z).ladders) {
    assert.equal(l.top,l.exitY);assert.equal(l.exitX,l.x-HERO.w/2);
  }
});
test('maps are bounded, populated along their whole route and end at the exit',()=>{
  for(let z=0;z<10;z++) {
    const m=makeMap(z);
    assert.ok(m.width>=2.5*W && m.width<=12*W);
    assert.ok(m.spawns.length>=28+z*3-1);
    assert.ok(m.spawns.some(e=>e.x>m.width-W));
    assert.ok(m.spawns.every(e=>e.x>=70 && e.x<m.width-70));
    assert.ok(m.platforms.every(p=>p.x>=0 && p.x+p.w<=m.width && p.y<=m.floorY));
    assert.ok(m.exitX>m.width-60);
    for(const s of m.spawns) {
      assert.ok(m.platforms.some(p=>s.x>=p.x && s.x<p.x+p.w && s.y===p.y),'resident floating in zone '+z);
      assert.ok(!m.solids.some(p=>s.x+6>p.x && s.x-6<p.x+p.w && s.y-20<p.y+p.h && s.y-1>p.y),'resident inside rock in zone '+z);
      assert.ok(!m.solids.some(p=>s.x>p.x && s.x<p.x+p.w && s.airY-12<p.y+p.h && s.airY>p.y),'flyer inside rock in zone '+z);
    }
  }
});
test('every surface is reachable with real hero physics, and every one leads back to the start',()=>{
  for(let z=0;z<10;z++) {
    const m=makeMap(z),g=surfaceGraph(m);
    assert.ok(g.start>=0 && g.exit>=0,'start or exit not on a floor in zone '+z);
    const stranded=m.platforms.map((p,i)=>i).filter(i=>!g.forward.has(i));
    const oneWay=m.platforms.map((p,i)=>i).filter(i=>!g.back.has(i));
    assert.deepEqual(stranded.map(i=>[m.platforms[i].x,m.platforms[i].y]),[],'unreachable surfaces in zone '+(z+1));
    assert.deepEqual(oneWay.map(i=>[m.platforms[i].x,m.platforms[i].y]),[],'no way back from surfaces in zone '+(z+1));
  }
});
test('ladders stand on floors, exit onto floors and never pass through terrain',()=>{
  for(let z=0;z<10;z++) {
    const m=makeMap(z);
    for(const l of m.ladders) {
      assert.ok(m.platforms.some(p=>p.y===l.exitY && l.exitX>=p.x && l.exitX<p.x+p.w),'ladder exit in the air in zone '+z);
      assert.ok(m.platforms.some(p=>p.y===l.bottom && l.x>=p.x && l.x<p.x+p.w),'ladder foot in the air in zone '+z);
      assert.ok(!m.solids.some(p=>l.x>p.x-6 && l.x<p.x+p.w+6 && p.y<l.bottom-2 && p.y+p.h>l.top+2),'ladder passes through terrain in zone '+z);
    }
  }
});
test('the end chamber is a flat open arena the boss can drop into',()=>{
  for(let z=0;z<10;z++) {
    const m=makeMap(z);
    assert.ok(m.platforms.some(p=>p.solid && p.y===m.bossFloor && p.x<=m.bossLeft && p.x+p.w>=m.bossRight),'arena floor not flat in zone '+z);
    if(ZONES[z].boss)assert.ok(!m.solids.some(p=>p.x<m.bossRight && p.x+p.w>m.bossLeft+16 && p.y<m.bossFloor && p.y+p.h>m.bossFloor-200),'arena roof too low in zone '+z);
    assert.equal(m.exitY,m.bossFloor);
  }
});
test('every map starts on a floor and the camera can follow every height',()=>{
  for(let z=0;z<10;z++) {
    const m=makeMap(z);
    assert.ok(m.platforms.some(p=>p.y===m.startY && m.startX>=p.x && m.startX<p.x+p.w));
    assert.equal(cameraTargetY(m.floorY,m.floorY),m.floorY-GROUND);
    assert.equal(cameraTargetY(0,m.floorY),0);
    for(const r of m.rooms)assert.ok(r.label && r.end>r.x);
  }
});
test('solid floors, ceilings and side walls stop movement',()=>{
  world.map=makeMap(0);
  try {
    const p=world.map.solids.find(p=>p.ceiling), h={x:p.x+30,y:p.y+p.h+1,w:16,h:22,vx:0,vy:-200};
    move(h,1/60,[]);assert.equal(h.y,p.y+p.h);assert.equal(h.vy,0);
    h.x=p.x-17;h.y=p.y+100;h.vx=150;h.vy=0;
    move(h,1/60,[]);assert.equal(h.x,p.x-h.w);assert.equal(h.hitWall,1);
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
