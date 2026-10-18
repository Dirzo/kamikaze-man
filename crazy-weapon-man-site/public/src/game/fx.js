// Effects: pixel particles, hit sparks, damage numbers (stacked per target, MapleStory style),
// short callouts, screenshake (trauma) and hit-stop. All in screen pixels, palette colours only.
import { C } from '../config.js';
import { X, rect, px, text, view } from '../engine/gfx.js';
import { fmt } from '../data/curve.js';

const parts = [];
const sparks = [];
const numbers = [];
const callouts = [];
export const feel = { trauma: 0, stop: 0, frame: 0 };

// ---------------------------------------------------------------- particles
export function emit(x, y, kind, col) {
  if (parts.length > 320) parts.shift();
  const r = Math.random;
  const p = { x, y, vx: 0, vy: 0, g: 0, life: 24, col, size: 1, kind: 'dot', ph: 0 };
  switch (kind) {
    case 'ember': p.vx = (r() - 0.5) * 18; p.vy = -20 - r() * 28; p.life = 20 + r() * 16; break;
    case 'frost': p.vx = (r() - 0.5) * 12; p.vy = 7 + r() * 9; p.life = 26 + r() * 16; p.kind = r() < 0.3 ? 'plus' : 'dot'; break;
    case 'spark': p.vx = (r() - 0.5) * 130; p.vy = (r() - 0.5) * 130; p.life = 5 + r() * 6; break;
    case 'mote': p.vx = (r() - 0.5) * 30; p.vy = (r() - 0.5) * 30; p.life = 22 + r() * 18; break;
    case 'bubble': p.vx = (r() - 0.5) * 9; p.vy = -12 - r() * 12; p.life = 28 + r() * 18; p.kind = 'ring'; break;
    case 'twinkle': p.life = 14 + r() * 12; p.kind = 'plus'; break;
    case 'suck': {
      const a = r() * Math.PI * 2,
        d = 7 + r() * 5;
      p.x += Math.cos(a) * d;
      p.y += Math.sin(a) * d;
      p.vx = (-Math.cos(a) * d) / 0.27;
      p.vy = (-Math.sin(a) * d) / 0.27;
      p.life = 16;
      break;
    }
    case 'drip': p.vy = 9; p.g = 140; p.life = 26 + r() * 10; break;
    case 'streak': p.vx = -55 - r() * 48; p.vy = (r() - 0.5) * 6; p.life = 12 + r() * 8; p.kind = 'streak'; break;
    case 'pebble': p.vx = (r() - 0.5) * 30; p.vy = -18; p.g = 220; p.life = 22; break;
    case 'ghost': p.vx = (r() - 0.5) * 15; p.vy = -15 - r() * 12; p.life = 30 + r() * 14; p.kind = 'ghost'; p.ph = r() * 6; break;
    case 'smoke': p.vx = (r() - 0.5) * 12; p.vy = -11 - r() * 9; p.life = 30 + r() * 12; p.size = 2; break;
    case 'spore': p.vx = (r() - 0.5) * 18; p.vy = -5 + (r() - 0.5) * 12; p.life = 34 + r() * 12; break;
    case 'steam': p.vx = (r() - 0.5) * 15; p.vy = -24 - r() * 18; p.life = 18 + r() * 10; p.size = r() < 0.5 ? 2 : 1; break;
    case 'rain': p.y -= 10; p.x += (r() - 0.5) * 8; p.vy = 54; p.life = 12; p.kind = 'streakv'; break;
    case 'note': p.vx = 9 + r() * 12; p.vy = -21; p.life = 34; p.kind = 'note'; break;
    case 'confetti': p.vx = (r() - 0.5) * 72; p.vy = -48 - r() * 36; p.g = 180; p.life = 30; p.kind = r() < 0.5 ? 'dot' : 'streak'; break;
    case 'flame': p.vx = (r() - 0.5) * 12; p.vy = -30 - r() * 24; p.life = 12 + r() * 8; p.size = r() < 0.4 ? 2 : 1; break;
    case 'chip': p.vx = (r() - 0.5) * 110; p.vy = -40 - r() * 70; p.g = 360; p.life = 18 + r() * 12; p.size = r() < 0.3 ? 2 : 1; break;
    case 'dust': p.vx = (r() - 0.5) * 40; p.vy = -6 - r() * 10; p.life = 14 + r() * 8; break;
  }
  p.max = p.life;
  parts.push(p);
}
export function burst(x, y, n, kind, cols) {
  for (let i = 0; i < n; i++) emit(x, y, kind, C[cols[i % cols.length]] || cols[i % cols.length]);
}

