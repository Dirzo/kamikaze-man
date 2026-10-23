// Climb the ladders that hang from platforms. Jump+direction dismounts partway.
// Grabbing a ladder sheathes the weapon on your back (anim.js draws it); letting go draws it again.
import { HERO } from '../config.js';
import { world } from './world.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { DRAW_TIME } from './anim.js';
export function updateClimb(h,dt) {
  h.climbLock=Math.max(0,(h.climbLock||0)-dt);
  h.drawT=Math.max(0,(h.drawT||0)-dt);
  const was=h.ladder;
  const on=climb(h,dt);
  if(on && !was){h.climbT=0;sfx.ui();} // shk: sheathed
  if(was && !h.ladder)h.drawT=h.drawMax=DRAW_TIME; // shing: drawn again
  return on;
}
function climb(h,dt) {
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
  if(dir)h.climbT=(h.climbT||0)+dt;
  // the ladder ends level with its platform: climbing up stops you standing right there
  if(dir<0 && h.y+h.h<=l.top) {
    h.x=l.exitX;h.y=l.exitY-h.h;h.onGround=true;h.ladder=null;h.climbLock=0.25;
  } else if(h.y+h.h>=l.bottom) {
    h.y=l.bottom-h.h;h.onGround=true;h.ladder=null;h.climbLock=0.25;
  }
  return true;
}
