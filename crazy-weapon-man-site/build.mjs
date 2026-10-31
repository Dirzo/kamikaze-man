// Native ES modules, copied once. Legacy is isolated at /legacy/ and never loaded by the game.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, 'game-src');
const out = path.join(root, 'public');
const check = process.argv.includes('--check');
const files = new Map();
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(f => f.isDirectory() ? walk(path.join(dir, f.name)) : [path.join(dir, f.name)]);
for (const f of walk(src)) if (f.endsWith('.js')) files.set('src/' + path.relative(src, f), fs.readFileSync(f, 'utf8'));
const version = crypto.createHash('sha256').update([...files.values()].join('')).digest('hex').slice(0, 10);
files.set('index.html', fs.readFileSync(path.join(src, 'shell/index.html'), 'utf8').replace('/next/src/main.js', '/src/main.js?v=' + version));
files.set('manifest.webmanifest', fs.readFileSync(path.join(src, 'shell/manifest.webmanifest'), 'utf8')); // add to home screen: fullscreen, landscape
files.set('next/index.html', '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/"><title>Crazy Weapon Man</title><a href="/">Play Crazy Weapon Man</a>\n');
files.set('_headers', [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: SAMEORIGIN',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
  '  Strict-Transport-Security: max-age=31536000',
  '/src/*',
  '  Cache-Control: no-cache',
  '/',
  '  Cache-Control: no-cache',
  ''
].join('\n'));
let dirty = false;
for (const [f, contents] of files) {
  const target = path.join(out, f);
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === contents) continue;
  dirty = true;
  if (check) console.error('out of date: ' + f);
  else { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, contents); }
}
// Only delete obsolete generated modules, never assets or the isolated legacy build.
for (const f of fs.existsSync(path.join(out, 'src')) ? walk(path.join(out, 'src')) : []) {
  if (!files.has(path.relative(out, f))) { dirty = true; if (!check) fs.rmSync(f); }
}
if (check && dirty) process.exit(1);
console.log(check ? 'public/ matches game-src/' : `built ${files.size} files, revision ${version}`);