const NOTE = [[1, 0], [2, 0], [1, 1], [1, 2], [0, 3], [1, 3]];
const GHOST = [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2]];

// ---------------------------------------------------------------- sparks
export function spark(x, y, { crit = false, big = false, col = C.cream, diag = Math.random() < 0.5 } = {}) {
  if (sparks.length > 30) sparks.shift();
  sparks.push({ x, y, t: 0, crit, big, col, diag });
}

// ---------------------------------------------------------------- numbers
// Hits on one target within 0.6 s stack upward in a column; tiny chip damage folds into the top one.
export function damageNumber(target, n, { crit = false, col = null, chip = false } = {}) {
  const now = feel.frame;
  const stack = numbers.filter(d => d.tid === target.id && now - d.born < 36);
  if ((chip && stack.length) || stack.length >= 5) {
    const top = stack[stack.length - 1];
    top.total += n;
    top.s = fmt(top.total);
    top.life = Math.max(top.life, 40);
    return;
  }
  const prev = stack[stack.length - 1];
  numbers.push({
    tid: target.id,
    born: now,
    total: n,
    s: fmt(n),
    x: prev ? prev.x : target.x + target.w / 2,
    y: prev ? prev.y - 10 : target.y - 6,
    life: crit ? 62 : 48,
    max: crit ? 62 : 48,
    col: col || (crit ? C.gold : C.paper),
    crit
  });
  if (numbers.length > 40) numbers.shift();
}
export function heroDamageNumber(hero, n) {
  numbers.push({ tid: -1, born: feel.frame, total: n, s: fmt(n), x: hero.x + hero.w / 2, y: hero.y - 6, life: 50, max: 50, col: C.red, crit: false });
}

// short centred or floating callouts ("WAVE CLEAR", "CLANG"), max 3 alive, no duplicates
export function callout(s, x, y, col = C.paper, { big = false, life = 70, follow = null } = {}) {
  if (callouts.some(c => c.s === s && c.life > c.max - 30)) return;
  while (callouts.length >= 3) callouts.shift();
  callouts.push({ s, x, y, col, big, life, max: life, follow });
}

// ---------------------------------------------------------------- feel
export function shake(amount) {
  feel.trauma = Math.min(1, Math.max(feel.trauma, amount));
}
export function hitstop(sec) {
  feel.stop = Math.max(feel.stop, sec);
}

// ---------------------------------------------------------------- update / draw
export function updateFx(dt) {
  feel.frame++;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.vy += p.g * dt;
    p.x += (p.vx + (p.kind === 'ghost' ? Math.sin((p.ph += 0.2)) * 12 : 0)) * dt;
    p.y += p.vy * dt;
    if (--p.life <= 0) parts.splice(i, 1);
  }
  for (let i = sparks.length - 1; i >= 0; i--) if (++sparks[i].t > (sparks[i].big ? 11 : sparks[i].crit ? 9 : 7)) sparks.splice(i, 1);
  for (let i = numbers.length - 1; i >= 0; i--) {
    const d = numbers[i];
    d.y -= d.life > d.max - 10 ? 0.9 : 0.25;
    if (--d.life <= 0) numbers.splice(i, 1);
  }
  for (let i = callouts.length - 1; i >= 0; i--) {
    const c = callouts[i];
    if (!c.big) c.y -= 0.3;
    if (--c.life <= 0) callouts.splice(i, 1);
  }
  // trauma -> whole-pixel rumble (alternating sides every 2 frames)
  feel.trauma = Math.max(0, feel.trauma - 2.4 * dt);
  const amp = Math.round(4 * feel.trauma * feel.trauma);
  view.ox = amp ? (Math.floor(feel.frame / 2) % 2 ? amp : -amp) : 0;
  view.oy = amp > 1 ? (Math.floor(feel.frame / 4) % 2 ? 1 : -1) * Math.ceil(amp / 2) : 0;
}

