// The original ten biome paintings and platform sprites, applied to cave-network geometry.
import { W, H, GROUND, C } from '../config.js';
import { world } from './world.js';
import { A } from '../engine/assets.js';
import { ZONES } from '../data/zones.js';
import { roomAt } from '../data/maps.js';
import { X, rect, text, textWidth, screenLayer, worldLayer } from '../engine/gfx.js';
import { drawBiomeBackdrop, drawBiomeTerrain, drawBiomeProps } from './ambience.js';
const visible=(x,y,w,h)=>x+w>=world.cameraX && x<=world.cameraX+W && y+h>=world.cameraY && y<=world.cameraY+H;
export function drawMapBackdrop() {
  const map=world.map;if(!map)return;
  const bg=A.bg[ZONES[world.zone].id],camera=Math.round(world.cameraX||0),cameraY=Math.round(world.cameraY||0);
  // the zone's living environment (ambience.js): parallax layers, weather, its own terrain and props
  const living=drawBiomeBackdrop();
  screenLayer();
  const ox=Math.floor(camera*.25)%W;
  // Keep the authored scene at its native proportions at every depth.
  if(!living)for(let x=-ox;x<W;x+=W)X.drawImage(bg,0,0,W,GROUND,x,0,W,H);
  if(map.dark){X.globalAlpha=map.dark*.13;rect(0,0,W,H,C.ink);X.globalAlpha=1;} // deeper down the tunnel, less daylight
  if(living)drawBiomeTerrain();
  worldLayer();
  const slab=A.slabs[ZONES[world.zone].id];
  // Terrain uses the biome's existing earth texture, never a replacement cave palette.
  if(!living)for(const p of map.solids) {
    if(p.wall||!visible(p.x,p.y,p.w,p.h))continue;
    const left=Math.max(p.x,Math.floor(camera/32)*32),right=Math.min(p.x+p.w,camera+W+32);
    const top=Math.max(p.y,Math.floor(cameraY/32)*32),bottom=Math.min(p.y+p.h,cameraY+H+32);
    for(let y=top;y<bottom;y+=32)for(let x=left;x<right;x+=32) {
      const dw=Math.min(32,right-x),dh=Math.min(32,bottom-y);
      X.drawImage(bg,((x-p.x)%W+W)%W,GROUND+8,dw,Math.min(32,H-GROUND-8),x,y,dw,dh);
    }
    if(p.ceiling && slab) {
      // Inverted authored platform edge makes irregular hanging overhangs.
      X.save();X.translate(0,p.y+p.h);X.scale(1,-1);
      for(let x=p.x;x<p.x+p.w;x+=slab.w) {
        const sw=Math.min(slab.w,p.x+p.w-x);X.drawImage(slab.im,0,0,sw,slab.h,x,-2,sw,slab.h);
      }
      X.restore();
    }
  }
  // pit bottoms: a row of spikes, so a gap reads as a gap
  if(!living)for(const q of map.pits||[]) {
    const y=map.floorY;
    if(!visible(q.x,y-8,q.w,16))continue;
    rect(q.x,y-1,q.w,8,C.ink);
    for(let x=q.x+1;x<q.x+q.w-3;x+=6){rect(x+2,y-7,1,6,C.mist);rect(x+1,y-4,3,3,C.fog);rect(x,y-2,5,2,C.stone);}
  }
  for(const l of map.ladders) {
    if(!visible(l.x-8,l.top,16,l.bottom-l.top))continue;
    rect(l.x-6,l.top,2,l.bottom-l.top,C.woodD);rect(l.x+4,l.top,2,l.bottom-l.top,C.woodD);
    rect(l.x-5,l.top,1,l.bottom-l.top,C.wood);rect(l.x+5,l.top,1,l.bottom-l.top,C.wood);
    for(let y=l.top+4;y<l.bottom;y+=9){rect(l.x-5,y,11,3,C.woodD);rect(l.x-5,y,10,1,C.sand);}
  }
  if(living)drawBiomeProps();
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
  const label=open?'NEXT MAP >':'BEAT THE ARENA TO OPEN',half=textWidth(label)/2,cam=world.cameraX||0;
  text(label,Math.max(cam+half+6,Math.min(cam+W-half-6,x)),ground-55,open?C.lime:C.mist,{align:'center'});
}
export function drawRouteHud() {
  const map=world.map;if(!map)return;
  const h=world.hero, room=roomAt(map,h.x+h.w/2,h.y+h.h)||world.lastRoom;
  if(room)world.lastRoom=room;
  const same=room?map.rooms.filter(r=>r.label===room.label):[];
  text((world.level?world.level.id+' '+world.level.name.toUpperCase()+' - ':'MAP '+(world.zone+1)+'/10 - ')+(map.own?map.title:map.name)+(room?' / '+room.label+(same.length>1?' '+(same.indexOf(room)+1):''):''),8,216,C.mist);
  // the minimap keeps the map's real proportions: tall climbs read tall, long runs read long
  const k=Math.min(120/map.width,58/map.height),w=Math.round(map.width*k),mh=Math.round(map.height*k);
  const x=W-8-w,y=44,sx=k,sy=k;
  rect(x-3,y-3,w+6,mh+6,C.ink);rect(x-2,y-2,w+4,mh+4,C.stone);rect(x-1,y-1,w+2,mh+2,C.ink);
  rect(x,y,w,mh,C.night);
  for(const p of map.solids)rect(x+p.x*sx,y+p.y*sy,Math.max(2,p.w*sx),Math.max(1,p.h*sy),C.slate);
  for(const p of map.platforms)rect(x+p.x*sx,y+p.y*sy,Math.max(2,p.w*sx),1,C.fog);
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
