// Original pixel terrain: warm sandstone badlands and enclosed fungal mine galleries.
// Map geometry is also collision geometry; decorative rock never hides a walkable route.
import { W, H, GROUND, C } from '../config.js';
import { world } from './world.js';
import { X, rect, text, textWidth, screenLayer, worldLayer } from '../engine/gfx.js';
const visible=(x,y,w,h)=>x+w>=world.cameraX && x<=world.cameraX+W && y+h>=world.cameraY && y<=world.cameraY+H;
export function drawMapBackdrop() {
  const map=world.map;if(!map)return;
  const camera=Math.round(world.cameraX||0), cy=Math.round(world.cameraY||0), cave=map.style==='tunnel';
  screenLayer();
  if(cave) {
    rect(0,0,W,H,C.ink);
    // Recessed rock chambers move slowly behind the traversable foreground.
    const ox=Math.floor(camera*0.3)%96,oy=Math.floor(cy*0.2)%64;
    for(let y=-oy-64;y<H;y+=64) for(let x=-ox-96;x<W;x+=96) {
      rect(x+3,y+3,90,58,C.night);rect(x+8,y+7,77,1,C.slate);
      rect(x+4,y+5,1,46,C.slate);rect(x+72,y+37,14,2,C.ink);
      rect(x+52,y+17,2,8,C.ink);
    }
  } else {
    rect(0,0,W,H,C.sand);rect(0,0,W,58,C.orange);rect(0,58,W,48,C.coral);rect(0,106,W,H-106,C.rust);
    const ox=Math.floor(camera*0.18)%180;
    for(let x=-ox-180;x<W;x+=180) {
      const dy=Math.floor(cy*0.12);
      rect(x,100-dy,158,H,C.woodD);rect(x+16,77-dy,124,25,C.woodD);rect(x+37,66-dy,82,12,C.woodD);
      rect(x+15,105-dy,130,2,C.rust);rect(x+91,88-dy,3,H,C.wood);
    }
  }
  worldLayer();
  // Recovery floor, visible wherever a shaft reaches the lowest level.
  if(visible(0,map.floorY,map.width,80)) {
    rect(0,map.floorY,map.width,80,cave?C.slate:C.woodD);
    rect(0,map.floorY,map.width,3,cave?C.fog:C.sand);
    const begin=Math.floor(camera/24)*24;
    for(let x=begin;x<camera+W+24;x+=24)rect(x,map.floorY+10,12,2,cave?C.stone:C.wood);
  }
  for(const p of map.solids) {
    if(!visible(p.x,p.y,p.w,p.h))continue;
    rect(p.x,p.y,p.w,p.h,C.ink);rect(p.x+2,p.y+3,p.w-4,p.h-5,cave?C.slate:C.wood);
    rect(p.x,p.y,p.w,3,cave?C.fog:C.sand);rect(p.x+2,p.y+3,p.w-4,2,cave?C.stone:C.orange);
    rect(p.x,p.y+p.h-4,p.w,4,cave?C.night:C.woodD);
    for(let x=p.x+8;x<p.x+p.w-8;x+=30) {
      rect(x,p.y+11,22,2,cave?C.stone:C.sand);rect(x+10,p.y+12,2,18,cave?C.night:C.woodD);
      rect(x-4,p.y+35,18,2,cave?C.night:C.woodD);rect(x+15,p.y+43,6,2,cave?C.fog:C.rust);
    }
    // Torches and fungi define chamber entrances. Their colours are all on the shared palette.
    const tx=p.x+p.w-34;
    rect(tx,p.y-20,3,20,C.woodD);rect(tx-1,p.y-25,5,7,C.rust);
    rect(tx,p.y-26,3,7,C.gold);rect(tx+1,p.y-25,1,4,C.cream);
    if(cave) {
      rect(p.x+38,p.y-10,3,10,C.sand);rect(p.x+31,p.y-14,17,6,C.red);
      rect(p.x+34,p.y-16,11,2,C.coral);rect(p.x+35,p.y-13,2,2,C.paper);
      rect(p.x+70,p.y-13,4,13,C.teal);rect(p.x+74,p.y-9,3,9,C.sky);rect(p.x+71,p.y-12,1,9,C.ice);
    } else {
      rect(p.x+42,p.y-19,3,19,C.woodD);rect(p.x+34,p.y-15,10,3,C.woodD);rect(p.x+51,p.y-23,3,10,C.woodD);rect(p.x+44,p.y-11,9,3,C.woodD);
    }
  }
  for(const l of map.ladders) {
    if(!visible(l.x-8,l.top,16,l.bottom-l.top))continue;
    rect(l.x-7,l.top,3,l.bottom-l.top,C.woodD);rect(l.x+4,l.top,3,l.bottom-l.top,C.woodD);
    rect(l.x-6,l.top,1,l.bottom-l.top,C.sand);rect(l.x+5,l.top,1,l.bottom-l.top,C.sand);
    for(let y=l.top+4;y<l.bottom;y+=9){rect(l.x-5,y,11,3,C.woodD);rect(l.x-5,y,10,1,C.sand);}
  }
}
export function drawMapExit(t) {
  const map=world.map;if(!map)return;
  const x=map.exitX,ground=map.exitY,open=world.director?.phase==='exit';
  if(!visible(x-80,ground-70,160,75))return;
  rect(x-14,ground-40,28,40,C.ink);rect(x-12,ground-37,24,37,C.slate);
  rect(x-9,ground-35,18,35,open?C.teal:C.night);rect(x-6,ground-32,12,32,open?C.sky:C.ink);
  rect(x-14,ground-42,28,5,C.fog);rect(x-17,ground-3,34,3,C.stone);
  if(open)for(let y=ground-31+Math.floor(t*5)%4;y<ground-4;y+=6)rect(x-4,y,8,2,C.ice);
  else {rect(x-7,ground-23,14,5,C.wine);rect(x-2,ground-25,4,9,C.red);}
  const label=open?'NEXT MAP >':'CLEAR ALL TO OPEN',half=textWidth(label)/2,cam=world.cameraX||0;
  text(label,Math.max(cam+half+6,Math.min(cam+W-half-6,x)),ground-55,open?C.lime:C.mist,{align:'center'});
}
export function drawRouteHud() {
  const map=world.map;if(!map)return;
  const h=world.hero, lane=Math.max(1,Math.min(3,1+Math.floor((h.y+h.h-GROUND+36)/144)));
  text('MAP '+(world.zone+1)+'/10 - '+map.name+' / TIER '+lane,8,216,C.mist);
  const x=W-128,y=44,w=120,mh=58,sx=w/map.width,sy=mh/map.height;
  rect(x-3,y-3,w+6,mh+6,C.ink);rect(x-2,y-2,w+4,mh+4,C.stone);rect(x-1,y-1,w+2,mh+2,C.ink);
  rect(x,y,w,mh,C.night);
  for(const p of map.solids)rect(x+p.x*sx,y+p.y*sy,Math.max(2,p.w*sx),Math.max(1,p.h*sy),C.fog);
  for(const l of map.ladders)rect(x+l.x*sx,y+l.top*sy,1,(l.bottom-l.top)*sy,C.wood);
  const vx=x+(world.cameraX||0)*sx,vy=y+(world.cameraY||0)*sy,vw=W*sx,vh=GROUND*sy;
  rect(vx,vy,vw,1,C.paper);rect(vx,vy+vh,vw,1,C.paper);rect(vx,vy,1,vh,C.paper);rect(vx+vw,vy,1,vh,C.paper);
  for(const e of world.enemies)if(!e.dead)rect(x+(e.x+e.w/2)*sx,y+(e.y+e.h/2)*sy,2,2,e.boss?C.orange:C.coral);
  rect(x+map.exitX*sx-1,y+map.exitY*sy-2,2,3,world.director?.phase==='exit'?C.lime:C.teal);
  rect(x+(h.x+h.w/2)*sx-1,y+(h.y+h.h/2)*sy-1,3,3,C.gold);
  const left=world.enemies.filter(e=>!e.dead && e.x<(world.cameraX||0)).length;
  const right=world.enemies.filter(e=>!e.dead && e.x>(world.cameraX||0)+W).length;
  if(left)text('< '+left,6,28,C.coral);
  if(right)text(right+' >',W-6,28,C.coral,{align:'right'});
}
