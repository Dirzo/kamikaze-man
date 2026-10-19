import test from 'node:test';
import assert from 'node:assert/strict';
import { makeMap, cameraTarget, cameraTargetY } from '../game-src/data/maps.js';
import { HERO, GROUND, W } from '../game-src/config.js';
import { world } from '../game-src/game/world.js';
import { ZONES } from '../game-src/data/zones.js';
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
test('original themes are preserved and every hunting shelf is reachable through chamber routes',()=>{
  const rise=HERO.jump**2/(2*HERO.gravity),reach=HERO.speed*2*HERO.jump/HERO.gravity;
  for(let z=0;z<10;z++) {
    const m=makeMap(z);assert.equal(m.name,ZONES[z].name);
    assert.ok(m.rooms.length>=4 && m.rooms.length<=7);
    assert.ok(new Set(m.rooms.map(r=>r.w)).size>2,'rooms repeat the same width');
    for(let i=1;i<m.rooms.length;i++)assert.ok(m.rooms[i].floor>m.rooms[i-1].floor);
    const reached=new Set([m.platforms[0]]);let change=true;
    while(change) {
      change=false;
      for(const p of m.platforms)if(!reached.has(p)) {
        const linked=[...reached].some(q=>{
          const gap=Math.max(p.x-(q.x+q.w),q.x-(p.x+p.w),0);
          if(q.y-p.y<=rise && gap<=reach)return true;
          return m.ladders.some(l=>l.exitY===p.y && l.exitX>=p.x && l.exitX<p.x+p.w && l.bottom===q.y && l.x>=q.x && l.x<=q.x+q.w);
        });
        if(linked){reached.add(p);change=true;}
      }
    }
    assert.equal(reached.size,m.platforms.length,'stranded shelf in zone '+z);
    for(const l of m.ladders) {
      assert.ok(m.platforms.some(p=>p.y===l.exitY && l.exitX>=p.x && l.exitX<p.x+p.w));
      assert.ok(!m.solids.some(p=>l.x>p.x-6 && l.x<p.x+p.w+6 && p.y<l.bottom-2 && p.y+p.h>l.top+30),'ladder passes through terrain');
    }
    for(const spawn of m.spawns) assert.ok(m.platforms.some(p=>spawn.x>=p.x && spawn.x<p.x+p.w && spawn.y===p.y));
    assert.equal(cameraTargetY(m.floorY,m.floorY),m.floorY-GROUND);
  }
});
test('solid floors, ceilings and side walls stop movement',()=>{
  world.map=makeMap(1);
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
