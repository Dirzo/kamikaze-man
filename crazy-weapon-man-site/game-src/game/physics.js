// World-space movement: solid tunnel floors/ceilings/walls plus drop-through wooden ledges.
import { world } from './world.js';
import { W, GROUND } from '../config.js';
export const worldWidth=()=>world.map?.width||W;
export const worldFloor=()=>world.map?.floorY??GROUND;
export function overlap(a,b){return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;}
export function move(b,dt,platforms,{gravity=760,maxFall=330,dropThrough=false,air=false,minX=2,maxX=worldWidth()-2}={}) {
  const wasOn=b.onGround, solids=world.map?.solids||[];
  if(!air)b.vy=Math.min(maxFall,b.vy+gravity*dt);
  const oldX=b.x;
  b.x+=b.vx*dt;
  b.hitWall=0;
  for(const p of solids) if(overlap(b,p)) {
    if(b.vx>0 && oldX+b.w<=p.x+1){b.x=p.x-b.w;b.vx=0;b.hitWall=1;}
    else if(b.vx<0 && oldX>=p.x+p.w-1){b.x=p.x+p.w;b.vx=0;b.hitWall=-1;}
  }
  const oldTop=b.y, prevBottom=b.y+b.h;
  b.y+=b.vy*dt;b.onGround=false;b.platform=null;
  // Nearest crossed solid surface wins, independent of map authoring order.
  let floor=worldFloor(),support=null,ceiling=-Infinity;
  for(const p of solids) if(b.x+b.w>p.x && b.x<p.x+p.w) {
    if(b.vy>=0 && prevBottom<=p.y+0.5 && b.y+b.h>=p.y && p.y<floor){floor=p.y;support=p;}
    if(b.vy<0 && oldTop>=p.y+p.h-0.5 && b.y<p.y+p.h)ceiling=Math.max(ceiling,p.y+p.h);
  }
  if(!air && b.vy>=0 && !dropThrough) for(const p of platforms||[]) {
    if(p.solid)continue;
    if(prevBottom<=p.y+0.5 && b.y+b.h>=p.y && b.x+b.w>p.x+2 && b.x<p.x+p.w-2 && p.y<floor){floor=p.y;support=p;}
  }
  if(b.vy<0 && ceiling>-Infinity){b.y=ceiling;b.vy=0;}
  if(!air && b.y+b.h>=floor && b.vy>=0){b.y=floor-b.h;b.vy=0;b.onGround=true;b.platform=support;}
  if(b.x<minX){b.x=minX;if(b.vx<0)b.vx=0;b.hitWall=-1;}
  else if(b.x+b.w>maxX){b.x=maxX-b.w;if(b.vx>0)b.vx=0;b.hitWall=1;}
  return b.onGround&&!wasOn;
}
export const dx=(a,b)=>b.x+b.w/2-(a.x+a.w/2);
export const cx=b=>b.x+b.w/2;
export const cy=b=>b.y+b.h/2;
