// Hero animation: the body sprite has no arms; both arms are drawn from the shoulders to hand
// positions that come from per-weapon-style poses, and the weapon is held in the front hand (two-
// handed styles put the back hand on the handle). Every style has its own idle, run, jump, attack
// and special poses. Weapons are rotated with a RotSprite-style sampler (cached at 32 angles) so
// they stay crisp, and fast swings leave a pixel smear.
//
// Pose coordinates are sprite pixels with the hero facing right (17x25 sprite, feet at y = 24).
//   f      body frame (see art-src/build_next.py)
//   fh     front hand [x, y]       bh  back hand [x, y] (omit on two-handed styles: auto on handle)
//   ang    weapon angle in degrees (0 = pointing forward, negative = up, positive = down)
//   wb     weapon drawn behind the body        hide  weapon not drawn (thrown)
//   ab     front arm drawn behind the body (hand reaching back behind the head)
import { C } from '../config.js';
import { A } from '../engine/assets.js';
import { X, frame, rect } from '../engine/gfx.js';
import { lookOf, frameOfLook, overlays, runEmitters, motion } from './looks.js';
import { world } from './world.js';
import { view } from '../engine/gfx.js';
import { STYLE_OF } from '../data/weapons.js';

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
  for (const k of ['ang', 'slide']) if (a[k] != null && b[k] != null) o[k] = lerp(a[k], b[k], t);
  for (const k of ['fh', 'bh']) if (a[k] && b[k]) o[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)];
  for (const k of ['f', 'wb', 'hide', 'nock', 'ab']) o[k] = t < 0.5 ? a[k] : b[k];
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
      slashUp: [[0, { f: 'idle', fh: [15, 21], bh: [5, 19], ang: 75 }], [0.25, { f: 'idle', fh: [15, 22], bh: [5, 19], ang: 80 }], [0.5, { f: 'lean', fh: [15, 11], bh: [3, 18], ang: -105 }, 'out'], [0.7, { f: 'lean', fh: [14, 10], bh: [3, 18], ang: -125 }], [1, { f: 'idle', fh: [14, 20], bh: [4, 21], ang: 50 }, 'io']],
      slashBig: [[0, { f: 'back', fh: [6, 10], bh: [4, 12], ang: -175, wb: true, ab: true }], [0.35, { f: 'back', fh: [5, 9], bh: [4, 11], ang: -185, wb: true, ab: true }, 'io'], [0.55, { f: 'lean', fh: [18, 19], bh: [14, 19], ang: 45 }, 'out'], [0.75, { f: 'wide', fh: [17, 22], bh: [12, 21], ang: 90 }], [1, { f: 'idle', fh: [14, 20], bh: [4, 21], ang: 50 }, 'io']]
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
    twoHand: 3,
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [15, 18 + b], ang: -40 + sin(t * 1.5) * 3 }),
    run: s => ({ fh: [12 + s, 20], ang: 160, wb: true }),
    air: up => (up ? { f: 'jump', fh: [14, 14], ang: -70 } : { f: 'fall', fh: [15, 17], ang: -30 }),
    dash: { f: 'lean', fh: [11, 20], ang: 170, wb: true },
    moves: {
      slashDown: [[0, { f: 'back', fh: [12, 5], ang: -110 }], [0.28, { f: 'back', fh: [11, 4], ang: -125 }, 'io'], [0.48, { f: 'lean', fh: [17, 18], ang: 25 }, 'out'], [0.7, { f: 'lean', fh: [16, 21], ang: 55 }], [1, { f: 'idle', fh: [15, 18], ang: -40 }, 'io']],
      stab: [[0, { f: 'idle', fh: [12, 17], ang: 0 }], [0.3, { f: 'idle', fh: [11, 17], ang: 0 }], [0.5, { f: 'lean', fh: [19, 16], ang: 0 }, 'out'], [0.7, { f: 'lean', fh: [18, 16], ang: 0 }], [1, { f: 'idle', fh: [15, 18], ang: -40 }, 'io']],
      slashBig: [[0, { f: 'back', fh: [6, 16], ang: -175, wb: true, ab: true }], [0.35, { f: 'back', fh: [5, 16], ang: -185, wb: true, ab: true }, 'io'], [0.55, { f: 'lean', fh: [18, 16], ang: 0 }, 'out'], [0.75, { f: 'wide', fh: [15, 15], ang: 130 }], [1, { f: 'idle', fh: [15, 18], ang: -40 }, 'io']]
    }
  },
  // two-handed heavy: rests on the shoulder, lifts overhead, slams with a crouch
  hammer: {
    twoHand: 3,
    idle: (t, b) => ({ f: b ? 'idle2' : 'wide', fh: [15, 19 + b], ang: 62 + sin(t * 1.2) * 3 }),
    run: s => ({ fh: [9, 20 + Math.abs(s)], ang: 165, wb: true, ab: true }),
    air: up => (up ? { f: 'jump', fh: [14, 13], ang: -70 } : { f: 'fall', fh: [15, 16], ang: -20 }),
    dash: { f: 'lean', fh: [11, 19], ang: 165, wb: true },
    moves: {
      smash: [[0, { f: 'wide', fh: [15, 19], ang: 62 }], [0.4, { f: 'back', fh: [6, 10], ang: -235, wb: true, ab: true }, 'io'], [0.58, { f: 'crouch', fh: [17, 21], ang: 60 }, 'in'], [0.8, { f: 'crouch', fh: [17, 22], ang: 72 }], [1, { f: 'wide', fh: [15, 19], ang: 62 }, 'io']],
      smashBig: [[0, { f: 'wide', fh: [15, 19], ang: 62 }], [0.45, { f: 'back', fh: [5, 8], ang: -250, wb: true, ab: true }, 'io'], [0.6, { f: 'crouch', fh: [18, 21], ang: 65 }, 'in'], [0.85, { f: 'crouch', fh: [18, 22], ang: 75 }], [1, { f: 'wide', fh: [15, 19], ang: 62 }, 'io']]
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
  // two-handed long staff held mid-shaft: vertical at rest, thrusts and sweeps
  staff: {
    twoHand: 5,
    slide: -9,
    idle: (t, b) => ({ f: b ? 'idle2' : 'idle', fh: [14, 17 + b], ang: -95 + sin(t * 1.3) * 3 }),
    run: s => ({ fh: [13, 18], ang: -20 + s * 6 }),
    air: up => (up ? { f: 'jump', fh: [14, 14], ang: -120 } : { f: 'fall', fh: [14, 16], ang: -60 }),
    dash: { f: 'lean', fh: [13, 18], ang: 10 },
    moves: {
      stab: [[0, { f: 'idle', fh: [11, 17], ang: 0 }], [0.3, { f: 'back', fh: [10, 17], ang: 0 }], [0.5, { f: 'lean', fh: [19, 17], ang: 0 }, 'out'], [0.7, { f: 'lean', fh: [18, 17], ang: 0 }], [1, { f: 'idle', fh: [14, 17], ang: -95 }, 'io']],
      slashUp: [[0, { f: 'idle', fh: [15, 21], ang: 40 }], [0.25, { f: 'idle', fh: [15, 21], ang: 45 }], [0.5, { f: 'lean', fh: [15, 12], ang: -80 }, 'out'], [0.7, { f: 'lean', fh: [14, 11], ang: -100 }], [1, { f: 'idle', fh: [14, 17], ang: -95 }, 'io']],
      stabBig: [[0, { f: 'back', fh: [11, 16], ang: -180 }], [0.4, { f: 'back', fh: [11, 15], ang: -360 }, 'io'], [0.55, { f: 'lean', fh: [20, 17], ang: -360 }, 'out'], [0.75, { f: 'lean', fh: [19, 17], ang: -360 }], [1, { f: 'idle', fh: [14, 17], ang: -455 }, 'io']]
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
    ranged: [[0, { f: 'idle', fh: [14, 17], bh: [5, 19], ang: 20 }], [0.3, { f: 'back', fh: [14, 5], bh: [5, 19], ang: -75 }, 'io'], [0.45, { f: 'lean', fh: [19, 15], bh: [5, 19], ang: 0 }, 'out'], [0.7, { f: 'lean', fh: [18, 15], bh: [5, 19], ang: 0 }], [1, { f: 'idle', fh: [14, 19], bh: [5, 20], ang: 30 }, 'io']],
    fireAt: 0.42
  }
};
const styleOf = type => STYLES[type] || STYLES[STYLE_OF[type]] || STYLES.sword;
export const fireAt = type => styleOf(type).fireAt || 0;

// nunchuck spin move: hand circles the shoulder, weapon whirls
function spinPose(p, turns, big) {
  const th = -Math.PI / 2 + p * Math.PI * 2 * turns;
  return { f: big ? 'wide' : p < 0.5 ? 'lean' : 'idle', fh: [12 + Math.cos(th) * 5, 15 + Math.sin(th) * 4], bh: [5, 19], ang: -180 + p * 360 * (turns + 1), wb: Math.cos(th) < -0.2, ab: Math.cos(th) < -0.2 };
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

// Ladders: we see the hero from behind, cape and all. The weapon rides sheathed across the back
// under the cape (hilt over the right shoulder, tip out past the left hip), both hands go hand-over-hand up the
// rungs, and the legs and cape only move while you actually climb.
export const SHEATH = { at: [7, 6], ang: 112 };
const BACK_SHEATH = { at: [12, 14], ang: 128 };
export const DRAW_TIME = 0.18;
function climbPose(h) {
  const ph = Math.floor((h.climbT || 0) * 6) % 2,
    lift = ph ? 0 : 3; // short reach: hands grip the rungs beside the head
  return { back: ph, fh: [15, 7 + lift], bh: [1, 10 - lift], sh: BACK_SHOULDERS, ang: BACK_SHEATH.ang, at: BACK_SHEATH.at, wb: true, ab: false, sheath: true };
}

// back view, 17x25 like the hero sheet: spiky hair, red headband with tails, cape over the body
const BACK_PAL = { a: C.ink, b: '#ffc15a', c: '#f08a2c', d: '#c4501f', e: '#c4363e', f: '#7a1f2b', g: '#f2c3a0', i: '#d98e6e', k: '#2b2442', l: '#8a4f22', m: '#3e3a5c', n: '#5d2f14' };
const BACK_TOP = [
  '.a...a...a.......',
  'aba.aba.abaa.....',
  'acbaacbaaccba....',
  'acccbcccbcccbaa..',
  'adccccccccccccba.',
  'addcccccccccccca.',
  'addeeeeeeeeeeeeaa',
  'adfffffffffffffea',
  'addcccccccccccdae',
  'addccccccccccccda',
  '.adccbcccbcccda..',
  '.agdcccbcccccdga.',
  '..addccccccddda..',
  '...adddddddda....',
  '....aiiiiiiia....'
];
const BACK_LOW = [
  [
    '..aeeeeeeeeeeea..',
    '.aeeeeeeeeeeeeea.',
    '.aeeefeeeeefeeea.',
    '.afeeefeeeefeeea.',
    '.afeeefeeeeefeea.',
    '.afeeeefeeeefeea.',
    '..afeefeeeefefa..',
    '..aafaafaafaaa...',
    '...amka..amka....',
    '...anlna.amka....',
    '....aaa..anlna...'
  ],
  [
    '..aeeeeeeeeeeea..',
    '.aeeeeeeeeeeeeea.',
    '.aeeefeeeeefeeea.',
    '.aeeefeeeeefeefa.',
    '.aefeeefeeeefefa.',
    '.aefeeefeeeefefa.',
    '..afefeeeeefefa..',
    '...aaafaafaafaa..',
    '....amka..amka...',
    '....amka.anlna...',
    '...anlna..aaa....'
  ]
];
const BACK_SHOULDERS = [[3, 14], [13, 14]];
const backFrames = [];
function backFrame(i) {
  if (backFrames[i]) return backFrames[i];
  const cv = document.createElement('canvas');
  cv.width = 17;
  cv.height = 25;
  const g = cv.getContext('2d');
  [...BACK_TOP, ...BACK_LOW[i]].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = BACK_PAL[row[x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  });
  return (backFrames[i] = cv);
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
function drawArm(x0, y0, x1, y1, front) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n)]);
  X.fillStyle = C.ink;
  for (const [x, y] of pts) X.fillRect(x - 1, y - 1, 4, 4);
  pts.forEach(([x, y], i) => {
    X.fillStyle = i < n * 0.45 ? (front ? C.skin : C.skinM) : front ? C.mist : C.fog;
    X.fillRect(x, y, 2, 2);
  });
  // hand
  X.fillStyle = C.ink;
  X.fillRect(Math.round(x1) - 1, Math.round(y1) - 1, 4, 4);
  X.fillStyle = front ? C.skin : C.skinM;
  X.fillRect(Math.round(x1), Math.round(y1), 2, 2);
}

