// Hero animation: the body sprite has no arms; both arms are drawn from the shoulders to hand
// positions that come from per-weapon-style poses, and the weapon is held in the front hand (two-
// handed styles put the back hand on the handle). Every style has its own idle, run, jump, attack
// and special poses. Weapons are rotated with a RotSprite-style sampler (cached at 32 angles) so
// they stay crisp, and fast swings leave a pixel smear.
//
// Pose coordinates are on the pose grid with the hero facing right: 17 wide, shoulders at y = 16,
// feet at y = 24. toSprite() stretches that grid onto the 22x30 arcade hero (art-src/arcade_hero.py),
// whose body is longer below the shoulders, so every pose keeps its meaning at the new size.
//   f      body frame (see art-src/arcade_hero.py)
//   fh     front hand [x, y]       bh  back hand [x, y] (omit on two-handed styles: auto on handle)
//   ang    weapon angle in degrees (0 = pointing forward, negative = up, positive = down)
//   wb     weapon drawn behind the body        hide  weapon not drawn (thrown)
//   ab     front arm drawn behind the body (hand reaching back behind the head)
//   dy     body lift in grid px (negative = up: hops in full-body swings)
//   flip   body turned the other way for a moment (spinning swings)
// Two-handed styles set slide (how far up the weapon from its grip the front hand sits, in sprite
// px) and grip2 (where the back hand sits along the weapon from the front hand: negative = toward
// the pommel, positive = toward the head).
import { C } from '../config.js';
import { A } from '../engine/assets.js';
import { X, frame, rect } from '../engine/gfx.js';
import { lookOf, frameOfLook, overlays, runEmitters, motion } from './looks.js';
import { world } from './world.js';
import { view } from '../engine/gfx.js';
import { STYLE_OF } from '../data/weapons.js';
import { heroStats } from './perks.js';

const lerp = (a, b, t) => a + (b - a) * t;
const ease = {
  lin: t => t,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  io: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
};

// keys: [[p, pose, easing-into-this-key], ...] sorted by p (0..1)
function keys(list, p) {
  if (p <= list[0][0]) return { ...list[0][1] };
  for (let i = 1; i < list.length; i++) {
    const [p1, b, e = 'out'] = list[i];
    const [p0, a] = list[i - 1];
    if (p <= p1) {
      const t = ease[e]((p - p0) / Math.max(1e-6, p1 - p0));
      return mix(a, b, t);
    }
  }
  return { ...list[list.length - 1][1] };
}
function mix(a, b, t) {
  const o = { ...a, ...(t >= 0.5 ? b : {}) };
  for (const k of ['ang', 'dy']) if (a[k] != null || b[k] != null) o[k] = lerp(a[k] || 0, b[k] || 0, t);
  if (a.slide != null && b.slide != null) o.slide = lerp(a.slide, b.slide, t);
  else o.slide = t < 0.5 ? a.slide : b.slide;
  if (a.ang == null || b.ang == null) o.ang = t < 0.5 ? a.ang : b.ang;
  for (const k of ['fh', 'bh']) if (a[k] && b[k]) o[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)];
  for (const k of ['f', 'wb', 'hide', 'nock', 'ab', 'flip', 'one']) o[k] = t < 0.5 ? a[k] : b[k];
  return o;
}

