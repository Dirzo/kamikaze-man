// Bot playtests in headless Chrome: node tools/playtest.mjs [runs=40] [bot=skilled|casual] [workers=4] [from=0]
// Serves public/, runs game-src/testing/playtest.js in parallel tabs and prints win rates, where
// runs end and per-zone health/damage. Needs CHROME (or chromium on PATH); run `node build.mjs` first.
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [runs = 40, bot = 'skilled', workers = 4, from = 0] = process.argv.slice(2).map((v, i) => (i === 1 ? v : +v));
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 8890), CHROME = process.env.CHROME || execSync('command -v chromium || command -v google-chrome').toString().trim();
const delay = ms => new Promise(r => setTimeout(r, ms));
const server = spawn('python3', ['-m', 'http.server', String(port), '--directory', join(root, 'public')], { stdio: 'ignore' });
const procs = [server];
process.on('exit', () => procs.forEach(p => p.kill()));
await delay(800);

async function worker(w, count) {
  const debugPort = port + 1 + w, profile = mkdtempSync(join(tmpdir(), 'cwm-play-'));
  procs.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--mute-audio', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' }));
  let tabs;
  for (let i = 0; i < 100 && !tabs; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); } catch { await delay(100); } }
  const socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { socket.onopen = res; socket.onerror = rej; });
  let id = 0; const pending = new Map();
  socket.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); socket.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value;
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/?playtest=${count}&bot=${bot}&from=${from}${process.env.TRACE ? '&trace' : ''}` });
  for (;;) {
    await delay(1000);
    const done = await evaluate('document.documentElement.dataset.playtest');
    const n = await evaluate('window.CWM_PLAYTEST?.runs.length');
    process.stderr.write(`\rworker ${w}: ${n || 0}/${count}   `);
    if (done) return await evaluate('window.CWM_PLAYTEST.runs');
  }
}
const per = Math.ceil(runs / workers);
const all = (await Promise.all(Array.from({ length: workers }, (_, w) => worker(w, Math.min(per, runs - per * w))))).flat();
process.stderr.write('\n');

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0) + '%';
const wins = all.filter(r => r.won).length;
console.log(`\n${bot} bot: ${wins}/${all.length} wins (${pct(wins, all.length)}), avg warps/run ${(all.reduce((n, r) => n + r.warps, 0) / all.length).toFixed(1)}, residents written off/run ${(all.reduce((n, r) => n + (r.skips || 0), 0) / all.length).toFixed(1)}`);
const stuck = all.filter(r => r.timeout);
if (stuck.length) console.log(`bot stuck (hour limit, not counted as deaths): ${stuck.map(r => `zone ${r.zone + 1} ${r.timeout}`).join(', ')}`);
console.log('\nzone | reached | cleared | died: fight / swarm / boss | hp in | min hp | dmg% fight/swarm/boss | lv | power | time s | boss s (cleared: median, p10-p90)');
// boss fight length on visits where the boss went down (the run went on, or was won)
const bossTimes = z => all.flatMap(r => r.zones.filter((x, i) => x.zone === z && (i < r.zones.length - 1 || r.won)).map(x => x.bossT)).sort((a, b) => a - b);
const q = (a, f) => a.length ? a[Math.min(a.length - 1, Math.floor(a.length * f))].toFixed(0) : '-';
const zones = Math.max(...all.map(r => r.zones.length ? r.zones.at(-1).zone : 0)) + 1;
for (let z = from; z < zones; z++) {
  const at = all.flatMap(r => r.zones.filter(x => x.zone === z)), reached = at.length;
  if (!reached) continue;
  const dead = all.filter(r => !r.won && !r.timeout && r.zone === z), avg = f => (at.reduce((n, x) => n + f(x), 0) / reached);
  const d = k => dead.filter(r => r.diedIn === k).length;
  console.log([z + 1, reached, pct(reached - dead.length, reached), `${d('fight')} / ${d('swarm')} / ${d('boss')}`, avg(x => x.hpIn).toFixed(0), avg(x => x.minHp).toFixed(0),
    `${avg(x => x.dmg.fight).toFixed(0)}/${avg(x => x.dmg.swarm).toFixed(0)}/${avg(x => x.dmg.boss).toFixed(0)}`, avg(x => x.lv).toFixed(1), avg(x => x.power).toFixed(2), avg(x => x.time).toFixed(0), `${q(bossTimes(z), 0.5)} (${q(bossTimes(z), 0.1)}-${q(bossTimes(z), 0.9)})`].join(' | '));
}
console.log('\ntop damage sources (% of max hp per visit):');
for (let z = from; z < zones; z++) {
  const at = all.flatMap(r => r.zones.filter(x => x.zone === z)), src = {};
  for (const x of at) for (const [k, v] of Object.entries(x.src || {})) src[k] = (src[k] || 0) + v / at.length;
  if (at.length) console.log(`  ${z + 1}: ` + Object.entries(src).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(', '));
}
const killers = {};
for (const r of all) if (!r.won && r.diedIn === 'boss') killers[r.boss] = (killers[r.boss] || 0) + 1;
if (Object.keys(killers).length) console.log('\nboss deaths:', killers);
if (process.env.PLAYTEST_OUT) writeFileSync(process.env.PLAYTEST_OUT, JSON.stringify(all, null, 1));
process.exit(0);
