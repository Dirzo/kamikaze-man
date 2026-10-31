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
import { X, frame, rect, scale2x } from '../engine/gfx.js';
import { lookOf, frameOfLook, overlays, runEmitters, motion } from './looks.js';
import { world } from './world.js';
import { view } from '../engine/gfx.js';
import { STYLE_OF } from '../data/weapons.js';
import { heroStats } from './perks.js';
import { faceOf, drawFace, LOW_HP } from './faces.js';

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
  for (const k of ['f', 'wb', 'hide', 'nock', 'ab', 'flip', 'one', 'bf', 'pull']) o[k] = t < 0.5 ? a[k] : b[k];
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
    // the head rests on the ground at idle and drags along behind him on the walk (ground: the
    // angle is solved so the head sits on the floor)
    idle: (t, b) => ({ f: 'wide', fh: [15, 18 + b], ang: 64, ground: 'front' }),
    run: s => ({ fh: [9, 19], ang: 150, ground: 'back', one: true }),
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
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 18 + b], ang: -82 + sin(t * 1.4) * 2 }),
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
    sheath: { at: [3, 12], ang: 62 }, // slung across the back at a sprint, the limbs showing either side
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 19 + b], bh: [5, 20 + b], ang: 35 }),
    run: s => ({ fh: [14 + s * 2, 19], bh: [5 - s * 2, 19], ang: 50 }),
    air: up => (up ? { f: 'jump', fh: [15, 14], bh: [3, 14], ang: 0 } : { f: 'fall', fh: [15, 16], bh: [3, 15], ang: 20 }),
    dash: { f: 'lean', fh: [10, 19], bh: [14, 17], ang: 90, wb: true },
    ranged: [[0, { f: 'idle', fh: [18, 15], bh: [15, 15], ang: 0, nock: true, bf: true }], [0.3, { f: 'wide', fh: [19, 15], bh: [11, 12], ang: 0, nock: true, bf: true, pull: true }, 'out'], [0.46, { f: 'wide', fh: [19, 15], bh: [11, 12], ang: 0, bf: true, pull: true }, 'lin'], [0.7, { f: 'wide', fh: [18, 15], bh: [11, 12], ang: 0, bf: true, pull: true }], [1, { f: 'idle', fh: [14, 19], bh: [5, 20], ang: 35 }, 'io']],
    fireAt: 0.44,
    string: true
  },
  // thrown stars: wind up behind the head, snap the arm forward, the star leaves the hand
  shuriken: {
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 19 + b], bh: [5, 20 + b], ang: Math.floor(t * 4) * 45 }),
    run: s => ({ fh: [14 + s * 2, 19], bh: [5 - s * 2, 19], ang: 0 }),
    air: up => (up ? { f: 'jump', fh: [14, 13], bh: [3, 14], ang: 0 } : { f: 'fall', fh: [15, 16], bh: [2, 15], ang: 0 }),
    dash: { f: 'lean', fh: [10, 18], bh: [15, 16], ang: 0, wb: true },
    ranged: [[0, { f: 'idle', fh: [13, 17], bh: [6, 18], ang: 0 }], [0.15, { f: 'idle', fh: [5, 17], bh: [12, 17], ang: -90, wb: true }], [0.3, { f: 'idle', fh: [3, 8], bh: [14, 16], ang: -45, wb: true }, 'io'], [0.45, { f: 'lean', fh: [19, 14], bh: [6, 19], ang: 0, hide: true }, 'out'], [0.8, { f: 'idle', fh: [16, 17], bh: [5, 19], ang: 0, hide: true }], [1, { f: 'idle', fh: [14, 19], bh: [5, 20], ang: 0 }, 'io']],
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
  // breathing: a slow in-and-out (about 1.6 s a breath, like MapleStory's stand loop): the head
  // sinks first, then the shoulders, and the hands ride down with them
  const br = (1 - Math.cos((t / 1.6) * Math.PI * 2)) / 2,
    b = br;
  let pose;
  const calm = !h.dead && !h.cheer && h.hurtT <= 0 && !h.special && !h.attack && !(h.castT > 0) && h.dashT <= 0 && !h.ladder && !h.rope && !h.zip && !h.rev && !h.stowed;
  if (h.dead && h.deadAt != null && t - h.deadAt > 0.3) pose = { f: 'fall', fh: [14, 23], bh: [1, 18], ang: 92 }; // flat on his back, the weapon lying beside him (drawHeroAnimated tips him over)
  else if (h.dead || h.hurtT > 0) pose = { ...st.idle(t, 0), f: 'hurt', fh: [17, 15], bh: [0, 14], ang: st.idle(t, 0).ang - 40, dy: h.hurtT > 0.18 ? -0.6 : 0 }; // (a jolt as the hit lands)
  else if (h.cheer) pose = cheerPose(h, t, st);
  else if (h.special) pose = specialPose(h, st);
  else if (h.castT > 0 && st.ranged) pose = keys(st.ranged, 0.45 + (1 - h.castT / 0.3) * 0.5);
  else if (h.attack && !h.attack.ranged) {
    const p = h.attack.p ?? Math.min(1, h.attack.t / h.attack.dur), // (heavy weapons hang at the top: hero.js swingP)
      mv = h.attack.moveName;
    if (st.spin) pose = spinPose(p, mv === 'spinBig' ? 2 : 1, mv === 'spinBig');
    else pose = keys(st.moves[mv] || Object.values(st.moves)[0], p);
  } else if (h.attack && h.attack.ranged && st.ranged) pose = keys(st.ranged, Math.min(1, h.attack.t / h.attack.dur));
  else if (h.rope || h.zip) pose = { f: 'sjump', fh: [12, 2], bh: [7, 3], armF: 'up/near', armB: 'up/near', at: RUN_SHEATH.at, ang: RUN_SHEATH.ang, sheath: true, wb: true }; // hanging on, weapon on the back
  else if (h.ladder) pose = climbPose(h);
  else if (h.dashT > 0) pose = { ...st.dash };
  else if (h.rev) pose = { ...st.idle(t, 0), f: 'crouch', dy: Math.floor(t * 30) % 2 && h.rev.n > 1 ? 1 : 0 }; // revving a charge dash: crouched, shuddering
  else if (h.stowed) pose = sprintPose(h, st);
  else if (h.skidT > 0 && h.onGround) pose = { ...st.idle(t, 0), f: 'lean', dy: 1 }; // braking into the turn
  else if (!h.onGround) {
    pose = st.air(h.vy < 0);
    // falling hard: the free arms fly out for balance and windmill
    if (h.vy > 300 && !st.grip2 && !h.attack) {
      const w = Math.sin(t * 26) * 1.5;
      pose = { ...pose, fh: [21, 13 + w], bh: [-2, 10 - w], armF: 'fwd', armB: 'uback', ang: -35 + w * 12 };
    }
  }
  else if (Math.abs(h.vx) > 12) {
    // six-frame walk (contact, down, passing per leg); the arms swing against the legs, so the
    // near hand is back while the near leg reaches forward, and the hands dip on the planted step
    const ph = (h.legPh ?? h.animT) * 11; // (hero.js legPh: faster with the run)
    const fi = Math.floor(ph) % 6;
    const s = -Math.cos((ph / 6) * Math.PI * 2);
    pose = st.run(s);
    // swinging forward the arm bends at the elbow (fist up at the chest), swinging back it trails
    // behind the hip; one-handed carries only, a two-handed grip keeps both hands on the weapon
    const dip = fi % 3 === 1 ? 1 : 0,
      swing = k => (k > 0.3 ? 'fwd/near' : k < -0.3 ? 'dback/near' : null),
      free = !st.grip2;
    pose = { ...pose, f: 'walk' + fi, fh: [pose.fh[0] + s * 2, pose.fh[1] + dip], bh: pose.bh && [pose.bh[0] - s * 2, pose.bh[1] + dip] };
    // (the far arm only shows swinging back: forward it would leave a lone fist in front of the chest)
    if (free) (pose.armF = swing(s)), (pose.armB = pose.bh && s > 0.3 ? 'dback/near' : null);
  } else {
    const low = h.hp / h.maxHp < LOW_HP;
    if (low) {
      // hurting: quick heavy breaths, shoulders slumped, hands hanging lower
      const fb = (1 - Math.cos(t * 7)) / 2;
      pose = st.idle(t, 1);
      if (pose.f === 'idle' || pose.f === 'idle2') pose.f = fb < 0.5 ? 'idle1' : 'idle2';
      pose.fh = [pose.fh[0], pose.fh[1] + 1];
      if (pose.bh) pose.bh = [pose.bh[0], pose.bh[1] + 1];
    } else {
      pose = st.idle(t, b);
      if (pose.f === 'idle' || pose.f === 'idle2') pose.f = br < 0.3 ? 'idle' : br < 0.7 ? 'idle1' : 'idle2';
    }
    // standing still a while: a fidget every few seconds; a new weapon gets held up for a look
    if (h.idleAt == null) h.idleAt = t;
    pose.idleFor = t - h.idleAt;
    if (h.mood === 'wow') pose = { ...pose, fh: [16, 12], bh: pose.bh && [4, 18], ang: -55, dy: -0.5 };
    else if (!low && pose.idleFor > 3) {
      const q = (pose.idleFor - 3) % 7;
      if (q < FIDGET) pose = fidget(st, pose, q / FIDGET);
    }
  }
  if (!(h.onGround && calm && Math.abs(h.vx) <= 12 && !h.skidT)) h.idleAt = null;
  // landing hard: knees give for a moment; turning round: the shoulders lead the turn
  const plain = /^(idle|walk)/.test(pose.f);
  if (calm && plain && h.onGround && h.squashT > 0) pose = { ...pose, f: 'crouch', fh: [pose.fh[0], pose.fh[1] + 2], bh: pose.bh && [pose.bh[0], pose.bh[1] + 2] };
  else if (calm && plain && h.onGround && h.turnAt != null && t - h.turnAt < 0.07) pose = { ...pose, f: 'back' };
  if (!pose.f) pose.f = 'idle';
  // just off a ladder or out of a sprint: the hand reaches over the shoulder and draws the weapon
  // back out (a swing out of a sprint snaps it out in DRAW_SNAP)
  if (h.drawT > 0 && !h.special && !h.ladder && !h.dead && !h.stowed) {
    const k = Math.min(1, h.drawT / (h.drawMax || DRAW_TIME));
    pose = { ...pose, fh: [pose.fh[0] + (SHEATH.at[0] - pose.fh[0]) * k, pose.fh[1] + (SHEATH.at[1] - pose.fh[1]) * k], ang: pose.ang + (SHEATH.ang - pose.ang) * k };
  }
  return pose;
}