// ---------------------------------------------------------------- styles
// common locomotion helpers
const sin = Math.sin;
const STYLES = {
  // one-handed blade, back hand free
  sword: {
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 20 + b], bh: [4, 21 + b], ang: 45 + sin(t * 2) * 5 }),
    run: s => ({ fh: [14 + s * 2, 20], bh: [4 - s * 2, 20], ang: 60 + s * 12 }),
    air: up => (up ? { f: 'jump', fh: [16, 15], bh: [3, 14], ang: -45 } : { f: 'fall', fh: [16, 17], bh: [2, 14], ang: 15 }),
    dash: { f: 'lean', fh: [8, 19], bh: [15, 18], ang: 165, wb: true, ab: true },
    moves: {
      slashDown: [[0, { f: 'back', fh: [7, 12], bh: [5, 18], ang: -150, wb: true, ab: true }], [0.25, { f: 'back', fh: [6, 11], bh: [5, 18], ang: -160, wb: true, ab: true }, 'out'], [0.45, { f: 'lean', fh: [17, 17], bh: [3, 19], ang: 35 }, 'out'], [0.65, { f: 'lean', fh: [16, 21], bh: [3, 20], ang: 80 }], [1, { f: 'idle', fh: [14, 20], bh: [4, 21], ang: 50 }, 'io']],
      slashUp: [[0, { f: 'idle', fh: [14, 21], bh: [5, 19], ang: 120, wb: true }], [0.25, { f: 'idle', fh: [13, 22], bh: [5, 19], ang: 135, wb: true }], [0.5, { f: 'lean', fh: [18, 5], bh: [3, 18], ang: -95 }, 'out'], [0.7, { f: 'lean', fh: [17, 3], bh: [3, 18], ang: -112 }], [1, { f: 'idle', fh: [14, 20], bh: [4, 21], ang: 50 }, 'io']],
      slashBig: [[0, { f: 'back', fh: [6, 13], bh: [4, 15], ang: -175, wb: true, ab: true }], [0.35, { f: 'back', fh: [5, 12], bh: [4, 14], ang: -185, wb: true, ab: true, dy: -2 }, 'io'], [0.55, { f: 'lean', fh: [18, 19], bh: [14, 19], ang: 45, dy: 0 }, 'out'], [0.75, { f: 'wide', fh: [17, 22], bh: [12, 21], ang: 90 }], [1, { f: 'idle', fh: [14, 20], bh: [4, 21], ang: 50 }, 'io']]
    }
  },
  // reverse-grip knife fighter: low guard, fast jabs, fist up
  dagger: {
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 19 + b], bh: [6, 16 + b], ang: 105 + sin(t * 3) * 4 }),
    run: s => ({ fh: [14 + s * 2, 19], bh: [6 - s * 2, 17], ang: 110 }),
    air: up => (up ? { f: 'jump', fh: [15, 14], bh: [4, 13], ang: 100 } : { f: 'fall', fh: [15, 17], bh: [3, 15], ang: 110 }),
    dash: { f: 'lean', fh: [16, 18], bh: [7, 16], ang: 175 },
    moves: {
      stab: [[0, { f: 'idle', fh: [12, 17], bh: [7, 16], ang: 10 }], [0.3, { f: 'lean', fh: [19, 16], bh: [8, 16], ang: 0 }, 'out'], [0.55, { f: 'lean', fh: [18, 16], bh: [8, 16], ang: 0 }], [1, { f: 'idle', fh: [14, 19], bh: [6, 16], ang: 105 }, 'io']],
      stabBig: [[0, { f: 'back', fh: [10, 15], bh: [6, 15], ang: -20 }], [0.25, { f: 'back', fh: [9, 15], bh: [6, 15], ang: -25 }], [0.45, { f: 'lean', fh: [21, 15], bh: [11, 17], ang: -5 }, 'out'], [0.7, { f: 'lean', fh: [20, 16], bh: [10, 17], ang: 0 }], [1, { f: 'idle', fh: [14, 19], bh: [6, 16], ang: 105 }, 'io']]
    }
  },
  // two-handed, blade raised forward (chudan), trails low behind when running
  katana: {
    grip2: -4,
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [15, 18 + b], ang: -40 + sin(t * 1.5) * 3 }),
    run: s => ({ fh: [14, 19 + Math.abs(s)], ang: -35 + s * 5 }),
    air: up => (up ? { f: 'jump', fh: [14, 14], ang: -70 } : { f: 'fall', fh: [15, 17], ang: -30 }),
    dash: { f: 'lean', fh: [11, 20], ang: 170, wb: true },
    moves: {
      slashDown: [[0, { f: 'idle', fh: [17, 4], ang: -100 }], [0.28, { f: 'jump', fh: [16, 2], ang: -120, dy: -1 }, 'io'], [0.48, { f: 'lean', fh: [17, 18], ang: 25 }, 'out'], [0.7, { f: 'lean', fh: [16, 21], ang: 55 }], [1, { f: 'idle', fh: [15, 18], ang: -40 }, 'io']],
      stab: [[0, { f: 'idle', fh: [12, 17], ang: 0 }], [0.3, { f: 'idle', fh: [11, 17], ang: 0 }], [0.5, { f: 'lean', fh: [19, 16], ang: 0 }, 'out'], [0.7, { f: 'lean', fh: [18, 16], ang: 0 }], [1, { f: 'idle', fh: [15, 18], ang: -40 }, 'io']],
      slashBig: [[0, { f: 'back', fh: [6, 16], ang: -175, wb: true, ab: true }], [0.35, { f: 'back', fh: [5, 16], ang: -185, wb: true, ab: true }, 'io'], [0.55, { f: 'lean', fh: [18, 16], ang: 0 }, 'out'], [0.75, { f: 'lean', fh: [18, 19], ang: 35 }], [1, { f: 'idle', fh: [15, 18], ang: -40 }, 'io']]
    }
  },
  // two-handed heavy, full-body windmill: at rest the big head sits on the ground in front of him,
  // and he carries it slanted up in front on the run. The swing dips back behind him,
  // comes up and over the head with the whole body stretching, and slams down into a crouch. The
  // finisher is a hopping double windmill.
  hammer: {
    slide: 6,
    grip2: -6,
    idle: (t, b) => ({ f: b ? 'idle2' : 'wide', fh: [15, 18 + b], ang: 64 + sin(t * 1.2) * 2 }),
    run: s => ({ fh: [13, 19 + Math.abs(s)], ang: -62 + s * 4 }),
    air: up => (up ? { f: 'jump', fh: [15, 8], ang: -95 } : { f: 'fall', fh: [14, 15], ang: -40 }),
    dash: { f: 'lean', fh: [11, 19], ang: 160, wb: true },
    moves: {
      smash: [[0, { f: 'wide', fh: [15, 18], ang: -296 }], [0.28, { f: 'back', fh: [6, 20], ang: -205, wb: true, ab: true }, 'io'], [0.44, { f: 'jump', fh: [15, 2], ang: -95, dy: -2 }, 'in'], [0.55, { f: 'crouch', fh: [18, 22], ang: 72, dy: 0 }, 'in'], [0.8, { f: 'crouch', fh: [18, 22], ang: 76 }], [1, { f: 'wide', fh: [15, 18], ang: 64 }, 'io']],
      smashBig: [[0, { f: 'wide', fh: [15, 18], ang: -296 }], [0.2, { f: 'back', fh: [6, 20], ang: -205, wb: true, ab: true }, 'io'], [0.32, { f: 'jump', fh: [15, 2], ang: -95, dy: -4 }, 'in'], [0.4, { f: 'jump', fh: [18, 15], ang: 0, dy: -7 }, 'lin'], [0.47, { f: 'fall', fh: [10, 22], ang: 90, dy: -7, wb: true }, 'lin'], [0.54, { f: 'fall', fh: [6, 12], ang: 180, dy: -5, wb: true, ab: true }, 'lin'], [0.6, { f: 'jump', fh: [15, 2], ang: 265, dy: -3 }, 'lin'], [0.66, { f: 'crouch', fh: [19, 22], ang: 435, dy: 0 }, 'in'], [0.85, { f: 'crouch', fh: [19, 22], ang: 438 }], [1, { f: 'wide', fh: [15, 18], ang: 424 }, 'io']]
    }
  },
  // chain weapon: twirls at the side, spins around the shoulder
  nunchucks: {
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 18 + b], bh: [5, 19 + b], ang: 60 + sin(t * 5) * 25 }),
    run: s => ({ fh: [14 + s * 2, 18], bh: [5 - s * 2, 19], ang: 95 + s * 20 }),
    air: up => (up ? { f: 'jump', fh: [14, 13], bh: [3, 13], ang: -60 } : { f: 'fall', fh: [15, 16], bh: [2, 14], ang: 60 }),
    dash: { f: 'lean', fh: [10, 18], bh: [15, 16], ang: 170, wb: true },
    spin: true
  },
  // quarterstaff: both hands spread around the middle of the shaft. Thrusts drive it with both
  // hands, the rising sweep lifts it overhead, and the finisher twirls it twice like a propeller in
  // front of the chest before driving it out.
  staff: {
    slide: 8,
    grip2: 9,
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [13, 19 + b], ang: -78 + sin(t * 1.3) * 3 }),
    run: s => ({ fh: [12, 18 + Math.abs(s)], ang: -14 + s * 6 }),
    air: up => (up ? { f: 'jump', fh: [13, 12], ang: -58 } : { f: 'fall', fh: [13, 16], ang: -25 }),
    dash: { f: 'lean', fh: [14, 18], ang: 6 },
    moves: {
      stab: [[0, { f: 'idle', fh: [12, 18], ang: -8 }], [0.22, { f: 'back', fh: [7, 18], ang: -2 }, 'out'], [0.4, { f: 'lean', fh: [18, 17], ang: 0 }, 'out'], [0.62, { f: 'lean', fh: [18, 17], ang: 0 }], [1, { f: 'idle', fh: [13, 19], ang: -78 }, 'io']],
      slashUp: [[0, { f: 'idle', fh: [12, 20], ang: 30 }], [0.24, { f: 'crouch', fh: [12, 20], ang: 36 }, 'out'], [0.45, { f: 'lean', fh: [17, 11], ang: -50, dy: -1 }, 'out'], [0.62, { f: 'lean', fh: [17, 10], ang: -58, dy: -1 }], [1, { f: 'idle', fh: [13, 19], ang: -78 }, 'io']],
      stabBig: [[0, { f: 'idle', fh: [13, 17], ang: -78 }], [0.08, { f: 'wide', fh: [17, 15], bh: [7, 19], ang: -40, slide: 17, one: true }], [0.52, { f: 'wide', fh: [17, 15], bh: [7, 19], ang: 680, slide: 17, one: true }, 'lin'], [0.6, { f: 'lean', fh: [19, 17], ang: 720 }, 'out'], [0.78, { f: 'lean', fh: [19, 17], ang: 720 }], [1, { f: 'idle', fh: [13, 19], ang: 642 }, 'io']]
    }
  },
  // spear: rear hand near the butt, front hand a third of the way up. Long two-handed thrusts; the
  // finisher is a quick double jab and a deep lunge.
  spear: {
    slide: 12,
    grip2: -9,
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [13, 19 + b], ang: -32 + sin(t * 1.4) * 3 }),
    run: s => ({ fh: [13, 19], ang: -10 + s * 4 }),
    air: up => (up ? { f: 'jump', fh: [14, 14], ang: -45 } : { f: 'fall', fh: [14, 17], ang: 15 }),
    dash: { f: 'lean', fh: [16, 18], ang: 0 },
    moves: {
      stab: [[0, { f: 'idle', fh: [12, 19], ang: -6 }], [0.22, { f: 'back', fh: [7, 18], ang: 0 }, 'out'], [0.38, { f: 'lean', fh: [19, 17], ang: -2 }, 'out'], [0.62, { f: 'lean', fh: [19, 17], ang: 0 }], [1, { f: 'idle', fh: [13, 19], ang: -32 }, 'io']],
      stabBig: [[0, { f: 'idle', fh: [12, 19], ang: -6 }], [0.1, { f: 'back', fh: [8, 18], ang: 0 }], [0.18, { f: 'lean', fh: [17, 17], ang: -8 }, 'out'], [0.25, { f: 'back', fh: [9, 18], ang: 0 }], [0.32, { f: 'lean', fh: [17, 16], ang: 6 }, 'out'], [0.4, { f: 'back', fh: [6, 18], ang: 0 }, 'io'], [0.52, { f: 'wide', fh: [21, 17], ang: 0 }, 'out'], [0.75, { f: 'wide', fh: [21, 17], ang: 0 }], [1, { f: 'idle', fh: [13, 19], ang: -32 }, 'io']]
    }
  },
  // axe: two-handed chopper. Overhead chop, a rising cleave up from behind the hip, and a spinning
  // cleave where the whole body turns before the bit comes round.
  axe: {
    slide: 7,
    grip2: -6,
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 19 + b], ang: 42 + sin(t * 1.6) * 4 }),
    run: s => ({ fh: [13 + s, 19], ang: 58 + s * 8 }),
    air: up => (up ? { f: 'jump', fh: [14, 12], ang: -70 } : { f: 'fall', fh: [15, 16], ang: 10 }),
    dash: { f: 'lean', fh: [11, 19], ang: 160, wb: true },
    moves: {
      slashDown: [[0, { f: 'idle', fh: [14, 19], ang: 42 }], [0.32, { f: 'jump', fh: [15, 2], ang: -150, wb: true, dy: -1 }, 'io'], [0.52, { f: 'lean', fh: [18, 18], ang: 45 }, 'in'], [0.75, { f: 'lean', fh: [18, 20], ang: 62 }], [1, { f: 'idle', fh: [14, 19], ang: 42 }, 'io']],
      slashUp: [[0, { f: 'idle', fh: [14, 19], ang: 42 }], [0.3, { f: 'back', fh: [6, 21], ang: 155, wb: true, ab: true }, 'io'], [0.52, { f: 'lean', fh: [18, 7], ang: -62, dy: -1 }, 'in'], [0.75, { f: 'lean', fh: [17, 5], ang: -76, dy: -1 }], [1, { f: 'idle', fh: [14, 19], ang: 42 }, 'io']],
      slashBig: [[0, { f: 'idle', fh: [14, 19], ang: 42 }], [0.22, { f: 'back', fh: [5, 17], ang: 178, wb: true, ab: true }, 'io'], [0.38, { f: 'wide', fh: [9, 16], ang: 182, flip: true, wb: true, dy: -2 }], [0.54, { f: 'wide', fh: [19, 17], ang: 8, dy: 0 }, 'out'], [0.75, { f: 'wide', fh: [18, 19], ang: 40 }], [1, { f: 'idle', fh: [14, 19], ang: 42 }, 'io']]
    }
  },
  // scythe: held upright like a reaper at rest. A huge overhead reap, a hook-and-pull, and a full
  // reaping spin for the finisher.
  scythe: {
    slide: 5,
    grip2: -4,
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [13, 19 + b], ang: -72 + sin(t * 1.1) * 3 }),
    run: s => ({ fh: [12, 19], ang: -42 + s * 5 }),
    air: up => (up ? { f: 'jump', fh: [14, 13], ang: -100 } : { f: 'fall', fh: [14, 16], ang: -50 }),
    dash: { f: 'lean', fh: [11, 19], ang: 170, wb: true },
    moves: {
      slashDown: [[0, { f: 'idle', fh: [13, 19], ang: -72 }], [0.3, { f: 'jump', fh: [14, 3], ang: -165, wb: true }, 'io'], [0.5, { f: 'lean', fh: [18, 19], ang: 38 }, 'in'], [0.72, { f: 'lean', fh: [17, 21], ang: 58 }], [1, { f: 'idle', fh: [13, 19], ang: -72 }, 'io']],
      stab: [[0, { f: 'idle', fh: [13, 19], ang: -72 }], [0.3, { f: 'lean', fh: [19, 14], ang: -18 }, 'out'], [0.48, { f: 'lean', fh: [19, 15], ang: -10 }], [0.64, { f: 'back', fh: [11, 19], ang: 22 }, 'in'], [1, { f: 'idle', fh: [13, 19], ang: -72 }, 'io']],
      slashBig: [[0, { f: 'idle', fh: [13, 19], ang: -72 }], [0.24, { f: 'back', fh: [5, 12], ang: -172, wb: true, ab: true }, 'io'], [0.4, { f: 'wide', fh: [9, 16], ang: -188, flip: true, wb: true, dy: -1 }], [0.55, { f: 'wide', fh: [18, 18], ang: 30, dy: 0 }, 'out'], [0.76, { f: 'wide', fh: [17, 20], ang: 66 }], [1, { f: 'idle', fh: [13, 19], ang: -72 }, 'io']]
    }
  },
  // bow: lowered at rest; raise, draw the string back with the back hand, release
  bow: {
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 19 + b], bh: [5, 20 + b], ang: 35 }),
    run: s => ({ fh: [14 + s * 2, 19], bh: [5 - s * 2, 19], ang: 50 }),
    air: up => (up ? { f: 'jump', fh: [15, 14], bh: [3, 14], ang: 0 } : { f: 'fall', fh: [15, 16], bh: [3, 15], ang: 20 }),
    dash: { f: 'lean', fh: [10, 19], bh: [14, 17], ang: 90, wb: true },
    ranged: [[0, { f: 'idle', fh: [17, 15], bh: [14, 15], ang: 0, nock: true }], [0.42, { f: 'wide', fh: [18, 15], bh: [8, 15], ang: 0, nock: true }, 'out'], [0.46, { f: 'wide', fh: [18, 15], bh: [11, 14], ang: 0 }, 'lin'], [0.7, { f: 'wide', fh: [17, 15], bh: [10, 15], ang: 0 }], [1, { f: 'idle', fh: [14, 19], bh: [5, 20], ang: 35 }, 'io']],
    fireAt: 0.44,
    string: true
  },
  // thrown stars: wind up behind the head, snap the arm forward, the star leaves the hand
  shuriken: {
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 19 + b], bh: [5, 20 + b], ang: Math.floor(t * 4) * 45 }),
    run: s => ({ fh: [14 + s * 2, 19], bh: [5 - s * 2, 19], ang: 0 }),
    air: up => (up ? { f: 'jump', fh: [14, 13], bh: [3, 14], ang: 0 } : { f: 'fall', fh: [15, 16], bh: [2, 15], ang: 0 }),
    dash: { f: 'lean', fh: [10, 18], bh: [15, 16], ang: 0, wb: true },
    ranged: [[0, { f: 'idle', fh: [13, 17], bh: [6, 18], ang: 0 }], [0.3, { f: 'back', fh: [5, 11], bh: [10, 18], ang: -45, wb: true, ab: true }, 'io'], [0.45, { f: 'lean', fh: [19, 14], bh: [6, 19], ang: 0, hide: true }, 'out'], [0.8, { f: 'idle', fh: [16, 17], bh: [5, 19], ang: 0, hide: true }], [1, { f: 'idle', fh: [14, 19], bh: [5, 20], ang: 0 }, 'io']],
    fireAt: 0.42
  },
  // wand: a flick up, then point and cast
  wand: {
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 19 + b], bh: [5, 20 + b], ang: 30 + sin(t * 2.4) * 8 }),
    run: s => ({ fh: [14 + s * 2, 19], bh: [5 - s * 2, 19], ang: 40 }),
    air: up => (up ? { f: 'jump', fh: [14, 12], bh: [3, 14], ang: -80 } : { f: 'fall', fh: [15, 16], bh: [2, 15], ang: 20 }),
    dash: { f: 'lean', fh: [10, 18], bh: [15, 16], ang: 160, wb: true },
    ranged: [[0, { f: 'idle', fh: [14, 17], bh: [5, 19], ang: 20 }], [0.3, { f: 'idle', fh: [17, 3], bh: [5, 19], ang: -80 }, 'io'], [0.45, { f: 'lean', fh: [19, 15], bh: [5, 19], ang: 0 }, 'out'], [0.7, { f: 'lean', fh: [18, 15], bh: [5, 19], ang: 0 }], [1, { f: 'idle', fh: [14, 19], bh: [5, 20], ang: 30 }, 'io']],
    fireAt: 0.42
  }
};
const styleOf = type => STYLES[type] || STYLES[STYLE_OF[type]] || STYLES.sword;
export const fireAt = type => styleOf(type).fireAt || 0;

