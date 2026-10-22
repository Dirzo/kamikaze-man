// Weapon looks: every weapon is drawn the way it is named (see data/names.js for the words).
//   base word -> sprite variant (Longsword, Claymore, Shiv, Flails, Scepter, Maul, ...)
//   palette   -> element (if named) > grand word > adjective > condition > rarity colour
//   details   -> baked into the sprite: rust, chips, cracks, dents, bends, goo, price tags, teeth,
//                spikes, grumpy eyes, sunglasses, chains, moss, jewels, a goose beak
//   motion    -> Wobbly / Loose / Jittery / Rowdy / Sad
//   particles -> embers, frost, sparks, bubbles, drips, ghosts, smoke, steam, rain, notes, confetti
//   tier glow -> relic aura, orbiting runes on numbered relics, rainbow top tier, gold standout flash
import { C } from '../config.js';
import { A } from '../engine/assets.js';
import { X } from '../engine/gfx.js';
import { emit } from './fx.js';
import { RARITY } from '../data/weapons.js';

const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const pack = name => {
  const [r, g, b] = hexRgb(C[name] || name);
  return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
};
const unpack = n => '#' + [0, 8, 16].map(s => ((n >>> s) & 255).toString(16).padStart(2, '0')).join('');

const ELEM = {
  fire: ['cream', 'orange', 'rust'], ice: ['paper', 'ice', 'sky'], lightning: ['paper', 'sky', 'blue'], plasma: ['pink', 'violet', 'indigo'],
  poison: ['lime', 'grass', 'pine'], radiant: ['paper', 'cream', 'gold'], void: ['violet', 'indigo', 'ink'], water: ['ice', 'sky', 'blue'],
  wind: ['paper', 'mist', 'teal'], earth: ['sand', 'wood', 'woodD']
};
const GRANDP = {
  Royal: ['cream', 'gold', 'orange'], Ancient: ['mist', 'stone', 'slate'], Eldritch: ['pink', 'violet', 'indigo'], Dread: ['fog', 'slate', 'night'],
  Sacred: ['paper', 'cream', 'gold'], Infernal: ['orange', 'red', 'wine'], Celestial: ['paper', 'ice', 'sky'], Unholy: ['lime', 'leaf', 'pine']
};
const ADJP = {
  Haunted: ['paper', 'ice', 'teal'], Cursed: ['pink', 'violet', 'indigo'], Shiny: ['paper', 'ice', 'fog'], Gloomy: ['fog', 'stone', 'slate'],
  Moody: ['mist', 'fog', 'stone'], Spiteful: ['coral', 'red', 'wine'], Feral: ['sand', 'wood', 'woodD'], Forbidden: ['violet', 'indigo', 'night'],
  Overbrewed: ['sand', 'wood', 'woodD'], Honking: ['paper', 'mist', 'fog']
};
const CONDP = {
  Rusty: ['orange', 'rust', 'woodD'], Damp: ['ice', 'fog', 'stone'], Musty: ['mist', 'fog', 'stone'], Sad: ['mist', 'fog', 'slate'],
  Plain: ['paper', 'mist', 'fog'], Spare: ['paper', 'mist', 'fog'], Used: ['mist', 'fog', 'stone'], Cracked: ['mist', 'fog', 'stone'],
  Bent: ['mist', 'fog', 'stone'], Sticky: ['lime', 'grass', 'leaf']
};
const RAINBOW = [['cream', 'orange', 'red'], ['cream', 'gold', 'orange'], ['lime', 'grass', 'leaf'], ['ice', 'sky', 'blue'], ['pink', 'violet', 'indigo'], ['paper', 'pink', 'violet']];
const RARITY_TRI = [
  ['paper', 'mist', 'fog'], ['lime', 'grass', 'leaf'], ['ice', 'sky', 'blue'], ['pink', 'violet', 'indigo'], ['paper', 'pink', 'violet'],
  ['cream', 'orange', 'rust'], ['cream', 'gold', 'orange'], ['cream', 'coral', 'red'], ['paper', 'cream', 'gold'], ['paper', 'ice', 'sky'], ['paper', 'mist', 'fog']
];