export function drawHeroAnimated(h, t) {
  const Hh = A.hero;
  const pose = heroPose(h, t);
  const face = pose.back != null ? 1 : pose.flip ? -h.face : h.face; // the back view is drawn as is
  const sx0 = Math.round(h.x + h.w / 2 - Hh.w / 2),
    sy0 = Math.round(h.y + h.h - 24);
  const W2 = (x, y) => [face > 0 ? sx0 + x : sx0 + Hh.w - 1 - x, sy0 + y];
  const sh = pose.sh || Hh.shoulders[pose.f] || Hh.shoulders.idle;
  const w = h.weapon,
    L = lookOf(w, frameOfLook(w.look, t)),
    st = styleOf(w.type);
  // front hand; two-handed styles put the back hand on the handle
  const fh = W2(pose.fh[0], pose.fh[1]);
  const angW = face > 0 ? pose.ang : 180 - pose.ang; // world-space angle
  const rad = (angW * Math.PI) / 180;
  // two-handed: back hand on the handle (toward the pommel), or further up the shaft for the staff
  let bh;
  if (st.twoHand && !pose.sheath) {
    const d = st.slide ? st.twoHand : -st.twoHand;
    bh = [fh[0] + Math.cos(rad) * d, fh[1] + Math.sin(rad) * d];
  } else bh = W2(pose.bh ? pose.bh[0] : 5, pose.bh ? pose.bh[1] : 20);
  const shB = W2(sh[0][0], sh[0][1]),
    shF = W2(sh[1][0], sh[1][1]);
  // weapon origin: grip at the hand, optionally slid along the shaft
  const slide = st.slide || 0;
  const back = pose.sheath ? W2(...(pose.at || SHEATH.at)) : null;
  const wx = back ? back[0] : fh[0] + 1 - Math.cos(rad) * slide,
    wy = back ? back[1] : fh[1] + 1 - Math.sin(rad) * slide;
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
  if (!flashing && !backView) drawArm(shB[0], shB[1], bh[0], bh[1], false);
  if (pose.wb) tip = drawWeapon();
  if (pose.ab && !flashing) drawArm(shF[0], shF[1], fh[0], fh[1], true);
  if (!flashing) {
    if (pose.back != null) X.drawImage(backFrame(pose.back), sx0, sy0);
    else frame(Hh.im, Hh.frames[pose.f] ?? 0, Hh.w, Hh.h, sx0, sy0, face < 0);
  }
  if (backView && !flashing) drawArm(shB[0], shB[1], bh[0], bh[1], false);
  if (!pose.wb) tip = drawWeapon();
  drawString();
  if (!pose.ab && !flashing) drawArm(shF[0], shF[1], fh[0], fh[1], true);
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
