// Scrolling background, route signage and exit. Actors use the regular world renderer.
import { W, H, GROUND, C } from '../config.js';
import { world } from './world.js';
import { A } from '../engine/assets.js';
import { X, rect, text, screenLayer, worldLayer } from '../engine/gfx.js';
import { ZONES } from '../data/zones.js';
export function drawMapBackdrop() {
  const bg=A.bg[ZONES[world.zone].id], camera=Math.round(world.cameraX||0);
  screenLayer();
  const parallax=Math.floor(camera*0.28)%W;
  for(let x=-parallax;x<W;x+=W) X.drawImage(bg,0,0,W,GROUND,x,0,W,GROUND);
  // Ground texture scrolls at actor speed. The distant scenery moves more slowly.
  for(let x=-(camera%W);x<W;x+=W) X.drawImage(bg,0,GROUND,W,H-GROUND,x,GROUND,W,H-GROUND);
  worldLayer();
  if(!world.map) return;
  for(let s=0;s<world.map.sections;s++) {
    const x=s*W+24;
    if(x<camera-80 || x>camera+W+80) continue;
    rect(x,GROUND-24,2,24,C.woodD);
    rect(x-9,GROUND-25,42,12,C.ink);
    rect(x-8,GROUND-24,40,10,C.wood);
    text(String(s+1)+' / '+world.map.sections,x+12,GROUND-22,C.cream,{align:'center'});
  }
}
export function drawMapExit(t) {
  if(!world.map) return;
  const x=world.map.exitX, open=world.director?.phase==='exit';
  // Stone arch and stepped pixel light. Solid, readable silhouette rather than a soft glow.
  rect(x-14,GROUND-40,28,40,C.ink);
  rect(x-12,GROUND-37,24,37,C.slate);
  rect(x-9,GROUND-35,18,35,open?C.teal:C.night);
  rect(x-6,GROUND-32,12,32,open?C.sky:C.ink);
  rect(x-14,GROUND-42,28,5,C.fog);
  rect(x-17,GROUND-3,34,3,C.stone);
  if(open) {
    const p=Math.floor(t*5)%4;
    for(let y=GROUND-31+p;y<GROUND-4;y+=6) rect(x-4,y,8,2,C.ice);
  } else {
    rect(x-7,GROUND-23,14,5,C.wine);
    rect(x-2,GROUND-25,4,9,C.red);
  }
  if(Math.abs(x-(world.cameraX||0)-W/2)<W/2+60)
    text(open?'NEXT MAP >':'CLEAR ALL TO OPEN',x,GROUND-55,open?C.lime:C.mist,{align:'center'});
}
export function drawRouteHud() {
  if(!world.map) return;
  const x=8,y=229,w=W-16,scale=w/world.map.width;
  rect(x-1,y-2,w+2,9,C.ink);rect(x,y,w,5,C.slate);
  rect(x+(world.cameraX||0)*scale,y,Math.max(2,W*scale),5,C.stone);
  for(const p of world.platforms) rect(x+p.x*scale,y-1,Math.max(1,p.w*scale),1,C.fog);
  for(const e of world.enemies) if(!e.dead) rect(x+(e.x+e.w/2)*scale,y+1,e.boss?3:2,3,e.boss?C.orange:C.coral);
  rect(x+world.map.exitX*scale,y,3,5,world.director?.phase==='exit'?C.lime:C.teal);
  rect(x+(world.hero.x+world.hero.w/2)*scale-1,y-1,3,7,C.gold);
  const left=world.enemies.filter(e=>!e.dead && e.x<(world.cameraX||0)).length;
  const right=world.enemies.filter(e=>!e.dead && e.x>(world.cameraX||0)+W).length;
  if(left) text('< '+left,6,28,C.coral);
  if(right) text(right+' >',W-6,28,C.coral,{align:'right'});
}
