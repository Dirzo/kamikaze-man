  const pl = {
    x: 82,
    y: 470,
    w: 34,
    h: 50,
    vx: 0,
    vy: 0,
    dir: 1,
    on: false,
    lv: 1,
    xp: 0,
    xpn: 72,
    hp: 420,
    max: 420,
    mana: 100,
    armor: 12,
    crit: 0.11,
    move: 280,
    acd: 0,
    scd: 0,
    dcd: 0,
    dashT: 0,
    dashDir: 1,
    dashAir: false,
    inv: 0,
    at: 0,
    atMax: 0.3,
    combo: 0,
    weapon: null,
    armors: { head: null, body: null, feet: null },
    boonDamage: 1,
    boonSpeed: 1,
    boonCrit: 0,
    healMult: 1,
    damageTaken: 1,
    dashMult: 1,
    aoeMult: 1,
    skillCost: 25,
    warranty: 0,
    boonPocket: 0,
    boonDash: 0,
    boonIntern: 0,
    boonTax: 0,
    boonFart: 0,
    boonDad: 0,
    boonSoup: 0,
    boonScream: 0
  };
  // Self-contained WebAudio SFX engine. No external audio files required.
  const SND = {
    ctx: null,
    master: null,
    comp: null,
    noise: null,
    on: true,
    last: {},
    musicGain: null,
    musicTimer: null,
    musicStep: 0,
    musicNext: 0,
    musicOn: false
  };
  function audioInit() {
    if (!SND.on) return null;
    try {
      let A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      if (!SND.ctx) {
        let a = (SND.ctx = new A()),
          comp = (SND.comp = a.createDynamicsCompressor()),
          master = (SND.master = a.createGain()),
          music = (SND.musicGain = a.createGain());
        comp.threshold.value = -18;
        comp.knee.value = 18;
        comp.ratio.value = 7;
        comp.attack.value = 0.002;
        comp.release.value = 0.13;
        master.gain.value = 0.28;
        music.gain.value = 0.12;
        comp.connect(master);
        music.connect(master);
        master.connect(a.destination);
        let b = a.createBuffer(1, a.sampleRate, a.sampleRate),
          d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        SND.noise = b;
      }
      if (SND.ctx.state === 'suspended') SND.ctx.resume().catch(() => {});
      return SND.ctx;
    } catch (err) {
      SND.on = false;
      SND.musicOn = false;
      if (SND.musicTimer) {
        clearInterval(SND.musicTimer);
        SND.musicTimer = null;
      }
      let b = document.getElementById('sound');
      if (b) b.textContent = 'Sound: BLOCKED';
      return null;
    }
  }

  function musicTone(freq, dur = 0.12, g = 0.028, type = 'square', when = 0) {
    let a = audioInit();
    if (!a || !SND.musicGain) return;
    let t = Math.max(a.currentTime + 0.005, when || a.currentTime),
      o = a.createOscillator(),
      v = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(30, freq), t);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(Math.max(0.0002, g), t + 0.008);
    v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v);
    v.connect(SND.musicGain);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
  function musicKick(when) {
    let a = audioInit();
    if (!a || !SND.musicGain) return;
    let o = a.createOscillator(),
      v = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(125, when);
    o.frequency.exponentialRampToValueAtTime(42, when + 0.1);
    v.gain.setValueAtTime(0.07, when);
    v.gain.exponentialRampToValueAtTime(0.0001, when + 0.13);
    o.connect(v);
    v.connect(SND.musicGain);
    o.start(when);
    o.stop(when + 0.15);
  }
  function musicHat(when, open = false) {
    let a = audioInit();
    if (!a || !SND.noise || !SND.musicGain) return;
    let src = a.createBufferSource(),
      fil = a.createBiquadFilter(),
      v = a.createGain();
    src.buffer = SND.noise;
    fil.type = 'highpass';
    fil.frequency.value = 5200;
    v.gain.setValueAtTime(open ? 0.018 : 0.012, when);
    v.gain.exponentialRampToValueAtTime(0.0001, when + (open ? 0.11 : 0.035));
    src.connect(fil);
    fil.connect(v);
    v.connect(SND.musicGain);
    src.start(when);
    src.stop(when + (open ? 0.13 : 0.05));
  }
  function scheduleMusic() {
    let a = audioInit();
    if (!a || !SND.musicOn) return;
    const bpm = bossMode
        ? bossMode === 'jr'
          ? 184
          : bossMode === 'weapon'
            ? 198
            : bossMode === 'grandma'
              ? 172
              : bossMode === 'ceo'
                ? 176
                : 166
        : 156,
      stepDur = 60 / bpm / 4,
      roots = bossMode
        ? bossMode === 'jr'
          ? [98, 116.54, 82.41, 130.81, 98, 146.83, 82.41, 110]
          : [55, 65.41, 49, 73.42, 55, 82.41, 49, 61.74]
        : [82.41, 82.41, 98, 73.42, 82.41, 110, 98, 73.42],
      mel = [0, 7, 10, 12, 7, 15, 12, 10, 0, 7, 12, 15, 17, 15, 12, 7];
    while (SND.musicNext < a.currentTime + 0.22) {
      let s = SND.musicStep++,
        bar = Math.floor(s / 16),
        i = s % 16,
        root = roots[bar % roots.length],
        t = SND.musicNext;
      if (i % 4 === 0) musicKick(t);
      if (i % 2 === 0) musicHat(t, i === 14);
      if (i === 4 || i === 12) {
        musicTone(185, 0.05, 0.013, 'square', t);
        musicHat(t, true);
      }
      let riff = [0, 0, 7, 0, 10, 7, 12, 10][Math.floor(i / 2) % 8];
      if (i % 2 === 0) musicTone(root * Math.pow(2, riff / 12), stepDur * 1.65, 0.028, 'sawtooth', t);
      if ((i + bar) % 2 === 0)
        musicTone(root * 2 * Math.pow(2, mel[i] / 12), stepDur * 0.72, 0.012, 'square', t);
      if (i === 15)
        musicTone(root * 4 * Math.pow(2, (bar % 3 ? 12 : 17) / 12), stepDur * 0.9, 0.015, 'triangle', t);
      SND.musicNext += stepDur;
    }
  }
  function startMusic() {
    let a = audioInit();
    if (!a || SND.musicOn) return;
    SND.musicOn = true;
    SND.musicStep = 0;
    SND.musicNext = a.currentTime + 0.06;
    scheduleMusic();
    SND.musicTimer = setInterval(scheduleMusic, 55);
  }
  function stopMusic() {
    SND.musicOn = false;
    if (SND.musicTimer) {
      clearInterval(SND.musicTimer);
      SND.musicTimer = null;
    }
  }
  function sndGate(k, ms = 35) {
    let n = performance.now(),
      last = SND.last[k] || 0;
    if (n - last < ms) return false;
    SND.last[k] = n;
    return true;
  }
  function tone(f1, f2, d = 0.08, g = 0.04, type = 'sine', delay = 0) {
    let a = audioInit();
    if (!a) return;
    let t = a.currentTime + delay,
      o = a.createOscillator(),
      v = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(30, f1), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f2 || f1), t + d);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(Math.max(0.0002, g), t + 0.006);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v);
    v.connect(SND.comp);
    o.start(t);
    o.stop(t + d + 0.02);
  }
  function noise(d = 0.07, g = 0.035, f = 1200, type = 'bandpass', delay = 0) {
    let a = audioInit();
    if (!a) return;
    let t = a.currentTime + delay,
      src = a.createBufferSource(),
      fil = a.createBiquadFilter(),
      v = a.createGain();
    src.buffer = SND.noise;
    fil.type = type;
    fil.frequency.value = f;
    fil.Q.value = type === 'bandpass' ? 1.1 : 0.5;
    v.gain.setValueAtTime(Math.max(0.0002, g), t);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(fil);
    fil.connect(v);
    v.connect(SND.comp);
    src.start(t);
    src.stop(t + d + 0.02);
  }
  function sfxAttack(w) {
    if (!sndGate('atk', 18)) return;
    let q = rarityRank(w),
      g = 0.026 + q * 0.0025;
    if (w.type === 'sword') {
      noise(0.075, g, 1100);
      tone(210 + q * 10, 70, 0.09, g * 0.8, 'sawtooth');
    } else if (w.type === 'dagger') {
      noise(0.045, g * 0.8, 2100);
      tone(620, 230, 0.045, g * 0.65, 'triangle');
    } else if (w.type === 'nunchucks') {
      noise(0.035, g * 0.75, 1700);
      tone(310 + q * 9, 155, 0.045, g * 0.7, 'square');
      tone(520, 250, 0.035, g * 0.35, 'triangle', 0.018);
    } else if (w.type === 'katana') {
      noise(0.055, g, 2600, 'highpass');
      tone(820 + q * 12, 180, 0.065, g * 0.8, 'triangle');
      tone(1450, 620, 0.035, g * 0.3, 'sine', 0.012);
    } else if (w.type === 'bow') {
      tone(420 + q * 12, 110, 0.075, g * 0.7, 'triangle');
      tone(920, 420, 0.035, g * 0.35, 'sine', 0.008);
      noise(0.025, g * 0.35, 2800);
    } else if (w.type === 'shuriken') {
      noise(0.032, g * 0.55, 3300, 'highpass');
      tone(1180 + q * 18, 520, 0.04, g * 0.55, 'triangle');
    } else if (w.type === 'wand') {
      tone(430 + q * 25, 980 + q * 50, 0.095, g * 0.8, 'triangle');
      tone(1180, 760, 0.08, g * 0.3, 'sine', 0.018);
    } else if (w.type === 'staff') {
      tone(180, 520 + q * 24, 0.14, g * 0.85, 'sawtooth');
      noise(0.09, g * 0.55, 700, 'lowpass');
    } else {
      tone(95, 42, 0.12, g * 1.25, 'square');
      noise(0.11, g * 1.15, 380, 'lowpass');
    }
    if (q >= 6) tone(880 + q * 35, 1760 + q * 55, 0.12, 0.018, 'sine', 0.01);
  }
  function sfxSkill(w) {
    let q = rarityRank(w);
    noise(0.18, 0.045 + q * 0.003, 620, 'lowpass');
    tone(95, 48, 0.22, 0.065 + q * 0.002, 'sawtooth');
    tone(360 + q * 22, 980 + q * 55, 0.18, 0.04, 'triangle', 0.025);
    if (q >= 4) {
      tone(740, 1480, 0.15, 0.026, 'sine', 0.05);
      tone(1110, 2220, 0.13, 0.018, 'sine', 0.09);
    }
  }
  function sfxHit(isCrit = false, pow = 1, damage = 0) {
    if (!sndGate(isCrit ? 'crithit' : 'hit', isCrit ? 8 : 24)) return;
    pow = clamp(pow, 0.6, 2.2);
    let tier = clamp(Math.log10(Math.max(1, damage || 20)) - 1, 0, 4),
      spark = 1 + tier * 0.12;
    noise(isCrit ? 0.085 : 0.04, (isCrit ? 0.055 : 0.023) * pow, isCrit ? 1800 : 950);
    tone(
      (isCrit ? 175 : 118) * spark,
      isCrit ? 62 : 74,
      isCrit ? 0.105 : 0.058,
      (isCrit ? 0.044 : 0.023) * pow,
      'square'
    );
    if (!isCrit && tier > 1.2) tone(520 * spark, 840 * spark, 0.055, 0.009 + 0.003 * tier, 'triangle', 0.006);
  }
  function sfxCrit(damage = 0) {
    if (!sndGate('crit', 14)) return;
    let tier = clamp(Math.log10(Math.max(10, damage)) - 1, 0, 4),
      root = 690 + tier * 115,
      g = 0.034 + tier * 0.004;
    tone(root, root * 1.58, 0.095, g, 'triangle');
    tone(root * 1.25, root * 2.08, 0.13, g * 0.82, 'sine', 0.022);
    tone(root * 1.9, root * 3.05, 0.16, g * 0.62, 'sine', 0.055);
    noise(0.075, 0.025 + tier * 0.004, 2300 + tier * 350, 'highpass');
    if (tier > 2.2) tone(108, 46, 0.13, 0.035 + tier * 0.004, 'sawtooth');
  }
  function sfxKill(elite = false, one = false) {
    if (!sndGate('kill', 38)) return;
    tone(elite ? 120 : 170, 52, 0.12, elite ? 0.06 : 0.035, 'sawtooth');
    noise(0.08, elite ? 0.05 : 0.025, 520, 'lowpass');
    if (one) tone(740, 1180, 0.08, 0.025, 'triangle', 0.025);
  }
  function sfxLoot(w) {
    let q = rarityRank(w),
      steps = Math.min(7, 2 + Math.floor(q / 2)),
      root = 330 + q * 28;
    for (let i = 0; i < steps; i++)
      tone(
        root * Math.pow(2, i / 7),
        root * Math.pow(2, (i + 1) / 7),
        0.13,
        0.025 + q * 0.002,
        'sine',
        i * 0.055
      );
    if (q >= 4) {
      tone(82, 41, 0.34, 0.065, 'sawtooth');
      noise(0.24, 0.035 + q * 0.003, 480, 'lowpass');
    }
    if (q >= 8) tone(1900, 3200, 0.28, 0.03, 'sine', 0.15);
  }
  function sfxEnemyCast(e, d) {
    if (!sndGate('ecast' + e.id, 100)) return;
    if (e.type === 'taxman') {
      noise(0.06, 0.028, 3200, 'highpass');
      tone(690, 420, 0.09, 0.025, 'square');
    } else {
      tone(d.air ? 620 : 280, d.air ? 1080 : 720, 0.14, 0.028, 'triangle');
      noise(0.09, 0.022, 1400);
    }
  }
  function sfxEnemyMelee(e, d) {
    if (!sndGate('emelee' + e.id, 80)) return;
    if (d.atk === 'cleave') {
      noise(0.11, 0.045, 650, 'lowpass');
      tone(105, 58, 0.11, 0.04, 'square');
    } else if (d.atk === 'bite') {
      noise(0.06, 0.034, 1500);
      tone(300, 90, 0.07, 0.023, 'sawtooth');
    } else {
      noise(0.07, 0.03, 1200);
      tone(220, 95, 0.07, 0.025, 'sawtooth');
    }
  }
  function sfxExplosion(pow = 1) {
    if (!sndGate('boom', 42)) return;
    pow = clamp(pow, 0.5, 2.2);
    noise(0.24, 0.065 * pow, 310, 'lowpass');
    tone(76, 32, 0.28, 0.07 * pow, 'sawtooth');
    tone(150, 48, 0.16, 0.035 * pow, 'square', 0.01);
  }
  function sfxHurt() {
    if (!sndGate('hurt', 90)) return;
    noise(0.065, 0.04, 850);
    tone(190, 105, 0.09, 0.035, 'square');
  }
  function sfxJump() {
    if (!sndGate('jump', 100)) return;
    tone(180, 310, 0.07, 0.018, 'triangle');
  }
  function sfxDash() {
    if (!sndGate('dash', 90)) return;
    noise(0.09, 0.032, 1800, 'highpass');
    tone(360, 110, 0.08, 0.018, 'triangle');
  }
  function sfxLand(v) {
    if (v < 300 || !sndGate('land', 90)) return;
    noise(0.07, Math.min(0.035, v / 18000), 330, 'lowpass');
    tone(92, 58, 0.06, 0.018, 'square');
  }
  function sfxChaos() {
    tone(220, 440, 0.18, 0.035, 'sawtooth');
    tone(330, 165, 0.2, 0.03, 'square', 0.16);
    noise(0.25, 0.02, 700, 'bandpass');
  }
  function sfxZone() {
    for (let i = 0; i < 4; i++)
      tone(110 * Math.pow(2, i / 3), 220 * Math.pow(2, i / 3), 0.28, 0.035, 'triangle', i * 0.07);
    noise(0.3, 0.03, 420, 'lowpass');
  }
  function sfxLevelUp(lv) {
    audioInit();
    let root = 261.63 * Math.pow(2, Math.min(7, Math.max(0, lv - 1)) / 12);
    [0, 4, 7, 12].forEach((n, i) =>
      tone(root * Math.pow(2, n / 12), root * Math.pow(2, (n + 5) / 12), 0.22, 0.038, 'triangle', i * 0.065)
    );
    tone(root * 2, root * 4, 0.34, 0.026, 'sine', 0.25);
    noise(0.12, 0.018, 1500, 'highpass');
  }
  function uiChime(strong = false) {
    if (!sndGate(strong ? 'uichime2' : 'uichime1', strong ? 90 : 60)) return;
    let root = strong ? 760 : 540;
    tone(root, root * 1.33, 0.12, strong ? 0.024 : 0.015, 'triangle');
    tone(root * 1.52, root * 1.92, 0.15, strong ? 0.016 : 0.01, 'sine', 0.032);
    if (strong) tone(root * 0.75, root * 0.56, 0.14, 0.012, 'sine', 0.018);
  }
  function sfxStageClear() {
    audioInit();
    [0, 7, 12, 16].forEach((n, i) =>
      tone(196 * Math.pow(2, n / 12), 392 * Math.pow(2, n / 12), 0.3, 0.034, 'square', i * 0.08)
    );
    noise(0.22, 0.025, 1100, 'highpass');
  }
