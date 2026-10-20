// Chiptune audio: pulse (12.5/25/50%), triangle and 15-bit LFSR noise voices, pitch/volume stepped
// at 60 Hz like an old sound driver. sfx.* plays effects; music.play(id) runs a 4-channel song.
const FR = 1 / 60;
let ctx = null,
  bus = null,
  musicBus = null,
  waves = null,
  noise = null;
const settings = { sound: true, music: true };
try {
  Object.assign(settings, JSON.parse(localStorage.getItem('cwm-next-audio') || '{}'));
} catch (_) {}

export function audioOn() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  comp.connect(ctx.destination);
  bus = ctx.createGain();
  bus.gain.value = settings.sound ? 1.4 : 0;
  bus.connect(comp);
  musicBus = ctx.createGain();
  musicBus.gain.value = settings.music ? 0.55 : 0;
  musicBus.connect(comp);
  const pulse = duty => {
    const n = 64,
      re = new Float32Array(n),
      im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  };
  waves = { p12: pulse(0.125), p25: pulse(0.25), p50: pulse(0.5) };
  const lfsr = short => {
    const len = short ? 93 * 64 : 32767,
      b = ctx.createBuffer(1, len, ctx.sampleRate),
      d = b.getChannelData(0);
    let r = 1;
    for (let i = 0; i < len; i++) {
      const bit = (r ^ (r >> (short ? 6 : 1))) & 1;
      r = (r >> 1) | (bit << 14);
      d[i] = r & 1 ? 0.8 : -0.8;
    }
    return b;
  };
  noise = { long: lfsr(false), short: lfsr(true) };
  return ctx;
}
export function toggleSound() {
  settings.sound = !settings.sound;
  if (bus) bus.gain.value = settings.sound ? 1.4 : 0;
  save();
  return settings.sound;
}
export function toggleMusic() {
  settings.music = !settings.music;
  if (musicBus) musicBus.gain.value = settings.music ? 0.55 : 0;
  save();
  return settings.music;
}
export const audioSettings = settings;
function save() {
  try {
    localStorage.setItem('cwm-next-audio', JSON.stringify(settings));
  } catch (_) {}
}

// steps: [[hz, frames], ...]
export function chip(steps, { wave = 'p25', vol = 0.05, decay = 0.004, delay = 0, at = null, music = false } = {}) {
  if (!ctx || ctx.state !== 'running') return;
  const t0 = at != null ? at : ctx.currentTime + 0.005 + delay,
    o = ctx.createOscillator(),
    g = ctx.createGain();
  if (wave === 'tri') o.type = 'triangle';
  else o.setPeriodicWave(waves[wave]);
  let t = t0,
    v = vol;
  g.gain.setValueAtTime(0, t0);
  for (const [f, n] of steps)
    for (let i = 0; i < n; i++) {
      o.frequency.setValueAtTime(Math.max(20, f), t);
      g.gain.setValueAtTime(f > 0 ? Math.max(0, v) : 0, t);
      v -= decay;
      t += FR;
    }
  g.gain.setValueAtTime(0, t);
  o.connect(g);
  g.connect(music ? musicBus : bus);
  o.start(t0);
  o.stop(t + 0.02);
}
export function hiss(frames, { vol = 0.05, rate = 1, drop = 0, short = false, delay = 0, at = null, music = false } = {}) {
  if (!ctx || ctx.state !== 'running') return;
  const t0 = at != null ? at : ctx.currentTime + 0.005 + delay,
    s = ctx.createBufferSource(),
    g = ctx.createGain();
  s.buffer = short ? noise.short : noise.long;
  s.loop = true;
  let t = t0,
    v = vol,
    r = rate;
  for (let i = 0; i < frames; i++) {
    s.playbackRate.setValueAtTime(Math.max(0.05, r), t);
    g.gain.setValueAtTime(Math.max(0, v), t);
    v -= vol / frames;
    r *= 1 - drop;
    t += FR;
  }
  g.gain.setValueAtTime(0, t);
  s.connect(g);
  g.connect(music ? musicBus : bus);
  s.start(t0);
  s.stop(t + 0.02);
}
const N = m => 440 * Math.pow(2, (m - 69) / 12);
const arp = (notes, frames, opts) => chip(notes.map(m => [N(m), frames]), opts);