// Idle fidgets: one-handed weapons get tossed up spinning and caught; two-handed ones get hefted up
// onto the shoulder and set back down. (The hammer rests on the ground and the bow stays lowered.)
const FIDGET = 1.3;
function fidget(st, idle, p) {
  if (st === STYLES.sword || st === STYLES.dagger || st === STYLES.nunchucks || st === STYLES.wand || st === STYLES.shuriken) {
    if (p < 0.12) return { ...idle, f: 'idle2', fh: [idle.fh[0], idle.fh[1] + 1] }; // dip
    if (p > 0.82) return { ...idle, f: p < 0.9 ? 'idle2' : idle.f }; // caught: the knees take it
    const k = (p - 0.12) / 0.7, // in the air
      up = Math.sin(k * Math.PI);
    return { ...idle, f: 'idle', fh: [15, 15 - up * 2], at: [16, 15 - up * 13], ang: idle.ang + k * 720, sheath: true, toss: true };
  }
  if (st.grip2 && st !== STYLES.hammer) {
    const k = p < 0.25 ? p / 0.25 : p > 0.75 ? (1 - p) / 0.25 : 1,
      e = ease.io(Math.max(0, Math.min(1, k)));
    return { ...idle, f: e > 0.5 && p > 0.3 && p < 0.7 && Math.floor(p * 8) % 2 ? 'idle1' : idle.f, fh: [lerp(idle.fh[0], 14, e), lerp(idle.fh[1], 16, e)], ang: lerp(idle.ang, -118, e), wb: e > 0.5 };
  }
  return idle;
}
// Level clear: weapon thrust up over his head, bouncing on his toes
function cheerPose(h, t, st) {
  if (h.cheerAt == null) h.cheerAt = t;
  const q = t - h.cheerAt,
    hop = Math.abs(Math.sin(q * 7.5)),
    air = hop > 0.45 && q > 0.15;
  const up = q < 0.15 ? q / 0.15 : 1;
  return { f: air ? 'jump' : 'idle', fh: [lerp(14, 15, up), lerp(19, 3, up)], bh: [3, air ? 12 : 16], ang: lerp(st.idle(t, 0).ang, st.grip2 ? -100 : -90, up), dy: -hop * 3 };
}

