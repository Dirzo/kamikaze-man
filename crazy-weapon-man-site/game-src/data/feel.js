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
  momentumTime: 1.1, // seconds of running one way from a standstill to full momentum
  momentumDecay: 2.2, // momentum lost per second on the ground with no direction held
  swingDrain: 0.3, // share of momentum a swing on the ground costs
  killMomentum: 0.12, // a kill at speed feeds the run
  topSpeed: 2.3, // run speed at full momentum, times the SPEED stat (about 260 px/s: Sonic pace)
  sprintAt: 0.85, // momentum from here on is a sprint: weapon on the back, hair streaming
  sprintJump: 1.1,
  rush: 1, // RUSH: extra damage at full momentum (scales up from half momentum): a running slash opens a fight, it doesn't end it
  runSlashAt: 0.5, // from this much momentum (where RUSH starts) a swing is a running slash: no slow, no momentum cost
  rushTough: 0.25, // the most RUSH elites, bosses and castle heads ever take
  hurtKeep: 0.5, // share of momentum a hit leaves you
  skidSpeed: 80, // turning round faster than this skids
  swingSlow: 0.4, // run speed during a melee swing's active frames
  swingSlowWind: 0.7, // and during the rest of the swing
  lunge: 3, // px forward per swing, finisher below
  lungeBig: 8,
  lungeTime: 0.08,
  attackBuffer: 0.3, // a press this long before the swing ends still comes out
  specialBuffer: 0.6, // long enough to outlast a hammer's wind-up
  touchDmg: 0.25, // walking into a riled-up resident: this share of its hit
  lookAhead: 0.1, // of the screen width ahead of you standing still or walking
  lookAheadTop: 0.25, // and at top speed (the lead grows with how fast you actually run)
  // slopes (physics.js, Sonic): momentum per second gained running downhill and lost running uphill,
  // per unit of steepness (1 = 45 degrees), and how hard a slope rolls you down it with nothing held
  slopeGain: 1.6,
  slopeDrain: 0.8,
  slopeRoll: 520,
  // charge dash (Sonic's spin dash): hold DOWN and tap DASH to rev, let go of DOWN to launch
  revMax: 3, // revs
  revBurst: 0.15, // extra run speed per rev for revTime after the launch
  revTime: 0.5
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

// SPEED (Sonic, Dead Cells): momentum (0..1) builds while you run one way, carries through jumps,
// bleeds away when you let go on the ground, and when you turn round it drains with the speed you
// actually still have (a skid, not a dead stop). accel is the ACCELERATION stat (builds faster).
//   push   running the way you're moving     ground  on the ground     swing  a melee swing on the ground
//   back   pushing against the way you're moving, at `left` share of the speed momentum gave you
export function momentumStep(mom, dt, { push, back = false, left = 0, ground = true, swing = false, accel = 0 }) {
  if (back) return Math.min(mom, Math.max(0, left));
  if (push && !swing) return Math.min(1, mom + (dt / MOVE.momentumTime) * (1 + accel));
  if (!ground) return mom;
  return swing ? mom : Math.max(0, mom - dt * MOVE.momentumDecay);
}
// how fast you run: the SPEED stat, then momentum on top of it
export const runSpeed = (base, speed, mom) => base * (1 + speed) * (1 + mom * (MOVE.topSpeed - 1));
// the momentum a speed is worth (inverse of runSpeed): how much of the run is left in a skid
export const momentumOf = (v, base, speed = 0) => Math.max(0, Math.min(1, (Math.abs(v) / (base * (1 + speed)) - 1) / (MOVE.topSpeed - 1)));
// RUSH: hits at speed land harder, from nothing at half momentum to the full bonus at a sprint.
// tough foes (elites, bosses, castle heads) only ever take the old small bonus
export const rushMult = (mom, rush = 0, tough = false) => 1 + Math.max(0, Math.min(1, (mom - 0.5) / (MOVE.sprintAt - 0.5))) * Math.min(tough ? MOVE.rushTough + rush : Infinity, MOVE.rush + rush);
// how far the camera leads, as a share of the screen width, at speed v (top = top run speed)
export const camLead = (v, top) => MOVE.lookAhead + (MOVE.lookAheadTop - MOVE.lookAhead) * Math.max(0, Math.min(1, Math.abs(v) / top));

