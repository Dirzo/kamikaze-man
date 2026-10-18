// Weapon looks (phase 4): every weapon is drawn the way it is named.
//
// systems/36-weapon-names.js records which words a name used (w.__look). From those words:
//   base word   -> sprite variant (Longsword, Claymore, Shiv, Flails, Scepter, Maul, ...)
//   palette     -> element > grand word > adjective > condition > rarity colour
//                  (Rusty = rust, Royal = gold, Eldritch = violet, Starfire = embers, ...)
//   details     -> baked into the sprite: rust speckles, chips, cracks, dents, bends, goo, price
//                  tags, teeth, spikes, grumpy eyes, sunglasses, chains, moss, jewels, a goose beak
//   motion      -> Wobbly wobbles, Loose rattles, Jittery jitters, Rowdy bounces, Sad droops
//   particles   -> embers, frost, sparks, bubbles, drips, ghosts, curse smoke, steam, rain, notes
//   tier glow   -> relic names get a pulsing aura, numbered relics add orbiting runes, the absurd
//                  top tier cycles through the rainbow, standouts sparkle gold
//   attacks     -> slashes and projectiles take the weapon's colour and leave the same particles
// Drops on the ground and the HUD icon show the same look. Pixel-space only (needs CWM_PX).
(() => {
  const PX = globalThis.CWM_PX;
  if (!PX || PX.__looks) return;
  PX.__looks = true;
  const ART = PX._art;
  const SCALE = 0.375;

  const HEX = {
    ink: '#1a1428', night: '#2b2442', slate: '#3e3a5c', stone: '#5d5a7a', fog: '#8a89a6', mist: '#c3c4d6',
    paper: '#f4f1e8', woodD: '#5d2f14', wood: '#8a4f22', rust: '#c4501f', orange: '#f08a2c', gold: '#ffc15a',
    cream: '#f8e08e', sand: '#c9a66b', wine: '#7a1f2b', red: '#c4363e', coral: '#f06a52', pine: '#2f5a2c',
    leaf: '#4f8a3a', grass: '#7cc254', lime: '#b7e27a', navy: '#1d2b6b', blue: '#2f5fbf', sky: '#5aa6f0',
    ice: '#a8dcfd', indigo: '#22107f', violet: '#7a4bc2', teal: '#3bb8a8', pink: '#ff6fb5'
  };
  const pack = name => {
    const [r, g, b] = PX._hexRgb(HEX[name] || name);
    return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  };

  // ---- palettes (light, mid, dark) by word ----
  const ELEM = {
    fire: ['cream', 'orange', 'rust'], ice: ['paper', 'ice', 'sky'], lightning: ['paper', 'sky', 'blue'],
    plasma: ['pink', 'violet', 'indigo'], poison: ['lime', 'grass', 'pine'], radiant: ['paper', 'cream', 'gold'],
    void: ['violet', 'indigo', 'ink'], water: ['ice', 'sky', 'blue'], wind: ['paper', 'mist', 'teal'],
    earth: ['sand', 'wood', 'woodD']
  };
  const GRANDP = {
    Royal: ['cream', 'gold', 'orange'], Ancient: ['mist', 'stone', 'slate'], Eldritch: ['pink', 'violet', 'indigo'],
    Dread: ['fog', 'slate', 'night'], Sacred: ['paper', 'cream', 'gold'], Infernal: ['orange', 'red', 'wine'],
    Celestial: ['paper', 'ice', 'sky'], Unholy: ['lime', 'leaf', 'pine']
  };
  const ADJP = {
    Haunted: ['paper', 'ice', 'teal'], Cursed: ['pink', 'violet', 'indigo'], Shiny: ['paper', 'ice', 'fog'],
    Gloomy: ['fog', 'stone', 'slate'], Moody: ['mist', 'fog', 'stone'], Spiteful: ['coral', 'red', 'wine'],
    Feral: ['sand', 'wood', 'woodD'], Forbidden: ['violet', 'indigo', 'night'], Overbrewed: ['sand', 'wood', 'woodD'],
    Honking: ['paper', 'mist', 'fog']
  };
  const CONDP = {
    Rusty: ['orange', 'rust', 'woodD'], Damp: ['ice', 'fog', 'stone'], Musty: ['mist', 'fog', 'stone'],
    Sad: ['mist', 'fog', 'slate'], Plain: ['paper', 'mist', 'fog'], Spare: ['paper', 'mist', 'fog'],
    Used: ['mist', 'fog', 'stone'], Cracked: ['mist', 'fog', 'stone'], Bent: ['mist', 'fog', 'stone'],
    Sticky: ['lime', 'grass', 'leaf']
  };
  const RAINBOW = [
    ['cream', 'orange', 'red'], ['cream', 'gold', 'orange'], ['lime', 'grass', 'leaf'],
    ['ice', 'sky', 'blue'], ['pink', 'violet', 'indigo'], ['paper', 'pink', 'violet']
  ];
  function paletteFor(look) {
    if (!look) return null;
    if (look.what) return 'rainbow';
    if (look.elemNamed && look.family && ELEM[look.family]) return ELEM[look.family];
    if (look.grand && GRANDP[look.grand]) return GRANDP[look.grand];
    if (look.adj && ADJP[look.adj]) return ADJP[look.adj];
    if (look.cond && CONDP[look.cond]) return CONDP[look.cond];
    return null;
  }
  function rarityTriple(hex) {
    const [r, g, b] = PX._hexRgb(hex);
    return [
      PX._snapRgb(r + (255 - r) * 0.55, g + (255 - g) * 0.55, b + (255 - b) * 0.55),
      PX._snapRgb(r, g, b),
      PX._snapRgb(r * 0.55, g * 0.55, b * 0.55)
    ];
  }

  // ---- seeded random per weapon ----
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return () => {
      h = (h + 0x6d2b79f5) | 0;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const slug = s => String(s || '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  function spriteFor(w, look) {
    const k = look && look.base ? w.type + '-' + slug(look.base) : null;
    return (k && ART.weapons[k]) || ART.weapons[w.type];
  }

  // ---- build the look canvas: tint + baked details ----
  const MARK_A = 0xffff80ff,
    MARK_M = 0xffff00ff,
    MARK_Z = 0xff800080;
  const cache = new Map();
  const PAD = 3;
  function build(w, look, a, frame) {
    const key = [w.name, w.type, look && look.base, w.col, frame, look && look.standout].join('|');
    let L = cache.get(key);
    if (L) return L;
    const W2 = a.w + PAD * 2,
      H2 = a.h + PAD * 2;
    const cv = document.createElement('canvas');
    cv.width = W2;
    cv.height = H2;
    const g = cv.getContext('2d');
    g.drawImage(a.im, PAD, PAD);
    const img = g.getImageData(0, 0, W2, H2),
      d = new Uint32Array(img.data.buffer);
    const at = (x, y) => (x < 0 || y < 0 || x >= W2 || y >= H2 ? 0 : d[y * W2 + x]);
    const isMark = v => v === MARK_A || v === MARK_M || v === MARK_Z;
    const INK = pack('ink'),
      GOLD = pack('gold');
    const WOODS = new Set([pack('woodD'), pack('wood')]);
    const deco = new Set();
    const put = (x, y, v, isDeco = true) => {
      if (x < 0 || y < 0 || x >= W2 || y >= H2) return;
      d[y * W2 + x] = v;
      if (isDeco) deco.add(y * W2 + x);
    };
    // classify sprite pixels
    const marks = [],
      top = [],
      bottom = [],
      guard = [],
      handle = [];
    for (let y = 0; y < H2; y++)
      for (let x = 0; x < W2; x++) {
        const v = at(x, y);
        if (isMark(v)) {
          marks.push([x, y]);
          if (!isMark(at(x, y - 1))) top.push([x, y]);
          if (!isMark(at(x, y + 1))) bottom.push([x, y]);
        } else if (v === GOLD) guard.push([x, y]);
        else if (WOODS.has(v)) handle.push([x, y]);
      }
    const rnd = seeded(key);
    const pickP = list => list[Math.floor(rnd() * list.length)];
    let tip = marks[0] || [W2 - PAD, H2 >> 1];
    for (const m of marks) if (m[0] > tip[0] || (m[0] === tip[0] && Math.abs(m[1] - H2 / 2) < Math.abs(tip[1] - H2 / 2))) tip = m;
    const minX = marks.reduce((v, m) => Math.min(v, m[0]), W2);
    // a blade column ~55% along, used for faces
    let face = null;
    {
      const cx = Math.round(minX + (tip[0] - minX) * 0.5);
      let best = 0;
      for (let x = Math.max(minX, cx - 3); x <= Math.min(tip[0] - 2, cx + 3); x++) {
        const col = marks.filter(m => m[0] === x);
        if (col.length > best) {
          best = col.length;
          face = { x, y0: Math.min(...col.map(m => m[1])), y1: Math.max(...col.map(m => m[1])) };
        }
      }
    }
    const tri = (() => {
      const p = paletteFor(look);
      if (p === 'rainbow') return RAINBOW[frame % RAINBOW.length].map(pack);
      if (p) return p.map(pack);
      return rarityTriple(PX.paletteHex(w.col || '#c3c4d6'));
    })();
    // recolour markers
    for (const [x, y] of marks) {
      const v = at(x, y);
      put(x, y, v === MARK_A ? tri[0] : v === MARK_M ? tri[1] : tri[2], false);
    }
    const c = look ? look.cond : null,
      adj = look ? look.adj : null,
      grand = look ? look.grand : null;
    // ---- baked details by word ----
    if (c === 'Rusty') for (const m of marks) if (rnd() < 0.28) put(m[0], m[1], pack(rnd() < 0.5 ? 'rust' : 'woodD'), false);
    if (grand === 'Ancient') {
      for (const m of top) if (rnd() < 0.35) put(m[0], m[1], pack('leaf'), false);
      for (const m of marks) if (rnd() < 0.08) put(m[0], m[1], pack('pine'), false);
    }
    if ((c === 'Chipped' || c === 'Cracked') && top.length > 3) {
      for (let i = 0; i < 2; i++) {
        const m = pickP(top.filter(t => t[0] < tip[0] - 1));
        if (m) put(m[0], m[1], INK, false);
      }
    }
    if (c === 'Cracked' && face) for (let i = 0; i < 3; i++) put(face.x + i - 1, Math.min(face.y1, face.y0 + i), INK, false);
    if (c === 'Dented') for (let i = 0; i < 3; i++) {
      const m = pickP(rnd() < 0.5 ? top : bottom);
      if (m) put(m[0], m[1], pack('slate'), false);
    }
    if (c === 'Bent') {
      const x0 = Math.round(minX + (tip[0] - minX) * 0.66);
      for (let x = x0; x < W2; x++)
        for (let y = H2 - 2; y >= 0; y--) {
          d[(y + 1) * W2 + x] = d[y * W2 + x];
          if (y === 0) d[x] = 0;
        }
      tip = [tip[0], tip[1] + 1];
    }
    if (c === 'Sticky') for (let i = 0; i < 2; i++) {
      const m = pickP(bottom);
      if (m) {
        put(m[0], m[1] + 1, pack('lime'));
        if (rnd() < 0.6) put(m[0], m[1] + 2, pack('grass'));
      }
    }
    if ((c === 'Stolen' || c === 'Borrowed' || c === 'Discount') && (guard.length || handle.length)) {
      const gx = guard.length ? guard[guard.length >> 1][0] : handle[handle.length - 1][0];
      const gy = Math.max(...(guard.length ? guard : handle).map(p => p[1]));
      put(gx, gy + 1, pack('fog'));
      put(gx, gy + 2, pack('paper'));
      put(gx + 1, gy + 2, pack('paper'));
      put(gx, gy + 3, pack('paper'));
      put(gx + 1, gy + 3, pack(c === 'Discount' ? 'red' : 'paper'));
    }
    if (adj === 'Bitey') for (const m of bottom) if ((m[0] + m[1]) % 2 === 0 && m[0] < tip[0]) put(m[0], m[1] + 1, pack('paper'));
    if (adj === 'Spiteful') for (const m of top) if (m[0] % 3 === 0 && m[0] < tip[0]) {
      put(m[0], m[1] - 1, pack('red'));
      put(m[0], m[1] - 2, pack('coral'));
    }
    if (face && face.y1 - face.y0 >= 1) {
      const ey = face.y0 + (face.y1 - face.y0 >= 2 ? 1 : 0);
      if (adj === 'Grumpy') {
        put(face.x - 1, ey, pack('red'), false);
        put(face.x + 2, ey, pack('red'), false);
        put(face.x - 1, face.y0 - 1, INK);
        put(face.x + 2, face.y0 - 1, INK);
        put(face.x, face.y0, INK, false);
        put(face.x + 1, face.y0, INK, false);
      }
      if (adj === 'Smug') {
        for (const dx of [-2, -1, 1, 2]) put(face.x + dx, ey, INK, false);
        put(face.x, ey, pack('fog'), false);
      }
      if (adj === 'Suspicious' || grand === 'Eldritch') {
        put(face.x, ey, pack(grand === 'Eldritch' ? 'pink' : 'paper'), false);
        put(face.x + 1, ey, pack(grand === 'Eldritch' ? 'pink' : 'paper'), false);
        put(face.x + (grand === 'Eldritch' ? 1 : 0), ey, INK, false);
      }
      if (grand === 'Dread') {
        put(face.x - 1, ey, pack('red'), false);
        put(face.x + 1, ey, pack('red'), false);
      }
    }
    if (adj === 'Feral' && guard.length) for (const p of guard) if (rnd() < 0.6) put(p[0] + (rnd() < 0.5 ? -1 : 1), p[1] + (rnd() < 0.5 ? -1 : 1), pack('sand'));
    if (adj === 'Brave-ish' && handle.length) {
      const hx = Math.min(...handle.map(p => p[0])),
        hy = Math.min(...handle.map(p => p[1]));
      for (let i = 1; i <= 3; i++) put(hx, hy - i, pack('fog'));
      put(hx + 1, hy - 3, pack('red'));
      put(hx + 2, hy - 3, pack('red'));
      put(hx + 1, hy - 2, pack('red'));
    }
    if (adj === 'Forbidden') for (const m of marks) if ((m[0] - m[1]) % 4 === 0) put(m[0], m[1], pack((m[0] >> 2) % 2 ? 'fog' : 'stone'), false);
    if (grand === 'Royal' && guard.length) {
      const gm = guard[guard.length >> 1];
      put(gm[0], gm[1], pack('red'), false);
    }
    if (adj === 'Honking' || (look && /GOOSE/.test(look.what || '') )) {
      put(tip[0], tip[1], pack('orange'), false);
      put(tip[0] + 1, tip[1], pack('orange'));
      put(tip[0] + 1, tip[1] + 1, pack('rust'));
    }
    // ink outline around anything added outside the sprite
    for (const i of deco) {
      const x = i % W2,
        y = (i / W2) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const j = (y + dy) * W2 + x + dx;
        if (x + dx >= 0 && x + dx < W2 && y + dy >= 0 && y + dy < H2 && d[j] === 0) d[j] = INK;
      }
    }
    g.putImageData(img, 0, 0);
    // aura ring: empty pixels touching the sprite
    const ring = [];
    for (let y = 0; y < H2; y++)
      for (let x = 0; x < W2; x++)
        if (!d[y * W2 + x] && (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1))) ring.push([x, y]);
    const recoloured = marks.map(([x, y]) => [x, y + (c === 'Bent' && x >= Math.round(minX + (tip[0] - minX) * 0.66) ? 1 : 0)]);
    const hex = n => '#' + [0, 8, 16].map(s => ((n >>> s) & 255).toString(16).padStart(2, '0')).join('');
    L = { cv, w: W2, h: H2, gx: a.gx + PAD, gy: a.gy + PAD, marks: recoloured, ring, tip, face, light: hex(tri[0]), mid: hex(tri[1]), dark: hex(tri[2]) };
    cache.set(key, L);
    if (cache.size > 90) cache.delete(cache.keys().next().value);
    return L;
  }

  // ---- particles (device pixels, drawn after the world, before the palette snap) ----
  const parts = [];
  function emit(x, y, kind, col) {
    if (parts.length > 260) parts.shift();
    const r = Math.random;
    const p = { x, y, vx: 0, vy: 0, g: 0, life: 24, max: 24, col, size: 1, kind: 'dot' };
    switch (kind) {
      case 'ember': p.vx = (r() - 0.5) * 0.3; p.vy = -0.35 - r() * 0.45; p.life = 20 + r() * 16; break;
      case 'frost': p.vx = (r() - 0.5) * 0.2; p.vy = 0.12 + r() * 0.15; p.life = 26 + r() * 16; p.kind = r() < 0.3 ? 'plus' : 'dot'; break;
      case 'spark': p.vx = (r() - 0.5) * 2.2; p.vy = (r() - 0.5) * 2.2; p.life = 5 + r() * 6; p.size = 1; break;
      case 'mote': p.vx = (r() - 0.5) * 0.5; p.vy = (r() - 0.5) * 0.5; p.life = 22 + r() * 18; break;
      case 'bubble': p.vx = (r() - 0.5) * 0.15; p.vy = -0.2 - r() * 0.2; p.life = 28 + r() * 18; p.kind = 'ring'; break;
      case 'twinkle': p.life = 14 + r() * 12; p.kind = 'plus'; break;
      case 'suck': {
        const a = r() * Math.PI * 2, d = 7 + r() * 5;
        p.x += Math.cos(a) * d; p.y += Math.sin(a) * d; p.vx = -Math.cos(a) * d / 16; p.vy = -Math.sin(a) * d / 16; p.life = 16;
        break;
      }
      case 'drip': p.vy = 0.15; p.g = 0.04; p.life = 26 + r() * 10; break;
      case 'streak': p.vx = -0.9 - r() * 0.8; p.vy = (r() - 0.5) * 0.1; p.life = 12 + r() * 8; p.kind = 'streak'; break;
      case 'pebble': p.vx = (r() - 0.5) * 0.5; p.vy = -0.3; p.g = 0.06; p.life = 22; break;
      case 'ghost': p.vx = (r() - 0.5) * 0.25; p.vy = -0.25 - r() * 0.2; p.life = 30 + r() * 14; p.kind = 'ghost'; p.ph = r() * 6; break;
      case 'smoke': p.vx = (r() - 0.5) * 0.2; p.vy = -0.18 - r() * 0.15; p.life = 30 + r() * 12; p.size = 2; break;
      case 'spore': p.vx = (r() - 0.5) * 0.3; p.vy = -0.08 + (r() - 0.5) * 0.2; p.life = 34 + r() * 12; break;
      case 'steam': p.vx = (r() - 0.5) * 0.25; p.vy = -0.4 - r() * 0.3; p.life = 18 + r() * 10; p.size = r() < 0.5 ? 2 : 1; break;
      case 'rain': p.y -= 10; p.x += (r() - 0.5) * 8; p.vy = 0.9; p.life = 12; p.kind = 'streakv'; break;
      case 'note': p.vx = 0.15 + r() * 0.2; p.vy = -0.35; p.life = 34; p.kind = 'note'; break;
      case 'confetti': p.vx = (r() - 0.5) * 1.2; p.vy = -0.8 - r() * 0.6; p.g = 0.05; p.life = 30; p.kind = r() < 0.5 ? 'dot' : 'streak'; break;
      case 'flame': p.vx = (r() - 0.5) * 0.2; p.vy = -0.5 - r() * 0.4; p.life = 12 + r() * 8; p.size = r() < 0.4 ? 2 : 1; break;
    }
    p.max = p.life;
    parts.push(p);
  }
  const NOTE = [[1, 0], [2, 0], [1, 1], [1, 2], [0, 3], [1, 3]];
  const GHOST = [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2]];
  PX.afterWorld.push(function drawParts() {
    if (!parts.length) return;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += p.g;
      p.x += p.vx + (p.kind === 'ghost' ? Math.sin((p.ph += 0.2)) * 0.2 : 0);
      p.y += p.vy;
      if (--p.life <= 0) {
        parts.splice(i, 1);
        continue;
      }
      // fade by thinning: late in life, skip alternate frames (no translucency on the pixel layer)
      if (p.life < p.max * 0.3 && (p.life & 1)) continue;
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
  });

  // emitters by word: [kind, colours[], rate per frame]
  const FAMILY_FX = {
    fire: ['ember', ['orange', 'cream', 'rust'], 0.5], ice: ['frost', ['ice', 'paper'], 0.35],
    lightning: ['spark', ['paper', 'sky', 'ice'], 0.6], plasma: ['mote', ['pink', 'violet'], 0.4],
    poison: ['bubble', ['lime', 'grass'], 0.25], radiant: ['twinkle', ['paper', 'cream'], 0.3],
    void: ['suck', ['violet', 'indigo', 'pink'], 0.5], water: ['drip', ['sky', 'ice'], 0.25],
    wind: ['streak', ['paper', 'mist'], 0.35], earth: ['pebble', ['sand', 'wood'], 0.2]
  };
  const WORD_FX = {
    Haunted: ['ghost', ['paper', 'ice'], 0.07], Cursed: ['smoke', ['violet', 'indigo'], 0.2],
    Forbidden: ['smoke', ['night', 'violet'], 0.12], Dread: ['smoke', ['night', 'wine'], 0.15],
    Musty: ['spore', ['grass', 'lime'], 0.12], Damp: ['drip', ['sky'], 0.12], Sticky: ['drip', ['lime'], 0.06],
    Overbrewed: ['steam', ['paper', 'mist'], 0.3], Gloomy: ['rain', ['sky'], 0.25], Moody: ['rain', ['sky', 'fog'], 0.15],
    Honking: ['note', ['paper', 'gold'], 0.03], Infernal: ['flame', ['orange', 'red', 'cream'], 0.55],
    Unholy: ['flame', ['lime', 'leaf', 'grass'], 0.5], Sacred: ['twinkle', ['paper', 'cream'], 0.2],
    Celestial: ['twinkle', ['ice', 'paper'], 0.2], Royal: ['twinkle', ['gold', 'cream'], 0.1],
    Eldritch: ['mote', ['pink', 'violet'], 0.2], Shiny: ['twinkle', ['paper'], 0.05]
  };
  function emittersFor(look) {
    if (!look) return [];
    const out = [];
    if (look.family && FAMILY_FX[look.family]) {
      const [k, cols, rate] = FAMILY_FX[look.family];
      out.push([k, cols, rate * (look.elemNamed ? 1.5 : 0.4)]);
    }
    for (const word of [look.cond, look.adj, look.grand]) if (word && WORD_FX[word]) out.push(WORD_FX[word]);
    if (look.what) out.push(['confetti', ['pink', 'gold', 'sky', 'lime', 'paper'], 0.25]);
    if (/Geese|Honks/.test(look.epithet || '')) out.push(['note', ['paper', 'gold'], 0.03]);
    if (look.relic) out.push(['twinkle', ['paper'], look.roman ? 0.12 : 0.06]);
    if (look.standout) out.push(['twinkle', ['gold', 'cream'], 0.12]);
    return out;
  }
  function runEmitters(list, pointAt) {
    for (const [kind, cols, rate] of list) {
      let n = rate;
      while (n > 0) {
        if (n >= 1 || Math.random() < n) {
          const p = pointAt();
          if (p) emit(p.x, p.y, kind, HEX[cols[Math.floor(Math.random() * cols.length)]]);
        }
        n -= 1;
      }
    }
  }

  // ---- motion by word ----
  function motion(look, u) {
    if (!look) return;
    const t = time;
    const c = look.cond,
      adj = look.adj;
    if (c === 'Wobbly') X.rotate(Math.sin(t * 9) * 0.12);
    if (c === 'Loose') X.translate(0, (Math.floor(t * 20) % 2) * u * 0.6);
    if (adj === 'Jittery') X.translate(((Math.random() * 3) | 0) * u * 0.4 - u * 0.4, ((Math.random() * 3) | 0) * u * 0.4 - u * 0.4);
    if (adj === 'Rowdy') X.translate(0, -Math.abs(Math.sin(t * 7)) * u * 1.5);
    if (c === 'Sad') X.rotate(0.14);
  }

  function frameOf(look) {
    return look && look.what ? Math.floor(time * 6) % RAINBOW.length : 0;
  }
  function scaleFor(look, a, sc) {
    let k = sc < 1.7 ? 1 : sc < 2.6 ? 2 : 3;
    if (look && (look.grand === 'Mighty' || look.what)) k++;
    return Math.max(1, Math.min(k, Math.floor(56 / a.w)));
  }

  // ---- held weapon ----
  PX.weaponBody = function (w, q, sc, atk) {
    if (!PX.ready || !PX._lutReady()) return false;
    const look = w.__look || null,
      a = spriteFor(w, look);
    if (!a) return false;
    const L = build(w, look, a, frameOf(look)),
      k = scaleFor(look, a, sc);
    const m0 = X.getTransform(),
      u = k / (Math.hypot(m0.a, m0.b) || SCALE);
    X.save();
    motion(look, u);
    const sneaky = look && look.adj === 'Sneaky';
    if (sneaky) X.globalAlpha = Math.floor(time * 3) % 3 === 0 ? 0.45 : 0.85;
    X.drawImage(L.cv, -L.gx * u, -L.gy * u, L.w * u, L.h * u);
    X.globalAlpha = 1;
    overlays(L, look, u, (sx, sy) => [(sx - L.gx) * u, (sy - L.gy) * u]);
    // particles from random blade pixels
    const tm = X.getTransform();
    runEmitters(emittersFor(look), () => {
      const m = L.marks[Math.floor(Math.random() * L.marks.length)];
      if (!m) return null;
      return tm.transformPoint(new DOMPoint((m[0] + 0.5 - L.gx) * u, (m[1] + 0.5 - L.gy) * u));
    });
    X.restore();
    PX.stats.weaponDraws = (PX.stats.weaponDraws || 0) + 1;
    return true;
  };

  // animated layers in sprite pixels; `to` maps sprite px -> local coords
  function overlays(L, look, u, to) {
    if (!look) return;
    const t = time;
    const px = (sx, sy, col) => {
      const [x, y] = to(sx, sy);
      X.fillStyle = col;
      X.fillRect(x, y, u, u);
    };
    // glint sweep (Shiny, Pointy at the tip, relics)
    if (look.adj === 'Shiny' || look.relic || look.grand === 'Sacred') {
      const ph = Math.floor((t * 22) % (L.w + L.h + 14));
      for (const [x, y] of L.marks) if (x + y === ph || x + y === ph - 1) px(x, y, HEX.paper);
    }
    if (look.cond === 'Pointy' && Math.floor(t * 2.5) % 3 === 0) {
      px(L.tip[0] + 1, L.tip[1], HEX.paper);
      px(L.tip[0] + 2, L.tip[1], HEX.paper);
      px(L.tip[0] + 1, L.tip[1] - 1, HEX.paper);
      px(L.tip[0] + 1, L.tip[1] + 1, HEX.paper);
    }
    // blinking eye
    if ((look.adj === 'Suspicious' || look.grand === 'Eldritch') && L.face && Math.floor(t * 1.3) % 5 === 0) {
      const ey = L.face.y0 + (L.face.y1 - L.face.y0 >= 2 ? 1 : 0);
      px(L.face.x, ey, L.mid);
      px(L.face.x + 1, ey, L.mid);
    }
    // rain cloud
    if ((look.adj === 'Gloomy' || look.adj === 'Moody') && L.face) {
      const cy = L.face.y0 - 5 + Math.round(Math.sin(t * 2));
      for (let i = -2; i <= 2; i++) px(L.face.x + i, cy, HEX.fog);
      for (let i = -1; i <= 1; i++) px(L.face.x + i, cy - 1, HEX.mist);
    }
    // aura: relics pulse in their light shade, standouts flash gold
    const pulse = Math.sin(t * 5);
    if (look.relic || look.what || look.standout) {
      const col = look.standout && pulse > 0.6 ? HEX.gold : look.what ? RAINBOW[(Math.floor(t * 6) + 2) % 6].map(n => HEX[n])[1] : L.light;
      if (pulse > -0.2 || look.standout) {
        const every = pulse > 0.6 ? 1 : 2;
        for (let i = 0; i < L.ring.length; i += every) px(L.ring[i][0], L.ring[i][1], col);
      }
    }
    // numbered relics: three runes orbiting the blade
    if (look.roman && L.marks.length) {
      const cx = (L.marks[0][0] + L.tip[0]) / 2,
        cy = L.tip[1];
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + (i * Math.PI * 2) / 3;
        px(Math.round(cx + Math.cos(a) * (L.w * 0.32)), Math.round(cy + Math.sin(a) * 5), HEX.gold);
      }
    }
  }

  // The legacy rarity/element aura circles behind the weapon are replaced by the look (aura ring,
  // particles), so they are skipped while the pixel art is up.
  if (typeof weaponAura === 'function') {
    const weaponAura0 = weaponAura;
    weaponAura = function (w, x, y) {
      if (PX.ready && PX._lutReady() && w && w.__look) return;
      return weaponAura0(w, x, y);
    };
  }

  // ---- HUD icon ----
  PX.weaponIconFor = w => {
    if (!w || !PX._lutReady()) return null;
    const look = w.__look || null,
      a = spriteFor(w, look);
    if (!a) return null;
    const L = build(w, look, a, frameOf(look));
    if (!L.icon) {
      // crop to the opaque pixels so the HUD's 9px-tall slot isn't spent on padding
      const g = L.cv.getContext('2d'),
        d = g.getImageData(0, 0, L.w, L.h).data;
      let x0 = L.w,
        y0 = L.h,
        x1 = -1,
        y1 = -1;
      for (let y = 0; y < L.h; y++)
        for (let x = 0; x < L.w; x++)
          if (d[(y * L.w + x) * 4 + 3]) {
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
          }
      const cw = Math.max(1, x1 - x0 + 1),
        chh = Math.max(1, y1 - y0 + 1),
        cv = document.createElement('canvas');
      cv.width = cw;
      cv.height = chh;
      cv.getContext('2d').drawImage(L.cv, x0, y0, cw, chh, 0, 0, cw, chh);
      L.icon = { cv, w: cw, h: chh };
    }
    return L.icon;
  };

  // ---- drops: the weapon itself lies there, bobbing, with its glow and particles ----
  const dropBody0 = PX.dropBody;
  PX.dropBody = function (d, q, riq) {
    const w = d && d.item;
    if (!w || w.kind === 'armor' || !w.type || !PX.ready || !PX._lutReady()) return dropBody0(d, q, riq);
    const look = w.__look || null,
      a = spriteFor(w, look);
    if (!a) return dropBody0(d, q, riq);
    const L = build(w, look, a, frameOf(look));
    const bob = Math.round(Math.sin(time * 4 + d.x * 0.01) * 1.5);
    const p = X.getTransform().transformPoint(new DOMPoint(d.x, d.y));
    const x0 = Math.round(p.x - L.w / 2),
      y0 = Math.round(p.y - L.h / 2) + bob;
    X.save();
    X.setTransform(1, 0, 0, 1, 0, 0);
    if (q >= 2 || (look && look.standout)) {
      X.globalAlpha = 0.5;
      X.fillStyle = look && look.standout ? HEX.gold : L.mid;
      X.fillRect(Math.round(p.x) - 1, y0 - 10 - q * 2, 2, 10 + q * 2);
      X.globalAlpha = 1;
    }
    X.drawImage(L.cv, x0, y0);
    overlays(L, look, 1, (sx, sy) => [x0 + sx, y0 + sy]);
    runEmitters(
      emittersFor(look).map(([k2, c2, r2]) => [k2, c2, r2 * 0.5]),
      () => {
        const m = L.marks[Math.floor(Math.random() * L.marks.length)];
        return m ? { x: x0 + m[0] + 0.5, y: y0 + m[1] + 0.5 } : null;
      }
    );
    X.restore();
    if (riq >= 3) {
      X.fillStyle = d.item.col;
      X.textAlign = 'center';
      X.font = '700 12px system-ui';
      X.fillText(d.item.name, d.x, d.y - 18 - q * 2);
    }
    return true;
  };

  // ---- attacks: the weapon's slashes and projectiles take its colour and leave its particles ----
  const seen = new WeakSet();
  let lockedW = null; // debug: keep an equipped look while testing
  const update0 = update;
  update = function (dt) {
    if (lockedW) pl.weapon = lockedW;
    const r = update0(dt);
    const w = curW(),
      look = w && w.__look;
    if (!w || !look || !PX._lutReady()) return r;
    const a = spriteFor(w, look);
    if (!a) return r;
    const L = build(w, look, a, frameOf(look)),
      fx = emittersFor(look);
    const tag = o => {
      if (seen.has(o)) return;
      seen.add(o);
      if (o.col === w.col) {
        o.col = L.mid;
        o.__fx = fx;
        o.__fxCol = L.light;
      }
    };
    for (const p of P) tag(p);
    for (const f of F) if (f.k === 'slash' || f.k === 'after' || f.k === 'staff') tag(f);
    return r;
  };
  PX.afterWorld.unshift(function trails() {
    const sx = PX.shakeX || 0,
      sy = PX.shakeY || 0;
    const at = (x, y) => ({ x: x * SCALE + sx, y: y * SCALE + sy });
    for (const p of P) if (p.__fx && p.__fx.length) runEmitters(p.__fx.map(([k, c, r]) => [k, c, Math.min(1, r * 1.6)]), () => at(p.x, p.y));
    for (const f of F)
      if (f.__fx && f.__fx.length && f.k === 'slash' && f.life > f.max * 0.4) {
        runEmitters(
          f.__fx.map(([k, c, r]) => [k, c, Math.min(2, r * 3)]),
          () => {
            const ang = (Math.random() - 0.5) * 2.2;
            return at(f.x + Math.cos(ang) * f.r * 0.8 * (f.dir || 1), f.y + Math.sin(ang) * f.r * 0.8);
          }
        );
      }
  });

  // debug: a contact sheet of looks -> data URL. specs: [{type, base, cond, adj, grand, family, ...}]
  function sheet(specs, zoom = 4, cols = 4) {
    const items = specs.map((sp, i) => {
      const look = { q: 0, ...sp },
        w = { type: sp.type, name: 'sheet' + i + JSON.stringify(sp), col: sp.col || '#c3c4d6' };
      const a = spriteFor(w, look);
      return { L: a ? build(w, look, a, 0) : null, label: sp.label || '' };
    });
    const cw = 40 * zoom,
      ch = 26 * zoom;
    const cv = document.createElement('canvas');
    cv.width = cw * cols;
    cv.height = ch * Math.ceil(items.length / cols);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = HEX.slate;
    g.fillRect(0, 0, cv.width, cv.height);
    items.forEach((it, i) => {
      const x = (i % cols) * cw,
        y = Math.floor(i / cols) * ch;
      if (it.L) g.drawImage(it.L.cv, x + 4, y + 4, it.L.w * zoom, it.L.h * zoom);
      g.fillStyle = HEX.paper;
      g.font = '12px monospace';
      g.fillText(it.label, x + 4, y + ch - 6);
    });
    return cv.toDataURL();
  }
  // debug: equip a weapon with a given look, e.g. equip({type:'hammer', base:'Maul', grand:'Infernal'}, 4)
  function equip(spec, rank = 2) {
    const w = makeExactRankWeapon(pl.lv, rank);
    w.type = spec.type || w.type;
    const look = { q: rank, ...spec };
    Object.defineProperty(w, '__look', { configurable: true, get: () => look });
    Object.defineProperty(w, 'name', { configurable: true, enumerable: true, value: spec.label || spec.base || w.type, writable: true });
    if (spec.col) w.col = spec.col;
    pl.weapon = lockedW = w;
    if (spec.clear !== false) {
      E.length = 0;
      pl.x = W / 2 - pl.w / 2;
    }
    return w.name;
  }
  PX.looks = { build, paletteFor, emittersFor, spriteFor, parts, sheet, equip, unlock: () => (lockedW = null) };
})();
