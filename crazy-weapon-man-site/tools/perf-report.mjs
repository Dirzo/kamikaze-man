// Per-world cost and pacing from a ?perf campaign (testing/perf.js):
//   PERF=1 PLAYTEST_OUT=out.json node tools/playtest.mjs 4 skilled 4 campaign && node tools/perf-report.mjs out.json
import { readFileSync } from 'node:fs';
const all = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const L = all.flatMap(c => c.levels).filter(x => x.perf && x.pace);
const med = a => { a = a.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
const p90 = a => { a = a.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length * 0.9)] : 0; };
const mx = a => a.length ? Math.max(...a) : 0;
console.log(`${L.length} level attempts with perf data`);
console.log('\nCOST  world | n | update ms p50/p99/max | draw ms p50/p95/p99/max | >16.7ms frames | peak enemies/bolts/shots/spx/parts/pickups | heap MB in->out');
for (let r = 1; r <= 10; r++) {
  const a = L.filter(x => x.region === r); if (!a.length) continue;
  const P = a.map(x => x.perf);
  console.log([r, a.length, `${med(P.map(p => p.upd[0])).toFixed(2)}/${med(P.map(p => p.upd[2])).toFixed(2)}/${mx(P.map(p => p.upd[3])).toFixed(1)}`,
    `${med(P.map(p => p.drw[0])).toFixed(2)}/${med(P.map(p => p.drw[1])).toFixed(2)}/${med(P.map(p => p.drw[2])).toFixed(2)}/${mx(P.map(p => p.drw[3])).toFixed(1)}`,
    (100 * med(P.map(p => p.slowFrames))).toFixed(1) + '%',
    ['enemies', 'bolts', 'shots', 'spx', 'parts', 'pickups'].map(k => mx(P.map(p => p.peak[k]))).join('/'),
    `${med(P.map(p => p.heapMB[0]))}->${med(P.map(p => p.heapMB[1]))} (max ${mx(P.map(p => p.heapMB[1]))})`].join(' | '));
}
console.log('\nPACE  world | n | width | s to arena (med) | px/s overall | run px/s, sprint% | stall s/level | wall s | pad s med/p90 | foes/pad | best combo med | specials/pad | pads with 0 specials');
for (let r = 1; r <= 10; r++) {
  const a = L.filter(x => x.region === r && x.pace); if (!a.length) continue;
  const pads = a.flatMap(x => x.pace.pads).filter(p => p.t != null);
  console.log([r, a.length, med(a.map(x => x.pace.width)), med(a.map(x => x.pace.toArena)), med(a.map(x => x.pace.width / x.pace.toArena)).toFixed(0),
    `${med(a.map(x => x.pace.run.v))}, ${(100 * med(a.map(x => x.pace.run.sprint))).toFixed(0)}%`,
    med(a.map(x => x.pace.stalls.reduce((s, y) => s + y.t, 0))).toFixed(0), med(a.map(x => x.pace.wallT)).toFixed(1),
    `${med(pads.map(p => p.t)).toFixed(1)}/${p90(pads.map(p => p.t)).toFixed(1)}`, med(pads.map(p => p.foes)), med(pads.map(p => p.best)),
    (pads.reduce((s, p) => s + p.specials, 0) / pads.length).toFixed(2), (100 * pads.filter(p => !p.specials).length / pads.length).toFixed(0) + '%'].join(' | '));
}
console.log('\nSTALL CAUSES (seconds of frontier stall per level, by what stands there)');
for (let r = 1; r <= 10; r++) {
  const a = L.filter(x => x.region === r && x.pace); if (!a.length) continue;
  const c = {};
  for (const x of a) for (const s of x.pace.stalls) { const k = s.at.length ? s.at.join('+') : s.foes ? 'foes on route' : 'open ground'; c[k] = (c[k] || 0) + s.t / a.length; }
  console.log(`  ${r}: ` + Object.entries(c).sort((x, y) => y[1] - x[1]).slice(0, 7).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', '));
}
console.log('\nLONGEST STALLS');
for (const s of L.flatMap(x => (x.pace.stalls || []).map(s => ({ ...s, id: x.id, won: x.won }))).sort((a, b) => b.t - a.t).slice(0, 15)) console.log(`  ${s.id} x${s.x} ${s.t}s at ${s.at.join('+') || '-'} foes ${s.foes}`);