// nunchuck spin move: hand circles the shoulder, weapon whirls
function spinPose(p, turns, big) {
  const th = -Math.PI / 2 + p * Math.PI * 2 * turns;
  return { f: big ? 'wide' : p < 0.5 ? 'lean' : 'idle', fh: [15 + Math.cos(th) * 4, 16 + Math.sin(th) * 4], bh: [5, 19], ang: -180 + p * 360 * (turns + 1), wb: Math.cos(th) < -0.2 || Math.sin(th) < -0.6, ab: Math.cos(th) < -0.2 }; // over the head the chain passes behind it
}

// ---------------------------------------------------------------- which pose now
export function heroPose(h, t) {
  const st = styleOf(h.weapon.type);
  const b = Math.floor(t * 1.6) % 2;
  let pose;
  if (h.dead || h.hurtT > 0) pose = { ...st.idle(t, 0), f: 'hurt', fh: [17, 15], bh: [0, 14], ang: st.idle(t, 0).ang - 40 };
  else if (h.special) pose = specialPose(h, st);
  else if (h.castT > 0 && st.ranged) pose = keys(st.ranged, 0.45 + (1 - h.castT / 0.3) * 0.5);
  else if (h.attack && !h.attack.ranged) {
    const p = Math.min(1, h.attack.t / h.attack.dur),
      mv = h.attack.moveName;
    if (st.spin) pose = spinPose(p, mv === 'spinBig' ? 2 : 1, mv === 'spinBig');
    else pose = keys(st.moves[mv] || Object.values(st.moves)[0], p);
  } else if (h.attack && h.attack.ranged && st.ranged) pose = keys(st.ranged, Math.min(1, h.attack.t / h.attack.dur));
  else if (h.ladder) pose = climbPose(h);
  else if (h.dashT > 0) pose = { ...st.dash };
  else if (!h.onGround) pose = st.air(h.vy < 0);
  else if (Math.abs(h.vx) > 12) {
    const ph = h.animT * 9;
    const fi = Math.floor(ph) % 4;
    const s = Math.sin((ph / 4) * Math.PI * 2);
    pose = { f: ['run1', 'run2', 'run3', 'run2'][fi], ...st.run(s) };
    if (!pose.f) pose.f = 'run1';
  } else pose = st.idle(t, b);
  if (!pose.f) pose.f = 'idle';
  // just off a ladder: the hand reaches over the shoulder and draws the weapon back out
  if (h.drawT > 0 && !h.attack && !h.special && !h.ladder && !h.dead) {
    const k = Math.min(1, h.drawT / DRAW_TIME);
    pose = { ...pose, fh: [pose.fh[0] + (SHEATH.at[0] - pose.fh[0]) * k, pose.fh[1] + (SHEATH.at[1] - pose.fh[1]) * k], ang: pose.ang + (SHEATH.ang - pose.ang) * k };
  }
  return pose;
}

