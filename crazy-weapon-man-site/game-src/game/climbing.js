// Climb the shafts between hunting decks. Jump+direction dismounts onto any intermediate deck.
import { HERO } from '../config.js';
import { world } from './world.js';
import { input } from '../engine/input.js';
export function updateClimb(h,dt) {
  h.climbLock=Math.max(0,(h.climbLock||0)-dt);
  if(h.hurtT>0 || h.dashT>0 || h.special){h.ladder=null;return false;}
  const dir=(input.held('down')?1:0)-(input.held('up')?1:0);
  if(!h.ladder && !h.climbLock && dir) {
    const feet=h.y+h.h;
    h.ladder=world.map?.ladders.find(l=>Math.abs(h.x+h.w/2-l.x)<19 && feet>=l.top && h.y<l.bottom && (dir>0 || feet>l.exitY+4)) || null;
  }
  if(!h.ladder)return false;
  if(input.take('jump')) {
    h.ladder=null;h.climbLock=0.3;h.vy=-HERO.jump;h.vx=input.axis()*HERO.speed;h.jumpHeld=true;h.onGround=false;return false;
  }
  const l=h.ladder;
  h.x=l.x-h.w/2;h.vx=h.vy=0;h.onGround=false;h.coyote=0;
  if(input.axis())h.face=input.axis();
  h.y+=dir*98*dt;
  if(h.y+h.h<=l.top+2) {
    h.x=l.exitX;h.y=l.exitY-h.h;h.onGround=true;h.ladder=null;h.climbLock=0.25;
  } else if(h.y+h.h>=l.bottom) {
    h.y=l.bottom-h.h;h.onGround=true;h.ladder=null;h.climbLock=0.25;
  }
  return true;
}
