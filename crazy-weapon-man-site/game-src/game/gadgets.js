// Speed gadgets (Sonic): springs, dash panels, rope swings and ziplines, placed by
// data/maps.js. None of them is ever needed to finish a stage; they pay you for running it well:
// a spring throws you up onto the high route, a dash panel fills your momentum, a rope swing flings
// you over a chasm faster than the stepping ledge, and a zipline slides you over a pit at speed.
import { C } from '../config.js';
import { rect, text } from '../engine/gfx.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { world } from './world.js';
import { cx } from './physics.js';
import { burst, emit, shake, callout } from './fx.js';
import { terrainArt } from './ambience.js';
import { X } from '../engine/gfx.js';

export const GADGET = {
  spring: { up: 430, upHeld: 500 }, // launch speeds (a plain jump is 262)
  boost: { burst: 1.3, time: 0.8 }, // run speed times this for `time` seconds, and full momentum
  rope: { gravity: 760, pump: 1.4, fling: 1.15, hop: 150, hold: 3 }, // pump: rad/s² for pushing with the swing
  zip: { min: 140, accel: 420, max: 340, hop: 210 },
  loop: { min: 200, exit: 1.1 }, // run speed you need to go round (slower and you run under it), and the burst out
  bumper: { out: 260, up: 330 } // it bats you on at least `out` and up at `up`
};
const cool = new WeakMap(); // gadget -> world.t it can fire again

// once a step, before the hero's own movement; true when a rope or zipline has the hero
export function updateGadgets(h, dt) {
  const list = world.map?.gadgets;
  h.boostT = Math.max(0, (h.boostT || 0) - dt);
  h.ropeCd = Math.max(0, (h.ropeCd || 0) - dt);
  if (!list || h.dead) return false;
  for (const g of list) if (g.squash) g.squash = Math.max(0, g.squash - dt);
  if (h.rope) return swing(h, dt), true;
  if (h.zip) return slide(h, dt), true;
  if (h.loop) return runLoop(h, dt), true;
  const feet = h.y + h.h, hx = cx(h), hands = h.y + 2;
  for (const g of list) {
    if ((cool.get(g) || 0) > world.t) continue;
    if (g.kind === 'loop' && h.onGround && Math.abs(hx - g.x) < 6 && Math.abs(feet - g.y) < 2 && Math.abs(h.vx) >= GADGET.loop.min && !h.attack) {
      // fast enough: up the inside, over the top upside down, and back down
      h.loop = { g, a: 0, dir: Math.sign(h.vx), v: Math.abs(h.vx) };
      h.inv = Math.max(h.inv, 0.3);
      cool.set(g, world.t + 1);
      sfx.dash();
    } else if (g.kind === 'bumper' && Math.hypot(hx - g.x, h.y + h.h / 2 - g.y) < g.r + 9) {
      const dir = Math.sign(h.vx) || h.face;
      h.vx = dir * Math.max(Math.abs(h.vx), GADGET.bumper.out);
      h.vy = -GADGET.bumper.up;
      h.onGround = false;
      h.coyote = 0;
      h.jumpHeld = false;
      h.hopped = false; // the double jump comes back
      h.mom = Math.max(h.mom || 0, 0.7);
      g.squash = 0.2;
      cool.set(g, world.t + 0.25);
      sfx.jump();
      shake(0.2);
      burst(g.x, g.y, 8, 'twinkle', ['paper', 'gold', 'pink']);
    } else if (g.kind === 'spring' && Math.abs(hx - g.x) < 10 && h.vy >= 0 && feet >= g.y - 8 && feet <= g.y + 1) {
      h.vy = -(input.held('jump') ? GADGET.spring.upHeld : GADGET.spring.up);
      h.y = g.y - 8 - h.h;
      h.onGround = false;
      h.coyote = 0;
      h.jumpHeld = false; // letting go of jump can't cut the bounce short
      h.hopped = false;
      g.squash = 0.18;
      cool.set(g, world.t + 0.2);
      sfx.jump();
      burst(g.x, g.y - 4, 6, 'twinkle', ['paper', 'gold']);
    } else if (g.kind === 'boost' && h.onGround && Math.abs(hx - g.x) < 12 && Math.abs(feet - g.y) < 2) {
      h.mom = 1;
      h.sprint = true;
      h.boostT = GADGET.boost.time;
      h.face = g.dir;
      h.vx = g.dir * Math.max(Math.abs(h.vx), 200);
      cool.set(g, world.t + 0.6);
      sfx.dash();
      shake(0.25);
      for (let i = 0; i < 8; i++) emit(hx - g.dir * i * 3, feet - 2 - Math.random() * 18, 'streak', C.gold);
    } else if (g.kind === 'rope' && !h.onGround && !h.ropeCd) {
      // grab anywhere on the lower half of the rope
      const a = g.a || 0, ex = g.x + Math.sin(a) * g.len, ey = g.y + Math.cos(a) * g.len;
      const t = Math.max(0.5, Math.min(1, ((hx - g.x) * (ex - g.x) + (hands - g.y) * (ey - g.y)) / (g.len * g.len)));
      if (Math.hypot(g.x + (ex - g.x) * t - hx, g.y + (ey - g.y) * t - hands) < 10) grabRope(h, g);
    } else if (g.kind === 'zip' && !h.onGround && hx > g.x0 && hx < g.x1 - 16) {
      const ly = g.y0 + ((hx - g.x0) / (g.x1 - g.x0)) * (g.y1 - g.y0);
      if (Math.abs(hands - ly) < 7 && h.vy > -120) {
        h.zip = { g, s: Math.max(GADGET.zip.min, Math.abs(h.vx)) };
        h.attack = null;
        sfx.ui();
      }
    }
  }
  return false;
}

