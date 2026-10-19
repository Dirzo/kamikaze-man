// Camera changes rendering only. All actor positions, collision, drops and projectiles stay world-space.
import { W } from '../config.js';
import { world } from './world.js';
import { cameraTarget } from '../data/maps.js';
export function updateCamera(dt, snap=false) {
  const width=world.map?.width||W, h=world.hero;
  const target=cameraTarget(h?h.x+h.w/2:0,width);
  world.cameraX=snap?target:world.cameraX+(target-world.cameraX)*(1-Math.exp(-9*dt));
  world.cameraX=Math.max(0,Math.min(width-W,world.cameraX));
}