// Ladders: we see the hero from behind (the climb0/climb1 frames). The weapon rides sheathed across the back
// under the cape (hilt over the right shoulder, tip out past the left hip), both hands go hand-over-hand up the
// rungs, and the legs and cape only move while you actually climb.
export const SHEATH = { at: [7, 6], ang: 112 };
const BACK_SHEATH = { at: [14, 7], ang: 128 };
export const DRAW_TIME = 0.18;
function climbPose(h) {
  const ph = Math.floor((h.climbT || 0) * 6) % 2,
    lift = ph ? 0 : 3; // short reach: hands grip the rungs beside the head
  return { back: ph, f: 'climb' + ph, fh: [15, 7 + lift], bh: [1, 10 - lift], ang: BACK_SHEATH.ang, at: BACK_SHEATH.at, wb: false, ab: false, sheath: true };
}

function specialPose(h, st) {
  const s = h.special,
    k = s.kind;
  const T = s.t;
  switch (k) {
    case 'whirl':
    case 'cyclone': {
      const p = (T * (k === 'whirl' ? 2 : 1.6)) % 1;
      return { ...spinPose(p, 1, true), flip: Math.floor(T * 14) % 2 === 1 };
    }
    case 'flurry': {
      const p = (T * 12) % 1;
      return keys(STYLES.dagger.moves.stab, p);
    }
    case 'iai':
      if (T < 0.16) return { f: 'lean', fh: [10, 20], ang: 175, wb: true };
      return keys([[0, { f: 'wide', fh: [18, 16], ang: 10 }], [0.6, { f: 'wide', fh: [17, 16], ang: 20 }], [1, { f: 'idle', fh: [13, 18], ang: -100 }, 'io']], Math.min(1, (T - 0.16) / 0.14));
    case 'quake':
      return s.slam ? { f: 'crouch', fh: [18, 22], ang: 75 } : { f: 'back', fh: [5, 8], ang: -250, wb: true, ab: true };
    case 'vault':
      if (!s.down) return { f: 'jump', fh: [13, 20], ang: 90 };
      return s.slam ? { f: 'crouch', fh: [19, 21], ang: 30 } : { f: 'fall', fh: [12, 8], ang: -100 };
    case 'skewer': // spear thrust held out in front for the whole charge
      return { f: 'lean', fh: [19, 17], ang: 0 };
    case 'reap': // scythe: wound back, then the full sweep
      return keys([[0, { f: 'back', fh: [6, 10], ang: -175, wb: true, ab: true }], [0.5, { f: 'wide', fh: [18, 18], ang: 60 }, 'out'], [1, { f: 'idle', fh: [15, 18], ang: -40 }, 'io']], Math.min(1, T / 0.4));
    default:
      return st.idle(T, 0);
  }
}