// The field combo (combat.js): out on the route, every hit that lands within `window` seconds of
// the last builds the count. Each one adds `step` damage (up to `max`) and takes `cut` seconds off
// the special's cooldown, and a special's hits cash the combo in at `cash` times its bonus. So a
// fight goes best as a run in, a string of hits through the pack and a special to finish it.
export const FIGHT = { window: 1.4, step: 0.06, max: 0.6, cut: 0.25, cash: 2 };
export const fightMult = (n, special = false) => 1 + Math.min(FIGHT.max, n * FIGHT.step) * (special ? FIGHT.cash : 1);

// The Dead Cells / Blasphemous pass (2026-10-31): the moves around the swing that keep a fight fast.
//   dodge     a dash through a real attack (not a body bump): slow-mo, a free dash, a burst of speed
//   stab      attacking out of a dash (or just after one): a lunging stab that keeps the dash's speed
//   tech      a dash breaks out of being hit once this much of the stagger is left
//   slam      knocked or launched foes that hit a wall (or bowl into each other) take a share of a hit
//   clear     the last foe of a real fight (`minHits` in the field combo) dies in slow-mo, then a
//             speed burst throws you back into the run
//   speedKill a kill from this much momentum on gives your dash back
export const POLISH = {
  dodge: { slow: 0.32, slowK: 0.35, mom: 0.35, specialCut: 0.6, window: 0.05 },
  stab: { mult: 1.25, speed: 0.92, after: 0.12, knock: 1.4 },
  tech: 0.12,
  slam: { wall: 0.5, bowl: 0.35, minV: 90, every: 0.35 },
  clear: { slow: 0.38, slowK: 0.3, minHits: 5, near: 220, zoom: 0.035 },
  speedKill: 0.5
};

// POISE (Blasphemous): elites and heavy beastkin stand up to a beating, then break. A broken foe
// reels for `broken` seconds and your next real hit is an EXECUTION for `exec` times the damage.
// Each hit takes `hit[weight]` poise (finishers x1.5, crits +1). Poise comes back after `regenAfter`
// seconds without a hit.
export const POISE = { max: 7, hit: [1, 1.5, 2, 3], big: 1.5, crit: 1, broken: 1.8, exec: 3, regenAfter: 2.5, execStop: 0.16, shards: 3 };
export const hasPoise = e => !!e && !e.boss && !e.swarmBoss && !e.swarm && (e.elite || !!e.d?.heavy || (e.d?.hp || 0) >= 1.6);
export function poiseHit(w, { big = false, crit = false, plunge = false } = {}) {
  return (POISE.hit[w] ?? 1.5) * (big || plunge ? POISE.big : 1) + (crit ? POISE.crit : 0);
}

// what a foe is made of, for the hit sound's material layer (audio.js MAT)
const MAT_RX = [
  ['shell', /turtle|snapper|shellback|dillo|pango|maw|roller|anvil/],
  ['squish', /frog|toad|newt|tadpole|lurker|moss|eyeball|wraith/],
  ['feather', /goose|gander|swan|honk|gosling|gsquire|fencer|gtoss|whirl|ggrave|berserk|owl|magpie|chicken|flyer|broombat|moth/],
  ['scale', /gecko|anole|skink|komodo|iguana|basilisk|chameleon|frilled|draco|wyrm|whelp|kobold|ember|elder|ninetail/],
  ['armor', /shieldbro|samurai|shogun|kingpin|monk|ninja|bearsmith|anviltoss|moltenboar|houndguard/]
];
export function materialOf(type = '') {
  for (const [m, rx] of MAT_RX) if (rx.test(type)) return m;
  return 'fur';
}
