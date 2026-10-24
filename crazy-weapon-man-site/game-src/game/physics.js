// World-space movement: solid tunnel floors/ceilings/walls plus drop-through wooden ledges, and
// slopes (Sonic): ramps between two grounds at different heights. A slope is a surface line, not a
// box: whoever stands on it follows it (sticking to it running downhill), a lip of a few pixels at
// its top is stepped over, and running up and off its top launches you along it.
import { world } from './world.js';
import { W, GROUND } from '../config.js';
export const worldWidth=()=>world.map?.width||W;
export const worldFloor=()=>world.map?.floorY??GROUND;
export function overlap(a,b){return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;}
export function move(b,dt,platforms,{gravity=760,maxFall=330,dropThrough=false,air=false,minX=2,maxX=worldWidth()-2}={}) {
  const wasOn=b.onGround, solids=world.map?.solids||[], slopes=world.map?.slopes||[], onSlope=wasOn&&b.platform?.slope?b.platform:null;
  if(!air)b.vy=Math.min(maxFall,b.vy+gravity*dt);
  const oldX=b.x;
  b.x+=b.vx*dt;
  b.hitWall=0;
  for(const p of solids) if(overlap(b,p)) {
    if(onSlope && p.ground && b.y+b.h-p.y<=8 && b.vy>=0){b.y=p.y-b.h;continue;} // the lip where a slope meets the ground
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
  // slopes: the surface under your middle; standing on one you stick to it (downhill too)
  if(!air && b.vy>=0) for(const p of slopes) {
    const fx=b.x+b.w/2;
    if(fx<p.x || fx>p.x+p.w) continue;
    const sy=p.y0+(fx-p.x)*p.k, up=Math.abs(b.vx*dt*p.k)+1.5, down=wasOn?up+2:0;
    if(prevBottom<=sy+up && b.y+b.h>=sy-down && sy<floor){floor=sy;support=p;}
  }
  if(!air && b.vy>=0 && !dropThrough) for(const p of platforms||[]) {
    if(p.solid||p.gone)continue; // a crumbled ledge (crumble.js)
    if(prevBottom<=p.y+0.5 && b.y+b.h>=p.y && b.x+b.w>p.x+2 && b.x<p.x+p.w-2 && p.y<floor){floor=p.y;support=p;}
  }
  if(b.vy<0 && ceiling>-Infinity){b.y=ceiling;b.vy=0;}
  if(!air && (b.y+b.h>=floor || support?.slope) && b.vy>=0){b.y=floor-b.h;b.vy=0;b.onGround=true;b.platform=support;}
  // ran up a slope and off its top: launched along it (a ramp over a pit throws you across)
  else if(onSlope && !b.onGround && Math.sign(b.vx)===-Math.sign(onSlope.k)) b.vy=Math.min(b.vy,-Math.abs(b.vx*onSlope.k));
  if(b.x<minX){b.x=minX;if(b.vx<0)b.vx=0;b.hitWall=-1;}
  else if(b.x+b.w>maxX){b.x=maxX-b.w;if(b.vx>0)b.vx=0;b.hitWall=1;}
  return b.onGround&&!wasOn;
}
export const dx=(a,b)=>b.x+b.w/2-(a.x+a.w/2);
export const cx=b=>b.x+b.w/2;
export const cy=b=>b.y+b.h/2;