function palette(look, q, frame) {
  if (look.what) return RAINBOW[frame % RAINBOW.length];
  if (look.elemNamed && look.family && ELEM[look.family]) return ELEM[look.family];
  if (look.grand && GRANDP[look.grand]) return GRANDP[look.grand];
  if (look.adj && ADJP[look.adj]) return ADJP[look.adj];
  if (look.cond && CONDP[look.cond]) return CONDP[look.cond];
  return RARITY_TRI[Math.max(0, Math.min(10, q))];
}

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
export function spriteFor(w) {
  if (w.mutation && A.weapons[w.type + '-awakened']) return A.weapons[w.type + '-awakened'];
  const k = w.look && w.look.base ? w.type + '-' + slug(w.look.base) : null;
  return (k && A.weapons[k]) || A.weapons[w.type];
}

const MARK_A = 0xffff80ff,
  MARK_M = 0xffff00ff,
  MARK_Z = 0xff800080;
const PAD = 3;
const cache = new Map();

// Build (and cache) the look canvas for a weapon. frame only matters for the rainbow tier.
export function lookOf(w, frame = 0) {
  const look = w.look || {};
  if (!look.what) frame = 0;
  const key = w.uid + '|' + frame;
  let L = cache.get(key);
  if (L) return L;
  if (cache.size > 192) cache.delete(cache.keys().next().value);
  const a = spriteFor(w);
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
    GOLD = pack('gold'),
    WOODS = new Set([pack('woodD'), pack('wood')]);
  const deco = new Set();
  const put = (x, y, v, isDeco = true) => {
    if (x < 0 || y < 0 || x >= W2 || y >= H2) return;
    d[y * W2 + x] = v;
    if (isDeco) deco.add(y * W2 + x);
  };
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
  const rnd = seeded(key + w.name);
  const pickP = list => list[Math.floor(rnd() * list.length)];
  let tip = marks[0] || [W2 - PAD, H2 >> 1];
  for (const m of marks) if (m[0] > tip[0] || (m[0] === tip[0] && Math.abs(m[1] - H2 / 2) < Math.abs(tip[1] - H2 / 2))) tip = m;
  const minX = marks.reduce((v, m) => Math.min(v, m[0]), W2);
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
  const tri = palette(look, w.q, frame).map(pack);
  for (const [x, y] of marks) {
    const v = at(x, y);
    put(x, y, v === MARK_A ? tri[0] : v === MARK_M ? tri[1] : tri[2], false);
  }
  const c = look.cond,
    adj = look.adj,
    grand = look.grand;
  if (c === 'Rusty') for (const m of marks) if (rnd() < 0.28) put(m[0], m[1], pack(rnd() < 0.5 ? 'rust' : 'woodD'), false);
  if (grand === 'Ancient') {
    for (const m of top) if (rnd() < 0.35) put(m[0], m[1], pack('leaf'), false);
    for (const m of marks) if (rnd() < 0.08) put(m[0], m[1], pack('pine'), false);
  }
  if ((c === 'Chipped' || c === 'Cracked') && top.length > 3)
    for (let i = 0; i < 2; i++) {
      const m = pickP(top.filter(t => t[0] < tip[0] - 1));
      if (m) put(m[0], m[1], INK, false);
    }
  if (c === 'Cracked' && face) for (let i = 0; i < 3; i++) put(face.x + i - 1, Math.min(face.y1, face.y0 + i), INK, false);
  if (c === 'Dented')
    for (let i = 0; i < 3; i++) {
      const m = pickP(rnd() < 0.5 ? top : bottom);
      if (m) put(m[0], m[1], pack('slate'), false);
    }
  let bentFrom = Infinity;
  if (c === 'Bent') {
    bentFrom = Math.round(minX + (tip[0] - minX) * 0.66);
    for (let x = bentFrom; x < W2; x++)
      for (let y = H2 - 2; y >= 0; y--) {
        d[(y + 1) * W2 + x] = d[y * W2 + x];
        if (y === 0) d[x] = 0;
      }
    tip = [tip[0], tip[1] + 1];
  }
  if (c === 'Sticky')
    for (let i = 0; i < 2; i++) {
      const m = pickP(bottom);
      if (m) {
        put(m[0], m[1] + 1, pack('lime'));
        if (rnd() < 0.6) put(m[0], m[1] + 2, pack('grass'));
      }
    }
  if ((c === 'Stolen' || c === 'Borrowed' || c === 'Bargain') && (guard.length || handle.length)) {
    const gx = guard.length ? guard[guard.length >> 1][0] : handle[handle.length - 1][0];
    const gy = Math.max(...(guard.length ? guard : handle).map(p => p[1]));
    put(gx, gy + 1, pack('fog'));
    put(gx, gy + 2, pack('paper'));
    put(gx + 1, gy + 2, pack('paper'));
    put(gx, gy + 3, pack('paper'));
    put(gx + 1, gy + 3, pack(c === 'Bargain' ? 'red' : 'paper'));
  }
  if (adj === 'Bitey') for (const m of bottom) if ((m[0] + m[1]) % 2 === 0 && m[0] < tip[0]) put(m[0], m[1] + 1, pack('paper'));
  if (adj === 'Spiteful')
    for (const m of top)
      if (m[0] % 3 === 0 && m[0] < tip[0]) {
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
      const e = grand === 'Eldritch' ? 'pink' : 'paper';
      put(face.x, ey, pack(e), false);
      put(face.x + 1, ey, pack(e), false);
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
  if (adj === 'Honking' || /GOOSE/.test(look.what || '')) {
    put(tip[0], tip[1], pack('orange'), false);
    put(tip[0] + 1, tip[1], pack('orange'));
    put(tip[0] + 1, tip[1] + 1, pack('rust'));
  }
  for (const i of deco) {
    const x = i % W2,
      y = (i / W2) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const j = (y + dy) * W2 + x + dx;
      if (x + dx >= 0 && x + dx < W2 && y + dy >= 0 && y + dy < H2 && d[j] === 0) d[j] = INK;
    }
  }
  g.putImageData(img, 0, 0);
  const ring = [];
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) if (!d[y * W2 + x] && (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1))) ring.push([x, y]);
  // icon: cropped to the opaque pixels
  let x0 = W2,
    y0 = H2,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < H2; y++)
    for (let x = 0; x < W2; x++)
      if (d[y * W2 + x]) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  L = {
    cv,
    w: W2,
    h: H2,
    gx: a.gx + PAD,
    gy: a.gy + PAD,
    marks: marks.map(([x, y]) => [x, y + (x >= bentFrom ? 1 : 0)]),
    ring,
    tip,
    face,
    light: unpack(tri[0]),
    mid: unpack(tri[1]),
    dark: unpack(tri[2]),
    crop: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 },
    emitters: emittersFor(look)
  };
  cache.set(key, L);
  if (cache.size > 160) cache.delete(cache.keys().next().value);
  return L;
}