// Ladders: we see the hero from behind (the climb0/climb1 frames). The weapon rides sheathed across the back
// under the cape (hilt over the right shoulder, tip out past the left hip), both hands go hand-over-hand up the
// rungs, and the legs and cape only move while you actually climb.
export const SHEATH = { at: [7, 6], ang: 112 };
const BACK_SHEATH = { at: [14, 7], ang: 128 };
export const DRAW_TIME = 0.18;
export const DRAW_SNAP = 0.07;
// Sprint (full momentum, hero.js): the weapon is sheathed on the back, the body pitches forward with
// the hair and headband streaming (art-src/arcade_hero.py sprint0-3, sjump, sfall) and both arms
// pump: the near arm drives forward to the chin while the far arm swings back, then they swap.
export const RUN_SHEATH = { at: [6, 11], ang: 158 };
function sprintPose(h, st) {
  const sh = st.sheath || RUN_SHEATH, base = { at: sh.at, ang: sh.ang, sheath: true, wb: true, bh: [4, 20] };
  if (!h.onGround) return { ...base, f: h.vy < 0 ? 'sjump' : 'sfall', fh: [14, 14], armF: 'pump', armB: 'dback/near' };
  const fi = Math.floor((h.legPh ?? h.animT * 1.4) * 10) % 4; // 14 frames a second at the old top speed, faster above it
  // near leg reaching (0): near arm back, far arm forward; far leg reaching (2): the other way round
  const nearFwd = fi >= 2;
  return { ...base, f: 'sprint' + fi, dy: fi % 2 ? -0.6 : 0, fh: nearFwd ? [14, 14] : [3, 21], armF: nearFwd ? 'pump' : 'dback/near', armB: nearFwd ? 'dback/near' : 'pump/near' };
}
function climbPose(h) {
  // hand over hand on the rungs in front of his face: from behind, the head and back hide most of
  // both arms (drawn under the body), one fist higher than the other, swapping as the legs swap
  const ph = Math.floor((h.climbT || 0) * 6) % 2;
  return { back: ph, f: 'climb' + ph, fh: [10, ph ? 6 : 2], bh: [6, ph ? 2 : 6], ang: BACK_SHEATH.ang, at: BACK_SHEATH.at, wb: false, ab: false, sheath: true };
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
    case 'plunge': // the down-strike: blades point straight down, blunt weapons come down overhead
      if (s.P.kind === 'pogo') return { f: 'fall', fh: [13, 22], ang: 90 };
      return s.slam ? { f: 'crouch', fh: [19, 21], ang: 30 } : { f: 'fall', fh: [12, 8], ang: -100 };
    case 'skewer': // spear thrust held out in front for the whole charge
      return { f: 'lean', fh: [19, 17], ang: 0 };
    case 'reap': // scythe: wound back, then the full sweep
      return keys([[0, { f: 'back', fh: [6, 10], ang: -175, wb: true, ab: true }], [0.5, { f: 'wide', fh: [18, 18], ang: 60 }, 'out'], [1, { f: 'idle', fh: [15, 18], ang: -40 }, 'io']], Math.min(1, T / 0.4));
    // the added specials (game/specials.js)
    case 'tornado':
    case 'berserk':
    case 'monkey':
      return { ...spinPose((T * (k === 'berserk' ? 2.4 : 1.8)) % 1, 1, true), flip: k === 'berserk' && Math.floor(T * 14) % 2 === 1 };
    case 'dragon':
      if (T > 0.62) return { f: 'jump', fh: [16, 3], ang: -80 };
      return Math.floor(T * 19) % 2 ? { f: 'lean', fh: [20, 15], ang: -10 } : { f: 'wide', fh: [19, 19], ang: 20 };
    case 'skysplit':
    case 'gavel':
    case 'splitter':
    case 'pillars': {
      const at = k === 'skysplit' ? 0.28 : k === 'pillars' ? 0.1 : 0.16;
      return T < at ? { f: 'back', fh: [5, 8], ang: -250, wb: true, ab: true } : { f: 'crouch', fh: [18, 22], ang: 75 };
    }
    case 'crossslash':
    case 'moon':
    case 'deathmoon':
    case 'harvest':
      return keys([[0, { f: 'back', fh: [6, 10], ang: -175, wb: true, ab: true }], [0.4, { f: 'wide', fh: [18, 18], ang: 60 }, 'out'], [1, { f: 'idle', fh: [15, 18], ang: -40 }, 'io']], Math.min(1, T / 0.3));
    case 'shadowstep':
      return { f: 'lean', fh: [19, 17], ang: 0 };
    case 'thousand':
      return { f: 'idle', fh: [13, 18], ang: -100 };
    case 'meteor':
    case 'dragoon':
      if (!s.down) return { f: 'jump', fh: [12, 5], ang: k === 'dragoon' ? -60 : -110, wb: true };
      if (!s.slam) return k === 'dragoon' ? { f: 'fall', fh: [17, 20], ang: 50 } : { f: 'fall', fh: [12, 8], ang: -100 };
      return { f: 'crouch', fh: [19, 21], ang: k === 'dragoon' ? 80 : 30 };
    case 'siege':
    case 'beam':
      return st.ranged ? keys(st.ranged, T < 0.38 && k === 'siege' ? 0.4 : 0.9) : { f: 'lean', fh: [19, 15], ang: 0 };
    case 'knives':
    case 'arrowrain':
    case 'spearrain':
    case 'orbit':
    case 'blackhole':
    case 'flock':
    case 'bigstar':
    case 'megarang':
      if (st.ranged) return keys(st.ranged, 0.45 + Math.min(1, T / 0.25) * 0.5);
      return k === 'knives' ? spinPose((T * 3) % 1, 1, true) : { f: 'idle', fh: [14, 4], ang: -90 };
    default:
      return st.idle(T, 0);
  }
}