// ---------------------------------------------------------------- rotated weapon sprites
// RotSprite-lite: upscale 4x with scale2x (twice), sample the rotated image once per output pixel.
const ROT_STEPS = 32;
const rotCache = new WeakMap();
function scale2x(src, w, h) {
  const out = new Uint32Array(w * 2 * h * 2),
    W2 = w * 2;
  const at = (x, y) => src[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const P = src[y * w + x],
        A_ = at(x, y - 1),
        B = at(x + 1, y),
        Cc = at(x - 1, y),
        D = at(x, y + 1);
      let e0 = P,
        e1 = P,
        e2 = P,
        e3 = P;
      if (Cc === A_ && Cc !== D && A_ !== B) e0 = A_;
      if (A_ === B && A_ !== Cc && B !== D) e1 = B;
      if (D === Cc && D !== B && Cc !== A_) e2 = Cc;
      if (B === D && B !== A_ && D !== Cc) e3 = D;
      const o = y * 2 * W2 + x * 2;
      out[o] = e0;
      out[o + 1] = e1;
      out[o + W2] = e2;
      out[o + W2 + 1] = e3;
    }
  return out;
}
function rotations(L) {
  let r = rotCache.get(L);
  if (r) return r;
  const g = L.cv.getContext('2d'),
    src = new Uint32Array(g.getImageData(0, 0, L.w, L.h).data.buffer);
  const up2 = scale2x(src, L.w, L.h),
    up4 = scale2x(up2, L.w * 2, L.h * 2),
    W4 = L.w * 4,
    H4 = L.h * 4;
  // radius from the grip to the far corner
  const R = Math.ceil(Math.max(Math.hypot(L.gx, L.gy), Math.hypot(L.w - L.gx, L.gy), Math.hypot(L.gx, L.h - L.gy), Math.hypot(L.w - L.gx, L.h - L.gy))) + 1;
  const S = R * 2 + 1;
  r = { S, c: R, cv: new Array(ROT_STEPS), src: up4, W4, H4 };
  rotCache.set(L, r);
  return r;
}
function rotated(L, idx) {
  const r = rotations(L);
  if (r.cv[idx]) return r.cv[idx];
  const a = (idx / ROT_STEPS) * Math.PI * 2,
    ca = Math.cos(-a),
    sa = Math.sin(-a);
  const cv = document.createElement('canvas');
  cv.width = cv.height = r.S;
  const g = cv.getContext('2d'),
    img = g.createImageData(r.S, r.S),
    d = new Uint32Array(img.data.buffer);
  for (let oy = 0; oy < r.S; oy++)
    for (let ox = 0; ox < r.S; ox++) {
      const lx = ox + 0.5 - (r.c + 0.5),
        ly = oy + 0.5 - (r.c + 0.5);
      const sx = L.gx + 0.5 + lx * ca - ly * sa,
        sy = L.gy + 0.5 + lx * sa + ly * ca;
      const x4 = Math.floor(sx * 4),
        y4 = Math.floor(sy * 4);
      if (x4 < 0 || y4 < 0 || x4 >= r.W4 || y4 >= r.H4) continue;
      d[oy * r.S + ox] = r.src[y4 * r.W4 + x4];
    }
  g.putImageData(img, 0, 0);
  r.cv[idx] = cv;
  return cv;
}
const angIndex = deg => (((Math.round((deg / 360) * ROT_STEPS) % ROT_STEPS) + ROT_STEPS) % ROT_STEPS);

