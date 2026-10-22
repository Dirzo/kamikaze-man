// Combat feel numbers (pure, node-testable). How heavy each weapon type is decides how long the
// world freezes on a hit, how far the camera kicks, whether the struck foe is launched into the air,
// and how far a killing blow throws the body. The movement tuning (fall gravity, sprint, swing slow,
// lunge, cancels) sits here too so it can be tuned in one place.
import { CLASS_OF } from './meta.js';

// 0 light, 1 medium, 2 long/heavy, 3 heaviest
export const WEIGHT = {
  dagger: 0, shuriken: 0, nunchucks: 1, sword: 1, katana: 1, bow: 1, wand: 1, boomerang: 1,
  scythe: 2, staff: 2, spear: 2, axe: 3, hammer: 3
};
export const weightOf = type => WEIGHT[type] ?? 1;

const STOP = [0.02, 0.04, 0.05, 0.07]; // seconds of hit-stop per weight
const KICK = [1, 2, 2, 3]; // px the camera kicks in the hit direction
export const STOP_MAX = 0.12;

// the freeze and camera kick for one connecting hit
export function hitFeel(type, { crit = false, big = false, chain = false } = {}) {
  const w = chain ? 0 : weightOf(type);
  const stop = Math.min(STOP_MAX, STOP[w] * (big ? 1.5 : 1) * (crit ? 2 : 1));
  const kick = Math.min(4, KICK[w] + (big ? 1 : 0) + (crit ? 1 : 0));
  return { stop, kick, w };
}

// how a struck (non-boss) foe reacts: light hits flinch, heavy weapons and finishers launch it so
// follow-up hits juggle it in the air
export function reaction(w, { big = false, crit = false, elite = false, chip = false } = {}) {
  if (chip) return { stun: 0.03, launch: 0 };
  const heavy = big || w >= 2;
  let launch = heavy ? (w >= 3 ? 170 : w >= 2 ? 140 : 125) * (big ? 1.15 : 1) : crit ? 110 : 0;
  if (elite) launch *= 0.5;
  return { stun: heavy || crit ? 0.24 : 0.1, launch: Math.round(launch) };
}

// a killing blow: the more it overkills (and the heavier the weapon) the further the body flies.
// over = overkill as a fraction of the foe's max health
export function killLaunch(over, w, big = false) {
  const k = Math.min(1.5, Math.max(0, over) * 2);
  const vx = 70 + k * 90 * (1 + w * 0.4) + (big ? 60 : 0);
  return { vx: Math.round(vx), vy: -Math.round(120 + (vx - 70) * 0.4), launched: vx >= 150 };
}

// the down-strike in the air: what it does depends on the weapon's class
export const PLUNGE = {
  blades: { kind: 'pogo', fall: 330, mult: 1.2, bounce: 0.9 },
  blunt: { kind: 'pound', fall: 420, mult: 1, wave: 1.6, radius: 40 },
  ranged: { kind: 'volley', angles: [0.7, 1.0, 1.3], mult: 0.8, hop: 140 }
};
export const plungeOf = type => PLUNGE[CLASS_OF[type] || 'blades'];

// movement and swing control
export const MOVE = {
  fallGravity: 1.6, // falling is faster than rising (SMW)
  apexGravity: 0.5, // a short hang at the top while jump is held
  apexBand: 40, // |vy| below this counts as the top of the jump
  maxFall: 360,
  sprintAfter: 0.8, // seconds of running before the sprint kicks in
  sprintSpeed: 1.25,
  sprintJump: 1.1,
  skidSpeed: 80, // turning round faster than this skids
  swingSlow: 0.4, // run speed during a melee swing's active frames
  swingSlowWind: 0.7, // and during the rest of the swing
  lunge: 3, // px forward per swing, finisher below
  lungeBig: 8,
  lungeTime: 0.08,
  attackBuffer: 0.3, // a press this long before the swing ends still comes out
  specialBuffer: 0.45,
  touchDmg: 0.25, // walking into a riled-up resident: this share of its hit
  lookAhead: 0.12, // of the screen width, in the direction you face
  lookAheadSprint: 0.16
};

// heavy weapons hang at the top of the swing before coming down: p (0..1 of the swing) is remapped
// so the pose and the hitbox hold still just before the active window, then catch up. The swing's
// total length does not change.
export function windHang(type, p, start) {
  if (weightOf(type) < 3) return p;
  const hold = 0.12, a = Math.max(0, start - 0.22);
  if (p < a) return p;
  if (p < a + hold) return a + (p - a) * 0.15; // nearly frozen at the top
  const done = a + hold * 0.15; // where the hold left the pose
  return done + ((p - a - hold) / (1 - a - hold)) * (1 - done);
}