function grabRope(h, g) {
  const hx = cx(h), a = Math.atan2(hx - g.x, h.y + 2 - g.y);
  h.rope = { g, a, w: (h.vx * Math.cos(a) + h.vy * Math.sin(a)) / g.len, t: 0 };
  h.attack = null;
  sfx.ui();
}
// the pendulum: gravity pulls it back to hanging, pushing the way it swings pumps it higher, jump lets go
function swing(h, dt) {
  const R = h.rope, g = R.g, G = GADGET.rope, ax = input.axis();
  R.t += dt;
  R.w += (-(G.gravity / g.len) * Math.sin(R.a) + (ax && Math.sign(ax) === Math.sign(R.w || ax) ? ax * G.pump : 0)) * dt;
  R.a = Math.max(-1.4, Math.min(1.4, R.a + R.w * dt));
  g.a = R.a;
  const hx = g.x + Math.sin(R.a) * g.len, hy = g.y + Math.cos(R.a) * g.len;
  h.x = hx - h.w / 2;
  h.y = hy - 2;
  h.vx = Math.cos(R.a) * R.w * g.len;
  h.vy = -Math.sin(R.a) * R.w * g.len;
  if (Math.abs(R.w) > 0.2) h.face = Math.sign(R.w);
  h.onGround = false;
  if (input.take('jump') || R.t > G.hold) {
    h.vx *= G.fling;
    h.vy = Math.min(h.vy, 0) - G.hop;
    if (Math.abs(h.vx) > 120) h.mom = Math.max(h.mom || 0, 0.95);
    h.rope = null;
    h.ropeCd = 0.35;
    h.jumpHeld = false;
    sfx.jump();
  }
}
// round a loop: the feet follow the inside of the ring (gadgets drawn at g.x, g.y is the ground under
// it, r its inner radius) at the speed you came in with; out the bottom with full momentum
function runLoop(h, dt) {
  const L = h.loop, g = L.g;
  L.a += (Math.max(L.v, GADGET.loop.min) / g.r) * dt;
  const a = Math.min(L.a, Math.PI * 2), fx = g.x + L.dir * Math.sin(a) * g.r, fy = g.y - g.r + Math.cos(a) * g.r;
  h.x = fx - h.w / 2;
  h.y = fy - h.h;
  h.vx = L.dir * L.v * Math.cos(a);
  h.vy = -L.v * Math.sin(a);
  h.face = L.dir;
  h.onGround = false;
  h.loopAng = L.dir * a;
  if (Math.random() < 0.5) emit(fx, fy, 'streak', C.paper);
  if (L.a >= Math.PI * 2) {
    h.loop = null;
    h.loopAng = 0;
    cool.set(g, world.t + 0.6); // (you come out where you went in)
    h.y = g.y - h.h;
    h.vx = L.dir * L.v * GADGET.loop.exit;
    h.vy = 0;
    h.onGround = true;
    h.mom = 1;
    h.sprint = true;
    h.boostT = Math.max(h.boostT || 0, 0.4);
    sfx.dash();
    if (g.intro && !g.done) (g.done = true), callout('LOOP!', 0, 0, C.gold, { follow: h, life: 40 });
  }
}
// downhill along the cable, faster and faster, flung off the far end with full momentum
function slide(h, dt) {
  const Z = h.zip, g = Z.g, G = GADGET.zip, len = Math.hypot(g.x1 - g.x0, g.y1 - g.y0), c = (g.x1 - g.x0) / len, s = (g.y1 - g.y0) / len;
  Z.s = Math.min(G.max, Z.s + (G.accel * Math.max(0.3, s) + 40) * dt);
  const hx = cx(h) + Z.s * c * dt;
  h.x = hx - h.w / 2;
  h.y = g.y0 + ((hx - g.x0) / (g.x1 - g.x0)) * (g.y1 - g.y0) - 2;
  h.vx = Z.s * c;
  h.vy = Z.s * s;
  h.face = 1;
  h.onGround = false;
  if (Math.random() < 0.5) emit(hx, h.y, 'twinkle', C.orange); // sparks off the trolley
  const off = hx >= g.x1 - 12, jump = input.take('jump');
  if (off || jump) {
    h.mom = 1;
    if (jump) (h.vy = -G.hop), sfx.jump();
    h.zip = null;
    h.ropeCd = 0.3;
  }
}

