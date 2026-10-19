// Bodies are axis-aligned boxes {x, y, w, h, vx, vy}. The ground is solid; platforms are one-way
// (you land on them from above and can drop through with down + jump).
import { world } from './world.js';
import { W, GROUND } from '../config.js';

export const worldWidth = () => world.map?.width || W;

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// integrate one step; returns true if the body landed this step
export function move(b, dt, platforms, { gravity = 760, maxFall = 330, dropThrough = false, air = false, minX = 2, maxX = worldWidth() - 2 } = {}) {
  const wasOn = b.onGround;
  if (!air) b.vy = Math.min(maxFall, b.vy + gravity * dt);
  b.x += b.vx * dt;
  const prevBottom = b.y + b.h;
  b.y += b.vy * dt;
  b.onGround = false;
  b.platform = null;
  if (!air) {
    if (b.y + b.h >= GROUND) {
      b.y = GROUND - b.h;
      b.vy = Math.min(0, b.vy);
      b.onGround = true;
    } else if (b.vy >= 0 && !dropThrough && platforms) {
      for (const p of platforms) {
        const top = p.y;
        if (prevBottom <= top + 0.5 && b.y + b.h >= top && b.x + b.w > p.x + 2 && b.x < p.x + p.w - 2) {
          b.y = top - b.h;
          b.vy = 0;
          b.onGround = true;
          b.platform = p;
          break;
        }
      }
    }
  }
  // screen edges
  if (b.x < minX) {
    b.x = minX;
    if (b.vx < 0) b.vx = 0;
    b.hitWall = -1;
  } else if (b.x + b.w > maxX) {
    b.x = maxX - b.w;
    if (b.vx > 0) b.vx = 0;
    b.hitWall = 1;
  } else b.hitWall = 0;
  return b.onGround && !wasOn;
}

// distance between box centres along x
export const dx = (a, b) => b.x + b.w / 2 - (a.x + a.w / 2);
export const cx = b => b.x + b.w / 2;
export const cy = b => b.y + b.h / 2;