// ---------------------------------------------------------------- rotated weapon sprites
// RotSprite-lite: upscale 4x with scale2x (twice), sample the rotated image once per output pixel.
const ROT_STEPS = 32;
const rotCache = new WeakMap();
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
// Hand-drawn arms (art-src/arcade_arms.py): eight directions, each bent and straight, front arms
// plus a darker copy for the far arm. A pose asks for a hand position; we draw the arm whose fist
// offset from the shoulder is closest and report where its fist really is, so the weapon sits in it.
const ONLY = new Set(['draw', 'chi', 'clo', 'chiL', 'cloL', 'pump']); // drawn for one pose: only used when a pose names them
function pickArm(dx, dy, far, only) {
  let best = null,
    bd = 1e9;
  for (const m of A.hero.arms.list) {
    if (m.back !== far || (only ? (only.includes('/') ? m.dir + '/' + m.reach : m.dir) !== only : ONLY.has(m.dir))) continue;
    const ex = m.f[0] - m.o[0] - dx,
      ey = m.f[1] - m.o[1] - dy,
      d = ex * ex + ey * ey;
    if (d < bd) (bd = d), (best = m);
  }
  return best;
}
// shoulder (sx, sy) in world px, target fist (tx, ty); returns the arm and its fist in world px
function armFor(sx, sy, tx, ty, far, face, only) {
  const m = pickArm((tx - sx) * face, ty - sy, far, only);
  return { m, sx, sy, face, fist: [sx + (m.f[0] - m.o[0]) * face, sy + m.f[1] - m.o[1]] };
}
// layer 'line' is the ink outline only, 'fill' the colours only, 'both' everything: the near arm's
// outline goes under the body so no black line is drawn across the chest
function drawArm(arm, layer = 'both') {
  const { m, sx, sy, face } = arm,
    im = A.hero.arms.im;
  const rows = layer === 'both' ? [m.lineY, 0] : [layer === 'line' ? m.lineY : 0];
  for (const ry of rows) {
    if (face > 0) X.drawImage(im, m.x, ry, m.w, m.h, Math.round(sx - m.o[0]), Math.round(sy - m.o[1]), m.w, m.h);
    else {
      X.save();
      X.translate(Math.round(sx + m.o[0]) + 1, Math.round(sy - m.o[1]));
      X.scale(-1, 1);
      X.drawImage(im, m.x, ry, m.w, m.h, 0, 0, m.w, m.h);
      X.restore();
    }
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
  if (h.face !== h.lastFace) (h.lastFace != null && h.onGround && (h.turnAt = t)), (h.lastFace = h.face);
  if (!h.dead) h.deadAt = null;
  else if (h.deadAt == null) h.deadAt = t;
  if (!h.cheer) h.cheerAt = null;
  const k = h.dead ? t - h.deadAt : 0;
  if (k <= 0.3) return drawHeroBody(h, t);
  // knocked out: he topples over backwards (a 45 degree frame, then flat), bounces once and lies there
  const fx = Math.round(h.x + h.w / 2),
    fy = Math.round(h.y + h.h - 5 - (k > 0.38 && k < 0.5 ? 2 : 0));
  X.save();
  X.translate(fx, fy);
  X.rotate(-h.face * (k < 0.38 ? Math.PI / 4 : Math.PI / 2));
  X.translate(-fx, -fy);
  drawHeroBody(h, t);
  X.restore();
}
function drawHeroBody(h, t) {
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
  const shB = W2(sh[0][0], sh[0][1]),
    shF = W2(sh[1][0], sh[1][1]);
  // front hand: the drawn arm closest to the pose's hand, and the weapon goes in its fist
  // bf (drawing the bow): the far arm holds the bow out and the near arm pulls the string, so the
  // weapon goes in the back fist and fh/bh swap arms
  const want = G2(pose.fh[0], pose.fh[1]);
  const bowB = pose.bf ? armFor(shB[0], shB[1], want[0] + 1, want[1] + 1, true, face) : null;
  const armF = bowB ? armFor(shF[0], shF[1], ...G2(pose.bh[0], pose.bh[1]).map(v => v + 1), false, face, pose.pull && 'draw') : armFor(shF[0], shF[1], want[0] + 1, want[1] + 1, false, face, pose.armF);
  const fh = bowB ? [bowB.fist[0] - 1, bowB.fist[1] - 1] : [armF.fist[0] - 1, armF.fist[1] - 1];
  if (pose.ground && !pose.sheath) {
    // tilt the weapon until its head touches the floor (feet row), in front of him or trailing behind
    const reach = Math.hypot(L.tip[0] - L.gx, L.tip[1] - L.gy) - (pose.slide ?? st.slide ?? 0) - 2,
      floor = sy0 + (Hh.feet ?? Hh.h - 1) - 2;
    const a = (Math.asin(Math.max(-1, Math.min(1, (floor - fh[1] - 1) / reach))) * 180) / Math.PI;
    pose.ang = pose.ground === 'back' ? 180 - a : a;
  }
  const angW = face > 0 ? pose.ang : 180 - pose.ang; // world-space angle
  const rad = (angW * Math.PI) / 180;
  // two-handed: the back hand rides the handle grip2 px from the front hand along the weapon
  let bh;
  if (st.grip2 && !pose.sheath && !pose.one) bh = [fh[0] + Math.cos(rad) * st.grip2, fh[1] + Math.sin(rad) * st.grip2];
  else bh = G2(pose.bh ? pose.bh[0] : 5, pose.bh ? pose.bh[1] : 20);
  const armB = bowB || (pose.armB ? armFor(shB[0], shB[1], bh[0] + 1, bh[1] + 1, pose.back == null, face, pose.armB) : armFor(shB[0], shB[1], bh[0] + 1, bh[1] + 1, true, face));
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
    const tp = m.transformPoint(new DOMPoint(tip[0], tip[1])),
      pv = m.transformPoint(new DOMPoint(0, 0));
    X.restore();
    const ox = -view.ox + Math.round(world.cameraX || 0),
      oy = -view.oy + Math.round(world.cameraY || 0);
    return { x: tp.x + ox, y: tp.y + oy, px: pv.x + ox, py: pv.y + oy, col: L.light };
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
    // the string runs to the drawing hand's fist, wherever the drawn arm put it
    const [nx, ny] = (pose.bf ? armF : armB).fist;
    line(ax, ay, nx, ny, C.paper);
    line(bx, by, nx, ny, C.paper);
    // nocked arrow
    const dir = face;
    rect(nx, ny, 1, 1, C.paper);
    for (let i = 0; i < 10; i++) rect(nx + dir * i, ny, 1, 1, i > 7 ? C.mist : C.wood);
  };

  // draw order: back arm, (weapon behind), body, (weapon), front arm
  let tip = null;
  const backView = pose.back != null; // seen from behind: both arms reach up in front of the back
  if (!flashing && !backView) drawArm(armB);
  if (pose.wb) tip = drawWeapon();
  if (pose.ab && !flashing) drawArm(armF);
  if (!pose.ab && !flashing && !backView) drawArm(armF, 'line'); // outline tucked under the body
  if (backView && !flashing) drawArm(armB), drawArm(armF); // reaching in front of him, behind the head
  if (!flashing) frame(Hh.im, Hh.frames[pose.f] ?? 0, Hh.w, Hh.h, sx0, sy0, face < 0), drawFace(pose.f, faceOf(h, t, pose), sx0, sy0, face);
  if (!pose.wb) tip = drawWeapon();
  drawString();
  if (!pose.ab && !flashing && !backView) drawArm(armF, 'fill');
  // swing smear: connect recent blade-tip positions while attacking
  const swinging = (h.attack && !h.attack.ranged) || (h.special && ['whirl', 'cyclone', 'iai', 'quake', 'vault', 'flurry', 'tornado', 'berserk', 'dragon', 'crossslash', 'moon', 'deathmoon', 'harvest', 'skysplit', 'gavel', 'splitter', 'meteor', 'dragoon', 'knives', 'shadowstep'].includes(h.special.kind));
  if (swinging && tip) {
    h.trail = h.trail || [];
    h.trail.push([tip.x, tip.y, tip.px, tip.py]);
    if (h.trail.length > 5) h.trail.shift();
    smear(h.trail, tip.col);
  } else h.trail = null;
}