// ---------------------------------------------------------------- drawing (world space)
// bumper colours per world: rim and face (lily pads in the lagoon, a lantern in the bazaar, a
// blossom at the shrine...)
const BUMPER = [[C.red, C.coral], [C.blue, C.ice], [C.leaf, C.lime], [C.red, C.orange], [C.coral, C.paper], [C.slate, C.mist], [C.rust, C.orange], [C.violet, C.cream], [C.navy, C.sky], [C.gold, C.cream]];
function disc(x, y, r, col) {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    rect(Math.round(x) - w, y + dy, w * 2 + 1, 1, col);
  }
}
// a loop's ring, built once per zone and size: the zone's ground tile cut into a ring, its lip
// strip (grass, snow...) along the inside you run on, inked round the outside
const RINGS = new Map();
function loopArt(r, z) {
  const key = z + ':' + r;
  if (RINGS.has(key)) return RINGS.get(key);
  const T = terrainArt();
  if (!T || typeof document === 'undefined') return null;
  const rim = 10, size = (r + rim) * 2 + 2, c = document.createElement('canvas');
  c.width = c.height = size;
  const k = c.getContext('2d'), [gx, gy, gw, gh] = T.ground;
  for (let y = 0; y < size; y += gh) for (let x = 0; x < size; x += gw) k.drawImage(T.atlas, gx, gy, gw, gh, x, y, gw, gh);
  const img = k.getImageData(0, 0, size, size), d = img.data;
  let lip = null;
  if (T.lip) {
    const l = document.createElement('canvas');
    l.width = T.lip[2];
    l.height = T.lip[3];
    l.getContext('2d').drawImage(T.atlas, T.lip[0], T.lip[1], T.lip[2], T.lip[3], 0, 0, T.lip[2], T.lip[3]);
    lip = l.getContext('2d').getImageData(0, 0, T.lip[2], T.lip[3]);
  }
  const ink = [0x1a, 0x14, 0x28], mid = size / 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, dist = Math.hypot(x + 0.5 - mid, y + 0.5 - mid), depth = dist - r + 3;
    // the lip, its top rows poking inward over the running surface
    if (lip && depth >= 0 && depth < lip.height) {
      const u = Math.floor(((Math.atan2(y + 0.5 - mid, x + 0.5 - mid) + Math.PI) * r) % lip.width), j = (Math.floor(depth) * lip.width + u) * 4;
      if (lip.data[j + 3]) { d[i] = lip.data[j]; d[i + 1] = lip.data[j + 1]; d[i + 2] = lip.data[j + 2]; d[i + 3] = 255; continue; }
    }
    if (dist < r || dist >= r + rim) d[i + 3] = 0;
    else if (dist >= r + rim - 1) (d[i] = ink[0]), (d[i + 1] = ink[1]), (d[i + 2] = ink[2]);
  }
  k.putImageData(img, 0, 0);
  RINGS.set(key, c);
  return c;
}
const ZONE_ROPE = [C.wood, C.wood, C.leaf, C.red, C.wood, C.sand, C.stone, C.wood, C.wood, C.gold]; // vines in the lagoon, lantern cord in the bazaar
function line(x0, y0, x1, y1, col) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= n; i++) rect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1, col);
}
export function drawGadgets(t) {
  const list = world.map?.gadgets;
  if (!list) return;
  const x0 = world.cameraX - 40, x1 = world.cameraX + 520, z = world.zone || 0;
  for (const g of list) {
    const gx = g.x ?? g.x0;
    if (gx < x0 - 120 || gx > x1) continue;
    if (g.kind === 'loop') {
      const ring = loopArt(g.r, z);
      if (ring) X.drawImage(ring, Math.round(g.x - ring.width / 2), Math.round(g.y - g.r - ring.height / 2));
      if (g.intro && !g.done && Math.floor(t * 3) % 2) text('LOOP! RUN IN FAST', g.x, g.y - g.r * 2 - 24, C.gold, { align: 'center' });
    } else if (g.kind === 'bumper') {
      const col = BUMPER[z], s = g.squash ? 2 : 0, R = g.r + s, y = Math.round(g.y);
      disc(g.x, y, R + 1, C.ink);
      disc(g.x, y, R, col[0]);
      disc(g.x - 1, y - 1, R - 2, col[1]);
      disc(g.x, y, Math.max(1, R - 4), C.paper);
      disc(g.x, y, Math.max(1, R - 5), col[0]);
      rect(g.x - 3, y - R + 1, 2, 1, C.paper); // the shine
    } else if (g.kind === 'spring') {
      const sq = g.squash ? 3 : 0, top = g.y - 8 + sq;
      rect(g.x - 7, g.y - 3, 14, 3, C.ink);
      rect(g.x - 6, g.y - 2, 12, 1, C.stone);
      for (let y = top + 2; y < g.y - 3; y += 2) rect(g.x - 4, y, 8, 1, C.mist); // the coil
      rect(g.x - 8, top - 1, 16, 4, C.ink);
      rect(g.x - 7, top, 14, 2, C.red);
      rect(g.x - 7, top, 14, 1, C.coral);
      if (g.intro && Math.floor(t * 3) % 2) text('SPRING!', g.x, top - 14, C.gold, { align: 'center' });
    } else if (g.kind === 'boost') {
      rect(g.x - 12, g.y - 2, 24, 2, C.ink);
      for (let i = 0; i < 3; i++) {
        const on = Math.floor(t * 10 - i) % 3 === 0, cxp = g.x - 7 + i * 6;
        const col = on ? C.cream : C.orange;
        rect(cxp, g.y - 4, 2, 1, col);
        rect(cxp + 1, g.y - 3, 2, 1, col);
        rect(cxp, g.y - 2, 2, 1, col);
      }
      if (g.intro && Math.floor(t * 3) % 2) text('DASH PANEL!', g.x, g.y - 22, C.gold, { align: 'center' });
    } else if (g.kind === 'rope') {
      const a = world.hero?.rope?.g === g ? g.a : (g.a = (g.a || 0) * 0.98 + Math.sin(t * 1.6 + g.x) * 0.004), ex = g.x + Math.sin(a) * g.len, ey = g.y + Math.cos(a) * g.len;
      rect(g.x - 3, g.y - 2, 6, 3, C.ink);
      rect(g.x - 2, g.y - 1, 4, 1, C.stone);
      line(g.x, g.y, ex, ey, ZONE_ROPE[z]);
      line(g.x + 1, g.y, ex + 1, ey, C.ink);
      rect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3, ZONE_ROPE[z]); // the knot you grab
      if (z === 2) for (let k = 1; k < 4; k++) rect(Math.round(g.x + (ex - g.x) * k / 4) + 1, Math.round(g.y + (ey - g.y) * k / 4), 2, 1, C.lime); // leaves on the vine
    } else if (g.kind === 'zip') {
      for (const [px, py] of [[g.x0, g.y0], [g.x1, g.y1]]) {
        rect(px - 1, py - 4, 3, 60, C.ink);
        rect(px, py - 3, 1, 58, C.wood);
      }
      line(g.x0, g.y0, g.x1, g.y1, C.ink);
      line(g.x0, g.y0 - 1, g.x1, g.y1 - 1, z === 3 ? C.gold : C.mist);
      if (z === 3) for (let k = 1; k < 8; k++) { const lx = g.x0 + (g.x1 - g.x0) * k / 8, ly = g.y0 + (g.y1 - g.y0) * k / 8; rect(Math.round(lx) - 1, Math.round(ly) + 1, 3, 3, k % 2 ? C.red : C.orange); } // lanterns on the bazaar's cable
      if (!world.hero?.zip) rect(g.x0 + 6, g.y0, 4, 3, C.slate); // the trolley waits at the top
    }
  }
}
