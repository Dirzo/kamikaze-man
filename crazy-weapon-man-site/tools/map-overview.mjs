// Draws every zone's whole layout to a PNG (rock, floors, ledges, ladders, residents, start and
// exit). Surfaces the hero cannot reach, or cannot get back from, are painted red.
// Usage: node tools/map-overview.mjs [outDir]
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { makeMap, LAYOUTS } from '../game-src/data/maps.js';
import { ZONES } from '../game-src/data/zones.js';
import { surfaceGraph } from '../tests/map-reach.mjs';

const out = process.argv[2] || 'map-overview';
fs.mkdirSync(out, { recursive: true });
const K = 0.25;
function png(w, h, px) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; px.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const crcT = [...Array(256)].map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = ~0; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (~c) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (let z = 0; z < ZONES.length; z++) {
  const m = makeMap(z), g = surfaceGraph(m);
  const w = Math.ceil(m.width * K), h = Math.ceil(m.height * K), px = Buffer.alloc(w * h * 3);
  const fill = (x, y, rw, rh, [r, gg, b]) => {
    for (let yy = Math.max(0, Math.floor(y * K)); yy < Math.min(h, Math.ceil((y + rh) * K)); yy++)
      for (let xx = Math.max(0, Math.floor(x * K)); xx < Math.min(w, Math.ceil((x + rw) * K)); xx++) { const o = (yy * w + xx) * 3; px[o] = r; px[o + 1] = gg; px[o + 2] = b; }
  };
  fill(0, 0, m.width, m.height, [43, 36, 66]);
  for (const s of m.solids) fill(s.x, s.y, s.w, s.h, [93, 90, 122]);
  m.platforms.forEach((p, i) => fill(p.x, p.y, p.w, 6, g.forward.has(i) && g.back.has(i) ? (p.solid ? [201, 166, 107] : [124, 194, 84]) : [240, 60, 60]));
  for (const l of m.ladders) fill(l.x - 4, l.top, 8, l.bottom - l.top, [240, 138, 44]);
  for (const s of m.spawns) fill(s.x - 6, s.y - 20, 12, 18, [240, 106, 82]);
  fill(m.startX, m.startY - 28, 16, 28, [255, 193, 90]);
  fill(m.exitX - 10, m.exitY - 40, 20, 40, [59, 184, 168]);
  const file = path.join(out, `zone${z + 1}-${LAYOUTS[z].style}.png`);
  fs.writeFileSync(file, png(w, h, px));
  const bad = m.platforms.length - [...g.forward].filter(i => g.back.has(i)).length;
  console.log(`zone ${z + 1} ${ZONES[z].name}: ${LAYOUTS[z].title}, ${m.width}x${m.height}, ${bad} stranded -> ${file}`);
}
