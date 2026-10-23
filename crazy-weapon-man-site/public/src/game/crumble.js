// Break-away terrain, placed by data/maps.js: bridge planks over narrow pits and crumbling stepping
// stones on the high roads. Step on one and it shakes, then drops away, and it grows back a few
// seconds later. A plank goes almost at once, so at a run a bridge falls in behind you and if you
// stop on it you're in the pit; a stepping stone gives you a beat to hop off.
import { C } from '../config.js';
import { rect } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { burst } from './fx.js';

export const CRUMBLE = { plank: 0.3, stone: 0.4, back: 3.5, drop: 0.5 }; // seconds: shake, gone, falling bits
const lists = new WeakMap(); // map -> its crumbling platforms
const crumbles = m => {
  if (!lists.has(m)) lists.set(m, m.platforms.filter(p => p.crumble));
  return lists.get(m);
};

// once a step, before the hero moves
export function updateCrumble(h, dt) {
  const m = world.map;
  if (!m) return;
  const list = crumbles(m);
  if (!list.length) return;
  const feet = h.y + h.h;
  for (const p of list) {
    if (p.gone) {
      p.downT += dt;
      // grows back once its time is up and nobody is standing in its place
      if ((p.backT -= dt) <= 0 && !(h.x + h.w > p.x && h.x < p.x + p.w && feet > p.y - 2 && h.y < p.y + 8)) {
        p.gone = false;
        p.shakeT = 0;
        burst(p.x + p.w / 2, p.y + 2, 3, 'twinkle', ['paper', 'mist']);
      }
      continue;
    }
    if (!p.shakeT && h.onGround && !h.dead && Math.abs(feet - p.y) < 1 && h.x + h.w > p.x + 2 && h.x < p.x + p.w - 2) {
      p.shakeT = p.plank ? CRUMBLE.plank : CRUMBLE.stone;
      if (!p.plank) sfx.land();
    }
    if (p.shakeT > 0 && (p.shakeT -= dt) <= 0) {
      p.gone = true;
      p.backT = CRUMBLE.back;
      p.downT = 0;
      if (!p.plank || Math.random() < 0.3) sfx.thud();
      burst(p.x + p.w / 2, p.y + 3, p.plank ? 2 : 6, 'dust', ['mist', 'fog']);
    }
  }
}

// planks and stones in the zone's own colours: bridges are wood (rope and plank), stepping stones
// are cracked rock; a shaking one jitters, a broken one falls away in two halves
const STONE = [C.stone, C.fog, C.slate], WOOD = [C.wood, C.sand, C.woodD];
export function drawCrumble(t) {
  const m = world.map;
  if (!m) return;
  const x0 = world.cameraX - 40, x1 = world.cameraX + 520;
  for (const p of crumbles(m)) {
    if (p.x + p.w < x0 || p.x > x1) continue;
    const [face, lit, dark] = p.plank ? WOOD : STONE;
    if (p.gone) {
      // the halves tumble out of sight, then the gap waits empty
      if (p.downT > CRUMBLE.drop) continue;
      const d = Math.round(p.downT * p.downT * 380), half = p.w / 2;
      rect(p.x - 1, p.y + d, half, 4, face);
      rect(p.x + half + 1, p.y + d + 2, half, 4, dark);
      continue;
    }
    const j = p.shakeT > 0 ? (Math.floor(t * 40) % 2 ? 1 : -1) : 0, x = p.x + j;
    if (p.plank) {
      rect(x, p.y, p.w - 1, 4, C.ink);
      rect(x, p.y, p.w - 1, 1, lit);
      rect(x, p.y + 1, p.w - 1, 2, face);
      rect(x + 3, p.y + 3, 1, 1, dark); // the nail
      rect(p.x, p.y - 4, p.w, 1, C.sand); // the hand rope along the top
    } else {
      rect(x, p.y, p.w, 7, C.ink);
      rect(x + 1, p.y, p.w - 2, 1, lit);
      rect(x + 1, p.y + 1, p.w - 2, 5, face);
      // the cracks that tell you it won't hold
      rect(x + 8, p.y + 1, 1, 3, dark);
      rect(x + 9, p.y + 3, 1, 2, dark);
      rect(x + p.w - 11, p.y + 2, 1, 3, dark);
      rect(x + p.w - 12, p.y + 4, 1, 2, dark);
      if (p.shakeT > 0) rect(x + 2, p.y + 6, p.w - 4, 1, dark);
    }
  }
}