// anti-spam: an effect can't retrigger within `ms`
const last = {};
function gate(k, ms) {
  const t = performance.now();
  if (t - (last[k] || -1e9) < ms) return false;
  last[k] = t;
  return true;
}

export const sfx = {
  thud(heavy = false, honk = false) {
    if (!gate('thud', 65)) return;
    chip([[heavy ? 160 : 210, 1], [90, 2], [48, 4]], {wave:'tri', vol:0.09, decay:0.01});
    hiss(4, {vol:0.035, rate:0.23, drop:0.18});
    if (honk) chip([[420, 2], [330, 3]], {wave:'p25', vol:0.025, decay:0.004});
  },
  attack(type, q = 0) {
    if (!gate('atk', 40)) return;
    const v = 0.035 + q * 0.002,
      up = Math.min(q, 8);
    switch (type) {
      case 'sword':
      case 'katana':
      case 'scythe':
        hiss(4, { vol: v, rate: type === 'katana' ? 0.9 : 0.6, drop: 0.12 });
        chip([[N(79 + up), 1], [N(74 + up), 1], [N(67 + up), 2]], { wave: 'p12', vol: v * 0.8, decay: 0.006 });
        break;
      case 'dagger':
      case 'shuriken':
      case 'boomerang':
        chip([[N(88 + up), 1], [N(83 + up), 2]], { wave: 'p12', vol: v * 0.7, decay: 0.01 });
        hiss(2, { vol: v * 0.6, rate: 1.4, short: true });
        break;
      case 'nunchucks':
        chip([[N(76 + up), 1], [N(71 + up), 1]], { wave: 'p25', vol: v * 0.7 });
        break;
      case 'bow':
        chip([[N(72 + up), 1], [N(60 + up), 1], [N(55 + up), 3]], { wave: 'p50', vol: v * 0.8, decay: 0.008 });
        break;
      case 'wand':
        arp([72 + up, 76 + up, 79 + up, 84 + up], 1, { wave: 'p25', vol: v * 0.7, decay: 0.003 });
        break;
      case 'staff':
      case 'spear':
        arp([60 + up, 67 + up, 72 + up], 2, { wave: 'p50', vol: v * 0.75, decay: 0.003 });
        hiss(5, { vol: v * 0.4, rate: 0.3 });
        break;
      default:
        chip([[N(45), 2], [N(40), 2], [N(33), 3]], { wave: 'tri', vol: v * 2.2, decay: 0.012 });
        hiss(6, { vol: v * 1.1, rate: 0.25, drop: 0.1 });
    }
  },
  special() {
    if (!gate('sp', 150)) return;
    arp([60, 64, 67, 72, 76, 79, 84], 2, { wave: 'p25', vol: 0.055, decay: 0.002 });
    hiss(14, { vol: 0.05, rate: 0.35, drop: -0.03 });
  },
  hit(crit) {
    if (!gate(crit ? 'hitc' : 'hit', crit ? 30 : 35)) return;
    hiss(3, { vol: 0.05, rate: 0.7, drop: 0.15 });
    chip([[N(57), 1], [N(52), 1]], { wave: 'p50', vol: 0.03, decay: 0.01 });
    if (crit) arp([84, 91], 2, { wave: 'p12', vol: 0.05, decay: 0.002 });
  },
  kill(elite) {
    if (!gate('kill', 40)) return;
    if (elite) arp([79, 74, 67, 62, 55], 2, { wave: 'p25', vol: 0.05, decay: 0.002 });
    else arp([76, 71, 64], 1, { wave: 'p25', vol: 0.04, decay: 0.004 });
    hiss(5, { vol: 0.04, rate: 0.45, drop: 0.1 });
  },
  loot(q = 0) {
    if (!gate('loot', 80)) return;
    chip([[N(83), 4], [N(88), 12]], { wave: 'p50', vol: 0.05, decay: 0.002 });
    if (q >= 3) arp([88, 92, 95, 100], 2, { wave: 'p12', vol: 0.035, decay: 0.001, delay: 0.27 });
  },
  pickup() {
    if (!gate('pick', 60)) return;
    chip([[N(88), 2], [N(93), 3]], { wave: 'p12', vol: 0.03, decay: 0.004 });
  },
  enemyCast() {
    if (!gate('ecast', 90)) return;
    chip([[N(62), 2], [N(63), 2], [N(62), 2], [N(65), 2], [N(70), 3]], { wave: 'p12', vol: 0.028, decay: 0.001 });
  },
  enemyMelee() {
    if (!gate('emelee', 70)) return;
    hiss(4, { vol: 0.035, rate: 0.5, drop: 0.08 });
    chip([[N(50), 1], [N(45), 2]], { wave: 'p25', vol: 0.025, decay: 0.006 });
  },
  honk() {
    if (!gate('honk', 140)) return;
    chip([[740, 2], [622, 3], [523, 4]], { wave: 'p25', vol: 0.05, decay: 0.01 });
  },
  boom(pow = 1) {
    if (!gate('boom', 60)) return;
    hiss(Math.round(18 + pow * 6), { vol: 0.08 + Math.min(0.04, pow * 0.015), rate: 0.5, drop: 0.06 });
    chip([[N(40), 3], [N(36), 3], [N(31), 4]], { wave: 'tri', vol: 0.09, decay: 0.008 });
  },
  hurt() {
    if (!gate('hurt', 120)) return;
    chip([[N(67), 2], [N(60), 2], [N(55), 2], [N(48), 3]], { wave: 'p50', vol: 0.06, decay: 0.004 });
    hiss(4, { vol: 0.05, rate: 0.6 });
  },
  jump() {
    if (!gate('jump', 60)) return;
    chip([[N(60), 1], [N(64), 1], [N(67), 1], [N(72), 2]], { wave: 'p25', vol: 0.035, decay: 0.004 });
  },
  dash() {
    if (!gate('dash', 90)) return;
    hiss(7, { vol: 0.045, rate: 0.4, drop: -0.12 });
  },
  land() {
    if (!gate('land', 120)) return;
    hiss(3, { vol: 0.03, rate: 0.25 });
  },
  zone() {
    arp([60, 67, 72], 5, { wave: 'p25', vol: 0.05, decay: 0.001 });
    arp([64, 71, 76], 5, { wave: 'p50', vol: 0.035, decay: 0.001 });
  },
  levelUp() {
    arp([72, 76, 79, 84, 79, 84, 88], 3, { wave: 'p25', vol: 0.05, decay: 0.0008 });
    arp([60, 64, 67, 72, 67, 72, 76], 3, { wave: 'tri', vol: 0.06, decay: 0.0008 });
  },
  clear() {
    arp([67, 72, 76, 79, 84], 4, { wave: 'p25', vol: 0.055, decay: 0.0008 });
    arp([55, 60, 64, 67, 72], 4, { wave: 'tri', vol: 0.06, decay: 0.0008 });
  },
  ui(strong) {
    if (!gate('ui', 50)) return;
    arp(strong ? [88, 95] : [88], 2, { wave: 'p12', vol: 0.03, decay: 0.003 });
  },
  clang() {
    if (!gate('clang', 80)) return;
    chip([[N(96), 1], [N(91), 2]], { wave: 'p12', vol: 0.045, decay: 0.006 });
    hiss(2, { vol: 0.04, rate: 2, short: true });
  }
};