// ---- particles by word: [kind, colours, rate per frame] ----
const FAMILY_FX = {
  fire: ['ember', ['orange', 'cream', 'rust'], 0.5], ice: ['frost', ['ice', 'paper'], 0.35], lightning: ['spark', ['paper', 'sky', 'ice'], 0.6],
  plasma: ['mote', ['pink', 'violet'], 0.4], poison: ['bubble', ['lime', 'grass'], 0.25], radiant: ['twinkle', ['paper', 'cream'], 0.3],
  void: ['suck', ['violet', 'indigo', 'pink'], 0.5], water: ['drip', ['sky', 'ice'], 0.25], wind: ['streak', ['paper', 'mist'], 0.35],
  earth: ['pebble', ['sand', 'wood'], 0.2]
};
const WORD_FX = {
  Haunted: ['ghost', ['paper', 'ice'], 0.07], Cursed: ['smoke', ['violet', 'indigo'], 0.2], Forbidden: ['smoke', ['night', 'violet'], 0.12],
  Dread: ['smoke', ['night', 'wine'], 0.15], Musty: ['spore', ['grass', 'lime'], 0.12], Damp: ['drip', ['sky'], 0.12], Sticky: ['drip', ['lime'], 0.06],
  Overbrewed: ['steam', ['paper', 'mist'], 0.3], Gloomy: ['rain', ['sky'], 0.25], Moody: ['rain', ['sky', 'fog'], 0.15],
  Honking: ['note', ['paper', 'gold'], 0.03], Infernal: ['flame', ['orange', 'red', 'cream'], 0.55], Unholy: ['flame', ['lime', 'leaf', 'grass'], 0.5],
  Sacred: ['twinkle', ['paper', 'cream'], 0.2], Celestial: ['twinkle', ['ice', 'paper'], 0.2], Royal: ['twinkle', ['gold', 'cream'], 0.1],
  Eldritch: ['mote', ['pink', 'violet'], 0.2], Shiny: ['twinkle', ['paper'], 0.05]
};
function emittersFor(look) {
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
// run emitters; pointAt() returns {x, y} in screen px; scale multiplies every rate
export function runEmitters(list, pointAt, scale = 1) {
  for (const [kind, cols, rate] of list) {
    let n = rate * scale;
    while (n > 0) {
      if (n >= 1 || Math.random() < n) {
        const p = pointAt();
        if (p) emit(p.x, p.y, kind, C[cols[Math.floor(Math.random() * cols.length)]]);
      }
      n -= 1;
    }
  }
}

// ---- motion by word (applied to the current transform) ----
export function motion(look, t, u) {
  if (!look) return;
  if (look.cond === 'Wobbly') X.rotate(Math.sin(t * 9) * 0.12);
  if (look.cond === 'Loose') X.translate(0, (Math.floor(t * 20) % 2) * u * 0.6);
  if (look.adj === 'Jittery') X.translate(((Math.random() * 3) | 0) - 1, ((Math.random() * 3) | 0) - 1);
  if (look.adj === 'Rowdy') X.translate(0, -Math.abs(Math.sin(t * 7)) * u * 1.5);
  if (look.cond === 'Sad') X.rotate(0.14);
}

// ---- animated layers in sprite pixels; to(sx, sy) maps sprite px -> current coords ----
export function overlays(L, look, t, u, to) {
  if (!look) return;
  const dot = (sx, sy, col) => {
    const [x, y] = to(sx, sy);
    X.fillStyle = col;
    X.fillRect(x, y, u, u);
  };
  if (look.adj === 'Shiny' || look.relic || look.grand === 'Sacred') {
    const ph = Math.floor((t * 22) % (L.w + L.h + 14));
    for (const [x, y] of L.marks) if (x + y === ph || x + y === ph - 1) dot(x, y, C.paper);
  }
  if (look.cond === 'Pointy' && Math.floor(t * 2.5) % 3 === 0) {
    // a glint on the point itself (a cross off to the side read as a loose extra piece)
    dot(L.tip[0], L.tip[1], C.paper);
    dot(L.tip[0] - 1, L.tip[1], C.paper);
  }
  if ((look.adj === 'Suspicious' || look.grand === 'Eldritch') && L.face && Math.floor(t * 1.3) % 5 === 0) {
    const ey = L.face.y0 + (L.face.y1 - L.face.y0 >= 2 ? 1 : 0);
    dot(L.face.x, ey, L.mid);
    dot(L.face.x + 1, ey, L.mid);
  }
  if ((look.adj === 'Gloomy' || look.adj === 'Moody') && L.face) {
    // its own little rain cloud, kept above the weapon on screen however the weapon is turned
    // (offset in screen px from the face, not along the sprite, or it ends up beside the blade)
    const [fx, fy] = to(L.face.x, L.face.y0),
      cy = fy - 7 * u + Math.round(Math.sin(t * 2)) * u,
      px = (x, y, col) => ((X.fillStyle = col), X.fillRect(fx + x * u, cy + y * u, u, u));
    for (let i = -2; i <= 2; i++) px(i, 0, C.fog);
    for (let i = -1; i <= 1; i++) px(i, -1, C.mist);
    px((Math.floor(t * 3) % 3) - 1, 1 + (Math.floor(t * 9) % 3), C.sky);
  }
  const pulse = Math.sin(t * 5);
  if (look.relic || look.what || look.standout) {
    const col = look.standout && pulse > 0.6 ? C.gold : look.what ? C[RAINBOW[(Math.floor(t * 6) + 2) % 6][1]] : L.light;
    if (pulse > -0.2 || look.standout) {
      const every = pulse > 0.6 ? 1 : 2;
      for (let i = 0; i < L.ring.length; i += every) dot(L.ring[i][0], L.ring[i][1], col);
    }
  }
  if (look.roman && L.marks.length) {
    const cx = (L.marks[0][0] + L.tip[0]) / 2,
      cy = L.tip[1];
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + (i * Math.PI * 2) / 3;
      dot(Math.round(cx + Math.cos(a) * (L.w * 0.32)), Math.round(cy + Math.sin(a) * 5), C.gold);
    }
  }
}

export const rarityColour = q => C[RARITY[Math.max(0, Math.min(10, q))].col];
export const frameOfLook = (look, t) => (look && look.what ? Math.floor(t * 6) % RAINBOW.length : 0);
export const unpackHex = unpack;