// ---------------------------------------------------------------- drawing
// Thick muscled arms, two segments with an elbow: a bulging shoulder, bare skin to the elbow with
// a lit edge, then a black fingerless glove and gauntlet. The back arm is a shade darker.
// pass 'line' draws the ink silhouette only and 'fill' the colours only, so the near arm's outline
// can go under the body (no ink lines across the chest) while its colours go on top.
const ARM = {
  front: { lit: '#ffd2a0', skin: '#eea070', dark: '#c86c48', rim: '#3a1810', glove: '#2a2a3a', gloveLit: '#5a5a74' },
  back: { lit: '#eea070', skin: '#c86c48', dark: '#94442e', rim: '#2a100a', glove: '#1c1c28', gloveLit: '#3a3a4e' }
};
const UPPER = 6,
  FORE = 6;
// elbow: two-bone IK, the elbow bends down (away from the face) and toward the back
function elbowOf(x0, y0, x1, y1, face) {
  const dx = x1 - x0,
    dy = y1 - y0,
    d = Math.hypot(dx, dy) || 1;
  if (d >= UPPER + FORE - 0.5) return [x0 + (dx * UPPER) / d, y0 + (dy * UPPER) / d];
  const a = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d),
    h = Math.sqrt(Math.max(0, UPPER * UPPER - a * a));
  const mx = x0 + (dx * a) / d,
    my = y0 + (dy * a) / d;
  let nx = -dy / d,
    ny = dx / d;
  if (ny + nx * -face * 0.3 < 0) (nx = -nx), (ny = -ny); // prefer down and behind
  return [mx + nx * h, my + ny * h];
}
// opaque pixels of each body frame, so the near arm can be rimmed in dark skin where it lies on the
// body (32-bit style coloured inner outline) and in ink where it meets the background
const masks = new Map();
function bodyMask(Hh, fi) {
  let m = masks.get(fi);
  if (m) return m;
  const cv = document.createElement('canvas');
  cv.width = Hh.w;
  cv.height = Hh.h;
  const g = cv.getContext('2d');
  g.drawImage(Hh.im, fi * Hh.w, 0, Hh.w, Hh.h, 0, 0, Hh.w, Hh.h);
  const d = g.getImageData(0, 0, Hh.w, Hh.h).data;
  m = new Uint8Array(Hh.w * Hh.h);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  masks.set(fi, m);
  return m;
}
function drawArm(x0, y0, x1, y1, front, face = 1, pass = 'both', onBody = null) {
  const P = front ? ARM.front : ARM.back;
  const [ex, ey] = elbowOf(x0, y0, x1, y1, face);
  // the limb is a chain of capsules around pixel centres (+1: points name the top-left of the old 3px stroke):
  // shoulder cap, bicep, forearm, gauntlet. Each pixel is shaded by which side of the bone it sits on, so
  // the arm reads as one rounded form with a single clean contour instead of stamped squares.
  const sx = x0 + 1, sy = y0 + 1, mx = ex + 1, my = ey + 1, hx = x1 + 1, hy = y1 + 1;
  const gx = mx + (hx - mx) * 0.55, gy = my + (hy - my) * 0.55;
  const bones = [
    [sx, sy, sx, sy, front ? 2.4 : 2, 'skin'],
    [sx, sy, mx, my, 2, 'skin'],
    [mx, my, gx, gy, 1.7, 'skin'],
    [gx, gy, hx, hy, 1.8, 'glove'],
    [hx, hy, hx, hy, 2, 'glove']
  ];
  const near = (px, py) => {
    let best = null;
    for (const [ax, ay, bx, by, r, kind] of bones) {
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
      const t = L2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2)) : 0;
      const dx = px - (ax + vx * t), dy = py - (ay + vy * t);
      const d = Math.hypot(dx, dy) - r;
      // light comes from above and slightly in front of the face
      if (!best || d < best.d) best = { d, kind, lit: dx * face * 0.45 - dy * 0.9 };
    }
    return best;
  };
  const x_0 = Math.floor(Math.min(sx, mx, hx) - 4), x_1 = Math.ceil(Math.max(sx, mx, hx) + 4);
  const y_0 = Math.floor(Math.min(sy, my, hy) - 4), y_1 = Math.ceil(Math.max(sy, my, hy) + 4);
  for (let y = y_0; y <= y_1; y++)
    for (let x = x_0; x <= x_1; x++) {
      const n = near(x + 0.5, y + 0.5);
      if (n.d > 1) continue;
      if (pass === 'line' || pass === 'both') {
        X.fillStyle = C.ink;
        X.fillRect(x, y, 1, 1);
        if (pass === 'line') continue;
      }
      if (n.d > 0) {
        // contour: ink against the background (line pass), deep skin where the arm lies over the body
        if (onBody && onBody(x, y)) {
          X.fillStyle = P.rim;
          X.fillRect(x, y, 1, 1);
        }
        continue;
      }
      const glove = n.kind === 'glove';
      X.fillStyle = n.lit > 0.6 ? (glove ? P.gloveLit : P.lit) : n.lit < -0.5 ? (glove ? C.ink : P.dark) : glove ? P.glove : P.skin;
      X.fillRect(x, y, 1, 1);
    }
}