// Swing smear in the Slormancer / arcade style: a thin crescent swept by the outer part of the
// weapon around the hand between recent frames, thickest at the newest edge and thinning as it
// fades, with a white rim along the blade's arc. Straight thrusts (little turn) leave none. The arc
// is interpolated by angle round the hand so it curves, and drawn pixel by pixel so it stays crisp.
function smear(tr, col) {
  const [, , cx, cy] = tr[tr.length - 1]; // pivot: the hand now
  const polar = ([x, y]) => [Math.atan2(y - cy, x - cx), Math.hypot(x - cx, y - cy)];
  for (let i = 1; i < tr.length; i++) {
    const [a0, r0] = polar(tr[i - 1]),
      [a1, r1] = polar(tr[i]);
    let da = a1 - a0;
    da = ((da + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    if (Math.abs(da) < 0.17 || Math.abs(da) > 2.6 || Math.min(r0, r1) < 6) continue;
    const age = (tr.length - 1 - i) / Math.max(1, tr.length - 2), // 0 newest .. 1 oldest
      thick = Math.max(1.5, Math.min(r0, r1) * (0.3 - age * 0.18));
    const n = Math.ceil(Math.abs(da) * Math.max(r0, r1) * 1.3) + 1;
    X.fillStyle = col;
    X.globalAlpha = 0.6 - age * 0.35;
    for (let v = 0; v <= n; v++) {
      const k = v / n,
        a = a0 + da * k,
        r = r0 + (r1 - r0) * k,
        w = thick * (age ? 1 : 0.5 + k * 0.5);
      for (let d = 1; d <= w; d++) X.fillRect(Math.round(cx + Math.cos(a) * (r - d)), Math.round(cy + Math.sin(a) * (r - d)), 1, 1);
    }
    X.fillStyle = C.paper;
    X.globalAlpha = 0.9 - age * 0.6;
    for (let v = 0; v <= n; v++) {
      const k = v / n,
        a = a0 + da * k,
        r = r0 + (r1 - r0) * k;
      X.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
    }
  }
  X.globalAlpha = 1;
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
  const arm = (shp, gx, gy, far) => armFor(...W2(shp[0], shp[1]), ...hand(gx, gy).map(v => v + 1), far, face);
  const near = arm(sh[1], 12 + swing, 21, false);
  drawArm(arm(sh[0], 5 - swing, 21, true));
  drawArm(near, 'line');
  frame(Hh.im, Hh.frames[f] ?? 0, Hh.w, Hh.h, x, y, face < 0);
  drawArm(near, 'fill');
}
