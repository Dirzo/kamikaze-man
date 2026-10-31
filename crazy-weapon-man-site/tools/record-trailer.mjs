// Records the in-game trailer (?trailer&record) to an MP4.
//   node tools/record-trailer.mjs [out.mp4] [--shots dir]
// Serves public/ on a local port, plays the trailer in headless Chromium in real time (the page
// records its own canvas and game audio with MediaRecorder), saves the .webm it downloads, then
// ffmpeg scales it to 1920x1080 with hard pixel edges and encodes H.264 + AAC.
// --shots dir: also saves a PNG of the page every second (for checking cuts without the video).
// Needs playwright (or playwright-core) and ffmpeg on the PATH.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const args = process.argv.slice(2);
const shotsAt = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const out = path.resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--shots') || 'crazy-weapon-man-trailer.mp4');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('playwright-core'); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, acceptDownloads: true });
page.on('pageerror', e => console.error('page error:', e.message));
page.on('console', m => m.type() === 'error' && console.error('console:', m.text()));
const download = page.waitForEvent('download', { timeout: 300000 });
await page.goto(`http://127.0.0.1:${port}/?trailer&record`);
let n = 0;
const snap = shotsAt && setInterval(() => {
  fs.mkdirSync(shotsAt, { recursive: true });
  page.screenshot({ path: path.join(shotsAt, `t${String(n++).padStart(3, '0')}.png`) }).catch(() => {});
}, 1000);
const d = await download;
if (snap) clearInterval(snap);
const webm = out.replace(/\.mp4$/, '') + '.webm';
await d.saveAs(webm);
await browser.close();
server.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-vf', 'scale=1920:1080:flags=neighbor,fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-16:TP=-1.5', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log('trailer:', out, (fs.statSync(out).size / 1e6).toFixed(1) + ' MB');