// pose grid (17 wide, shoulders y = 16, feet y = 24) -> arcade sprite pixels
function toSprite(Hh, x, y) {
  const cx = (Hh.w - 1) / 2,
    feet = Hh.feet ?? Hh.h - 1,
    sh = Hh.shoulders.idle[1][1];
  return [cx + (x - 8) * 1.15, y <= 16 ? (y / 16) * sh : sh + ((y - 16) / 8) * (feet - sh)];
}

export function drawHeroAnimated(h, t) {
  const Hh = A.hero;
  const pose = heroPose(h, t);
  const face = pose.back != null ? 1 : pose.flip ? -h.face : h.face; // the back view is drawn as is
  const sx0 = Math.round(h.x + h.w / 2 - Hh.w / 2),
    sy0 = Math.round(h.y + h.h - 1 - (Hh.feet ?? Hh.h - 1) + (pose.dy || 0) * 1.25);
  const W2 = (x, y) => [face > 0 ? sx0 + x : sx0 + Hh.w - 1 - x, sy0 + y]; // sprite px -> world
  const G2 = (x, y) => W2(...toSprite(Hh, x, y)); // pose grid -> world
  const sh = Hh.shoulders[pose.f] || Hh.shoulders.idle;
  const w = h.weapon,
    L = lookOf(w, frameOfLook(w.look, t)),
    st = styleOf(w.type);
  // front hand; two-handed styles put the back hand on the handle
  const fh = G2(pose.fh[0], pose.fh[1]);
  const angW = face > 0 ? pose.ang : 180 - pose.ang; // world-space angle
  const rad = (angW * Math.PI) / 180;
  // two-handed: the back hand rides the handle grip2 px from the front hand along the weapon
  let bh;
  if (st.grip2 && !pose.sheath && !pose.one) bh = [fh[0] + Math.cos(rad) * st.grip2, fh[1] + Math.sin(rad) * st.grip2];
  else bh = G2(pose.bh ? pose.bh[0] : 5, pose.bh ? pose.bh[1] : 20);
  const shB = W2(sh[0][0], sh[0][1]),
    shF = W2(sh[1][0], sh[1][1]);
  // weapon origin: the sprite's grip sits `slide` px behind the front hand along the weapon
  const slide = pose.sheath ? 0 : pose.slide ?? st.slide ?? 0;
  const back = pose.sheath ? G2(...(pose.at || SHEATH.at)) : null;
  const wx = back ? back[0] : fh[0] + 1 - Math.cos(rad) * slide,
    wy = back ? back[1] : fh[1] + 1 - Math.sin(rad) * slide; // +1: the middle of the 3px fist
  const flashing = h.inv > 0 && !h.special && h.dashT <= 0 && !h.dead && Math.floor(t * 20) % 2;

  const drawWeapon = () => {
    if (pose.hide) return;
    const k = 1;
    const idx = angIndex(pose.ang);
    const R = rotated(L, idx),
      rr = rotations(L);
    X.save();
    X.translate(Math.round(wx), Math.round(wy));
    if (face < 0) X.scale(-1, 1);
    if (h.giantT > 0) X.scale(2.4, 2.4);
    else if (h === world.hero && heroStats().reach) X.scale(1 + heroStats().reach, 1 + heroStats().reach); // the tree's reach upgrades
    motion(w.look, t, k);
    if (w.look.adj === 'Sneaky' && Math.floor(t * 3) % 3 === 0) X.globalAlpha = 0.5;
    X.drawImage(R, -rr.c, -rr.c);
    X.globalAlpha = 1;
    // overlays and particles: sprite px -> rotated local -> crisp 1px dots
    const a = (idx / ROT_STEPS) * Math.PI * 2,
      ca = Math.cos(a),
      sa = Math.sin(a);
    const to = (px, py) => {
      const lx = px - L.gx,
        ly = py - L.gy;
      return [Math.round(lx * ca - ly * sa), Math.round(lx * sa + ly * ca)];
    };
    overlays(L, w.look, t, 1, to);
    const m = X.getTransform();
    runEmitters(L.emitters, () => {
      const mk = L.marks[Math.floor(Math.random() * L.marks.length)];
      if (!mk) return null;
      const [lx, ly] = to(mk[0], mk[1]);
      const p = m.transformPoint(new DOMPoint(lx + 0.5, ly + 0.5));
      return { x: p.x - view.ox + Math.round(world.cameraX || 0), y: p.y - view.oy + Math.round(world.cameraY || 0) };
    });
    // tip position for the swing smear
    const tip = to(L.tip[0], L.tip[1]);
    const tp = m.transformPoint(new DOMPoint(tip[0], tip[1]));
    X.restore();
    return { x: tp.x - view.ox + Math.round(world.cameraX || 0), y: tp.y - view.oy + Math.round(world.cameraY || 0), col: L.light };
  };

  // bow string pulled to the back hand
  const drawString = () => {
    if (!st.string || !pose.nock || pose.hide || pose.sheath) return;
    // bow tips: top and bottom of the sprite near the string column
    const tipTop = [L.gx - 2, 2],
      tipBot = [L.gx - 2, L.h - 3];
    const toW = ([px, py]) => {
      const lx = px - L.gx,
        ly = py - L.gy;
      const ang = (angIndex(pose.ang) / ROT_STEPS) * Math.PI * 2;
      const x = lx * Math.cos(ang) - ly * Math.sin(ang),
        y = lx * Math.sin(ang) + ly * Math.cos(ang);
      return [Math.round(wx + (face > 0 ? x : -x)), Math.round(wy + y)];
    };
    const [ax, ay] = toW(tipTop),
      [bx, by] = toW(tipBot);
    line(ax, ay, bh[0] + 1, bh[1] + 1, C.paper);
    line(bx, by, bh[0] + 1, bh[1] + 1, C.paper);
    // nocked arrow
    const dir = face;
    rect(bh[0] + 1, bh[1] + 1, 1, 1, C.paper);
    for (let i = 0; i < 10; i++) rect(bh[0] + 1 + dir * i, bh[1] + 1, 1, 1, i > 7 ? C.mist : C.wood);
  };

  // draw order: back arm, (weapon behind), body, (weapon), front arm
  let tip = null;
  const backView = pose.back != null; // seen from behind: both arms reach up in front of the back
  if (!flashing && !backView) drawArm(shB[0], shB[1], bh[0], bh[1], false, face);
  if (pose.wb) tip = drawWeapon();
  if (pose.ab && !flashing) drawArm(shF[0], shF[1], fh[0], fh[1], true, face);
  if (!pose.ab && !flashing && !backView) drawArm(shF[0], shF[1], fh[0], fh[1], true, face, 'line'); // silhouette under the body
  if (!flashing) frame(Hh.im, Hh.frames[pose.f] ?? 0, Hh.w, Hh.h, sx0, sy0, face < 0);
  if (backView && !flashing) drawArm(shB[0], shB[1], bh[0], bh[1], false, face);
  if (!pose.wb) tip = drawWeapon();
  drawString();
  if (!pose.ab && !flashing) {
    const fi = Hh.frames[pose.f] ?? 0,
      mask = bodyMask(Hh, fi);
    const onBody = (x, y) => {
      const lx = face > 0 ? x - sx0 : sx0 + Hh.w - 1 - x,
        ly = y - sy0;
      return lx >= 0 && ly >= 0 && lx < Hh.w && ly < Hh.h && mask[ly * Hh.w + lx] === 1;
    };
    drawArm(shF[0], shF[1], fh[0], fh[1], true, face, backView ? 'both' : 'fill', backView ? null : onBody);
  }
  // swing smear: connect recent blade-tip positions while attacking
  const swinging = (h.attack && !h.attack.ranged) || (h.special && ['whirl', 'cyclone', 'iai', 'quake', 'vault', 'flurry'].includes(h.special.kind));
  if (swinging && tip) {
    h.trail = h.trail || [];
    h.trail.push([tip.x, tip.y]);
    if (h.trail.length > 6) h.trail.shift();
    for (let i = 1; i < h.trail.length; i++) {
      const [x0, y0] = h.trail[i - 1],
        [x1, y1] = h.trail[i];
      if (Math.hypot(x1 - x0, y1 - y0) < 3) continue;
      line(x0, y0, x1, y1, i >= h.trail.length - 2 ? C.paper : tip.col, i < h.trail.length - 3 ? 2 : 1);
    }
  } else h.trail = null;
}

