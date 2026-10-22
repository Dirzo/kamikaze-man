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
  if (musicBus) musicBus.gain.cancelScheduledValues(0), (musicBus.gain.value = settings.music ? 0.55 : 0);
  save();
  return settings.music;
}
export const audioSettings = settings;
function save() {
  try {
    localStorage.setItem('cwm-next-audio', JSON.stringify(settings));
  } catch (_) {}
}

// sound-effect pitch: a hit plays a touch higher or lower each time (and climbs with a streak), and
// shard pickups climb a scale like Mario's coins. Music never takes it.
let tune = 1;
function tuned(k, fn) {
  const was = tune;
  tune = k;
  try { fn(); } finally { tune = was; }
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
      o.frequency.setValueAtTime(Math.max(20, music ? f : f * tune), t);
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
    r = music ? rate : rate * tune;
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

// ---- each weapon's signature hit (k scales the volume: crits and specials hit louder)
const SIG = {
  sword: k => (chip([[N(91), 1], [N(96), 5]], { wave: 'p12', vol: 0.032 * k, decay: 0.005 }), hiss(3, { vol: 0.04 * k, rate: 0.8, drop: 0.15 })),
  dagger: k => (chip([[N(100), 1], [N(86), 1]], { wave: 'p12', vol: 0.03 * k, decay: 0.01 }), hiss(2, { vol: 0.035 * k, rate: 1.6, short: true })),
  katana: k => (hiss(4, { vol: 0.045 * k, rate: 1.2, drop: 0.2 }), chip([[N(98), 7]], { wave: 'p12', vol: 0.028 * k, decay: 0.0035 })),
  axe: k => (chip([[N(50), 1], [N(43), 3]], { wave: 'tri', vol: 0.1 * k, decay: 0.02 }), chip([[N(62), 1]], { wave: 'p50', vol: 0.03 * k }), hiss(5, { vol: 0.045 * k, rate: 0.35, drop: 0.12 })),
  scythe: k => (arp([84, 80, 75, 70], 2, { wave: 'p25', vol: 0.028 * k, decay: 0.002 }), hiss(4, { vol: 0.035 * k, rate: 0.9, drop: 0.1 })),
  hammer: k => (chip([[N(40), 1], [N(33), 2], [N(28), 3]], { wave: 'tri', vol: 0.13 * k, decay: 0.018 }), chip([[N(88), 6]], { wave: 'p12', vol: 0.022 * k, decay: 0.003 }), hiss(6, { vol: 0.05 * k, rate: 0.25, drop: 0.1 })),
  nunchucks: k => (chip([[N(84), 1], [0, 2], [N(81), 1]], { wave: 'p50', vol: 0.035 * k, decay: 0.01 }), hiss(2, { vol: 0.03 * k, rate: 0.9, short: true })),
  staff: k => (chip([[N(70), 1], [N(62), 2]], { wave: 'p50', vol: 0.035 * k, decay: 0.008 }), hiss(3, { vol: 0.035 * k, rate: 0.4 })),
  spear: k => (chip([[N(76), 1], [N(64), 2]], { wave: 'p25', vol: 0.032 * k, decay: 0.008 }), hiss(2, { vol: 0.04 * k, rate: 1.8, short: true })),
  bow: k => (chip([[N(55), 2]], { wave: 'tri', vol: 0.08 * k, decay: 0.02 }), chip([[N(69), 1], [N(67), 1], [N(69), 1]], { wave: 'p50', vol: 0.02 * k })),
  shuriken: k => chip([[N(103), 1], [N(98), 2]], { wave: 'p12', vol: 0.03 * k, decay: 0.008 }),
  wand: k => arp([91, 96, 100], 1, { wave: 'p12', vol: 0.03 * k, decay: 0.004 }),
  boomerang: k => (chip([[N(74), 1], [N(79), 2]], { wave: 'p50', vol: 0.032 * k, decay: 0.008 }), chip([[N(50), 2]], { wave: 'tri', vol: 0.06 * k, decay: 0.02 }))
};
const ELEMENT_SFX = {
  burn: () => hiss(6, { vol: 0.03, rate: 0.6, drop: -0.05 }),
  chill: () => chip([[N(96), 1], [N(100), 2]], { wave: 'p12', vol: 0.02, decay: 0.005 }),
  chain: () => (chip([[N(90), 1], [N(70), 1], [N(95), 1], [N(66), 1]], { wave: 'p12', vol: 0.022 }), hiss(2, { vol: 0.025, rate: 2.5, short: true })),
  venom: () => chip([[N(60), 1], [N(64), 1], [N(58), 1]], { wave: 'p50', vol: 0.02 }),
  wave: () => hiss(7, { vol: 0.03, rate: 0.3, drop: 0.05 }),
  stun: () => (chip([[N(40), 3]], { wave: 'tri', vol: 0.06, decay: 0.012 }), hiss(4, { vol: 0.025, rate: 0.2 })),
  gust: () => hiss(6, { vol: 0.028, rate: 0.8, drop: -0.1 }),
  pierce: () => chip([[N(84), 1], [N(88), 1], [N(91), 1]], { wave: 'p25', vol: 0.02 }),
  holy: () => arp([84, 88, 91], 2, { wave: 'p50', vol: 0.018, decay: 0.001 }),
  pull: () => arp([60, 55, 50, 45], 1, { wave: 'p25', vol: 0.025, decay: 0.002 })
};
const QUIRK_SFX = {
  tetanus: () => chip([[N(50), 2], [N(51), 2], [N(49), 2]], { wave: 'p50', vol: 0.03, decay: 0.002 }),
  wobble: () => arp([60, 67, 62, 69], 1, { wave: 'p25', vol: 0.035, decay: 0.002 }),
  flyoff: () => (hiss(5, { vol: 0.03, rate: 1, drop: -0.05 }), chip([[N(80), 1], [N(76), 1], [N(80), 1], [N(76), 1]], { wave: 'p12', vol: 0.02 })),
  boomerang: () => (hiss(5, { vol: 0.03, rate: 1, drop: -0.05 }), chip([[N(80), 1], [N(76), 1], [N(80), 1], [N(76), 1]], { wave: 'p12', vol: 0.02 })),
  splash: () => (hiss(6, { vol: 0.04, rate: 0.35, drop: 0.06 }), chip([[N(86), 1], [N(91), 1]], { wave: 'p12', vol: 0.02 })),
  glue: () => chip([[N(48), 2], [N(44), 3]], { wave: 'p50', vol: 0.04, decay: 0.006 }),
  borrowed: () => arp([72, 79, 84], 1, { wave: 'p25', vol: 0.03, decay: 0.003 }),
  poke: () => chip([[N(100), 1]], { wave: 'p12', vol: 0.035 }),
  sad: () => arp([64, 63, 62, 61], 3, { wave: 'p50', vol: 0.03, decay: 0.0008 }),
  yoink: () => arp([95, 100, 95, 100], 1, { wave: 'p12', vol: 0.03, decay: 0.004 }),
  stink: () => (hiss(8, { vol: 0.035, rate: 0.22, drop: -0.02 }), chip([[N(40), 4]], { wave: 'p50', vol: 0.02 })),
  shrapnel: () => (hiss(3, { vol: 0.035, rate: 2, short: true }), arp([98, 94, 102], 1, { wave: 'p12', vol: 0.025, decay: 0.004 })),
  bonk: () => (chip([[N(72), 1], [N(60), 2]], { wave: 'p25', vol: 0.04, decay: 0.008 }), chip([[N(45), 2]], { wave: 'tri', vol: 0.07, decay: 0.02 })),
  spare: () => chip([[N(76), 2], [N(77), 2], [N(76), 2]], { wave: 'p25', vol: 0.02, decay: 0.001 }),
  warm: () => arp([76, 81, 84], 2, { wave: 'tri', vol: 0.05, decay: 0.002 }),
  confetti: () => (hiss(4, { vol: 0.045, rate: 1.5, short: true }), arp([84, 88, 91, 96], 1, { wave: 'p12', vol: 0.03, decay: 0.003, delay: 0.05 })),
  zap: () => (chip([[N(90), 1], [N(70), 1], [N(95), 1], [N(66), 1], [N(92), 1]], { wave: 'p12', vol: 0.028 }), hiss(3, { vol: 0.03, rate: 2.5, short: true })),
  giant: () => (arp([48, 55, 60, 67], 3, { wave: 'p50', vol: 0.04, decay: 0.001 }), chip([[N(36), 8]], { wave: 'tri', vol: 0.07, decay: 0.006 }))
};

// each resident's own last little sound as it goes down (sfx.die). Cute, short, never sad.
const DIE = {
  stalker: () => arp([72, 67, 60], 2, { wave: 'p25', vol: 0.04, decay: 0.003 }), // "oh no"
  crawler: () => chip([[N(96), 1], [N(91), 1], [N(98), 1], [N(86), 2]], { wave: 'p12', vol: 0.035, decay: 0.004 }), // squeak
  goose: () => chip([[700, 2], [560, 2], [420, 3], [300, 4]], { wave: 'p25', vol: 0.05, decay: 0.006 }), // deflating honk
  bombchicken: () => (chip([[N(84), 1], [N(79), 1], [N(84), 1]], { wave: 'p50', vol: 0.035 }), hiss(6, { vol: 0.04, rate: 0.6, drop: 0.08, delay: 0.05 })),
  brute: () => chip([[N(48), 3], [N(45), 3], [N(40), 6]], { wave: 'tri', vol: 0.09, decay: 0.008 }), // big "oof"
  wraith: () => arp([79, 83, 86, 91, 95], 2, { wave: 'p12', vol: 0.025, decay: 0.002 }), // floats off
  maw: () => (chip([[N(52), 2], [0, 1], [N(52), 2]], { wave: 'p50', vol: 0.04, decay: 0.006 }), arp([88, 91], 2, { wave: 'p12', vol: 0.025, delay: 0.1 })), // clack, coins
  flyer: () => chip([[N(93), 1], [N(89), 1], [N(84), 1], [N(77), 1], [N(70), 2]], { wave: 'p12', vol: 0.035 }), // falling squeak
  wizard: () => (arp([84, 80, 76, 72, 68], 1, { wave: 'p25', vol: 0.035, decay: 0.002 }), hiss(4, { vol: 0.025, rate: 1.4, short: true })), // fizzle
  taxman: () => (hiss(5, { vol: 0.035, rate: 1.1, drop: 0.1 }), chip([[N(76), 2], [N(71), 3]], { wave: 'p50', vol: 0.025 })), // papers everywhere
  mimic: () => chip([[N(60), 1], [N(64), 1], [N(55), 1], [N(48), 3]], { wave: 'p50', vol: 0.04, decay: 0.006 }), // lid slam
  eyeball: () => (chip([[N(91), 4]], { wave: 'p12', vol: 0.03, decay: 0.004 }), arp([96, 100], 2, { wave: 'p12', vol: 0.02, delay: 0.06 })), // blink, pop
  shieldbro: () => (chip([[N(91), 1], [N(86), 2]], { wave: 'p12', vol: 0.04, decay: 0.008 }), chip([[N(43), 4]], { wave: 'tri', vol: 0.07, decay: 0.01, delay: 0.08 })), // clang, thump
  blinker: () => arp([88, 100, 76, 96], 1, { wave: 'p12', vol: 0.03, decay: 0.003 }), // blinks out
  summoner: () => arp([67, 63, 60, 55, 51], 2, { wave: 'p25', vol: 0.035, decay: 0.002 }),
  sniper: () => chip([[N(69), 2], [N(68), 2], [N(67), 2], [N(55), 4]], { wave: 'p50', vol: 0.035, decay: 0.004 }), // "I missed?"
  roller: () => (chip([[N(50), 1], [N(55), 1], [N(50), 1], [N(55), 1], [N(43), 3]], { wave: 'tri', vol: 0.07, decay: 0.008 })),
  squirrel: () => chip([[N(100), 1], [N(103), 1], [N(98), 1], [N(93), 2]], { wave: 'p12', vol: 0.035, decay: 0.004 }), // chitter
  turtle: () => (chip([[N(57), 1], [N(52), 2]], { wave: 'p50', vol: 0.04, decay: 0.008 }), chip([[N(45), 3]], { wave: 'tri', vol: 0.06, decay: 0.01, delay: 0.09 })), // shell clonk
  raccoon: () => arp([86, 91, 86, 81], 1, { wave: 'p25', vol: 0.035, decay: 0.003 }), // trash-panda trill
  samurai: () => (chip([[N(79), 2], [N(84), 3], [N(72), 4]], { wave: 'p25', vol: 0.04, decay: 0.003 }), hiss(3, { vol: 0.03, rate: 1.2, short: true })), // "hyaa..."
  kitsune: () => arp([84, 88, 91, 96, 100, 103], 1, { wave: 'p12', vol: 0.025, decay: 0.002 }), // foxfire wisp
  monk: () => chip([[N(81), 8]], { wave: 'p50', vol: 0.03, decay: 0.002 }), // a bell
  anvil: () => (chip([[N(96), 1], [N(91), 6]], { wave: 'p12', vol: 0.04, decay: 0.004 }), chip([[N(36), 4]], { wave: 'tri', vol: 0.08, decay: 0.01 })), // ting + thud
  // the goose family: honks of every size
  gosling: () => chip([[N(96), 1], [N(100), 1], [N(93), 2]], { wave: 'p12', vol: 0.03, decay: 0.004 }), // peep
  honker: () => chip([[640, 2], [520, 2], [380, 4]], { wave: 'p25', vol: 0.045, decay: 0.006 }),
  gsquire: () => (chip([[N(88), 1], [N(83), 2]], { wave: 'p12', vol: 0.035, decay: 0.008 }), chip([[520, 2], [360, 4]], { wave: 'p25', vol: 0.04, delay: 0.06 })),
  fencer: () => chip([[700, 1], [620, 1], [700, 1], [420, 4]], { wave: 'p25', vol: 0.04, decay: 0.006 }), // touché
  gtoss: () => chip([[560, 2], [470, 2], [330, 4]], { wave: 'p25', vol: 0.045, decay: 0.006 }),
  whirl: () => (arp([84, 79, 74, 67], 1, { wave: 'p25', vol: 0.03 }), chip([[400, 3], [300, 5]], { wave: 'p25', vol: 0.04, delay: 0.05 })), // dizzy honk
  ggrave: () => arp([79, 83, 86, 91, 95], 2, { wave: 'p12', vol: 0.025, decay: 0.002 }),
  berserker: () => chip([[720, 1], [760, 1], [600, 2], [420, 2], [300, 4]], { wave: 'p25', vol: 0.05, decay: 0.006 }),
  swan: () => arp([88, 84, 79, 72], 2, { wave: 'p50', vol: 0.035, decay: 0.003 }),
  gander: () => (chip([[300, 3], [250, 3], [180, 8]], { wave: 'p25', vol: 0.06, decay: 0.006 }), chip([[N(36), 6]], { wave: 'tri', vol: 0.08, decay: 0.01 })),
  // the cat and raccoon family: mews, hisses and chitters
  alleykit: () => chip([[N(93), 1], [N(98), 2], [N(91), 2]], { wave: 'p12', vol: 0.03, decay: 0.004 }), // mew
  pickpocket: () => arp([88, 93, 88, 84], 1, { wave: 'p25', vol: 0.035, decay: 0.003 }), // chitter
  cutpurse: () => (chip([[N(86), 2], [N(79), 4]], { wave: 'p25', vol: 0.035, decay: 0.004 }), hiss(3, { vol: 0.03, rate: 1.2, short: true })),
  lanterncat: () => chip([[N(81), 3], [N(76), 6]], { wave: 'p12', vol: 0.03, decay: 0.003 }),
  juggler: () => (arp([84, 88, 91, 86], 1, { wave: 'p25', vol: 0.03 }), chip([[N(96), 2]], { wave: 'p12', vol: 0.03, delay: 0.08 })),
  shadowtom: () => (chip([[N(72), 3], [N(64), 8]], { wave: 'p25', vol: 0.04, decay: 0.004 }), hiss(4, { vol: 0.03, rate: 0.8, short: true })), // a low yowl
  siamese: () => chip([[N(88), 2], [N(84), 2], [N(91), 4]], { wave: 'p50', vol: 0.035, decay: 0.003 }),
  prowler: () => chip([[N(76), 2], [N(83), 2], [N(71), 5]], { wave: 'p25', vol: 0.04, decay: 0.004 }), // mrrow
  bandit: () => (arp([86, 81, 86, 79], 1, { wave: 'p25', vol: 0.03 }), hiss(4, { vol: 0.04, rate: 0.9, short: true })), // chitter and a puff
  fatcat: () => (chip([[N(64), 4], [N(57), 8]], { wave: 'p50', vol: 0.05, decay: 0.006 }), chip([[N(96), 2], [N(100), 3]], { wave: 'p12', vol: 0.025, delay: 0.12 })), // a purr and a coin
  // the dragon hoard family: little roars, the clink of coins and one great rumble
  whelp: () => chip([[N(84), 2], [N(88), 2], [N(79), 4]], { wave: 'p25', vol: 0.035, decay: 0.004 }),
  pangolin: () => (chip([[N(72), 2], [N(67), 4]], { wave: 'p25', vol: 0.035 }), hiss(2, { vol: 0.025, rate: 1.2, short: true })),
  magpie: () => arp([96, 100, 96, 103], 1, { wave: 'p12', vol: 0.03, decay: 0.003 }), // a chatter
  armadillo: () => (chip([[N(76), 2], [N(72), 4]], { wave: 'p25', vol: 0.035 }), chip([[N(103), 2]], { wave: 'p12', vol: 0.025, delay: 0.08 })),
  ember: () => (hiss(4, { vol: 0.04, rate: 0.9 }), chip([[N(67), 3], [N(60), 6]], { wave: 'p50', vol: 0.045, delay: 0.05 })),
  wyrmling: () => (chip([[N(79), 2], [N(76), 4]], { wave: 'tri', vol: 0.05 }), hiss(3, { vol: 0.03, rate: 0.8, short: true })),
  platedpango: () => (chip([[N(60), 4], [N(55), 6]], { wave: 'p50', vol: 0.05 }), arp([96, 100, 103], 1, { wave: 'p12', vol: 0.025, delay: 0.1 })), // a grunt and a coin
  gemwyrm: () => arp([91, 96, 100, 103, 108], 1, { wave: 'p12', vol: 0.03, decay: 0.003 }), // crystal chimes
  kobold: () => chip([[N(93), 1], [N(96), 1], [N(91), 2]], { wave: 'p25', vol: 0.03, decay: 0.004 }), // a yip
  elder: () => (chip([[N(48), 8], [N(43), 12]], { wave: 'p50', vol: 0.07, decay: 0.008 }), arp([96, 100, 103, 108], 2, { wave: 'p12', vol: 0.03, delay: 0.2 })), // a roar and the hoard rattling
  // the lizard ninja family: chirps, hisses and the ring of steel stars
  gecko: () => chip([[N(98), 1], [N(98), 1], [N(101), 2]], { wave: 'p12', vol: 0.03, decay: 0.003 }), // gecko chirp
  draco: () => (hiss(3, { vol: 0.03, rate: 1.4, short: true }), chip([[N(88), 2], [N(84), 3]], { wave: 'p25', vol: 0.03, delay: 0.05 })),
  wallgecko: () => chip([[N(91), 1], [N(96), 1], [N(91), 2]], { wave: 'p12', vol: 0.03, decay: 0.003 }),
  chameleon: () => hiss(4, { vol: 0.03, rate: 1.1 }),
  frilled: () => (hiss(3, { vol: 0.04, rate: 0.9, short: true }), chip([[N(100), 2]], { wave: 'p12', vol: 0.025, delay: 0.08 })),
  anole: () => (hiss(5, { vol: 0.045, rate: 0.8 }), chip([[N(93), 2]], { wave: 'p25', vol: 0.025 })), // a puff of smoke
  basilisk: () => arp([88, 91, 93, 96], 1, { wave: 'p25', vol: 0.03, decay: 0.003 }),
  iguana: () => (chip([[N(64), 3], [N(60), 6]], { wave: 'p50', vol: 0.045 }), chip([[N(103), 2], [N(100), 3]], { wave: 'p12', vol: 0.025, delay: 0.12 })),
  skink: () => chip([[N(93), 1], [N(89), 2]], { wave: 'p12', vol: 0.03, decay: 0.004 }),
  komodo: () => (hiss(6, { vol: 0.05, rate: 0.6 }), chip([[N(55), 6], [N(52), 10]], { wave: 'p50', vol: 0.06, decay: 0.007 })), // a long hiss and a growl
  // the owl, bunny and hedgehog family: squeaks, hoots and little chimes
  dustbunny: () => chip([[N(96), 1], [N(100), 2]], { wave: 'p12', vol: 0.03, decay: 0.004 }),
  hedgehog: () => (chip([[N(91), 1], [N(88), 2]], { wave: 'p25', vol: 0.03 }), hiss(2, { vol: 0.025, rate: 1.3, short: true })),
  owlet: () => chip([[N(84), 2], [N(81), 4]], { wave: 'tri', vol: 0.05, decay: 0.005 }), // a little hoo
  hatrabbit: () => arp([84, 88, 91, 96], 1, { wave: 'p12', vol: 0.03, decay: 0.003 }), // ta-da
  moth: () => hiss(5, { vol: 0.03, rate: 1.5 }),
  polyhare: () => arp([91, 88, 84, 91], 1, { wave: 'p25', vol: 0.03 }),
  teahog: () => (chip([[N(64), 2], [N(67), 2], [N(60), 4]], { wave: 'p25', vol: 0.045 }), chip([[N(100), 2], [N(103), 3]], { wave: 'p12', vol: 0.025, delay: 0.1 })), // an oink and a clink
  mirrorowl: () => (chip([[N(79), 3], [N(76), 6]], { wave: 'tri', vol: 0.05 }), chip([[N(103), 2]], { wave: 'p12', vol: 0.025, delay: 0.1 })),
  broombat: () => arp([96, 100, 103, 100], 1, { wave: 'p12', vol: 0.03, decay: 0.003 }),
  hornedowl: () => (chip([[N(67), 4], [N(64), 4], [N(60), 8]], { wave: 'tri', vol: 0.06, decay: 0.006 }), arp([88, 91, 96], 2, { wave: 'p12', vol: 0.025 })), // hoo-hoo and a chime
  // the bear, badger and boar family: growls, snorts and the ring of iron
  cub: () => chip([[N(79), 2], [N(84), 3]], { wave: 'p25', vol: 0.035, decay: 0.004 }), // a little roar
  badger: () => (chip([[N(83), 1], [N(86), 2]], { wave: 'p12', vol: 0.03 }), hiss(3, { vol: 0.03, rate: 1.0, short: true })),
  boarbellows: () => chip([[N(60), 2], [N(64), 2], [N(57), 4]], { wave: 'p25', vol: 0.05, decay: 0.005 }), // oink-snort
  bearsmith: () => (chip([[N(48), 5], [N(43), 8]], { wave: 'p50', vol: 0.06, decay: 0.006 }), chip([[N(96), 2]], { wave: 'p12', vol: 0.03, delay: 0.1 })), // a growl and a clank
  honeybadger: () => (chip([[N(76), 1], [N(79), 1], [N(74), 3]], { wave: 'p25', vol: 0.045, decay: 0.004 }), hiss(4, { vol: 0.04, rate: 1.1, short: true })),
  anviltoss: () => (chip([[N(55), 3], [N(50), 6]], { wave: 'p50', vol: 0.05, decay: 0.005 }), chip([[N(91), 2], [N(86), 4]], { wave: 'p12', vol: 0.03, delay: 0.12 })),
  wolverine: () => chip([[N(67), 2], [N(72), 2], [N(62), 5]], { wave: 'p25', vol: 0.045, decay: 0.004 }),
  moltenboar: () => (chip([[N(52), 3], [N(48), 6]], { wave: 'p50', vol: 0.05, decay: 0.005 }), hiss(6, { vol: 0.05, rate: 0.7 })), // and a hiss of steam
  grizzly: () => (chip([[N(41), 6], [N(36), 10]], { wave: 'p50', vol: 0.06, decay: 0.006 }), chip([[N(88), 3], [N(84), 6]], { wave: 'tri', vol: 0.04, delay: 0.14 })), // a roar and the bell
  polarbear: () => (chip([[N(38), 8], [N(31), 12]], { wave: 'p50', vol: 0.07, decay: 0.007 }), chip([[N(29), 10]], { wave: 'tri', vol: 0.09, decay: 0.01 })),
  // the monkey, goat and yak family: hoots, bleats and a deep yak grunt
  macaque: () => chip([[N(88), 1], [N(93), 1], [N(86), 2]], { wave: 'p25', vol: 0.035, decay: 0.004 }), // eek
  vaultmonkey: () => arp([84, 91, 96], 1, { wave: 'p25', vol: 0.035 }),
  goatmonk: () => chip([[N(76), 2], [N(77), 2], [N(76), 2], [N(74), 4]], { wave: 'p12', vol: 0.04, decay: 0.004 }), // baa-a-a
  gibbon: () => arp([79, 86, 91, 86, 91, 96], 1, { wave: 'p25', vol: 0.035, decay: 0.003 }), // whoop whoop
  snowsage: () => chip([[N(67), 4], [N(64), 8]], { wave: 'tri', vol: 0.06, decay: 0.006 }), // a long sigh
  baboon: () => (chip([[N(72), 2], [N(67), 4]], { wave: 'p50', vol: 0.045, decay: 0.005 }), chip([[N(96), 2]], { wave: 'p12', vol: 0.025, delay: 0.08 })),
  ibex: () => chip([[N(81), 2], [N(80), 2], [N(79), 4]], { wave: 'p12', vol: 0.04, decay: 0.004 }),
  langur: () => arp([93, 88, 96, 91], 1, { wave: 'p25', vol: 0.035, decay: 0.003 }),
  yak: () => (chip([[N(43), 6], [N(38), 10]], { wave: 'p50', vol: 0.06, decay: 0.006 }), chip([[N(31), 8]], { wave: 'tri', vol: 0.08, decay: 0.01 })), // a deep grunt
  cloudape: () => arp([72, 79, 84, 91, 96, 103], 2, { wave: 'p12', vol: 0.035, decay: 0.003 }), // a gong shimmer
  // the dog and fox family: yips, barks and fox cries
  shibapup: () => chip([[N(91), 1], [N(96), 2]], { wave: 'p25', vol: 0.035, decay: 0.004 }), // yip
  corgi: () => chip([[N(84), 2], [N(88), 2], [N(81), 3]], { wave: 'p25', vol: 0.04, decay: 0.005 }), // borf
  akita: () => (chip([[N(72), 3], [N(67), 6]], { wave: 'p50', vol: 0.04, decay: 0.005 }), chip([[N(100), 2]], { wave: 'p12', vol: 0.025, delay: 0.1 })), // a woof and a sheathe
  petalfox: () => arp([93, 96, 100, 91], 1, { wave: 'p12', vol: 0.03, decay: 0.003 }), // a fox giggle
  husky: () => chip([[N(76), 3], [N(83), 3], [N(72), 6]], { wave: 'p25', vol: 0.045, decay: 0.004 }), // awoo
  twininu: () => (chip([[N(88), 2], [N(84), 3]], { wave: 'p25', vol: 0.035, decay: 0.004 }), chip([[N(98), 1], [N(101), 2]], { wave: 'p12', vol: 0.025, delay: 0.08 })),
  windfox: () => (arp([96, 91, 88, 84], 1, { wave: 'p12', vol: 0.03 }), hiss(4, { vol: 0.03, rate: 1.3, short: true })), // a cry on the wind
  houndguard: () => chip([[N(79), 2], [N(74), 4]], { wave: 'p25', vol: 0.04, decay: 0.005 }),
  tosa: () => (chip([[N(55), 4], [N(50), 8]], { wave: 'p50', vol: 0.06, decay: 0.006 }), chip([[N(36), 6]], { wave: 'tri', vol: 0.08, decay: 0.01 })), // a big bark and a thud
  ninetail: () => arp([84, 88, 91, 96, 100, 103], 2, { wave: 'p12', vol: 0.035, decay: 0.003 }), // a shimmer of bells
  // the turtle and frog family: ribbits and shell clonks
  tadpole: () => chip([[N(100), 1], [N(96), 1], [N(103), 2]], { wave: 'p12', vol: 0.03, decay: 0.004 }), // blip
  pondfrog: () => chip([[N(67), 1], [N(72), 1], [N(64), 3]], { wave: 'p25', vol: 0.045, decay: 0.006 }), // ribbit
  snapper: () => (chip([[N(55), 1], [N(50), 3]], { wave: 'p50', vol: 0.045, decay: 0.008 }), chip([[N(43), 3]], { wave: 'tri', vol: 0.06, decay: 0.01, delay: 0.08 })),
  spinturtle: () => (arp([86, 81, 76, 69], 1, { wave: 'p25', vol: 0.03 }), chip([[N(45), 3]], { wave: 'tri', vol: 0.06, decay: 0.01, delay: 0.08 })),
  toadmonk: () => chip([[N(57), 2], [N(52), 2], [N(81), 6]], { wave: 'p50', vol: 0.035, decay: 0.003 }), // croak and a bell
  lilylurker: () => (chip([[N(64), 1], [N(69), 2]], { wave: 'p25', vol: 0.04, decay: 0.006 }), hiss(3, { vol: 0.03, rate: 1.4, short: true })), // splash
  bubblenewt: () => arp([84, 91, 96, 103], 1, { wave: 'p12', vol: 0.025, decay: 0.002 }), // pop pop pop
  shellback: () => (chip([[N(50), 2], [N(45), 3]], { wave: 'p50', vol: 0.05, decay: 0.008 }), chip([[N(38), 5]], { wave: 'tri', vol: 0.07, decay: 0.01, delay: 0.08 })),
  bullfrog: () => (chip([[N(43), 3], [N(40), 3], [N(36), 6]], { wave: 'p25', vol: 0.06, decay: 0.006 }), chip([[N(31), 6]], { wave: 'tri', vol: 0.08, decay: 0.01 })), // BWAAMP
  grandsnapper: () => (chip([[N(48), 3], [N(43), 4]], { wave: 'p50', vol: 0.055, decay: 0.008 }), chip([[N(81), 8]], { wave: 'p50', vol: 0.03, decay: 0.002, delay: 0.1 })),
  // the fuzzball family: squeaks for the little ones, a roar for the yeti, a howl for Moonfang
  fuzzlet: () => chip([[N(98), 1], [N(103), 1], [N(91), 2]], { wave: 'p12', vol: 0.03, decay: 0.004 }),
  burrball: () => (chip([[N(60), 1], [N(55), 1], [N(50), 2]], { wave: 'tri', vol: 0.06, decay: 0.008 }), hiss(3, { vol: 0.03, rate: 1.3, short: true })),
  puffshot: () => arp([91, 86, 79], 1, { wave: 'p25', vol: 0.03, decay: 0.003 }),
  twintuft: () => (chip([[N(96), 1], [N(91), 2]], { wave: 'p12', vol: 0.03 }), chip([[N(93), 1], [N(88), 2]], { wave: 'p12', vol: 0.03, delay: 0.07 })),
  quillback: () => (hiss(4, { vol: 0.035, rate: 1.6, short: true }), chip([[N(84), 1], [N(77), 2]], { wave: 'p25', vol: 0.03 })),
  moss: () => (hiss(5, { vol: 0.03, rate: 0.8, drop: 0.08 }), chip([[N(67), 2], [N(62), 3]], { wave: 'p50', vol: 0.025 })),
  wolfpup: () => chip([[N(86), 1], [N(91), 1], [N(84), 2], [N(79), 3]], { wave: 'p25', vol: 0.035, decay: 0.004 }), // yip
  yeticub: () => chip([[N(76), 2], [N(72), 2], [N(67), 4]], { wave: 'p50', vol: 0.035, decay: 0.004 }),
  yeti: () => (chip([[N(43), 3], [N(41), 3], [N(36), 8]], { wave: 'tri', vol: 0.1, decay: 0.006 }), hiss(6, { vol: 0.04, rate: 0.5, drop: 0.1 })), // roar
  werewolf: () => arp([67, 72, 76, 79, 76, 72], 3, { wave: 'p25', vol: 0.04, decay: 0.002 }), // a last howl
  ninja: () => (hiss(4, { vol: 0.04, rate: 1.5, drop: -0.1, short: true }), arp([91, 96], 1, { wave: 'p12', vol: 0.025, delay: 0.05 })) // poof
};

const SHARD_SCALE = [84, 86, 88, 89, 91, 93, 95, 96, 98, 100, 101, 103];
let shardRun = 0, shardAt = -1e9;

// music ducks for a moment under a big hit (crit, finisher, elite kill, special) so it punches through
export function duck(depth = 0.45, sec = 0.35) {
  if (!ctx || !musicBus || !settings.music) return;
  const t = ctx.currentTime, full = 0.55, g = musicBus.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(full * (1 - depth), t);
  g.linearRampToValueAtTime(full, t + sec);
}

export const sfx = {
  thud(heavy = false, honk = false) {
    if (!gate('thud', 65)) return;
    chip([[heavy ? 160 : 210, 1], [90, 2], [48, 4]], {wave:'tri', vol:0.07, decay:0.01});
    hiss(4, {vol:0.025, rate:0.23, drop:0.18});
    if (honk) chip([[420, 2], [330, 3]], {wave:'p25', vol:0.025, decay:0.004});
  },
  // the swing itself: a soft whoosh (a miss should barely make a sound) and, for ranged weapons,
  // the release. Each weapon's real voice is its hit (sig below).
  attack(type, q = 0) {
    if (!gate('atk', 40)) return;
    const v = 0.012 + Math.min(q, 8) * 0.0006;
    switch (type) {
      case 'bow':
        chip([[N(67), 1], [N(55), 2]], { wave: 'p50', vol: v * 1.4, decay: 0.006 });
        break;
      case 'shuriken':
      case 'boomerang':
        hiss(3, { vol: v, rate: 1.3, drop: -0.1, short: true });
        break;
      case 'wand':
        arp([84, 88], 1, { wave: 'p12', vol: v, decay: 0.003 });
        break;
      case 'hammer':
      case 'axe':
        hiss(5, { vol: v * 1.1, rate: 0.28, drop: 0.08 });
        break;
      default:
        hiss(3, { vol: v, rate: type === 'katana' || type === 'dagger' ? 0.95 : 0.6, drop: 0.12 });
    }
  },
  special(type) {
    if (!gate('sp', 150)) return;
    arp([60, 64, 67, 72, 76, 79, 84], 2, { wave: 'p25', vol: 0.05, decay: 0.002 });
    hiss(14, { vol: 0.045, rate: 0.35, drop: -0.03 });
    if (type) SIG[type]?.(0.8);
  },
  // a hit: the weapon's signature sound when it is the hero's weapon landing (type given),
  // a plain smack for procs and chains
  // step: how many hits in a row (each one a little higher, up to 8)
  hit(crit, type, step = 0) {
    if (!gate(crit ? 'hitc' : 'hit', crit ? 30 : 35)) return;
    tuned((1 + (Math.random() - 0.5) * 0.1) * (1 + Math.min(8, step) * 0.03), () => {
      if (type && SIG[type]) SIG[type](crit ? 1.25 : 1);
      else {
        hiss(3, { vol: 0.04, rate: 0.7, drop: 0.15 });
        chip([[N(57), 1], [N(52), 1]], { wave: 'p50', vol: 0.025, decay: 0.01 });
      }
    });
    if (crit) arp([84, 91], 2, { wave: 'p12', vol: 0.045, decay: 0.002 });
  },
  // a shard picked up: each one in a quick chain a scale step higher, then back to the bottom
  shard() {
    const now = performance.now();
    shardRun = now - shardAt < 450 ? Math.min(SHARD_SCALE.length - 1, shardRun + 1) : 0;
    shardAt = now;
    if (!gate('shard', 28)) return;
    const m = SHARD_SCALE[shardRun];
    chip([[N(m), 2], [N(m + 7), 3]], { wave: 'p12', vol: 0.03, decay: 0.004 });
  },
  skid() {
    if (!gate('skid', 140)) return;
    hiss(5, { vol: 0.03, rate: 1.1, drop: 0.08, short: true });
  },
  // low health: a soft two-beat heartbeat
  heartbeat() {
    chip([[N(33), 3]], { wave: 'tri', vol: 0.09, decay: 0.02 });
    chip([[N(31), 3]], { wave: 'tri', vol: 0.07, decay: 0.02, delay: 0.16 });
  },
  // elemental augments: a quiet tag on top of the hit, so a Blazing sword hisses and a
  // Thunderstruck one crackles
  element(effect) {
    if (!ELEMENT_SFX[effect] || !gate('el:' + effect, 140)) return;
    ELEMENT_SFX[effect]();
  },
  // weapon quirks: each one has its own little noise when it goes off
  quirk(id) {
    if (!QUIRK_SFX[id] || !gate('qk', 110)) return;
    QUIRK_SFX[id]();
  },
  kill(elite) {
    if (!gate('kill', 40)) return;
    if (elite) arp([79, 74, 67, 62, 55], 2, { wave: 'p25', vol: 0.05, decay: 0.002 });
    else arp([76, 71, 64], 1, { wave: 'p25', vol: 0.04, decay: 0.004 });
    hiss(5, { vol: 0.04, rate: 0.45, drop: 0.1 });
  },
  // a resident's own death cry (DIE above); a pack dying at once still only cries a few times
  die(type, elite) {
    if (!gate('die:' + type, 90) || !gate('die', 45)) return;
    (DIE[type] || DIE.stalker)();
    hiss(4, { vol: 0.03, rate: 0.45, drop: 0.1 });
    if (elite) arp([79, 74, 67, 62, 55], 2, { wave: 'p25', vol: 0.045, decay: 0.002, delay: 0.08 });
  },
  // a shard landing in a shard tree node as it fills: each one a step higher (i: which shard)
  shardTick(i = 0) {
    if (!gate('stick', 28)) return;
    chip([[N(84 + Math.min(i, 14)), 1], [N(91 + Math.min(i, 14)), 2]], { wave: 'p12', vol: 0.022, decay: 0.006 });
  },
  // the node locking in once its shards have all arrived: a thump and a bright rising chord, a
  // fanfare on top when the node is maxed
  invest(maxed = false) {
    if (!gate('invest', 120)) return;
    chip([[N(43), 2], [N(36), 4]], { wave: 'tri', vol: 0.09, decay: 0.01 });
    arp([72, 76, 79, 84, 88], 2, { wave: 'p25', vol: 0.045, decay: 0.0015 });
    arp([60, 64, 67, 72], 3, { wave: 'p50', vol: 0.03, decay: 0.001 });
    hiss(5, { vol: 0.03, rate: 2.2, drop: 0.1, short: true });
    if (maxed) arp([84, 88, 91, 96, 100], 3, { wave: 'p12', vol: 0.04, decay: 0.0008, delay: 0.18 });
  },
  // a mastery perk charging up: a low hum that swells and climbs with a shimmer of vibrato
  hum() {
    if (!gate('hum', 400)) return;
    const steps = Array.from({ length: 54 }, (_, i) => [N(43 + i * 0.32) * (i % 2 ? 1.012 : 0.988), 1]);
    chip(steps, { wave: 'p50', vol: 0.008, decay: -0.0007 });
    chip(steps.map(([f, n]) => [f / 2, n]), { wave: 'tri', vol: 0.03, decay: -0.0012 });
    hiss(50, { vol: 0.004, rate: 0.6, drop: -0.012 });
  },
  // ...and the weapon taking the power in: a bright major chord over a bell
  empower() {
    if (!gate('empower', 300)) return;
    arp([67, 71, 74, 79, 83, 86, 91], 2, { wave: 'p25', vol: 0.045, decay: 0.0012 });
    arp([55, 59, 62, 67], 4, { wave: 'tri', vol: 0.06, decay: 0.0008 });
    chip([[N(91), 18]], { wave: 'p12', vol: 0.03, decay: 0.0016, delay: 0.12 });
  },
  // the body bursting into shards: a bright crystal chime that climbs
  shatter(big = false) {
    if (!gate('shatter', 55)) return;
    arp(big ? [88, 95, 100, 107] : [91, 98, 103], 1, { wave: 'p12', vol: 0.028, decay: 0.002 });
    hiss(3, { vol: 0.025, rate: 2.2, short: true });
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
  },
  // a relic: the same bright chime, one step higher for each one taken (n = 1..5)
  relic(n = 1) {
    const r = 72 + [0, 2, 4, 7, 12][Math.max(0, Math.min(4, n - 1))];
    arp([r, r + 7, r + 12], 3, { wave: 'p25', vol: 0.05, decay: 0.001 });
    arp([r - 12, r - 5], 4, { wave: 'tri', vol: 0.05, decay: 0.001 });
  },
  // stepping through a hidden portal: a falling whoosh and a shimmer
  portal() {
    hiss(10, { vol: 0.04, rate: 0.5, drop: -0.08 });
    arp([96, 91, 88, 84, 79, 76], 2, { wave: 'p12', vol: 0.03, decay: 0.002 });
  },
  // a Monster Book card goes up a tier
  card(tier = 0) {
    arp([79, 84, 88 + tier * 2], 3, { wave: 'p25', vol: 0.04, decay: 0.002 });
  },
  // the War Goose: hatching, swallowing a foe whole, stomping one
  hatch() {
    chip([[N(88), 1], [0, 1], [N(91), 1], [0, 1], [N(96), 2]], { wave: 'p50', vol: 0.04, decay: 0.004 });
    chip([[740, 2], [622, 3], [831, 4]], { wave: 'p25', vol: 0.05, decay: 0.008, delay: 0.12 });
  },
  chomp() {
    if (!gate('chomp', 120)) return;
    chip([[N(55), 1], [N(48), 2]], { wave: 'p50', vol: 0.05, decay: 0.008 });
    chip([[N(72), 1], [N(67), 1], [N(60), 2]], { wave: 'p25', vol: 0.03, decay: 0.004, delay: 0.06 });
  },
  stomp() {
    if (!gate('stomp', 80)) return;
    chip([[N(84), 1], [N(91), 1], [N(96), 2]], { wave: 'p25', vol: 0.045, decay: 0.004 });
  },
  // swimming: a stroke through the water
  swim() {
    if (!gate('swim', 120)) return;
    hiss(5, { vol: 0.025, rate: 0.35, drop: 0.05 });
    chip([[N(76), 1], [N(81), 1]], { wave: 'p12', vol: 0.02, decay: 0.004 });
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
// A themed song runs 32 bars, so it takes about a minute to come round again:
//   A  A'  B  B'  C  C'  A+  B+
// A' answers the theme (passing notes, its last bar a third up), B' resolves home, C is the bridge
// (a breakdown on the progression played backwards: half-time drums, the theme's opening bar
// sequenced up the scale, no arpeggio) and C' the same bridge at full tilt. A+ and B+ bring the
// theme back with a harmony a third below. Every section ends in a drum fill.
const SECTIONS = ['A', 'A2', 'B', 'B2', 'C', 'C2', 'A3', 'B3'];
const FILLS = ['ShSS', 'KSKS', 'SSSS', 'hSSK'];
export function buildSong(id, spec) {
  if (songCache.has(id)) return songCache.get(id);
  const sc = SCALES[spec.scale],
    L = sc.length,
    bar = spec.bar || 16,
    r = rng([...id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7));
  const deg = (d, oct = 0) => spec.key + sc[((d % L) + L) % L] + 12 * (Math.floor(d / L) + oct);
  // the bass sits two octaves down, or one for the low keys (it would be below hearing)
  const arp = spec.arp || 'roll', oct = spec.oct ?? 1, beat = bar / 4, lo = spec.key < 48 ? -1 : -2;
  const kit = DRUMS[spec.drums];
  if (!spec.theme) return oldSong(id, spec, { sc, L, bar, r, deg, arp, beat, lo, kit });
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
  const A = phrase(spec.theme), B = spec.themeB ? phrase(spec.themeB) : A, end = 4 * bar;
  // passing notes in the long notes, and the last bar lifted a third: the answer to the theme
  const answer = P => P.flatMap(([pos, d, len]) => {
    const lift = pos >= 3 * bar ? 2 : 0;
    if (len >= 4 && r() < 0.55) return [[pos, d + lift, len / 2], [pos + len / 2, d + lift + (r() < 0.5 ? 1 : -1), len / 2]];
    return [[pos, d + lift, len]];
  });
  // land on the root and hold it to the end of the phrase
  const resolve = P => {
    const last = P.reduce((m, n) => (n[0] > m[0] ? n : m), P[0]);
    return P.map(n => (n === last ? [n[0], 0, end - n[0]] : n));
  };
  // the bridge: the theme's opening bar climbs the scale one bar at a time, then a bar of silence
  const head = A.filter(n => n[0] < bar);
  const bridge = k => [0, 1, 2].flatMap(j => head.map(([pos, d, len]) => [pos + j * bar, d + k + j, len]));
  const parts = { A, A2: answer(A), B, B2: resolve(B), C: bridge(2), C2: bridge(3), A3: A, B3: resolve(answer(B)) };
  const progB = spec.progB || [...spec.prog].reverse();
  const steps = Array.from({ length: 32 * bar }, () => []);
  for (let b = 0; b < 32; b++) {
    const si = Math.floor(b / 4), sec = SECTIONS[si], inBar = b % 4,
      bridgeSec = sec === 'C' || sec === 'C2', breakdown = sec === 'C',
      prog = bridgeSec ? progB : spec.prog,
      chord = prog[Math.floor(b / 2) % prog.length],
      fill = inBar === 3 && FILLS[si % FILLS.length], fillAt = bar - 4;
    for (let i = 0; i < bar; i++) {
      const s = b * bar + i;
      let dch = kit[i % kit.length];
      if (breakdown) dch = i === 0 ? 'K' : i === bar / 2 ? 'S' : i % beat === 0 ? 'h' : '.';
      if (fill && i >= fillAt) dch = fill[i - fillAt];
      if (dch !== '.') steps[s].push(['d', dch]);
      if (spec.bass === 'drone' || (breakdown && spec.bass !== 'gallop')) { if (i === 0) steps[s].push(['b', deg(chord, lo), bar]); }
      // the boss gallop: da-da-DUM on every beat
      else if (spec.bass === 'gallop') { if (i % 4 !== 1) steps[s].push(['b', deg(chord, i % 4 === 0 ? lo : lo + 1), 1]); }
      else if (i % beat === 0) steps[s].push(['b', deg(chord, lo), 3]);
      else if (i % beat === beat / 2) steps[s].push(['b', deg(chord + (L > 5 ? 4 : 3), lo), 1]);
      if (breakdown) continue;
      // the B sections run the arpeggio down instead of up
      const arpN = (sec[0] === 'B' ? [7, 4, 2, 0, 2, 4] : [0, 2, 4, 7, 4, 2])[(i + b) % 6];
      if (arp === 'tremolo') steps[s].push(['a', deg(chord + [0, 2, 4][Math.floor(i / 4) % 3], 1), 1]);
      else if (arp === 'waltz') { if (i % beat === 0 && i) steps[s].push(['a', deg(chord + (i / beat === 2 ? 4 : 2), 1), 2]); }
      else if (arp !== 'off' && (spec.drums !== 'slow' || i % 2 === 0)) steps[s].push(['a', deg(chord + arpN, 1), 1]);
    }
    // this bar plays its slice of the section's phrase
    const from = inBar * bar, to = from + bar, harm = sec === 'A3' || sec === 'B3';
    for (const [pos, d, len] of parts[sec])
      if (pos >= from && pos < to) {
        steps[b * bar + pos - from].push(['l', deg(d, oct), len]);
        if (harm) steps[b * bar + pos - from].push(['h', deg(d - 2, oct), len]);
      }
  }
  const out = { steps, stepDur: 60 / spec.bpm / 4, lead: spec.lead || 'p25' };
  songCache.set(id, out);
  return out;
}
// an untitled song: a seeded random motif over 16 bars, as songs were before the themes
function oldSong(id, spec, { L, bar, r, deg, arp, beat, lo, kit }) {
  const steps = Array.from({ length: 16 * bar }, () => []), motif = [];
  for (let i = 0; i < 32; i++) {
    const strong = i % 4 === 0;
    if (!strong && r() < 0.42) continue;
    const len = strong && r() < 0.4 ? 4 : r() < 0.5 ? 2 : 1;
    motif.push([i, Math.floor(r() * 5) - (strong ? 0 : 1), len]);
  }
  for (let b = 0; b < 16; b++) {
    const chord = spec.prog[Math.floor(b / 2) % spec.prog.length], section = b >= 8 ? 1 : 0;
    for (let i = 0; i < bar; i++) {
      const s = b * bar + i, dch = kit[i % kit.length];
      if (dch !== '.') steps[s].push(['d', dch]);
      if (i % beat === 0) steps[s].push(['b', deg(chord, lo), 3]);
      else if (i % beat === beat / 2) steps[s].push(['b', deg(chord + (L > 5 ? 4 : 3), lo), 1]);
      if (arp !== 'off') steps[s].push(['a', deg(chord + [0, 2, 4, 7, 4, 2][(i + b) % 6], 1), 1]);
    }
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
  // the harmony in the theme's reprise: a quiet thin pulse under the lead
  h: (m, n, t) => chip([[N(m), n * 6 - 1], [0, 1]], { wave: 'p12', vol: 0.025, decay: 0.002, at: t, music: true }),
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
