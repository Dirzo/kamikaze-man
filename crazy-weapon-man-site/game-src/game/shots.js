// Hero projectiles: arrows, shuriken (spinning, pierce), wand bolts (homing).
import { C, W, GROUND } from '../config.js';
import { X, rect, px } from '../engine/gfx.js';
import { world } from './world.js';
import { overlap, cx, cy, worldWidth, worldFloor } from './physics.js';
import { hitEnemy } from './combat.js';
import { lookOf, runEmitters } from './looks.js';
import { impactMutation } from './evolution.js';
import { quirkHit } from './quirks.js';
import { abilityHit } from './abilities.js';
import { emit } from './fx.js';

export function updateShots(dt) {
  for (let i = world.shots.length - 1; i >= 0; i--) {
    const s = world.shots[i];
    s.life -= dt;
    if (s.homing) {
      let best = null,
        bd = 1e9;
      for (const e of world.enemies) {
        if (e.dead || s.hit.has(e)) continue;
        const d = Math.hypot(cx(e) - s.x, cy(e) - s.y);
        if (d < bd && d < 140 && Math.sign(cx(e) - s.x) === Math.sign(s.vx)) {
          bd = d;
          best = e;
        }
      }
      if (best) {
        const sp = Math.hypot(s.vx, s.vy),
          want = Math.atan2(cy(best) - s.y, cx(best) - s.x),
          cur = Math.atan2(s.vy, s.vx);
        let da = want - cur;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        const a = cur + Math.max(-s.homing * dt, Math.min(s.homing * dt, da));
        s.vx = Math.cos(a) * sp;
        s.vy = Math.sin(a) * sp;
      }
    }
    if (s.g) s.vy += s.g * dt;
    if (s.boomerang && !s.back && (s.t += dt) > 0.38) {
      // bent weapons come back: turn around once and fly home, hitting everything again
      s.back = true;
      s.hit.clear();
    }
    if (s.back) {
      const h = world.hero,
        dx = cx(h) - s.x,
        dy = cy(h) - s.y,
        d = Math.max(1, Math.hypot(dx, dy));
      s.vx = (dx / d) * 260;
      s.vy = (dy / d) * 260;
      if (d < 10) s.life = 0;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (world.map?.solids.some(p=>overlap(s,p))) {world.shots.splice(i,1);continue;}
    s.spin += dt * 20;
    runEmitters(s.emitters, () => ({ x: s.x + 3, y: s.y + 2 }), 1.2);
    if (s.type === 'wand' && Math.random() < 0.6) emit(s.x + 2, s.y + 2, 'dot', s.light);
    for (const e of world.enemies) {
      if (e.dead || e.spawnT > 0 || s.hit.has(e) || !overlap(s, e)) continue;
      s.hit.add(e);
      hitEnemy(e, s.dmg, { crit: s.crit, dir: Math.sign(s.vx) || 1, knock: s.knock, element: s.element, sparkCol: s.light });
      if (!s.proc) {
        impactMutation(world.hero, e, s);
        quirkHit(world.hero, e, s.dmg, Math.sign(s.vx) || 1);
        abilityHit(world.hero, e, s.dmg, s.move?.big);
      }
      if (s.pierce-- <= 0) {
        s.life = 0;
        break;
      }
    }
    if (s.life <= 0 || s.x < -12 || s.x > worldWidth() + 12 || s.y > worldFloor() || s.y < -30) world.shots.splice(i, 1);
  }
}

export function drawShots(t) {
  for (const s of world.shots) {
    const x = Math.round(s.x),
      y = Math.round(s.y),
      dir = Math.sign(s.vx) || 1;
    if (s.type === 'bow') {
      const ang = Math.atan2(s.vy, s.vx);
      X.save();
      X.translate(x + 3, y + 2);
      X.rotate(ang);
      rect(-6, -1, 11, 3, C.ink);
      rect(-5, 0, 8, 1, C.wood);
      rect(2, -1, 3, 3, s.col);
      px(4, 0, s.light);
      rect(-6, -1, 2, 1, C.paper);
      rect(-6, 1, 2, 1, C.paper);
      X.restore();
    } else if (s.type === 'shuriken' || s.type === 'boomerang' || s.sprite) {
      const L = lookOf(s.weapon);
      X.save();
      X.translate(x + 3, y + 2);
      X.rotate(Math.floor(s.spin) * (Math.PI / 4) * dir);
      X.drawImage(L.cv, -L.w / 2, -L.h / 2);
      X.restore();
    } else {
      rect(x - 1, y - 1, 6, 6, C.ink);
      rect(x, y, 4, 4, s.col);
      rect(x + 1, y + 1, 2, 2, s.light);
    }
  }
}
