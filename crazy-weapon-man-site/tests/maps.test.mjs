import test from 'node:test';
import assert from 'node:assert/strict';
import { makeMap, cameraTarget, cameraTargetY, LAYOUTS, ownMap, FOES, KILL_PAY } from '../game-src/data/maps.js';
import { surfaceGraph } from './map-reach.mjs';
import { HERO, GROUND, W } from '../game-src/config.js';
import { world } from '../game-src/game/world.js';
import { ZONES } from '../game-src/data/zones.js';
import { move } from '../game-src/game/physics.js';
// every zone's map, then World 1's deeper Ant Tunnel levels
import { LEVELS } from '../game-src/data/overworld.js';
const MAPS=[...Array.from({length:10},(_,z)=>[z,null]),...LEVELS.map(n=>[n.zone,n.id])];
const label=(z,id)=>id?'level '+id:'zone '+(z+1);
test('every overworld level plays its own map, and the road to each castle grows',()=>{
  const seen=new Set();
  for(const n of LEVELS) {
    const m=makeMap(n.zone,n.id),key=JSON.stringify(m.platforms);
    assert.ok(!seen.has(key),n.id+' repeats another level\'s map');
    seen.add(key);
  }
  for(const R of [...new Set(LEVELS.map(n=>n.region))]) {
    const ids=LEVELS.filter(n=>n.region===R),first=makeMap(ids[0].zone,ids[0].id),castle=ids.find(n=>n.kind==='castle');
    const c=makeMap(castle.zone,castle.id);
    assert.ok(c.spawns.length>first.spawns.length && c.width>=first.width,'castle of world '+R+' is no bigger than its first level');
  }
});
test('every map is a Super Mario World style run: one-way through, no ladders, pits and high routes',()=>{
  const recipes=new Set();
  for(let z=0;z<10;z++) {
    const m=makeMap(z);
    assert.equal(m.name,ZONES[z].name);assert.ok(m.title);
    assert.equal(JSON.stringify(makeMap(z)),JSON.stringify(m),'seeded: the same every run');
    recipes.add(JSON.stringify({...LAYOUTS[z],title:0,label:0}));
  }
  assert.equal(recipes.size,10,'two worlds share the same recipe');
  for(const [z,id] of MAPS) {
    const m=makeMap(z,id);
    assert.equal(m.ladders.length,0,'ladders in '+label(z,id));
    assert.ok(m.platforms.some(p=>p.hunt),'no floating ledges in '+label(z,id));
    for(const p of m.pits) {
      assert.ok(p.w<=56 || m.platforms.some(q=>q.step && q.x>p.x && q.x+q.w<p.x+p.w),'a wide chasm with no stepping ledge in '+label(z,id));
      assert.ok(m.floorY>Math.max(...m.platforms.filter(q=>q.ground).map(q=>q.y)),'no pit bottom under the ground');
    }
  }
  assert.ok(MAPS.filter(([z,id])=>makeMap(z,id).pits.length).length>MAPS.length*0.9,'most stages have pits');
});
test('fewer residents than the old fields, and each pays more so the economy keeps pace',()=>{
  for(let z=0;z<10;z++) assert.ok(Math.abs(FOES(z)*KILL_PAY(z)-(50+4*z))<1e-9);
  for(let z=0;z<10;z++) assert.ok(FOES(z)>=40,'longer stages hold enough residents');
});
test('ladders end level with the platform they hang from, so the climb stops there',()=>{
  for(const [z,id] of MAPS) for(const l of makeMap(z,id).ladders) {
    assert.equal(l.top,l.exitY);assert.equal(l.exitX,l.x-HERO.w/2);
  }
});
test('maps are bounded, populated along their whole route and end at the exit',()=>{
  for(const [z,id] of MAPS) {
    const m=makeMap(z,id);
    assert.ok(m.width>=13*W && m.width<=25*W);
    assert.ok(m.spawns.length>=27+z*2-1);
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
  for(const [zone,id] of MAPS) {
    const m=makeMap(zone,id),g=surfaceGraph(m),z=label(zone,id);
    assert.ok(g.start>=0 && g.exit>=0,'start or exit not on a floor in '+z);
    const stranded=m.platforms.map((p,i)=>i).filter(i=>!g.forward.has(i));
    const oneWay=m.platforms.map((p,i)=>i).filter(i=>!g.back.has(i));
    assert.deepEqual(stranded.map(i=>[m.platforms[i].x,m.platforms[i].y]),[],'unreachable surfaces in '+z);
    assert.deepEqual(oneWay.map(i=>[m.platforms[i].x,m.platforms[i].y]),[],'no way back from surfaces in '+z);
  }
});
test('ladders stand on floors, exit onto floors and never pass through terrain',()=>{
  for(const [z,id] of MAPS) {
    const m=makeMap(z,id);
    for(const l of m.ladders) {
      assert.ok(m.platforms.some(p=>p.y===l.exitY && l.exitX>=p.x && l.exitX<p.x+p.w),'ladder exit in the air in zone '+z);
      assert.ok(m.platforms.some(p=>p.y===l.bottom && l.x>=p.x && l.x<p.x+p.w),'ladder foot in the air in zone '+z);
      assert.ok(!m.solids.some(p=>l.x>p.x-6 && l.x<p.x+p.w+6 && p.y<l.bottom-2 && p.y+p.h>l.top+2),'ladder passes through terrain in zone '+z);
    }
  }
});
test('the end chamber is a flat open arena the boss can drop into',()=>{
  for(const [z,id] of MAPS) {
    const m=makeMap(z,id);
    assert.ok(m.platforms.some(p=>p.solid && p.y===m.bossFloor && p.x<=m.bossLeft && p.x+p.w>=m.bossRight),'arena floor not flat in zone '+z);
    if(ZONES[z].boss||ownMap(id))assert.ok(!m.solids.some(p=>p.x<m.bossRight && p.x+p.w>m.bossLeft+16 && p.y<m.bossFloor && p.y+p.h>m.bossFloor-200),'arena roof too low in zone '+z);
    assert.equal(m.exitY,m.bossFloor);
  }
});
test('every map starts on a floor and the camera can follow every height',()=>{
  for(const [z,id] of MAPS) {
    const m=makeMap(z,id);
    assert.ok(m.platforms.some(p=>p.y===m.startY && m.startX>=p.x && m.startX<p.x+p.w));
    assert.equal(cameraTargetY(m.floorY,m.floorY),m.floorY-GROUND);
    assert.equal(cameraTargetY(0,m.floorY),0);
    for(const r of m.rooms)assert.ok(r.label && r.end>r.x);
  }
});
test('solid floors, ceilings and side walls stop movement',()=>{
  world.map=makeMap(0);
  try {
    const S=world.map.solids,free=(x,y,w)=>!S.some(q=>x<q.x+q.w && x+w>q.x && y<q.y+q.h && y+22>q.y);
    const p=S.find(p=>p.ceiling && p.h>110 && free(p.x-17,p.y+100,17)), h={x:p.x+30,y:p.y+p.h+1,w:16,h:22,vx:0,vy:-200};
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

test('residents stand in small groups along the route, a body apart', () => {
  for (let z = 0; z < 10; z++) {
    const m = makeMap(z), packs = new Map();
    for (const s of m.spawns) packs.set(s.pack, [...(packs.get(s.pack) || []), s]);
    assert.ok([...packs.values()].every(p => p.length <= LAYOUTS[z].pack[1] + 3), 'zone ' + (z + 1) + ' has a crowd');
    for (const a of m.spawns) for (const b of m.spawns)
      if (a !== b && a.y === b.y) assert.ok(Math.abs(a.x - b.x) >= 16, 'residents overlap in zone ' + (z + 1));
  }
});

test('stacked routes, crumbling bridges and cliffs you smash a tunnel through', () => {
  let high = 0, sky = 0, bridges = 0;
  for (const [z, id] of MAPS) {
    const m = makeMap(z, id), z1 = label(z, id);
    if (m.platforms.some(p => p.tier === 1)) high++;
    if (m.platforms.some(p => p.tier === 2)) sky++;
    // a high road keeps two hops of headroom over the ground under it
    for (const p of m.platforms.filter(p => p.tier === 1))
      for (const g of m.platforms.filter(g => g.ground && g.x < p.x + p.w && g.x + g.w > p.x)) assert.ok(g.y - p.y >= 56, 'high road too low in ' + z1);
    for (const q of m.pits.filter(q => q.bridge)) {
      bridges++;
      const planks = m.platforms.filter(p => p.plank && p.x >= q.x && p.x < q.x + q.w);
      assert.equal(planks.reduce((s, p) => s + p.w, 0), q.w, 'a bridge with a gap in ' + z1);
      assert.ok(planks.every(p => p.crumble && !p.hunt && p.w >= 16), 'a plank residents stand on in ' + z1);
    }
    for (const w of m.walls) {
      assert.ok(m.solids.includes(w), 'a wall that does not block in ' + z1);
      assert.ok(m.platforms.some(p => p.ground && p.y === w.y + w.h && w.x >= p.x && w.x + w.w <= p.x + p.w), 'a wall not standing on ground in ' + z1);
      assert.ok(m.solids.some(c => c.cliff && c.x === w.x && c.y + c.h === w.y), 'cracked rock that is not a cliff\'s tunnel mouth in ' + z1);
      assert.ok(!m.spawns.some(s => s.x + 6 > w.x && s.x - 6 < w.x + w.w && s.y === w.y + w.h), 'a resident inside a wall in ' + z1);
    }
  }
  assert.ok(high > MAPS.length * 0.9, 'most stages have a high road');
  assert.ok(sky > MAPS.length * 0.3, 'sky roads are rare');
  assert.ok(bridges > MAPS.length * 0.5, 'too few crumbling bridges');
  assert.ok(MAPS.every(([z, id]) => makeMap(z, id).walls.length >= 1), 'a stage with no cliff to smash through');
});
