// Speech bubbles above enemies (geese, sleepers, mimics, bosses). At most 2 on screen unless forced.
import { C } from '../config.js';
import { world } from './world.js';
import { rect, text, textWidth } from '../engine/gfx.js';

export function say(e, line, life = 2, force = false) {
  if (!e) return false;
  if (!force) {
    let live = 0;
    for (const o of world.enemies) if (o !== e && o.bubble && o.bubble.t > 0) live++;
    if (live >= 2) return false;
  }
  e.bubble = { s: line, t: life };
  return true;
}

export function updateBubble(e, dt) {
  if (e.bubble && (e.bubble.t -= dt) <= 0) e.bubble = null;
}

// drawn after all enemies; stacks bubbles that would overlap
export function drawBubbles() {
  const placed = [];
  for (const e of world.enemies) {
    const b = e.bubble;
    if (!b || (e.dead && e.deathT < 0.05)) continue;
    const tw = textWidth(b.s) + 8,
      h = 13;
    let bx = Math.round(Math.max(3, Math.min(477 - tw, e.x + e.w / 2 - tw / 2)));
    let by = Math.round(Math.max(14, e.y - 20 - h));
    for (let g = 0; g < 3; g++) {
      const o = placed.find(r => bx < r[0] + r[2] && bx + tw > r[0] && by < r[1] + r[3] + 2 && by + h + 2 > r[1]);
      if (!o) break;
      by = o[1] - h - 4;
    }
    placed.push([bx, by, tw, h]);
    const border = e.type === 'goose' ? C.orange : e.boss ? C.gold : C.paper;
    rect(bx - 1, by - 1, tw + 2, h + 2, C.ink);
    rect(bx, by, tw, h, border);
    rect(bx + 1, by + 1, tw - 2, h - 2, C.ink);
    const tx = Math.max(bx + 3, Math.min(bx + tw - 6, Math.round(e.x + e.w / 2) - 2));
    rect(tx, by + h, 4, 2, border);
    rect(tx + 1, by + h + 2, 2, 2, border);
    text(b.s, bx + tw / 2, by + 3, e.type === 'goose' ? C.cream : C.paper, { align: 'center', outline: false });
  }
}