function line(x0, y0, x1, y1, col, every = 1) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  X.fillStyle = col;
  for (let i = 0; i <= n; i += every) X.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
}

// The hero standing or walking without a weapon (overworld map): body frame plus hanging arms.
// x, y: top-left of the sprite.
export function drawHeroPlain(f, x, y, face) {
  const Hh = A.hero,
    W2 = (px, py) => [face > 0 ? x + px : x + Hh.w - 1 - px, y + py];
  const sh = Hh.shoulders[f] || Hh.shoulders.idle,
    swing = f.startsWith('run') ? (f === 'run2' ? 0 : f === 'run1' ? 2 : -2) : 0;
  const hand = (gx, gy) => W2(...toSprite(Hh, gx, gy));
  drawArm(...W2(sh[0][0], sh[0][1]), ...hand(5 - swing, 21), false, face);
  drawArm(...W2(sh[1][0], sh[1][1]), ...hand(12 + swing, 21), true, face, 'line');
  frame(Hh.im, Hh.frames[f] ?? 0, Hh.w, Hh.h, x, y, face < 0);
  const mask = bodyMask(Hh, Hh.frames[f] ?? 0);
  const onBody = (px, py) => {
    const lx = face > 0 ? px - x : x + Hh.w - 1 - px,
      ly = py - y;
    return lx >= 0 && ly >= 0 && lx < Hh.w && ly < Hh.h && mask[ly * Hh.w + lx] === 1;
  };
  drawArm(...W2(sh[1][0], sh[1][1]), ...hand(12 + swing, 21), true, face, 'fill', onBody);
}
