// Camera changes rendering only. All actor positions, collision, drops and projectiles stay world-space.
// SMW style: the view slides ahead of the way you face (further while sprinting), and only follows
// you up or down once you land on a new floor (or climb/fall well out of the band), so a jump
// doesn't bob the whole screen.
import { W } from '../config.js';
import { world } from './world.js';
import { cameraTarget, cameraTargetY } from '../data/maps.js';
import { MOVE } from '../data/feel.js';

export function updateCamera(dt, snap=false) {
  if(world.lock) {world.cameraX=world.lock.x0;world.cameraY=world.lock.y0;return;} // survival arena
  const width=world.map?.width||W, h=world.hero;
  // look-ahead: eases over to the side you face; cameraTarget keeps the hero 42% from the left,
  // so the lead is measured from the screen's middle
  const want=h?h.face*W*(h.sprint?MOVE.lookAheadSprint:MOVE.lookAhead):0;
  world.camLead=snap||world.camLead==null?want:world.camLead+(want-world.camLead)*(1-Math.exp(-3*dt));
  const lead=world.camLead-W*0.08;
  const target=cameraTarget(h?h.x+h.w/2+lead:0,width);
  world.cameraX=snap?target:world.cameraX+(target-world.cameraX)*(1-Math.exp(-9*dt));
  if(world.scroll && !world.hidden?.inRoom) world.cameraX=world.scroll.x; // an auto-scroller: the screen sets the pace (gimmicks.js)
  // vertical: the floor you last stood on, unless you go far above it or drop below it
  const feet=h?h.y+h.h:0;
  if(snap||world.camFeet==null||!h||h.onGround||h.ladder||h.dead||feet>world.camFeet+6||feet<world.camFeet-72) world.camFeet=feet;
  const y=cameraTargetY(world.camFeet,world.map?.floorY||206);
  world.cameraY=snap?y:world.cameraY+(y-world.cameraY)*(1-Math.exp(-8*dt));
  world.cameraX=Math.max(0,Math.min(width-W,world.cameraX));
}
