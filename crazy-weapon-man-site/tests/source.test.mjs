import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(path.join(p,f.name)):[path.join(p,f.name)]);
test('every module parses and every relative import resolves',()=>{
  for(const f of walk(path.join(root,'game-src')).filter(f=>f.endsWith('.js'))) {
    execFileSync(process.execPath,['--check',f]);
    for(const m of fs.readFileSync(f,'utf8').matchAll(/(?:from\s*|import\s*\()(['"])(\.[^'"]+)\1/g))
      assert.ok(fs.existsSync(path.resolve(path.dirname(f),m[2])),f+': missing '+m[2]);
  }
});
test('all art manifest assets exist, including all awakened weapons',()=>{
  const base=path.join(root,'public/assets/px'),m=JSON.parse(fs.readFileSync(path.join(base,'manifest.json')));
  for(const [group,prefix] of [['enemies','enemy-'],['bosses','boss-'],['weapons','weapon-']])
    for(const key of Object.keys(m[group]))assert.ok(fs.existsSync(path.join(base,prefix+key+'.png')));
  for(const f of Object.values(m.backgrounds))assert.ok(fs.existsSync(path.join(base,f)));
  for(const s of Object.values(m.slabs))assert.ok(fs.existsSync(path.join(base,s.file)));
  for(const type of ['sword','dagger','katana','hammer','staff','nunchucks','bow','shuriken','wand'])assert.ok(m.weapons[type+'-awakened']);
  assert.ok(fs.existsSync(path.join(root,'public/assets/hero/hero.png')));
});
