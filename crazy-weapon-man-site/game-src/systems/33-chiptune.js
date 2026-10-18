// Chiptune sound effects (phase 4). Replaces the core's sine/saw synth sweeps with 16-bit-style
// sounds: pulse waves at 12.5 / 25 / 50% duty, triangle bass, and the classic 15-bit LFSR noise
// channel (long and short "metallic" modes). Pitch and volume move in 1/60 s steps, like a
// sound driver updating once per video frame, instead of smooth ramps.
// Same function names and arguments as core/04-player-audio.js, same output bus (SND.comp),
// same anti-spam gates. ?nochip keeps the original sounds.
(() => {
  if (globalThis.__CWM_CHIPTUNE || new URLSearchParams(location.search).has('nochip')) return;
  globalThis.__CWM_CHIPTUNE = true;
  const FR = 1 / 60;
  let waves = null,
    lfsr = null,
    offset = 0; // extra start delay, used by the offline preview to lay sounds end to end

  function ready() {
    const a = audioInit();
    if (!a || !SND.comp) return null;
    if (!waves) {
      const pulse = duty => {
        const n = 64,
          re = new Float32Array(n),
          im = new Float32Array(n);
        for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); // pulse wave series
        return a.createPeriodicWave(re, im, { disableNormalization: false });
      };
      waves = { p12: pulse(0.125), p25: pulse(0.25), p50: pulse(0.5) };
      const mk = short => {
        // 15-bit LFSR noise, one sample per "clock"; played back at different rates for pitch
        const len = short ? 93 * 64 : 32767,
          b = a.createBuffer(1, len, a.sampleRate),
          d = b.getChannelData(0);
        let r = 1;
        for (let i = 0; i < len; i++) {
          const bit = (r ^ (r >> (short ? 6 : 1))) & 1;
          r = (r >> 1) | (bit << 14);
          d[i] = r & 1 ? 0.8 : -0.8;
        }
        return b;
      };
      lfsr = { long: mk(false), short: mk(true) };
    }
    return a;
  }

  // steps: [[freq, frames], ...]; vol: start volume; decay: volume lost per frame (stepped)
  function chip(steps, { wave = 'p25', vol = 0.05, decay = 0.004, delay = 0, at = null, out = 'sfx' } = {}) {
    const a = ready();
    if (!a) return;
    const t0 = (at != null ? at : a.currentTime + 0.005 + delay) + offset,
      o = a.createOscillator(),
      g = a.createGain();
    if (wave === 'tri') o.type = 'triangle';
    else o.setPeriodicWave(waves[wave]);
    let t = t0,
      v = vol,
      total = 0;
    g.gain.setValueAtTime(0, t0);
    for (const [f, n] of steps) {
      for (let i = 0; i < n; i++) {
        o.frequency.setValueAtTime(Math.max(20, f), t);
        g.gain.setValueAtTime(f > 0 ? Math.max(0, v) : 0, t);
        v -= decay;
        t += FR;
        total++;
      }
    }
    g.gain.setValueAtTime(0, t);
    o.connect(g);
    g.connect(out === 'music' && SND.musicGain ? SND.musicGain : SND.comp);
    o.start(t0);
    o.stop(t + 0.02);
  }

  // noise burst: rate = playback speed (higher = brighter), stepped decay, optional pitch drop per frame
  function hiss(frames, { vol = 0.05, rate = 1, drop = 0, short = false, delay = 0, at = null, out = 'sfx' } = {}) {
    const a = ready();
    if (!a) return;
    const t0 = (at != null ? at : a.currentTime + 0.005 + delay) + offset,
      s = a.createBufferSource(),
      g = a.createGain();
    s.buffer = short ? lfsr.short : lfsr.long;
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
    g.connect(out === 'music' && SND.musicGain ? SND.musicGain : SND.comp);
    s.start(t0);
    s.stop(t + 0.02);
  }

  const N = m => 440 * Math.pow(2, (m - 69) / 12); // midi note -> Hz
  const arp = (notes, frames, opts) => chip(notes.map(m => [N(m), frames]), opts);

  sfxAttack = function (w) {
    if (!sndGate('atk', 18)) return;
    const q = rarityRank(w),
      v = 0.035 + q * 0.002,
      up = Math.min(q, 8);
    switch (w.type) {
      case 'sword':
      case 'katana':
        hiss(4, { vol: v, rate: w.type === 'katana' ? 0.9 : 0.6, drop: 0.12 });
        chip([[N(79 + up), 1], [N(74 + up), 1], [N(67 + up), 2]], { wave: 'p12', vol: v * 0.8, decay: 0.006 });
        break;
      case 'dagger':
      case 'shuriken':
        chip([[N(88 + up), 1], [N(83 + up), 2]], { wave: 'p12', vol: v * 0.7, decay: 0.01 });
        hiss(2, { vol: v * 0.6, rate: 1.4, short: true });
        break;
      case 'nunchucks':
        chip([[N(76 + up), 1], [N(71 + up), 1]], { wave: 'p25', vol: v * 0.7 });
        chip([[N(81 + up), 1], [N(76 + up), 1]], { wave: 'p25', vol: v * 0.5, delay: 0.04 });
        break;
      case 'bow':
        chip([[N(72 + up), 1], [N(60 + up), 1], [N(55 + up), 3]], { wave: 'p50', vol: v * 0.8, decay: 0.008 });
        break;
      case 'wand':
        arp([72 + up, 76 + up, 79 + up, 84 + up], 1, { wave: 'p25', vol: v * 0.7, decay: 0.003 });
        break;
      case 'staff':
        arp([60 + up, 67 + up, 72 + up, 79 + up], 2, { wave: 'p50', vol: v * 0.75, decay: 0.003 });
        hiss(5, { vol: v * 0.4, rate: 0.3 });
        break;
      default: // hammer
        chip([[N(45), 2], [N(40), 2], [N(33), 3]], { wave: 'tri', vol: v * 2.2, decay: 0.012 });
        hiss(6, { vol: v * 1.1, rate: 0.25, drop: 0.1 });
    }
    if (q >= 6) arp([96, 100, 103], 1, { wave: 'p12', vol: 0.02, delay: 0.03 });
  };

  sfxSkill = function () {
    if (!sndGate('skill', 120)) return;
    arp([60, 64, 67, 72, 76, 79, 84], 2, { wave: 'p25', vol: 0.055, decay: 0.002 });
    hiss(14, { vol: 0.05, rate: 0.35, drop: -0.03 });
  };

  sfxHit = function (isCrit = false, pow = 1) {
    if (!sndGate(isCrit ? 'hitc' : 'hit', isCrit ? 25 : 30)) return;
    hiss(3, { vol: 0.045 + Math.min(0.03, pow * 0.01), rate: 0.7, drop: 0.15 });
    chip([[N(57), 1], [N(52), 1]], { wave: 'p50', vol: 0.03, decay: 0.01 });
  };

  sfxCrit = function (damage = 0) {
    if (!sndGate('crit', 45)) return;
    const big = Math.log10(Math.max(10, damage)) > 3;
    arp(big ? [84, 91, 96] : [84, 91], 2, { wave: 'p12', vol: 0.05, decay: 0.002 });
    hiss(4, { vol: 0.05, rate: 1.1, short: true });
  };

  sfxKill = function (elite = false) {
    if (!sndGate('kill', 30)) return;
    if (elite) arp([79, 74, 67, 62, 55], 2, { wave: 'p25', vol: 0.05, decay: 0.002 });
    else arp([76, 71, 64], 1, { wave: 'p25', vol: 0.04, decay: 0.004 });
    hiss(5, { vol: 0.04, rate: 0.45, drop: 0.1 });
  };

  sfxLoot = function (w) {
    if (!sndGate('loot', 60)) return;
    const q = w ? rarityRank(w) : 0;
    chip([[N(83), 4], [N(88), 12]], { wave: 'p50', vol: 0.05, decay: 0.002 }); // the coin
    if (q >= 3) arp([88, 92, 95, 100], 2, { wave: 'p12', vol: 0.035, decay: 0.001, delay: 0.27 });
  };

  sfxEnemyCast = function () {
    if (!sndGate('ecast', 90)) return;
    chip([[N(62), 2], [N(63), 2], [N(62), 2], [N(65), 2], [N(70), 3]], { wave: 'p12', vol: 0.028, decay: 0.001 });
  };

  sfxEnemyMelee = function () {
    if (!sndGate('emelee', 70)) return;
    hiss(4, { vol: 0.035, rate: 0.5, drop: 0.08 });
    chip([[N(50), 1], [N(45), 2]], { wave: 'p25', vol: 0.025, decay: 0.006 });
  };

  sfxExplosion = function (pow = 1) {
    if (!sndGate('boom', 60)) return;
    hiss(Math.round(18 + pow * 6), { vol: 0.08 + Math.min(0.04, pow * 0.015), rate: 0.5, drop: 0.06 });
    chip([[N(40), 3], [N(36), 3], [N(31), 4]], { wave: 'tri', vol: 0.09, decay: 0.008 });
  };

  sfxHurt = function () {
    if (!sndGate('hurt', 120)) return;
    chip([[N(67), 2], [N(60), 2], [N(55), 2], [N(48), 3]], { wave: 'p50', vol: 0.06, decay: 0.004 });
    hiss(4, { vol: 0.05, rate: 0.6 });
  };

  sfxJump = function () {
    if (!sndGate('jump', 60)) return;
    chip([[N(60), 1], [N(64), 1], [N(67), 1], [N(72), 2]], { wave: 'p25', vol: 0.035, decay: 0.004 });
  };

  sfxDash = function () {
    if (!sndGate('dash', 90)) return;
    hiss(7, { vol: 0.045, rate: 0.4, drop: -0.12 });
  };

  sfxLand = function (v) {
    if (!sndGate('land', 120) || (v || 0) < 260) return;
    hiss(3, { vol: 0.03, rate: 0.25 });
  };

  sfxChaos = function () {
    if (!sndGate('chaos', 300)) return;
    arp([72, 66, 73, 65, 74, 64, 75], 2, { wave: 'p12', vol: 0.04, decay: 0.001 });
  };

  sfxZone = function () {
    if (!sndGate('zone', 400)) return;
    arp([60, 67, 72], 5, { wave: 'p25', vol: 0.05, decay: 0.001 });
    arp([64, 71, 76], 5, { wave: 'p50', vol: 0.035, decay: 0.001 });
  };

  sfxLevelUp = function () {
    if (!sndGate('lvl', 300)) return;
    arp([72, 76, 79, 84, 79, 84, 88], 3, { wave: 'p25', vol: 0.05, decay: 0.0008 });
    arp([60, 64, 67, 72, 67, 72, 76], 3, { wave: 'tri', vol: 0.06, decay: 0.0008 });
  };

  uiChime = function (strong = false) {
    if (!sndGate('ui', 50)) return;
    arp(strong ? [88, 95] : [88], 2, { wave: 'p12', vol: 0.03, decay: 0.003 });
  };

  sfxStageClear = function () {
    if (!sndGate('clear', 600)) return;
    arp([67, 72, 76, 79, 84], 4, { wave: 'p25', vol: 0.055, decay: 0.0008 });
    arp([55, 60, 64, 67, 72], 4, { wave: 'tri', vol: 0.06, decay: 0.0008 });
  };

  function toWav(buf) {
    const sr = buf.sampleRate,
      d = buf.getChannelData(0),
      n = d.length,
      bytes = new Uint8Array(44 + n * 2),
      v = new DataView(bytes.buffer);
    const wr = (o, s) => [...s].forEach((c, i) => (bytes[o + i] = c.charCodeAt(0)));
    wr(0, 'RIFF');
    v.setUint32(4, 36 + n * 2, true);
    wr(8, 'WAVEfmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    wr(36, 'data');
    v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(bin);
  }
  // Run fn with SND pointed at an offline context; returns the rendered WAV (base64).
  async function renderOffline(seconds, fn) {
    const off = new OfflineAudioContext(1, Math.ceil(44100 * seconds), 44100);
    const saved = { ctx: SND.ctx, comp: SND.comp, musicGain: SND.musicGain, on: SND.on, musicOn: SND.musicOn, waves, lfsr };
    SND.ctx = off;
    SND.comp = off.createGain();
    SND.comp.gain.value = 1.6;
    SND.comp.connect(off.destination);
    SND.musicGain = off.createGain();
    SND.musicGain.gain.value = 0.7;
    SND.musicGain.connect(off.destination);
    SND.on = true;
    waves = null;
    lfsr = null;
    try {
      fn(off);
    } finally {
      offset = 0;
      Object.assign(SND, { ctx: saved.ctx, comp: saved.comp, musicGain: saved.musicGain, on: saved.on, musicOn: saved.musicOn });
      waves = saved.waves;
      lfsr = saved.lfsr;
    }
    return toWav(await off.startRendering());
  }

  // Offline preview: renders every effect end to end into a WAV (base64) for listening checks.
  async function preview() {
    const sr = 44100,
      list = [
        ['sword', () => sfxAttack({ type: 'sword', rar: 'Common' })],
        ['katana', () => sfxAttack({ type: 'katana', rar: 'Rare' })],
        ['dagger', () => sfxAttack({ type: 'dagger', rar: 'Common' })],
        ['nunchucks', () => sfxAttack({ type: 'nunchucks', rar: 'Common' })],
        ['bow', () => sfxAttack({ type: 'bow', rar: 'Common' })],
        ['wand', () => sfxAttack({ type: 'wand', rar: 'Common' })],
        ['staff', () => sfxAttack({ type: 'staff', rar: 'Common' })],
        ['hammer', () => sfxAttack({ type: 'hammer', rar: 'Common' })],
        ['hit', () => sfxHit(false, 1)],
        ['crit', () => sfxCrit(5000)],
        ['kill', () => sfxKill(false)],
        ['elite kill', () => sfxKill(true)],
        ['loot', () => sfxLoot({ type: 'sword', rar: 'Legendary' })],
        ['special', () => sfxSkill()],
        ['jump', () => sfxJump()],
        ['dash', () => sfxDash()],
        ['hurt', () => sfxHurt()],
        ['enemy cast', () => sfxEnemyCast()],
        ['enemy melee', () => sfxEnemyMelee()],
        ['explosion', () => sfxExplosion(2)],
        ['level up', () => sfxLevelUp()],
        ['stage clear', () => sfxStageClear()],
        ['zone', () => sfxZone()]
      ],
      gap = 0.75,
      off = new OfflineAudioContext(1, Math.ceil(sr * (list.length * gap + 1)), sr);
    const saved = { ctx: SND.ctx, comp: SND.comp, on: SND.on, waves, lfsr };
    SND.ctx = off;
    SND.comp = off.createGain();
    SND.comp.gain.value = 1.6;
    SND.comp.connect(off.destination);
    SND.on = true;
    waves = null;
    lfsr = null;
    try {
      list.forEach(([, fn], i) => {
        SND.last = {};
        offset = i * gap;
        fn();
      });
    } finally {
      offset = 0;
      Object.assign(SND, { ctx: saved.ctx, comp: saved.comp, on: saved.on });
      waves = saved.waves;
      lfsr = saved.lfsr;
    }
    const buf = await off.startRendering(),
      d = buf.getChannelData(0),
      n = d.length,
      bytes = new Uint8Array(44 + n * 2),
      v = new DataView(bytes.buffer);
    const wr = (o, s) => [...s].forEach((c, i) => (bytes[o + i] = c.charCodeAt(0)));
    wr(0, 'RIFF');
    v.setUint32(4, 36 + n * 2, true);
    wr(8, 'WAVEfmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    wr(36, 'data');
    v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return { wav: btoa(bin), order: list.map(x => x[0]), gap };
  }

  globalThis.CWM_CHIPTUNE = { chip, hiss, preview, renderOffline, version: 'phase4' };
})();
