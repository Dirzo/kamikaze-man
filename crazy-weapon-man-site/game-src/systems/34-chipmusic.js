// Chiptune music (phase 4). Replaces the core's single synth loop with a 4-channel sequencer in
// the NES/SNES style: pulse lead (25%), pulse arpeggio (12.5%), triangle bass, LFSR-noise drums.
// Every zone has its own key, mode, tempo and chord progression; bosses get faster harmonic-minor
// tracks. Melodies come from a seeded generator, so a zone always plays the same 16-bar song.
// Uses CWM_CHIPTUNE (systems/33-chiptune.js) voices routed to SND.musicGain. ?nochip disables.
(() => {
  const CT = globalThis.CWM_CHIPTUNE;
  if (!CT || globalThis.__CWM_CHIPMUSIC) return;
  globalThis.__CWM_CHIPMUSIC = true;

  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    major: [0, 2, 4, 5, 7, 9, 11],
    harmonic: [0, 2, 3, 5, 7, 8, 11]
  };
  // degree progressions (0 = tonic), 2 bars per chord
  const SONGS = [
    { key: 52, scale: 'minor', bpm: 132, prog: [0, 5, 2, 6], drums: 'march' }, // Sword Graveyard
    { key: 57, scale: 'dorian', bpm: 124, prog: [0, 3, 0, 4], drums: 'disco' }, // Disco Crypt
    { key: 50, scale: 'phrygian', bpm: 150, prog: [0, 1, 0, 6], drums: 'drive' }, // Tax Audit Volcano
    { key: 55, scale: 'dorian', bpm: 118, prog: [0, 3, 4, 0], drums: 'jig' }, // Bone Dragon Feast Hall
    { key: 48, scale: 'harmonic', bpm: 100, prog: [0, 5, 3, 4], drums: 'slow' }, // Cathedral
    { key: 54, scale: 'minor', bpm: 128, prog: [0, 5, 6, 4], drums: 'march' }, // Frozen Meat Peaks
    { key: 47, scale: 'minor', bpm: 146, prog: [0, 6, 5, 4], drums: 'drive' }, // Dad's Storm Forge
    { key: 50, scale: 'harmonic', bpm: 110, prog: [0, 3, 5, 4], drums: 'swing' }, // Witch Cottage
    { key: 58, scale: 'major', bpm: 138, prog: [0, 3, 4, 5], drums: 'march' }, // Takeover Citadel
    { key: 49, scale: 'minor', bpm: 156, prog: [0, 5, 3, 4], drums: 'drive' } // Armory Vault
  ];
  const BOSS = {
    jr: { key: 53, bpm: 176 },
    bossman: { key: 45, bpm: 164 },
    sr: { key: 47, bpm: 168 },
    grandma: { key: 50, bpm: 160 },
    ceo: { key: 46, bpm: 172 },
    weapon: { key: 44, bpm: 190 }
  };
  const DRUMS = {
    // 16 steps: K kick, S snare, h hat, . rest
    march: 'K.h.S.h.K.hKS.h.',
    disco: 'K.h.K.hSK.h.K.hS',
    drive: 'K.hKS.hKK.hKS.hS',
    jig: 'K..hS..hK..hS.hh',
    slow: 'K.......S.....h.',
    swing: 'K..h.hS..hK..hS.',
    boss: 'KhKhSKhKKhKhSKSS'
  };

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  // build one 16-bar song: per 16th-step lists of [channel, midi, steps]
  const cache = new Map();
  function song(id) {
    if (cache.has(id)) return cache.get(id);
    let spec;
    if (id.startsWith('boss:')) {
      const b = BOSS[id.slice(5)] || BOSS.jr;
      spec = { key: b.key, scale: 'harmonic', bpm: b.bpm, prog: [0, 1, 4, 0], drums: 'boss' };
    } else spec = SONGS[Number(id.slice(5)) % SONGS.length];
    const sc = SCALES[spec.scale],
      r = rng([...id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7));
    const deg = (d, oct = 0) => spec.key + sc[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
    const steps = Array.from({ length: 256 }, () => []);
    // lead motif: 2-bar phrase over each chord, B section answers an octave/third higher
    const motif = [];
    for (let i = 0; i < 32; i++) {
      const strong = i % 4 === 0;
      if (!strong && r() < 0.42) continue;
      const len = strong && r() < 0.4 ? 4 : r() < 0.5 ? 2 : 1;
      motif.push([i, Math.floor(r() * 5) - (strong ? 0 : 1), len]);
    }
    for (let bar = 0; bar < 16; bar++) {
      const chord = spec.prog[Math.floor(bar / 2) % spec.prog.length],
        section = bar >= 8 ? 1 : 0;
      for (let i = 0; i < 16; i++) {
        const s = bar * 16 + i;
        // drums
        const dch = DRUMS[spec.drums][i];
        if (dch !== '.') steps[s].push(['d', dch]);
        // triangle bass: root on the beat, fifth on the off-beat 8ths
        if (i % 4 === 0) steps[s].push(['b', deg(chord, -2), 3]);
        else if (i % 4 === 2) steps[s].push(['b', deg(chord + 4, -2), 1]);
        // 12.5% arpeggio: chord tones in 16ths, up and down
        const arp = [0, 2, 4, 7, 4, 2][(i + bar) % 6];
        if (spec.drums !== 'slow' || i % 2 === 0) steps[s].push(['a', deg(chord + arp, 1), 1]);
      }
      // lead from the motif (shifted into the current chord)
      for (const [pos, d, len] of motif) {
        if (Math.floor(pos / 16) !== bar % 2) continue;
        const s = bar * 16 + (pos % 16);
        steps[s].push(['l', deg(chord + d + (section ? 2 : 0), 1), len]);
      }
    }
    const out = { steps, stepDur: 60 / spec.bpm / 4 };
    cache.set(id, out);
    return out;
  }

  const N = m => 440 * Math.pow(2, (m - 69) / 12);
  let current = '',
    pos = 0;
  const VOICE = {
    l: (m, n, t) => CT.chip([[N(m), n * 6 - 1], [0, 1]], { wave: 'p25', vol: 0.05, decay: 0.002, at: t, out: 'music' }),
    a: (m, n, t) => CT.chip([[N(m), 3]], { wave: 'p12', vol: 0.022, decay: 0.004, at: t, out: 'music' }),
    b: (m, n, t) => CT.chip([[N(m), n * 6 - 1], [0, 1]], { wave: 'tri', vol: 0.11, decay: 0.002, at: t, out: 'music' })
  };
  function drum(kind, t) {
    if (kind === 'K') {
      CT.chip([[N(45), 1], [N(38), 1], [N(31), 2]], { wave: 'tri', vol: 0.12, decay: 0.02, at: t, out: 'music' });
    } else if (kind === 'S') CT.hiss(5, { vol: 0.07, rate: 0.55, drop: 0.05, at: t, out: 'music' });
    else CT.hiss(2, { vol: 0.03, rate: 1.6, short: true, at: t, out: 'music' });
  }

  scheduleMusic = function () {
    const a = audioInit();
    if (!a || !SND.musicOn) return;
    const id = bossMode ? 'boss:' + bossMode : 'zone:' + (zoneI || 0);
    if (id !== current) {
      current = id;
      pos = 0;
    }
    const sg = song(id);
    while (SND.musicNext < a.currentTime + 0.25) {
      const t = SND.musicNext;
      for (const ev of sg.steps[pos % sg.steps.length]) {
        if (ev[0] === 'd') drum(ev[1], t);
        else VOICE[ev[0]](ev[1], ev[2], t);
      }
      pos++;
      SND.musicNext += sg.stepDur;
    }
  };
  // Offline preview: `seconds` of each listed song back to back (ids like 'zone:0', 'boss:jr').
  async function preview(ids = ['zone:0', 'zone:1', 'zone:8', 'boss:jr'], seconds = 8) {
    return CT.renderOffline(ids.length * seconds + 0.5, () => {
      ids.forEach((id, k) => {
        const sg = song(id);
        let t = k * seconds,
          p = 0;
        while (t < (k + 1) * seconds - 0.05) {
          for (const ev of sg.steps[p % sg.steps.length]) {
            if (ev[0] === 'd') drum(ev[1], t);
            else VOICE[ev[0]](ev[1], ev[2], t);
          }
          p++;
          t += sg.stepDur;
        }
      });
    });
  }
  globalThis.CWM_CHIPMUSIC = { song, SONGS, BOSS, preview };
})();