export function drawParticles() {
  for (const p of parts) {
    if (p.life < p.max * 0.3 && p.life & 1) continue; // thin out instead of fading
    const x = Math.round(p.x),
      y = Math.round(p.y);
    X.fillStyle = p.col;
    if (p.kind === 'plus') {
      X.fillRect(x, y - 1, 1, 3);
      X.fillRect(x - 1, y, 3, 1);
    } else if (p.kind === 'ring') {
      X.fillRect(x, y - 1, 1, 1);
      X.fillRect(x - 1, y, 1, 1);
      X.fillRect(x + 1, y, 1, 1);
      X.fillRect(x, y + 1, 1, 1);
    } else if (p.kind === 'streak') X.fillRect(x, y, 2, 1);
    else if (p.kind === 'streakv') X.fillRect(x, y, 1, 2);
    else if (p.kind === 'note') for (const [dx, dy] of NOTE) X.fillRect(x + dx, y + dy, 1, 1);
    else if (p.kind === 'ghost') for (const [dx, dy] of GHOST) X.fillRect(x + dx, y + dy, 1, 1);
    else X.fillRect(x, y, p.size, p.size);
  }
}

export function drawSparks() {
  for (const s of sparks) {
    const f = Math.floor(s.t / 2),
      x = Math.round(s.x),
      y = Math.round(s.y);
    const len = s.big ? [4, 9, 13, 15, 16, 16][f] : s.crit ? [3, 6, 8, 9, 9][f] : [2, 4, 5, 5][f];
    if (len == null) continue;
    const gap = f === 0 ? 0 : f === 1 ? 1 : f === 2 ? 2 : len - 1;
    const straight = [[1, 0], [-1, 0], [0, 1], [0, -1]],
      diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const rays = s.crit || s.big ? [...straight, ...diag] : s.diag ? diag : straight;
    if (f <= 1) {
      rect(x - 2, y - 2, 5, 5, C.ink);
      rect(x - 1, y - 1, 3, 3, f === 0 ? C.paper : s.crit ? C.gold : s.col);
    }
    for (const [dx, dy] of rays) {
      const L = dx && dy ? Math.max(1, Math.round(len * 0.7)) : len;
      for (let k = gap + 1; k <= L; k++) px(x + dx * k, y + dy * k, k === L ? (s.crit ? C.gold : s.col) : f === 0 ? C.paper : s.crit ? C.cream : C.paper);
    }
  }
}

export function drawNumbers() {
  for (const d of numbers) {
    if (d.life < 10 && d.life & 1) continue;
    text(d.s, d.x, Math.round(d.y), d.col, { align: 'center' });
  }
  for (const c of callouts) {
    if (c.life < 12 && c.life & 1) continue;
    const x = c.follow ? c.follow.x + c.follow.w / 2 : c.x,
      y = c.follow ? c.follow.y - 18 - (c.max - c.life) * 0.3 : c.y;
    text(c.s, x, Math.round(y), c.col, { align: 'center', k: c.big ? 2 : 1 });
  }
}

export function clearFx() {
  parts.length = sparks.length = numbers.length = callouts.length = 0;
  feel.trauma = feel.stop = 0;
}