// ---------------------------------------------------------------- music
const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  // five-note scales: the shrine's in-sen, the ninja castle's hirajoshi, the mountain's pentatonic
  insen: [0, 1, 5, 7, 10],
  hirajoshi: [0, 2, 3, 7, 8],
  penta: [0, 2, 4, 7, 9]
};
const DRUMS = {
  march: 'K.h.S.h.K.hKS.h.',
  groove: 'K.h.K.hSK.h.K.hS',
  drive: 'K.hKS.hKK.hKS.hS',
  jig: 'K..hS..hK..hS.hh',
  slow: 'K.......S.....h.',
  swing: 'K..h.hS..hK..hS.',
  boss: 'KhKhSKhKKhKhSKSS',
  title: 'K...S...K.K.S...',
  // the zones' own kits: C sword clang / anvil, W woodblock, G gong, T taiko
  graveyard: 'K.h.S.h.K.hKS.hC',
  forest: 'K.W.K.hSK.W.K.hS',
  forge: 'K.CKS.hKK.CKS.hC',
  shrine: 'G.......W...W...',
  chant: 'G...h...T...h.h.',
  waltz: 'K...h...h...',
  taiko: 'T.hTS.hTT.hTS.TS',
  vault: 'KCh.SCh.KCKCS.CS'
};
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const songCache = new Map();
// spec: { key, scale, bpm, prog, drums } and optionally a zone's signature:
//   theme / themeB  the melody for the first / second half of the loop: one token per eighth note,
//                   a scale degree from the key (negative is lower), '-' holds, '.' rests
//   bar             steps per bar (16, or 12 for a waltz)   lead  the melody's wave
//   arp             'roll' (default), 'tremolo' (every step, surf style), 'waltz' (on the beats), 'off'
//   bass            'pulse' (default), 'drone' (one long root a bar) or 'gallop' (boss rock)
//   oct             the melody's octave
// Without a theme the melody is a seeded random motif, as it always was.
const tokens = s => (s || '').trim().split(/\s+/).filter(t => t !== '|');
export function buildSong(id, spec) {
  if (songCache.has(id)) return songCache.get(id);
  const sc = SCALES[spec.scale],
    L = sc.length,
    bar = spec.bar || 16,
    r = rng([...id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7));
  const deg = (d, oct = 0) => spec.key + sc[((d % L) + L) % L] + 12 * (Math.floor(d / L) + oct);
  const steps = Array.from({ length: 16 * bar }, () => []);
  const motif = [];
  if (!spec.theme)
    for (let i = 0; i < 32; i++) {
      const strong = i % 4 === 0;
      if (!strong && r() < 0.42) continue;
      const len = strong && r() < 0.4 ? 4 : r() < 0.5 ? 2 : 1;
      motif.push([i, Math.floor(r() * 5) - (strong ? 0 : 1), len]);
    }
  // a theme becomes notes: [step within its 4-bar phrase, degree, length in steps]
  const phrase = t => {
    const out = [], tk = tokens(t);
    tk.forEach((x, i) => {
      if (x === '-' || x === '.') return;
      let n = 1;
      while (tk[i + n] === '-') n++;
      out.push([i * 2, +x, n * 2]);
    });
    return out;
  };
  const A = phrase(spec.theme), B = spec.themeB ? phrase(spec.themeB) : A;
  // the bass sits two octaves down, or one for the low keys (it would be below hearing)
  const arp = spec.arp || 'roll', oct = spec.oct ?? 1, beat = bar / 4, lo = spec.key < 48 ? -1 : -2;
  for (let b = 0; b < 16; b++) {
    const chord = spec.prog[Math.floor(b / 2) % spec.prog.length],
      section = b >= 8 ? 1 : 0;
    for (let i = 0; i < bar; i++) {
      const s = b * bar + i;
      const dch = DRUMS[spec.drums][i % DRUMS[spec.drums].length];
      if (dch !== '.') steps[s].push(['d', dch]);
      if (spec.bass === 'drone') { if (i === 0) steps[s].push(['b', deg(chord, lo), bar]); }
      // the boss gallop: da-da-DUM on every beat
      else if (spec.bass === 'gallop') { if (i % 4 !== 1) steps[s].push(['b', deg(chord, i % 4 === 0 ? lo : lo + 1), 1]); }
      else if (i % beat === 0) steps[s].push(['b', deg(chord, lo), 3]);
      else if (i % beat === beat / 2) steps[s].push(['b', deg(chord + (L > 5 ? 4 : 3), lo), 1]);
      const arpN = [0, 2, 4, 7, 4, 2][(i + b) % 6];
      if (arp === 'tremolo') steps[s].push(['a', deg(chord + [0, 2, 4][Math.floor(i / 4) % 3], 1), 1]);
      else if (arp === 'waltz') { if (i % beat === 0 && i) steps[s].push(['a', deg(chord + (i / beat === 2 ? 4 : 2), 1), 2]); }
      else if (arp !== 'off' && (spec.drums !== 'slow' || i % 2 === 0)) steps[s].push(['a', deg(chord + arpN, 1), 1]);
    }
    if (spec.theme) {
      // the phrase spans 4 bars: this bar plays its slice of it
      const P = section ? B : A, from = (b % 4) * bar, to = from + bar;
      for (const [pos, d, len] of P) if (pos >= from && pos < to) steps[b * bar + pos - from].push(['l', deg(d, oct), len]);
    } else
      for (const [pos, d, len] of motif) {
        if (Math.floor(pos / 16) !== b % 2) continue;
        steps[b * bar + (pos % 16)].push(['l', deg(chord + d + (section ? 2 : 0), 1), len]);
      }
  }
  const out = { steps, stepDur: 60 / spec.bpm / 4, lead: spec.lead || 'p25' };
  songCache.set(id, out);
  return out;
}
const VOICE = {
  l: (m, n, t, w = 'p25') => chip([[N(m), n * 6 - 1], [0, 1]], { wave: w, vol: w === 'tri' ? 0.09 : 0.05, decay: w === 'p12' ? 0.004 : 0.002, at: t, music: true }),
  a: (m, n, t) => chip([[N(m), 3]], { wave: 'p12', vol: 0.022, decay: 0.004, at: t, music: true }),
  b: (m, n, t) => chip([[N(m), n * 6 - 1], [0, 1]], { wave: 'tri', vol: 0.11, decay: 0.002, at: t, music: true })
};
function drum(kind, t) {
  if (kind === 'K') chip([[N(45), 1], [N(38), 1], [N(31), 2]], { wave: 'tri', vol: 0.12, decay: 0.02, at: t, music: true });
  else if (kind === 'S') hiss(5, { vol: 0.07, rate: 0.55, drop: 0.05, at: t, music: true });
  // a sword ringing on steel (the graveyard), the anvil (the forge)
  else if (kind === 'C') (chip([[N(100), 1], [N(95), 1], [N(99), 2]], { wave: 'p12', vol: 0.03, decay: 0.006, at: t, music: true }), hiss(2, { vol: 0.03, rate: 2.2, short: true, at: t, music: true }));
  else if (kind === 'w') chip([[N(77), 1], [N(72), 1]], { wave: 'p50', vol: 0.03, decay: 0.015, at: t, music: true });
  else if (kind === 'W') chip([[N(84), 1], [N(79), 1]], { wave: 'p50', vol: 0.035, decay: 0.015, at: t, music: true });
  else if (kind === 'G') (chip([[N(43), 18], [N(42), 18]], { wave: 'tri', vol: 0.09, decay: 0.0025, at: t, music: true }), hiss(10, { vol: 0.025, rate: 0.3, at: t, music: true }));
  else if (kind === 'T') chip([[N(40), 1], [N(33), 2], [N(28), 3]], { wave: 'tri', vol: 0.15, decay: 0.022, at: t, music: true });
  else hiss(2, { vol: 0.03, rate: 1.6, short: true, at: t, music: true });
}
// the combo layer: Yoshi-style bongos that join whatever is playing while a swarm combo is alive
const BONGOS = 'W.wW.wW.W.wWw.W.';
const mus = { id: '', spec: null, pos: 0, next: 0, layer: false };
export const music = {
  play(id, spec) {
    if (mus.id === id) return;
    mus.id = id;
    mus.spec = spec;
    mus.pos = 0;
    mus.next = ctx ? ctx.currentTime + 0.1 : 0;
  },
  // the combo bongos on or off (set every frame, cheap)
  layer(on) {
    mus.layer = !!on;
  },
  stop() {
    mus.layer = false;
    mus.id = '';
    mus.spec = null;
  },
  // call every frame
  tick() {
    if (!ctx || ctx.state !== 'running' || !mus.spec || !settings.music) return;
    const sg = buildSong(mus.id, mus.spec);
    if (mus.next < ctx.currentTime) mus.next = ctx.currentTime + 0.05;
    while (mus.next < ctx.currentTime + 0.25) {
      const t = mus.next;
      for (const ev of sg.steps[mus.pos % sg.steps.length]) {
        if (ev[0] === 'd') drum(ev[1], t);
        else VOICE[ev[0]](ev[1], ev[2], t, sg.lead);
      }
      const bg = mus.layer && BONGOS[mus.pos % 16];
      if (bg === 'W') drum('W', t);
      else if (bg === 'w') drum('w', t);
      mus.pos++;
      mus.next += sg.stepDur;
    }
  }
};
